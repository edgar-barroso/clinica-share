"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  apiDetalheConsultorio,
  type DetalheConsultorioResponse,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultorioId: string | null;
  nomeFallback: string;
  dataInicio: string;
  dataFim: string;
}

const MODALIDADE_LABEL: Record<"aluguel_fixo" | "percentual", string> = {
  aluguel_fixo: "Aluguel fixo",
  percentual: "Percentual",
};

export function ConsultorioDetalheModal(props: Props) {
  if (!props.open || !props.consultorioId) return null;
  return <Inner {...props} consultorioId={props.consultorioId} />;
}

function Inner({
  onOpenChange,
  consultorioId,
  nomeFallback,
  dataInicio,
  dataFim,
}: Props & { consultorioId: string }) {
  const [detalhe, setDetalhe] = useState<DetalheConsultorioResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiDetalheConsultorio(consultorioId, { dataInicio, dataFim })
      .then((res) => {
        if (!cancelled) setDetalhe(res);
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [consultorioId, dataInicio, dataFim]);

  const nome = detalhe?.consultorio.nome ?? nomeFallback;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalhe-consultorio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-6">
          <div className="min-w-0">
            <h2
              id="detalhe-consultorio-title"
              className="truncate text-lg font-semibold"
            >
              {nome}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Detalhamento de atendimentos no período
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={20}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : !detalhe ? (
            <p className="text-center text-sm text-muted-foreground">
              Sem dados disponíveis.
            </p>
          ) : detalhe.atendimentos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum atendimento neste consultório no período.
            </p>
          ) : (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Atendimentos</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {detalhe.totais.qtdAtendimentos}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Aluguel fixo
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatBRL(Number(detalhe.porModalidade.aluguelFixo.valor))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detalhe.porModalidade.aluguelFixo.qtdAtendimentos}{" "}
                    atendimentos
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatBRL(Number(detalhe.porModalidade.percentual.valor))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detalhe.porModalidade.percentual.qtdAtendimentos}{" "}
                    atendimentos
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">
                  Profissionais que utilizaram
                </h3>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead className="text-right">
                          Atendimentos
                        </TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalhe.porProfissional.map((p) => (
                        <TableRow key={p.profissionalId}>
                          <TableCell className="font-medium">
                            {p.nome}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {MODALIDADE_LABEL[p.modalidade]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.qtdAtendimentos}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatBRL(Number(p.valorGerado))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">
                  Atendimentos no período
                </h3>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Profissional</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalhe.atendimentos.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="tabular-nums">
                            {formatDate(a.data, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {a.hora}
                          </TableCell>
                          <TableCell>{a.profissionalNome}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatBRL(Number(a.valorConsulta))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
