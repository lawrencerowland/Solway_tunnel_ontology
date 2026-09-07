# The work that must exist

An executable essay for **Foray 210 — Semantics for WBS** (`FORAY-WBS-SEMANTICS`, `PW-SCHEMA-003`). It begins with desired outcomes, local conditions and reusable method descriptions, then computes a process and proposed work packages. It does not begin with a supplied project schedule.

## The bounded claim

Two synthetic tunnel installation units must be installed and have successful inspection evidence. The inspection actions represent successful inspections producing acceptance records; failures and rework are outside the model. Temporary access equipment must be absent at handover. A shared gantry or separate trolleys can support installation and inspection. Under these declared rules, enabling, inspection and removal work can be derived even though access equipment is absent from the finished product.

The interesting distinction is between **needed by this plan** and **unavoidable in every feasible plan in this model**. Causal support explains the chosen plan. Removing one permitted action and solving again tests the stronger claim. Gantry work need not be unavoidable when a trolley alternative remains.

A second counterfactual removes every permitted action in a declared function group: providing access, clearing access, installing a unit or producing its inspection evidence. This tests function necessity independently of the chosen method. The groups come from supplied method annotations; the app does not discover a universal taxonomy of work.

All requirements, equipment suitability and method steps in this vignette are invented for the experiment. They are not actual Solway requirements or engineering advice. Search minimises the number of actions, with every action given unit cost. It does not optimise duration, money, staffing, risk or physical feasibility. The finite vocabulary does not express every task that a real project would require.

## Construction and comparison

`ontology.ttl` holds separate local foundational, domain and scenario namespaces. Its explicit completion profile maps selected installation units to installed-state and inspection-evidence obligations, plus a site-clear obligation. The authored methods supply action preconditions and effects. `compile_ontology.py` validates and compiles the RDF into the browser's `model-data.js`; `engine.js` grounds the methods, searches states and constructs causal support and package views. Vocabulary alone supplies no engineering method.

`pddl.js` contains an independently authored direct PDDL domain and local problem construction. It does not read the ontology or call `WorkModel`. A separate parser, state search and plan checker actually execute both the direct text and the PDDL exported from the semantic route. Semantic comparison covers initial facts, positive and negative goals, and every grounded action's positive/negative preconditions and add/delete effects. Both routes receive the same scope, assumptions and packaging criteria.

The supported PDDL subset is deliberately small: zero-parameter propositional STRIPS actions, conjunctive positive/negative preconditions, add/delete effects, and conjunctive positive/negative goals. Unsupported requirements, parameters, objects, expressions and problem sections produce errors. This is not a general PDDL planner or an external planner benchmark.

The comparison offers no ontology search advantage: equivalent transition systems should have equal feasibility and shortest action counts. The proposed semantic contribution is explicit reusable type distinctions, an inspectable completion profile, and links from work to obligations and source method descriptions. Whether those structures improve human understanding or maintenance is not measured here. The direct PDDL route can also receive causal explanations and identical package groupings.

Grouping the same actions by installation outcome or delivery trade changes responsibility boundaries and counted causal interfaces. It does not prove one grouping is the unique or best WBS. Shared actions must occur once in every grouping even when they support both units. Fact-support links and separate protection constraints preserve access until its consumers finish. Interface counts describe these links between supplied packages, not estimated coordination effort.

## Reproduce

Open `index.html` directly, or serve the repository and navigate to this app. No service, account, external planner, or model API is required for the calculations.

Run `npm run test:work` from the repository root for the engine tests and independent comparison. The comparison can also be run with `node apps/work-that-must-exist/comparison-tests.mjs`. The suite covers the full 48 combinations of four scopes, three access policies and four method choices, checks semantic parity and final-state validity, and exercises scope withdrawal, method changes, causal explanations, protection constraints, action and function-group necessity, package conservation and unsupported PDDL rejection. Its terminal output is the authoritative current test result. Add `--write-report` to refresh `verification.json` and its tested-file hashes.

The ontology build check uses Python with RDFLib: `python apps/work-that-must-exist/compile_ontology.py --check`. Compilation is a specific RDF interpretation and validation workflow, not unrestricted OWL entailment. See the compiler for its exact supported schema and checks.

## Source use and limits

- **Foundational distinctions.** [Basic Formal Ontology](https://bfo-ontology.github.io/) supplies an upper-level orientation, not construction-specific methods. The essay uses a small local foundational vocabulary; it does not implement the complete BFO axioms or claim full BFO conformance.
- **Construction vocabulary.** [Digital Construction Entities 0.5](https://digitalconstruction.github.io/Entities/v/0.5/) distinguishes equipment, objects, processes and qualities, with BFO-aligned classes. [Digital Construction Information 0.5](https://digitalconstruction.github.io/Information/v/0.5/) distinguishes identifiable information content from its physical carrier. These sources inform the model's distinctions; the gantry/trolley methods and acceptance rules are authored local assumptions, not extracted construction knowledge from those ontologies.
- **Planning and transfer.** Aguinaldo, Patterson and Regli, [*Automating Transfer of Robot Task Plans using Functorial Data Migrations*, v2, 12 April 2025](https://arxiv.org/html/2406.15961v2), separates domain ontology from domain actions (§III-A), requires compatible mappings for plan transfer (§IV), and discusses information loss (§VI-C) and evaluation needs (§VII–IX). This essay uses that distinction to make its knowledge requirements explicit. It does **not** implement the paper's functorial plan-transfer construction, test robot execution, or establish physical feasibility.

Sources checked 7 September 2026. The executable model and its experiment results are this essay's synthesis. Its public evidence boundary is symbolic model behaviour, not practitioner validation or project adoption.

## Worked results

| Brief | Shortest actions | Required functions | Unavoidable specific actions |
|---|---:|---:|---:|
| Both units, open access, both methods | 6 | 6 | 0 |
| Both units, open access, trolley only | 8 | 6 | 8 |
| Both units, tight access, both methods | 6 | 6 | 6 |
| Unit A only, tight access, both methods | 4 | 4 | 4 |
| Both units, tight access, trolley only | No route | Not reported | Not reported |
| No units, any access or method permissions | 0 | 0 | 0 |

Functions are supplied groups of method descriptions (gain access, install each unit, inspect each unit, clear access). Each required-function claim is checked by forbidding every action in its group and searching again. Distinct method actions can each be avoidable even though their shared function is required.

For ordinary-interface checks, start an HTTP server at the repository root and run `node apps/work-that-must-exist/browser-check.cjs` with Playwright installed. `BASE_URL` can target the deployed app, `PLAYWRIGHT_MODULE` can select an installed package, and `BROWSER_CHANNEL=chrome` can use system Chrome. The suite covers presets, playback, scope changes, infeasibility, downloads, keyboard navigation, stateful links and narrow layouts. Screenshots are taken from the actual app.

GitHub verifies both JavaScript planning routes, RDF compilation and ontology checks before deploying this collection. `verification.json` records the independently checked model files and their hashes; it is a model-test receipt, not a claim of engineering or human validation.
