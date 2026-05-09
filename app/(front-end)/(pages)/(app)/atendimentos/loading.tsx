import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AtendimentosLoading() {
  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4">
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-20 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
