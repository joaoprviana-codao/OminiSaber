# Design QA — Login OminiSaber (opção 3)

- Source visual truth: `docs/auditoria-visual/login-opcao-3-referencia.png`
- Implementation screenshot: `docs/auditoria-visual/login-opcao-3-desktop.png`
- Mobile screenshot: `docs/auditoria-visual/login-opcao-3-mobile.png`
- Side-by-side evidence: `docs/auditoria-visual/login-opcao-3-comparacao.png`
- Desktop viewport / CSS size: 1440 × 1024 px, device density 1
- Source pixels: 1488 × 1058 px
- Implementation pixels: 1440 × 1024 px
- Comparison normalization: both images scaled to 720 × 512 px, preserving the shared 1.406 aspect ratio
- State: login inicial, sem mensagens de erro e sem credenciais preenchidas

## Full-view comparison evidence

The implementation preserves the selected composition: navy brand bar, asymmetric 53/47 split, large editorial headline, yellow divider, dedicated institutional form, blue primary action, trust indicators, and the white/navy/blue/yellow 3D learning landscape. The form was kept free of public registration and role selection because accounts and permissions are provisioned institutionally.

## Required fidelity surfaces

- Fonts and typography: Inter is used throughout with close weight, line-height, and tracking. The headline hierarchy and highlighted `Saber` match the reference. No clipping or unintended wrapping was found.
- Spacing and layout rhythm: desktop proportions, form spacing, control height, and illustration balance match the reference. The mobile layout stacks without horizontal overflow and keeps the primary button in the first viewport.
- Colors and visual tokens: navy `#061d36`, blue `#155be8`, yellow `#ffbd09`, warm white surfaces, and green security state map closely to the source.
- Image quality and asset fidelity: the generated 3D illustration is a real raster asset at `frontend/login/assets/jornada-ominisaber-3d.png`; it is sharp, correctly cropped, and uses the selected art direction. No CSS illustration, placeholder, emoji, or improvised SVG replaced it.
- Copy and content: the screen uses institutional access language, matrícula/e-mail, password recovery, remembered device, school-provided access, and protected-environment assurance. Public sign-up was removed.

## Focused interaction evidence

A separate crop was not required because controls and copy are legible in the 1440 × 1024 full-resolution capture. Browser checks confirmed:

- password visibility toggle updates its icon, label, and `aria-pressed` state;
- empty submit shows the inline required-fields message;
- password recovery without an e-mail shows local guidance and does not transmit data;
- no console errors or warnings after the fixes;
- desktop has no horizontal overflow;
- mobile at 390 × 844 has no horizontal overflow and keeps the submit button visible before the first fold.

## Comparison history

1. Initial implementation: P1 functional mismatch in the password icon selector caused an error after toggling visibility. Fixed by targeting the installed Material Symbols Rounded icon.
2. Initial mobile capture: P2 usability issue placed the primary button below the first viewport. Fixed by converting the welcome area into a compact 238 px hero and repositioning the 3D asset.
3. First desktop comparison: P2 hierarchy drift added a large secondary welcome heading on the form side. Fixed by visually hiding that heading on desktop while retaining it on mobile and for accessible structure.
4. Final comparison: no actionable P0, P1, or P2 findings remain.

## Follow-up polish

- P3: the source uses a curved segment in the central yellow divider; the implementation uses a straight divider to avoid recreating a decorative asset with CSS drawing.

## Implementation checklist

- [x] Match selected desktop composition
- [x] Use a production raster illustration asset
- [x] Preserve Supabase authentication behavior
- [x] Remove public account creation
- [x] Validate focus, password visibility, local errors, and recovery guidance
- [x] Validate 1440 × 1024 and 390 × 844 layouts
- [x] Check console errors and horizontal overflow

final result: passed
