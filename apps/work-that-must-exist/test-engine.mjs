import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import './model-data.js';
import './engine.js';

const W = globalThis.WorkModel;
let checks = 0;
const check = (condition, message) => {assert.ok(condition, message); checks++;};
function replay(problem, actionIds) {
  const state = new Set(problem.initial), actions = new Map(problem.actions.map(a => [a.id, a]));
  for (const id of actionIds) {
    const a = actions.get(id);
    check(a && a.positive.every(f => state.has(f)) && a.negative.every(f => !state.has(f)), `Applicable action ${id}`);
    a.delete.forEach(f => state.delete(f)); a.add.forEach(f => state.add(f));
  }
  return problem.goal.positive.every(f => state.has(f)) && problem.goal.negative.every(f => !state.has(f));
}

let cases = 0;
for (const scope of ['both', 'A', 'B', 'none']) for (const access of ['open', 'tight', 'closed']) for (const methods of ['both', 'gantry', 'trolley', 'none']) {
  const config = {scope, access, methods}, r = W.solve(config);
  const possible = scope === 'none' || (access !== 'closed' && (methods === 'both' || methods === 'gantry' || (access === 'open' && methods === 'trolley')));
  check((r.status === 'solved') === possible, `Expected feasibility ${JSON.stringify(config)}`);
  check(r.stats.complete, 'Finite search must complete');
  if (possible) {
    const expected = scope === 'none' ? 0 : scope !== 'both' ? 4 : methods === 'trolley' ? 8 : 6;
    check(r.actions.length === expected, 'Expected shortest action count');
    check(replay(r.problem, r.actions.map(a => a.id)), 'Chosen route reaches every completion condition');
    check(r.obligations.every(o => o.satisfied), 'Obligations are discharged');
    check(r.requiredFunctions.length === (scope === 'none' ? 0 : scope === 'both' ? 6 : 4), 'Function count reflects scope, independent of chosen access method');
    for (const group of r.requiredFunctions) {
      check(group.tested && group.unavoidable, 'All declared functions in this vignette are unavoidable');
      const counterfactual = W.search(r.problem, {forbidden: group.actionIds});
      check(counterfactual.status === 'infeasible' && counterfactual.exhaustive, 'Function necessity has an exhaustive group-ban proof');
    }
    check(r.actions.every(a => !a.unit || scope === 'both' || a.unit === scope), 'No work performed on an out-of-scope unit');
    for (const action of r.actions) {
      check(action.supportedBy.length > 0, 'Every selected action has an explained goal use');
      if (!action.necessity.unavoidable) {
        check(!action.necessity.alternativeActionIds.includes(action.id), 'Counterfactual route excludes banned action');
        check(replay(r.problem, action.necessity.alternativeActionIds), 'Counterfactual is a real completion route');
      } else {
        const counterfactual = W.search(r.problem, {forbidden: [action.id]});
        check(counterfactual.status === 'infeasible' && counterfactual.exhaustive, 'Unavoidability has an exhaustive finite proof');
      }
    }
    for (const mode of ['product', 'trade']) {
      const p = W.packagePlan(r, mode), ids = p.packages.flatMap(x => x.actionIds);
      assert.deepEqual([...ids].sort(), r.actions.map(a => a.id).sort()); checks++;
      check(new Set(ids).size === ids.length, 'Shared work appears exactly once in a WBS');
      check(p.packages.every(g => g.actions.every(a => r.actions.includes(a))), 'WBS preserves the authoritative action objects');
    }
  }
  cases++;
}

