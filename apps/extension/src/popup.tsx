import { ENV_SUFFIX } from "./config"

function IndexPopup() {
  return (
    <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-h-40 plasmo-w-64 plasmo-p-4 plasmo-bg-gray-50">
      <h2 className="plasmo-text-lg plasmo-font-bold plasmo-text-blue-600 plasmo-mb-2">
        CareerMatch AI{ENV_SUFFIX}
      </h2>
      <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-text-center">
        Extension is active and ready to save jobs.
      </p>
      <div className="plasmo-mt-4 plasmo-text-xs plasmo-text-gray-400">
        v0.0.1{ENV_SUFFIX}
      </div>
    </div>
  )
}

export default IndexPopup
