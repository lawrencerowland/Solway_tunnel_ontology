import assert from 'node:assert/strict';
import '../work-that-must-exist/model-data.js';
import '../work-that-must-exist/engine.js';
import './game-engine.js';

const G = globalThis.TunnelGame, W = globalThis.WorkModel;
let checks = 0;
const check = (condition, label) => {assert.ok(condition, label); checks++;};
const eq = (a, b, label) => {assert.deepEqual(a, b, label); checks++;};
const factsAfter = (facts, action) => [...new Set([...facts.filter(f => !action.delete.includes(f)), ...action.add])].sort();
function inspect(state) {
  const v = G.view(state);
  if (v.status !== 'invalid') {
    check(v.progress < 100 || v.goals.every(g => g.satisfied), 'Progress never reaches 100 before all completion goals');
    if (v.status === 'complete') check(v.goals.every(g => g.satisfied) && v.outcome.onTime && v.outcome.withinBudget && !v.active && !v.event, 'Success requires goals and both hard limits');
    const problem = W.buildProblem(v.mission.config);
    eq(v.remainingPlan, W.search({...problem, initial: v.facts}), 'Remaining-route search uses the shared model and current facts');
  }
  return v;
}
function doAction(state, id, choices = {}) {
  const before = inspect(state), action = before.actions.find(a => a.id === id);
  check(action?.available, `Action ${id} available`);
  let next = G.startAction(state, id), v = inspect(next);
  eq(v.facts, before.facts, 'Dispatch never applies completion effects');
  eq(v.hours, before.hours, 'Dispatch does not advance the clock');
  eq(v.cost, before.cost + action.cost, 'Dispatch commits its stated cost');
  if (v.status === 'failed') return next;
  for (let hour = 0; hour < action.duration; hour++) {
    next = G.tick(next); v = inspect(next);
    if (hour < action.duration - 1) eq(v.facts, before.facts, 'Incomplete work has no add/delete effects');
    if (v.status === 'failed') return next;
  }
  eq(v.facts, factsAfter(before.facts, action), 'Completed game action exactly matches shared STRIPS effects');
  if (v.event && choices[v.event.id]) {
    const choice = v.event.choices.find(c => c.id === choices[v.event.id]);
    next = G.resolveEvent(next, choice.id);
    const after = inspect(next);
    eq(after.facts, v.facts, 'A handover choice cannot manufacture or delete planning facts');
    eq(after.hours, v.hours + choice.hours, 'Event consumes its declared time');
    eq(after.cost, v.cost + choice.cost, 'Event consumes its declared cost');
  }
  return next;
}
const gantry = ['gantry-setup', 'gantry-install-a', 'gantry-install-b', 'gantry-inspect-a', 'gantry-inspect-b', 'gantry-remove'];
const trolley = ['trolley-setup-a', 'trolley-install-a', 'trolley-inspect-a', 'trolley-remove-a', 'trolley-setup-b', 'trolley-install-b', 'trolley-inspect-b', 'trolley-remove-b'];
function play(missionId, route, choices) {
  let state = G.create(missionId);
  for (const id of route) {
    state = doAction(state, id, choices);
    if (['failed', 'infeasible', 'invalid'].includes(G.view(state).status)) break;
  }
  return state;
}

const wins = [
  {mission: 'first-possession', route: gantry, choices: {'crew-handover': 'planned-hour'}, hours: 12, cost: 1120},
  {mission: 'first-possession', route: trolley, choices: {'crew-handover': 'planned-hour'}, hours: 15, cost: 1040},
  {mission: 'tight-possession', route: gantry, choices: {'crew-handover': 'planned-hour', 'record-handover': 'prepared-pack'}, hours: 12, cost: 1210},
  {mission: 'tight-possession', route: gantry, choices: {'crew-handover': 'overlap-crew', 'record-handover': 'planned-hour'}, hours: 12, cost: 1240},
  {mission: 'small-scope', route: ['gantry-setup', 'gantry-install-a', 'gantry-inspect-a', 'gantry-remove'], choices: {'crew-handover': 'planned-hour'}, hours: 8, cost: 770}
];
for (const test of wins) {
  const state = play(test.mission, test.route, test.choices), v = inspect(state);
  check(v.status === 'complete', `Winning path for ${test.mission}`);
  eq([v.hours, v.cost], [test.hours, test.cost], 'Independent training totals match');
  eq(v.completedActions.map(a => a.id), test.route, 'Completed receipts retain execution order');
  const restored = G.restore(G.serialize(state));
  eq(G.view(restored), v, 'Valid save reconstructs exact completion by replay');
  check(G.view(G.startAction(state, 'gantry-setup')).status === 'complete', 'No further dispatch after successful handover');
}

