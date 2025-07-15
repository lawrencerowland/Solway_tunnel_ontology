export default function Brief() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl">Brief for AI agent</h1>
      <h2 className="font-serif text-xl">Ends</h2>
      <p className="font-sans">Build robust WBS for projects using reason about both the end state, and the processes to achieve the end state. Do this by using both domain ontologies, and a foundation ontology of your choice. This should achieve a WBS that is explainable. Do this for the project scenarios given by the user or for those listed below. Each time, compare this with a WBS constructed via a problem and domain file in PDDL for that scenario, and state which is better and why. After each key step, present and check with the user that she wants you to continue with the next step.</p>
      <h2 className="font-serif text-xl">Ways</h2>
      <ol className="list-decimal list-inside font-sans space-y-1">
        <li>High level ontology. your choice eg. BFO</li>
        <li>Mid level ontology for mapping the enterprise and project (optional), if 1 and 3 do the job well enough. eg. would be the gist ontology for enterprise and a project ontology of your choice</li>
        <li>Domain ontology. An example would be the Digital Construction ontology.</li>
        <li>You will need to name your own domain to encode any special , local arrangements, as well as details of the instances.</li>
      </ol>
      <h2 className="font-serif text-xl">Means</h2>
      <p className="font-sans">write a single html file with interactive features to model and capture and explain and illustrate your results, compliant with the attached canvas guidelines for how you write the html.</p>
      <h2 className="font-serif text-xl">Project scenarios</h2>
      <ol className="list-decimal list-inside font-sans space-y-1">
        <li>a tunnel under the Solway Firth</li>
      </ol>
      <h2 className="font-serif text-xl">Guidelines</h2>
      <p className="font-sans">if I just say lets go, what I mean is, lets go forward towards the expressed ends, via the most feasible ways expressed, using the means available, in the full context of the instructions and documents.</p>
    </div>
  );
}
