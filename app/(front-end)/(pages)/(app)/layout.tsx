import { AppShell } from "@/components/layouts/app-shell";
import { PatientRedirect } from "@/components/layouts/patient-redirect";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PatientRedirect />
      {children}
    </AppShell>
  );
}
