"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ProgressBar";
import { cn } from "@/lib/utils";

const FOCUS_OPTIONS = [
  "Impor limites no trabalho",
  "Lidar com meu chefe",
  "Liderar minha equipe",
  "Autoconfiança",
  "Ansiedade / medo de julgamento",
  "Procrastinação",
  "Sono e energia",
];

const BLOCKER_OPTIONS = [
  "Medo de perder o emprego",
  "Medo de criar conflito",
  "Medo de decepcionar alguém",
  "Não saber como dizer",
  "Culpa depois de me impor",
];

const GOAL_OPTIONS = [
  "Ganhar autoconfiança",
  "Aprender a colocar limites",
  "Entender meus padrões emocionais",
  "Registrar minha evolução ao longo do tempo",
];

const PATTERN_OPTIONS = ["Sim, quase sempre", "Às vezes", "Raramente"];

export function OnboardingWizard() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [pattern, setPattern] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);

  const totalSteps = 6;

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function finish() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("onboarding_answers").insert([
      { user_id: user.id, question_key: "focus_areas", answer: focusAreas },
      { user_id: user.id, question_key: "permissive_pattern", answer: pattern },
      { user_id: user.id, question_key: "blockers", answer: blockers },
      { user_id: user.id, question_key: "goal", answer: goal },
    ]);

    await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        focus_areas: focusAreas,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    router.replace("/");
    router.refresh();
  }

  const canAdvance = [
    true,
    displayName.trim().length > 0,
    focusAreas.length > 0,
    !!pattern,
    blockers.length > 0,
    !!goal,
  ][step];

  return (
    <div>
      <div className="mb-6">
        <ProgressBar value={step + 1} max={totalSteps} />
      </div>

      {step === 0 && (
        <Step title="Prepare-se para se conhecer melhor." subtitle="Antes de tudo, vamos entender onde você está agora — sem julgamento, só clareza.">
          <p className="prose-app text-sm">
            Este espaço é seu. As próximas perguntas ajudam a personalizar suas lições, o
            diário de TCC e as conversas com a Nina para o que você realmente está vivendo
            agora — principalmente no trabalho.
          </p>
        </Step>
      )}

      {step === 1 && (
        <Step title="Como podemos te chamar?">
          <input
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome ou apelido"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </Step>
      )}

      {step === 2 && (
        <Step title="Onde você mais sente dificuldade hoje?" subtitle="Selecione quantas fizerem sentido.">
          <Options
            options={FOCUS_OPTIONS}
            selected={focusAreas}
            onToggle={(v) => toggle(focusAreas, setFocusAreas, v)}
          />
        </Step>
      )}

      {step === 3 && (
        <Step title="Você sente que costuma aceitar demais e se impor de menos?">
          <Options options={PATTERN_OPTIONS} selected={pattern ? [pattern] : []} onToggle={setPattern} single />
        </Step>
      )}

      {step === 4 && (
        <Step title="O que mais te trava na hora de se posicionar?">
          <Options
            options={BLOCKER_OPTIONS}
            selected={blockers}
            onToggle={(v) => toggle(blockers, setBlockers, v)}
          />
        </Step>
      )}

      {step === 5 && (
        <Step title="Qual é seu objetivo principal aqui?">
          <Options options={GOAL_OPTIONS} selected={goal ? [goal] : []} onToggle={setGoal} single />
        </Step>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-ghost flex-1 py-2.5 text-sm">
            Voltar
          </button>
        )}
        <button
          disabled={!canAdvance || saving}
          onClick={() => (step === totalSteps - 1 ? finish() : setStep(step + 1))}
          className="btn-primary flex-1 py-2.5 text-sm"
        >
          {saving ? "Preparando…" : step === totalSteps - 1 ? "Preparar meu espaço" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold leading-snug tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-[var(--fg-muted)]">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Options<T extends string>({
  options,
  selected,
  onToggle,
  single,
}: {
  options: T[];
  selected: string[];
  onToggle: (value: T) => void;
  single?: boolean;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "w-full rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm transition-colors",
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]"
                : "border-[var(--border)] text-[var(--fg-muted)]"
            )}
          >
            {opt}
            {single && active ? " ✓" : !single && active ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}
