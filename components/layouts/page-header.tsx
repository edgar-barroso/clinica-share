import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
