/* Bounded constructive planning over data compiled from ontology.ttl.
 * No project task list is supplied. Breadth-first search chooses one shortest
 * sequential plan under equal action costs. It is not an engineering planner.
 */
(function (root) {
  'use strict';
  const MAX_STATES = 5000;
  const unique = values => [...new Set(values)];
  const data = () => {
    if (!root.WorkModelData) throw new Error('Load model-data.js before engine.js.');
    return root.WorkModelData;
  };
  function normalizeConfig(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Configuration must be an object.');
    const config = {scope: input.scope ?? 'both', access: input.access ?? 'open', methods: input.methods ?? 'both'};
    const allowed = {scope: ['both', 'A', 'B', 'none'], access: ['open', 'tight', 'closed'], methods: ['both', 'gantry', 'trolley', 'none']};
    for (const [key, values] of Object.entries(allowed)) {
      if (!values.includes(config[key])) throw new RangeError(`Unknown ${key}: ${String(config[key])}`);
    }
    return config;
  }
  const instantiate = (text, unit) => text.replaceAll('{unit}', unit?.id ?? '').replaceAll('{label}', unit?.label ?? 'the site');
  function ground(template, unit) {
    return {
      ...template,
      id: instantiate(template.id, unit), label: instantiate(template.label, unit),
      unit: unit ? unit.id.toUpperCase() : null,
      positive: template.positive.map(x => instantiate(x, unit)),
      negative: template.negative.map(x => instantiate(x, unit)),
      ...(template.add ? {add: template.add.map(x => instantiate(x, unit)), delete: template.delete.map(x => instantiate(x, unit))} : {})
    };
  }
  function buildProblem(input) {
    const config = normalizeConfig(input), model = data();
    const scopedUnits = model.units.filter(u => config.scope === 'both' || config.scope.toLowerCase() === u.id);
    const enabled = config.methods === 'both' ? ['gantry', 'trolley'] : config.methods === 'none' ? [] : [config.methods];
    const admissibleMethods = enabled.filter(x => model.accessPolicies[config.access].includes(x));
    const initial = unique([
      ...model.units.flatMap(u => model.initialUnitFacts.map(x => instantiate(x, u))),
      ...scopedUnits.map(u => instantiate(model.scopeFact, u)),
      ...admissibleMethods.map(method => `allowed-${method}`)
    ]).sort();
    const obligations = model.obligationTemplates.flatMap(t => t.binding === 'unit' ? scopedUnits.map(u => ground(t, u)) : [ground(t)]);
    const actions = model.actionTemplates.flatMap(t => t.binding === 'unit' ? model.units.map(u => ground(t, u)) : [ground(t)]).map(a => ({...a, preconditions: a.positive, negativePreconditions: a.negative}));
    const goal = {positive: unique(obligations.flatMap(o => o.positive)), negative: unique(obligations.flatMap(o => o.negative))};
    const predicates = unique([...initial, ...goal.positive, ...goal.negative, ...actions.flatMap(a => [...a.positive, ...a.negative, ...a.add, ...a.delete])]).sort();
    return {config, initial, actions, obligations, goal, predicates, admissibleMethods, assumptions: [...model.assumptions], sourceSHA256: model.sourceSHA256};
  }
  const satisfies = (state, positive, negative) => positive.every(x => state.has(x)) && negative.every(x => !state.has(x));
  function applyAction(state, action) {
    const next = new Set(state);
    action.delete.forEach(x => next.delete(x)); action.add.forEach(x => next.add(x));
    return next;
  }
  function search(problem, options = {}) {
    const forbidden = new Set(options.forbidden ?? []), actions = problem.actions.filter(a => !forbidden.has(a.id));
    const stateKey = state => [...state].sort().join('|');
    const first = new Set(problem.initial), queue = [{state: first, plan: []}], seen = new Set([stateKey(first)]);
    let cursor = 0;
    while (cursor < queue.length) {
      const item = queue[cursor++];
      if (satisfies(item.state, problem.goal.positive, problem.goal.negative)) return {status: 'solved', actionIds: item.plan, final: [...item.state].sort(), explored: cursor, discovered: seen.size, exhaustive: true};
      for (const action of actions) {
        if (!satisfies(item.state, action.positive, action.negative)) continue;
        const next = applyAction(item.state, action), key = stateKey(next);
        if (seen.has(key)) continue;
        if (seen.size >= MAX_STATES) return {status: 'bounded', actionIds: [], explored: cursor, discovered: seen.size, exhaustive: false};
        seen.add(key); queue.push({state: next, plan: [...item.plan, action.id]});
      }
    }
    return {status: 'infeasible', actionIds: [], explored: cursor, discovered: seen.size, exhaustive: true};
  }
  function explain(problem, planActions) {
    let state = new Set(problem.initial);
    const producer = new Map(problem.initial.map(x => [x, 'initial'])), remover = new Map();
    const supports = [], orderingConstraints = [], trace = [];
    const link = (from, to, fact, polarity, kind) => supports.push({id: `support-${supports.length + 1}`, from, to, fact, polarity, kind});
    for (let i = 0; i < planActions.length; i++) {
      const action = planActions[i];
      if (!satisfies(state, action.positive, action.negative)) throw new Error(`Invalid plan at ${action.id}`);
      action.positive.forEach(fact => link(producer.get(fact) ?? 'initial', action.id, fact, 'positive', 'precondition'));
      action.negative.forEach(fact => link(remover.get(fact) ?? 'initial', action.id, fact, 'negative', 'precondition'));
      // A delete effect threatens prior producer-consumer links. Record the
      // necessary consumer-before-deleter order separately from fact support.
      for (const fact of action.delete) {
        for (const edge of supports.filter(e => e.kind === 'precondition' && e.polarity === 'positive' && e.fact === fact && e.from === producer.get(fact) && e.to !== action.id)) {
          orderingConstraints.push({id: `protection-${orderingConstraints.length + 1}`, from: edge.to, to: action.id, fact, polarity: 'positive', kind: 'protection', protects: edge.id, reason: `Keep ${fact} true until ${edge.to} has used it.`});
        }
      }
      const before = [...state].sort();
      state = applyAction(state, action);
      action.delete.forEach(fact => {producer.delete(fact); remover.set(fact, action.id);});
      action.add.forEach(fact => {producer.set(fact, action.id); remover.delete(fact);});
      trace.push({step: i + 1, actionId: action.id, label: action.label, before, after: [...state].sort(), added: [...action.add], removed: [...action.delete]});
    }
    const obligations = problem.obligations.map(o => ({...o, satisfied: satisfies(state, o.positive, o.negative)}));
    for (const obligation of obligations) {
      obligation.positive.forEach(fact => { if (state.has(fact)) link(producer.get(fact) ?? 'initial', `goal:${obligation.id}`, fact, 'positive', 'goal'); });
      obligation.negative.forEach(fact => { if (!state.has(fact)) link(remover.get(fact) ?? 'initial', `goal:${obligation.id}`, fact, 'negative', 'goal'); });
    }
    // Backward traversal follows actual fact support, never the arbitrary
    // previous step in the chosen interleaving.
    for (const action of planActions) {
      const reachable = new Set([action.id]), pending = [action.id];
      for (let i = 0; i < pending.length; i++) {
        for (const edge of supports.filter(e => e.from === pending[i])) {
          if (!reachable.has(edge.to)) {reachable.add(edge.to); pending.push(edge.to);}
        }
      }
      action.supportedBy = obligations.filter(o => reachable.has(`goal:${o.id}`)).map(o => o.id);
      action.supportedUnits = unique(obligations.filter(o => action.supportedBy.includes(o.id) && o.unit).map(o => o.unit));
      action.supports = [...action.supportedBy];
    }
    return {trace, supports, causalLinks: supports, orderingConstraints, obligations, final: [...state].sort()};
  }
  function solve(input = {}, options = {}) {
    let problem;
    try {problem = buildProblem(input);} catch (error) {return {status: 'invalid', reason: error.message, actions: [], trace: [], supports: [], causalLinks: [], obligations: [], requiredFunctions: [], stats: {complete: false}};}
    const found = search(problem), config = problem.config;
    if (found.status !== 'solved') {
      const reason = found.status === 'bounded' ? 'The finite search bound was reached. No infeasibility claim is made.' : !problem.admissibleMethods.length ? `No allowed method can operate with ${config.access} access under the chosen method permissions.` : 'No completion route exists in the declared finite action model.';
      return {config, status: found.status, reason, actions: [], requiredFunctions: [], ...explain(problem, []), problem, stats: {explored: found.explored, discovered: found.discovered, complete: found.exhaustive, maxStates: MAX_STATES}};
    }
    const byId = new Map(problem.actions.map(a => [a.id, a]));
    const actions = found.actionIds.map(id => ({...byId.get(id)}));
    const proof = explain(problem, actions);
    if (options.necessity !== false) for (const action of actions) {
      const alternative = search(problem, {forbidden: [action.id]});
      action.necessity = {
        unavoidable: alternative.status === 'infeasible' && alternative.exhaustive,
        tested: alternative.exhaustive,
        alternativeActionIds: alternative.actionIds,
        reason: alternative.status === 'infeasible' ? 'Banning this grounded action makes the declared completion goals unreachable.' : alternative.status === 'solved' ? `A completion route of ${alternative.actionIds.length} actions exists without this action.` : 'Search bound reached; necessity is unknown.'
      };
    }
    // Function grouping is an explicit interpretation of the method library's
    // kind/unit annotations. It is supplied modelling knowledge, not a newly
    // discovered ontology. Necessity itself is computed by banning every
    // action capable of performing the grouped function and searching again.
    const functionKey = a => ['enable', 'remove'].includes(a.kind) ? a.kind : `${a.kind}-${a.unit?.toLowerCase() ?? 'site'}`;
    const functionLabel = a => a.kind === 'enable' ? 'Provide temporary access' : a.kind === 'remove' ? 'Clear temporary access' : a.kind === 'install' ? `Install Unit ${a.unit}` : a.kind === 'inspect' ? `Produce inspection evidence for Unit ${a.unit}` : `${a.kind} (${a.unit ?? 'site'})`;
    const requiredFunctions = unique(actions.map(functionKey)).map(id => {
      const representative = actions.find(a => functionKey(a) === id);
      const actionIds = problem.actions.filter(a => functionKey(a) === id).map(a => a.id);
      const alternative = search(problem, {forbidden: actionIds});
      return {id, label: functionLabel(representative), actionIds,
        unavoidable: alternative.status === 'infeasible' && alternative.exhaustive,
        tested: alternative.exhaustive, alternativeActionIds: alternative.actionIds,
        reason: alternative.status === 'infeasible' ? 'Banning all actions in this declared function group makes completion unreachable.' : alternative.status === 'solved' ? `A completion route of ${alternative.actionIds.length} actions exists without this function group.` : 'Search bound reached; function necessity is unknown.'};
    });
    return {config, status: 'solved', reason: actions.length ? 'One shortest route under equal action costs.' : 'No installation is requested; the initially clear site already satisfies the completion profile.', actions, requiredFunctions, ...proof, problem, stats: {actionCount: actions.length, explored: found.explored, discovered: found.discovered, complete: true, maxStates: MAX_STATES, objective: 'fewest sequential actions', allPlansEnumerated: false}};
  }
  function packagePlan(result, mode = 'product') {
    if (!['product', 'trade'].includes(mode)) throw new RangeError('Package mode must be product or trade.');
    const packages = [], groupMap = new Map(), assignment = new Map();
    for (const action of result.actions) {
      const label = mode === 'trade' ? action.trade : action.unit ? `Unit ${action.unit}` : 'Shared access';
      if (!groupMap.has(label)) {
        const item = {id: `package-${label.toLowerCase().replaceAll(' ', '-')}`, label, owner: mode === 'trade' ? label : label === 'Shared access' ? 'Access lead' : `${label} delivery lead`, actionIds: [], actions: [], supports: [], supportedUnits: []};
        groupMap.set(label, item); packages.push(item);
      }
      const item = groupMap.get(label); item.actionIds.push(action.id); item.actions.push(action);
      item.supports = unique([...item.supports, ...action.supportedBy]);
      item.supportedUnits = unique([...item.supportedUnits, ...action.supportedUnits]); assignment.set(action.id, item.id);
    }
    const interfaces = [...result.supports, ...(result.orderingConstraints ?? [])].filter(e => assignment.has(e.from) && assignment.has(e.to) && assignment.get(e.from) !== assignment.get(e.to)).map(e => ({...e, fromPackage: assignment.get(e.from), toPackage: assignment.get(e.to)}));
    return {mode, criterion: mode === 'trade' ? 'Group by the declared crew responsible for each action.' : 'Group unit-specific work under its unit; own shared access once.', packages, interfaces, actionCount: result.actions.length, actionIds: result.actions.map(a => a.id)};
  }
  function comparePlans(before, after) {
    const oldIds = new Set(before.actions.map(a => a.id)), newIds = new Set(after.actions.map(a => a.id));
    return {added: after.actions.filter(a => !oldIds.has(a.id)), removed: before.actions.filter(a => !newIds.has(a.id)), retained: after.actions.filter(a => oldIds.has(a.id)), beforeCount: before.actions.length, afterCount: after.actions.length};
  }
  function exportPDDL(input) {
    const p = buildProblem(input), atom = x => `(${x})`;
    const literals = (positive, negative) => [...positive.map(atom), ...negative.map(x => `(not ${atom(x)})`)].join(' ');
    const domain = `; Generated from ontology.ttl, SHA256 ${p.sourceSHA256}\n(define (domain work-that-must-exist)\n  (:requirements :strips :negative-preconditions)\n  (:predicates ${p.predicates.map(atom).join(' ')})\n${p.actions.map(a => `  (:action ${a.id}\n    :parameters ()\n    :precondition (and ${literals(a.positive, a.negative)})\n    :effect (and ${literals(a.add, a.delete)}))`).join('\n')}\n)\n`;
    const problem = `; Scope ${p.config.scope}; access ${p.config.access}; methods ${p.config.methods}\n(define (problem tunnel-completion)\n  (:domain work-that-must-exist)\n  (:init ${p.initial.map(atom).join(' ')})\n  (:goal (and ${literals(p.goal.positive, p.goal.negative)}))\n)\n`;
    return {domain, problem};
  }
  function exportTurtle(input, result = solve(input)) {
    const config = normalizeConfig(input), quote = value => JSON.stringify(String(value));
    const lines = [data().sourceTurtle, '\n@prefix run: <https://solway.example/work/run#> .', 'run:Result a w:PlanResult ;', `  w:scope ${quote(config.scope)} ; w:access ${quote(config.access)} ; w:methods ${quote(config.methods)} ;`, `  w:status ${quote(result.status)} ; w:sourceSHA256 ${quote(data().sourceSHA256)} .`];
    for (const [index, a] of result.actions.entries()) lines.push(`run:${a.id} a d:PlannedProcessDescription ; w:describesProcess <${a.describesProcess}> ; w:step ${index + 1} ; rdfs:label ${quote(a.label)} ; w:actionSource <${a.source}>${a.supportedBy.length ? ` ; w:supports ${a.supportedBy.map(x => quote(x)).join(', ')}` : ''} .`);
    for (const o of result.obligations) lines.push(`run:goal-${o.id} a w:GoalObligation ; w:meaning <${o.meaning}> ; rdfs:label ${quote(o.label)} ; w:satisfied ${o.satisfied} .`);
    for (const f of result.requiredFunctions ?? []) lines.push(`run:function-${f.id} a w:FunctionCounterfactual ; rdfs:label ${quote(f.label)} ; w:bannedActionId ${f.actionIds.map(quote).join(', ')} ; w:unavoidable ${f.unavoidable} ; w:tested ${f.tested} ; w:groupingBasis "Declared method kind; install and inspect grouped by unit, enable and remove across units" .`);
    for (const e of result.supports) lines.push(`[] a w:CausalSupport ; w:from run:${e.from.replace(':', '-')} ; w:to run:${e.to.replace(':', '-')} ; w:fact ${quote(e.fact)} ; w:polarity ${quote(e.polarity)} .`);
    for (const e of result.orderingConstraints ?? []) lines.push(`[] a w:OrderingConstraint ; w:from run:${e.from} ; w:to run:${e.to} ; w:fact ${quote(e.fact)} ; w:reason ${quote(e.reason)} .`);
    return lines.join('\n') + '\n';
  }
  root.WorkModel = {normalizeConfig, buildProblem, solve, search, packagePlan, comparePlans, exportTurtle, exportPDDL, maxStates: MAX_STATES, get model() {return data();}};
})(globalThis);
