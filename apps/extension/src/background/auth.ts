import { API_BASE_URL } from "../config"

export const checkAuth = async (): Promise<boolean> => {
    try {
        const cookie = await chrome.cookies.get({
            url: API_BASE_URL,
            name: "sb-access-token"
        })
        return !!cookie
    } catch (error) {
        console.error("Auth check failed:", error)
        return false
    }
}

export const getAuthToken = async (): Promise<string | null> => {
    try {
        const cookie = await chrome.cookies.get({
            url: API_BASE_URL,
            name: "sb-access-token"
        })

        if (!cookie) return null

        // If the cookie is raw string, return it
        // If it's base64/JSON (Supabase SSR), we might need to parse it
        // For now, assuming standard cookie value is sufficient for the API
        // The API middleware should handle decoding if needed

        let token = cookie.value

        // Basic cleanup if needed (e.g. remove "base64-" prefix if we were doing client-side parsing)
        // But usually we pass the cookie as-is in the header or let the browser attach it

        return token
    } catch (error) {
        console.error("Error getting auth token:", error)
        return null
    }
}
