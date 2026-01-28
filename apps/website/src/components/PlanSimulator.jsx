import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadPddlDomain, loadPddlProblem } from '../utils/dataLoader.js';

const DEFAULT_PLAN = [
  { action: 'prepare_site', args: ['north_site'] },
  { action: 'prepare_site', args: ['south_site'] },
  { action: 'assemble_tbm', args: ['tbm1', 'north_site'] },
  { action: 'launch_tbm', args: ['tbm1', 'north_site', 'seg_entry'] },
  { action: 'excavate_and_line_segment', args: ['tbm1', 'seg_entry', 'seg1'] },
  { action: 'excavate_and_line_segment', args: ['tbm1', 'seg1', 'seg2'] },
  { action: 'excavate_and_line_segment', args: ['tbm1', 'seg2', 'seg3'] },
  { action: 'receive_tbm', args: ['tbm1', 'south_site', 'seg_exit'] }
];

const GROUP_MAP = [
  { label: '1.1 Site Preparation', match: action => action.includes('prepare') },
  { label: '1.2 TBM Mobilization', match: action => action.includes('assemble') || action.includes('launch') },
  { label: '1.3 Tunnel Drive', match: action => action.includes('excavate') || action.includes('line') },
  { label: '1.4 TBM Demobilization', match: action => action.includes('receive') }
];

const validatePddl = text => {
  const errors = [];
  let balance = 0;
  for (const char of text) {
    if (char === '(') balance += 1;
    if (char === ')') balance -= 1;
  }
  if (balance !== 0) {
    errors.push('Parentheses are unbalanced.');
  }
  if (!text.includes(':predicates') || !text.includes(':action')) {
    errors.push('Domain should include :predicates and :action sections.');
  }
  return errors;
};

const parsePlanOutput = planText => {
  if (!planText) return [];
  return planText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith(';'))
    .map(line => line.replace(/^\(|\)$/g, ''))
    .map(line => {
      const [action, ...args] = line.split(/\s+/);
      return { action, args };
    });
};

const groupPlan = plan => {
  const groups = {};
  GROUP_MAP.forEach(group => {
    groups[group.label] = [];
  });
  plan.forEach(step => {
    const group = GROUP_MAP.find(item => item.match(step.action));
    if (!group) {
      if (!groups['1.5 Other Actions']) groups['1.5 Other Actions'] = [];
      groups['1.5 Other Actions'].push(step);
      return;
    }
    groups[group.label].push(step);
  });
  return groups;
};

