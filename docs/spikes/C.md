# Spike C: mobile tune-mode prototype

Ticket S-005. Prototype in `apps/spike-c` (React 19.3.1, Vite 8.3.8, uPlot 1.6.32, @xyflow/react 12.12.1), throwaway apart from the measurements and findings. Screenshots: `docs/spikes/c-{svg,flow}-{closed,open}.png` (360 x 800 at device scale 3).

## What was built

The caching lab's tune screen: topology (users, app, cache, db), a bottom sheet with the two allowed edits (`capacity_pct` 0 to 50, `ttl_s` 0 to 600), one uPlot chart of database utilization with the 60% target line, and the lab's two checks (database below 60% in the window 180 to 600 s, cache memory at most 25%). The topology exists twice, behind a switch at the top (`#svg`, `#flow`): hand-rolled SVG and React Flow. Each variant is its own lazy chunk so its bundle cost can be read from the build.

**The model behind the screen is not the simulator.** `src/model.ts` is a closed-form stand-in (Zipf popularity, "the top ranks fit in the cache", renewal TTL, an exponential warm-up) so that the sliders move the chart. Its numbers are illustrative: baseline 84% database load, reference solution (20%, 300 s) 27%, the lab's wrong answer (TTL 600, capacity 0) stays at 84%. Learner-facing strings are hard-coded Indonesian in `src/strings.ts`, which the real app must not do (AGENTS.md language policy); acceptable here only because this is a spike.

## How C1 to C4 were read

Criteria C1 to C4 are defined in the master plan (Claude Docs), which these sessions could not read. Only "C3 = lab page JS at most 300 KB gzip" is repeated in PLAN 9.4. The rest are my operational readings and must be checked against the master plan before they are called passes:

- **C1 (fits a phone):** no horizontal scroll at 360 px; every interactive element at least 44 x 44 px; no pinch-zoom needed (the viewport meta does not disable zoom).
- **C3 (bundle):** gzip size of the JS and CSS the lab page loads, per variant.
- **C4 (responsiveness):** time from a slider change until the chart has been redrawn (two animation frames, so the floor is about 33 ms at 60 Hz), and first paint, in Chromium with main-thread CPU throttling.

Spec: `apps/spike-c/test/measure.spec.ts`, run with `npm run measure:spike-c`. Chromium 159 headless shell, emulated touch device 360 x 800, the production build served by `vite preview`, on the laptop of S-003 (Intel i5-10300H).

## Results

| Check | SVG | React Flow |
| --- | --- | --- |
| No horizontal scroll at 360 px, sheet closed and open | pass (scrollWidth 360) | pass |
| Interactive elements below 44 x 44 px | none of 8 | none of 12 (after turning off focusable edges: 2 edge groups of 88 x 34 had been counted) |
| Caching task by touch: wrong answer fails, reference solution passes both checks, capacity 50 breaks the memory rule | pass | pass |
| JS + CSS gzip for the lab page | 93.6 + 0.9 JS, 1.3 CSS = **95.8 KB** | 93.6 + 59.7 JS, 1.3 + 2.6 CSS = **157.2 KB** |
| Share of the 300 KB budget used before any engine, quiz or lab code | 32% | 52% |
| First paint, unthrottled / 4x throttle | 196 ms / 400 ms | 168 ms / 396 ms |
| Slider-to-chart-redrawn, p95, unthrottled / 4x throttle | 33.7 ms / 34.9 ms (max 48.6) | 33.6 ms / 49.6 ms (max 49.9) |

The base chunk (React, react-dom, uPlot, the sheet, the model) is 93.6 KB gzip. React Flow adds 59.7 KB JS and 2.6 KB CSS. The engine (S-003) is not in these numbers.

## Findings

- **Both variants fit and are usable at 360 px.** React Flow is not blocked by size or performance on a laptop; it costs 62 KB gzip more, a visible "React Flow" attribution (hidden only by its paid option), and a slower redraw under a 4x main-thread slowdown (p95 49.6 vs 34.9 ms; these are 3 frames vs 2, at the resolution of this measurement).
- **React Flow needed work to behave like a fixed diagram.** Dragging, panning, zooming and connecting had to be switched off, edges are focusable by default (tab stops and 88 x 34 px touch regions that do nothing), and its connection handles had to be hidden. For a tune screen with a fixed layout it adds a library to fight, not a feature.
- **The open bottom sheet hides the chart.** With the sheet open (about 55% of the screen at 360 x 800) the learner sees the topology and only the top of the chart: the tune-and-watch loop that the screen exists for needs a scroll between edit and result. The prototype only adds scroll room under the sheet. A real design needs the chart and the sliders on screen together (a smaller sheet with the two sliders at about 200 px, a shorter topology while the sheet is open, or the chart inside the sheet).
- **Summary rows in the closed sheet worked:** the two checks (database load with its value, memory rule) are readable without opening the sheet, so the learner sees pass or fail after every edit with the sheet closed.
- **uPlot with the cursor off** avoids touch conflicts with page scroll. Its first y-axis label was clipped ("00%") until the axis size was raised to 46 px; label widths need a check per metric type.
- **Hit targets:** range inputs at 44 px height are enough to reach the reference solution by touch in the automated task; whether a thumb can hit "20%" precisely on 0 to 50 with step 1 is a question for the phone trial (C2).

## Recommendation (input for SG0, OD-8)

SVG: 62 KB less to load, no library API to suppress, and the same visual result at 360 px. React Flow would only pay for itself for features the plan puts out of scope for v1 (a free canvas, D2). The owner decides at SG0 (S-007).

## C2: the owner's phone trial (S-008)

The task: on the phone, in the SVG variant and then the React Flow variant, finish the caching tune task (database load below 60% with the memory rule green) **without pinch-zoom**.

1. On this laptop: `npm run dev -w @sdsim/spike-c`. It serves on port 5174 on all interfaces. The firewall on this machine is running; allow the port first (`sudo firewall-cmd --add-port=5174/tcp`), and remove it afterwards (`sudo firewall-cmd --remove-port=5174/tcp`). Phone and laptop must be on the same network.
2. On the phone open `http://<laptop-ip>:5174/#svg`, then `http://<laptop-ip>:5174/#flow`.
3. Write down in S-008 Notes: phone model and browser; for each variant, time to pass and whether pinch-zoom or a retry was needed; whether the sheet hides what you need; whether any control was hard to hit; whether the text is readable.

Not measured by this spike: any real phone, any network (the build was served locally), Safari and Firefox, one-handed use.
