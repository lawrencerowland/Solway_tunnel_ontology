import React, { useMemo, useRef, useState } from 'react';
import OntologyGraph from '../../components/OntologyGraph.jsx';
import PlanSimulator from '../../components/PlanSimulator.jsx';
import WBSComparator from '../../components/WBSComparator.jsx';

const DEFAULT_PLAN = [
  { action: 'prepare_site', args: ['north_site'] },
  { action: 'prepare_site', args: ['south_site'] },
  { action: 'assemble_tbm', args: ['tbm1', 'north_site'] },
  { action: 'launch_tbm', args: ['tbm1', 'north_site', 'seg_entry'] },
  { action: 'excavate_and_line_segment', args: ['tbm1', 'seg_entry', 'seg1'] },
  { action: 'excavate_and_line_segment', args: ['tbm1', 'seg1', 'seg2'] },
  { action: 'excavate_and_line_segment', args: ['tbm1', 'seg2', 'seg3'] },
  { action: 'receive_tbm', args: ['tbm1', 'south_site', 'seg_exit'] }
];

const ontologyPlanMap = {
  prepare_site: ['st:sitePreparation'],
  assemble_tbm: ['st:sitePreparation', 'st:constructionPhase'],
  launch_tbm: ['st:tbmExcavation', 'st:constructionPhase'],
  excavate_and_line_segment: ['st:tbmExcavation', 'st:segmentInstallation'],
  receive_tbm: ['st:constructionPhase']
};

