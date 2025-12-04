import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { SaveJobButton } from "../components/SaveJobButton"
import cssText from "data-text:~/style.css"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    all_frames: false
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

// Check if the current page looks like a job posting
const isJobPage = (): boolean => {
    const url = window.location.href

    // 1. Exclude known sites handled by specific injectors
    // 1. Exclude known sites handled by specific injectors
    if (url.includes('seek.') || url.includes('linkedin.com')) {
        return false
    }

    // 2. Check for Schema.org JobPosting
    const schemas = document.querySelectorAll('script[type="application/ld+json"]')
    for (const schema of schemas) {
        try {
            const json = JSON.parse(schema.textContent || '{}')
            // Handle both single object and graph array
            const type = json['@type']
            if (type === 'JobPosting') return true

            if (json['@graph']) {
                for (const item of json['@graph']) {
                    if (item['@type'] === 'JobPosting') return true
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    // 3. Check URL patterns
    const jobUrlPatterns = [
        /\/job\//i,
        /\/careers\//i,
        /\/position\//i,
        /\/vacancy\//i,
        /\/opening\//i,
        /\/work-with-us\//i
    ]
    if (jobUrlPatterns.some(pattern => pattern.test(url))) {
        // Double check with keywords to avoid false positives (e.g. /careers/ list page)
        const bodyText = document.body.innerText.toLowerCase()
        const requiredKeywords = ['apply', 'description', 'requirements']
        const hasKeywords = requiredKeywords.filter(k => bodyText.includes(k)).length >= 2

        if (hasKeywords) return true
    }

    return false
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
    if (!isJobPage()) {
        return null
    }

    // console.log('🌍 [Extension] Universal Injector: Detected generic job page')

    // Prevent duplicate injection
    const existingContainer = document.getElementById("plasmo-universal-fixed-button-container")
    if (existingContainer) {
        return existingContainer
    }

    // Create fixed container at bottom-right
    const fixedContainer = document.createElement("div")
    fixedContainer.id = "plasmo-universal-fixed-button-container"
    fixedContainer.style.position = "fixed"
    fixedContainer.style.bottom = "20px"
    fixedContainer.style.right = "20px"
    fixedContainer.style.zIndex = "2147483647" // Max z-index

    document.body.appendChild(fixedContainer)
    return fixedContainer
}

const UniversalInjector = () => {
    return (
        <div className="plasmo-z-50 plasmo-ml-4 plasmo-fixed plasmo-bottom-5 plasmo-right-5 plasmo-shadow-xl plasmo-rounded-full plasmo-bg-white plasmo-p-1">
            <SaveJobButton />
        </div>
    )
}

export default UniversalInjector
