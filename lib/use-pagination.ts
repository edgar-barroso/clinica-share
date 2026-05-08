"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export const PAGE_SIZE = 20;

export interface PaginationState {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  slice: <T>(items: T[]) => T[];
}

export function usePagination(total: number): PaginationState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const parsed = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const page = Math.min(parsed, totalPages);

  const setPage = useCallback(
    (next: number) => {
      const target = Math.min(Math.max(1, next), totalPages);
      const params = new URLSearchParams(searchParams.toString());
      if (target === 1) {
        params.delete("page");
      } else {
        params.set("page", String(target));
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: true,
      });
    },
    [pathname, router, searchParams, totalPages],
  );

  const slice = useCallback(
    <T,>(items: T[]): T[] => {
      const start = (page - 1) * PAGE_SIZE;
      return items.slice(start, start + PAGE_SIZE);
    },
    [page],
  );

  return useMemo(
    () => ({ page, totalPages, setPage, slice }),
    [page, totalPages, setPage, slice],
  );
}