export default function SolwayTunnel() {
  const graphRef = useRef(null);
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const handleHighlightOntology = action => {
    const nodes = ontologyPlanMap[action.action] ?? [];
    if (nodes.length > 0) {
      graphRef.current?.focusNode(nodes[0]);
    }
  };

  const planJson = useMemo(
    () => ({
      plan: plan.map((step, index) => ({
        step: index + 1,
        action: step.action,
        args: step.args
      }))
    }),
    [plan]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="font-serif text-2xl">Solway Firth Tunnel Project</h1>
        <p className="text-slate-700">
          The Solway Firth Tunnel project involves constructing a tunnel beneath the Solway Firth,
          requiring site preparation, excavation by Tunnel Boring Machine (TBM), installation of
          tunnel lining segments, and commissioning of systems such as ventilation and emergency
          exits. Our semantic project planning approach models these elements using both an ontology
          (for a hierarchical, semantic view of the project structure) and PDDL (for planning the
          sequence of construction actions).
        </p>
        <nav className="rounded-lg border bg-slate-50 p-4 text-sm">
          <p className="font-semibold">On this page</p>
          <ul className="list-disc pl-5">
            <li>
              <a className="text-accent-600 hover:underline" href="#ontology-approach">
                Ontology-driven approach
              </a>
            </li>
            <li>
              <a className="text-accent-600 hover:underline" href="#pddl-approach">
                Automated planning (PDDL)
              </a>
            </li>
            <li>
              <a className="text-accent-600 hover:underline" href="#wbs-comparison">
                WBS comparison
              </a>
            </li>
            <li>
              <a className="text-accent-600 hover:underline" href="#methodology">
                Methodology & standards
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <section id="ontology-approach" className="space-y-4">
        <h2 className="font-serif text-2xl">Ontology-Driven Approach</h2>
        <p className="text-slate-700">
          The project ontology defines the key physical components, processes, stakeholders, and
          deliverables of the tunnel project in a semantic network. It captures part-whole structure
          (the tunnel contains sections, each with bores and linings), along with processes such as
          excavation and segment installation. See the{' '}
          <a className="text-accent-600 hover:underline" href="/glossary#term-tunnel-section">
            Glossary
          </a>{' '}
          for definitions.
        </p>

        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Example ontology snippet (Emergency Exit)</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
            {`st:EmergencyExit rdf:type owl:Class ;
    rdfs:subClassOf dice:Object ;
    rdfs:label "Emergency Exit" ;
    rdfs:comment "Safety exits positioned at intervals along the tunnel" .

st:emergencyExit1 rdf:type st:EmergencyExit ;
    st:identifier "EXIT-01" ;
    rdfs:label "North Side Emergency Egress" .

st:solwayTunnel st:hasEmergencyExit st:emergencyExit1 .`}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm"
              onClick={() => {
                setSelectedSnippet('emergencyExit1');
                graphRef.current?.focusNode('http://example.org/solwaytunnel#emergencyExit1');
              }}
            >
              View in graph
            </button>
            {selectedSnippet && (
              <span className="text-xs text-slate-500">
                Focused node: {selectedSnippet}
              </span>
            )}
          </div>
        </div>

        <OntologyGraph ref={graphRef} />
      </section>

      <section id="pddl-approach" className="space-y-4">
        <h2 className="font-serif text-2xl">Automated Planning Approach (PDDL)</h2>
        <p className="text-slate-700">
          Using PDDL, we formalize the construction process with states and actions. The planner
          generates a sequence of actions (a plan) that achieves the goal state of a completed
          tunnel, given initial conditions. This plan can then be interpreted as a plan-derived WBS.
        </p>
        <PlanSimulator onPlanUpdate={setPlan} onHighlightOntology={handleHighlightOntology} />
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-xl">Embedded Examples</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="font-semibold text-sm">Example plan JSON</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
              {JSON.stringify(planJson, null, 2)}
            </pre>
            <p className="mt-2 text-xs text-slate-600">
              Each action maps to a WBS step, such as prepare_site(north_site) under Site
              Preparation.
            </p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="font-semibold text-sm">Ontology ↔ PDDL mapping (sample)</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
              {`{
  "ontologyToPddl": {
    "st:section1": "seg_entry",
    "st:section2": "seg1",
    "st:section3": "seg2",
    "st:SolwayTunnel": "(tunnel_complete)",
    "st:ExcavationProcess": "excavate_and_line_segment",
    "st:SitePreparation": "prepare_site"
  }
}`}
            </pre>
            <p className="mt-2 text-xs text-slate-600">
              This mapping connects ontology individuals and classes to planner objects and
              actions.
            </p>
          </div>
        </div>
      </section>

      <section id="wbs-comparison" className="space-y-4">
        <WBSComparator plan={plan} />
        <p className="text-sm text-slate-700">
          Ontology-driven WBS covers broader scope (design, management), whereas the PDDL WBS
          focuses on the execution sequence. Together they provide comprehensive coverage.
        </p>
      </section>

      <section id="methodology" className="space-y-4">
        <h2 className="font-serif text-2xl">Methodology & Standards</h2>
        <p className="text-slate-700">
          The workflow integrates the ontology with the planner: ontology individuals provide PDDL
          objects and relationships, while PDDL actions map back to ontology process classes. This
          bi-directional mapping ensures consistency and keeps planning aligned with semantic
          structure.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold">Temporal planning readiness</h3>
            <p className="text-sm text-slate-700">
              Temporal annotations (start/end dates, durations) can be captured in the ontology and
              translated into PDDL 2.1 durative actions. This prepares the model for scheduling,
              timeline visualization, and constraint checking.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold">Standards alignment</h3>
            <p className="text-sm text-slate-700">
              The ontology uses BFO and the Digital Construction ontology as a foundation. Planned
              alignments include DOLCE/DUL for alternative foundational semantics, SSN/SOSA for
              sensor observations during construction, and PROV-O for provenance tracking of plan
              outputs.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold">Planning paradigm alternatives</h3>
            <p className="text-sm text-slate-700">
              Future enhancements can explore HTN planning for hierarchical task decomposition and
              multi-objective planning for time-cost trade-offs, keeping the planner interface
              modular.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Conclusion</h2>
        <p className="text-slate-700">
          The ontology provides a rich semantic map of the project, while PDDL validates that the
          execution sequence is feasible. Together they support explainable, auditable, and
          extensible project planning for complex infrastructure delivery.
        </p>
      </section>
    </div>
  );
}
