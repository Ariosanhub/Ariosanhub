import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { JournalForm } from "@/components/journal/JournalForm";

export default async function NewJournalEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="Novo registro" backHref="/journal" />
      <JournalForm />
    </>
  );
}
