// Configuration for API endpoints
// These are set via environment variables in package.json scripts

export const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000"
export const ENV_SUFFIX = process.env.PLASMO_PUBLIC_NAME_SUFFIX || ""

export const API_ENDPOINTS = {
    IMPORT_JOB: `${API_BASE_URL}/api/jobs/import`,
    CHECK_AUTH: `${API_BASE_URL}/api/auth/check`
}