let state = G.create(), initial = inspect(state);
const idle = G.tick(state);
eq([G.view(idle).hours, G.view(idle).cost, G.view(idle).facts], [initial.hours, initial.cost, initial.facts], 'Idle ticking never advances time or money');
check(Boolean(G.view(idle).notice), 'Rejected idle operation explains itself');
const locked = G.startAction(state, 'gantry-inspect-a');
eq(G.view(locked).facts, initial.facts, 'Missing installation/access blocks inspection');
state = G.startAction(state, 'gantry-setup');
const occupied = G.startAction(state, 'trolley-setup-a');
eq(G.view(occupied).active, G.view(state).active, 'Only one action/crew can be active');
eq(G.view(occupied).cost, G.view(state).cost, 'Rejected parallel dispatch does not charge money');
state = G.tick(G.tick(state));
const eventView = inspect(state);
check(eventView.status === 'event' && eventView.event.id === 'crew-handover', 'First setup triggers the announced event deterministically');
eq(G.view(G.startAction(state, 'gantry-install-a')).facts, eventView.facts, 'Unresolved event blocks dispatch');
eq(G.view(G.resolveEvent(state, 'invented-choice')).cost, eventView.cost, 'Invalid event option has no resource effect');

const quizBefore = G.view(state), wrong = G.answerQuestion(state, 'access'), wrongView = G.view(wrong);
eq([wrongView.facts, wrongView.hours, wrongView.cost, wrongView.status], [quizBefore.facts, quizBefore.hours, quizBefore.cost, quizBefore.status], 'Quiz correctness cannot alter physical acceptance or resources');
check(wrongView.question.feedback.correct === false && wrongView.question.feedback.text.length > 100, 'Wrong answer gives substantive explanation');
const retried = G.answerQuestion(wrong, 'record');
eq(G.view(retried).questionsAnswered, wrongView.questionsAnswered, 'A second answer cannot farm points');
state = G.resolveEvent(wrong, 'planned-hour');
check(G.view(state).question.feedback.correct === false, 'Feedback remains visible until next work completion');
state = doAction(state, 'gantry-install-a');
check(G.view(state).question.id === 'shared' && G.view(state).question.feedback === null, 'Next work milestone offers the next contextual question');

// Valid early teardown is allowed by the shared model; missing evidence and
// repeated enabling work are visible rather than silently corrected by UI.
const early = play('first-possession', ['gantry-setup', 'gantry-install-a', 'gantry-remove'], {'crew-handover': 'planned-hour'});
const earlyView = inspect(early);
check(earlyView.status === 'playing' && !earlyView.goals.find(g => g.id === 'evidence-a').satisfied, 'Installed and cleared is not acceptance without evidence');
check(earlyView.actions.find(a => a.id === 'gantry-setup').available, 'Shared model permits recovery setup after early clearance');
check(earlyView.remainingPlan.actionIds.includes('gantry-setup'), 'Remaining-work derivation exposes the repeated setup');
const recovery = play('first-possession', ['gantry-setup', 'gantry-remove', ...gantry], {'crew-handover': 'planned-hour'});
const recovered = inspect(recovery);
check(recovered.status === 'complete', 'One early clearance can be recovered within tutorial limits');
eq([recovered.hours, recovered.cost], [15, 1540], 'Wasted setup/removal have real time and cost');
check(recovered.completedActions.filter(a => a.id === 'gantry-setup').length === 2, 'Repeated action remains visible in receipts');

