import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/app/(back-end)/_lib/password";
import { signAuthToken } from "@/app/(back-end)/_lib/jwt";

/**
 * Cria um usuário de teste com role específico e retorna `{ user, token }`
 * — token assinado pode ser passado direto ao `withAuthCookie` em requests.
 */
export async function createUserWithRole(
  role: Role,
  email = `${role}-${Date.now()}@example.com`,
) {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("senha-forte-123"),
      role,
    },
  });
  const token = signAuthToken({ userId: user.id, role: user.role });
  return { user, token };
}
