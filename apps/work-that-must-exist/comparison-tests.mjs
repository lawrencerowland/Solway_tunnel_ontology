import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import './model-data.js';
import './engine.js';
import './pddl.js';

const summary = {configurations: 0, solved: 0, infeasible: 0, semanticMatches: 0, independentPlanChecks: 0, causalLinksChecked: 0, protectionConstraintsChecked: 0, actionOmissionsRejected: 0, necessityCounterfactuals: 0, functionGroupCounterfactuals: 0, packageConservationChecks: 0, parserRejections: 0};
// Independent expectations based on the two authored method families, without
// importing the ontology's kind/unit annotations used to construct its groups.
const functionGroups = {
  enable: ['gantry-setup', 'trolley-setup-a', 'trolley-setup-b'],
  remove: ['gantry-remove', 'trolley-remove-a', 'trolley-remove-b'],
  'install-a': ['gantry-install-a', 'trolley-install-a'],
  'install-b': ['gantry-install-b', 'trolley-install-b'],
  'inspect-a': ['gantry-inspect-a', 'trolley-inspect-a'],
  'inspect-b': ['gantry-inspect-b', 'trolley-inspect-b']
};
const sorted = xs => [...xs].sort();
const configLabel = config => `${config.scope}/${config.access}/${config.methods}`;
function checkProof(result, baseline) {
  const domain = PDDL.parseDomain(baseline.domain);
  const initial = new Set(PDDL.parseProblem(baseline.problem, domain).initial);
  const plan = result.actions.map(a => a.id);
  const actions = new Map(domain.actions.map(a => [a.id, a]));
  const indices = new Map(plan.map((id, i) => [id, i]));
  for (const edge of result.supports) {
    assert.ok(['positive', 'negative'].includes(edge.polarity));
    const positive = edge.polarity === 'positive';
    const from = edge.from === 'initial' ? -1 : indices.get(edge.from);
    const toGoal = edge.to.startsWith('goal:');
    const to = toGoal ? plan.length : indices.get(edge.to);
    assert.ok(Number.isInteger(from) && Number.isInteger(to) && from < to, `support order ${edge.id}`);
    if (from === -1) assert.equal(initial.has(edge.fact), positive, `initial support ${edge.id}`);
    else assert.ok(actions.get(edge.from)[positive ? 'add' : 'del'].includes(edge.fact), `producer effect ${edge.id}`);
    if (toGoal) {
      const goal = result.obligations.find(o => `goal:${o.id}` === edge.to);
      assert.ok(goal && goal[positive ? 'positive' : 'negative'].includes(edge.fact), `goal recipient ${edge.id}`);
    } else assert.ok(actions.get(edge.to)[positive ? 'pre' : 'not'].includes(edge.fact), `precondition recipient ${edge.id}`);
    for (let i = from + 1; i < to; i++) assert.ok(!actions.get(plan[i])[positive ? 'del' : 'add'].includes(edge.fact), `threatened support ${edge.id}`);
    summary.causalLinksChecked++;
  }
  // No applicable condition or goal may be missing from the explanation.
  for (const action of result.actions) {
    const declaration = actions.get(action.id);
    for (const [polarity, field] of [['positive', 'pre'], ['negative', 'not']]) for (const fact of declaration[field]) assert.equal(result.supports.filter(e => e.to === action.id && e.fact === fact && e.polarity === polarity).length, 1);
    const reachable = new Set([action.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of result.supports) if (reachable.has(edge.from) && !reachable.has(edge.to)) {reachable.add(edge.to); changed = true;}
    }
    const actualGoals = result.obligations.filter(o => reachable.has(`goal:${o.id}`));
    assert.deepEqual(sorted(action.supportedBy), sorted(actualGoals.map(o => o.id)));
    assert.deepEqual(sorted(action.supportedUnits), sorted([...new Set(actualGoals.map(o => o.unit).filter(Boolean))]));
    assert.ok(actualGoals.length > 0, `unjustified chosen action ${action.id}`);
  }
  for (const goal of result.obligations) for (const [polarity, field] of [['positive', 'positive'], ['negative', 'negative']]) for (const fact of goal[field]) assert.equal(result.supports.filter(e => e.to === `goal:${goal.id}` && e.fact === fact && e.polarity === polarity).length, 1);
  for (const edge of result.orderingConstraints || []) {
    assert.equal(edge.kind, 'protection');
    const link = result.supports.find(e => e.id === edge.protects);
    assert.ok(link && link.to === edge.from && link.fact === edge.fact);
    assert.ok(indices.get(edge.from) < indices.get(edge.to));
    assert.ok(actions.get(edge.to)[link.polarity === 'positive' ? 'del' : 'add'].includes(edge.fact));
    summary.protectionConstraintsChecked++;
  }
}

