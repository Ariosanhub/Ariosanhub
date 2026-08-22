import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropicClient, CHAT_MODEL } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/systemPrompt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Não autenticado", { status: 401 });
  }

  const { message } = (await req.json()) as { message?: string };
  if (!message || !message.trim()) {
    return new Response("Mensagem vazia", { status: 400 });
  }

  const [{ data: profile }, { data: recentMoods }, { data: recentJournal }, { data: history }] =
    await Promise.all([
      supabase.from("profiles").select("display_name, focus_areas").eq("id", user.id).maybeSingle(),
      supabase
        .from("mood_checkins")
        .select("mood_label, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("journal_entries")
        .select("situation, balanced_thought, created_at")
        .eq("user_id", user.id)
        .eq("entry_type", "thought_record")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: message });

  const systemPrompt = buildSystemPrompt({
    displayName: profile?.display_name ?? null,
    focusAreas: profile?.focus_areas ?? [],
    recentMoods: recentMoods ?? [],
    recentJournal: recentJournal ?? [],
  });

  const orderedHistory = (history ?? []).slice().reverse();
  const messages = [
    ...orderedHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const client = anthropicClient();

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });

        anthropicStream.on("text", (textDelta) => {
          fullText += textDelta;
          controller.enqueue(encoder.encode(textDelta));
        });

        await anthropicStream.finalMessage();
      } catch (err) {
        console.error("Erro na chamada da Anthropic:", err);
        const fallback = "Desculpe, tive um problema para responder agora. Tente novamente em instantes.";
        fullText = fallback;
        controller.enqueue(encoder.encode(fallback));
      } finally {
        controller.close();
        if (fullText.trim()) {
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: fullText,
          });
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
