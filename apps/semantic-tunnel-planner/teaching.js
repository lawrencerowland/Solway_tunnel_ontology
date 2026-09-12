/* Teaching overlay: reads the same action data; never changes project rules. */
(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let intro=true, seen=null, reveal=null, exercise=null, repaint=()=>{}, view=null;
  const fact=id=>esc(root.TunnelGame.factLabel(id));
  const definition='<p><strong>Ontology:</strong> a shared description of project things and relationships.</p><p><strong>PDDL:</strong> a language for stating action conditions, effects and goals so a planner can find a route.</p>';
  function actionLesson(a){
    const u=a.unit?`Unit ${a.unit}`:'the units';
    const type=a.kind==='enable'?['Temporary equipment','The access equipment enables later work; it is not a permanent deliverable.']:a.kind==='install'?['Work process → product state',`Installation is an activity; ${u} is a physical object. The activity changes its installation state.`]:a.kind==='inspect'?['Work process → information',`The inspection is an activity. Its record is evidence about ${u}, not another physical unit.`]:['Work process → site state','Removal is an activity. A clear site is a required state, even though removing equipment adds no permanent product.'];
    const literal=(yes,no)=>[...yes.map(x=>`(${x})`),...no.map(x=>`(not (${x}))`)].join(' ');
    const rule=`(:action ${a.id}\n :parameters ()\n :precondition (and ${literal(a.positive,a.negative)})\n :effect (and ${literal(a.add,a.delete)}))`;
    return `<h2>What did that job change?</h2><p class="small">${esc(a.label)}</p><dl class="bridge"><dt>On site</dt><dd>${a.add.length?'Now true: '+a.add.map(fact).join('; ')+'.':''} ${a.delete.length?'No longer true: '+a.delete.map(fact).join('; ')+'.':''}</dd><dt>Ontology · what things mean</dt><dd><strong>${type[0]}.</strong> ${type[1]}</dd><dt>PDDL · how states change</dt><dd>Before: ${a.positive.map(fact).join('; ')||'no positive condition'}${a.negative.length?'; absent: '+a.negative.map(fact).join('; '):''}.<br>The action makes the changes above; other facts stay unchanged.</dd></dl><button class="primary" data-teach="continue">Continue →</button><details><summary>See this action in PDDL</summary><pre>${esc(rule)}</pre><p class="small">An exact grounded action from this model: no parameters remain to fill in. Preconditions must hold before execution; effects add or remove facts. Fictional game hours and costs are separate.</p></details>`;
  }
  function prediction(){
    if(!exercise.answer)return `<h2>The brief changes. Predict the work.</h2><p>Start from an empty site with a shared gantry. Now only Unit A is required, including its inspection record and a clear site.</p><p><strong>Which work disappears from the generated plan?</strong></p><div class="learning-options"><button data-predict="unit">Only Unit B’s installation and inspection</button><button data-predict="access">Unit B’s work and all gantry work</button><button data-predict="inspect">Unit B’s work and Unit A’s inspection</button></div><button class="quiet" data-teach="exit">Back to game</button>`;
    const W=root.WorkModel,both=W.solve({scope:'both',access:'open',methods:'gantry'},{necessity:false}),one=W.solve({scope:'A',access:'open',methods:'gantry'},{necessity:false}),delta=W.comparePlans(both,one);
    return `<h2>${exercise.answer==='unit'?'Yes — change the goal, regenerate the work.':'The remaining goals still need access and evidence.'}</h2><p><strong>Removed:</strong> ${delta.removed.map(a=>esc(a.label)).join('; ')}.</p><p><strong>Retained:</strong> ${delta.retained.map(a=>esc(a.label)).join('; ')}.</p><p class="small">Computed now from the shared model: ${both.actions.length} → ${one.actions.length} work actions. Same action rules and access method; changed scope facts and handover goals. This exercise does not alter your shift.</p><details><summary>Where ontology and PDDL differ</summary><p>The ontology still distinguishes units, equipment, activities and records. The planning problem changes which unit must be installed and evidenced. A planner searches the action rules for a sequence that meets that goal.</p><p>The ontology alone does not invent those action rules. This prototype explicitly declares and compiles them, then uses a bounded search also expressible in PDDL. Fewest actions does not mean lowest cost or shortest duration.</p><pre>${esc(W.exportPDDL({scope:'A',access:'open',methods:'gantry'}).problem)}</pre></details><button class="primary" data-teach="transfer">Try another project →</button>`;
  }
  function transfer(){
    if(!exercise.answer)return `<h2>Try it in an office move.</h2><p>The new office must have working Wi-Fi and a recorded acceptance check. The temporary test kit must leave afterwards.</p><p><strong>Which description could a planner use?</strong></p><div class="learning-options"><button data-transfer="vocabulary">Define router, test kit and acceptance record. That alone generates the plan.</button><button data-transfer="rules">Define those things, then specify: testing needs working Wi-Fi and the kit; testing creates a record; removal clears the kit.</button><button data-transfer="list">List “install, test, tidy”. A task list alone guarantees the handover conditions.</button></div><button class="quiet" data-teach="exit">Back to game</button>`;
    return `<h2>${exercise.answer==='rules'?'You connected meaning to planning.':'Names and task lists are not enough.'}</h2><p><strong>Ontology:</strong> equipment, an activity and evidence are different kinds of thing.</p><p><strong>Planning rules:</strong> testing needs both working Wi-Fi and the kit; it creates the acceptance record.</p><p><strong>Goal:</strong> working Wi-Fi, record present, kit absent. Removing the kit before testing blocks acceptance unless access is restored.</p><p class="small">This is a new illustrative scenario, not an executed office planner. Your prediction checks a distinction; it does not certify modelling skill.</p><button class="primary" data-teach="exit">Return to my game →</button>`;
  }
  root.GameTeaching={
    reset(){seen=null;reveal=null;exercise=null;},
    render(v,callback){view=v;repaint=callback; if(seen===null)seen=v.completedActions.length;if(v.completedActions.length<seen){seen=v.completedActions.length;reveal=null;}if(v.completedActions.length>seen){seen=v.completedActions.length;reveal=v.actions.find(a=>a.id===v.completedActions.at(-1).id);}
      const el=document.getElementById('teaching-step');
      let html='';
      if(intro)html=`<h2>Learn why a project needs this work.</h2><p>Lead a small tunnel fit-out and discover how <strong>ontologies and PDDL</strong> connect a project brief to the work needed to finish it.</p>${definition}<p class="small">By the end, try to distinguish products, work and evidence; explain an action’s conditions and effects; and predict what changes when the brief changes. No coding needed. About 5–10 minutes.</p><button class="primary" data-teach="begin">Start learning through play →</button>`;
      else if(exercise)html=exercise.kind==='scope'?prediction():transfer();
      else if(reveal)html=actionLesson(reveal);
      el.hidden=!html;el.innerHTML=html;
      if(html){for(const id of ['crew-briefing','work-clock','shift-event','outcome','learning','notice'])document.getElementById(id).hidden=true;document.getElementById('stage-label').textContent=intro?'What this is for':exercise?'Predict, then explain':'Connect the move to the model';}
      const outcome=document.getElementById('outcome');if(v.status==='complete'&&!document.getElementById('try-prediction'))outcome.insertAdjacentHTML('beforeend','<button id="try-prediction" class="primary" data-teach="predict">Test the idea: change the brief →</button>');
    }
  };
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;let handled=true;
    if(b.dataset.predict)exercise={kind:'scope',answer:b.dataset.predict};
    else if(b.dataset.transfer)exercise={kind:'transfer',answer:b.dataset.transfer};
    else switch(b.dataset.teach){case'begin':intro=false;break;case'objective':intro=true;break;case'continue':reveal=null;break;case'predict':intro=false;exercise={kind:'scope'};break;case'transfer':exercise={kind:'transfer'};break;case'exit':exercise=null;break;default:handled=false;}
    if(handled){document.querySelectorAll('dialog[open]').forEach(d=>d.close());repaint();window.scrollTo({top:0,behavior:'instant'});}
  });
})(globalThis);
