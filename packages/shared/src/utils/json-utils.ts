/**
 * Utilities to robustly extract and parse JSON from AI responses.
 */

/**
 * Remove markdown code fences and extract the most likely JSON substring.
 */
export function cleanJsonResponse(response: string): string {
    let cleaned = (response || '').trim()

    // Remove BOM and odd separators
    cleaned = cleaned.replace(/^\ufeff/, '').replace(/[\u2028\u2029]/g, '')

    // Strip markdown code fences if present
    if (cleaned.includes('```')) {
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
        if (codeBlockMatch && codeBlockMatch[1]) {
            cleaned = codeBlockMatch[1].trim()
        } else {
            cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
        }
    }

    // If text contains braces, take the outermost slice to reduce noise
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }

    return cleaned.trim()
}

/**
 * Try to fix common JSON issues returned by LLMs: comments, trailing commas, code fences.
 */
export function tryFixJson(text: string): string {
    let json = (text || '').trim()

    // Remove code fences
    json = json.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '')

    // Extract first JSON-like block
    const match = json.match(/\{[\s\S]*\}/)
    if (match) json = match[0]

    // Remove // comments
    json = json.replace(/\/\/[^\n]*/g, '')

    // Remove trailing commas before ] or }
    json = json.replace(/,\s*([\]}])/g, '$1')

    return json.trim()
}

/**
 * Parse JSON from an AI response with multiple fallbacks.
 * Throws with context on failure.
 */
export function parseJsonFromAI<T = unknown>(response: string): T {
    const original = response ?? ''

    // 1) Direct parse
    try {
        return JSON.parse(original) as T
    } catch { }

    // 2) Clean code fences / slice JSON region
    const cleaned = cleanJsonResponse(original)
    try {
        return JSON.parse(cleaned) as T
    } catch { }

    // 3) Heuristic fixes
    const fixed = tryFixJson(original)
    try {
        return JSON.parse(fixed) as T
    } catch (err) {
        const preview = original.slice(0, 500)
        throw new Error(
            `Failed to parse AI JSON after cleanup. Preview: ${preview}\nError: ${(err as Error).message}`
        )
    }
}
