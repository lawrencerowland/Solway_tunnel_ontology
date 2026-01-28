import React, { useMemo, useState } from 'react';

const ONTOLOGY_WBS = [
  { id: '1.1', title: 'Project Management', note: 'Not represented in PDDL plan.' },
  { id: '1.2', title: 'Design & Engineering', note: 'Not represented in PDDL plan.' },
  { id: '1.3', title: 'Site Preparation & Enabling Works' },
  { id: '1.4', title: 'North Portal Construction' },
  { id: '1.5', title: 'South Portal Construction' },
  {
    id: '1.6',
    title: 'Main Tunnel Construction',
    children: [
      { id: '1.6.1', title: 'TBM Procurement, Assembly & Launch' },
      { id: '1.6.2', title: 'Tunnel Excavation & Lining' },
      { id: '1.6.3', title: 'TBM Reception & Dismantling' },
      { id: '1.6.4', title: 'Cross-Passage Construction' }
    ]
  },
  { id: '1.7', title: 'Tunnel Systems Installation' },
  { id: '1.8', title: 'Testing & Commissioning' }
];

const mapPlanToWbs = plan => {
  const grouped = {
    '1.1 Site Preparation': [],
    '1.2 TBM Mobilization': [],
    '1.3 Tunnel Drive': [],
    '1.4 TBM Demobilization': []
  };
  plan.forEach(step => {
    if (step.action.includes('prepare')) grouped['1.1 Site Preparation'].push(step);
    else if (step.action.includes('assemble') || step.action.includes('launch'))
      grouped['1.2 TBM Mobilization'].push(step);
    else if (step.action.includes('excavate')) grouped['1.3 Tunnel Drive'].push(step);
    else if (step.action.includes('receive')) grouped['1.4 TBM Demobilization'].push(step);
    else grouped['1.5 Other Actions'] = [...(grouped['1.5 Other Actions'] ?? []), step];
  });
  return grouped;
};

const Tree = ({ nodes }) => (
  <ul className="space-y-2">
    {nodes.map(node => (
      <li key={node.id} className="text-sm text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{node.id}</span>
          <span>{node.title}</span>
          {node.note && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {node.note}
            </span>
          )}
        </div>
        {node.children && node.children.length > 0 && (
          <ul className="ml-6 mt-2 list-disc space-y-1">
            {node.children.map(child => (
              <li key={child.id} className="text-sm text-slate-600">
                <span className="font-semibold">{child.id}</span> {child.title}
              </li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ul>
);

export default function WBSComparator({ plan = [] }) {
  const [activeMapping, setActiveMapping] = useState(null);
  const groupedPlan = useMemo(() => mapPlanToWbs(plan), [plan]);

  return (
    <section id="wbs-comparison" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl">WBS Comparison & Analysis</h3>
          <p className="text-sm text-slate-600">
            Compare the ontology-driven WBS (scope and coverage) with the PDDL-derived plan WBS
            (execution sequence).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h4 className="font-semibold">Ontology-derived WBS</h4>
          <Tree nodes={ONTOLOGY_WBS} />
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h4 className="font-semibold">PDDL-derived WBS</h4>
          <ul className="space-y-3 text-sm text-slate-700">
            {Object.entries(groupedPlan).map(([group, steps]) => (
              <li key={group}>
                <button
                  type="button"
                  className="w-full text-left font-semibold"
                  onClick={() => setActiveMapping(group)}
                >
                  {group}
                </button>
                <ul className="ml-6 mt-2 list-disc space-y-1">
                  {steps.length === 0 ? (
                    <li className="text-slate-500">No actions defined.</li>
                  ) : (
                    steps.map((step, index) => (
                      <li key={`${group}-${index}`} className="text-slate-600">
                        {step.action}({step.args.join(', ')})
                      </li>
                    ))
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {activeMapping && (
        <p className="text-sm text-slate-600">
          Selected: <span className="font-semibold">{activeMapping}</span>. Use this to align
          ontology work packages with plan steps.
        </p>
      )}
    </section>
  );
}
