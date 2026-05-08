import { AppShell } from "@/components/layouts/app-shell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
