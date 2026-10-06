'use client';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: 'accent' | 'herb' | 'steel' | 'amber' | 'danger';
  height?: number;
}

const colorMap = {
  accent: 'bg-accent',
  herb: 'bg-herb',
  steel: 'bg-steel',
  amber: 'bg-amber',
  danger: 'bg-danger'
};

export function BarChart({ data, color = 'accent', height = 160 }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barColor = colorMap[color];

  return (
    <div className="flex items-end gap-2.5" style={{ height: `${height}px` }}>
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0">
          {item.value > 0 && (
            <span className="text-xs font-mono font-semibold text-ink-soft whitespace-nowrap">
              {item.value >= 1000 ? (item.value / 1000).toFixed(1) + 'k' : item.value}
            </span>
          )}
          <div
            className={`${barColor} w-full max-w-[30px] rounded-t transition-all duration-500`}
            style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }}
          />
          <span className="text-[10px] font-mono text-muted whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}