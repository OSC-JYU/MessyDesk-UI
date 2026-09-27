# MessyDesk-UI Wiki

Engineering knowledge base for the MessyDesk-UI frontend application.

## Pages

- [Architecture](architecture.md) — Technology stack, module map, key design decisions
- [Routing](routing.md) — Route table, navigation patterns, nested routes
- [State Management](state-management.md) — Global store design, state shape, invariants
- [API Layer](api-layer.md) — `web.js` client, endpoint catalog, error handling, RID conventions
- [Graph Visualization](graph-visualization.md) — VueFlow + dagre, node types, SSE protocol, interactions
- [File Display System](file-display-system.md) — Three-column layout, type dispatch, display components
- [Processing & Crunchers](processing-crunchers.md) — Service model, batch lifecycle, progress tracking
- [Domain Concepts](domain-concepts.md) — Project, File, Set, Source, Entity, ROI, RID
- [Authentication](authentication.md) — SSO flow, session polling, permission requests
- [Conventions](conventions.md) — Code patterns, naming, testing, CSS, i18n
- [Non-Obvious Behavior](non-obvious-behavior.md) — Gotchas, edge cases, surprising patterns

## Verification Policy

Each claim in this wiki is tagged with its verification status:
- **Verified from:** — Statement confirmed by reading the cited source file(s)
- **Inferred from:** — Reasonable conclusion drawn from observed patterns, not explicitly stated in code
- **Assumption:** — Unverified belief based on naming/context

Source code and tests are authoritative. If the implementation contradicts this wiki, the implementation is correct.
