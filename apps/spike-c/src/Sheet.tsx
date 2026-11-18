import { useRef, useState } from "react";
import { MEMORY_LIMIT_PCT, TARGET, type Params } from "./model.ts";
import { t } from "./strings.ts";

interface Props {
  params: Params;
  onChange: (p: Params) => void;
  dbLoad: number;
  open: boolean;
  onToggle: (open: boolean) => void;
}

export function Sheet({ params, onChange, dbLoad, open, onToggle }: Props) {
  const startY = useRef<number | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const dbOk = dbLoad <= TARGET;
  const memOk = params.capacityPct <= MEMORY_LIMIT_PCT;

  return (
    <section className={`sheet ${open ? "open" : ""}`} aria-label={t.sheetOpen}>
      <button
        className="handle"
        aria-expanded={open}
        onPointerDown={(e) => {
          startY.current = e.clientY;
          setDragging(true);
        }}
        onPointerUp={(e) => {
          const dy = startY.current === null ? 0 : e.clientY - startY.current;
          startY.current = null;
          setDragging(false);
          // A drag decides open or closed here and swallows the click that follows it;
          // a tap (or Enter / Space / a screen reader's activate) arrives as a click.
          dragged.current = Math.abs(dy) >= 8;
          if (dragged.current) onToggle(dy < 0);
        }}
        onClick={() => {
          if (dragged.current) dragged.current = false;
          else onToggle(!open);
        }}
        onPointerCancel={() => setDragging(false)}
      >
        <span className="grip" data-dragging={dragging} />
        <span className="summary">
          <Check ok={dbOk} label={`${t.dbLoad} ${Math.round(dbLoad * 100)}% (${t.illustrative})`} />
          <Check ok={memOk} label={t.memory} />
        </span>
      </button>
      <div className="controls" inert={!open}>
        <label>
          <span>
            {t.capacity}: <b>{params.capacityPct}</b>
          </span>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={params.capacityPct}
            onChange={(e) => onChange({ ...params, capacityPct: Number(e.target.value) })}
          />
        </label>
        <label>
          <span>
            {t.ttl}: <b>{params.ttlS}</b>
          </span>
          <input
            type="range"
            min={0}
            max={600}
            step={10}
            value={params.ttlS}
            onChange={(e) => onChange({ ...params, ttlS: Number(e.target.value) })}
          />
        </label>
        <button className="close" onClick={() => onToggle(false)}>
          {t.sheetClose}
        </button>
      </div>
    </section>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`check ${ok ? "ok" : "no"}`}>
      {ok ? "✓" : "✗"} {label}: {ok ? t.pass : t.notYet}
    </span>
  );
}
