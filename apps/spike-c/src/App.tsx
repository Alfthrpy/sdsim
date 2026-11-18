import { lazy, Suspense, useMemo, useState } from "react";
import { Chart } from "./Chart.tsx";
import { simulate, windowMean, type Params } from "./model.ts";
import { Sheet } from "./Sheet.tsx";
import { t } from "./strings.ts";

// Each topology variant is its own chunk, so the bundle cost of one over the other can be read from the build.
const TopologySvg = lazy(() =>
  import("./TopologySvg.tsx").then((m) => ({ default: m.TopologySvg })),
);
const TopologyFlow = lazy(() =>
  import("./TopologyFlow.tsx").then((m) => ({ default: m.TopologyFlow })),
);

type Variant = "svg" | "flow";
const initialVariant = (): Variant => (location.hash === "#flow" ? "flow" : "svg");

export function App() {
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [params, setParams] = useState<Params>({ capacityPct: 0, ttlS: 30 });
  const [open, setOpen] = useState(false);
  const series = useMemo(() => simulate(params), [params]);
  const dbLoad = windowMean(series);
  const hit = series.hit[series.hit.length - 1] as number;

  const pick = (v: Variant) => {
    location.hash = v;
    setVariant(v);
  };
  const Topology = variant === "svg" ? TopologySvg : TopologyFlow;

  return (
    <main className={open ? "sheet-open" : undefined}>
      <header>
        <h1>{t.title}</h1>
        <p>{t.goal}</p>
        <div className="segmented" role="tablist">
          {(["svg", "flow"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={variant === v} onClick={() => pick(v)}>
              {v === "svg" ? t.variantSvg : t.variantFlow}
            </button>
          ))}
        </div>
      </header>
      <Suspense fallback={<div className="topology" />}>
        <Topology dbLoad={dbLoad} hit={hit} onSelect={() => setOpen(true)} />
      </Suspense>
      <Chart series={series} />
      <Sheet params={params} onChange={setParams} dbLoad={dbLoad} open={open} onToggle={setOpen} />
    </main>
  );
}
