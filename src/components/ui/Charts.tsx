import { formatUzs } from '../../i18n/translations.ts';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({ data, height = 24 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const palette = ['#1E40AF', '#EA580C', '#0F766E', '#475569', '#0284C7', '#D97706', '#334155', '#64748B'];

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const pct = Math.max(4, Math.round((item.value / max) * 100));
        const fill = item.color || palette[idx % palette.length];
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs gap-4">
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.label}</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 shrink-0">
                {formatUzs(item.value)}
              </span>
            </div>
            <div
              className="w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden"
              style={{ height: `${Math.max(8, height / 2)}px` }}
            >
              <div
                className="h-full rounded transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutBreakdownChart({
  materialsUzs,
  laborUzs,
  otherUzs,
  labels,
}: {
  materialsUzs: number;
  laborUzs: number;
  otherUzs: number;
  labels: { materials: string; labor: string; other: string };
}) {
  const total = Math.max(1, materialsUzs + laborUzs + otherUzs);
  const matPct = Math.round((materialsUzs / total) * 100);
  const labPct = Math.round((laborUzs / total) * 100);
  const othPct = Math.max(0, 100 - matPct - labPct);

  const r = 54;
  const c = 2 * Math.PI * r;
  const matDash = (matPct / 100) * c;
  const labDash = (labPct / 100) * c;
  const othDash = (othPct / 100) * c;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="18" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#1E40AF"
            strokeWidth="18"
            strokeDasharray={`${matDash} ${c}`}
            strokeDashoffset={0}
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#EA580C"
            strokeWidth="18"
            strokeDasharray={`${labDash} ${c}`}
            strokeDashoffset={-matDash}
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#64748B"
            strokeWidth="18"
            strokeDasharray={`${othDash} ${c}`}
            strokeDashoffset={-(matDash + labDash)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">100%</span>
          <span className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">UZS</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-[#1E40AF] shrink-0" />
            {labels.materials} ({matPct}%)
          </span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatUzs(materialsUzs)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-[#EA580C] shrink-0" />
            {labels.labor} ({labPct}%)
          </span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatUzs(laborUzs)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-slate-500 shrink-0" />
            {labels.other} ({othPct}%)
          </span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatUzs(otherUzs)}</span>
        </div>
      </div>
    </div>
  );
}
