import puppeteer from '@cloudflare/puppeteer'
import { parseJobContent } from '@careermatch/job-scraper'

export interface Env {
    MYBROWSER: any
    OPENAI_API_KEY?: string
    OPENAI_BASE_URL?: string
    OPENAI_MODEL?: string
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url)
        const targetUrl = url.searchParams.get('url')
        const language = url.searchParams.get('language') || 'zh'

        if (!targetUrl) {
            return new Response('Missing url parameter', { status: 400 })
        }

        try {
            const browser = await puppeteer.launch(env.MYBROWSER)
            const page = await browser.newPage()

            // Set a realistic user agent
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

            await page.goto(targetUrl, { waitUntil: 'networkidle0' })

            // Get the full HTML content
            const content = await page.content()

            await browser.close()

            // Use the shared package to parse the content
            const parsedData = await parseJobContent(content, {
                apiKey: env.OPENAI_API_KEY,
                baseUrl: env.OPENAI_BASE_URL,
                model: env.OPENAI_MODEL,
                language: language
            })

            return new Response(JSON.stringify(parsedData), {
                headers: { 'content-type': 'application/json' }
            })

        } catch (error) {
            return new Response(`Scraping failed: ${(error as Error).message}`, { status: 500 })
        }
    }
}
