import { Check, Loader2, PlusCircle, XCircle } from "lucide-react"
import { useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import { ENV_SUFFIX } from "./config"

const READ_TIMEOUT_MS = 20000
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

function IndexPopup() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [message, setMessage] = useState("")
  const extensionVersion = chrome.runtime.getManifest().version

  const saveCurrentJob = async () => {
    setStatus("loading")
    setMessage("Reading this job page...")

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (!tab?.id) {
        throw new Error("No active tab found")
      }

      const [result] = await withTimeout(
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const capText = (value: string, maxLength = 80000) => {
              if (value.length <= maxLength) return value
              return `${value.slice(0, maxLength)}\n\n[Content trimmed by CareerMatch extension]`
            }

            const cleanText = (value?: string | null) =>
              value?.replace(/\s+/g, " ").trim() || ""

            const textFrom = (selector: string) =>
              cleanText(document.querySelector(selector)?.textContent)

            const textFromWithin = (
              root: ParentNode | null,
              selector: string
            ) => cleanText(root?.querySelector(selector)?.textContent)

            const firstTextFrom = (
              selectors: string[],
              root: ParentNode | null = document
            ) => {
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

            const splitLinkedInSummary = (value: string) =>
              value
                .split(/\s(?:·|\|)\s|\n/)
                .map((part) => cleanText(part))
                .filter(Boolean)

            const getScopedContainer = () => {
              const url = window.location.href

              if (url.includes("seek")) {
                return (
                  document.querySelector('[data-automation="jobDetails"]') ||
                  document.querySelector(
                    '[data-automation="job-detail-root"]'
                  ) ||
                  document.querySelector('[data-automation="jobAdDetails"]') ||
                  document.querySelector("main") ||
                  document.querySelector("article")
                )
              }

              if (url.includes("linkedin")) {
                return (
                  document.querySelector(".jobs-details__main-content") ||
                  document.querySelector(
                    ".jobs-search__job-details--container"
                  ) ||
                  document.querySelector(".job-view-layout")
                )
              }

              return (
                document.querySelector("article") ||
                document.querySelector("main") ||
                document.body
              )
            }

            const getJobUrl = (container: Element | null) => {
              const canonical = document
                .querySelector('link[rel="canonical"]')
                ?.getAttribute("href")
              if (canonical && !canonical.includes("search")) return canonical

              const ogUrl = document
                .querySelector('meta[property="og:url"]')
                ?.getAttribute("content")
              if (ogUrl && !ogUrl.includes("search")) return ogUrl

              if (container) {
                const headerLinks = container.querySelectorAll(
                  'h1 a, h2 a, [data-automation="job-detail-title"] a'
                )
                for (const link of headerLinks) {
                  const href = link.getAttribute("href")
                  if (
                    href &&
                    (href.includes("/job/") || href.includes("/view/"))
                  ) {
                    return new URL(href, window.location.href).toString()
                  }
                }
              }

              return window.location.href
            }

            const container = getScopedContainer()
            const contentContainer = container || document.body
            const jobUrl = getJobUrl(container)
            const url = window.location.href
            const pageTitle = cleanText(document.title)
            let jobTitle = ""
            let company = ""
            let location = ""

            if (url.includes("linkedin")) {
              jobTitle =
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
                  /new zealand|auckland|wellington|christchurch|remote|hybrid/i.test(
                    part
                  )
                ) || ""

              const linkedInTitle = pageTitle.replace(
                /\s*\|\s*LinkedIn.*$/i,
                ""
              )
              const hiringMatch = linkedInTitle.match(
                /^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+.+)?$/i
              )
              const atMatch = linkedInTitle.match(/^(.+?)\s+at\s+(.+)$/i)
              if (hiringMatch) {
                company ||= cleanText(hiringMatch[1])
                jobTitle ||= cleanText(hiringMatch[2])
              } else if (atMatch) {
                jobTitle ||= cleanText(atMatch[1])
                company ||= cleanText(atMatch[2])
              }
            } else if (url.includes("seek")) {
              jobTitle =
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
              jobTitle = firstTextFrom(["h1", "h2"], container) || pageTitle
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

            const metadata = {
              title: cleanText(jobTitle),
              company: cleanText(company),
              location: cleanText(location),
              application_url: jobUrl
            }
            const bodyText = capText(
              cleanText(
                (contentContainer as HTMLElement).innerText ||
                  document.body.innerText
              )
            )

            return {
              content: [
                `Source URL: ${jobUrl}`,
                `Page title: ${pageTitle}`,
                metadata.title ? `Job title: ${metadata.title}` : "",
                metadata.company ? `Company: ${metadata.company}` : "",
                metadata.location ? `Location: ${metadata.location}` : "",
                "",
                "Job content:",
                bodyText
              ]
                .filter(Boolean)
                .join("\n"),
              metadata,
              url: jobUrl
            }
          }
        }),
        READ_TIMEOUT_MS,
        "Could not read this page. Refresh the job page and try again."
      )

      const payload = result?.result
      if (!payload?.content || !payload?.url) {
        throw new Error("Could not read job content from this page")
      }

      setMessage("Parsing and saving. This can take 30-90 seconds...")

      const response = await withTimeout(
        sendToBackground({
          name: "save-job",
          body: payload
        }),
        SAVE_TIMEOUT_MS,
        "Saving is taking too long. Check the dashboard in a minute, then try again if it did not appear."
      )

      if (!response?.success) {
        throw new Error(response?.error || "Failed to save job")
      }

      setStatus("success")
      setMessage(response.parsed_data?.title || "Saved to CareerMatch")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to save job")
    }
  }

  return (
    <div className="plasmo-flex plasmo-w-72 plasmo-flex-col plasmo-gap-3 plasmo-p-4 plasmo-bg-gray-50">
      <h2 className="plasmo-text-lg plasmo-font-bold plasmo-text-blue-600 plasmo-mb-2">
        CareerMatch AI{ENV_SUFFIX}
      </h2>
      <p className="plasmo-text-sm plasmo-text-gray-600">
        Extension is active and ready to save jobs.
      </p>
      <button
        className="plasmo-inline-flex plasmo-items-center plasmo-justify-center plasmo-gap-2 plasmo-rounded-lg plasmo-bg-blue-600 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-text-white hover:plasmo-bg-blue-700 disabled:plasmo-opacity-70"
        disabled={status === "loading"}
        onClick={saveCurrentJob}>
        {status === "loading" ? (
          <Loader2 className="plasmo-h-4 plasmo-w-4 plasmo-animate-spin" />
        ) : status === "success" ? (
          <Check className="plasmo-h-4 plasmo-w-4" />
        ) : status === "error" ? (
          <XCircle className="plasmo-h-4 plasmo-w-4" />
        ) : (
          <PlusCircle className="plasmo-h-4 plasmo-w-4" />
        )}
        {status === "loading" ? "Saving..." : "Save current job"}
      </button>
      {status === "loading" && (
        <div className="plasmo-h-1.5 plasmo-overflow-hidden plasmo-rounded-full plasmo-bg-blue-100">
          <div className="plasmo-h-full plasmo-w-2/3 plasmo-animate-pulse plasmo-rounded-full plasmo-bg-blue-600" />
        </div>
      )}
      {message && (
        <p
          className={`plasmo-text-xs ${status === "error" ? "plasmo-text-red-600" : status === "loading" ? "plasmo-text-gray-600" : "plasmo-text-green-700"}`}>
          {message}
        </p>
      )}
      <div className="plasmo-text-xs plasmo-text-gray-400">
        v{extensionVersion}
        {ENV_SUFFIX}
      </div>
    </div>
  )
}

export default IndexPopup
