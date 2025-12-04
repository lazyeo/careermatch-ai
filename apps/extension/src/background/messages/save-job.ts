import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getAuthToken, getAuthDebugInfo } from "../auth"
import { API_ENDPOINTS } from "../../config"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { content, url } = req.body

    try {
        const token = await getAuthToken()

        if (!token) {
            const debug = await getAuthDebugInfo()
            res.send({
                success: false,
                error: `Not authenticated. [Debug: Checked ${debug.domains.join(', ')}. Found ${debug.cookieCount} cookies: ${debug.cookieNames.join(', ')}]`
            })
            return
        }

        console.log("🔵 [Background] Save job message received", { url })

        const response = await fetch(`${API_ENDPOINTS.IMPORT_JOB} `, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token} `
            },
            body: JSON.stringify({
                url: url,
                content: content,
                save_immediately: true
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[Extension] Save Job Failed: ${response.status} ${response.statusText} `, errorText)
            throw new Error(`Failed to save job: ${response.status} ${errorText} `)
        }

        const data = await response.json()
        console.log("🟢 [Background] API Response:", JSON.stringify(data, null, 2))

        // Check if the individual item succeeded
        const itemResult = data.results?.[0]
        const isSuccess = data.success && itemResult?.success

        res.send({
            success: isSuccess,
            error: data.error || itemResult?.error,
            job_id: itemResult?.job_id,
            parsed_data: itemResult?.parsed_data
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
