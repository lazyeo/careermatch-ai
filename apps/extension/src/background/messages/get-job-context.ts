import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

        if (!tab?.id) {
            res.send(null)
            return
        }

        // Inject script to extract context
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // 1. Try Schema.org
                const schemas = document.querySelectorAll('script[type="application/ld+json"]')
                for (const schema of schemas) {
                    try {
                        const json = JSON.parse(schema.textContent || '{}')
                        const job = json['@type'] === 'JobPosting' ? json :
                            (json['@graph']?.find((i: any) => i['@type'] === 'JobPosting'))

                        if (job) {
                            return {
                                title: job.title,
                                company: job.hiringOrganization?.name || 'Unknown Company',
                                description: job.description,
                                source: 'schema'
                            }
                        }
                    } catch (e) { }
                }

                // 2. Try Seek Selectors
                if (window.location.hostname.includes('seek')) {
                    const title = document.querySelector('[data-automation="job-detail-title"]')?.textContent
                    const company = document.querySelector('[data-automation="advertiser-name"]')?.textContent
                    if (title) return { title, company: company || 'Seek Employer', source: 'seek' }
                }

                // 3. Try LinkedIn Selectors
                if (window.location.hostname.includes('linkedin')) {
                    const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
                        document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim()
                    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
                        document.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim()

                    if (title) return { title, company: company || 'LinkedIn Employer', source: 'linkedin' }
                }

                // 4. Fallback: Page Title
                return {
                    title: document.title,
                    company: 'Unknown',
                    source: 'fallback'
                }
            }
        })

        const context = result[0]?.result
        res.send(context)
    } catch (error) {
        console.error("Failed to get context:", error)
        res.send(null)
    }
}

export default handler
