import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("hud-panel flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center border border-cp-yellow/30 bg-cp-yellow/5 text-cp-yellow clip-notch">
        {icon}
        <span className="absolute -right-1 -top-1 h-1.5 w-1.5 bg-cp-cyan" />
      </div>
      <p className="hud-label text-cp-yellow">No Data</p>
      <h3 className="font-display mt-2 text-xl font-bold uppercase tracking-[0.06em] text-fog">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
