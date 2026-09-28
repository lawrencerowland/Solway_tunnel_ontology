const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../apps/solway_firth_tunnel_fibration_demo.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const model = script.split('/* Browser view')[0];
function app() {
  const context = vm.createContext({});
  vm.runInContext(model, context);
  return expression => vm.runInContext(expression, context);
}
const value = result => JSON.parse(JSON.stringify(result));

test('initial scenario retains gates, workstreams, offsets and five pending interfaces', () => {
  const run = app();
  assert.equal(run('state.milestones.length'), 10);
  assert.equal(run('state.workstreams.length'), 8);
  assert.equal(run('state.items.length'), 21);
  assert.equal(run('itemDueDate(byId(state.items,"I-GEO-2"))'), '2027-09-21');
  assert.equal(run('itemDueDate(byId(state.items,"I-PROC-2"))'), '2028-12-18');
  assert.deepEqual(value(run('modelIssues()')), []);
  assert.equal(run('state.pullbacks.every(pb=>computePullbackStatus(pb).label === "Pending work")'), true);
});

test('exemption ignores manual and inherited slip, still follows base-date edits, and reverses', () => {
  const run=app();
  run('setMilestone("M2","slip",60); setPropagation(true)');
  assert.equal(run('itemDueDate(byId(state.items,"I-GEO-2"))'), '2027-11-20');
  run('applyChange("exempt",()=>{byId(state.items,"I-GEO-2").exempt=true})');
  assert.equal(run('itemDueDate(byId(state.items,"I-GEO-2"))'), '2027-09-21');
  assert.equal(run('state.lastChange.itemChanges.length'), 1);
  run('setMilestone("M3","date","2027-10-02")');
  assert.equal(run('itemDueDate(byId(state.items,"I-GEO-2"))'), '2027-09-22');
  run('byId(state.items,"I-GEO-2").exempt=false');
  assert.equal(run('itemDueDate(byId(state.items,"I-GEO-2"))'), '2027-11-21');
});

test('UTC calendar arithmetic rejects invalid and rolled-over dates, blank slips and fractional days', () => {
  const run=app();
  assert.equal(run('addDays("2028-02-28",1)'), '2028-02-29');
  assert.equal(run('addDays("2027-03-28",1)'), '2027-03-29');
  for(const date of ['', '2027-02-29','2027-02-30','2027-13-01','27-01-01']) {
    assert.equal(run(`parseDate(${JSON.stringify(date)})`), null);
    assert.equal(run(`setMilestone("M2","date",${JSON.stringify(date)})`), false);
  }
  for(const expression of ['NaN','Infinity','1.5','""','365001']) {
    assert.equal(run(`setMilestone("M2","slip",${expression})`), false);
  }
  assert.equal(run('byId(state.milestones,"M2").date'), '2027-06-01');
  assert.equal(run('state.log.length'), 0);
  assert.equal(run('addDays("9999-12-31",1)'), null);
});

test('invalid dates, unknown anchor and invalid offsets fail clearly without throwing', () => {
  const run=app();
  run('byId(state.items,"I-GEO-2").m="missing"');
  assert.equal(run('itemDueDate(byId(state.items,"I-GEO-2"))'), null);
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Invalid input');
  run('resetAll(); byId(state.milestones,"M3").date="2027-02-30"');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).ok'), false);
  assert.equal(run('modelIssues().length > 0'), true);
  run('resetAll(); byId(state.items,"I-GEO-2").offset=NaN');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Invalid input');
  run('resetAll(); state.pullbacks[0].left="absent"');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Invalid input');
});

test('anchor rules permit the intentional commissioning M7 to safety M8 interface', () => {
  const run=app();
  run('state.items.forEach(i=>i.status="done")');
  assert.equal(run('computePullbackStatus(state.pullbacks[4]).ok'), true);
  run('byId(state.items,"I-MEP-3").m="M9"');
  assert.equal(run('computePullbackStatus(state.pullbacks[4]).label'), 'Invalid input');
  run('resetAll(); state.items.forEach(i=>i.status="done"); state.pullbacks[4].m="M9"');
  assert.match(run('computePullbackStatus(state.pullbacks[4]).reason'), /Neither deliverable/);
});

