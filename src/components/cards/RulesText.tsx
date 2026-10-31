import { cn } from "@/lib/utils";

export function RulesText({ text, className }: { text: string; className?: string }) {
  if (!text) {
    return <p className={cn("text-sm text-muted", className)}>No rules text available.</p>;
  }
  const parts = text.split(/(\{[^}]+\}|€\$|☆)/g).filter(Boolean);
  return (
    <p className={cn("whitespace-pre-line text-[13px] leading-relaxed text-fog/90", className)}>
      {parts.map((part, index) => {
        if (/^\{[^}]+\}$/.test(part)) {
          return (
            <span
              key={`${part}-${index}`}
              className="mx-0.5 inline-flex items-center border border-cp-cyan/35 bg-cp-cyan/8 px-1.5 py-0.5 align-middle font-mono text-[10px] tracking-[0.06em] text-cp-cyan"
            >
              {part.slice(1, -1).toUpperCase()}
            </span>
          );
        }
        if (part === "€$") {
          return (
            <span key={`${part}-${index}`} className="font-mono text-cp-yellow">
              €$
            </span>
          );
        }
        if (part === "☆") {
          return (
            <span key={`${part}-${index}`} className="font-mono text-cp-yellow">
              ☆
            </span>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </p>
  );
}
