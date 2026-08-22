# Trade Fusion 3D Landing Composition

## Intent

The 3D layer is intentionally limited to the public landing hero. It creates a premium sense of depth without making the private trading workspace harder to scan, slower to operate, or visually noisier during execution review.

## Implementation boundary

The composition uses CSS perspective, layered grid and orbit planes, small depth beacons, and the existing floating workspace preview. It does not introduce a WebGL dependency, canvas renderer, continuously running simulation, or new data request.

| Context | Behavior | Safeguard |
| --- | --- | --- |
| Fine desktop pointer | Hero depth follows the pointer with shallow, CSS-transform-only offsets. | Interaction is limited to a 3° horizontal and 2.3° vertical visual response. |
| Existing workspace preview | The interactive laptop remains the primary 3D focal point. | Preview tabs and onboarding controls remain above decorative layers. |
| Touch and mobile | Decorative layers stay static and the small depth beacons are removed. | Touch pointer events never enable depth tracking. |
| Reduced motion | The decorative 3D scene is hidden. | The landing page retains its content and conversion path without nonessential motion. |

## Visual review

Desktop review at 1440×900 confirmed a readable hero headline and actions, a blue-neutral 3D grid/orbit composition, and an unobstructed workspace preview. Mobile review at 390×844 confirmed that the hero copy and primary action retain priority; depth beacons are absent and the decorative layers remain subdued behind the content.
