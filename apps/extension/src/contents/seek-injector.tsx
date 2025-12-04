import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { SaveJobButton } from "../components/SaveJobButton"
import cssText from "data-text:~/style.css"

console.log('🔧 [Extension] Seek Injector: File loaded')

export const config: PlasmoCSConfig = {
    matches: [
        "https://www.seek.co.nz/*",
        "https://www.seek.com.au/*",
        "*://*.seek.co.nz/*",
        "*://*.seek.com.au/*"
    ],
    all_frames: false  // Only inject in main frame, not iframes
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

// Inject into the job header actions area
// Seek's DOM is dynamic and obfuscated, so we look for stable anchors or use a fallback
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
    try {
        // Prevent duplicate injection - check if we already have a container
        const existingContainer = document.getElementById("plasmo-seek-fixed-button-container")
        if (existingContainer) {
            return existingContainer
        }

        // Try to find the Apply button (most reliable)
        let applyButton = document.querySelector('[data-automation="job-detail-apply"]')
        if (applyButton && applyButton.parentElement) {
            return applyButton.parentElement
        }

        // Fallback 1: Job header
        let header = document.querySelector('[data-automation="job-detail-header"]')
        if (header) {
            return header
        }

        // Fallback 2: Job title
        let title = document.querySelector('[data-automation="job-detail-title"]')
        if (title && title.parentElement) {
            return title.parentElement
        }

        // Fallback 3: Job Ad Details (New)
        let details = document.querySelector('[data-automation="jobAdDetails"]')
        if (details) {
            return details
        }

        // Fallback 4: Job Details Page (New)
        let page = document.querySelector('[data-automation="jobDetailsPage"]')
        if (page) {
            return page
        }

        // Fallback 5: Create fixed container at bottom-right
        let fixedContainer = document.createElement("div")
        fixedContainer.id = "plasmo-seek-fixed-button-container"
        fixedContainer.style.position = "fixed"
        fixedContainer.style.bottom = "20px"
        fixedContainer.style.right = "20px"
        fixedContainer.style.zIndex = "2147483647"

        if (!document.body) {
            return null
        }

        document.body.appendChild(fixedContainer)
        return fixedContainer
    } catch (error) {
        // console.error("❌ [Extension] Seek Injector Error:", error)
        return null
    }
}

const SeekInjector = () => {
    // console.log('🔧 [Extension] Seek Injector: Rendering component')
    return (
        <div className="plasmo-z-50 plasmo-ml-4 plasmo-fixed plasmo-bottom-5 plasmo-right-5 plasmo-shadow-xl plasmo-rounded-full plasmo-bg-white plasmo-p-1">
            <SaveJobButton />
        </div>
    )
}

export default SeekInjector
