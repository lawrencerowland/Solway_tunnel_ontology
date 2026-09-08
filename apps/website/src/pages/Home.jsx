import PageCard from '../components/PageCard.jsx';
import { Link } from 'react-router-dom';
import { siteLinks } from '../siteLinks.js';

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl">Solway: from an outcome to its work</h1>
      <section className="border border-slate-300 rounded p-5 bg-emerald-50">
        <p className="text-sm text-emerald-800">Current experiment · Foray 210</p>
        <h2 className="font-serif text-xl"><a className="underline" href={siteLinks.essay}>The work that must exist</a></h2>
        <p>Generate work from an intended outcome. Change the goal or method, trace shared support, and compare the semantic route with executable PDDL.</p>
      </section>
      <p className="font-sans">Solway is a collection of synthetic experiments in semantic project planning. Begin with a small handover challenge, then inspect how typed outcomes, reusable methods and causal support generate a work breakdown. The broader tunnel ontology remains an illustration of how project concepts can connect; it is not an engineered tunnel design.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mt-4">
        <PageCard>
          <a className="text-accent-600 hover:underline" href={siteLinks.game}>Play The handover game</a>
          <p className="text-sm text-slate-600">Choose the work that leaves the requested units installed, accepted and clear of temporary equipment.</p>
        </PageCard>
        <PageCard>
          <Link className="text-accent-600 hover:underline" to="/projects/solway-tunnel">
            Explore the wider ontology
          </Link>
          <p className="text-sm text-slate-600">Browse the tunnel example's objects, processes and relationships.</p>
        </PageCard>
        <PageCard>
          <Link className="text-accent-600 hover:underline" to="/glossary">
            Browse the learning hub
          </Link>
          <p className="text-sm text-slate-600">Definitions and ontology reference.</p>
        </PageCard>
      </div>
      <p className="text-sm text-slate-600"><a className="underline" href={siteLinks.forays}>Return to all forays</a> · <a className="underline" href={siteLinks.apps}>All Solway apps</a> · <a className="underline" href={siteLinks.curation}>What was preserved and retired</a></p>
    </div>
  );
}
