import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { SaveJobButton } from "../components/SaveJobButton"
import cssText from "data-text:~/style.css"

export const config: PlasmoCSConfig = {
    matches: ["*://*.seek.co.nz/*", "*://*.seek.com.au/*"],
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
    // Prevent duplicate injection - check if we already have a container
    const existingContainer = document.getElementById("plasmo-seek-fixed-button-container")
    if (existingContainer) {
        // console.log('🔧 [Extension] Seek Injector: Reusing existing container')
        return existingContainer
    }

    // Try to find the Apply button (most reliable)
    let applyButton = document.querySelector('[data-automation="job-detail-apply"]')
    if (applyButton && applyButton.parentElement) {
        // console.log('🔧 [Extension] Seek Injector: Found Apply button')
        return applyButton.parentElement
    }

    // Fallback 1: Job header
    let header = document.querySelector('[data-automation="job-detail-header"]')
    if (header) {
        // console.log('🔧 [Extension] Seek Injector: Found job header')
        return header
    }

    // Fallback 2: Job title
    let title = document.querySelector('[data-automation="job-detail-title"]')
    if (title && title.parentElement) {
        // console.log('🔧 [Extension] Seek Injector: Found job title')
        return title.parentElement
    }

    // Fallback 3: Create fixed container at bottom-right
    let fixedContainer = document.createElement("div")
    fixedContainer.id = "plasmo-seek-fixed-button-container"
    fixedContainer.style.position = "fixed"
    fixedContainer.style.bottom = "20px"
    fixedContainer.style.right = "20px"
    fixedContainer.style.zIndex = "2147483647"

    document.body.appendChild(fixedContainer)
    // console.log('🔧 [Extension] Seek Injector: Created fixed fallback container')
    return fixedContainer
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