for (const scope of ['both', 'A', 'B', 'none']) for (const access of ['open', 'tight', 'closed']) for (const methods of ['both', 'gantry', 'trolley', 'none']) {
  const config = {scope, access, methods}, label = configLabel(config);
  const result = WorkModel.solve(config), exported = WorkModel.exportPDDL(config);
  const comparison = PDDL.compare(config, exported), baseline = comparison.directPDDL;
  summary.configurations++;
  assert.ok(comparison.valid, `semantic or plan mismatch ${label}`);
  summary.semanticMatches++;
  assert.equal(result.status, comparison.direct.status, `feasibility mismatch ${label}`);
  const possible = scope === 'none' || (access === 'open' && methods !== 'none') || (access === 'tight' && ['both', 'gantry'].includes(methods));
  assert.equal(result.status === 'solved', possible, `known feasibility ${label}`);
  if (result.status === 'infeasible') {assert.deepEqual(result.requiredFunctions, []); summary.infeasible++; continue;}
  summary.solved++;
  const expectedLength = scope === 'none' ? 0 : scope !== 'both' ? 4 : methods === 'trolley' ? 8 : 6;
  assert.equal(result.actions.length, expectedLength, `known shortest length ${label}`);
  assert.equal(result.actions.length, comparison.direct.length, `shortest count mismatch ${label}`);
  const plan = result.actions.map(a => a.id), checked = PDDL.checkPlan(baseline.domain, baseline.problem, plan);
  assert.equal(checked.valid, true, `independent replay ${label}`);
  assert.deepEqual(checked.final, sorted(result.final), `final facts ${label}`);
  summary.independentPlanChecks += 3; // Direct plan, bridge plan and native engine plan.
  const expectedGroups = scope === 'none' ? [] : ['enable', 'remove', ...(scope === 'both' ? ['a', 'b'] : [scope.toLowerCase()]).flatMap(unit => [`install-${unit}`, `inspect-${unit}`])];
  assert.deepEqual(sorted(result.requiredFunctions.map(f => f.id)), sorted(expectedGroups), `function groups ${label}`);
  for (const group of result.requiredFunctions) {
    assert.deepEqual(sorted(group.actionIds), sorted(functionGroups[group.id]), `capability coverage ${label}/${group.id}`);
    const withoutGroup = PDDL.parseDomain(baseline.domain);
    withoutGroup.actions = withoutGroup.actions.filter(a => !functionGroups[group.id].includes(a.id));
    const counterfactual = PDDL.solve(withoutGroup, baseline.problem);
    assert.equal(counterfactual.status, 'infeasible', `independent function necessity ${label}/${group.id}`);
    assert.equal(group.unavoidable, true);
    assert.equal(group.tested, true);
    assert.deepEqual(group.alternativeActionIds, []);
    summary.functionGroupCounterfactuals++;
  }
  for (const [i, action] of result.actions.entries()) {
    assert.deepEqual(result.trace[i].before, checked.trace[i].state, `before state ${label}`);
    assert.deepEqual(result.trace[i].after, checked.trace[i + 1].state, `after state ${label}`);
    assert.equal(PDDL.checkPlan(baseline.domain, baseline.problem, plan.filter((_, j) => i !== j)).valid, false, `omission unexpectedly valid ${label}/${action.id}`);
    summary.actionOmissionsRejected++;
    const domainWithout = PDDL.parseDomain(baseline.domain);
    domainWithout.actions = domainWithout.actions.filter(a => a.id !== action.id);
    const counterfactual = PDDL.solve(domainWithout, baseline.problem);
    assert.notEqual(counterfactual.status, 'limit');
    assert.equal(action.necessity.unavoidable, counterfactual.status === 'infeasible', `necessity claim ${label}/${action.id}`);
    assert.equal(action.necessity.tested, true);
    if (!action.necessity.unavoidable) {
      assert.ok(!action.necessity.alternativeActionIds.includes(action.id));
      assert.equal(PDDL.checkPlan(domainWithout, baseline.problem, action.necessity.alternativeActionIds).valid, true);
      assert.equal(action.necessity.alternativeActionIds.length, counterfactual.length);
    }
    summary.necessityCounterfactuals++;
  }
  checkProof(result, baseline);
  // Apply precisely the same grouping policy to the independent baseline plan.
  const methodsById = new Map(result.problem.actions.map(a => [a.id, a]));
  const directActions = comparison.direct.plan.map(id => ({...methodsById.get(id), supportedBy: [], supportedUnits: []}));
  for (const mode of ['product', 'trade']) {
    const packaged = WorkModel.packagePlan(result, mode);
    const baselinePackaged = WorkModel.packagePlan({...result, actions: directActions}, mode);
    assert.deepEqual(sorted(packaged.packages.flatMap(p => p.actionIds)), sorted(plan));
    assert.equal(new Set(packaged.packages.flatMap(p => p.actionIds)).size, plan.length);
    const contents = packaging => packaging.packages.map(p => `${p.label}:${sorted(p.actionIds).join(',')}`).sort();
    assert.deepEqual(contents(packaged), contents(baselinePackaged), `same packaging criteria ${label}`);
    const assignment = new Map(packaged.packages.flatMap(p => p.actionIds.map(id => [id, p.id])));
    assert.equal(packaged.interfaces.length, [...result.supports, ...(result.orderingConstraints || [])].filter(e => assignment.has(e.from) && assignment.has(e.to) && assignment.get(e.from) !== assignment.get(e.to)).length);
    summary.packageConservationChecks++;
  }
}

