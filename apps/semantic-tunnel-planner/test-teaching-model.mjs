import assert from 'node:assert/strict';
import '../work-that-must-exist/model-data.js';
import '../work-that-must-exist/engine.js';
import '../work-that-must-exist/pddl.js';
const W=globalThis.WorkModel, P=globalThis.PDDL;
const plans=['both','A'].map(scope=>{
 const config={scope,access:'open',methods:'gantry'}, result=W.solve(config,{necessity:false}), text=W.exportPDDL(config);
 assert.equal(result.status,'solved');
 const checked=P.checkPlan(text.domain,text.problem,result.actions.map(a=>a.id));
 assert.equal(checked.valid,true);
 return result;
});
const delta=W.comparePlans(...plans);
assert.deepEqual(delta.removed.map(a=>a.id).sort(),['gantry-inspect-b','gantry-install-b']);
assert.deepEqual(delta.retained.map(a=>a.id).sort(),['gantry-inspect-a','gantry-install-a','gantry-remove','gantry-setup']);
assert.equal(plans[0].actions.length,6);assert.equal(plans[1].actions.length,4);
console.log('Teaching prediction verified: 6 → 4 actions; both exported PDDL plans execute to their goals.');
