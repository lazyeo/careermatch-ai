import { config } from 'dotenv'
import { resolve } from 'path'
import { createAIClient, getAIProviders, DEFAULT_MODEL } from '../apps/web/src/lib/ai-providers'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../apps/web/.env.local') })

async function main() {
    console.log('Testing AI Providers Configuration...')
    const providers = getAIProviders()
    const geminiProvider = providers.gemini

    if (!geminiProvider.isConfigured) {
        console.error('❌ Gemini provider is not configured. Missing GEMINI_API_KEY.')
        return
    }

    console.log('✅ Gemini config loaded.')
    console.log(`- Base URL: ${geminiProvider.baseURL}`)
    console.log(`- Model: ${geminiProvider.models.best}`)
    console.log(`- API Key exists: ${!!geminiProvider.apiKey}`)

    try {
        console.log(`\nAttempting to connect and generate text using model: ${geminiProvider.models.best}...`)
        const client = createAIClient('gemini')

        // Testing the models endpoint to list available models
        try {
            console.log('Fetching available models...')
            const modelsList = await client.models.list()
            const modelIds = modelsList.data.map(m => m.id)
            console.log(`Models returned: ${modelIds.length}`)

            const exactMatch = modelIds.find(id => id === geminiProvider.models.best)
            const matchingModels = modelIds.filter(id => id.includes('gemini') || id.includes('flash'))

            if (exactMatch) {
                console.log(`✅ Model '${geminiProvider.models.best}' was found in the available models list!`)
            } else {
                console.log(`⚠️ Warning: Exact model '${geminiProvider.models.best}' not found.`)
                console.log('Available similar models:', matchingModels.length > 0 ? matchingModels : modelIds)
            }
        } catch (e) {
            console.error('Failed to list models:', e instanceof Error ? e.message : String(e))
        }

        // Testing a completion
        console.log('\nRunning test completion...')
        const response = await client.chat.completions.create({
            model: geminiProvider.models.best,
            messages: [{ role: 'user', content: 'Say "hello world" if you receive this message.' }],
            max_tokens: 50
        })

        console.log('✅ Success! Output:')
        console.log(response.choices[0]?.message?.content)

    } catch (error) {
        console.error('❌ Failed to use Gemini provider:')
        console.error(error)
    }
}

main().catch(console.error)
