import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

import { SaveJobButton } from "../components/SaveJobButton"

console.log("🔧 [Extension] Seek Injector: File loaded")

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.seek.co.nz/*",
    "https://www.seek.com.au/*",
    "*://*.seek.co.nz/*",
    "*://*.seek.com.au/*"
  ],
  all_frames: false // Only inject in main frame, not iframes
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  try {
    const existingContainer = document.getElementById(
      "plasmo-seek-fixed-button-container"
    )
    if (existingContainer) {
      return existingContainer
    }

    if (!document.body) {
      return null
    }

    const fixedContainer = document.createElement("div")
    fixedContainer.id = "plasmo-seek-fixed-button-container"
    fixedContainer.style.position = "fixed"
    fixedContainer.style.bottom = "20px"
    fixedContainer.style.right = "20px"
    fixedContainer.style.zIndex = "2147483647"

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
