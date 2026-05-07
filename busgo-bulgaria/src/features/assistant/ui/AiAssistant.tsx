import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { apiBaseUrl } from '@/shared/api/baseUrl'
import { cn } from '@/shared/lib/cn'

type AssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

const initialMessages: AssistantMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Здравей. Кажи ми накъде пътуваш или какво те спира в BusGo, и ще те насоча с конкретни стъпки.',
  },
]

const quickPrompts = [
  'Искам билет София - Варна',
  'Как да избера места?',
  'Къде са моите билети?',
]

export function AiAssistant() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages)
  const [isSending, setIsSending] = useState(false)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const nextMessageIdRef = useRef(0)

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isOpen])

  function nextMessageId(role: AssistantMessage['role']) {
    nextMessageIdRef.current += 1
    return `${role}-${nextMessageIdRef.current}`
  }

  async function sendMessage(value: string) {
    const text = value.trim()
    if (!text || isSending) return

    const userMessage: AssistantMessage = {
      id: nextMessageId('user'),
      role: 'user',
      text,
    }
    const conversation = [...messages, userMessage]

    setMessages(conversation)
    setInput('')
    setIsSending(true)

    try {
      const response = await fetch(`${apiBaseUrl}/assistant`, {
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
          id: nextMessageId('assistant'),
          role: 'assistant',
          text: data?.reply ?? 'Не успях да отговоря в момента. Пробвай пак след малко.',
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId('assistant'),
          role: 'assistant',
          text: 'Assistant не е наличен в момента. Провери дали backend-ът е пуснат и пробвай пак.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await sendMessage(input)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const showQuickPrompts = messages.length === 1 && !isSending

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <div
        className={cn(
          'mb-3 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.22)] transition-all duration-300',
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <div className="bg-slate-950 px-4 py-3.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black">BusGo асистент</div>
              <div className="mt-1 text-xs text-slate-300">
                Маршрути, билети, места и профил
              </div>
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

        <div ref={messagesRef} className="max-h-[26rem] overflow-y-auto p-4">
          <div className="grid gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                  message.role === 'user'
                    ? 'ml-auto bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-700',
                )}
              >
                {message.text}
              </div>
            ))}
            {showQuickPrompts ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-950"
                    onClick={() => void sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
            {isSending ? (
              <div className="w-fit rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600">
                Мисля...
              </div>
            ) : null}
          </div>
        </div>

        <form className="border-t border-slate-100 p-3" onSubmit={handleSubmit}>
          <div className="flex items-end gap-2">
            <textarea
              className="min-h-11 max-h-28 min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Напиши въпрос..."
              rows={1}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
            >
              Изпрати
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
        <span className="hidden text-sm sm:block">Асистент</span>
      </button>
    </div>
  )
}
