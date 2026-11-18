# Contract changelog

## 0.1.0 (in preparation; S-010 schema and fixtures, S-010b catalog and release)

Not released. The 0.x line may break in a minor (PLAN 9.6). What this version defines:

- **Lab spec structure** (`lab-spec.schema.json`): the fields of `sdlab/docs/conventions/content-schema.md` section 5, unknown fields rejected everywhere.
- **Traffic owns key popularity** (ADR 0003 #3, PLAN R24): `traffic.keys` (integer, at least 1) and `traffic.skew` (number, 0 or more). The cache node no longer carries `keys` and `skew`; `cache.capacity_pct` is a percentage of `traffic.keys`.
- **Case and play fields** (docs/design/lab-flow.md, S-103): optional `case` (`story` required; `symptom`; `timeline: [{at_s, caption}]`; `observe: [node ids]`) and `play` (`speeds`, `default_speed`). The design called the first one `scenario`; it is `case` because `scenarios` already names the hidden catalog scenarios of diagnose mode.
- **Edge policies**: `{from, to, policies: [id | {id, params}]}`.
- **Scenario entries**: `{id, at_s, duration_s?, params?}`; parameters are defined by the scenario's descriptor.
- **Predicate arguments** (new, only `param-unchanged` and `param-range` are used by a real lab so far, so the other six are proposals): `has-node {type, min?}`, `has-edge {from, to}`, `node-between {node, from, to}`, `param-unchanged {node, param}`, `param-range {node, param, min?, max?}` (at least one bound), `count-le {type, max}`, `policy-present {from, to, policy}`, `no-spof {type}`.
- **Descriptor format** (`descriptor.schema.json`): component, policy and scenario entries with parameters (`number`, `integer`, `enum`, `boolean`; unit, range, default), metrics (id, unit, aggregates), honesty label (`modeled` needs evidence ids of kind V1, V3, V4 or V10; `illustrative` needs an assumption id `A-x`). Units: `fraction`, `ms`, `s`, `rps`, `count`, `percent`, `none`.

### What `sdlab` has to do before it vendors 0.1.0 (proposals, PLAN 10.4)

1. Move `keys` and `skew` from the cache node to `traffic` in `caching-basics/lab.yaml` and in content-schema section 5 and the lab template.
2. Accept `case` and `play` in its validator (it rejects them as unknown fields today).
3. Optionally tighten what the schema already checks and sdlab does not: node parameter value types, `traffic` unknown fields, `traffic.keys` and `traffic.skew`, the shape of metric ids, predicate arguments. The list is the `differs` cases in `fixtures/cases.yaml`.
4. Quote words that YAML 1.1 reads as booleans if they are meant as text (`no`, `on`, `y`).
