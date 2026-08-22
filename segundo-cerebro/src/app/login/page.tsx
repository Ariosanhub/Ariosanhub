"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(traduzErro(error.message));
        return;
      }
      router.replace("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(traduzErro(error.message));
        return;
      }
      if (data.session) {
        router.replace("/onboarding");
        router.refresh();
      } else {
        setNotice("Conta criada. Verifique seu e-mail para confirmar o acesso.");
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
            <span className="text-2xl">⚓</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Âncora</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Seu espaço pessoal de autoconhecimento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--fg-muted)]">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--fg-muted)]">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
          {notice && <p className="text-xs text-[var(--accent)]">{notice}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-4 w-full text-center text-xs text-[var(--fg-muted)]"
        >
          {mode === "signin" ? (
            <>
              Ainda não tem conta? <span className="text-[var(--accent)]">Criar agora</span>
            </>
          ) : (
            <>
              Já tem conta? <span className="text-[var(--accent)]">Entrar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function traduzErro(msg: string) {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("User already registered")) return "Este e-mail já tem uma conta — entre em vez de criar.";
  if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return msg;
}
