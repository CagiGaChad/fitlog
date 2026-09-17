export function BarChart({ data, goal }: { data: { date: string; calories: number }[]; goal: number }) {
  const w = 300;
  const h = 150;
  const padTop = 6;
  const padBottom = 16;
  const gap = 3;
  const chartH = h - padTop - padBottom;
  const barW = (w - gap * (data.length - 1)) / data.length;
  const maxVal = Math.max(goal, ...data.map((d) => d.calories), 1) * 1.15;
  const goalY = padTop + chartH - (goal / maxVal) * chartH;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[150px]">
      <line x1={0} y1={goalY.toFixed(1)} x2={w} y2={goalY.toFixed(1)} stroke="var(--amber)" strokeWidth="1" strokeDasharray="3,3" />
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const barH = (d.calories / maxVal) * chartH;
        const y = padTop + chartH - barH;
        const over = d.calories > goal;
        const dow = new Date(d.date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "narrow" });
        return (
          <g key={d.date}>
            <rect
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              width={Math.max(barW - 1, 1).toFixed(1)}
              height={barH.toFixed(1)}
              rx="2"
              fill={over ? "var(--danger)" : "var(--accent)"}
            />
            <text x={(x + barW / 2).toFixed(1)} y={h - 4} fontSize="8" textAnchor="middle" fill="var(--text-dim)">
              {dow}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
