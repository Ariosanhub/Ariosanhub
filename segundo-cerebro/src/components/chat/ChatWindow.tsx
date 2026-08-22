"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string };

export function ChatWindow({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { id: `local-${Date.now()}`, role: "user", content: text };
    const assistantId = `local-${Date.now()}-a`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.body) throw new Error("Sem resposta");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Não consegui responder agora. Tente de novo." } : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Nina</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Pense em voz alta. Sem julgamentos, com base em TCC e neurociência.
        </p>
      </div>

      <div className="space-y-4 pb-28">
        {messages.length === 0 && (
          <div className="card p-4 text-sm text-[var(--fg-muted)]">
            Oi! Sou a Nina. Pode trazer uma situação real — algo que aconteceu com seu chefe, sua
            equipe ou qualquer coisa que esteja pesando — e a gente pensa junto.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "card text-[var(--fg)]"
              )}
            >
              {m.role === "assistant" ? (
                <div className="prose-app prose-chat">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="fixed bottom-[64px] left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Escreva para a Nina…"
            className="max-h-28 flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .prose-chat p {
          margin-bottom: 0.5rem;
          color: inherit;
        }
        .prose-chat p:last-child {
          margin-bottom: 0;
        }
        .prose-chat strong {
          color: inherit;
        }
        .prose-chat ul,
        .prose-chat ol {
          margin: 0.4rem 0 0.6rem 1.1rem;
          color: inherit;
        }
      `}</style>
    </div>
  );
}
