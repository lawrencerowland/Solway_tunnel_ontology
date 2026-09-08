import { Link } from 'react-router-dom';
import PageCard from '../components/PageCard.jsx';

export default function Projects() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl">Illustrative project ontology</h1>
      <p className="font-sans">The Solway tunnel is a synthetic setting for exploring relationships among physical components, processes, information and project roles. Its broad graph is separate from the small executable handover model.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
        <Link to="/projects/solway-tunnel" className="block">
          <PageCard>
            Explore the Solway tunnel ontology
          </PageCard>
        </Link>
      </div>
    </div>
  );
}
