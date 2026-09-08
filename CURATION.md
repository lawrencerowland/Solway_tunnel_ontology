# Solway: what was preserved and retired

7 September 2026. Current starting points: [The handover game](apps/semantic-tunnel-planner/index.html), [The work that must exist](apps/work-that-must-exist/index.html), and the [wider ontology explorer](apps/website/projects/solway-tunnel/). Return to [all Solway apps](app-index.html) or [all forays](https://lawrencerowland.github.io/side-projects.html#playgrounds).

## Preserved: product and process are different structures

The former app 4 usefully distinguished a product's physical parts from the work undertaken to create or change them. An excavation process is not a physical part of a tunnel. Likewise, using a gantry does not make the gantry part of the installed product, and an inspection record is information rather than either the product or the inspection.

This explanation now lives in the essay's [work-breakdown view](apps/work-that-must-exist/index.html#scope=both&access=open&methods=both&view=wbs). Select **Product**, **Work**, **Temporary means** or **Evidence**. The displayed items and support links come from the currently selected two-unit brief and its computed route. Changing scope or method changes the explanation. Planned steps describe proposed processes; they are not records of work already performed.

The handover game provides another entry to these distinctions. The essay supplies the explicit rules, counterfactual checks, work packages and comparison with independently written PDDL.

## Retired: apps 4 and 5

App 4, *WBS-comparison-ontology-or-PDDL*, compared a broad, manually supplied ontology hierarchy with a much narrower tunnelling plan. That unequal scope could not establish its conclusion that ontology was generally superior. The useful process/product explanation is preserved above; the conclusion is withdrawn.

App 5, *pddl-wbs-explainable*, proposed importing a supplied plan, explaining its packages and exporting provenance. Its default example did not satisfy its action preconditions, its action parser lost the conditions and effects it was meant to explain, and its exports did not encode the advertised provenance relationships correctly. It is withdrawn as a working importer or provenance demonstration.

The website's related simulator and WBS comparison are also no longer presented as current results. They repeated the unequal-scope comparison; the simulator could substitute an invalid default sequence after a solver failure. The wider ontology graph remains available as an illustrative vocabulary and relationship map.

The old numbered URLs retain short retirement notices so saved links remain useful. Their app-index entries have been removed. Apps 6–13 are unchanged by this curation. Source history at [the pre-curation revision](https://github.com/lawrencerowland/Solway_tunnel_ontology/tree/4c3517d23a05c3b77ef8d192c1f62f9f98a39f29) preserves the originals; that is historical source, not a current implementation endorsement.

## Preserved scale-up example: the nine-step tunnel drive

App 4's broader example remains a useful candidate for a future experiment. In its supplied symbolic model, the TBM starts available, both sites start unprepared, and the connected path runs from `seg_entry` through `seg1`, `seg2`, `seg3` to `seg_exit`. The south site is at the exit. The supplied sequence was:

1. Prepare the north site.
2. Prepare the south site.
3. Assemble the TBM at the north site.
4. Launch it at the entry segment.
5. Excavate and line from the entry to segment 1.
6. Excavate and line from segment 1 to segment 2.
7. Excavate and line from segment 2 to segment 3.
8. Excavate and line from segment 3 to the exit.
9. Receive the TBM at the south site.

An isolated replay passed the stated positive and negative conditions and final goals for this nine-step sequence. This was a check of the supplied symbolic sequence, not evidence that the old page generated it or that it is physically feasible. Step 8 matters: the website's eight-step fallback omitted it and could not receive the TBM at the exit. The old PDDL also needs a corrected negative-precondition requirement declaration before strict-planner reuse. Its conceptual BFO placeholders must not be reused as canonical ontology identifiers.

A future scale-up should give both ontology and PDDL the same declared scope, add explicit acceptance and clearance rules where required, then test the translation and execute every proposed plan against those rules. The new essay does this for its smaller model; it does not already implement the full tunnel example.

## Preserved future direction: supplied-plan provenance

Importing an external plan, associating generated packages with source steps, and keeping the mapping run separate from construction execution remain useful requirements from app 5. Resuming them requires a proper parser, independent plan validation and conforming provenance relationships. The current essay is deliberately a restricted propositional planner and exports its own explanation vocabulary. It is not a general PDDL importer or a completed PROV-O implementation.

The current evidence boundary remains finite symbolic behaviour. These experiments do not establish engineering validity, practitioner adoption or a solver advantage for ontology.