test('done and matching labels pass only declared checks; mismatch and status remain distinct', () => {
  const run=app();
  run('state.items.forEach(i=>i.status="done")');
  assert.equal(run('state.pullbacks.every(pb=>computePullbackStatus(pb).ok)'), true);
  assert.match(run('computePullbackStatus(state.pullbacks[0]).reason'), /Engineering acceptance remains unchecked/);
  run('byId(state.items,"I-GEO-2").version="v2"');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Conflict');
  run('byId(state.items,"I-CIV-1").version="v2"; byId(state.items,"I-GEO-2").status="wip"');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Pending work');
  run('byId(state.items,"I-GEO-2").status="made-up"');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Invalid input');
  run('byId(state.items,"I-GEO-2").status="done"; byId(state.items,"I-GEO-2").version=""; byId(state.items,"I-CIV-1").version=""');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Invalid input');
});

test('due-date bounds use the same exemption semantics as rendering and identify a real conflict', () => {
  const run=app();
  run('state.items.forEach(i=>i.status="done"); byId(state.items,"I-CIV-1").exempt=true; setMilestone("M3","slip",-14)');
  assert.equal(run('itemDueDate(byId(state.items,"I-CIV-1"))'), '2027-10-01');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).label'), 'Conflict');
  assert.match(run('computePullbackStatus(state.pullbacks[0]).reason'), /due date is after/);
  run('byId(state.items,"I-CIV-1").exempt=false');
  assert.equal(run('computePullbackStatus(state.pullbacks[0]).ok'), true);
});

test('forward dependency propagation handles every edited gate without overwriting manual slips', () => {
  const run=app();
  run('setMilestone("M2","slip",20); setMilestone("M4","slip",80); setPropagation(true)');
  assert.equal(run('effectiveSlip("M3")'), 20);
  assert.equal(run('effectiveSlip("M5")'), 80);
  assert.equal(run('byId(state.milestones,"M5").slip'), 0);
  run('setMilestone("M4","slip",10)');
  assert.equal(run('effectiveSlip("M5")'), 20);
  run('setMilestone("M2","slip",0)');
  assert.equal(run('effectiveSlip("M3")'), 0);
  assert.equal(run('effectiveSlip("M5")'), 10);
  run('setPropagation(false)');
  assert.equal(run('effectiveSlip("M5")'), 0);
  assert.equal(run('effectiveSlip("M4")'), 10);
});

test('a local advance survives propagation unless a positive upstream delay overrides it', () => {
  const run=app();
  run('setMilestone("M3","slip",-14); setPropagation(true)');
  assert.equal(run('effectiveSlip("M3")'),-14);
  assert.equal(run('milestoneEffectiveDate("M3")'),'2027-09-17');
  assert.equal(run('effectiveSlip("M4")'),0);
  run('setMilestone("M2","slip",7)');
  assert.equal(run('effectiveSlip("M3")'),7);
  assert.equal(run('byId(state.milestones,"M3").slip'),-14);
  assert.equal(run('effectiveSlip("M4")'),7);
  run('setMilestone("M2","slip",0)');
  assert.equal(run('effectiveSlip("M3")'),-14);
  assert.equal(run('effectiveSlip("M4")'),0);
});

test('propagation is idempotent; audit counts actual before/after differences including base edits', () => {
  const run=app();
  run('setMilestone("M2","slip",60)');
  assert.equal(run('state.lastChange.gateChanges.length'), 1);
  assert.equal(run('state.lastChange.itemChanges.length'), 3);
  assert.equal(run('state.lastChange.itemChanges.every(d=>d.before !== d.after)'), true);
  run('setPropagation(true)');
  assert.equal(run('state.lastChange.gateChanges.length'), 7);
  const before=value(run('dateSnapshot()'));
  run('setPropagation(true)');
  assert.deepEqual(value(run('dateSnapshot()')),before);
  assert.equal(run('state.lastChange.itemChanges.length'), 0);
  assert.match(run('state.log[0].message'),/Inputs unchanged/);
  run('setMilestone("M3","date","2027-10-02")');
  assert.equal(run('state.lastChange.gateChanges.length'), 1);
  assert.equal(run('state.lastChange.itemChanges.length'), 5);
});

