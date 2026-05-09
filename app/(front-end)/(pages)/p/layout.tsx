import { AppShell } from "@/components/layouts/app-shell";
import { MissingProfileBanner } from "@/components/paciente/missing-profile-banner";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <MissingProfileBanner />
      {children}
    </AppShell>
  );
}
