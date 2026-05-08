"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  clientId: string;
}

export function GoogleProvider({ children, clientId }: Props) {
  if (!clientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
