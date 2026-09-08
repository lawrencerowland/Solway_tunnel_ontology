// Resolve the collection from both a custom-domain root and a Pages repo prefix.
const marker = '/apps/website';
const markerIndex = window.location.pathname.indexOf(marker);
const collectionPath = markerIndex < 0 ? '/' : `${window.location.pathname.slice(0, markerIndex)}/`;
const collectionURL = new URL(collectionPath, window.location.origin);

export const siteLinks = {
  home: new URL('index.html', collectionURL).href,
  apps: new URL('app-index.html', collectionURL).href,
  game: new URL('apps/semantic-tunnel-planner/index.html', collectionURL).href,
  essay: new URL('apps/work-that-must-exist/index.html', collectionURL).href,
  explanation: new URL('apps/work-that-must-exist/index.html#scope=both&access=open&methods=both&view=wbs', collectionURL).href,
  ontologyData: new URL('apps/website/data/solway_tunnel_ontology.ttl', collectionURL).href,
  curation: new URL('CURATION.md', collectionURL).href,
  forays: 'https://lawrencerowland.github.io/side-projects.html#playgrounds'
};

export const websiteBasename = markerIndex < 0
  ? import.meta.env.BASE_URL
  : `${window.location.pathname.slice(0, markerIndex)}${marker}/`;