// Explicit essay canaries: scope withdrawal preserves shared enabling work once.
const both = WorkModel.solve(), one = WorkModel.solve({scope: 'A'});
const delta = WorkModel.comparePlans(both, one);
assert.deepEqual(sorted(delta.removed.map(a => a.id)), ['gantry-inspect-b', 'gantry-install-b']);
assert.deepEqual(sorted(delta.retained.map(a => a.id)), ['gantry-inspect-a', 'gantry-install-a', 'gantry-remove', 'gantry-setup']);
assert.deepEqual(both.actions.find(a => a.id === 'gantry-setup').supportedUnits, ['A', 'B']);
assert.deepEqual(one.actions.find(a => a.id === 'gantry-setup').supportedUnits, ['A']);
assert.equal(both.actions.filter(a => a.id === 'gantry-setup').length, 1);
assert.ok(both.actions.every(a => !a.necessity.unavoidable));
assert.ok(WorkModel.solve({methods: 'gantry'}).actions.every(a => a.necessity.unavoidable));
assert.equal(WorkModel.solve({methods: 'trolley'}).actions.length, 8);
assert.equal(WorkModel.solve({methods: 'trolley', access: 'tight'}).status, 'infeasible');
assert.equal(WorkModel.solve({scope: 'unrecognised'}).status, 'invalid');

// A plan that achieves then destroys a goal is invalid; goals must persist.
const tiny = `(define (domain tiny) (:requirements :strips :negative-preconditions)
 (:predicates (ready) (done))
 (:action make :parameters () :precondition (and (ready)) :effect (and (done)))
 (:action undo :parameters () :precondition (and (done)) :effect (and (not (done)))))`;
const tinyProblem = `(define (problem test) (:domain tiny) (:init (ready)) (:goal (and (done))))`;
assert.equal(PDDL.checkPlan(tiny, tinyProblem, ['make']).valid, true);
assert.equal(PDDL.checkPlan(tiny, tinyProblem, ['make', 'undo']).valid, false);
assert.equal(PDDL.checkPlan(tiny, tinyProblem, ['undo', 'make']).valid, false);
assert.equal(PDDL.solve(tiny, tinyProblem, {maxStates: 1}).status, 'limit');
assert.equal(PDDL.solve(tiny, tinyProblem.replace('(and (done))', '(and (done) (not (done)))')).status, 'infeasible');
for (const invalid of [
  tiny.replace(':strips :negative-preconditions', ':typing'),
  tiny.replace(':parameters ()', ':parameters (?unit)'),
  tiny.replace('(and (ready))', '(or (ready) (done))'),
  tiny.replace('(and (done)))', '(and (unknown)))'),
  tiny.replace('(and (done)))', '(and (done) (not (done))))'),
  tiny.replace('(:predicates', '(:functions'),
  `${tiny} trailing`,
  tiny.slice(0, -1)
]) {assert.throws(() => PDDL.parseDomain(invalid)); summary.parserRejections++;}
for (const invalid of [
  tinyProblem.replace('(:domain tiny)', '(:domain other)'),
  tinyProblem.replace('(:init', '(:objects a) (:init'),
  tinyProblem.replace('(:init', '(:metric minimise total-cost) (:init'),
  tinyProblem.replace('(ready)', '(not (ready))'),
  tinyProblem.replace('(done)', '(exists (?x) (done))'),
  tinyProblem.replace('(:init (ready))', '(:init (ready)) (:init (ready))')
]) {assert.throws(() => PDDL.parseProblem(invalid, PDDL.parseDomain(tiny))); summary.parserRejections++;}

assert.equal(summary.configurations, 48);
assert.equal(summary.solved, 27);
assert.equal(summary.infeasible, 21);
const files = ['ontology.ttl', 'model-data.js', 'engine.js', 'pddl.js', 'comparison-tests.mjs'];
const filesSHA256 = Object.fromEntries(files.map(file => [file, createHash('sha256').update(readFileSync(new URL(file, import.meta.url))).digest('hex')]));
const report = {status: 'passed', ...summary, filesSHA256, boundary: 'Finite symbolic-model tests only; no physical feasibility or human usability claim.'};
if (process.argv.includes('--write-report')) writeFileSync(new URL('verification.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
