import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

type AssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const initialMessages: AssistantMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Здравей. Аз съм AI Assistant на BusGo. Мога да помогна с маршрути, места, билети, регистрация и профил.',
  },
]

export function AiAssistant() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages)
  const [isSending, setIsSending] = useState(false)
  const messagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isOpen])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isSending) return

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const response = await fetch(`${baseUrl}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentPath: `${location.pathname}${location.search}`,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? 'Assistant request failed')
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data?.reply ?? 'Не успях да отговоря в момента. Пробвай пак след малко.',
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'AI Assistant не е наличен в момента. Провери дали backend-ът е пуснат и дали MongoDB работи.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <div
        className={cn(
          'mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.22)] transition-all duration-300',
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <div className="bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black">BusGo AI Assistant</div>
              <div className="mt-1 text-xs text-slate-300">Route and ticket help</div>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-sm font-black transition-colors hover:bg-white/15"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Assistant"
            >
              X
            </button>
          </div>
        </div>

        <div ref={messagesRef} className="max-h-80 overflow-y-auto p-4">
          <div className="grid gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                  message.role === 'user'
                    ? 'ml-auto bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-700',
                )}
              >
                {message.text}
              </div>
            ))}
            {isSending ? (
              <div className="w-fit rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600">
                Thinking...
              </div>
            ) : null}
          </div>
        </div>

        <form className="border-t border-slate-100 p-3" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about tickets..."
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        className="ml-auto flex h-14 items-center gap-3 rounded-2xl bg-slate-950 px-4 font-black text-white shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition-transform hover:-translate-y-0.5"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open AI Assistant"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-400 text-sm text-slate-950">AI</span>
        <span className="hidden text-sm sm:block">Assistant</span>
      </button>
    </div>
  )
}
