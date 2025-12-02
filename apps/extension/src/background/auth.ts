import browser from "webextension-polyfill"

export const getAuthToken = async () => {
    try {
        // 1. Try to get the standard cookie first (if not using chunks)
        const cookie = await browser.cookies.get({
            url: "http://localhost:3000",
            name: "sb-access-token"
        })

        if (cookie) {
            return cookie.value
        }

        // 2. Handle Supabase Chunked Cookies (sb-<project-ref>-auth-token.0, .1, etc.)
        const allCookies = await browser.cookies.getAll({
            url: "http://localhost:3000"
        })

        // Find cookies that look like Supabase auth tokens
        const authCookies = allCookies.filter(c =>
            c.name.startsWith("sb-") && c.name.includes("-auth-token")
        )

        if (authCookies.length === 0) {
            console.warn("No Supabase auth cookies found")
            return null
        }

        // Sort by name to ensure correct order (.0, .1, .2)
        authCookies.sort((a, b) => a.name.localeCompare(b.name))

        // Concatenate values
        let tokenString = authCookies.map(c => c.value).join("")

        // Handle base64 prefix if present (Supabase SSR often adds 'base64-')
        if (tokenString.startsWith("base64-")) {
            tokenString = atob(tokenString.replace("base64-", ""))
        }

        try {
            const sessionData = JSON.parse(tokenString)

            // The session data should contain access_token
            // It might be the session object directly, or an array, or { session: ... }
            if (sessionData.access_token) {
                return sessionData.access_token
            }

            if (sessionData.session?.access_token) {
                return sessionData.session.access_token
            }

            // If it's an array (sometimes used for multiple sessions?)
            if (Array.isArray(sessionData) && sessionData[0]?.access_token) {
                return sessionData[0].access_token
            }

            console.log("Parsed session data keys:", Object.keys(sessionData))
            return null

        } catch (e) {
            console.error("Failed to parse auth cookie string:", e)
            return null
        }

    } catch (error) {
        console.error("Error getting auth token:", error)
        return null
    }
}
