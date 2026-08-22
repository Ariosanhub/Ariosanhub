import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { HabitsManager } from "@/components/habits/HabitsManager";
import { daysAgoDateISO } from "@/lib/utils";

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sixtyDaysAgo = daysAgoDateISO(60);

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name, icon, archived, created_at")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("habit_logs")
      .select("habit_id, log_date, done")
      .eq("user_id", user.id)
      .gte("log_date", sixtyDaysAgo),
  ]);

  return (
    <>
      <PageHeader title="Hábitos" subtitle="Ações diárias que sustentam sua base física e mental." backHref="/" />
      <HabitsManager initialHabits={habits ?? []} initialLogs={logs ?? []} />
    </>
  );
}