const both = W.solve(), a = W.solve({scope: 'A'}), none = W.solve({scope: 'none', access: 'closed', methods: 'none'});
const delta = W.comparePlans(both, a);
assert.deepEqual(delta.removed.map(x => x.id), ['gantry-install-b', 'gantry-inspect-b']); checks++;
assert.deepEqual(delta.retained.map(x => x.id), ['gantry-setup', 'gantry-install-a', 'gantry-inspect-a', 'gantry-remove']); checks++;
assert.deepEqual(both.actions[0].supportedUnits, ['A', 'B']); checks++;
assert.deepEqual(a.actions[0].supportedUnits, ['A']); checks++;
check(both.actions.every(x => !x.necessity.unavoidable) && both.requiredFunctions.every(x => x.unavoidable), 'A necessary function can have alternative method-specific actions');
assert.deepEqual(both.requiredFunctions.find(x => x.id === 'enable').actionIds, ['gantry-setup', 'trolley-setup-a', 'trolley-setup-b']); checks++;
assert.deepEqual(both.requiredFunctions.find(x => x.id === 'inspect-a').actionIds, ['gantry-inspect-a', 'trolley-inspect-a']); checks++;
check(none.actions.length === 0 && none.obligations.every(o => o.satisfied), 'Removing all scope derives zero work');
check(both.supports.some(e => e.from === 'gantry-install-a' && e.to === 'gantry-inspect-a' && e.fact === 'installed-a'), 'Inspection A has its true installer as support');
check(!both.supports.some(e => e.from === 'gantry-install-b' && e.to === 'gantry-inspect-a'), 'No arbitrary immediate-predecessor support');
check(both.supports.some(e => e.from === 'gantry-remove' && e.to === 'goal:site-clear' && e.polarity === 'negative'), 'Removal directly discharges site clearance');
for (const unit of ['a', 'b']) {
  check(both.orderingConstraints.some(e => e.from === `gantry-inspect-${unit}` && e.to === 'gantry-remove' && e.kind === 'protection'), 'Inspection protects access against premature removal');
  check(W.packagePlan(both).interfaces.some(e => e.from === `gantry-inspect-${unit}` && e.to === 'gantry-remove' && e.kind === 'protection'), 'WBS exposes the clearance handback interface');
}
// Every topological order of fact supports + protection edges must keep gantry
// teardown after inspections (enumerate this deliberately tiny six-step graph).
const ids = both.actions.map(x => x.id), edges = [...both.supports, ...both.orderingConstraints].filter(e => ids.includes(e.from) && ids.includes(e.to));
let orders = 0;
function enumerate(prefix) {
  if (prefix.length === ids.length) {
    orders++;
    check(prefix.indexOf('gantry-remove') > prefix.indexOf('gantry-inspect-a') && prefix.indexOf('gantry-remove') > prefix.indexOf('gantry-inspect-b'), 'Topological completion order preserves inspection access');
    check(replay(both.problem, prefix), 'Every admitted topological order is valid in this default vignette');
    return;
  }
  for (const id of ids.filter(x => !prefix.includes(x))) if (edges.filter(e => e.to === id).every(e => prefix.includes(e.from))) enumerate([...prefix, id]);
}
enumerate([]); check(orders > 1, 'Causal graph preserves independent unit interleavings');
check(W.solve({access: 'unrecognised'}).status === 'invalid', 'Unknown configurations fail closed');
check(W.solve({scope: ['A']}).status === 'invalid', 'Malformed configurations fail closed');

// Mutation probes demonstrate the compiled semantic data drives construction.
// They are confined to this process and never alter the published ontology.
const original = globalThis.WorkModelData;
globalThis.WorkModelData = structuredClone(original);
globalThis.WorkModelData.obligationTemplates.find(o => o.id === 'site-clear').negative = [];
const noClearance = W.solve({}, {necessity: false});
check(noClearance.status === 'solved' && noClearance.actions.length === 5 && !noClearance.actions.some(x => x.kind === 'remove'), 'Deleting the RDF clearance obligation removes teardown work');
globalThis.WorkModelData = structuredClone(original);
globalThis.WorkModelData.actionTemplates.filter(t => t.kind === 'inspect').forEach(t => {t.add = [];});
check(W.solve().status === 'infeasible', 'Removing evidence-producing method effects makes acceptance unreachable');
globalThis.WorkModelData = original;

if (process.argv.includes('--write-export-fixtures')) {
  writeFileSync('/private/tmp/work-that-must-exist-result.ttl', W.exportTurtle({}, both));
  writeFileSync('/private/tmp/work-that-must-exist-empty.ttl', W.exportTurtle({scope: 'none'}, W.solve({scope: 'none'})));
}
console.log(`${cases} configurations, ${checks} assertions, ${orders} valid causal interleavings: passed.`);
