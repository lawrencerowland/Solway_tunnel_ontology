import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import OntologyGraph from '../../components/OntologyGraph.jsx';
import { siteLinks } from '../../siteLinks.js';

export default function SolwayTunnel() {
  const graphRef = useRef(null);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="font-serif text-2xl">The wider Solway ontology</h1>
        <p className="text-slate-700">This synthetic tunnel example connects physical components, proposed processes, project roles and information. Explore the graph as a vocabulary and relationship map. It does not establish that a tunnel design is complete, feasible or safe.</p>
        <div className="rounded-lg border bg-emerald-50 p-4 space-y-2">
          <h2 className="font-serif text-xl">Try the current work-generation experiment</h2>
          <p className="text-slate-700">A smaller two-unit handover model makes the claims executable: change the intended outcome, trace the work that supports it, and compare ontology-derived and directly written PDDL on the same scope.</p>
          <p><a className="text-accent-600 underline" href={siteLinks.game}>Play The handover game</a> · <a className="text-accent-600 underline" href={siteLinks.essay}>Read The work that must exist</a> · <a className="text-accent-600 underline" href={siteLinks.explanation}>Explore product, process, means and evidence</a></p>
        </div>
      </header>

      <section id="ontology-approach" className="space-y-4">
        <h2 className="font-serif text-2xl">Objects and their relationships</h2>
        <p className="text-slate-700">A product structure connects physical parts: a tunnel has sections, linings and exits. A process structure connects work: preparing, excavating and installing. Processes can act on products, use equipment and produce information. Those relationships are not interchangeable forms of “part of”. The <Link className="text-accent-600 underline" to="/glossary/">glossary</Link> explains the broader vocabulary.</p>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Example graph statements: a process and its product</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{`st:tbmExcavation rdf:type st:ExcavationProcess ;
    rdfs:label "TBM Excavation - Main Drive" .

st:tbmExcavation st:creates st:bore1 .`}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => {
              setSelectedSnippet('tbmExcavation');
              graphRef.current?.focusNode('http://example.org/solwaytunnel#tbmExcavation');
            }}>View in graph</button>
            {selectedSnippet && <span className="text-xs text-slate-500">Focused node: {selectedSnippet}</span>}
          </div>
        </div>
        <OntologyGraph ref={graphRef} />
      </section>

      <section id="methodology" className="space-y-4">
        <h2 className="font-serif text-2xl">What this graph can explain</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold">A broader vocabulary</h3>
            <p className="text-sm text-slate-700">The graph provides terms for discussing construction objects, work, agents and records. Selecting a node reveals its declared relationships. A relationship in this example is a modelling assertion, not evidence that the corresponding activity happened.</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="font-semibold">A checked, smaller planning model</h3>
            <p className="text-sm text-slate-700">The current essay supplies explicit initial conditions, actions and acceptance goals. Its work packages come from a solved plan and causal support. Neither a broad ontology diagram nor an action list alone establishes complete scope.</p>
          </div>
        </div>
        <p className="text-sm text-slate-700">The earlier simulator and unequal-scope WBS comparison have been withdrawn from this page. Their default fallback and comparison claims did not support the conclusions shown. <a className="text-accent-600 underline" href={siteLinks.curation}>Read the preservation and retirement note.</a></p>
      </section>
      <p className="text-sm"><a className="underline" href={siteLinks.home}>Back to Solway</a> · <a className="underline" href={siteLinks.forays}>All forays</a></p>
    </div>
  );
}
