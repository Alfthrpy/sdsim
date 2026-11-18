# Spike C: mobile tune-mode prototype

Ticket S-005. Prototype in `apps/spike-c` (React 19.3.1, Vite 8.3.8, uPlot 1.6.32, @xyflow/react 12.12.1), throwaway apart from the measurements and findings. Screenshots: `docs/spikes/c-{svg,flow}-{closed,open,open-800,open-640}.png` (360 wide, device scale 3).

## What was built

The caching lab's tune screen: topology (users, app, cache, db), a bottom sheet with the two allowed edits (`capacity_pct` 0 to 50, `ttl_s` 0 to 600), one uPlot chart of database utilization with the 60% target line, and two of the lab's checks (database at or below 60% in the window 180 to 600 s, cache memory at most 25%). The lab's `error_rate` target and the `pool-tetap` rule are not in the prototype, so "passes both checks" means these two. The topology exists twice behind a switch (`#svg`, `#flow`): hand-rolled SVG and React Flow, each its own lazy chunk so its bundle cost can be read from the build.

**The model behind the screen is not the simulator.** `src/model.ts` is a closed-form stand-in (Zipf popularity, a perfect-LFU "the top ranks fit" idealization, renewal TTL, an exponential warm-up) so the sliders move the chart. Baseline (0 %, 30 s) gives 84% database load, the reference solution (20 %, 300 s) 27%, the lab's wrong answer (0 %, 600 s) 84%, (50 %, 300 s) 23% with the memory rule red; the 84% can be derived by hand: (144 x 20 + 16 x 30) / 1000 / 4. The screen marks the cache hit ratio, the database load (node, check line) and the chart caption as "ilustratif". Learner-facing strings are hard-coded Indonesian in `src/strings.ts` (plus an `aria-label` and the check glyphs), which the real app must not do (AGENTS.md language policy); acceptable here only because this is a spike.

**The stand-in makes the task easy.** Over all slider combinations the database check passes in 96% of them (it fails only at capacity 0 or TTL 0). Finishing the task therefore tests whether a thumb can reach and use the controls, not whether it can be precise; and "pass or fail visible after every edit" was exercised across only one boundary. A phone trial that tests precision needs the real engine (S-070) or a narrower feasible region.

## How C1 to C4 were read

Criteria C1 to C4 are defined in the master plan (Claude Docs), which these sessions could not read. Only "lab page JS at most 300 KB gzip" is repeated in PLAN 9.4 (as C3). The rest are my operational readings and must be checked against the master plan before they are called passes:

- **C1 (fits a phone):** no horizontal scroll at 360 px; every interactive element a thumb or a keyboard can reach at least 44 x 44 px (no exclusions in the scan; elements inside an `inert` subtree are not reachable and are skipped); chart and sliders usable together; no pinch-zoom needed (the viewport meta does not disable zoom; read from `index.html`, not asserted by a test).
- **C3 (bundle):** gzip size of the JS the lab page loads per variant; CSS is reported separately and in the total.
- **C4 (responsiveness):** the time from a slider change until two animation-frame callbacks have run (a floor of about 33 ms at 60 Hz, and it does not prove the chart pixels changed), the synchronous cost of the update (dispatch until the microtask queue drains), and first contentful paint, in Chromium with main-thread CPU throttling. Each row is three loads of the page on one machine.

Spec: `apps/spike-c/test/measure.spec.ts` (`npm run measure:spike-c`, builds and serves the production build on 127.0.0.1:5175). Chromium 159 headless shell, emulated touch device 360 x 800, the laptop of S-003 (Intel i5-10300H).

## Results

| Check | SVG | React Flow |
| --- | --- | --- |
| No horizontal scroll at 360 px, sheet closed and open | pass | pass |
| Interactive elements below 44 x 44 px (all reachable ones, 5 closed / 8 open in SVG, 6 / 9 in Flow) | none | **one: React Flow's own attribution link, 50 x 14 px**; it navigates away from the lab |
| Keyboard: Enter and Space open and close the sheet; controls of a closed sheet are not focusable | pass | pass |
| With the sheet open, the chart, its caption and both sliders are in view together | pass at 360 x 800 (sheet 37% of the height, chart 279 to 469, sheet top 505) and at 360 x 640 (sheet 46%, chart 119 to 309, sheet top 345) | same |
| Caching task, programmatic slider events (sheet opened by tap): wrong answer fails, reference solution passes, capacity 50 breaks the memory rule | pass | pass |
| Thumb precision, one real touch tap per slider at a position computed from an assumed 16 px thumb: target 20 (0 to 50) and 300 (0 to 600) | hit exactly | hit exactly |
| JS gzip for the lab page (base 93.8 KB + variant) | 94.7 KB (31.6% of 300 KB) | 153.5 KB (51.2%) |
| JS + CSS gzip | 96.1 KB (32.0%) | 157.4 KB (52.5%) |
| Slider change, two-frame latency p95 (three loads), unthrottled | 33.6, 33.6, 33.6 ms | 33.6, 33.5, 33.7 ms |
| Same at 4x main-thread throttle | 38.4, 34.1, 33.9 ms (max 44.4) | 38.6, 33.9, 62.0 ms (max 63.6) |
| Synchronous update cost p95, unthrottled / 4x | 4.3 to 5.9 ms / 8.8 to 16.9 ms | 6.0 to 9.7 ms / 12.2 to 22.5 ms |
| First contentful paint after a reload, unthrottled / 4x | 48 to 128 ms / 120 to 224 ms | 56 to 116 ms / 80 to 240 ms |

