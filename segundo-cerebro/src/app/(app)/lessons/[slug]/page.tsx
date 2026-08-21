import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { CompleteLessonButton } from "@/components/lessons/CompleteLessonButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase.from("lessons").select("*").eq("slug", slug).maybeSingle();
  if (!lesson) notFound();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed_at, reflection")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  return (
    <>
      <PageHeader title={lesson.category} backHref="/lessons" />
      <h1 className="mb-4 text-2xl font-semibold leading-snug tracking-tight">{lesson.title}</h1>
      <div className="prose-app">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
      </div>

      <div className="mt-6">
        <CompleteLessonButton
          lessonId={lesson.id}
          initialCompleted={!!progress?.completed_at}
          initialReflection={progress?.reflection ?? ""}
        />
      </div>
    </>
  );
}
