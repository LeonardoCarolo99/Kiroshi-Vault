import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-cp-yellow" />
            <p className="hud-label text-cp-yellow">{eyebrow}</p>
          </div>
        ) : null}
        <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-[0.05em] text-fog sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
