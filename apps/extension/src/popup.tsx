import { sendToBackground } from "@plasmohq/messaging"
import { Check, Loader2, PlusCircle, XCircle } from "lucide-react"
import { useState } from "react"

import { ENV_SUFFIX } from "./config"

function IndexPopup() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const saveCurrentJob = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        throw new Error("No active tab found")
      }

      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const getScopedContainer = () => {
            const url = window.location.href

            if (url.includes("seek")) {
              return (
                document.querySelector('[data-automation="jobDetails"]') ||
                document.querySelector('[data-automation="job-detail-root"]') ||
                document.querySelector('[data-automation="jobAdDetails"]') ||
                document.querySelector("main") ||
                document.querySelector("article")
              )
            }

            if (url.includes("linkedin")) {
              return (
                document.querySelector(".jobs-details__main-content") ||
                document.querySelector(".jobs-search__job-details--container") ||
                document.querySelector(".job-view-layout")
              )
            }

            return document.querySelector("article") || document.querySelector("main") || document.body
          }

          const getJobUrl = (container: Element | null) => {
            const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href")
            if (canonical && !canonical.includes("search")) return canonical

            const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute("content")
            if (ogUrl && !ogUrl.includes("search")) return ogUrl

            if (container) {
              const headerLinks = container.querySelectorAll('h1 a, h2 a, [data-automation="job-detail-title"] a')
              for (const link of headerLinks) {
                const href = link.getAttribute("href")
                if (href && (href.includes("/job/") || href.includes("/view/"))) {
                  return new URL(href, window.location.href).toString()
                }
              }
            }

            return window.location.href
          }

          const container = getScopedContainer()
          const contentContainer = container || document.body

          return {
            content: (contentContainer as HTMLElement).outerHTML,
            url: getJobUrl(container)
          }
        }
      })

      const payload = result?.result
      if (!payload?.content || !payload?.url) {
        throw new Error("Could not read job content from this page")
      }

      const response = await sendToBackground({
        name: "save-job",
        body: payload
      })

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
        onClick={saveCurrentJob}
      >
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
        <p className={`plasmo-text-xs ${status === "error" ? "plasmo-text-red-600" : "plasmo-text-green-700"}`}>
          {message}
        </p>
      )}
      <div className="plasmo-text-xs plasmo-text-gray-400">
        v0.0.1{ENV_SUFFIX}
      </div>
    </div>
  )
}

export default IndexPopup
