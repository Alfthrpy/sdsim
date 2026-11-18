# Lab flow: case, play, tune, check

Ticket S-103. Status: proposal for owner approval (`review: human`). Motivation: the owner tried the spike C prototype on a phone (2026-11-18) and could not tell what the screen was about: a fixed bar and a chart, no story, nothing happening, no moment of "this is what is broken".

## 1. The flow

```
Kasus  ->  Play (baseline)  ->  Tune  ->  Play (your design)  ->  Check  ->  Debrief
 why        see it break        edit      see it hold or break    targets    why it works
```

1. **Case**: a short story and the one-sentence goal. Who the users are, what changes (a traffic spike, a launch), what the symptom is.
2. **Play the baseline first**: the learner watches the unmodified system run through the case and sees it fail. This is the missing "what is broken" moment. It costs one tap.
3. **Tune**: the lab's allowed edits (a bottom sheet on a phone). Edits are cheap and do not run anything.
4. **Play again** with the edits: the same run, the same seed, so any difference comes from the edits.
5. **Check**: per-target value against threshold, structural rules, a one-line mechanism (what the engine measured), tiered hints. This is S-068.
6. **Debrief**: the explanation, shown after a pass or after the hint tiers are exhausted (A4 rule, MP 6.3).

Play and Check use the same run: a run is graded over K = 5 seeds (as in PLAN), and play shows seed 1 of those K, so what the learner watches is one of the runs that was graded, not a separate simulation.

## 2. Play as a replay of a recorded run (not a second simulation)

The engine runs the whole case in skip mode (PLAN 3.1; spike A: about 2.6 s for 5 seeds of 5 M events on a laptop, and a 600 s case at 80 to 240 requests/s is about 0.1 M requests, which is under 1 M events at a few events per hop: well inside that budget). Play then **replays the recording**:

- The recorder (S-021) already needs 1 s buckets per node. Play needs, per bucket and node: utilization, queue length, in-flight, completed, errors, timeouts, p50 and p99 latency; per edge: requests per second. Small: 600 buckets x 4 nodes.
- The UI shows a timeline with play, pause, speed (1x, 10x, 60x: the 10-minute case plays in 10 s at 60x) and a scrubber. Replay is deterministic and can be paused, rewound and compared, which a live stream cannot.
- Node state is derived from the buckets, not drawn by hand:

| State | Meaning | Rule (illustrative thresholds, labelled as such) |
| --- | --- | --- |
| ok (green) | keeping up | utilization below 70% and errors below 1% |
| strained (amber) | keeping up with a long wait | utilization 70% or more, or a queue present for 10 s |
| failing (red) | dropping or timing out requests | errors 5% or more, or utilization 95% or more with the queue still growing |

The state needs a label as well as a color (a mark and a word, not color alone). Thresholds belong in the contract as an `illustrative` metric `node_status`.

- Later, not in the MVP: sampled request tokens moving along the edges (at most 200, as in PLAN 3.1) and a live mode. S-063 stays where it is; the new ticket below is the replay.

## 3. What "crash" can and cannot show

