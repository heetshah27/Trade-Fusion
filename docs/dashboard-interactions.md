# Dashboard Interaction Validation

## Desktop entry points

The Dashboard now presents the **Calendar risk · Today** ribbon directly below the command-center header. Its source-backed loading state remains visually compact while the calendar query resolves, and the action leads to the full Market Calendar. The Trades ledger retains compact desktop rows with the entire execution row available as a keyboard-accessible private detail entry point; edit and delete actions remain separate.

On a 375px mobile viewport, the ribbon keeps its risk message and calendar action on one compact, readable surface without overlapping the primary Dashboard controls. The mobile Trades ledger preserves its existing card-first view, and each trade card exposes the same private detail action while retaining separate edit and delete controls.

## Expected detailed review behavior

Selecting a Dashboard recent-execution item or a Trades ledger row opens an accessible right-side private review drawer. The drawer combines live execution details with only the authenticated member’s linked Journal notes and screenshots.

## Open drawer verification

Desktop verification showed the open drawer presenting a private XAUUSD execution review with direction, net P&L, entry/exit, size, fees, execution context, trade note, and linked private Journal material. On a 375px mobile viewport, the same drawer used a full-width, vertically scrollable layout with readable cards and a reachable close control; its execution and Journal-review sections remained distinct without horizontal overflow.
