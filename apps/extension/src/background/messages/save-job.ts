import type { PlasmoMessaging } from "@plasmohq/messaging"

import { API_ENDPOINTS } from "../../config"
import { getAuthDebugInfo, getAuthToken } from "../auth"

const IMPORT_TIMEOUT_MS = 110000

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { content, url } = req.body
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), IMPORT_TIMEOUT_MS)

  try {
    const token = await getAuthToken()

    if (!token) {
      const debug = await getAuthDebugInfo()
      res.send({
        success: false,
        error: `Not authenticated. [Debug: Checked ${debug.domains.join(", ")}. Found ${debug.cookieCount} cookies: ${debug.cookieNames.join(", ")}]`
      })
      return
    }

    console.log("🔵 [Background] Save job message received", { url })

    const response = await fetch(API_ENDPOINTS.IMPORT_JOB, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        url: url,
        content: content,
        save_immediately: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `[Extension] Save Job Failed: ${response.status} ${response.statusText} `,
        errorText
      )
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
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "Saving took too long. Check CareerMatch in a minute, then try again if the job did not appear."
        : (error as Error).message
    res.send({
      success: false,
      error: message
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export default handler
