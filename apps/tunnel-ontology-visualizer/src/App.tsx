import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function OntologyVisualizer() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [filter, setFilter] = useState('all');
  const svgRef = useRef(null);

  useEffect(() => {
    // Create sample data for the ontology
    const nodes = [
      // Core entities
      { id: 'SolwayTunnel', group: 'Entity', label: 'Solway Firth Tunnel', size: 20 },
      
      // Physical components
      { id: 'TunnelSection1', group: 'Entity', label: 'Scottish Approach Section', size: 15 },
      { id: 'TunnelSection2', group: 'Entity', label: 'Main Undersea Section', size: 15 },
      { id: 'TunnelSection3', group: 'Entity', label: 'English Approach Section', size: 15 },
      { id: 'TunnelBore1', group: 'Entity', label: 'Scottish Approach Bore', size: 12 },
      { id: 'TunnelLining1', group: 'Entity', label: 'Section 1 Lining', size: 12 },
      { id: 'LiningSegment1', group: 'Entity', label: 'Standard Segment A-Type', size: 10 },
      { id: 'VentilationSystem', group: 'Entity', label: 'Main Ventilation System', size: 12 },
      { id: 'EmergencyExit1', group: 'Entity', label: 'Emergency Exit 1', size: 8 },
      { id: 'EmergencyExit2', group: 'Entity', label: 'Emergency Exit 2', size: 8 },
      
      // Materials
      { id: 'HighStrengthConcrete', group: 'Material', label: 'High Strength Marine Concrete', size: 10 },
      { id: 'MarineGradeSteel', group: 'Material', label: 'Marine Grade Steel', size: 10 },
      { id: 'MembraneWaterproofing', group: 'Material', label: 'HDPE Membrane Waterproofing', size: 10 },
      
      // Processes
      { id: 'TBMExcavation', group: 'Process', label: 'TBM Excavation - Main Drive', size: 12 },
      { id: 'SegmentInstallation', group: 'Process', label: 'Segment Installation', size: 12 },
      { id: 'GroundTreatment', group: 'Process', label: 'Ground Treatment', size: 12 },
      { id: 'SitePreparation', group: 'Process', label: 'Site Preparation', size: 12 },
      
      // Stakeholders
      { id: 'TunnelContractor', group: 'Agent', label: 'Solway Tunnel Construction JV', size: 15 },
      { id: 'EngineeringConsultant', group: 'Agent', label: 'Marine Infrastructure Design Partners', size: 15 },
      { id: 'TransportAuthority', group: 'Agent', label: 'UK Transport Authority', size: 15 },
      { id: 'ProjectManager', group: 'Agent', label: 'Lead Project Manager', size: 10 },
      
      // Information
      { id: 'TunnelDesign', group: 'Information', label: 'Solway Tunnel Detailed Design', size: 12 },
      { id: 'GeotechnicalReport', group: 'Information', label: 'Solway Firth Geotechnical Assessment', size: 12 },
      { id: 'ConstructionPlan', group: 'Information', label: 'Construction Execution Plan', size: 12 },
      { id: 'EnvironmentalAssessment', group: 'Information', label: 'Environmental Impact Assessment', size: 12 },
      
      // Lifecycle phases
      { id: 'FeasibilityPhase', group: 'Lifecycle', label: 'Feasibility Phase', size: 10 },
      { id: 'DesignPhase', group: 'Lifecycle', label: 'Design Phase', size: 10 },
      { id: 'ConstructionPhase', group: 'Lifecycle', label: 'Construction Phase', size: 10 },
      { id: 'CommissioningPhase', group: 'Lifecycle', label: 'Commissioning Phase', size: 10 },
      { id: 'OperationalPhase', group: 'Lifecycle', label: 'Operational Phase', size: 10 },
    ];
    
    // Add intra-category links
    const links = [
      // Physical composition
      { source: 'SolwayTunnel', target: 'TunnelSection1', value: 1, label: 'hasSubOrganization' },
      { source: 'SolwayTunnel', target: 'TunnelSection2', value: 1, label: 'hasSubOrganization' },
      { source: 'SolwayTunnel', target: 'TunnelSection3', value: 1, label: 'hasSubOrganization' },
      { source: 'TunnelSection1', target: 'TunnelBore1', value: 1, label: 'hasBore' },
      { source: 'TunnelSection1', target: 'TunnelLining1', value: 1, label: 'hasLining' },
      { source: 'TunnelLining1', target: 'LiningSegment1', value: 1, label: 'hasSegment' },
      { source: 'SolwayTunnel', target: 'VentilationSystem', value: 1, label: 'hasVentilation' },
      { source: 'SolwayTunnel', target: 'EmergencyExit1', value: 1, label: 'hasEmergencyExit' },
      { source: 'SolwayTunnel', target: 'EmergencyExit2', value: 1, label: 'hasEmergencyExit' },
      
      // Material relationships
      { source: 'LiningSegment1', target: 'HighStrengthConcrete', value: 1, label: 'madeOf' },
      { source: 'LiningSegment1', target: 'MarineGradeSteel', value: 1, label: 'reinforcedWith' },
      { source: 'TunnelLining1', target: 'MembraneWaterproofing', value: 1, label: 'protectedBy' },
      
      // Material intra-category relationships
      { source: 'HighStrengthConcrete', target: 'MarineGradeSteel', value: 1, label: 'compatibleWith' },
      { source: 'HighStrengthConcrete', target: 'MembraneWaterproofing', value: 1, label: 'complementsProperties' },
      { source: 'MarineGradeSteel', target: 'HighStrengthConcrete', value: 1, label: 'complementsProperties' },
      { source: 'MembraneWaterproofing', target: 'HighStrengthConcrete', value: 1, label: 'compatibleWith' },
      
      // Process relationships
      { source: 'TBMExcavation', target: 'TunnelBore1', value: 1, label: 'creates' },
      { source: 'SegmentInstallation', target: 'LiningSegment1', value: 1, label: 'installs' },
      { source: 'GroundTreatment', target: 'TunnelSection1', value: 1, label: 'stabilizes' },
      { source: 'SitePreparation', target: 'ConstructionPhase', value: 1, label: 'precedes' },
      
      // Process intra-category relationships
      { source: 'TBMExcavation', target: 'SitePreparation', value: 1, label: 'dependsOn' },
      { source: 'SegmentInstallation', target: 'TBMExcavation', value: 1, label: 'dependsOn' },
      { source: 'GroundTreatment', target: 'TBMExcavation', value: 1, label: 'sharesResources' },
      { source: 'TBMExcavation', target: 'ConstructionPhase', value: 1, label: 'partOfPhase' },
      { source: 'SegmentInstallation', target: 'ConstructionPhase', value: 1, label: 'partOfPhase' },
      { source: 'GroundTreatment', target: 'ConstructionPhase', value: 1, label: 'partOfPhase' },
      { source: 'SitePreparation', target: 'ConstructionPhase', value: 1, label: 'partOfPhase' },
      
      // Agent relationships
      { source: 'TunnelContractor', target: 'TBMExcavation', value: 1, label: 'performs' },
      { source: 'EngineeringConsultant', target: 'TunnelDesign', value: 1, label: 'creates' },
      { source: 'TransportAuthority', target: 'EnvironmentalAssessment', value: 1, label: 'approves' },
      { source: 'ProjectManager', target: 'ConstructionPlan', value: 1, label: 'manages' },
      
      // Agent intra-category relationships
      { source: 'TunnelContractor', target: 'EngineeringConsultant', value: 1, label: 'contractsWith' },
      { source: 'EngineeringConsultant', target: 'TransportAuthority', value: 1, label: 'collaboratesWith' },
      { source: 'ProjectManager', target: 'EngineeringConsultant', value: 1, label: 'collaboratesWith' },
      { source: 'TunnelContractor', target: 'ProjectManager', value: 1, label: 'collaboratesWith' },
      
      // Information relationships
      { source: 'TunnelDesign', target: 'SolwayTunnel', value: 1, label: 'specifies' },
      { source: 'GeotechnicalReport', target: 'TunnelSection1', value: 1, label: 'informs' },
      { source: 'ConstructionPlan', target: 'TBMExcavation', value: 1, label: 'schedules' },
      { source: 'EnvironmentalAssessment', target: 'SolwayTunnel', value: 1, label: 'evaluates' },
      
      // Information intra-category relationships
      { source: 'TunnelDesign', target: 'GeotechnicalReport', value: 1, label: 'references' },
      { source: 'ConstructionPlan', target: 'TunnelDesign', value: 1, label: 'references' },
      { source: 'EnvironmentalAssessment', target: 'GeotechnicalReport', value: 1, label: 'complementsData' },
      { source: 'ConstructionPlan', target: 'TunnelDesign', value: 1, label: 'updatesInformation' },
      
      // Lifecycle relationships
      { source: 'FeasibilityPhase', target: 'DesignPhase', value: 1, label: 'precedes' },
      { source: 'DesignPhase', target: 'ConstructionPhase', value: 1, label: 'precedes' },
      { source: 'ConstructionPhase', target: 'CommissioningPhase', value: 1, label: 'precedes' },
      { source: 'CommissioningPhase', target: 'OperationalPhase', value: 1, label: 'precedes' },
    ];
    
    setData({ nodes, links });
  }, []);

  const handleNodeClick = node => {
    setSelectedNode(node);
    
    // Clear previous highlights
    highlightNodes.clear();
    highlightLinks.clear();
    
    // Add current node to highlights
    highlightNodes.add(node);
    
    // Add connected links and nodes
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === node.id || targetId === node.id) {
        highlightLinks.add(link);
        
        if (sourceId === node.id) {
          const targetNode = data.nodes.find(n => n.id === targetId);
          if (targetNode) highlightNodes.add(targetNode);
        } else {
          const sourceNode = data.nodes.find(n => n.id === sourceId);
          if (sourceNode) highlightNodes.add(sourceNode);
        }
      }
    });
    
    // Force update
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };
  
  const filterNodes = group => {
    setFilter(group);
  };
  
  const filteredData = React.useMemo(() => {
    if (filter === 'all') {
      return data;
    }
    
    const filteredNodes = data.nodes.filter(node => node.group === filter);
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    const filteredLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [data, filter]);

  useEffect(() => {
    if (!svgRef.current || !filteredData.nodes.length) return;
    
    // Clear existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = 800;
    const height = 600;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    // Create a group element for the graph
    const g = svg.append("g");
    
    // Create a zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Create simulation
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force("link", d3.forceLink(filteredData.links)
        .id(d => d.id)
        .distance(link => {
          // Make intra-category links shorter for tighter clusters
          if (link.source.group === link.target.group) {
            return 60;
          }
          return 150;
        }))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.size * 1.2))
      // Add category clustering force
      .force("group", d3.forceX(d => {
        // Position nodes by group type
        const groupPositions = {
          'Entity': width * 0.2,
          'Material': width * 0.8,
          'Process': width * 0.3,
          'Agent': width * 0.7,
          'Information': width * 0.5,
          'Lifecycle': width * 0.1
        };
        return groupPositions[d.group] || width / 2;
      }).strength(0.2));
    
    // Define arrow markers for links
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#999")
      .attr("d", "M0,-5L10,0L0,5");
    
    // Create links
    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredData.links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("marker-end", "url(#arrow)")
      .attr("stroke", d => {
        // Color links by group type if both nodes are in the same group
        if (d.source.group && d.target.group && d.source.group === d.target.group) {
          const colorMap = {
            'Entity': '#4285F4',      // Blue
            'Material': '#34A853',    // Green
            'Process': '#EA4335',     // Red
            'Agent': '#FBBC05',       // Yellow
            'Information': '#8E44AD', // Purple
            'Lifecycle': '#F39C12'    // Orange
          };
          return colorMap[d.source.group];
        }
        return '#999'; // Default color
      });
    
    // Create link labels
    const linkLabels = g.append("g")
      .selectAll("text")
      .data(filteredData.links)
      .join("text")
      .text(d => d.label)
      .attr("font-size", 8)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "text-before-edge")
      .attr("fill", "#666")
      .attr("opacity", d => {
        // Make intra-category link labels more visible
        if (d.source.group && d.target.group && d.source.group === d.target.group) {
          return 1.0;
        }
        return 0.7;
      });
      
    // Create nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(filteredData.nodes)
      .join("circle")
      .attr("r", d => d.size / 2)
      .attr("fill", d => {
        const colorMap = {
          'Entity': '#4285F4',      // Blue
          'Material': '#34A853',    // Green
          'Process': '#EA4335',     // Red
          'Agent': '#FBBC05',       // Yellow
          'Information': '#8E44AD', // Purple
          'Lifecycle': '#F39C12'    // Orange
        };
        
        // Check if node is highlighted
        if (highlightNodes.has(d)) {
          return '#FF9900'; // Highlighted color
        }
        
        return colorMap[d.group] || '#999';
      })
      .call(drag(simulation));
      
    // Add node labels
    const nodeLabels = g.append("g")
      .selectAll("text")
      .data(filteredData.nodes)
      .join("text")
      .text(d => d.label)
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "text-after-edge")
      .attr("dy", d => -d.size / 2 - 5)
      .attr("pointer-events", "none");
    
    // Add click handler to nodes
    node.on("click", (event, d) => {
      event.stopPropagation();
      handleNodeClick(d);
    });
    
    // Update simulation on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      nodeLabels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
        
      linkLabels
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);
    });
    
    // Drag function for nodes
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    // Clean up on unmount
    return () => {
      simulation.stop();
    };
  }, [filteredData, handleNodeClick, highlightNodes, highlightLinks]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-100">
        <h1 className="text-2xl font-bold mb-2">Solway Firth Tunnel Ontology Visualizer</h1>
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 rounded ${filter === 'Entity' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('Entity')}
          >
            Physical Components
          </button>
          <button 
            className={`px-3 py-1 rounded ${filter === 'Material' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('Material')}
          >
            Materials
          </button>
          <button 
            className={`px-3 py-1 rounded ${filter === 'Process' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('Process')}
          >
            Processes
          </button>
          <button 
            className={`px-3 py-1 rounded ${filter === 'Agent' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('Agent')}
          >
            Stakeholders
          </button>
          <button 
            className={`px-3 py-1 rounded ${filter === 'Information' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('Information')}
          >
            Information
          </button>
          <button 
            className={`px-3 py-1 rounded ${filter === 'Lifecycle' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
            onClick={() => filterNodes('Lifecycle')}
          >
            Lifecycle
          </button>
        </div>
      </div>
      
      <div className="flex flex-1">
        <div className="flex-1 overflow-hidden">
          <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
        
        {selectedNode && (
          <div className="w-64 p-4 bg-gray-100 overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">{selectedNode.label}</h2>
            <p className="text-sm mb-2">Type: {selectedNode.group}</p>
            
            <h3 className="font-bold mt-4 mb-1">Connections:</h3>
            <ul className="text-sm">
              {data.links
                .filter(link => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                  return sourceId === selectedNode.id || targetId === selectedNode.id;
                })
                .map((link, i) => {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                  
                  const isSource = sourceId === selectedNode.id;
                  const connectedNodeId = isSource ? targetId : sourceId;
                  const connectedNode = data.nodes.find(n => n.id === connectedNodeId);
                  const direction = isSource ? 'to' : 'from';
                  
                  if (!connectedNode) return null;
                  
                  return (
                    <li key={i} className="mb-1">
                      <span className="font-semibold">{link.label}</span> {direction} <span className="italic">{connectedNode.label}</span>
                    </li>
                  );
                })}
            </ul>
            
            <button 
              className="mt-4 px-3 py-1 bg-red-500 text-white rounded"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
