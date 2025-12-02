import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getAuthToken } from "../auth"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    console.log("🔵 [Background] Save job message received")
    console.log("🔵 [Background] Request body:", JSON.stringify(req.body, null, 2))

    try {
        const { content, url } = req.body
        console.log(`🔵 [Background] Content length: ${content?.length || 0}, URL: ${url}`)

        const token = await getAuthToken()
        console.log(`🔵 [Background] Auth token retrieved: ${token ? 'YES (length: ' + token.length + ')' : 'NO'}`)

        // For MVP, we default to localhost
        const API_URL = "http://localhost:3000/api/jobs/import"

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
                url,
                content: content, // Send as 'content' to match API expectation
                source: "extension",
                save_immediately: true
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API returned ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        console.log("🟢 [Background] API Response:", JSON.stringify(data, null, 2))

        res.send({
            success: data.success,
            error: data.error,
            job_id: data.results?.[0]?.job_id // Pass back job_id for debugging
        })
    } catch (error) {
        console.error("Save job failed:", error)
        res.send({
            success: false,
            error: (error as Error).message
        })
    }
}

export default handler
