import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

import { SaveJobButton } from "../components/SaveJobButton"

export const config: PlasmoCSConfig = {
  matches: ["*://*.linkedin.com/*"],
  all_frames: false // Only inject in main frame, not iframes
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  if (!document.body) {
    return null
  }

  let fixedContainer = document.getElementById(
    "plasmo-linkedin-fixed-button-container"
  )
  if (!fixedContainer) {
    fixedContainer = document.createElement("div")
    fixedContainer.id = "plasmo-linkedin-fixed-button-container"
    fixedContainer.style.position = "fixed"
    fixedContainer.style.bottom = "20px"
    fixedContainer.style.right = "20px"
    fixedContainer.style.zIndex = "2147483647"

    document.body.appendChild(fixedContainer)
    console.log(
      "🔧 [Extension] LinkedIn Injector: Created fixed fallback container"
    )
  }
  return fixedContainer
}

const LinkedInInjector = () => {
  console.log("🔧 [Extension] LinkedIn Injector: Rendering component")
  return (
    <div className="plasmo-z-50 plasmo-ml-2 plasmo-fixed plasmo-bottom-5 plasmo-right-5 plasmo-shadow-xl plasmo-rounded-full plasmo-bg-white plasmo-p-1">
      <SaveJobButton />
    </div>
  )
}

export default LinkedInInjector
