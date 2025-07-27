import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'

export interface ScrapedContent {
  title: string
  text: string
  metaDescription?: string
  headings: string[]
}

export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  console.log(`Scraping URL: ${url}`)
  
  try {
    // URL検証
    const urlObj = new URL(url)
    console.log(`Valid URL detected: ${urlObj.href}`)
    
    // まずはfetchでの静的スクレイピングを試行
    console.log('Attempting static scraping with fetch...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒タイムアウト
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log(`Fetch response status: ${response.status}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    console.log(`HTML content length: ${html.length}`)
    
    const $ = cheerio.load(html)
    
    // JavaScriptが必要そうな場合はPuppeteerにフォールバック
    const bodyText = $('body').text().trim()
    console.log(`Body text length: ${bodyText.length}`)
    
    if (bodyText.length < 100) {
      console.log('Content too short, falling back to Puppeteer')
      return await scrapeWithPuppeteer(url)
    }
    
    console.log('Static scraping successful')
    return extractContent($)
  } catch (error) {
    console.error('Static scraping failed:', error)
    console.log('Trying Puppeteer fallback...')
    
    try {
      return await scrapeWithPuppeteer(url)
    } catch (puppeteerError) {
      console.error('Puppeteer scraping also failed:', puppeteerError)
      throw new Error(`Both scraping methods failed. Static: ${error}. Puppeteer: ${puppeteerError}`)
    }
  }
}

async function scrapeWithPuppeteer(url: string): Promise<ScrapedContent> {
  console.log('Starting Puppeteer scraping...')
  
  let browser
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    console.log('Puppeteer browser launched')
    
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    console.log(`Navigating to URL: ${url}`)
    // タイムアウトを設定
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })
    
    console.log('Page loaded, waiting for content...')
    // ページが完全に読み込まれるまで少し待機
    await page.waitForTimeout(2000)
    
    const html = await page.content()
    console.log(`Puppeteer HTML content length: ${html.length}`)
    
    const $ = cheerio.load(html)
    
    console.log('Puppeteer scraping successful')
    return extractContent($)
  } catch (error) {
    console.error('Puppeteer scraping error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
      console.log('Puppeteer browser closed')
    }
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