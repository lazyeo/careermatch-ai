import { Check, CheckCheck, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()
const SAVE_TIMEOUT_MS = 120000

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), ms)

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      }
    )
  })
}

const cleanText = (value?: string | null): string =>
  value?.replace(/\s+/g, " ").trim() || ""

const capHtml = (value: string, maxLength = 120000): string => {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}\n<p><em>Content trimmed by CareerMatch extension.</em></p>`
}

const textFrom = (selector: string): string =>
  cleanText(document.querySelector(selector)?.textContent)

const textFromWithin = (root: ParentNode | null, selector: string): string =>
  cleanText(root?.querySelector(selector)?.textContent)

const firstTextFrom = (
  selectors: string[],
  root: ParentNode | null = document
): string => {
  for (const selector of selectors) {
    const value = textFromWithin(root, selector)
    if (value) return value
  }

  if (root !== document) {
    for (const selector of selectors) {
      const value = textFrom(selector)
      if (value) return value
    }
  }

  return ""
}

const splitLinkedInSummary = (value: string): string[] =>
  value
    .split(/\s(?:·|\|)\s|\n/)
    .map((part) => cleanText(part))
    .filter(Boolean)

const extractJobMetadata = (container: Element | null) => {
  const url = window.location.href
  const pageTitle = cleanText(document.title)
  let title = ""
  let company = ""
  let location = ""

  if (url.includes("linkedin")) {
    title =
      firstTextFrom(
        [
          ".job-details-jobs-unified-top-card__job-title",
          ".jobs-unified-top-card__job-title",
          ".jobs-details__main-content h1",
          "h1"
        ],
        container
      ) || pageTitle
    company = firstTextFrom(
      [
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name a",
        ".jobs-unified-top-card__company-name",
        'a[href*="/company/"]'
      ],
      container
    )
    location = firstTextFrom(
      [
        ".job-details-jobs-unified-top-card__bullet",
        ".jobs-unified-top-card__bullet",
        ".jobs-unified-top-card__workplace-type",
        ".job-details-jobs-unified-top-card__primary-description-container"
      ],
      container
    )

    const summary = firstTextFrom(
      [
        ".job-details-jobs-unified-top-card__primary-description-container",
        ".jobs-unified-top-card__primary-description-container"
      ],
      container
    )
    const summaryParts = splitLinkedInSummary(summary)
    company ||= summaryParts[0] || ""
    location ||=
      summaryParts.find((part) =>
        /new zealand|auckland|wellington|christchurch|remote|hybrid/i.test(part)
      ) || ""

    const linkedInTitle = pageTitle.replace(/\s*\|\s*LinkedIn.*$/i, "")
    const hiringMatch = linkedInTitle.match(
      /^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+.+)?$/i
    )
    const atMatch = linkedInTitle.match(/^(.+?)\s+at\s+(.+)$/i)
    if (hiringMatch) {
      company ||= cleanText(hiringMatch[1])
      title ||= cleanText(hiringMatch[2])
    } else if (atMatch) {
      title ||= cleanText(atMatch[1])
      company ||= cleanText(atMatch[2])
    }
  } else if (url.includes("seek")) {
    title =
      firstTextFrom(
        [
          '[data-automation="job-detail-title"]',
          '[data-automation="jobTitle"]',
          "h1"
        ],
        container
      ) || pageTitle
    company = firstTextFrom(
      [
        '[data-automation="advertiser-name"]',
        '[data-automation="company-profile-name"]',
        '[data-automation="jobCompany"]'
      ],
      container
    )
    location = firstTextFrom(
      [
        '[data-automation="job-detail-location"]',
        '[data-automation="jobLocation"]',
        '[data-automation="job-detail-work-type"]'
      ],
      container
    )
  } else {
    title = firstTextFrom(["h1", "h2"], container) || pageTitle
    company = firstTextFrom(
      [
        '[data-testid*="company"]',
        '[class*="company"]',
        '[data-automation*="company"]'
      ],
      container
    )
    location = firstTextFrom(
      [
        '[data-testid*="location"]',
        '[class*="location"]',
        '[data-automation*="location"]'
      ],
      container
    )
  }

  return {
    title: cleanText(title),
    company: cleanText(company),
    location: cleanText(location),
    application_url: url
  }
}

const sanitizeJobHtml = (source: Element): string => {
  const clone = source.cloneNode(true) as HTMLElement

  clone
    .querySelectorAll(
      [
        "script",
        "style",
        "svg",
        "canvas",
        "iframe",
        "noscript",
        "button",
        "form",
        "nav",
        "header",
        "footer",
        '[aria-hidden="true"]',
        '[role="button"]'
      ].join(",")
    )
    .forEach((element) => element.remove())

  clone.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const shouldKeep =
        element.tagName.toLowerCase() === "a" && attribute.name === "href"

      if (!shouldKeep) {
        element.removeAttribute(attribute.name)
      }
    }

    if (element.tagName.toLowerCase() === "a") {
      const href = element.getAttribute("href")
      if (href) {
        element.setAttribute("href", new URL(href, window.location.href).href)
      }
    }
  })

  return capHtml(clone.innerHTML)
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const buildJobContentHtml = (
  metadata: ReturnType<typeof extractJobMetadata>,
  contentContainer: Element,
  jobUrl: string
): string => {
  const metadataRows = [
    ["Source URL", jobUrl],
    ["Page title", cleanText(document.title)],
    ["Job title", metadata.title],
    ["Company", metadata.company],
    ["Location", metadata.location]
  ].filter(([, value]) => value)

  const metadataHtml = metadataRows
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
    )
    .join("")

  return [
    "<article>",
    metadataHtml ? `<section>${metadataHtml}</section>` : "",
    "<section>",
    sanitizeJobHtml(contentContainer),
    "</section>",
    "</article>"
  ].join("")
}

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
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "already-saved"
  >("idle")
  const [message, setMessage] = useState("")
  const [currentJobId, setCurrentJobId] = useState<string>("")

  // Check if current job is already saved
  const checkIfSaved = async (jobId: string) => {
    try {
      const savedJobs: string[] = (await storage.get("saved-jobs")) || []
      return savedJobs.includes(jobId)
    } catch (error) {
      console.error("Failed to check saved status:", error)
      return false
    }
  }

  // Mark job as saved
  const markAsSaved = async (jobId: string) => {
    try {
      const savedJobs: string[] = (await storage.get("saved-jobs")) || []
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
      console.log(
        `   - Container: ${container ? `${container.tagName.toLowerCase()}.${Array.from(container.classList).join(".")}` : "❌ Not Found (will use body)"}`
      )
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
    window.addEventListener("popstate", checkJobChange)

    return () => {
      observer.disconnect()
      window.removeEventListener("popstate", checkJobChange)
    }
  }, [currentJobId])

  // Helper to auto-expand "Show more" content
  const expandContent = async (container: Element) => {
    const expandSelectors = [
      'button[aria-label*="Show more"]',
      'button[aria-label*="Read more"]',
      ".jobs-description__footer-button", // LinkedIn specific
      '[data-automation="toggle-job-details"]', // Seek specific
      "button.show-more-button", // Generic
      "a.read-more" // Generic
    ]

    for (const selector of expandSelectors) {
      const button = container.querySelector(selector) as HTMLElement
      if (button && button.offsetParent !== null) {
        // Check if visible
        console.log(`🔍 [Extension] Found expand button: ${selector}`)
        try {
          button.click()
          // Wait a bit for expansion animation/fetch
          await new Promise((resolve) => setTimeout(resolve, 500))
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
    if (url.includes("seek")) {
      return (
        document.querySelector('[data-automation="jobDetails"]') ||
        document.querySelector('[data-automation="job-detail-root"]') ||
        document.querySelector('[data-automation="jobAdDetails"]') ||
        document.querySelector("main") || // Seek usually puts detail in main
        document.querySelector("article")
      )
    }

    // LinkedIn
    if (url.includes("linkedin")) {
      return (
        document.querySelector(".jobs-details__main-content") ||
        document.querySelector(".jobs-search__job-details--container") ||
        document.querySelector(".job-view-layout")
      )
    }

    // Generic - Look for semantic tags
    return (
      document.querySelector("article") ||
      document.querySelector("main") ||
      document.body
    )
  }

  // Helper to find the canonical job URL
  const getJobUrl = (container: Element | null): string => {
    // 1. Canonical tag (most reliable)
    const canonical = document
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href")
    if (canonical && !canonical.includes("search")) return canonical

    // 2. OpenGraph URL
    const ogUrl = document
      .querySelector('meta[property="og:url"]')
      ?.getAttribute("content")
    if (ogUrl && !ogUrl.includes("search")) return ogUrl

    // 3. Look for link in title within container
    if (container) {
      const headerLinks = container.querySelectorAll(
        'h1 a, h2 a, [data-automation="job-detail-title"] a'
      )
      for (const link of headerLinks) {
        const href = link.getAttribute("href")
        if (href && (href.includes("/job/") || href.includes("/view/"))) {
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
        console.log(
          `🎯 [Extension] Found scoped container:`,
          container.tagName,
          container.className
        )
        // Auto-expand content
        await expandContent(container)
      } else {
        console.warn("⚠️ [Extension] No scoped container found, using body")
      }

      // 2. Extract focused content
      const contentContainer = container || document.body
      const jobUrl = getJobUrl(container)
      const metadata = {
        ...extractJobMetadata(container),
        application_url: jobUrl
      }
      const jobContent = buildJobContentHtml(metadata, contentContainer, jobUrl)
      console.log(`📦 [Extension] Extracted ${jobContent.length} chars`)
      console.log(`🔗 [Extension] Identified Job URL: ${jobUrl}`)

      const response = await withTimeout(
        sendToBackground({
          name: "save-job",
          body: {
            content: jobContent,
            metadata,
            url: jobUrl
          }
        }),
        SAVE_TIMEOUT_MS,
        "Saving is taking too long. Check CareerMatch in a minute, then try again if the job did not appear."
      )

      console.log("Background response:", response)

      if (response.success) {
        setStatus("success")
        if (response.parsed_data) {
          console.log(
            `✅ [Extension] Saved Job: "${response.parsed_data.title}" at ${response.parsed_data.company}`
          )
        }
        await markAsSaved(currentJobId)
        setTimeout(() => setStatus("already-saved"), 2000)
      } else {
        setStatus("error")
        setMessage(response.error || "Failed")
        setTimeout(() => {
          checkIfSaved(currentJobId).then((isSaved) => {
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
        checkIfSaved(currentJobId).then((isSaved) => {
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
      style={{
        alignItems: "center",
        border: 0,
        borderRadius: "9999px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.22)",
        cursor:
          status === "loading" || status === "success" ? "default" : "pointer",
        display: "inline-flex",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "14px",
        fontWeight: 700,
        gap: "8px",
        lineHeight: "20px",
        minHeight: "44px",
        minWidth: "188px",
        padding: "10px 16px",
        position: "relative",
        whiteSpace: "nowrap"
      }}
      className={`
        plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-2 plasmo-rounded-full plasmo-font-medium plasmo-transition-all plasmo-shadow-sm
        ${status === "idle" ? "plasmo-bg-blue-600 plasmo-text-white hover:plasmo-bg-blue-700" : ""}
        ${status === "loading" ? "plasmo-bg-blue-100 plasmo-text-blue-700" : ""}
        ${status === "success" ? "plasmo-bg-green-600 plasmo-text-white" : ""}
        ${status === "already-saved" ? "plasmo-bg-gray-500 plasmo-text-white hover:plasmo-bg-gray-600 plasmo-opacity-75" : ""}
        ${status === "error" ? "plasmo-bg-red-600 plasmo-text-white" : ""}
      `}>
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
      {status === "error" && <span>Error: {message}</span>}
    </button>
  )
}
