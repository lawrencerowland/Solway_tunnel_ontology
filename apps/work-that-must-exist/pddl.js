/* Independent executable baseline for this essay's propositional STRIPS subset.
   No WorkModel or ontology code is called here. Unsupported PDDL is rejected.
   Breadth-first search minimises action count; it makes no duration/cost claim. */
(function (root) {
  'use strict';
  const fail = message => { throw new Error(`PDDL: ${message}`); };
  const unique = values => [...new Set(values)].sort();
  const token = value => typeof value === 'string' && /^[a-z][a-z0-9_-]*$/.test(value);
  function expression(source) {
    if (typeof source !== 'string') fail('source must be text');
    const text = source.replace(/;[^\r\n]*/g, '').toLowerCase();
    const tokens = text.match(/\(|\)|[^\s()]+/g) || [];
    let cursor = 0;
    function read() {
      if (tokens[cursor++] !== '(') fail('expected opening parenthesis');
      const list = [];
      while (cursor < tokens.length && tokens[cursor] !== ')') {
        if (tokens[cursor] === '(') list.push(read());
        else list.push(tokens[cursor++]);
      }
      if (tokens[cursor++] !== ')') fail('unclosed expression');
      return list;
    }
    const result = read();
    if (cursor !== tokens.length) fail('trailing syntax');
    return result;
  }
  function definition(source, kind) {
    const tree = expression(source);
    if (tree[0] !== 'define' || !Array.isArray(tree[1]) || tree[1][0] !== kind || tree[1].length !== 2 || !token(tree[1][1])) fail(`expected a ${kind} definition`);
    return {name: tree[1][1], sections: tree.slice(2)};
  }
  function atom(list, declared) {
    if (!Array.isArray(list) || list.length !== 1 || !token(list[0])) fail('only declared zero-argument predicates are supported');
    if (declared && !declared.has(list[0])) fail(`undeclared predicate ${list[0]}`);
    return list[0];
  }
  function literals(tree, declared, allowNegative) {
    if (!Array.isArray(tree)) fail('expected a literal or conjunction');
    const positive = [], negative = [];
    const members = tree[0] === 'and' ? tree.slice(1) : [tree];
    for (const member of members) {
      if (!Array.isArray(member)) fail('invalid conjunction');
      if (member[0] === 'not') {
        if (!allowNegative) fail('negative literals require :negative-preconditions');
        if (member.length !== 2) fail('invalid negation');
        negative.push(atom(member[1], declared));
      } else positive.push(atom(member, declared));
    }
    return {positive: unique(positive), negative: unique(negative)};
  }
  function sectionsUnique(sections, permitted, repeated = []) {
    const seen = new Set();
    for (const section of sections) {
      if (!Array.isArray(section) || !permitted.includes(section[0])) fail(`unsupported section ${Array.isArray(section) ? section[0] : section}`);
      if (seen.has(section[0]) && !repeated.includes(section[0])) fail(`duplicate section ${section[0]}`);
      seen.add(section[0]);
    }
    return seen;
  }
  function parseDomain(source) {
    const {name, sections} = definition(source, 'domain');
    const present = sectionsUnique(sections, [':requirements', ':predicates', ':action'], [':action']);
    if (!present.has(':predicates')) fail('missing predicates');
    const requirements = sections.find(x => x[0] === ':requirements')?.slice(1) || [':strips'];
    for (const requirement of requirements) if (![':strips', ':negative-preconditions'].includes(requirement)) fail(`unsupported requirement ${requirement}`);
    const predicates = new Set();
    for (const predicate of sections.find(x => x[0] === ':predicates').slice(1)) {
      const value = atom(predicate);
      if (predicates.has(value)) fail(`duplicate predicate ${value}`);
      predicates.add(value);
    }
    const actions = [], names = new Set();
    for (const section of sections.filter(x => x[0] === ':action')) {
      const actionName = section[1];
      if (!token(actionName) || names.has(actionName)) fail(`invalid or duplicate action ${actionName}`);
      names.add(actionName);
      if ((section.length - 2) % 2) fail(`invalid fields in ${actionName}`);
      const fields = new Map();
      for (let i = 2; i < section.length; i += 2) {
        const field = section[i];
        if (![':parameters', ':precondition', ':effect'].includes(field) || fields.has(field)) fail(`unsupported or duplicate action field ${field}`);
        fields.set(field, section[i + 1]);
      }
      if (!fields.has(':parameters') || !Array.isArray(fields.get(':parameters')) || fields.get(':parameters').length) fail('only grounded actions with empty :parameters are supported');
      if (!fields.has(':precondition') || !fields.has(':effect')) fail(`missing precondition/effect for ${actionName}`);
      const pre = literals(fields.get(':precondition'), predicates, requirements.includes(':negative-preconditions'));
      const eff = literals(fields.get(':effect'), predicates, true);
      if (eff.positive.some(x => eff.negative.includes(x))) fail(`conflicting effects in ${actionName}`);
      actions.push({id: actionName, name: actionName, pre: pre.positive, not: pre.negative, add: eff.positive, del: eff.negative});
    }
    return {name, requirements, predicates: [...predicates], actions};
  }
  function parseProblem(source, domain) {
    const {name, sections} = definition(source, 'problem');
    const present = sectionsUnique(sections, [':domain', ':objects', ':init', ':goal']);
    for (const required of [':domain', ':init', ':goal']) if (!present.has(required)) fail(`missing ${required}`);
    const domainSection = sections.find(x => x[0] === ':domain');
    if (domainSection.length !== 2 || domainSection[1] !== domain.name) fail('problem domain does not match');
    const objects = sections.find(x => x[0] === ':objects');
    if (objects && objects.length !== 1) fail('objects are unsupported in the propositional subset');
    const declared = new Set(domain.predicates);
    const init = sections.find(x => x[0] === ':init').slice(1).map(x => atom(x, declared));
    const goalSection = sections.find(x => x[0] === ':goal');
    if (goalSection.length !== 2) fail('invalid goal');
    const goals = literals(goalSection[1], declared, domain.requirements.includes(':negative-preconditions'));
    return {name, domain: domain.name, initial: unique(init), goals: goals.positive, negativeGoals: goals.negative};
  }
  const satisfied = (state, positive, negative) => positive.every(x => state.has(x)) && negative.every(x => !state.has(x));
  const applicable = (state, action) => satisfied(state, action.pre, action.not);
  function apply(state, action) {
    const next = new Set(state);
    for (const fact of action.del) next.delete(fact);
    for (const fact of action.add) next.add(fact);
    return next;
  }
  function inputs(domain, problem) {
    const d = typeof domain === 'string' ? parseDomain(domain) : domain;
    const p = typeof problem === 'string' ? parseProblem(problem, d) : problem;
    if (p.domain !== d.name) fail('problem domain does not match');
    return {d, p};
  }
  function solve(domain, problem, options = {}) {
    const {d, p} = inputs(domain, problem);
    const initial = new Set(p.initial), queue = [{state: initial, previous: -1, action: null}], seen = new Set([unique(initial).join('|')]);
    const limit = options.maxStates ?? 100000;
    if (!Number.isInteger(limit) || limit < 1) fail('maxStates must be a positive integer');
    let cursor = 0;
    while (cursor < queue.length) {
      const nodeIndex = cursor++, node = queue[nodeIndex];
      if (satisfied(node.state, p.goals, p.negativeGoals)) {
        const plan = [];
        let i = nodeIndex;
        while (queue[i].previous !== -1) { plan.push(queue[i].action); i = queue[i].previous; }
        plan.reverse();
        return {found: true, success: true, status: 'solved', plan, length: plan.length, final: unique(node.state), expanded: cursor, visited: queue.length};
      }
      for (const action of d.actions) {
        if (!applicable(node.state, action)) continue;
        const next = apply(node.state, action), key = unique(next).join('|');
        if (seen.has(key)) continue;
        if (queue.length >= limit) return {found: false, success: false, status: 'limit', plan: null, length: null, final: null, expanded: cursor, visited: queue.length};
        seen.add(key);
        queue.push({state: next, previous: nodeIndex, action: action.id});
      }
    }
    return {found: false, success: false, status: 'infeasible', plan: null, length: null, final: null, expanded: cursor, visited: queue.length};
  }
  function checkPlan(domain, problem, plan) {
    const {d, p} = inputs(domain, problem), actions = new Map(d.actions.map(a => [a.id, a]));
    let state = new Set(p.initial);
    const trace = [{step: 0, state: unique(state)}];
    if (!Array.isArray(plan)) return {valid: false, reason: 'Plan must be an array', trace};
    for (let i = 0; i < plan.length; i++) {
      const id = String(typeof plan[i] === 'string' ? plan[i] : plan[i].id ?? plan[i].name).toLowerCase().replace(/^\(|\)$/g, '').trim();
      const action = actions.get(id);
      if (!action) return {valid: false, reason: `Unknown action ${id}`, step: i + 1, trace};
      if (!applicable(state, action)) return {valid: false, reason: `Unsatisfied precondition at ${id}`, step: i + 1, trace};
      state = apply(state, action);
      trace.push({step: i + 1, action: id, state: unique(state)});
    }
    const missing = p.goals.filter(x => !state.has(x)), forbidden = p.negativeGoals.filter(x => state.has(x));
    return {valid: !missing.length && !forbidden.length, reason: missing.length || forbidden.length ? 'Final goals are not satisfied' : 'Every action and final obligation checked', missing, forbidden, final: unique(state), trace};
  }
  function fingerprint(domain, problem) {
    const {d, p} = inputs(domain, problem);
    return JSON.stringify({initial: unique(p.initial), goals: unique(p.goals), negativeGoals: unique(p.negativeGoals), actions: d.actions.map(a => ({id: a.id, pre: unique(a.pre), not: unique(a.not), add: unique(a.add), del: unique(a.del)})).sort((a, b) => a.id.localeCompare(b.id))});
  }
  // Independently authored from the vignette contract. This is intentionally
  // explicit rather than copied from the ontology's method declarations.
  const directDomain = `(define (domain work-that-must-exist-direct)
 (:requirements :strips :negative-preconditions)
 (:predicates
  (allowed-gantry) (allowed-trolley) (unit-available-a) (unit-available-b)
  (requested-a) (requested-b) (gantry-present) (trolley-a-present) (trolley-b-present)
  (installed-a) (installed-b) (evidence-a) (evidence-b))
 (:action gantry-setup :parameters ()
  :precondition (and (allowed-gantry) (not (gantry-present)) (not (trolley-a-present)) (not (trolley-b-present)))
  :effect (and (gantry-present)))
 (:action gantry-install-a :parameters ()
  :precondition (and (gantry-present) (unit-available-a) (requested-a) (not (installed-a)))
  :effect (and (installed-a)))
 (:action gantry-inspect-a :parameters ()
  :precondition (and (gantry-present) (installed-a) (requested-a) (not (evidence-a)))
  :effect (and (evidence-a)))
 (:action gantry-install-b :parameters ()
  :precondition (and (gantry-present) (unit-available-b) (requested-b) (not (installed-b)))
  :effect (and (installed-b)))
 (:action gantry-inspect-b :parameters ()
  :precondition (and (gantry-present) (installed-b) (requested-b) (not (evidence-b)))
  :effect (and (evidence-b)))
 (:action gantry-remove :parameters ()
  :precondition (and (gantry-present)) :effect (and (not (gantry-present))))
 (:action trolley-setup-a :parameters ()
  :precondition (and (allowed-trolley) (unit-available-a) (requested-a) (not (installed-a)) (not (trolley-a-present)) (not (gantry-present)))
  :effect (and (trolley-a-present)))
 (:action trolley-install-a :parameters ()
  :precondition (and (trolley-a-present) (unit-available-a) (requested-a) (not (installed-a)))
  :effect (and (installed-a)))
 (:action trolley-inspect-a :parameters ()
  :precondition (and (trolley-a-present) (installed-a) (requested-a) (not (evidence-a)))
  :effect (and (evidence-a)))
 (:action trolley-remove-a :parameters ()
  :precondition (and (trolley-a-present)) :effect (and (not (trolley-a-present))))
 (:action trolley-setup-b :parameters ()
  :precondition (and (allowed-trolley) (unit-available-b) (requested-b) (not (installed-b)) (not (trolley-b-present)) (not (gantry-present)))
  :effect (and (trolley-b-present)))
 (:action trolley-install-b :parameters ()
  :precondition (and (trolley-b-present) (unit-available-b) (requested-b) (not (installed-b)))
  :effect (and (installed-b)))
 (:action trolley-inspect-b :parameters ()
  :precondition (and (trolley-b-present) (installed-b) (requested-b) (not (evidence-b)))
  :effect (and (evidence-b)))
 (:action trolley-remove-b :parameters ()
  :precondition (and (trolley-b-present)) :effect (and (not (trolley-b-present))))
)`;
  function directPDDL(config) {
    if (!config || !['both', 'A', 'B', 'none'].includes(config.scope) || !['open', 'tight', 'closed'].includes(config.access) || !['both', 'gantry', 'trolley', 'none'].includes(config.methods)) fail('invalid vignette configuration');
    const initial = ['unit-available-a', 'unit-available-b'], goals = [];
    if (['both', 'gantry'].includes(config.methods) && ['open', 'tight'].includes(config.access)) initial.push('allowed-gantry');
    if (['both', 'trolley'].includes(config.methods) && config.access === 'open') initial.push('allowed-trolley');
    for (const unit of ['a', 'b']) if (config.scope === 'both' || config.scope.toLowerCase() === unit) {
      initial.push(`requested-${unit}`);
      goals.push(`(installed-${unit})`, `(evidence-${unit})`);
    }
    goals.push('(not (gantry-present))', '(not (trolley-a-present))', '(not (trolley-b-present))');
    return {domain: directDomain, problem: `(define (problem synthetic-tunnel-fitout)
 (:domain work-that-must-exist-direct)
 (:init ${initial.map(x => `(${x})`).join(' ')})
 (:goal (and ${goals.join(' ')}))
)`};
  }
  function compare(config, bridgePDDL) {
    const baseline = directPDDL(config);
    const direct = solve(baseline.domain, baseline.problem);
    const bridge = solve(bridgePDDL.domain, bridgePDDL.problem);
    const sameSemantics = fingerprint(baseline.domain, baseline.problem) === fingerprint(bridgePDDL.domain, bridgePDDL.problem);
    const sameFeasibility = direct.status === bridge.status;
    const sameActionCount = direct.length === bridge.length;
    const directCheck = direct.found ? checkPlan(baseline.domain, baseline.problem, direct.plan) : null;
    const bridgeCheck = bridge.found ? checkPlan(baseline.domain, baseline.problem, bridge.plan) : null;
    return {sameSemantics, sameFeasibility, sameActionCount, direct, bridge, directCheck, bridgeCheck, directPDDL: baseline,
      valid: sameSemantics && sameFeasibility && sameActionCount && (!direct.found || (directCheck.valid && bridgeCheck.valid))};
  }
  root.PDDL = {parseDomain, parseProblem, solve, checkPlan, fingerprint, directPDDL, compare};
})(globalThis);
