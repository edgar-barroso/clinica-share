import type { ReactNode } from "react";
import { PatientBottomNav } from "./patient-bottom-nav";
import { PrototypeBanner } from "./prototype-banner";
import { RoleSwitcher } from "./role-switcher";

export function PatientShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PrototypeBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-end px-4 pt-3">
          <RoleSwitcher />
        </div>
        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      </div>
      <PatientBottomNav />
    </div>
  );
}
