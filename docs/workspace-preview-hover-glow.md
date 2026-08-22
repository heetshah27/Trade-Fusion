# Workspace Preview Hover Glow

## Desktop interaction

The restored desktop workspace preview now responds only to fine-pointer hover. It lifts by a small amount, scales to 1.014, and brings a blue edge glow to the laptop lid. The existing pointer-following highlight and shallow device tilt remain available without making the preview feel like a button.

## Responsive safeguards

| Context | Behavior |
| --- | --- |
| Desktop fine pointer | Subtle zoom, lift, and luminous blue border are enabled. |
| Touch/mobile | The desktop laptop stays hidden; the purpose-built native workspace card remains visible. |
| Reduced motion | Hover zoom and glow transitions are not applied; the preview exposes a deterministic disabled motion state for regression coverage. |

## Visual review

Desktop review at 1440×900 confirmed the restored laptop preview retains a clear near-black surrounding composition. Portrait review at 390×844 confirmed the compact native workspace card remains responsive and clear without desktop-style hover effects.
