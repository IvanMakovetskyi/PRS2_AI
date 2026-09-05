interface EmptyChartProps {
  title: string;
  description: string;
  variant: "rolling" | "length";
}

export function EmptyChart({ title, description, variant }: EmptyChartProps) {
  return (
    <div className="empty-chart">
      <div className="empty-chart__heading">
        <strong>{title}</strong>
        <span>No data</span>
      </div>
      <svg viewBox="0 0 400 120" role="img" aria-label={`${title}. ${description}`}>
        <line x1="24" y1="96" x2="382" y2="96" />
        <line x1="24" y1="18" x2="24" y2="96" />
        {[44, 70].map((y) => (
          <line x1="24" y1={y} x2="382" y2={y} className="chart-gridline" key={y} />
        ))}
        {variant === "rolling" ? (
          <path d="M36 80 C100 80, 128 48, 190 62 S290 44, 366 50" />
        ) : (
          <g>
            {[55, 105, 155, 205, 255, 305].map((x, index) => (
              <rect x={x} y={92 - index * 2} width="22" height={4 + index * 2} key={x} />
            ))}
          </g>
        )}
      </svg>
      <p>{description}</p>
    </div>
  );
}