export default function PlanSimulator({ onPlanUpdate, onHighlightOntology }) {
  const containerRef = useRef(null);
  const [domainText, setDomainText] = useState('');
  const [problemText, setProblemText] = useState('');
  const [defaultDomain, setDefaultDomain] = useState('');
  const [defaultProblem, setDefaultProblem] = useState('');
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState([]);
  const [toast, setToast] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const showToast = (message, tone = 'info') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [domain, problem] = await Promise.all([loadPddlDomain(), loadPddlProblem()]);
        setDomainText(domain);
        setProblemText(problem);
        setDefaultDomain(domain);
        setDefaultProblem(problem);
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.setAttribute('data-smoke', 'ok');
          }
        }, 0);
      } catch (err) {
        console.error(err);
        showToast('Unable to load PDDL defaults. Showing fallback plan.', 'error');
      }
    };
    load();

    const watchdog = setTimeout(() => {
      if (containerRef.current?.getAttribute('data-smoke') !== 'ok') {
        showToast('Planner editor timed out. Displaying fallback content.', 'error');
      }
    }, 1200);

    return () => clearTimeout(watchdog);
  }, []);

  useEffect(() => {
    onPlanUpdate?.(plan);
  }, [plan, onPlanUpdate]);

  const groupedPlan = useMemo(() => groupPlan(plan), [plan]);
  const planSummary = useMemo(
    () => ({
      steps: plan.length,
      segments: plan.filter(step => step.action.includes('excavate')).length
    }),
    [plan]
  );

  const handleValidate = () => {
    const issues = validatePddl(domainText);
    setErrors(issues);
    if (issues.length > 0) {
      showToast('Validation failed. Please fix the errors before planning.', 'error');
      return false;
    }
    setErrors([]);
    return true;
  };

  const handlePlan = async () => {
    if (!handleValidate()) return;
    setStatus('loading');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://solver.planning.domains/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainText, problem: problemText }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error('Planning service error');
      }
      const json = await response.json();
      const planText =
        json?.result?.plan?.join('\n') ||
        json?.result?.output?.plan ||
        json?.plan?.join('\n') ||
        '';
      const parsed = parsePlanOutput(planText);
      if (parsed.length === 0) {
        throw new Error('No plan returned');
      }
      setPlan(parsed);
      setStatus('success');
      showToast('Plan generated successfully.', 'success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setPlan(DEFAULT_PLAN);
      showToast('Planner service unavailable. Showing default plan.', 'error');
    }
  };

  const handleReset = () => {
    setDomainText(defaultDomain);
    setProblemText(defaultProblem);
    setPlan(DEFAULT_PLAN);
    setErrors([]);
    setStepIndex(0);
    showToast('Editors reset to default model.', 'info');
  };

  const handleNextStep = () => {
    setStepIndex(prev => Math.min(prev + 1, plan.length - 1));
  };

  const currentStep = plan[stepIndex];

  return (
    <section
      id="pddl-simulator"
      className="space-y-4"
      ref={containerRef}
      data-smoke="pending"
    >
      <header className="space-y-2">
        <h3 className="font-serif text-xl">PDDL Plan Simulator & Editor</h3>
        <p className="text-sm text-slate-600">
          Edit the Solway Tunnel PDDL domain and problem files, validate them, and generate a
          construction plan that maps to the WBS.
        </p>
        <noscript>PDDL plan simulator requires JavaScript.</noscript>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
          onClick={handlePlan}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Running planner…' : 'Run planner'}
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={handleValidate}
        >
          Validate
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={handleReset}
        >
          Reset to default
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">Validation issues:</p>
          <ul className="list-disc list-inside">
            {errors.map(error => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Domain file</h4>
          <textarea
            className="min-h-[16rem] w-full rounded border p-2 font-mono text-xs"
            value={domainText}
            onChange={event => setDomainText(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Problem file</h4>
          <textarea
            className="min-h-[16rem] w-full rounded border p-2 font-mono text-xs"
            value={problemText}
            onChange={event => setProblemText(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold">Plan-derived WBS</h4>
            <p className="text-sm text-slate-600">
              Plan length: {planSummary.steps} actions • Segments excavated: {planSummary.segments}
            </p>
          </div>
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={handleNextStep}
          >
            Step through plan
          </button>
        </div>

        {currentStep && (
          <p className="mt-3 text-sm">
            <span className="font-semibold">Current step:</span> {currentStep.action}(
            {currentStep.args.join(', ')})
          </p>
        )}

        <div className="mt-4 space-y-3">
          {Object.entries(groupedPlan).map(([group, items]) => (
            <details key={group} open className="rounded border bg-white p-3">
              <summary className="cursor-pointer font-semibold">{group}</summary>
              {items.length === 0 ? (
                <p className="text-sm text-slate-600">No actions mapped to this phase.</p>
              ) : (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {items.map((item, index) => {
                    const isActive = currentStep === item;
                    return (
                      <li
                        key={`${item.action}-${index}`}
                        className={isActive ? 'font-semibold text-accent-600' : undefined}
                        onMouseEnter={() => onHighlightOntology?.(item)}
                        onFocus={() => onHighlightOntology?.(item)}
                      >
                        {item.action}({item.args.join(', ')})
                      </li>
                    );
                  })}
                </ol>
              )}
            </details>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded px-4 py-2 text-sm text-white shadow ${
            toast.tone === 'error'
              ? 'bg-red-600'
              : toast.tone === 'success'
              ? 'bg-emerald-600'
              : 'bg-slate-800'
          }`}
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}