test('unchanged branches, chronological conflicts and model-wide invalid dates stay visible', () => {
  const run=app();
  const before=run('itemDueDate(byId(state.items,"I-GOV-1"))');
  run('setMilestone("M2","slip",60); setPropagation(true)');
  assert.equal(run('itemDueDate(byId(state.items,"I-GOV-1"))'),before);
  run('setMilestone("M9","date","2020-01-01")');
  assert.match(run('modelIssues().join(" ")'),/precedes M8/);
  run('byId(state.milestones,"M0").date=""');
  assert.match(run('glueCheck().join(" ")'),/M0: invalid date/);
});

test('passing interfaces cannot mask a conflicting programme chain; its warning is persistent in the gate panel', () => {
  const run=app();
  run('state.items.forEach(i=>i.status="done"); setMilestone("M0","date","2035-04-01")');
  assert.equal(run('state.pullbacks.every(pb=>computePullbackStatus(pb).ok)'),true);
  assert.match(run('modelIssues().join(" ")'),/M1: gate date precedes M0/);
  // Render the real milestone view into a small element map: the warning is
  // independent of the transient announcement and remains after another edit.
  const elements={modelIssues:{style:{}},milestoneTable:{}};
  const context=vm.createContext({document:{getElementById:id=>elements[id]},CSS:{escape:x=>x}});
  vm.runInContext(model+script.slice(script.indexOf('/* Browser view'),script.indexOf('function renderItemRow')),context);
  vm.runInContext('setMilestone("M0","date","2035-04-01"); renderMilestones()',context);
  assert.match(elements.modelIssues.textContent,/M1: gate date precedes M0/);
  vm.runInContext('setMilestone("M9","slip",1); renderMilestones()',context);
  assert.match(elements.modelIssues.textContent,/do not override these conflicts/);
  vm.runInContext('resetAll(); renderMilestones()',context);
  assert.match(elements.modelIssues.textContent,/checks pass/);
});

test('reset restores base dates, data, derived policy and views; replay is deterministic', () => {
  const run=app();
  const baseline=value(run('dateSnapshot()'));
  const sequence='scenarioConsentDelay(); setPropagation(true); scenarioGroundModelLate(); scenarioSafetyEvidence();';
  run(sequence);
  const result=value(run('dateSnapshot()'));
  run('setMilestone("M1","date","2026-09-15"); state.showMath=true; state.items[0].exempt=true; resetAll()');
  assert.deepEqual(value(run('dateSnapshot()')),baseline);
  assert.equal(run('state.propagateSlipForward || state.showMath || state.items.some(i=>i.exempt)'),false);
  assert.equal(run('state.items.every(i=>i.status === "todo" && i.version === "v1")'),true);
  assert.equal(run('state.log.length'),1);
  run(sequence);
  assert.deepEqual(value(run('dateSnapshot()')),result);
  const receipt=value(run('state.log[0]'));
  run('resetAll();'+sequence);
  assert.deepEqual(value(run('state.log[0]')),receipt);
});

test('browser script parses and retains accessible controls, focus restoration, mobile rules and method link', () => {
  assert.doesNotThrow(()=>new vm.Script(script));
  assert.match(html,/role="status" aria-live="polite"/);
  assert.match(html,/role="dialog" aria-modal="true" aria-labelledby="modalTitle"/);
  assert.match(script,/event.key==="Escape"/);
  assert.match(script,/event.key==="Tab"/);
  assert.match(script,/modalTrigger\?\.focus/);
  assert.match(html,/@media\(max-width:650px\)/);
  assert.match(html,/https:\/\/lawrencerowland.github.io\/functors-for_projects\/apps\/fibration-milestone-linking\/index.html/);
});

test('scenario controls retain the same bounds as manual date controls', () => {
  const run=app();
  run('setMilestone("M2","slip",365000)');
  const before=value(run('dateSnapshot()'));
  assert.equal(run('scenarioConsentDelay()'),false);
  assert.equal(run('byId(state.milestones,"M2").slip'),365000);
  assert.deepEqual(value(run('dateSnapshot()')),before);
  assert.match(run('state.log[0].message'),/not applied/);
});
