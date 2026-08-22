import { createClient } from "@supabase/supabase-js";
import { buildIcsFeed } from "@/lib/ics";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc("get_agenda_feed", { feed_token: token });

  if (error) {
    return new Response("Não foi possível carregar a agenda", { status: 400 });
  }

  const ics = buildIcsFeed(data ?? [], "Âncora — Agenda");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=agenda.ics",
      "Cache-Control": "public, max-age=300",
    },
  });
}
