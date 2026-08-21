import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-2">
      {backHref && (
        <Link
          href={backHref}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--fg-muted)]"
        >
          <ChevronLeft size={18} />
        </Link>
      )}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--fg-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}
