"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export const PAGE_SIZE = 20;

export interface PaginationState {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  slice: <T>(items: T[]) => T[];
}

/**
 * Estado de paginação client-side com persistência em `?page=N`.
 *
 * Não usamos `useSearchParams()` porque ele força o componente a entrar
 * em CSR-bailout e exige um `<Suspense>` boundary acima — quebrando o
 * prerender estático no Next 16. Ler `window.location.search` direto no
 * mount e atualizar via `router.replace` cobre o caso do nosso app
 * (paginação só muda por clique do usuário, não por navegação externa).
 */
export function usePagination(total: number): PaginationState {
  const router = useRouter();
  const pathname = usePathname();

  const [page, setPageState] = useState(1);

  // Inicializa a partir do URL no mount — só client-side.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = Number.parseInt(
      new URLSearchParams(window.location.search).get("page") ?? "1",
      10,
    );
    if (Number.isFinite(raw) && raw > 0) setPageState(raw);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);

  const setPage = useCallback(
    (next: number) => {
      const target = Math.min(Math.max(1, next), totalPages);
      setPageState(target);
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (target === 1) params.delete("page");
      else params.set("page", String(target));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: true,
      });
    },
    [pathname, router, totalPages],
  );

  const slice = useCallback(
    <T,>(items: T[]): T[] => {
      const start = (current - 1) * PAGE_SIZE;
      return items.slice(start, start + PAGE_SIZE);
    },
    [current],
  );

  return useMemo(
    () => ({ page: current, totalPages, setPage, slice }),
    [current, totalPages, setPage, slice],
  );
}
