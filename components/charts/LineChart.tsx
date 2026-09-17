export function LineChart({ values }: { values: number[] }) {
  const w = 300;
  const h = 120;
  const pad = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const coords = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = coords.map((c, i) => (i === 0 ? "M" : "L") + c[0].toFixed(1) + "," + c[1].toFixed(1)).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px]">
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {coords.map((c, i) => (
          <circle key={i} cx={c[0].toFixed(1)} cy={c[1].toFixed(1)} r="2.5" fill="var(--accent)" />
        ))}
      </svg>
      <div className="flex justify-between text-[13px] text-dim">
        <span>{min.toFixed(1)} kg</span>
        <span>{max.toFixed(1)} kg</span>
      </div>
    </div>
  );
}
