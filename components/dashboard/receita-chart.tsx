"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/format";

interface Point {
  dia: string;
  receita: number;
}

export function ReceitaChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 24% 92%)" vertical={false} />
          <XAxis
            dataKey="dia"
            tickLine={false}
            axisLine={false}
            stroke="hsl(215 16% 47%)"
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="hsl(215 16% 47%)"
            fontSize={12}
            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(1)}k`}
            width={60}
          />
          <Tooltip
            cursor={{ fill: "hsl(210 40% 96%)" }}
            formatter={(value) => [formatBRL(Number(value) || 0), "Receita"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(214 24% 92%)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="receita" fill="hsl(217 98% 57%)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
