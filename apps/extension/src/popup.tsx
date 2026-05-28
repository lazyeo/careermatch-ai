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
            const pageTitle = cleanText(document.title)
            const jobTitle =
              textFrom('[data-automation="job-detail-title"]') ||
              textFrom("h1") ||
              pageTitle
            const company =
              textFrom('[data-automation="advertiser-name"]') ||
              textFrom('[data-automation="jobCompany"]') ||
              textFrom(".job-details-jobs-unified-top-card__company-name") ||
              textFrom(".jobs-unified-top-card__company-name")
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
                `Job title: ${jobTitle}`,
                company ? `Company: ${company}` : "",
                "",
                "Job content:",
                bodyText
              ]
                .filter(Boolean)
                .join("\n"),
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

      setMessage("Sending to CareerMatch...")

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
