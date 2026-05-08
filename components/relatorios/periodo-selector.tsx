"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  formatPeriodoLabel,
  mesAtual,
  mesesDisponiveis,
  semanaAtual,
  semanasDisponiveis,
} from "@/lib/mock/data";
import type { Periodo } from "@/lib/mock/types";

export type Granularidade = "semana" | "mes";

export interface PeriodoSelectorValue {
  tipo: Granularidade;
  periodo: Periodo;
}

interface Props {
  value: PeriodoSelectorValue;
  onChange: (value: PeriodoSelectorValue) => void;
  className?: string;
}

function periodoToValue(p: Periodo): string {
  return `${p.inicio}|${p.fim}`;
}

export function PeriodoSelector({ value, onChange, className }: Props) {
  const opcoes = useMemo(
    () => (value.tipo === "semana" ? semanasDisponiveis() : mesesDisponiveis()),
    [value.tipo],
  );

  function trocarTipo(tipo: Granularidade) {
    if (tipo === value.tipo) return;
    const novoPeriodo = tipo === "semana" ? semanaAtual() : mesAtual();
    onChange({ tipo, periodo: novoPeriodo });
  }

  function trocarPeriodo(serialized: string) {
    const escolhido = opcoes.find((p) => periodoToValue(p) === serialized);
    if (escolhido) onChange({ tipo: value.tipo, periodo: escolhido });
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        <Button
          type="button"
          size="sm"
          variant={value.tipo === "semana" ? "default" : "ghost"}
          onClick={() => trocarTipo("semana")}
          className="h-8 px-3"
        >
          Semana
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value.tipo === "mes" ? "default" : "ghost"}
          onClick={() => trocarTipo("mes")}
          className="h-8 px-3"
        >
          Mês
        </Button>
      </div>
      <Select
        aria-label={`Escolher ${value.tipo === "semana" ? "semana" : "mês"}`}
        className="h-9 w-auto min-w-[180px]"
        value={periodoToValue(value.periodo)}
        onChange={(e) => trocarPeriodo(e.target.value)}
      >
        {opcoes.map((p) => (
          <option key={periodoToValue(p)} value={periodoToValue(p)}>
            {formatPeriodoLabel(p, value.tipo)}
          </option>
        ))}
      </Select>
    </div>
  );
}
