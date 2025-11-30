import { parseJobFromUrl } from '@careermatch/job-scraper'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function testScraper() {
    const scraperUrl = process.env.SCRAPER_API_URL

    console.log('🧪 Testing Scraper Integration')
    console.log('--------------------------------')
    console.log(`📍 Scraper Worker URL: ${scraperUrl || 'Not configured (will use local fetch)'}`)

    // A test URL (using a stable page that is unlikely to change or block easily for this test)
    // Using a simple tech blog or similar as a proxy for a job post to verify connectivity
    const testUrl = 'https://example.com'

    try {
        console.log(`\n🌐 Requesting: ${testUrl}`)
        const start = Date.now()

        // We expect this to fail parsing as a job (since it's example.com), 
        // but we want to verify the *delegation* to the worker works (i.e., it returns content).
        // The worker returns JSON with content, and the package tries to parse it.
        // If the worker works, we should see logs from the package about delegation.

        const result = await parseJobFromUrl(testUrl, {
            scraperUrl: scraperUrl
        })

        console.log('\n✅ Result received:')
        console.log(JSON.stringify(result, null, 2))
        console.log(`\n⏱️ Time taken: ${Date.now() - start}ms`)

    } catch (error) {
        console.error('\n❌ Test failed:')
        console.error(error)
    }
}

testScraper()
