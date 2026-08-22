"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export function DeleteEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await supabase.from("journal_entries").delete().eq("id", id);
    router.replace("/journal");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setConfirming(false)} className="btn-ghost flex-1 py-2.5 text-sm">
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 rounded-full border border-[var(--danger)] py-2.5 text-sm text-[var(--danger)]"
        >
          Confirmar exclusão
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]"
    >
      <Trash2 size={14} /> Excluir registro
    </button>
  );
}
