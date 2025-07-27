import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'

export interface ScrapedContent {
  title: string
  text: string
  metaDescription?: string
  headings: string[]
}

export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  try {
    // まずはfetchでの静的スクレイピングを試行
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // JavaScriptが必要そうな場合はPuppeteerにフォールバック
    const bodyText = $('body').text().trim()
    if (bodyText.length < 100) {
      return await scrapeWithPuppeteer(url)
    }
    
    return extractContent($)
  } catch (error) {
    console.error('Static scraping failed, trying Puppeteer:', error)
    return await scrapeWithPuppeteer(url)
  }
}

async function scrapeWithPuppeteer(url: string): Promise<ScrapedContent> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    // タイムアウトを設定
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })
    
    // ページが完全に読み込まれるまで少し待機
    await page.waitForTimeout(2000)
    
    const html = await page.content()
    const $ = cheerio.load(html)
    
    return extractContent($)
  } finally {
    await browser.close()
  }
}

function extractContent($: cheerio.CheerioAPI): ScrapedContent {
  // タイトルを取得
  const title = $('title').text().trim() || $('h1').first().text().trim() || ''
  
  // メタディスクリプションを取得
  const metaDescription = $('meta[name="description"]').attr('content') || ''
  
  // 見出しを取得
  const headings: string[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const heading = $(el).text().trim()
    if (heading && heading.length > 0) {
      headings.push(heading)
    }
  })
  
  // 不要な要素を削除
  $('script, style, nav, header, footer, aside, .cookie-banner, .popup, .modal').remove()
  
  // 企業情報に関連しそうなセクションを優先的に取得
  const importantSelectors = [
    'main',
    '.about',
    '.company',
    '.profile',
    '.overview',
    '#about',
    '#company',
    '#profile',
    '#overview',
    '[class*="about"]',
    '[class*="company"]',
    '[class*="profile"]'
  ]
  
  let text = ''
  for (const selector of importantSelectors) {
    const content = $(selector).text().trim()
    if (content && content.length > text.length) {
      text = content
    }
  }
  
  // 重要なセクションが見つからない場合はbody全体から取得
  if (!text || text.length < 200) {
    text = $('body').text().trim()
  }
  
  // テキストをクリーンアップ
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
  
  return {
    title,
    text: text.substring(0, 10000), // 最大10,000文字に制限
    metaDescription,
    headings: headings.slice(0, 20) // 最大20個の見出し
  }
}