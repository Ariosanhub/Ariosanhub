import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { AgendaManager } from "@/components/agenda/AgendaManager";
import { SubscribeCard } from "@/components/agenda/SubscribeCard";
import { daysAgoISO } from "@/lib/utils";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("ics_token").eq("id", user.id).maybeSingle(),
    supabase
      .from("agenda_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_at", daysAgoISO(1))
      .order("start_at", { ascending: true }),
  ]);

  return (
    <>
      <PageHeader title="Agenda" subtitle="Compromissos e lembretes do seu segundo cérebro." backHref="/" />
      <div className="space-y-5">
        <SubscribeCard icsToken={profile?.ics_token ?? null} />
        <AgendaManager initialEvents={events ?? []} />
      </div>
    </>
  );
}
