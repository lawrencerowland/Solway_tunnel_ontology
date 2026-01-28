export default function Glossary() {
  const terms = [
    {
      id: 'term-solway-tunnel',
      title: 'Solway Firth Tunnel',
      definition:
        'The main tunnel connecting England and Scotland under the Solway Firth – the focal project in this ontology.',
      ontology: 'Class st:SolwayTunnel (subclass of dice:Object).',
      notes: 'In the WBS, this aligns with the final project deliverable.'
    },
    {
      id: 'term-tunnel-section',
      title: 'Tunnel Section',
      definition: 'A segment of the tunnel with specific properties.',
      ontology: 'Class st:TunnelSection (subclass of dice:Object).',
      notes: 'Each section is linked to a bore and lining.'
    },
    {
      id: 'term-tbm',
      title: 'TBM (Tunnel Boring Machine)',
      definition:
        'A specialized machine that excavates the tunnel bore while installing support systems.',
      ontology: 'Represented as a resource/equipment in the PDDL model.',
      notes: 'Key to excavation and lining installation steps.'
    },
    {
      id: 'term-excavation',
      title: 'Excavation Process',
      definition: 'Process of excavating the tunnel bore.',
      ontology: 'Class st:ExcavationProcess (subclass of dicp:Process).',
      notes: 'Maps to PDDL actions like excavate_and_line_segment.'
    },
    {
      id: 'term-segment-installation',
      title: 'Segment Installation',
      definition: 'Process of installing lining segments.',
      ontology: 'Class st:SegmentInstallation (subclass of dicp:Process).',
      notes: 'Represents lining installation activities.'
    },
    {
      id: 'term-geotechnical-report',
      title: 'Geotechnical Report',
      definition: 'Assesses ground conditions and informs construction sequencing.',
      ontology: 'Class st:GeotechnicalReport (subclass of dici:InformationContentEntity).',
      notes: 'Supports ground treatment and design decisions.'
    },
    {
      id: 'term-bfo',
      title: 'BFO (Basic Formal Ontology)',
      definition: 'A foundational ontology that provides shared categories for entities and processes.',
      ontology: 'Referenced via the bfo: prefix.',
      notes: 'Provides the philosophical base for the project ontology.'
    }
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">Domain Glossary & Ontology Reference</h1>
        <p className="font-sans text-slate-700">
          This glossary provides concise definitions of key terms, ontology classes, and planning
          artifacts used across the Solway Firth Tunnel project. Each term includes an anchor for
          deep linking from the project page or learning hub.
        </p>
      </header>

      <section className="space-y-4">
        {terms.map(term => (
          <article key={term.id} className="rounded-lg border bg-white p-4">
            <h2 className="font-serif text-xl">
              {term.title} <a id={term.id} className="text-accent-600" />
            </h2>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Definition:</span> {term.definition}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Ontology:</span> {term.ontology}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Notes:</span> {term.notes}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">Ontology Schema Overview</h2>
        <p className="text-sm text-slate-700">
          The Solway Firth Tunnel ontology builds on the Digital Construction ontology and the BFO
          foundation. It organizes concepts into Physical Components, Processes, Stakeholders,
          Information artifacts, and Lifecycle Phases. Instances such as the tunnel, sections, and
          linings are linked through part-whole relationships.
        </p>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Example relationships:</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
            {`st:solwayTunnel dice:hasSubOrganization st:section1 .
st:section1 st:hasBore st:bore1 .
st:section1 st:hasLining st:lining1 .
st:lining1 st:hasSegment st:segment1 .`}
          </pre>
          <p className="mt-2 text-sm">
            These triples express that the Solway Tunnel has multiple sections, each with a bore and
            a lining, and each lining contains multiple segments.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">Processes & Deliverables</h2>
        <p className="text-sm text-slate-700">
          Key construction processes include excavation, lining installation, ground treatment, and
          site preparation. Deliverables include design documents, environmental assessments, and
          geotechnical reports, each with a defined role in the project lifecycle.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <span className="font-semibold">Excavation Process:</span> Creates the tunnel bore and
            establishes the path for lining installation.
          </li>
          <li>
            <span className="font-semibold">Segment Installation:</span> Places precast segments to
            form the tunnel lining and provide structural support.
          </li>
          <li>
            <span className="font-semibold">Ground Treatment:</span> Stabilizes soil and water
            conditions before excavation begins.
          </li>
          <li>
            <span className="font-semibold">Geotechnical Report:</span> Documents ground conditions
            and informs the design approach.
          </li>
        </ul>
      </section>
    </div>
  );
}