const late = play('tight-possession', gantry, {'crew-handover': 'planned-hour', 'record-handover': 'planned-hour'}), lateView = inspect(late);
check(lateView.status === 'failed' && !lateView.outcome.goalsMet, 'Both free handovers miss the possession limit');
eq(lateView.hours, 12, 'Run stops at the hard possession boundary');
const over = play('tight-possession', gantry, {'crew-handover': 'overlap-crew', 'record-handover': 'prepared-pack'}), overView = inspect(over);
check(overView.status === 'failed' && !overView.outcome.withinBudget, 'Both paid handovers exceed the budget');
eq(G.view(G.tick(over)).facts, overView.facts, 'Failure cannot keep ticking to manufacture completion');
const smallPaid = play('small-scope', ['gantry-setup', 'gantry-install-a', 'gantry-inspect-a', 'gantry-remove'], {'crew-handover': 'overlap-crew'});
check(G.view(smallPaid).status === 'failed', 'Small-scope overspending is a reachable failure');

const small = inspect(G.create('small-scope'));
check(small.actions.filter(a => a.unit === 'B').every(a => !a.available), 'Out-of-scope B actions cannot dispatch');
check(small.actions.filter(a => a.method === 'trolley').every(a => !a.available), 'Tight access respects the shared trolley prohibition');
eq(small.goals.map(g => g.id).sort(), ['evidence-a', 'installed-a', 'site-clear'], 'Single-unit completion profile comes from shared ontology');
check(G.view(G.create('unknown')).status === 'invalid' && G.view({facts: [], hours: 0}).status === 'invalid', 'Unknown missions and arbitrary state objects fail closed');

const active = G.tick(G.startAction(G.create(), 'gantry-setup'));
eq(G.view(G.undo(active)).facts, initial.facts, 'Undo cancels the entire active dispatch');
eq([G.view(G.undo(active)).hours, G.view(G.undo(active)).cost], [0, 0], 'Undo is a decision boundary, not one simulated hour');
const beforeEvent = doAction(G.create(), 'gantry-setup');
const resolved = G.resolveEvent(beforeEvent, 'planned-hour');
const rewoundEvent = G.view(G.undo(resolved));
eq([rewoundEvent.status, rewoundEvent.hours, rewoundEvent.cost], ['event', 2, 300], 'Undo restores the event before its resource choice');
const completedAction = doAction(resolved, 'gantry-install-a');
const rewoundAction = G.view(G.undo(completedAction));
eq([rewoundAction.hours, rewoundAction.cost], [3, 300], 'Undo removes a whole completed installation');
check(!rewoundAction.facts.includes('installed-a'), 'Undo removes the undone action effects');
check(G.view(G.undo(over)).status !== 'failed', 'Undo recovers from budget failure');
eq(G.view(G.create('tight-possession')).completedActions, [], 'Restart gives a clean mission');

const save = JSON.parse(G.serialize(completedAction));
for (const mutated of [
  {...save, facts: ['installed-a', 'evidence-a']}, {...save, cost: 0}, {...save, status: 'complete'},
  {...save, modelSHA: 'forged'}, {...save, version: 999}, {...save, missionId: 'custom'},
  {...save, commands: [{op: 'start', actionId: 'gantry-inspect-a'}]},
  {...save, commands: [{op: 'tick'}]}, {...save, commands: [{op: 'start', actionId: 'gantry-setup', cost: 0}]},
  {...save, commands: Array(129).fill({op: 'tick'})}
]) check(G.view(G.restore(JSON.stringify(mutated))).status === 'invalid', 'Malformed or forged save cannot import acceptance/resources');
check(G.view(G.restore('not json')).status === 'invalid', 'Malformed JSON rejected');
eq(G.view(G.restore(G.serialize(active))), G.view(active), 'An active action resumes with unapplied effects and correct remaining time');
eq(G.view(G.restore(G.serialize(beforeEvent))), G.view(beforeEvent), 'An unresolved event survives replay');
eq(G.view(G.restore(G.serialize(wrong))), G.view(wrong), 'Quiz feedback survives replay');
check(Object.isFrozen(completedAction) && Object.isFrozen(completedAction.facts), 'Returned state cannot be silently mutated');

