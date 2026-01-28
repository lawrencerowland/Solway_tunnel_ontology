import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle
} from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { loadOntologyGraph } from '../utils/dataLoader.js';

const DEFAULT_FALLBACK_NODES = [
  'Solway Firth Tunnel',
  'Tunnel Section',
  'Tunnel Bore',
  'Tunnel Lining',
  'Lining Segment',
  'Ventilation System',
  'Emergency Exit',
  'Excavation Process',
  'Segment Installation'
];

const groupColors = {
  Class: '#475569',
  'Physical Component': '#0ea5e9',
  Process: '#f97316',
  Agent: '#22c55e',
  Information: '#a855f7',
  Lifecycle: '#facc15',
  Material: '#14b8a6',
  Default: '#94a3b8'
};

function buildNeighborMap(links) {
  const map = new Map();
  links.forEach(link => {
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    if (!map.has(source)) map.set(source, []);
    if (!map.has(target)) map.set(target, []);
    map.get(source).push({ id: target, label: link.label });
    map.get(target).push({ id: source, label: link.label });
  });
  return map;
}

const OntologyGraph = forwardRef(function OntologyGraph(_, ref) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('instances');
  const [toast, setToast] = useState(null);

  const neighborMap = useMemo(() => buildNeighborMap(graphData.links), [graphData.links]);
  const nodeMap = useMemo(() => {
    const map = new Map();
    graphData.nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [graphData.nodes]);

  const showToast = (message, tone = 'error') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4500);
  };

  useImperativeHandle(ref, () => ({
    focusNode: nodeId => {
      const localId = nodeId?.includes(':') ? nodeId.split(':').pop() : nodeId;
      const node =
        nodeMap.get(nodeId) ||
        graphData.nodes.find(
          item => item.id.endsWith(localId) || item.id.endsWith(nodeId) || item.label === nodeId
        );
      if (node) {
        setSelectedNode(node);
        if (graphRef.current) {
          graphRef.current.centerAt(node.x ?? 0, node.y ?? 0, 800);
          graphRef.current.zoom(3, 800);
        }
      }
    },
    highlightNodes: nodeIds => {
      if (nodeIds.length === 0) return;
      const node = nodeMap.get(nodeIds[0]);
      if (node) {
        setSelectedNode(node);
      }
    }
  }));

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await loadOntologyGraph();
        if (!active) return;
        setGraphData(data);
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.setAttribute('data-smoke', 'ok');
          }
        }, 0);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError('Ontology data could not be loaded.');
        showToast('Interactive ontology graph failed to load. Showing static backup.');
      }
    };
    load();

    const watchdog = setTimeout(() => {
      if (containerRef.current?.getAttribute('data-smoke') !== 'ok') {
        setError('Ontology graph initialization timed out.');
        showToast('Ontology graph timed out. Showing static backup.');
      }
    }, 1200);

    return () => {
      active = false;
      clearTimeout(watchdog);
    };
  }, []);

  useEffect(() => {
    if (!graphData.nodes.length) return;
    const hash = window.location.hash;
    if (!hash.includes('ontology-graph')) return;
    const match = hash.match(/node=([^&]+)/);
    if (match) {
      const nodeId = decodeURIComponent(match[1]);
      const node = graphData.nodes.find(item =>
        item.id.endsWith(nodeId) || item.label?.includes(nodeId)
      );
      if (node) {
        setSelectedNode(node);
      }
    }
  }, [graphData]);

  const categories = useMemo(() => {
    const set = new Set(graphData.nodes.map(node => node.group));
    return ['All', ...Array.from(set)];
  }, [graphData.nodes]);

  const filteredData = useMemo(() => {
    let nodes = graphData.nodes;
    let links = graphData.links;
    if (viewMode === 'classes') {
      nodes = nodes.filter(node => node.isClass);
      links = links.filter(link => link.isHierarchy);
    }
    if (viewMode === 'instances') {
      nodes = nodes.filter(node => !node.isClass);
    }
    if (filter !== 'All') {
      nodes = nodes.filter(node => node.group === filter);
    }
    const nodeIds = new Set(nodes.map(node => node.id));
    links = links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
    return { nodes, links };
  }, [graphData, filter, viewMode]);

  const highlightNodes = useMemo(() => {
    if (!selectedNode) return new Set();
    const neighbors = neighborMap.get(selectedNode.id) ?? [];
    return new Set([selectedNode.id, ...neighbors.map(item => item.id)]);
  }, [selectedNode, neighborMap]);

  const highlightLinks = useMemo(() => {
    if (!selectedNode) return new Set();
    return new Set(
      graphData.links.filter(link => {
        const source = typeof link.source === 'object' ? link.source.id : link.source;
        const target = typeof link.target === 'object' ? link.target.id : link.target;
        return source === selectedNode.id || target === selectedNode.id;
      })
    );
  }, [graphData.links, selectedNode]);

  const neighborsByRelation = useMemo(() => {
    if (!selectedNode) return {};
    const neighbors = neighborMap.get(selectedNode.id) ?? [];
    return neighbors.reduce((acc, neighbor) => {
      if (!acc[neighbor.label]) acc[neighbor.label] = [];
      acc[neighbor.label].push(neighbor);
      return acc;
    }, {});
  }, [neighborMap, selectedNode]);

  if (error) {
    return (
      <section id="ontology-graph" className="space-y-4" ref={containerRef}>
        <h3 className="font-serif text-xl">Ontology Graph Explorer</h3>
        <p className="text-sm text-slate-700">{error}</p>
        <div className="rounded-lg border bg-slate-50 p-4">
          <p className="font-semibold">Key ontology elements:</p>
          <ul className="list-disc list-inside">
            {DEFAULT_FALLBACK_NODES.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      id="ontology-graph"
      ref={containerRef}
      className="space-y-4"
      data-smoke="pending"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl">Ontology Graph Explorer</h3>
          <p className="text-sm text-slate-600">
            Explore classes, individuals, and relationships in the Solway Firth Tunnel ontology.
          </p>
        </div>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm hover:border-slate-400"
          onClick={() => graphRef.current?.zoomToFit?.(600)}
        >
          Reset view
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            type="button"
            className={`rounded border px-3 py-1 text-sm ${
              filter === category ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            className={`rounded border px-3 py-1 text-sm ${
              viewMode === 'instances' ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
            onClick={() => setViewMode('instances')}
          >
            Individuals
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-1 text-sm ${
              viewMode === 'classes' ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
            onClick={() => setViewMode('classes')}
          >
            Class hierarchy
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-1 text-sm ${
              viewMode === 'all' ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
            onClick={() => setViewMode('all')}
          >
            All nodes
          </button>
        </div>
      </div>

      <div
        id="ontology-graph-container"
        className="grid gap-4 lg:grid-cols-[2fr,1fr]"
      >
        <div className="min-h-[24rem] rounded-lg border bg-white">
          <noscript>Interactive ontology graph (requires JavaScript).</noscript>
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeLabel={node => `${node.label}\n${node.group}`}
            linkLabel={link => link.label}
            nodeColor={node =>
              highlightNodes.has(node.id)
                ? '#1d4ed8'
                : groupColors[node.group] ?? groupColors.Default
            }
            linkColor={link => (highlightLinks.has(link) ? '#1d4ed8' : '#94a3b8')}
            linkWidth={link => (highlightLinks.has(link) ? 2.6 : 1)}
            nodeRelSize={6}
            onNodeClick={node => setSelectedNode(node)}
            cooldownTime={1500}
          />
        </div>

        <aside className="rounded-lg border bg-slate-50 p-4">
          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">{selectedNode.group}</p>
                <h4 className="font-serif text-lg">{selectedNode.label}</h4>
                {selectedNode.comment && (
                  <p className="text-sm text-slate-700">{selectedNode.comment}</p>
                )}
              </div>
              {selectedNode.dataProps?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Attributes</p>
                  <ul className="text-sm text-slate-700">
                    {selectedNode.dataProps.map(item => (
                      <li key={`${item.predicate}-${item.value}`}>
                        <span className="font-semibold">{item.predicate}</span>: {item.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">Connections</p>
                {Object.keys(neighborsByRelation).length === 0 ? (
                  <p className="text-sm text-slate-600">No direct relationships recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(neighborsByRelation).map(([relation, neighbors]) => (
                      <div key={relation}>
                        <p className="text-sm text-slate-500">{relation}</p>
                        <ul className="text-sm text-slate-700">
                          {neighbors.map(neighbor => {
                            const node = nodeMap.get(neighbor.id);
                            return (
                              <li key={`${relation}-${neighbor.id}`}>
                                <button
                                  type="button"
                                  className="text-left text-accent-600 hover:underline"
                                  onClick={() => setSelectedNode(node)}
                                >
                                  {node?.label ?? neighbor.id}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Select a node to view its definition, attributes, and connections.
            </p>
          )}
        </aside>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded px-4 py-2 text-sm text-white shadow ${
            toast.tone === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </section>
  );
});

export default OntologyGraph;
