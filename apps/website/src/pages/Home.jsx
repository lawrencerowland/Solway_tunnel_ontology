import PageCard from '../components/PageCard.jsx';

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl">Welcome</h1>
      <p className="font-sans">This project employs semantic project planning, an approach that combines structured domain knowledge with rigorous formal ontologies—such as the Basic Formal Ontology (BFO)—to develop robust, clear, and explainable Work Breakdown Structures (WBS). By integrating high-level foundational ontologies with specific domain ontologies like the Digital Construction ontology, this method provides a systematic and comprehensive framework to capture the complexities and specifics of infrastructure projects, such as building a tunnel beneath the Solway Firth. In practice, this means the detailed processes, materials, risks, stakeholders, and dependencies involved in tunnel construction are explicitly modeled and organized, allowing for greater clarity and precision in planning and execution.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mt-4">
        <PageCard>Explore project portfolios.</PageCard>
        <PageCard>Try interactive tools.</PageCard>
        <PageCard>Browse our learning hub.</PageCard>
      </div>
    </div>
  );
}