// A learner who skipped questions during the shift can review all three after
// handover. Feedback is explicitly advanced, with no extra score or game effect.
let review = play('first-possession', gantry, {'crew-handover': 'planned-hour'});
const handedOver = G.view(review);
for (const [index, answer] of ['record', 'remaining-use', 'absence'].entries()) {
  review = G.answerQuestion(review, answer);
  let v = G.view(review);
  eq([v.status, v.facts, v.hours, v.cost], [handedOver.status, handedOver.facts, handedOver.hours, handedOver.cost], 'Post-handover answers cannot alter physical completion or resources');
  check(v.question.feedback.correct && v.questionsAnswered.length === index + 1, 'Each deferred question is answerable once');
  eq(G.view(G.restore(G.serialize(review))), v, 'Deferred feedback survives save replay');
  if (index < 2) {
    check(v.canNextQuestion, 'A triggered unanswered question can follow the feedback');
    review = G.nextQuestion(review); v = G.view(review);
    check(!v.question.feedback && !v.canNextQuestion, 'Advancing reveals the next unanswered question');
    eq(G.view(G.restore(G.serialize(review))), v, 'Next-question command survives exact replay');
  }
}
check(!G.view(review).canNextQuestion && G.view(review).correctAnswers === 3, 'Review ends after exactly three first answers');
eq(G.view(G.nextQuestion(review)).questionsAnswered, G.view(review).questionsAnswered, 'No extra question transition can create more score');
check(G.view(G.restore(JSON.stringify({...save, commands: [{op: 'next-question'}]}))).status === 'invalid', 'A next-question command without answered feedback fails replay');
check(G.view(G.restore(JSON.stringify({...save, commands: [{op: 'next-question', score: 3}]}))).status === 'invalid', 'A next-question command cannot smuggle extra saved fields');

// Bounded decision search checks the challenge trade-off beyond the shared
// semantic route: neither all-free nor all-paid choices admit a winning route,
// even when every legal work order, early removal and recovery is considered.
function challengeCanWin(choices) {
  const queue = [G.create('tight-possession')], seen = new Set();
  for (let cursor = 0; cursor < queue.length; cursor++) {
    check(cursor < 5000, 'Challenge lookahead remains within its explicit finite bound');
    const state = queue[cursor], v = G.view(state);
    if (v.status === 'complete') return true;
    if (['failed', 'infeasible', 'invalid'].includes(v.status)) continue;
    const key = [v.facts.join('|'), v.hours, v.cost, v.event?.id ?? '', state.resolvedEvents.join('|'), [...new Set(v.completedActions.map(a => a.kind))].sort().join('|')].join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    if (v.event) {queue.push(G.resolveEvent(state, choices[v.event.id])); continue;}
    for (const action of v.actions.filter(a => a.available)) {
      let next = G.startAction(state, action.id);
      while (G.view(next).status === 'playing' && G.view(next).active) next = G.tick(next);
      queue.push(next);
    }
  }
  return false;
}
for (const crew of ['planned-hour', 'overlap-crew']) for (const record of ['planned-hour', 'prepared-pack']) {
  eq(challengeCanWin({'crew-handover': crew, 'record-handover': record}), (crew === 'overlap-crew') !== (record === 'prepared-pack'), 'The complete bounded challenge requires exactly one paid handover');
}

// The game does not redefine the shared model's edge cases or method semantics.
check(W.search(W.buildProblem({scope: 'none', access: 'closed', methods: 'none'})).actionIds.length === 0, 'Empty shared scope needs zero actions');
check(W.search(W.buildProblem({scope: 'A', access: 'closed', methods: 'both'})).status === 'infeasible', 'Closed access is genuinely infeasible in the shared model');
for (const methods of ['gantry', 'trolley']) {
  const p = W.buildProblem({scope: 'A', access: 'open', methods});
  const route = W.search(p);
  check(route.status === 'solved' && route.actionIds.length === 4, 'Both methods preserve the single-unit shared semantics');
}
console.log(`Game verification passed: ${checks} assertions; five winning routes; both methods; scope, evidence, recovery, event trades, hard failures, undo and save replay.`);
