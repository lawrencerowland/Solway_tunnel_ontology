/* Training game adapter. Planning truth comes only from WorkModel and its
 * ontology-compiled data; hours, money, interruptions and questions are an
 * explicit fictional teaching layer. Load the two shared scripts first. */
(function (root) {
  'use strict';
  const VERSION = 1, MAX_COMMANDS = 128;
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const trusted = new WeakSet();
  const own = state => {trusted.add(state); return freeze(state);};
  const W = () => {
    if (!root.WorkModel || !root.WorkModelData) throw new Error('Shared work model is not loaded.');
    return root.WorkModel;
  };
  const missions = freeze([
    {id: 'first-possession', title: 'First possession', subtitle: 'Two units. Two ways to reach them.',
      brief: 'Install and accept Units A and B, then hand back a clear worksite. A shared gantry costs more; separate trolleys take longer. There is room to discover and recover from an early clearance.',
      config: {scope: 'both', access: 'open', methods: 'both'}, timeLimit: 18, budget: 1600, eventIds: ['crew-handover']},
    {id: 'tight-possession', title: 'A tight possession', subtitle: 'A shorter window makes the trade-off matter.',
      brief: 'Restricted access rules out trolleys. Complete both units with the gantry in 12 training hours and £1,250. Two announced handovers force a choice about where to spend time or money.',
      config: {scope: 'both', access: 'tight', methods: 'both'}, timeLimit: 12, budget: 1250, eventIds: ['crew-handover', 'record-handover']},
    {id: 'small-scope', title: 'Only the work in scope', subtitle: 'One accepted unit still needs enabling work.',
      brief: 'Only Unit A is requested. Derive its installation, inspection and clearance without inventing work on Unit B. Shared equipment still has to be established and removed.',
      config: {scope: 'A', access: 'tight', methods: 'gantry'}, timeLimit: 9, budget: 850, eventIds: ['crew-handover']}
  ]);
  const resources = freeze({
    gantry: {enable: {duration: 2, cost: 300}, install: {duration: 3, cost: 250}, inspect: {duration: 1, cost: 100}, remove: {duration: 1, cost: 120}},
    trolley: {enable: {duration: 1, cost: 140}, install: {duration: 4, cost: 220}, inspect: {duration: 1, cost: 100}, remove: {duration: 1, cost: 60}}
  });
  const events = freeze({
    'crew-handover': {id: 'crew-handover', trigger: 'enable', title: 'Transfer the access workface',
      body: 'The access lead is ready to hand the workface to the installation crew. Use an hour from this possession for a joint briefing, or bring in the prepared overlap crew to keep work moving. Both choices keep the same inspection requirements.',
      choices: [
        {id: 'planned-hour', label: 'Use the planned handover hour', hours: 1, cost: 0, reason: 'Spend possession time while keeping the cost allowance for later work. The access equipment remains available.'},
        {id: 'overlap-crew', label: 'Pay for the prepared overlap crew', hours: 0, cost: 120, reason: 'Spend some of your budget to preserve the work window. The crew handover is still done; you are paying to overlap the teams.'}
      ]},
    'record-handover': {id: 'record-handover', trigger: 'inspect', title: 'Transfer the acceptance record',
      body: 'Your first unit has passed inspection and its record is ready. The receiving shift needs the acceptance pack. Brief them yourself using one hour, or use the prepared support team. The record already exists; this decision is about handing it over.',
      choices: [
        {id: 'planned-hour', label: 'Use an hour for the record handover', hours: 1, cost: 0, reason: 'Keep the cost allowance and use one possession hour to brief the receiving team.'},
        {id: 'prepared-pack', label: 'Pay for a prepared handover pack', hours: 0, cost: 90, reason: 'Keep one hour for the remaining site work. You are paying for record transfer, not buying inspection evidence.'}
      ]}
  });
  const questionBank = freeze([
    {id: 'meaning', trigger: 'enable', prompt: 'At handover, what demonstrates that a unit was accepted?',
      options: [{id: 'access', label: 'The access equipment is still present', explanation: 'Equipment enables work; its presence does not demonstrate acceptance.'}, {id: 'record', label: 'Its successful inspection has an acceptance record', explanation: 'The evidence obligation is distinct from the physical installation.'}, {id: 'installed', label: 'The unit looks installed', explanation: 'Installation alone does not satisfy the model’s evidence requirement.'}], correctId: 'record',
      project: 'A handover needs evidence as well as a finished installation.', semantics: 'The ontology distinguishes the physical unit, its installed quality and the information recording inspection.', sector: 'In this tunnel vignette, inspection uses temporary access; arranging it before clearance avoids repeating access work.'},
    {id: 'shared', trigger: 'install', prompt: 'One unit has been installed. How should you decide whether to remove the gantry?',
      options: [{id: 'first-unit', label: 'Remove it as soon as the first installation is finished', explanation: 'That can force a second setup before remaining installation or inspection.'}, {id: 'remaining-use', label: 'Check every remaining installation and inspection that needs it', explanation: 'Shared enabling work can support several outcomes and must remain while those uses still need it.'}, {id: 'never', label: 'Leave it in place at handover', explanation: 'A retained temporary gantry violates the clear-site completion condition.'}], correctId: 'remaining-use',
      project: 'A shared work package should be counted once and checked against all the outcomes it supports.', semantics: 'The same gantry-present fact is a precondition for several actions; removal deletes that shared support.', sector: 'The declared tunnel methods require access for inspection as well as installation. Early removal is allowed, but a recovery setup uses more time and money.'},
    {id: 'clearance', trigger: 'inspect', prompt: 'Why does temporary access removal belong in the finished work plan?',
      options: [{id: 'optional', label: 'It is optional because it adds no permanent product', explanation: 'A task can be required by a final condition even when it adds no permanent component.'}, {id: 'absence', label: 'The specified handover requires temporary equipment to be absent', explanation: 'Removal establishes the negative completion condition: no temporary equipment remains.'}, {id: 'score', label: 'It earns an extra quiz score', explanation: 'Quiz answers do not change physical facts, time, cost or acceptance.'}], correctId: 'absence',
      project: 'Completion includes the state in which the site is returned, not only the products installed.', semantics: 'A negative goal can generate necessary work: deleting an equipment-present fact makes the site-clear obligation true.', sector: 'Within this synthetic possession, installed units, inspection records and a clear site are all required for handover.'}
  ]);
  const factLabel = fact => {
    const known = {'gantry-present': 'shared gantry available', 'allowed-gantry': 'gantry permitted by access and method rules', 'allowed-trolley': 'trolley permitted by access and method rules'};
    if (known[fact]) return known[fact];
    let m;
    if ((m = /^installed-([ab])$/.exec(fact))) return `Unit ${m[1].toUpperCase()} installed`;
    if ((m = /^evidence-([ab])$/.exec(fact))) return `Unit ${m[1].toUpperCase()} inspection record present`;
    if ((m = /^requested-([ab])$/.exec(fact))) return `Unit ${m[1].toUpperCase()} requested in scope`;
    if ((m = /^unit-available-([ab])$/.exec(fact))) return `Unit ${m[1].toUpperCase()} available at the workface`;
    if ((m = /^trolley-([ab])-present$/.exec(fact))) return `Unit ${m[1].toUpperCase()} trolley present`;
    return fact;
  };
  const missionOf = state => missions.find(m => m.id === state.missionId);
  const problemOf = state => W().buildProblem(missionOf(state).config);
  const holds = (facts, positives, negatives) => positives.every(f => facts.includes(f)) && negatives.every(f => !facts.includes(f));
  const goalsOf = (state, problem) => problem.obligations.map(o => ({...o, satisfied: holds(state.facts, o.positive, o.negative)}));
  function condition(state, problem) {
    const mission = missionOf(state), goalsMet = holds(state.facts, problem.goal.positive, problem.goal.negative);
    if (state.cost > mission.budget) return {status: 'failed', reason: 'The training budget has been exceeded.', goalsMet};
    if (state.hours > mission.timeLimit) return {status: 'failed', reason: 'The possession window has been exceeded.', goalsMet};
    if (goalsMet && !state.active && !state.event) return {status: 'complete', reason: 'Every requested installation, inspection record and clearance condition is satisfied within the time and cost limits.', goalsMet};
    if (state.hours >= mission.timeLimit) return {status: 'failed', reason: 'The possession window has ended before all completion conditions were met.', goalsMet};
    if (state.event) return {status: 'event', reason: 'Resolve the announced handover before dispatching more work.', goalsMet};
    const remaining = W().search({...problem, initial: state.facts});
    if (remaining.status !== 'solved') return {status: remaining.status === 'infeasible' ? 'infeasible' : 'invalid', reason: remaining.status === 'infeasible' ? 'No completion route exists from the current facts in the shared finite model.' : 'Search did not finish; no completion claim is made.', goalsMet};
    return {status: 'playing', reason: state.active ? 'One crew is carrying out the selected action.' : 'Choose the next feasible action.', goalsMet};
  }
  function invalid(reason) {return own({version: VERSION, invalid: true, reason, commands: [], notice: reason});}
  function base(missionId) {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) throw new RangeError('Choose one of the three declared missions.');
    const problem = W().buildProblem(mission.config);
    return {version: VERSION, missionId, modelSHA: problem.sourceSHA256, commands: [], facts: [...problem.initial], hours: 0, cost: 0, active: null, event: null, resolvedEvents: [], completedActions: [], answers: [], feedback: null, notice: null, log: [{type: 'brief', hour: 0, text: mission.brief}]};
  }
  function create(missionId = missions[0].id) {
    try {return own(base(missionId));} catch (error) {return invalid(error.message);}
  }
  function pendingQuestion(state) {
    return questionBank.find(q => state.completedActions.some(a => a.kind === q.trigger) && !state.answers.some(a => a.questionId === q.id)) ?? null;
  }
  function offeredQuestion(state) {
    if (state.feedback) return questionBank.find(q => q.id === state.feedback.questionId);
    return pendingQuestion(state);
  }
  function commandStep(state, command) {
    const next = clone(state), problem = problemOf(state), current = condition(state, problem);
    next.notice = null;
    if (command.op === 'next-question') {
      if (!state.feedback || !pendingQuestion(state)) throw new Error('No further triggered question is waiting after this feedback.');
      next.feedback = null;
      return next;
    }
    if (command.op === 'answer') {
      const question = offeredQuestion(state);
      if (!question || state.feedback || !question.options.some(o => o.id === command.optionId)) throw new Error('Choose an answer to the current unanswered question.');
      const option = question.options.find(o => o.id === command.optionId), correct = option.id === question.correctId;
      next.answers.push({questionId: question.id, optionId: option.id, correct});
      next.feedback = {questionId: question.id, correct, text: `${option.explanation} ${question.project} ${question.semantics} ${question.sector}`, project: question.project, semantics: question.semantics, sector: question.sector};
      next.log.push({type: 'learning', hour: next.hours, text: `${correct ? 'Understanding check passed' : 'Understanding check reviewed'}: ${question.prompt}`});
      return next;
    }
    if (['complete', 'failed', 'infeasible', 'invalid'].includes(current.status)) throw new Error('This run has ended. Undo a decision or restart the mission.');
    if (command.op === 'start') {
      if (next.event) throw new Error('Resolve the scheduled handover first.');
      if (next.active) throw new Error('The single crew is already working. Advance or undo that dispatch first.');
      const action = problem.actions.find(a => a.id === command.actionId);
      if (!action) throw new Error('That action is not in the shared model.');
      if (!holds(next.facts, action.positive, action.negative)) throw new Error('The shared model preconditions for that action are not satisfied.');
      const resource = resources[action.method]?.[action.kind];
      if (!resource) throw new Error('No training duration or cost is declared for that action.');
      next.cost += resource.cost;
      next.active = {actionId: action.id, label: action.label, ...resource, remaining: resource.duration, startedAt: next.hours};
      next.log.push({type: 'dispatch', hour: next.hours, actionId: action.id, text: `Dispatched: ${action.label}. ${resource.duration} training hours; £${resource.cost} committed.`});
    } else if (command.op === 'tick') {
      if (next.event || !next.active) throw new Error('Time advances only while the crew has an active action.');
      next.hours++; next.active.remaining--;
      if (next.active.remaining === 0) {
        const action = problem.actions.find(a => a.id === next.active.actionId);
        if (!holds(next.facts, action.positive, action.negative)) throw new Error('The active action has lost a required fact; completion is rejected.');
        const facts = new Set(next.facts); action.delete.forEach(f => facts.delete(f)); action.add.forEach(f => facts.add(f));
        next.facts = [...facts].sort();
        next.completedActions.push({id: action.id, actionId: action.id, label: action.label, kind: action.kind, method: action.method, unit: action.unit, startedAt: next.active.startedAt, finishedAt: next.hours, duration: next.active.duration, cost: next.active.cost, added: [...action.add], removed: [...action.delete]});
        next.active = null; next.feedback = null;
        next.log.push({type: 'completion', hour: next.hours, actionId: action.id, text: `Completed: ${action.label}. Its shared-model effects now apply.`});
        const pending = missionOf(next).eventIds.find(id => !next.resolvedEvents.includes(id) && next.completedActions.some(a => a.kind === events[id].trigger));
        if (pending) next.event = pending;
      }
    } else if (command.op === 'event') {
      const event = events[next.event], choice = event?.choices.find(c => c.id === command.choiceId);
      if (!choice) throw new Error('Choose one of the current scheduled handover options.');
      next.hours += choice.hours; next.cost += choice.cost;
      next.resolvedEvents.push(event.id); next.event = null;
      next.log.push({type: 'event', hour: next.hours, eventId: event.id, choiceId: choice.id, text: `${event.title}: ${choice.label}. +${choice.hours} training hours; +£${choice.cost}. ${choice.reason}`});
    } else throw new Error('Unknown game command.');
    return next;
  }
  function transition(state, command) {
    if (!trusted.has(state) || state.invalid) return invalid('The game state is invalid. Restart a declared mission.');
    if (state.modelSHA !== W().model.sourceSHA256) return invalid('The shared model changed. Restart against its current rules.');
    if (state.commands.length >= MAX_COMMANDS) return own({...clone(state), notice: 'Command limit reached. Undo or restart the bounded training run.'});
    try {
      const next = commandStep(state, command); next.commands.push(command); return own(next);
    } catch (error) {return own({...clone(state), notice: error.message});}
  }
  const startAction = (state, actionId) => transition(state, {op: 'start', actionId});
  const tick = state => transition(state, {op: 'tick'});
  const resolveEvent = (state, choiceId) => transition(state, {op: 'event', choiceId});
  const answerQuestion = (state, optionId) => transition(state, {op: 'answer', optionId});
  const nextQuestion = state => transition(state, {op: 'next-question'});
  function replay(missionId, commands) {
    let state = base(missionId);
    for (const command of commands) {
      state = commandStep(state, command); state.commands.push(clone(command));
    }
    return own(state);
  }
  function undo(state) {
    if (!trusted.has(state) || state.invalid) return invalid('There is no valid decision history to undo.');
    if (!state.commands.length) return own({...clone(state), notice: 'The mission is already at its starting point.'});
    // Rewind a whole dispatch or event decision, including its hour ticks and
    // subsequent quiz response; never require one undo per simulated hour.
    let boundary = -1;
    for (let i = state.commands.length - 1; i >= 0; i--) if (['start', 'event'].includes(state.commands[i].op)) {boundary = i; break;}
    if (boundary < 0) boundary = state.commands.length - 1;
    const previous = replay(state.missionId, state.commands.slice(0, boundary));
    return own({...clone(previous), notice: 'Returned to the previous decision boundary.'});
  }
  function view(state) {
    if (!trusted.has(state) || state.invalid) return {status: 'invalid', reason: state?.reason ?? 'Invalid game state.', notice: state?.notice ?? null, mission: null, actions: [], goals: [], facts: [], progress: 0, active: null, event: null, question: null, canNextQuestion: false, log: [], completedActions: [], questionsAnswered: [], questionsTotal: questionBank.length, canUndo: false, outcome: {goalsMet: false, onTime: false, withinBudget: false}};
    const mission = missionOf(state), problem = problemOf(state), result = condition(state, problem), goals = goalsOf(state, problem);
    const remainingPlan = W().search({...problem, initial: state.facts});
    const actions = problem.actions.map(action => {
      const blockedReasons = [
        ...action.positive.filter(f => !state.facts.includes(f)).map(f => `Requires ${factLabel(f)}.`),
        ...action.negative.filter(f => state.facts.includes(f)).map(f => `Requires absence of ${factLabel(f)}.`)
      ];
      if (state.active) blockedReasons.push('The single crew is occupied.');
      if (state.event) blockedReasons.push('Resolve the scheduled handover first.');
      if (!['playing'].includes(result.status)) blockedReasons.push('This run is paused or ended.');
      return {...action, ...resources[action.method]?.[action.kind], available: blockedReasons.length === 0, blockedReasons, completedCount: state.completedActions.filter(a => a.id === action.id).length};
    });
    const question = offeredQuestion(state);
    return {
      mission, ...result, facts: [...state.facts], actions, active: state.active ? clone(state.active) : null,
      hours: state.hours, cost: state.cost, timeLimit: mission.timeLimit, budget: mission.budget,
      remainingHours: mission.timeLimit - state.hours, remainingBudget: mission.budget - state.cost,
      goals, progress: goals.length ? Math.round(goals.filter(g => g.satisfied).length / goals.length * 100) : 100,
      completedActions: clone(state.completedActions), remainingPlan,
      event: state.event ? clone(events[state.event]) : null,
      question: question ? {...clone(question), feedback: state.feedback ? clone(state.feedback) : null} : null,
      canNextQuestion: Boolean(state.feedback && pendingQuestion(state)),
      questionsAnswered: clone(state.answers), questionsTotal: questionBank.length, correctAnswers: state.answers.filter(a => a.correct).length,
      notice: state.notice, log: clone(state.log), canUndo: state.commands.length > 0,
      outcome: {goalsMet: result.goalsMet, onTime: state.hours <= mission.timeLimit, withinBudget: state.cost <= mission.budget},
      modelSHA: state.modelSHA, assumptions: [...problem.assumptions, 'All duration, cost and handover figures are fictional training rules; one crew works at a time. Time advances only through work or an explicit event choice.', 'Quiz scores are separate from physical completion. Planned actions create their effects only when their training duration has elapsed.']
    };
  }
  function serialize(state) {
    if (!trusted.has(state) || state.invalid) throw new Error('Cannot save an invalid game state.');
    return JSON.stringify({version: VERSION, modelSHA: state.modelSHA, missionId: state.missionId, commands: state.commands});
  }
  function restore(text) {
    try {
      if (typeof text !== 'string' || text.length > 30000) throw new Error('Save data is missing or too large.');
      const save = JSON.parse(text);
      if (!save || typeof save !== 'object' || Array.isArray(save) || Object.keys(save).sort().join(',') !== 'commands,missionId,modelSHA,version') throw new Error('Save envelope has unexpected fields. Facts and completion flags cannot be imported.');
      if (save.version !== VERSION || save.modelSHA !== W().model.sourceSHA256) throw new Error('This save uses a different game or shared-model version.');
      if (!missions.some(m => m.id === save.missionId) || !Array.isArray(save.commands) || save.commands.length > MAX_COMMANDS) throw new Error('Invalid mission or command history.');
      for (const c of save.commands) {
        if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Malformed saved command.');
        const expected = {start: ['actionId', 'op'], tick: ['op'], event: ['choiceId', 'op'], answer: ['op', 'optionId'], 'next-question': ['op']}[c.op];
        if (!expected || Object.keys(c).sort().join(',') !== expected.join(',') || Object.values(c).some(x => typeof x !== 'string')) throw new Error('Malformed saved command.');
      }
      return replay(save.missionId, save.commands);
    } catch (error) {return invalid(`Saved run rejected: ${error.message}`);}
  }
  root.TunnelGame = {missions, create, view, startAction, tick, resolveEvent, answerQuestion, nextQuestion, undo, serialize, restore, factLabel, version: VERSION};
})(globalThis);