The base chunk (React, react-dom, uPlot, the sheet, the model) is 93.8 KB gzip; React Flow adds 59.7 KB JS and 2.6 KB CSS (the net difference between the two pages is 61.3 KB JS, 61.3 KB with CSS). KB are 1000 bytes as Vite reports them. The engine is not in these numbers.

## Findings

- **Both variants fit and are usable at 360 px.** The two-frame latency is the same unthrottled; under a 4x main-thread slowdown React Flow had one run in three at about 62 ms (4 frames) and SVG did not, but the metric cannot separate them reliably (p50 is identical, runs vary). Treat the redraw as "no difference shown", not as an advantage for SVG. React Flow's synchronous update cost is higher (6 to 10 ms vs 4 to 6 ms unthrottled).
- **React Flow needed work to behave like a fixed diagram.** Dragging, panning, zooming and connecting were switched off, edges and nodes made unfocusable, handles hidden. Its attribution link (50 x 14 px, required unless a paid option is used) stays visible and is below the 44 px target.
- **The open bottom sheet hid the chart until the page scrolled to it.** The sheet is 295 px: 37% of a 800 px screen, 46% of a 640 px screen; at 640 an unscrolled page showed no chart at all. The prototype now scrolls the page to the bottom when the sheet opens, so chart and sliders are visible together (table), at the price that the topology and header scroll out of view while editing. The learner cannot see the node bars react while tuning; the closed-sheet check lines and the chart are what they watch. A design that keeps the topology in view (smaller sheet, chart inside the sheet) is not tried.
- **Closed-sheet summary rows work:** both checks (database load with its value, memory rule) are readable without opening the sheet, with a mark and text, not color alone.
- **The first version had defects found by review, now fixed and covered by specs:** the handle responded only to pointer events (Enter and Space did nothing, and controls of the closed sheet stayed focusable off-screen), the y-axis label "100%" was clipped to "00%", and only the cache node carried the "ilustratif" badge. The database bar in the SVG variant also had no number and no 60% mark; both added.
- **uPlot with the cursor off** avoids touch conflicts with page scroll. The chart has a visible caption with the target line and the "ilustratif" badge; it has no text alternative beyond its title (a screen-reader user gets no values).
- Text sizes of 11 to 12 px (axis labels, notes) and 14 px (header) are small for outdoor phone use; not tested with a larger system font scale.

## Recommendation (input for SG0, OD-8)

SVG, tentatively. Supported by the evidence: 61 KB less to load, no library behavior to suppress, no 50 x 14 px link under a node, lower synchronous update cost. Not supported by the evidence: that the two look the same (React Flow's database node shows a number, the SVG node a bar plus a number), and that hand-written SVG scales: the four-node layout is hard-coded in `TopologySvg.tsx`, and a real topology with more nodes and long labels ("Antrian pesan") is exactly where React Flow would earn its weight. Not measured: widths other than 360 (320, 412), Safari and Firefox, a real phone, the 300 KB budget with the engine and quiz included. The owner decides at SG0 (S-007).

## C2: the owner's phone trial (S-008)

The task: on the phone, in the SVG variant and then the React Flow variant, finish the caching tune task (database load at or below 60% with the memory rule green) **without pinch-zoom**. Because the stand-in model passes for almost any non-zero slider values, also do the precision drill: set capacity to exactly 20 and TTL to exactly 300 with your thumb, and note how many attempts that took.

1. On this laptop: `npm run dev -w @sdsim/spike-c`. It serves on port 5174 on all interfaces. The firewall on this machine is running; allow the port first (`sudo firewall-cmd --add-port=5174/tcp`) and remove it afterwards (`sudo firewall-cmd --remove-port=5174/tcp`). Phone and laptop must be on the same network. (The automated measurement uses port 5175 on 127.0.0.1, so both can run at once.)
2. On the phone open `http://<laptop-ip>:5174/#svg`, then `http://<laptop-ip>:5174/#flow`.
3. Write down in S-008 Notes: phone model and browser; for each variant, time to pass and whether pinch-zoom or a retry was needed; the number of attempts for the precision drill; whether the sheet hides what you need and whether the page scrolling on open helps or confuses; whether any control was hard to hit; whether the text is readable.

Not measured by this spike: any real phone, any network (the build was served locally), Safari and Firefox, one-handed use, a larger font scale.
