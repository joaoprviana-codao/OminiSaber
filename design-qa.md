# Design QA — Matemática do aluno

## Comparison Target

- Source visual truth:
  - `docs/referencias-design/matematica/01-1o-ano-maquina-de-padroes.png`
  - `docs/referencias-design/matematica/02-2o-ano-estudio-de-areas.png`
  - `docs/referencias-design/matematica/03-3o-ano-reta-em-movimento.png`
- Implementation screenshots:
  - `docs/auditoria-visual/matematica-maquina-padroes-implementacao.png`
  - `docs/auditoria-visual/matematica-estudio-areas-implementacao.png`
  - `docs/auditoria-visual/matematica-reta-movimento-implementacao.png`
  - `docs/auditoria-visual/matematica-reta-movimento-mobile.png`
- Side-by-side comparison evidence:
  - `docs/auditoria-visual/qa-matematica-maquina-padroes.png`
  - `docs/auditoria-visual/qa-matematica-estudio-areas.png`
  - `docs/auditoria-visual/qa-matematica-reta-movimento.png`
- State: `?preview=1`, initial state, without fabricated Supabase data.

## Viewport and normalization

- Desktop browser viewport: 1440 × 1024 CSS px, density 1.
- Desktop implementation capture: 1425 × 1013 px after the in-app browser reserved its scrollbar area.
- Source visual: 1487 × 1058 px.
- Normalization: implementation captures were resampled to 1487 × 1058 and placed beside the source without cropping.
- Mobile browser viewport: 390 × 844 CSS px, density 1.
- Mobile implementation capture: 375 × 811 px after browser UI and scrollbar reservation.
- Mobile overflow check: `scrollWidth === clientWidth` on all three routes.

## Full-view comparison evidence

The three combined QA images place the approved reference on the left and the implementation on the right. They show consistent OminiSaber navigation, information hierarchy, curriculum tags, workbench proportions, graph/geometry focus, progress and teacher-quiz regions.

Focused crops were not required after normalization because every critical control, label, graph and curriculum tag remains legible at the native 1487 × 1058 comparison size. The mobile capture was reviewed separately to verify the navigation and single-column reflow.

## Required Fidelity Surfaces

- Fonts and typography: Inter and Poppins match the approved OminiSaber language; heading size was reduced in the second pass to restore the reference hierarchy and prevent excess wrapping.
- Spacing and layout rhythm: sidebar, topbar, heading, workbench and footer retain the same order and rhythm. The area workbench was widened in the second pass so the canvas remains the dominant region.
- Colors and tokens: dark indigo navigation, warm off-white canvas, blue primary controls, teal geometry/intercept and amber measurements match the selected references. No gradients or glass effects were introduced.
- Image quality and asset fidelity: the catalog uses the approved generated references at full quality. Core learning diagrams are functional Canvas 2D visualizations rather than raster placeholders. Material Symbols supplies the icon system.
- Copy and content: final headings follow the approved concepts. Habilities and descriptors are exact. The 2º-year area calculation was corrected to `3 × 8 + 6 × 2 = 36 m²`, matching its visible geometry.

## Comparison history

### Iteration 1

- [P2] Page titles were larger than the references and pushed the workbench downward.
- [P2] The Estúdio de Áreas canvas had insufficient dominance and the B rectangle used a smaller 3 × 2 measure.
- [P2] The inherited mobile sidebar had zero width while off-canvas, allowing its contents to leak behind the page.
- [P2] Hidden quiz buttons could become visible because an author display rule overrode the native `hidden` behavior.

Fixes:

- Reduced page-heading scale and aligned the page titles/copy with the approved references.
- Adjusted the two-column geometry proportions and corrected B to 6 × 2, total 36 m².
- Gave the mobile sidebar an explicit off-canvas width and transform.
- Added a global `[hidden] { display: none !important; }` rule and a safe preview-state branch.

### Iteration 2

Post-fix comparison evidence is recorded in the three `qa-matematica-*.png` files. No actionable P0/P1/P2 mismatch remains.

## Primary interactions tested

- Máquina de Padrões: coefficient stepper changed `a` from 2 to 3; confirmation returned the correct synchronized equation.
- Estúdio de Áreas: piece A was dragged on the grid; validation returned `24 m² + 12 m² = 36 m²`.
- Reta em Movimento: mobile menu opened and closed; the correct prediction was selected and confirmed after increasing `m`.
- Catalog: the 2º-year filter displayed exactly one laboratory.
- Preview state: quiz actions stay hidden and no Supabase write is attempted.
- Console: no warning or error was recorded during the tested core interactions.

## Findings

- P0: none.
- P1: none.
- P2: none.

## Follow-up Polish

- [P3] A future iteration may add the reference mockups' decorative connector curves and graph-centering controls, provided they remain accessible and functional.

final result: passed
