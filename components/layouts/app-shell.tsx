import type { ReactNode } from 'react';
import { SESSION_IDLE_MINUTES } from '@/lib/session-idle';
import { IdleSessionGuard } from './idle-session-guard';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({ children }: { children: ReactNode }) {
  // Layout fixo: o root ocupa exatamente a viewport (h-screen, overflow-hidden).
  // Sidebar e Topbar não rolam — só o <main> rola, o conteúdo principal sim.
  //
  // `SESSION_IDLE_MINUTES` é lido aqui (Server Component) e passado por prop:
  // é env var server-side, não existe no bundle do cliente.
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IdleSessionGuard idleMinutes={SESSION_IDLE_MINUTES} />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
