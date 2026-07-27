'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiLogout, apiMe } from '@/lib/auth-client';

/**
 * [RF-024] Camada de UX do encerramento por inatividade.
 *
 * NÃO é o mecanismo de segurança — quem expira a sessão é o servidor
 * (TTL do JWT renovado no `proxy.ts` + `User.ultimoAcesso` validado em
 * `requireUser`). Este componente só faz a expiração ser *visível*: em vez
 * de o usuário descobrir que caiu no próximo clique, ele é levado ao
 * /login assim que a janela estoura.
 *
 * Dois comportamentos:
 *   1. Sem interação por `idleMinutes` → logout + redirect pro /login.
 *   2. Com interação → keepalive (`/api/auth/me`) no máximo a cada
 *      `idleMinutes / 3`, que desliza a janela no servidor. Sem isso, um
 *      usuário preenchendo um formulário longo (sem disparar request
 *      nenhum) seria deslogado no submit.
 *
 * Aba aberta e parada não pinga nada — a janela do servidor expira sozinha
 * mesmo que este timer seja sabotado no cliente.
 */
const ACTIVITY_EVENTS = [
  'pointerdown',
  'keydown',
  'mousemove',
  'wheel',
  'touchstart',
] as const;

export function IdleSessionGuard({ idleMinutes }: { idleMinutes: number }) {
  const router = useRouter();
  // Inicializados dentro do effect — `Date.now()` no corpo do componente
  // viola a regra de pureza do React (react-hooks/purity).
  const ultimaAtividade = useRef(0);
  const ultimoPing = useRef(0);
  const encerrando = useRef(false);

  useEffect(() => {
    ultimaAtividade.current = Date.now();
    ultimoPing.current = Date.now();

    const idleMs = Math.max(idleMinutes, 1) * 60_000;
    const keepaliveMs = idleMs / 3;
    // Checagem barata (só compara timestamps); no mínimo 1s, no máximo 15s.
    const tickMs = Math.min(15_000, Math.max(idleMs / 4, 1_000));

    const marcarAtividade = () => {
      ultimaAtividade.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, marcarAtividade, { passive: true }),
    );

    async function encerrar() {
      if (encerrando.current) return;
      encerrando.current = true;
      try {
        await apiLogout();
      } catch {
        /* cookie provavelmente já expirou no servidor — segue pro login */
      }
      // O aviso em si é exibido pela /login ao ler `expirada=1`, evitando
      // dois toasts para o mesmo evento.
      router.replace('/login?expirada=1');
    }

    function tick() {
      const agora = Date.now();
      if (agora - ultimaAtividade.current >= idleMs) {
        void encerrar();
        return;
      }
      const houveAtividade = ultimaAtividade.current > ultimoPing.current;
      if (houveAtividade && agora - ultimoPing.current >= keepaliveMs) {
        ultimoPing.current = agora;
        void apiMe();
      }
    }

    const timer = window.setInterval(tick, tickMs);
    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, marcarAtividade),
      );
    };
  }, [idleMinutes, router]);

  return null;
}
