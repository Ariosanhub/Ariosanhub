"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";

export function SubscribeCard({ icsToken }: { icsToken: string | null }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  if (!icsToken) return null;

  const url = typeof window !== "undefined" ? `${window.location.origin}/api/ics/${icsToken}` : "";

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="text-sm font-medium">Ver no Google Calendar / Apple Calendar</p>
          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
            Assine este link uma vez e seus compromissos aparecem lá também.
          </p>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-[var(--fg-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--fg-muted)] outline-none"
            />
            <button onClick={copy} className="btn-ghost flex h-9 w-9 shrink-0 items-center justify-center">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>

          <div className="space-y-2 text-xs text-[var(--fg-muted)]">
            <p>
              <strong className="text-[var(--fg)]">Google Calendar:</strong> no computador, abra
              calendar.google.com → no menu lateral &ldquo;Outras agendas&rdquo; → &ldquo;+&rdquo; →
              &ldquo;Da URL&rdquo; → cole o link acima.
            </p>
            <p>
              <strong className="text-[var(--fg)]">Apple Calendar (iPhone/Mac):</strong> Ajustes → Calendário →
              Contas → Adicionar Conta → Outro → Adicionar Assinatura de Calendário → cole o link acima.
            </p>
            <p>Atualiza automaticamente a cada hora — não precisa assinar de novo depois.</p>
          </div>
        </div>
      )}
    </div>
  );
}
