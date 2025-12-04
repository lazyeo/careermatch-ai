import { API_BASE_URL } from "../config"

export const checkAuth = async (): Promise<boolean> => {
    const token = await getAuthToken()
    return !!token
}

export const getAuthToken = async (): Promise<string | null> => {
    try {
        // We need to check cookies on both the API domain and potentially the www subdomain
        // because the user might be logged in on www.cvto.work but API is cvto.work (or vice versa)

        // Strategy: Try both URL-based and Domain-based fetching to be exhaustive
        const domainsToCheck = [
            API_BASE_URL,
            API_BASE_URL.replace('://', '://www.'),
            API_BASE_URL.replace('://www.', '://')
        ]

        // Add 127.0.0.1 if localhost
        if (API_BASE_URL.includes("localhost")) {
            domainsToCheck.push(API_BASE_URL.replace("localhost", "127.0.0.1"))
        }

        const uniqueUrls = domainsToCheck.filter((v, i, a) => a.indexOf(v) === i)
        let allCookies: chrome.cookies.Cookie[] = []

        // 1. Fetch by URL
        for (const url of uniqueUrls) {
            try {
                const cookies = await chrome.cookies.getAll({ url })
                allCookies = [...allCookies, ...cookies]
            } catch (e) { }
        }

        // 2. Fetch by Domain (if not localhost)
        try {
            const urlObj = new URL(API_BASE_URL)
            const hostname = urlObj.hostname
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                // Remove 'www.' if present to get root domain
                const rootDomain = hostname.replace(/^www\./, '')
                const domainCookies = await chrome.cookies.getAll({ domain: rootDomain })
                allCookies = [...allCookies, ...domainCookies]
            }
        } catch (e) {
            console.error("[Auth] Domain fetch failed:", e)
        }

        // Deduplicate cookies by name + domain + path
        const uniqueCookiesMap = new Map<string, chrome.cookies.Cookie>()
        allCookies.forEach(c => {
            const key = `${c.name}|${c.domain}|${c.path}`
            uniqueCookiesMap.set(key, c)
        })
        allCookies = Array.from(uniqueCookiesMap.values())

        console.log("[Auth] Found cookies:", allCookies.map(c => c.name))

        // 1. Try standard cookie first (sb-access-token)
        const standardCookie = allCookies.find(c => c.name === "sb-access-token")
        if (standardCookie) return standardCookie.value

        // 2. Try Supabase SSR cookies (sb-<ref>-auth-token)
        const authCookies = allCookies.filter(c =>
            c.name.startsWith("sb-") && c.name.includes("-auth-token")
        )

        if (authCookies.length === 0) return null

        // Group by base name to handle chunks correctly
        // e.g. sb-xxx-auth-token.0 and sb-xxx-auth-token.1 belong together
        // but sb-yyy-auth-token should be separate
        const cookieGroups = new Map<string, chrome.cookies.Cookie[]>()

        authCookies.forEach(c => {
            // Remove .0, .1 suffix to get base name
            const baseName = c.name.replace(/\.\d+$/, "")
            if (!cookieGroups.has(baseName)) {
                cookieGroups.set(baseName, [])
            }
            cookieGroups.get(baseName)?.push(c)
        })

        // Helper to try parsing JSON and getting access_token
        const tryParse = (str: string): string | null => {
            try {
                const session = JSON.parse(str)
                // Handle array format: ["base64-...", ...] or ["token"]
                if (Array.isArray(session) && session.length > 0 && typeof session[0] === 'string') {
                    return session[0]
                }
                return session.access_token || session.session?.access_token || null
            } catch (e) {
                return null
            }
        }

        // Recursive processor
        const processTokenString = (str: string, depth = 0): string | null => {
            if (depth > 3) return null
            const parsed = tryParse(str)
            if (parsed) {
                if (parsed.split('.').length === 3) return parsed
                if (parsed !== str) return processTokenString(parsed, depth + 1)
            }
            if (str.startsWith("base64-")) {
                try {
                    const decoded = atob(str.replace("base64-", ""))
                    const result = processTokenString(decoded, depth + 1)
                    if (result) return result
                } catch (e) { }
            }
            try {
                const decodedUri = decodeURIComponent(str)
                if (decodedUri !== str) {
                    const result = processTokenString(decodedUri, depth + 1)
                    if (result) return result
                }
            } catch (e) { }
            if (str.split('.').length === 3) return str
            return null
        }

        // Try each group
        for (const [baseName, groupCookies] of cookieGroups) {
            // Deduplicate cookies in the group (by name)
            const uniqueGroupCookies = Array.from(new Map(groupCookies.map(c => [c.name, c])).values())

            // Sort by chunk index
            uniqueGroupCookies.sort((a, b) => {
                // Extract number suffix
                const getIndex = (name: string) => {
                    const match = name.match(/\.(\d+)$/)
                    return match ? parseInt(match[1]) : -1
                }
                return getIndex(a.name) - getIndex(b.name)
            })

            const tokenString = uniqueGroupCookies.map(c => c.value).join("")
            console.log(`[Auth] Processing group ${baseName} with combined length ${tokenString.length}`)

            const token = processTokenString(tokenString)
            if (token) {
                console.log(`[Auth] Successfully parsed token from group ${baseName}`)
                return token
            }
        }

        return null
    } catch (error) {
        console.error("Error getting auth token:", error)
        return null
    }
}

export const getAuthDebugInfo = async () => {
    const domainsToCheck = [
        API_BASE_URL,
        API_BASE_URL.replace('://', '://www.'),
        API_BASE_URL.replace('://www.', '://')
    ]
    if (API_BASE_URL.includes("localhost")) {
        domainsToCheck.push(API_BASE_URL.replace("localhost", "127.0.0.1"))
    }
    const uniqueUrls = domainsToCheck.filter((v, i, a) => a.indexOf(v) === i)

    let allCookies: chrome.cookies.Cookie[] = []

    // URL fetch
    for (const url of uniqueUrls) {
        try {
            const cookies = await chrome.cookies.getAll({ url })
            allCookies = [...allCookies, ...cookies]
        } catch (e) { }
    }

    // Domain fetch
    let domainChecked = ""
    try {
        const urlObj = new URL(API_BASE_URL)
        const hostname = urlObj.hostname
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            const rootDomain = hostname.replace(/^www\./, '')
            domainChecked = rootDomain
            const domainCookies = await chrome.cookies.getAll({ domain: rootDomain })
            allCookies = [...allCookies, ...domainCookies]
        }
    } catch (e) { }

    // Deduplicate
    const uniqueCookiesMap = new Map<string, chrome.cookies.Cookie>()
    allCookies.forEach(c => {
        uniqueCookiesMap.set(`${c.name}|${c.domain}`, c)
    })
    const uniqueCookies = Array.from(uniqueCookiesMap.values())

    return {
        domains: uniqueUrls,
        domainChecked,
        cookieCount: uniqueCookies.length,
        cookieNames: uniqueCookies.map(c => `${c.name} (${c.domain})`)
    }
}
