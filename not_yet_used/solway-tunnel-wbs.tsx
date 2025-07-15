import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

const OntologyBasedWBS = () => {
  const [expandedNodes, setExpandedNodes] = useState({
    '1': true,
    '2': false,
    '3': false,
    '4': true,
    '4.1': false,
    '4.2': false,
    '4.3': true,
    '4.3.1': false,
    '4.3.2': false,
    '4.3.3': true,
    '4.3.3.1': false,
    '4.3.3.2': false,
    '4.3.3.3': false,
    '4.3.3.4': false,
    '4.4': false,
    '4.5': false,
    '5': false,
    '6': false,
    '7': false,
  });
  
  const [selectedNode, setSelectedNode] = useState('4.3.3');
  const [viewMode, setViewMode] = useState('hierarchy'); // hierarchy or ontology
  
  // WBS data structure with ontology information
  const wbsData = {
    '1': {
      id: '1',
      name: 'Project Initiation',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Initial project setup, requirements gathering, and stakeholder engagement.',
      children: [],
      ontologyRelations: [
        { subject: 'ProjectInitiation', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'ProjectInitiation', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: [],
      processes: ['RequirementsDefinition', 'StakeholderEngagement']
    },
    '2': {
      id: '2',
      name: 'Planning',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Detailed planning of tunnel design, resource allocation, and risk assessment.',
      children: [],
      ontologyRelations: [
        { subject: 'Planning', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'Planning', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: ['TunnelDesign', 'ResourceAllocationPlan'],
      processes: ['DesignProcess', 'RiskAssessment']
    },
    '3': {
      id: '3',
      name: 'Site Preparation',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Preparing sites on both shores of the Solway Firth for tunnel construction.',
      children: [],
      ontologyRelations: [
        { subject: 'SitePreparation', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'SitePreparation', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: ['ConstructionSite', 'AccessRoads'],
      processes: ['LandClearing', 'TemporaryInfrastructureSetup']
    },
    '4': {
      id: '4',
      name: 'Tunnel Construction',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Main phase for construction of the tunnel structure.',
      children: ['4.1', '4.2', '4.3', '4.4', '4.5'],
      ontologyRelations: [
        { subject: 'TunnelConstruction', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'TunnelConstruction', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: ['TunnelStructure'],
      processes: ['Construction', 'QualityControl']
    },
    '4.1': {
      id: '4.1',
      name: 'North Portal Construction',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Construction of the northern entrance to the tunnel.',
      children: [],
      ontologyRelations: [
        { subject: 'NorthPortalConstruction', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'NorthPortalConstruction', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'NorthPortalConstruction', predicate: 'pm:delivers', object: 'st:NorthPortal' },
        { subject: 'NorthPortalConstruction', predicate: 'pm:partOf', object: 'TunnelConstruction' }
      ],
      physicalComponents: ['NorthPortal', 'EntranceStructure'],
      processes: ['Excavation', 'Reinforcement', 'Concreting']
    },
    '4.2': {
      id: '4.2',
      name: 'South Portal Construction',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Construction of the southern entrance to the tunnel.',
      children: [],
      ontologyRelations: [
        { subject: 'SouthPortalConstruction', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'SouthPortalConstruction', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'SouthPortalConstruction', predicate: 'pm:delivers', object: 'st:SouthPortal' },
        { subject: 'SouthPortalConstruction', predicate: 'pm:partOf', object: 'TunnelConstruction' }
      ],
      physicalComponents: ['SouthPortal', 'EntranceStructure'],
      processes: ['Excavation', 'Reinforcement', 'Concreting']
    },
    '4.3': {
      id: '4.3',
      name: 'Tunnel Boring',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Core tunnel boring activities using TBM to create the main tunnel shaft.',
      children: ['4.3.1', '4.3.2', '4.3.3', '4.3.4'],
      ontologyRelations: [
        { subject: 'TunnelBoring', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'TunnelBoring', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'TunnelBoring', predicate: 'pm:delivers', object: 'st:TunnelShaft' },
        { subject: 'TunnelBoring', predicate: 'pm:partOf', object: 'TunnelConstruction' }
      ],
      physicalComponents: ['TunnelShaft', 'TunnelBoringMachine'],
      processes: ['Boring', 'MaterialRemoval', 'ProgressMonitoring']
    },
    '4.3.1': {
      id: '4.3.1',
      name: 'TBM Procurement',
      type: 'ProcurementActivity',
      bfoClass: 'Process',
      description: 'Sourcing and acquisition of tunnel boring machines.',
      children: [],
      ontologyRelations: [
        { subject: 'TBMProcurement', predicate: 'rdf:type', object: 'pm:ProcurementActivity' },
        { subject: 'TBMProcurement', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'TBMProcurement', predicate: 'pm:acquires', object: 'st:TunnelBoringMachine' },
        { subject: 'TBMProcurement', predicate: 'pm:partOf', object: 'TunnelBoring' }
      ],
      physicalComponents: ['TunnelBoringMachine'],
      processes: ['Procurement', 'Logistics', 'QualityAssurance']
    },
    '4.3.2': {
      id: '4.3.2',
      name: 'Geological Assessment',
      type: 'EngineeringAssessment',
      bfoClass: 'Process',
      description: 'Detailed geological surveys to assess underwater terrain conditions.',
      children: [],
      ontologyRelations: [
        { subject: 'GeologicalAssessment', predicate: 'rdf:type', object: 'st:EngineeringAssessment' },
        { subject: 'GeologicalAssessment', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'GeologicalAssessment', predicate: 'pm:assesses', object: 'st:GeologicalFormation' },
        { subject: 'GeologicalAssessment', predicate: 'pm:partOf', object: 'TunnelBoring' }
      ],
      physicalComponents: ['GeologicalFormation', 'SoilSamples'],
      processes: ['Surveying', 'Sampling', 'Analysis']
    },
    '4.3.3': {
      id: '4.3.3',
      name: 'TBM Operation',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Operation of the tunnel boring machine to excavate the tunnel path.',
      children: ['4.3.3.1', '4.3.3.2', '4.3.3.3', '4.3.3.4'],
      ontologyRelations: [
        { subject: 'TBMOperation', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'TBMOperation', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'TBMOperation', predicate: 'pm:uses', object: 'st:TunnelBoringMachine' },
        { subject: 'TBMOperation', predicate: 'pm:partOf', object: 'TunnelBoring' }
      ],
      physicalComponents: ['TunnelBoringMachine', 'TunnelSegments'],
      processes: ['Excavation', 'MachineryOperation', 'ProgressMonitoring']
    },
    '4.3.3.1': {
      id: '4.3.3.1',
      name: 'TBM Setup',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Initial setup and calibration of the tunnel boring machine.',
      children: [],
      ontologyRelations: [
        { subject: 'TBMSetup', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'TBMSetup', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'TBMSetup', predicate: 'pm:configures', object: 'st:TunnelBoringMachine' },
        { subject: 'TBMSetup', predicate: 'pm:partOf', object: 'TBMOperation' }
      ],
      physicalComponents: ['TunnelBoringMachine', 'LaunchChamber'],
      processes: ['Assembly', 'Calibration', 'Testing']
    },
    '4.3.3.2': {
      id: '4.3.3.2',
      name: 'Pilot Tunneling',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Initial tunneling to create a pilot passage.',
      children: [],
      ontologyRelations: [
        { subject: 'PilotTunneling', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'PilotTunneling', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'PilotTunneling', predicate: 'pm:creates', object: 'st:PilotTunnel' },
        { subject: 'PilotTunneling', predicate: 'pm:partOf', object: 'TBMOperation' }
      ],
      physicalComponents: ['PilotTunnel', 'TunnelBoringMachine'],
      processes: ['Excavation', 'GeologicalAssessment', 'ProgressMonitoring']
    },
    '4.3.3.3': {
      id: '4.3.3.3',
      name: 'Main Tunneling',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Primary tunneling operation to create the main tunnel shaft.',
      children: [],
      ontologyRelations: [
        { subject: 'MainTunneling', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'MainTunneling', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'MainTunneling', predicate: 'pm:creates', object: 'st:MainTunnelShaft' },
        { subject: 'MainTunneling', predicate: 'pm:partOf', object: 'TBMOperation' }
      ],
      physicalComponents: ['MainTunnelShaft', 'TunnelBoringMachine'],
      processes: ['Excavation', 'SegmentInstallation', 'ProgressMonitoring']
    },
    '4.3.3.4': {
      id: '4.3.3.4',
      name: 'TBM Maintenance',
      type: 'MaintenanceActivity',
      bfoClass: 'Process',
      description: 'Regular maintenance of the tunnel boring machine to ensure optimal operation.',
      children: [],
      ontologyRelations: [
        { subject: 'TBMMaintenance', predicate: 'rdf:type', object: 'st:MaintenanceActivity' },
        { subject: 'TBMMaintenance', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'TBMMaintenance', predicate: 'pm:maintains', object: 'st:TunnelBoringMachine' },
        { subject: 'TBMMaintenance', predicate: 'pm:partOf', object: 'TBMOperation' }
      ],
      physicalComponents: ['TunnelBoringMachine', 'MaintenanceEquipment'],
      processes: ['Inspection', 'Repair', 'Replacement']
    },
    '4.3.4': {
      id: '4.3.4',
      name: 'Spoil Removal',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Removal and disposal of excavated materials from tunneling.',
      children: [],
      ontologyRelations: [
        { subject: 'SpoilRemoval', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'SpoilRemoval', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'SpoilRemoval', predicate: 'pm:removes', object: 'st:ExcavatedMaterial' },
        { subject: 'SpoilRemoval', predicate: 'pm:partOf', object: 'TunnelBoring' }
      ],
      physicalComponents: ['ExcavatedMaterial', 'ConveyorSystems'],
      processes: ['MaterialTransport', 'Disposal', 'EnvironmentalManagement']
    },
    '4.4': {
      id: '4.4',
      name: 'Tunnel Lining',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Installation of permanent lining structures within the tunnel.',
      children: [],
      ontologyRelations: [
        { subject: 'TunnelLining', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'TunnelLining', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'TunnelLining', predicate: 'pm:delivers', object: 'st:TunnelLiningStructure' },
        { subject: 'TunnelLining', predicate: 'pm:partOf', object: 'TunnelConstruction' }
      ],
      physicalComponents: ['TunnelLiningStructure', 'ConcreteElements'],
      processes: ['Reinforcement', 'Concreting', 'QualityControl']
    },
    '4.5': {
      id: '4.5',
      name: 'Waterproofing System',
      type: 'ConstructionActivity',
      bfoClass: 'Process',
      description: 'Installation of waterproofing to prevent water ingress into the tunnel.',
      children: [],
      ontologyRelations: [
        { subject: 'WaterproofingSystem', predicate: 'rdf:type', object: 'st:ConstructionActivity' },
        { subject: 'WaterproofingSystem', predicate: 'rdf:type', object: 'bfo:Process' },
        { subject: 'WaterproofingSystem', predicate: 'pm:delivers', object: 'st:WaterproofingLayer' },
        { subject: 'WaterproofingSystem', predicate: 'pm:partOf', object: 'TunnelConstruction' }
      ],
      physicalComponents: ['WaterproofingLayer', 'WaterproofingMaterials'],
      processes: ['Sealing', 'Injection', 'Testing']
    },
    '5': {
      id: '5',
      name: 'Systems Installation',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Installation of operational systems within the tunnel.',
      children: [],
      ontologyRelations: [
        { subject: 'SystemsInstallation', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'SystemsInstallation', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: ['VentilationSystem', 'LightingSystem', 'SafetySystems'],
      processes: ['Installation', 'Configuration', 'Integration']
    },
    '6': {
      id: '6',
      name: 'Testing & Commissioning',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Testing and commissioning of the completed tunnel structure and systems.',
      children: [],
      ontologyRelations: [
        { subject: 'TestingCommissioning', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'TestingCommissioning', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: ['TestingEquipment', 'MonitoringSystems'],
      processes: ['FunctionalTesting', 'SystemsIntegrationTesting', 'Commissioning']
    },
    '7': {
      id: '7',
      name: 'Project Closure',
      type: 'ProjectPhase',
      bfoClass: 'Process',
      description: 'Final activities to formally complete the project.',
      children: [],
      ontologyRelations: [
        { subject: 'ProjectClosure', predicate: 'rdf:type', object: 'pm:ProjectPhase' },
        { subject: 'ProjectClosure', predicate: 'rdf:type', object: 'bfo:Process' }
      ],
      physicalComponents: ['DocumentationArchive', 'AssetRegister'],
      processes: ['Handover', 'Documentation', 'LessonsLearned']
    }
  };
  
  // Get root level items
  const rootItems = Object.values(wbsData).filter(item => 
    item.id.split('.').length === 1
  );
  
  // Toggle expansion of a node
  const toggleNode = (nodeId) => {
    setExpandedNodes({
      ...expandedNodes,
      [nodeId]: !expandedNodes[nodeId]
    });
  };
  
  // Select a node to display details
  const selectNode = (nodeId) => {
    setSelectedNode(nodeId);
  };
  
  // Render a WBS node
  const renderNode = (node) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedNode === node.id;
    
    return (
      <div key={node.id} className="mb-1">
        <div 
          className={`flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer ${isSelected ? 'bg-blue-100' : ''}`}
          onClick={() => selectNode(node.id)}
        >
          {hasChildren ? (
            <div 
              className="mr-1 text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div className="w-4 h-4 mr-1"></div>
          )}
          <div className="flex items-center">
            <span className="font-mono mr-2">{node.id}</span>
            <span>{node.name}</span>
            <span className="ml-2 text-xs text-gray-500">({node.type})</span>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-6 pl-2 border-l border-gray-300">
            {node.children.map(childId => renderNode(wbsData[childId]))}
          </div>
        )}
      </div>
    );
  };
  
  // Render the details panel for a selected node
  const renderDetailsPanel = () => {
    const node = wbsData[selectedNode];
    if (!node) return null;
    
    return (
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2">{node.id}: {node.name}</h3>
        <p className="text-gray-700 mb-4">{node.description}</p>
        
        {viewMode === 'hierarchy' ? (
          <>
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">CLASSIFICATION</h4>
              <div className="bg-gray-50 p-2 rounded">
                <p><span className="font-semibold">Type:</span> {node.type}</p>
                <p><span className="font-semibold">BFO Class:</span> {node.bfoClass}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">PHYSICAL COMPONENTS</h4>
                <div className="bg-blue-50 p-2 rounded">
                  {node.physicalComponents.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {node.physicalComponents.map((component, index) => (
                        <li key={index}>{component}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No physical components</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">PROCESSES</h4>
                <div className="bg-green-50 p-2 rounded">
                  {node.processes.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {node.processes.map((process, index) => (
                        <li key={index}>{process}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No processes</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">ONTOLOGY RELATIONS</h4>
            <div className="bg-purple-50 p-2 rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-200">
                    <th className="text-left py-1 px-2">Subject</th>
                    <th className="text-left py-1 px-2">Predicate</th>
                    <th className="text-left py-1 px-2">Object</th>
                  </tr>
                </thead>
                <tbody>
                  {node.ontologyRelations.map((relation, index) => (
                    <tr key={index} className="border-b border-purple-100">
                      <td className="py-1 px-2">{relation.subject}</td>
                      <td className="py-1 px-2 font-mono text-xs">{relation.predicate}</td>
                      <td className="py-1 px-2">{relation.object}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Main component render
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Solway Firth Tunnel WBS</h2>
        <div className="flex">
          <button
            className={`px-3 py-1 rounded-l ${viewMode === 'hierarchy' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('hierarchy')}
          >
            Hierarchy View
          </button>
          <button
            className={`px-3 py-1 rounded-r ${viewMode === 'ontology' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('ontology')}
          >
            Ontology View
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 mb-4 rounded-lg shadow text-sm">
        <div className="flex items-start">
          <Info className="text-blue-500 mr-2 flex-shrink-0 mt-1" size={16} />
          <p>
            This WBS is constructed using the <strong>Basic Formal Ontology (BFO)</strong> as a foundation, 
            integrated with domain ontologies for construction, geotechnical engineering, and project management.
            Each WBS element is explicitly linked to physical components (continuants) and processes (occurrents).
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow overflow-y-auto" style={{ maxHeight: '500px' }}>
          <h3 className="text-lg font-semibold mb-2">Work Breakdown Structure</h3>
          <div>
            {rootItems.map(node => renderNode(node))}
          </div>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
          {renderDetailsPanel()}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Advantages of this Ontology-Based WBS:</strong></p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Clear semantic relationships between work packages and physical deliverables</li>
          <li>Explicit representation of both physical objects and processes</li>
          <li>Improved explainability through ontological connections</li>
          <li>Knowledge reuse potential across similar projects</li>
          <li>Foundation for automated reasoning and consistency checking</li>
        </ul>
      </div>
    </div>
  );
};

export default OntologyBasedWBS;
