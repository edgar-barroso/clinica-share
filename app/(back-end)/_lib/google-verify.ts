import { OAuth2Client } from "google-auth-library";
import { env } from "@/lib/env";
import { ProvedorGoogleInvalido } from "./errors";

const client = new OAuth2Client(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new ProvedorGoogleInvalido();
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      picture: payload.picture,
    };
  } catch (err) {
    if (err instanceof ProvedorGoogleInvalido) throw err;
    throw new ProvedorGoogleInvalido();
  }
}