Play can only show what the model produces. In the current `caching-basics` lab the baseline runs the database at about 84% utilization (the prototype's stand-in gave the same figure by hand arithmetic; the engine will confirm): the node is **strained** (long waits), not failing. A learner will see an amber database, not a red one. That is honest, and also a weak first impression.

To make the baseline visibly fail, the case needs a load that overloads the database without a cache. With the lab's numbers, a flash-sale peak of 240 requests/s instead of 160 gives about 126% utilization (216 reads x 20 ms + 24 writes x 30 ms over 4 connections), so the queue grows without bound, requests time out after 2 s and the client error rate climbs. That changes the lab's calibration, which `sdlab` owns; proposal only (section 6).

## 4. Screens (360 x 800, wireframes)

```
 CASE                     PLAY                       TUNE (sheet open)
+----------------+     +----------------+         +----------------+
| Warung Kita    |     | [Pengguna] ok  |         | [Pengguna] ok  |
| flash sale...  |     |    |           |         |    |           |
| Tujuan: ...    |     | [Aplikasi] ok  |         | [Aplikasi] ok  |
|                |     |   /      \     |         |   /      \     |
|                |     | [Cache]  [DB]  |         | [Cache]  [DB]  |
| [ Lihat sistem |     |  ok    GAGAL   |         |        ^ 84%   |
|   berjalan ]   |     |                |         | grafik DB      |
+----------------+     | ---o---------- |         +----------------+
                       | 02:10  [>] 60x |         | Kapasitas  --o |
                       +----------------+         | TTL        --o |
                       | Lanjut: Atur   |         | [ Putar ]      |
                       +----------------+         +----------------+
```

- Play has the topology on top with node state, a one-line event caption that changes with the timeline ("menit 2: trafik naik dua kali lipat", "menit 3: antrean database menumpuk"), the timeline, and one primary button to continue.
- The chart (database utilization with the target line) sits under the timeline and moves with it; the sheet from spike C is reused for Tune. Spike C's finding stays: chart and sliders must be visible together when the sheet is open.
- Learner text in these screens comes from `contract/i18n/id.yaml` (chrome, node state words) and the lab spec (case, captions); this document's Indonesian is a proposal.

## 5. Contract and engine consequences

Proposed additions, to go into S-010 (the schema is not started, so this costs one field list instead of a breaking change later):

| Where | Field | Purpose |
| --- | --- | --- |
| lab spec | `scenario.story` | the case text (Indonesian, owned by sdlab) |
| lab spec | `scenario.symptom` | what the learner sees at baseline, one sentence |
| lab spec | `scenario.timeline[]` | `{at_s, caption}` captions shown during play at the given simulated time |
| lab spec | `scenario.observe[]` | what to watch while playing (node ids), highlighted during play |
| lab spec | `play.speeds` (optional) | default 60x; lets a short lab choose 10x |
| catalog | metric `node_status` | `ok / strained / failing`, `illustrative`, thresholds from section 2 |
| catalog | recorded series per node and per edge | the list in section 2, so the contract says what a lab can rely on |

Engine: S-021 records the per-node and per-edge series in the result of every run (cheap); S-050 returns the record of seed 1 next to the grading result; no new engine mechanics.

## 6. A worked case (proposal text for `sdlab`; not final copy)

This is what the caching lab could say, so the owner can judge the flow. All numbers are illustrative until the engine produces them.

> **Warung Kita, jam 19.00.** Toko online kecil ini biasanya melayani 80 permintaan per detik. Mulai pukul 19.00 ada flash sale, dan trafik naik menjadi 240 permintaan per detik. Semua permintaan baca harus ke database, dan database punya 4 koneksi saja.
>
> **Gejala.** Halaman produk makin lambat, lalu mulai gagal.
>
> **Tujuan.** Jaga beban database di bawah 60% tanpa menambah koneksi.
>
> *Putar kondisi awal:* menit 2 trafik naik, menit 3 antrean database menumpuk, menit 4 permintaan mulai timeout.
>
> *Atur:* kapasitas cache dan TTL.
>
> *Putar lagi:* database tetap hijau; sebagian besar pembacaan dijawab oleh cache.

Questions for `sdlab`: whether the peak of 240 is acceptable (it changes `traffic.schedule` and the calibration of the lab's targets), and who writes the captions.

## 7. Plan changes proposed

1. New ticket **S-063a** (UI, 1 session): the play replay (timeline, state colors with labels, captions, scrubber), in the BG1 set; depends on S-061, S-062, S-021, S-050. S-070 depends on it; the BG1 gate (S-071) adds: the owner plays the baseline and sees the database fail or strain.
2. S-010 gets the scenario fields (section 5) and depends on this ticket.
3. S-021 records the series in section 2; S-050 returns seed 1's record.
4. S-063 (sampled tokens) and live mode stay after BG2.
5. Cost: BG1 goes from 35 to 36 agent sessions, early access from 41 to 42, the total from 80 to 81.

## 8. Not decided here

- Whether play is on by default or one tap away (this design says one tap, after the case, before tune).
- Final thresholds for node states (they are illustrative; they will be tuned when the engine produces real series, S-070).
- Whether the case text lives in the lab spec only or also as a separate "case" page in the content bundle (S-100); this design puts it in the spec.
- A desktop layout; the flow is the same, with more room.
