import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { Check, Loader2, Plus, CheckCheck } from "lucide-react"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Helper to extract job ID from URL
const getJobIdentifier = (url: string): string => {
    // Seek: extract job ID from URL like /job/12345678
    const seekMatch = url.match(/\/job\/(\d+)/)
    if (seekMatch) return `seek-${seekMatch[1]}`

    // LinkedIn: extract from /jobs/view/1234567890
    const linkedinMatch = url.match(/\/jobs\/view\/(\d+)/)
    if (linkedinMatch) return `linkedin-${linkedinMatch[1]}`

    // Fallback: use full URL
    return url
}

export const SaveJobButton = () => {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already-saved">("idle")
    const [message, setMessage] = useState("")
    const [currentJobId, setCurrentJobId] = useState<string>("")

    // Check if current job is already saved
    const checkIfSaved = async (jobId: string) => {
        try {
            const savedJobs: string[] = await storage.get("saved-jobs") || []
            return savedJobs.includes(jobId)
        } catch (error) {
            console.error("Failed to check saved status:", error)
            return false
        }
    }

    // Mark job as saved
    const markAsSaved = async (jobId: string) => {
        try {
            const savedJobs: string[] = await storage.get("saved-jobs") || []
            if (!savedJobs.includes(jobId)) {
                savedJobs.push(jobId)
                await storage.set("saved-jobs", savedJobs)
                console.log(`✅ [Extension] Marked job as saved: ${jobId}`)
            }
        } catch (error) {
            console.error("Failed to mark job as saved:", error)
        }
    }

    // Monitor URL changes and reset state when job changes
    useEffect(() => {
        const checkJobChange = async () => {
            const newJobId = getJobIdentifier(window.location.href)
            if (newJobId !== currentJobId) {
                console.log(`🔄 [Extension] Job changed: ${currentJobId} → ${newJobId}`)
                setCurrentJobId(newJobId)

                // Check if this job was already saved
                const isSaved = await checkIfSaved(newJobId)
                if (isSaved) {
                    console.log(`📌 [Extension] Job ${newJobId} was already saved`)
                    setStatus("already-saved")
                } else {
                    setStatus("idle")
                }
                setMessage("")
            }
        }

        // Check immediately
        checkJobChange()

        // Monitor URL changes (for SPAs like LinkedIn and Seek)
        const observer = new MutationObserver(checkJobChange)
        observer.observe(document.body, { childList: true, subtree: true })

        // Also listen to popstate for browser back/forward
        window.addEventListener('popstate', checkJobChange)

        return () => {
            observer.disconnect()
            window.removeEventListener('popstate', checkJobChange)
        }
    }, [currentJobId])

    // Helper to auto-expand "Show more" content
    const expandContent = async (container: Element) => {
        const expandSelectors = [
            'button[aria-label*="Show more"]',
            'button[aria-label*="Read more"]',
            '.jobs-description__footer-button', // LinkedIn specific
            '[data-automation="toggle-job-details"]', // Seek specific
            'button.show-more-button', // Generic
            'a.read-more', // Generic
        ]

        for (const selector of expandSelectors) {
            const button = container.querySelector(selector) as HTMLElement
            if (button && button.offsetParent !== null) { // Check if visible
                console.log(`🔍 [Extension] Found expand button: ${selector}`)
                try {
                    button.click()
                    // Wait a bit for expansion animation/fetch
                    await new Promise(resolve => setTimeout(resolve, 500))
                    console.log(`✅ [Extension] Clicked expand button`)
                } catch (e) {
                    console.warn(`⚠️ [Extension] Failed to click expand button:`, e)
                }
            }
        }
    }

    const handleSave = async () => {
        setStatus("loading")
        try {
            // Smart HTML extraction: Get only the job detail panel, not the entire page
            let jobDetailHtml: string
            const url = window.location.href

            // Try to find the job detail container (works for both full pages and split view)
            const seekDetailSelectors = [
                '[data-automation="jobDetails"]',           // Main job details container
                '[data-automation="job-detail-container"]', // Alternative
                'article[data-automation*="job"]',          // Generic article
            ]

            const linkedinDetailSelectors = [
                '.jobs-details__main-content',              // Main content area
                '.jobs-unified-top-card',                   // Top card in split view
                '[class*="job-view-layout"]',              // Generic job view
                'div.jobs-search__job-details--container'   // Search split view
            ]

            // Determine which selectors to use based on domain
            const selectors = url.includes('seek.co.nz')
                ? seekDetailSelectors
                : url.includes('linkedin.com')
                    ? linkedinDetailSelectors
                    : []

            let detailContainer: Element | null = null
            for (const selector of selectors) {
                detailContainer = document.querySelector(selector)
                if (detailContainer) {
                    console.log(`🎯 [Extension] Found job detail container with: ${selector}`)
                    break
                }
            }

            if (detailContainer) {
                // Auto-expand content before extracting
                await expandContent(detailContainer)

                // Extract HTML from the specific container
                jobDetailHtml = (detailContainer as HTMLElement).outerHTML
                console.log(`📦 [Extension] Extracted ${jobDetailHtml.length} chars from container`)
            } else {
                // Fallback: Use entire page (for unknown layouts)
                console.warn('⚠️ [Extension] Job detail container not found, using full page HTML')
                // Try to expand globally if container not found
                await expandContent(document.body)
                jobDetailHtml = document.documentElement.outerHTML
            }

            const response = await sendToBackground({
                name: "save-job",
                body: {
                    content: jobDetailHtml,
                    url
                }
            })

            console.log("Background response:", response)

            if (response.success) {
                setStatus("success")
                // Mark job as saved in storage
                await markAsSaved(currentJobId)

                // Auto-reset after 2 seconds to "already-saved" state
                setTimeout(() => {
                    setStatus("already-saved")
                }, 2000)
            } else {
                setStatus("error")
                setMessage(response.error || "Failed")
                // Auto-reset error after 3 seconds
                setTimeout(() => {
                    const checkPreviouslySaved = async () => {
                        const isSaved = await checkIfSaved(currentJobId)
                        setStatus(isSaved ? "already-saved" : "idle")
                        setMessage("")
                    }
                    checkPreviouslySaved()
                }, 3000)
            }
        } catch (error) {
            console.error("Failed to save job:", error)
            setStatus("error")
            setMessage((error as Error).message)
            // Auto-reset error after 3 seconds
            setTimeout(() => {
                const checkPreviouslySaved = async () => {
                    const isSaved = await checkIfSaved(currentJobId)
                    setStatus(isSaved ? "already-saved" : "idle")
                    setMessage("")
                }
                checkPreviouslySaved()
            }, 3000)
        }
    }

    return (
        <button
            onClick={handleSave}
            disabled={status === "loading" || status === "success" || status === "already-saved"}
            className={`
        plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-2 plasmo-rounded-full plasmo-font-medium plasmo-transition-all plasmo-shadow-sm
        ${status === "idle" ? "plasmo-bg-blue-600 plasmo-text-white hover:plasmo-bg-blue-700" : ""}
        ${status === "loading" ? "plasmo-bg-blue-100 plasmo-text-blue-700" : ""}
        ${status === "success" ? "plasmo-bg-green-600 plasmo-text-white" : ""}
        ${status === "already-saved" ? "plasmo-bg-gray-500 plasmo-text-white hover:plasmo-bg-gray-600 plasmo-opacity-75" : ""}
        ${status === "error" ? "plasmo-bg-red-600 plasmo-text-white" : ""}
      `}
        >
            {status === "idle" && (
                <>
                    <Plus className="plasmo-w-4 plasmo-h-4" />
                    <span>Save to CareerMatch</span>
                </>
            )}
            {status === "loading" && (
                <>
                    <Loader2 className="plasmo-w-4 plasmo-h-4 plasmo-animate-spin" />
                    <span>Saving...</span>
                </>
            )}
            {status === "success" && (
                <>
                    <Check className="plasmo-w-4 plasmo-h-4" />
                    <span>Saved!</span>
                </>
            )}
            {status === "already-saved" && (
                <>
                    <CheckCheck className="plasmo-w-4 plasmo-h-4" />
                    <span>Already Saved</span>
                </>
            )}
            {status === "error" && (
                <span>Error: {message}</span>
            )}
        </button>
    )
}
