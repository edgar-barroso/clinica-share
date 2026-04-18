import { AlertTriangle } from "lucide-react";

export function PrototypeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-xs font-medium text-warning">
      <AlertTriangle size={14} />
      <span>
        Protótipo navegável · dados fictícios para validação com o Dr. Edson na R2
      </span>
    </div>
  );
}
