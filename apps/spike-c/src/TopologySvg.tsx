import { t } from "./strings.ts";

interface Props {
  dbLoad: number;
  hit: number;
  onSelect: () => void;
}

const NODES = [
  { id: "users", x: 110, y: 8, label: t.nodes.users },
  { id: "app", x: 110, y: 96, label: t.nodes.app },
  { id: "cache", x: 20, y: 192, label: t.nodes.cache },
  { id: "db", x: 200, y: 192, label: t.nodes.db },
] as const;
const EDGES = [
  ["users", "app"],
  ["app", "cache"],
  ["app", "db"],
] as const;

export function TopologySvg({ dbLoad, hit, onSelect }: Props) {
  const find = (id: string) => NODES.find((n) => n.id === id)!;
  return (
    <svg viewBox="0 0 360 260" className="topology" role="group" aria-label="Topologi">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10z" fill="#64748b" />
        </marker>
      </defs>
      {EDGES.map(([a, b]) => {
        const from = find(a);
        const to = find(b);
        return (
          <line
            key={a + b}
            x1={from.x + 70}
            y1={from.y + 56}
            x2={to.x + 70}
            y2={to.y}
            stroke="#64748b"
            strokeWidth={2}
            markerEnd="url(#arrow)"
          />
        );
      })}
      {NODES.map((n) => {
        const tappable = n.id === "cache" || n.id === "db";
        return (
          <g
            key={n.id}
            role={tappable ? "button" : undefined}
            tabIndex={tappable ? 0 : undefined}
            onClick={tappable ? onSelect : undefined}
            onKeyDown={
              tappable ? (e) => (e.key === "Enter" || e.key === " ") && onSelect() : undefined
            }
            style={{ cursor: tappable ? "pointer" : "default" }}
          >
            <rect
              x={n.x}
              y={n.y}
              width={140}
              height={56}
              rx={10}
              fill="#f1f5f9"
              stroke="#334155"
              strokeWidth={2}
            />
            <text
              x={n.x + 70}
              y={n.y + 24}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fill="#0f172a"
            >
              {n.label}
            </text>
            {n.id === "db" && <Bar x={n.x + 10} y={n.y + 36} width={120} value={dbLoad} />}
            {n.id === "cache" && (
              <text x={n.x + 70} y={n.y + 46} textAnchor="middle" fontSize={12} fill="#475569">
                {t.hit} {Math.round(hit * 100)}% · {t.illustrative}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Bar({ x, y, width, value }: { x: number; y: number; width: number; value: number }) {
  const v = Math.min(1, value);
  return (
    <>
      <rect x={x} y={y} width={width} height={8} rx={4} fill="#cbd5e1" />
      <rect
        x={x}
        y={y}
        width={width * v}
        height={8}
        rx={4}
        fill={value > 0.6 ? "#dc2626" : "#16a34a"}
      />
    </>
  );
}
