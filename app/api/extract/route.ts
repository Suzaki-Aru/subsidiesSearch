import { NextRequest, NextResponse } from 'next/server'
import { openai, model } from '../../../src/lib/openai/client'
import { CompanyInfo } from '../../../src/types/company'
import { scrapeWebsite } from '../../../src/lib/scraper'

export async function POST(req: NextRequest) {
  try {
    const { url, plainText } = await req.json()
    
    // テスト用: OpenAI APIキーがない場合はモックレスポンスを返す
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('Using mock response (no valid API key)')
      const mockResponse = {
        corporateName: "株式会社サンプル",
        foundingYear: "2010年",
        industry: "IT・ソフトウェア開発",
        description: "Webアプリケーション開発とシステムコンサルティングを主力事業とする。特にNext.jsを使用したモダンなWebアプリケーション開発に強みを持つ。",
        employeeScale: "50-99" as const,
        headOffice: "東京都渋谷区",
        offices: [
          { id: 1, address: "東京都渋谷区渋谷1-1-1" },
          { id: 2, address: "大阪府大阪市北区梅田2-2-2" }
        ],
        revenue: "5億円",
        capital: "1000万円",
        contactMail: "info@sample.com",
        challenges: "AI技術を活用したサービス開発と海外展開",
        notes: "ISO27001認証取得済み、東京都ベンチャー企業認定",
        rawOutput: "Mock response for development"
      }
      
      const response = NextResponse.json(mockResponse)
      response.headers.set('X-Extraction-Time', new Date().toISOString())
      response.headers.set('X-Mock-Response', 'true')
      return response
    }
    
    let contentToProcess = plainText
    
    // URLが提供された場合はWebスクレイピングを実行
    if (url && !plainText) {
      console.log('Scraping URL:', url)
      const scrapedContent = await scrapeWebsite(url)
      
      // スクレイピングした内容をAI用に整形
      contentToProcess = `
企業サイト情報:
タイトル: ${scrapedContent.title}
メタディスクリプション: ${scrapedContent.metaDescription || ''}

見出し:
${scrapedContent.headings.join('\n')}

本文:
${scrapedContent.text}
      `.trim()
    }
    
    if (!contentToProcess) {
      return NextResponse.json(
        { error: 'URLまたはテキストコンテンツが必要です' },
        { status: 400 }
      )
    }

    const sysPrompt = `
    # プロンプト名  
    企業情報精密リサーチ & JSON変換アシスタント

    # 目的  
    企業の公式情報を多角的に分析し、完全で正確なJSONデータを生成する。

    # 分析アプローチ
    1. 会社概要・沿革・IRページを優先的に参照
    2. 複数のページから情報をクロス検証
    3. 最新の決算情報・ニュースリリースを確認
    4. 代表者メッセージ・事業紹介から企業の特徴を把握
    5. 採用情報から従業員規模・企業文化を分析

    # 情報収集の優先順位
    1. 公式サイトの「会社概要」「企業情報」
    2. IR情報・決算短信・有価証券報告書
    3. プレスリリース・ニュース
    4. 事業紹介・製品サービス紹介
    5. 採用情報・企業文化情報

    # ハルシネーション防止ルール
    1. 明確な記載がない項目は絶対に推測しない
    2. 曖昧な表現（「約」「およそ」など）がある場合のみ、その旨を記載
    3. 古い情報と新しい情報が混在する場合は最新を優先
    4. 情報源が不明確な項目は空文字列にする
    5. 数値は原文通りに記載（変換・計算しない）

    # 必須確認項目チェックリスト
    □ 正式社名（括弧内の英語名含む）
    □ 設立年月日または設立年
    □ 本社所在地（都道府県・市区必須）
    □ 代表者名・役職
    □ 資本金（最新決算期）
    □ 従業員数（単体・連結を区別）
    □ 主要事業内容（具体的サービス・製品名）
    □ 売上高（最新期実績）
    □ 支店・営業所一覧
    □ 問い合わせ先メールアドレス
    □ 現在の重点事業・将来戦略

    # 出力JSONスキーマ（厳密に従うこと）
    {
      "corporateName": "正式社名（括弧内英語名があれば含む）",
      "foundingYear": "設立年（YYYY年形式、不明な場合は空文字列）",
      "industry": "主要業種名（具体的に）",
      "description": "事業内容（具体的な製品・サービス名と特徴を含む、3行以内）",
      "employeeScale": "従業員数に応じて: 1-9 | 10-49 | 50-99 | 100-299 | 300+",
      "headOffice": "本社所在地（都道府県+市区町村まで必須）",
      "offices": [{"id": 1, "address": "支社・営業所の完全住所"}],
      "revenue": "売上高（最新期、◯億円・◯万円形式、不明時は空文字列）",
      "capital": "資本金（◯万円・◯億円形式、不明時は空文字列）",
      "contactMail": "公式問い合わせメールアドレス",
      "challenges": "現在注力している事業分野・課題・将来戦略",
      "notes": "上記以外の重要情報（受賞歴・認証・特許・主要取引先など）"
    }

    # 重要な注意点
    - 情報が見つからない項目は空文字列""にする（nullや"不明"は使用禁止）
    - 推測・憶測は絶対に行わない
    - レスポンスは上記JSONオブジェクトのみを出力（説明文等一切不要）
    `

    const { choices } = await openai.chat.completions.create({
      model,
      stream: false,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: contentToProcess }
      ]
    })

    const content = choices[0].message.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // OpenAIのレスポンスからJSONを抽出
    let jsonString = content.trim()
    
    // ```json```形式の場合は中身を抽出
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    let json: CompanyInfo
    try {
      json = JSON.parse(jsonString) as CompanyInfo
      // LLMの原文出力を保存
      json.rawOutput = content
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Original content:', content)
      
      // パースエラーの場合はデフォルト値を返す
      json = {
        corporateName: "情報抽出エラー",
        headOffice: "",
        description: "OpenAI APIからの情報抽出中にエラーが発生しました",
        notes: `エラー詳細: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        rawOutput: content
      }
    }
    
    // レスポンスヘッダーにタイムスタンプを追加
    const response = NextResponse.json(json)
    response.headers.set('X-Extraction-Time', new Date().toISOString())
    
    return response
  } catch (error) {
    console.error('Error in extract API:', error)
    return NextResponse.json(
      { error: 'Failed to extract company information' },
      { status: 500 }
    )
  }
}