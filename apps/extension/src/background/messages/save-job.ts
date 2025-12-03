import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getAuthToken } from "../auth"
import { API_ENDPOINTS } from "../../config"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { content, url } = req.body

    try {
        const token = await getAuthToken()

        if (!token) {
            res.send({ success: false, error: "Not authenticated. Please login to CareerMatch." })
            return
        }

        console.log("🔵 [Background] Save job message received", { url })

        const response = await fetch(API_ENDPOINTS.IMPORT_JOB, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `sb-access-token=${token}` // Pass the token if needed, or rely on browser cookies if same-site
            },
            body: JSON.stringify({
                html: content,
                url: url
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
