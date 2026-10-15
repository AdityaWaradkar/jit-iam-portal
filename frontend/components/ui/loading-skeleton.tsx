import { cn } from "@/lib/utils";

type Props = {
  rows?: number;
  className?: string;
};

export function LoadingSkeleton({ rows = 3, className }: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 animate-pulse rounded-md border border-border bg-secondary/40"
        />
      ))}
    </div>
  );
}