import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { TARGET, type Series } from "./model.ts";
import { t as text } from "./strings.ts";

export function Chart({ series }: { series: Series }) {
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);

  useEffect(() => {
    const el = host.current as HTMLDivElement;
    const data: uPlot.AlignedData = [series.t, series.util, series.t.map(() => TARGET)];
    const instance = new uPlot(
      {
        width: el.clientWidth,
        height: 190,
        cursor: { show: false },
        legend: { show: false },
        scales: { y: { range: [0, 1.1] } },
        axes: [
          { size: 28, font: "11px system-ui", values: (_u, v) => v.map((x) => `${x}s`) },
          {
            size: 46,
            font: "11px system-ui",
            values: (_u, v) => v.map((x) => `${Math.round(x * 100)}%`),
          },
        ],
        series: [
          {},
          { label: text.chartTitle, stroke: "#2563eb", width: 2 },
          { label: text.target, stroke: "#dc2626", width: 1, dash: [6, 4] },
        ],
      },
      data,
      el,
    );
    plot.current = instance;
    const observer = new ResizeObserver(() =>
      instance.setSize({ width: el.clientWidth, height: 190 }),
    );
    observer.observe(el);
    performance.mark("chart-ready");
    return () => {
      observer.disconnect();
      instance.destroy();
    };
    // The instance is created once; data changes go through setData below.
  }, []);

  useEffect(() => {
    plot.current?.setData([series.t, series.util, series.t.map(() => TARGET)]);
  }, [series]);

  return (
    <>
      <div ref={host} className="chart" aria-label={text.chartTitle} role="img" />
      <p className="caption">
        <span className="key blue" /> {text.chartTitle} · <b>{text.illustrative}</b> ·{" "}
        <span className="key red" /> {text.target}
      </p>
    </>
  );
}
