import { Parser, Store } from 'n3';

const ALLOWED_PREFIXES = [
  'st:',
  'bfo:',
  'dice:',
  'dicp:',
  'dica:',
  'dici:',
  'dicl:',
  'dicc:',
  'dicbm:'
];

const IGNORED_PREDICATES = new Set([
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://www.w3.org/2000/01/rdf-schema#comment',
  'http://www.w3.org/2002/07/owl#versionInfo'
]);

const TYPE_LABELS = {
  'https://w3id.org/digitalconstruction/Processes#Process': 'Process',
  'https://w3id.org/digitalconstruction/Agents#FormalOrganization': 'Agent',
  'https://w3id.org/digitalconstruction/Information#InformationContentEntity': 'Information',
  'https://w3id.org/digitalconstruction/Lifecycle#ProjectPhase': 'Lifecycle',
  'https://w3id.org/digitalconstruction/BuildingMaterials#Material': 'Material',
  'https://w3id.org/digitalconstruction/Entities#Object': 'Physical Component'
};

const PREFIXES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#'
};

const isNamedNode = value => value && value.termType === 'NamedNode';

const shrinkIri = (iri, prefixes) => {
  const entries = Object.entries(prefixes ?? {});
  for (const [prefix, base] of entries) {
    if (iri.startsWith(base)) {
      return `${prefix}:${iri.slice(base.length)}`;
    }
  }
  return iri;
};

const isAllowedIri = (iri, prefixes) => {
  const shortened = shrinkIri(iri, prefixes);
  return ALLOWED_PREFIXES.some(prefix => shortened.startsWith(prefix));
};

const inferGroup = (types = []) => {
  for (const type of types) {
    if (TYPE_LABELS[type]) {
      return TYPE_LABELS[type];
    }
    if (type.includes('Process')) return 'Process';
    if (type.includes('Material')) return 'Material';
    if (type.includes('FormalOrganization') || type.includes('Agent')) return 'Agent';
    if (type.includes('Information')) return 'Information';
    if (type.includes('Lifecycle') || type.includes('Phase')) return 'Lifecycle';
  }
  return 'Physical Component';
};

export async function loadOntologyGraph() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/solway_tunnel_ontology.ttl`);
  if (!response.ok) {
    throw new Error('Unable to load ontology data.');
  }
  const ttlText = await response.text();
  const parser = new Parser({ prefixes: PREFIXES });
  const quads = parser.parse(ttlText);
  const store = new Store(quads);
  const prefixes = parser._prefixes ?? PREFIXES;

  const nodeMap = new Map();
  const typeMap = new Map();
  const labelMap = new Map();
  const commentMap = new Map();
  const dataProps = new Map();
  const classSet = new Set();
  const objectProperties = new Map();

  for (const quad of store.getQuads(null, null, null, null)) {
    const subject = quad.subject;
    const predicate = quad.predicate;
    const object = quad.object;

    if (!isNamedNode(subject)) continue;
    if (!isAllowedIri(subject.value, prefixes)) continue;

    if (!nodeMap.has(subject.value)) {
      nodeMap.set(subject.value, { id: subject.value });
    }

    if (predicate.value === `${PREFIXES.rdf}type` && isNamedNode(object)) {
      if (
        object.value === `${PREFIXES.owl}Class` ||
        object.value === `${PREFIXES.rdfs}Class`
      ) {
        classSet.add(subject.value);
      } else {
        const types = typeMap.get(subject.value) ?? [];
        types.push(object.value);
        typeMap.set(subject.value, types);
      }
    }

    if (predicate.value === `${PREFIXES.rdfs}label`) {
      labelMap.set(subject.value, object.value);
    }

    if (predicate.value === `${PREFIXES.rdfs}comment`) {
      commentMap.set(subject.value, object.value);
    }

    if (predicate.value === `${PREFIXES.rdf}type` && object.value === `${PREFIXES.owl}ObjectProperty`) {
      objectProperties.set(subject.value, true);
    }

    if (!IGNORED_PREDICATES.has(predicate.value) && object.termType === 'Literal') {
      const props = dataProps.get(subject.value) ?? [];
      props.push({
        predicate: shrinkIri(predicate.value, prefixes),
        value: object.value
      });
      dataProps.set(subject.value, props);
    }
  }

  const links = [];
  for (const quad of store.getQuads(null, null, null, null)) {
    const { subject, predicate, object } = quad;
    if (!isNamedNode(subject) || !isNamedNode(object)) continue;
    if (!isAllowedIri(subject.value, prefixes) || !isAllowedIri(object.value, prefixes)) continue;
    if (IGNORED_PREDICATES.has(predicate.value)) continue;
    if (objectProperties.has(predicate.value)) {
      links.push({
        source: subject.value,
        target: object.value,
        label: shrinkIri(predicate.value, prefixes)
      });
    }
    if (predicate.value === `${PREFIXES.rdfs}subClassOf`) {
      links.push({
        source: subject.value,
        target: object.value,
        label: 'rdfs:subClassOf',
        isHierarchy: true
      });
    }
  }

  const nodes = Array.from(nodeMap.keys()).map(id => {
    const label = labelMap.get(id) ?? shrinkIri(id, prefixes);
    const comment = commentMap.get(id);
    const isClass = classSet.has(id);
    const types = typeMap.get(id) ?? [];
    return {
      id,
      label,
      comment,
      isClass,
      types,
      dataProps: dataProps.get(id) ?? [],
      group: isClass ? 'Class' : inferGroup(types)
    };
  });

  return {
    nodes,
    links,
    prefixes,
    namespaceMap: Object.entries(prefixes).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {})
  };
}

export async function loadPddlDomain() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/pddl/tunnel-domain.pddl`);
  if (!response.ok) {
    throw new Error('Unable to load PDDL domain data.');
  }
  return response.text();
}

export async function loadPddlProblem() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/pddl/solway-problem.pddl`);
  if (!response.ok) {
    throw new Error('Unable to load PDDL problem data.');
  }
  return response.text();
}
