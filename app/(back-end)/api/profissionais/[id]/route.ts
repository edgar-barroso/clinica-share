import { NextRequest, NextResponse } from "next/server";
import { updateProfissionalSchema, type UpdateProfissionalInput } from "../_schemas";
import { getProfissional } from "@/app/(back-end)/_usecases/profissional/get";
import {
  CONTRACT_FIELDS,
  updateProfissional,
} from "@/app/(back-end)/_usecases/profissional/update";
import { deactivateProfissional } from "@/app/(back-end)/_usecases/profissional/deactivate";
import { requireRole, requireUser } from "@/app/(back-end)/_lib/require-role";
import { NaoAutorizado } from "@/app/(back-end)/_lib/errors";
import { handleError } from "@/app/(back-end)/_lib/handle-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Campos que só o admin altera. Contrato e repasse são cadastrados pela
 * clínica (FI01/FI02) — o profissional não configura as próprias regras de
 * pagamento. `ativo` entra na lista porque desativar profissional é o DELETE
 * desta rota, que já é admin-only.
 */
const CAMPOS_SO_ADMIN = [...CONTRACT_FIELDS, "ativo"] as const;

/**
 * Autorização por campo: recusa o PATCH se ele *menciona* qualquer campo de
 * admin, mesmo repetindo o valor atual. Rejeitar por presença (em vez de por
 * diff) mantém o contrato da API explícito — quem não pode mexer recebe 403 em
 * vez de ter o campo silenciosamente ignorado.
 */
function assertNaoTocaCamposDeAdmin(input: UpdateProfissionalInput) {
  const bloqueados = CAMPOS_SO_ADMIN.filter((campo) => input[campo] !== undefined);
  if (bloqueados.length > 0) {
    throw new NaoAutorizado(
      `Somente o admin altera contrato e repasse (${bloqueados.join(", ")})`,
    );
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin", "auxiliar", "profissional", "atendente"]);
    const { id } = await ctx.params;
    const profissional = await getProfissional(id);
    return NextResponse.json({ profissional });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    // requireUser pq audit log precisa do user para snapshot do nome — e pq o
    // gate do profissional depende do `profissionalId` vinculado ao User.
    const user = await requireUser(req, ["admin", "profissional"]);
    const { id } = await ctx.params;
    // RF-023: profissional mexe só no próprio cadastro.
    if (user.role === "profissional" && user.profissionalId !== id) {
      throw new NaoAutorizado("Você só pode editar o próprio cadastro");
    }
    const body = await req.json();
    const input = updateProfissionalSchema.parse(body);
    if (user.role !== "admin") assertNaoTocaCamposDeAdmin(input);
    const profissional = await updateProfissional(id, input, user);
    return NextResponse.json({ profissional });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    requireRole(req, ["admin"]);
    const { id } = await ctx.params;
    const profissional = await deactivateProfissional(id);
    return NextResponse.json({ profissional });
  } catch (err) {
    return handleError(err);
  }
}
