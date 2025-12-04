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

            // Debug: Log what we see immediately
            const container = getScopedContainer()
            const detectedUrl = getJobUrl(container)
            console.log(`👀 [Extension] Auto-Detect:`)
            console.log(`   - Container: ${container ? `${container.tagName.toLowerCase()}.${Array.from(container.classList).join('.')}` : '❌ Not Found (will use body)'}`)
            console.log(`   - Target URL: ${detectedUrl}`)

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

    // Helper to find the best job container
    const getScopedContainer = (): Element | null => {
        const url = window.location.href

        // Seek
        if (url.includes('seek')) {
            return document.querySelector('[data-automation="jobDetails"]') ||
                document.querySelector('[data-automation="job-detail-root"]') ||
                document.querySelector('[data-automation="jobAdDetails"]') ||
                document.querySelector('main') || // Seek usually puts detail in main
                document.querySelector('article')
        }

        // LinkedIn
        if (url.includes('linkedin')) {
            return document.querySelector('.jobs-details__main-content') ||
                document.querySelector('.jobs-search__job-details--container') ||
                document.querySelector('.job-view-layout')
        }

        // Generic - Look for semantic tags
        return document.querySelector('article') || document.querySelector('main') || document.body
    }

    // Helper to find the canonical job URL
    const getJobUrl = (container: Element | null): string => {
        // 1. Canonical tag (most reliable)
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
        if (canonical && !canonical.includes('search')) return canonical

        // 2. OpenGraph URL
        const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content')
        if (ogUrl && !ogUrl.includes('search')) return ogUrl

        // 3. Look for link in title within container
        if (container) {
            const headerLinks = container.querySelectorAll('h1 a, h2 a, [data-automation="job-detail-title"] a')
            for (const link of headerLinks) {
                const href = link.getAttribute('href')
                if (href && (href.includes('/job/') || href.includes('/view/'))) {
                    return new URL(href, window.location.href).toString()
                }
            }
        }

        // 4. Fallback to current URL
        return window.location.href
    }

    const handleSave = async () => {
        setStatus("loading")
        try {
            // 1. Find the best container
            const container = getScopedContainer()

            if (container) {
                console.log(`🎯 [Extension] Found scoped container:`, container.tagName, container.className)
                // Auto-expand content
                await expandContent(container)
            } else {
                console.warn('⚠️ [Extension] No scoped container found, using body')
            }

            // 2. Extract content (HTML)
            const contentContainer = container || document.body
            const jobDetailHtml = (contentContainer as HTMLElement).outerHTML
            console.log(`📦 [Extension] Extracted ${jobDetailHtml.length} chars`)

            // 3. Extract URL
            const jobUrl = getJobUrl(container)
            console.log(`🔗 [Extension] Identified Job URL: ${jobUrl}`)

            const response = await sendToBackground({
                name: "save-job",
                body: {
                    content: jobDetailHtml,
                    url: jobUrl
                }
            })

            console.log("Background response:", response)

            if (response.success) {
                setStatus("success")
                if (response.parsed_data) {
                    console.log(`✅ [Extension] Saved Job: "${response.parsed_data.title}" at ${response.parsed_data.company}`)
                }
                await markAsSaved(currentJobId)
                setTimeout(() => setStatus("already-saved"), 2000)
            } else {
                setStatus("error")
                setMessage(response.error || "Failed")
                setTimeout(() => {
                    checkIfSaved(currentJobId).then(isSaved => {
                        setStatus(isSaved ? "already-saved" : "idle")
                        setMessage("")
                    })
                }, 3000)
            }
        } catch (error) {
            console.error("Failed to save job:", error)
            setStatus("error")
            setMessage((error as Error).message)
            setTimeout(() => {
                checkIfSaved(currentJobId).then(isSaved => {
                    setStatus(isSaved ? "already-saved" : "idle")
                    setMessage("")
                })
            }, 3000)
        }
    }

    return (
        <button
            onClick={handleSave}
            disabled={status === "loading" || status === "success"}
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
