import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
        return new NextResponse('Missing id parameter', { status: 400 })
    }

    try {
        // Try to find a matching fixture in the fixtures directory
        // We look for both .html and .json files
        const fixturesDir = path.join(process.cwd(), 'e2e/fixtures/jobs')

        // Check for HTML fixture first (simulating a raw page for scraping)
        const htmlPath = path.join(fixturesDir, `${id}.html`)
        if (fs.existsSync(htmlPath)) {
            const content = fs.readFileSync(htmlPath, 'utf-8')
            return new NextResponse(content, {
                headers: { 'Content-Type': 'text/html' }
            })
        }

        // Check for JSON fixture (simulating an API response)
        const jsonPath = path.join(fixturesDir, `${id}.json`)
        if (fs.existsSync(jsonPath)) {
            const content = fs.readFileSync(jsonPath, 'utf-8')
            return new NextResponse(content, {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        return new NextResponse('Fixture not found', { status: 404 })
    } catch (error) {
        console.error('Error serving mock fixture:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
