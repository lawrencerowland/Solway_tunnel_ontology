# The handover game

Foray210 · a learner game paired with [The work that must exist](../work-that-must-exist/index.html).

Play through a synthetic two-unit tunnel fit-out: provide access, install requested units, obtain their inspection records and clear temporary equipment. This rebuild retains the original Semantic Tunnel Planner's project/semantic/sectoral learning spirit while replacing its supplied task progression with actions from the current essay's actual model.

## Shared truth, explicit game assumptions

The game loads `../work-that-must-exist/model-data.js` and `engine.js` directly. Actions, preconditions, add/delete effects, scope and completion obligations have one source. The game does not copy or alter that domain. Effects apply only on completion of the dispatched action. Early access removal is possible and makes another setup necessary for remaining uses.

Hours, costs, single-crew operation and two announced handover events are fictional training assumptions. They are additional to the essay's equal-action-cost objective, not estimates or engineering guidance. Inspection means successful inspection with evidence; failure/rework is outside the shared model. The remaining-route hint searches physical obligations only and does not claim to optimise game resources.

| Mission | Scope/access | Allowance | Learning |
|---|---|---|---|
| The first handover | A+B, open, both methods |18h / £1,600 | Method choice, temporary means, installed state versus evidence, recovery |
| Beat the possession window | A+B, tight, gantry fits |12h / £1,250 | Two handovers trade time against cost; exactly one paid option is needed on a direct route |
| A smaller brief | A only, tight, gantry |9h / £850 | Dropping a product removes its specific work but retains shared support |

Baseline winning figures including events: gantry tutorial12h/£1,120; trolley tutorial15h/£1,040; tutorial with early teardown and repeat setup15h/£1,540; tight mission12h/£1,210 or£1,240; reduced scope8h/£770. These belong to this authored teaching model.

## Use and recovery

Select a work card to inspect its project meaning and requirements, then dispatch. Time does not advance while idle. Animation can be paused, or advanced one training hour at a time; reduced-motion starts work paused. Shift events and learning questions are separate: quiz answers do not create project facts or override failure.

Undo returns to the prior dispatch or event decision. Restart creates a new mission. Browser-local saving and JSON file saving store a versioned command history; restoring replays validated commands against the identified shared model. Imported facts, costs and completion flags are not trusted. No learner data is sent to a server.

## Checks

Run `npm run test:game` for domain parity, delayed effects, legal/blocked actions, resource totals, missing evidence, scoped work, early clearance, winning and failing events, whole-decision undo and save replay/tamper checks. `browser-check.cjs` covers ordinary desktop/mobile gameplay and recovery. `npm run test:work` preserves the underlying48-scenario independent comparison; `npm run build` emits the static site.

Both the game and essay link through the Solway collection and the [Side Projects foray directory](https://lawrencerowland.github.io/side-projects.html#playgrounds). The former #4 process/product explanation is adapted interactively in the essay's WBS panel. The former #4/#5 URLs retain retirement notices; their active catalogue entries are removed.
