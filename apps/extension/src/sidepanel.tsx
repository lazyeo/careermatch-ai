import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { Loader2, Send, Sparkles, Briefcase } from "lucide-react"
import "~style.css"

const SidePanel = () => {
    const [context, setContext] = useState<{ title: string; company: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
        { role: "assistant", content: "Hi! I'm your CareerMatch assistant. Open a job post and I can help you analyze it." }
    ])
    const [input, setInput] = useState("")

    // Poll for context (active tab job details)
    const fetchContext = async () => {
        try {
            const res = await sendToBackground({ name: "get-job-context" })
            if (res && res.title) {
                setContext(res)
            }
        } catch (e) {
            console.log("No job context found yet")
        }
    }

    useEffect(() => {
        fetchContext()
        const interval = setInterval(fetchContext, 2000) // Poll every 2s for now
        return () => clearInterval(interval)
    }, [])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg = input
        setInput("")
        setMessages(prev => [...prev, { role: "user", content: userMsg }])
        setLoading(true)

        try {
            // TODO: Send to AI backend
            // For now, mock response
            await new Promise(resolve => setTimeout(resolve, 1000))
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `I see you're interested in the ${context?.title || 'job'}. Based on the description, this looks like a great fit for your skills in React and TypeScript.`
            }])
        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-h-screen plasmo-bg-gray-50">
            {/* Header */}
            <div className="plasmo-p-4 plasmo-bg-white plasmo-border-b plasmo-shadow-sm">
                <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                    <Briefcase className="plasmo-w-5 plasmo-h-5 plasmo-text-blue-600" />
                    <h1 className="plasmo-font-bold plasmo-text-gray-800">CareerMatch AI</h1>
                </div>
                {context && (
                    <div className="plasmo-mt-2 plasmo-text-xs plasmo-bg-blue-50 plasmo-text-blue-700 plasmo-p-2 plasmo-rounded plasmo-border plasmo-border-blue-100">
                        <span className="plasmo-font-semibold">Analyzing:</span> {context.title} @ {context.company}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="plasmo-flex-1 plasmo-overflow-y-auto plasmo-p-4 plasmo-space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`plasmo-flex ${msg.role === "user" ? "plasmo-justify-end" : "plasmo-justify-start"}`}>
                        <div className={`plasmo-max-w-[85%] plasmo-p-3 plasmo-rounded-lg plasmo-text-sm ${msg.role === "user"
                                ? "plasmo-bg-blue-600 plasmo-text-white plasmo-rounded-br-none"
                                : "plasmo-bg-white plasmo-text-gray-800 plasmo-border plasmo-shadow-sm plasmo-rounded-bl-none"
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="plasmo-flex plasmo-justify-start">
                        <div className="plasmo-bg-white plasmo-p-3 plasmo-rounded-lg plasmo-border plasmo-shadow-sm">
                            <Loader2 className="plasmo-w-4 plasmo-h-4 plasmo-animate-spin plasmo-text-blue-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="plasmo-p-4 plasmo-bg-white plasmo-border-t">
                <div className="plasmo-flex plasmo-gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Ask about this job..."
                        className="plasmo-flex-1 plasmo-p-2 plasmo-border plasmo-rounded-md plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="plasmo-p-2 plasmo-bg-blue-600 plasmo-text-white plasmo-rounded-md hover:plasmo-bg-blue-700 disabled:plasmo-opacity-50"
                    >
                        <Send className="plasmo-w-4 plasmo-h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SidePanel
