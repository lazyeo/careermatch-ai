import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { SaveJobButton } from "../components/SaveJobButton"
import cssText from "data-text:~/style.css"

export const config: PlasmoCSConfig = {
    matches: ["*://*.linkedin.com/*"],
    all_frames: false  // Only inject in main frame, not iframes
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
    // Try multiple selectors for different LinkedIn layouts
    const selectors = [
        '.jobs-unified-top-card__content--two-pane',
        '.job-details-jobs-unified-top-card__container--two-pane',
        '.jobs-details__main-content',
        '.jobs-unified-top-card',
        '[class*="job-view-layout"]'
    ]

    for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (element) {
            return element
        }
    }

    // Fallback: Create fixed container at bottom-right
    let fixedContainer = document.getElementById("plasmo-linkedin-fixed-button-container")
    if (!fixedContainer) {
        fixedContainer = document.createElement("div")
        fixedContainer.id = "plasmo-linkedin-fixed-button-container"
        fixedContainer.style.position = "fixed"
        fixedContainer.style.bottom = "20px"
        fixedContainer.style.right = "20px"
        fixedContainer.style.zIndex = "2147483647"

        document.body.appendChild(fixedContainer)
        console.log('🔧 [Extension] LinkedIn Injector: Created fixed fallback container')
    }
    return fixedContainer
}

const LinkedInInjector = () => {
    console.log('🔧 [Extension] LinkedIn Injector: Rendering component')
    return (
        <div className="plasmo-z-50 plasmo-ml-2 plasmo-fixed plasmo-bottom-5 plasmo-right-5 plasmo-shadow-xl plasmo-rounded-full plasmo-bg-white plasmo-p-1">
            <SaveJobButton />
        </div>
    )
}

export default LinkedInInjector
