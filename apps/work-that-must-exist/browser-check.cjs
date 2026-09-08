/* Ordinary-interface checks. Start an HTTP server at the repository root first.
   BASE_URL may point at the deployed app. PLAYWRIGHT_MODULE and BROWSER_CHANNEL
   optionally select installed tooling; the default is Playwright Chromium. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765/apps/work-that-must-exist/';
const output = process.env.BROWSER_OUTPUT || '/tmp/solway-browser-checks';
const errors = [];
const checks = [];
const note = (label, evidence) => { checks.push({label, evidence}); console.log(`PASS ${label}`); };
(async () => {
  await fs.mkdir(output, {recursive:true});
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1100}, acceptDownloads:true});
    await context.grantPermissions(['clipboard-read','clipboard-write'], {origin:new URL(base).origin});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error' && !/favicon|fonts.googleapis|fonts.gstatic/.test(message.location().url || message.text())) errors.push(message.text()); });
    const countActions = () => page.locator('#route .action').count();
    const routeLabels = () => page.locator('#route .action b').allTextContents();
    const routeIDs = () => page.locator('#route .action').evaluateAll(nodes=>nodes.map(n=>n.dataset.actionId));
    const overflow = async () => {
      const dimensions = await page.evaluate(() => ({width:innerWidth, page:document.documentElement.scrollWidth, body:document.body.scrollWidth}));
      assert.ok(dimensions.page <= dimensions.width + 1 && dimensions.body <= dimensions.width + 1, `Horizontal overflow: ${JSON.stringify(dimensions)}`);
      return dimensions;
    };
    await page.goto(base, {waitUntil:'networkidle'});
    await page.locator('#route .action').first().waitFor();
    assert.equal(await countActions(),6);
    const defaultLabels = await routeLabels();
    const defaultIDs = await routeIDs();
    assert.equal(defaultIDs.filter(x => /^gantry-(setup|remove)$/.test(x)).length,2);
    assert.equal(defaultLabels.filter(x => /inspect/i.test(x)).length,2);
    note('Default brief generates six actions, including setup, inspections and removal',defaultLabels);
    assert.equal(await page.locator('#required-function-count').innerText(),'6');
    const functionLabels = await page.locator('#required-functions .function-band strong').allTextContents();
    assert.equal(functionLabels.length,6);
    assert.ok(functionLabels.includes('Provide temporary access'));
    assert.ok(functionLabels.includes('Clear temporary access'));
    for(const unit of ['A','B']) {
      assert.ok(functionLabels.includes(`Install Unit ${unit}`));
      assert.ok(functionLabels.includes(`Produce inspection evidence for Unit ${unit}`));
    }
    note('Six required functions distinguish method-independent work from specific actions',functionLabels);
    note('Desktop has no horizontal overflow',await overflow());
    await page.screenshot({path:path.join(output,'desktop-default.png'),fullPage:true});

    for(let step=0;step<6;step++) await page.locator('#step-next').click();
    assert.equal(await page.locator('#step-range').inputValue(),'6');
    assert.ok(await page.locator('#step-next').isDisabled());
    const endCaption = await page.locator('#scene-caption').innerText();
    assert.match(endCaption,/clear|accept|complet|remov|handover/i);
    const finalScene = await page.locator('#scene-desc').textContent();
    assert.match(finalScene,/Unit A: installed, inspection recorded/);
    assert.match(finalScene,/Unit B: installed, inspection recorded/);
    assert.match(finalScene,/Temporary access absent/);
    await page.screenshot({path:path.join(output,'desktop-completed.png'),fullPage:false});
    note('Route can be stepped to its completed handover state',endCaption);
    await page.locator('#reset').click();
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#step-range').value === document.querySelector('#step-range').max, null, {timeout:15000});
    assert.equal(await page.locator('#step-range').inputValue(),'6');
    note('Playback reaches the last state without extra interaction',await page.locator('#step-label').innerText());

    await page.locator('[data-preset="tight"]').click();
    assert.equal(await page.locator('#access').inputValue(),'tight');
    assert.equal(await countActions(),6);
    await page.locator('#route .action').first().click();
    assert.match(await page.locator('#action-detail').innerText(),/unavoidable/i);
    note('Narrow access makes the shared access action unavoidable',await page.locator('#action-detail').innerText());
    await page.locator('[data-preset="one"]').click();
    assert.equal(await page.locator('#unit-b').isChecked(),false);
    assert.equal(await countActions(),4);
    const oneLabels = await routeLabels();
    assert.equal((await routeIDs()).filter(x => /^gantry-(setup|remove)$/.test(x)).length,2);
    assert.equal(oneLabels.filter(x => /unit B/i.test(x)).length,0);
    assert.equal(await page.locator('#required-function-count').innerText(),'4');
    assert.equal(await page.locator('#required-functions .function-band strong').count(),4);
    assert.doesNotMatch(await page.locator('#required-functions').innerText(),/Unit B/);
    note('Removing B retains one shared setup and removal while dropping B work',oneLabels);
    await page.locator('#tab-comparison').click();
    await page.getByText('Which typed obligations came from this brief?',{exact:true}).click();
    assert.equal(await page.locator('#semantic-obligations tbody tr').count(),3);
    assert.doesNotMatch(await page.locator('#semantic-obligations').innerText(),/Unit B/);
    assert.match(await page.locator('#semantic-obligations').innerText(),/Unit A.*installed[\s\S]*Information content[\s\S]*SiteClear/i);
    note('The typed-obligation table removes B while retaining A evidence and site clearance',await page.locator('#semantic-obligations').innerText());
    await page.locator('#tab-reasons').click();

    await page.locator('[data-preset="trolleys"]').click();
    assert.equal(await page.locator('#methods').inputValue(),'trolley');
    assert.equal(await page.locator('#access').inputValue(),'open');
    assert.equal(await countActions(),8);
    const trolleyLabels = await routeLabels();
    assert.equal((await routeIDs()).filter(x => /^trolley-/.test(x)).length,8);
    note('Open access with trolley only generates the alternate eight-action route',trolleyLabels);
    await page.locator('[data-preset="blocked"]').click();
    assert.equal(await page.locator('#methods').inputValue(),'trolley');
    assert.equal(await page.locator('#access').inputValue(),'tight');
    assert.equal(await countActions(),0);
    assert.match(await page.locator('#result-summary').innerText(),/no completion|no route|impossible|infeasible|cannot|unreachable/i);
    assert.match(await page.locator('#comparison').textContent(),/Both searches exhaust[\s\S]*Unreachable/);
    note('Tight access with trolley only reports no completion route in both comparisons',await page.locator('#result-summary').innerText());
    await page.locator('#unit-a').uncheck();
    await page.locator('#unit-b').uncheck();
    assert.equal(await countActions(),0);
    assert.match(await page.locator('#result-summary').innerText(),/already|no work|zero|0/i);
    assert.match(await page.locator('#comparison').textContent(),/Both independently searched[\s\S]*Achievable/);
    assert.equal(await page.locator('#required-function-count').innerText(),'0');
    assert.equal(await page.locator('#required-functions .function-band strong').count(),0);
    note('Empty scope requires zero work and zero functions even if no method can operate',await page.locator('#result-summary').innerText());

    await page.locator('#reset').click();
    await page.locator('#tab-reasons').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-wbs').getAttribute('aria-selected'),'true');
    assert.ok(await page.locator('#panel-wbs').isVisible());
    assert.equal(await page.locator('#tab-wbs').evaluate(el=>el===document.activeElement),true);
    note('Tabs support keyboard arrows and focus follows the selected panel');
    const packages = await page.locator('#wbs .package li').allTextContents();
    const productIDs = await page.locator('#wbs .package li').evaluateAll(nodes=>nodes.map(n=>n.dataset.wbsAction));
    assert.equal(packages.length,6);
    await page.locator('#group-trade').click();
    const trades = await page.locator('#wbs .package li').allTextContents();
    assert.equal(trades.length,6);
    // Each generated action must occur once in both views, regardless of package labels.
    const tradeIDs = await page.locator('#wbs .package li').evaluateAll(nodes=>nodes.map(n=>n.dataset.wbsAction));
    assert.deepEqual(productIDs.sort(),[...defaultIDs].sort());
    assert.deepEqual(tradeIDs.sort(),[...defaultIDs].sort());
    note('Product and trade WBS views each own all six actions exactly once',{packages,trades});

    await page.locator('[data-meaning-view="product"]').click();
    assert.deepEqual(await page.locator('#meaning-map strong').allTextContents(),['Unit A','Unit B']);
    await page.locator('[data-meaning-item="product-A"]').click();
    assert.match(await page.locator('#meaning-detail').innerText(),/Set up the shared gantry[\s\S]*Inspect Unit A/);
    assert.doesNotMatch(await page.locator('#meaning-detail').innerText(),/Inspect Unit B|Install Unit B/);
    await page.locator('[data-meaning-view="work"]').click();
    assert.equal(await page.locator('[data-meaning-item]').count(),6);
    await page.locator('[data-meaning-item="gantry-setup"]').click();
    assert.match(await page.locator('#meaning-detail').innerText(),/Initial condition[\s\S]*Inspect Unit A[\s\S]*Inspect Unit B/);
    await page.locator('[data-meaning-view="means"]').click();
    assert.equal(await page.locator('[data-meaning-item]').count(),1);
    assert.match(await page.locator('#meaning-detail').innerText(),/Remove the shared gantry/);
    await page.locator('[data-meaning-view="evidence"]').click();
    assert.equal(await page.locator('[data-meaning-item]').count(),2);
    assert.match(await page.locator('#meaning-detail').innerText(),/inspection[\s\S]*Inspect Unit A/i);
    note('Product, work, means and evidence show distinct items with computed causal support');
    await page.locator('[data-preset="trolleys"]').click();
    await page.locator('[data-meaning-view="means"]').click();
    assert.deepEqual(await page.locator('#meaning-map strong').allTextContents(),['Unit A trolley','Unit B trolley']);
    assert.doesNotMatch(await page.locator('#meaning-detail').innerText(),/gantry|Unit B/);
    await page.locator('#unit-b').uncheck();
    assert.equal(await page.locator('[data-meaning-item]').count(),1);
    await page.locator('[data-meaning-view="evidence"]').click();
    assert.equal(await page.locator('[data-meaning-item]').count(),1);
    assert.doesNotMatch(await page.locator('#meaning-map').innerText(),/Unit B/);
    note('Changing method and scope replaces the explanation items and drops B evidence');
    await page.locator('[data-preset="blocked"]').click();
    await page.locator('[data-meaning-view="means"]').click();
    assert.equal(await page.locator('[data-meaning-item]').count(),0);
    assert.match(await page.locator('#meaning-map').innerText(),/No feasible route/);
    await page.locator('[data-meaning-view="product"]').click();
    assert.equal(await page.locator('[data-meaning-item]').count(),2);
    assert.match(await page.locator('#meaning-detail').innerText(),/no completion route/);
    await page.locator('#unit-a').uncheck();
    await page.locator('#unit-b').uncheck();
    assert.equal(await page.locator('[data-meaning-item]').count(),0);
    note('An infeasible brief proposes no means; empty scope leaves no invented products');
    await page.locator('#reset').click();

    await page.locator('#tab-comparison').click();
    const comparison = await page.locator('#comparison').innerText();
    assert.match(comparison,/6/);
    assert.match(comparison,/agree|same|match|parity/i);
    assert.doesNotMatch(comparison,/error|mismatch/i);
    note('Rendered independent PDDL comparison agrees with the semantic route',comparison);
    const obligationDisclosure = page.getByText('Which typed obligations came from this brief?',{exact:true});
    if(!(await page.locator('#semantic-obligations').isVisible())) await obligationDisclosure.click();
    assert.equal(await page.locator('#semantic-obligations tbody tr').count(),5);
    assert.match(await page.locator('#semantic-obligations').innerText(),/Unit A[\s\S]*Unit B/);
    note('The default typed-obligation table shows both units and the site clearance rule',await page.locator('#semantic-obligations').innerText());
    await page.screenshot({path:path.join(output,'desktop-comparison.png'),fullPage:true});
    const downloadItems = [
      ['#download-domain',/\(define\s+\(domain/,'.pddl'],
      ['#download-problem',/\(define\s+\(problem/,'.pddl'],
      ['#download-turtle',/@prefix[\s\S]*PlanResult/,'.ttl'],
      ['#download-receipt',/assumptions/i,'.json']
    ];
    const downloaded = [];
    for(const [selector, pattern, extension] of downloadItems) {
      const [download] = await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);
      const name=download.suggestedFilename();
      assert.ok(name.endsWith(extension),name);
      const file=path.join(output,name);
      await download.saveAs(file);
      const source=await fs.readFile(file,'utf8');
      assert.match(source,pattern);
      if(extension === '.json') JSON.parse(source);
      downloaded.push({name,bytes:Buffer.byteLength(source)});
    }
    note('All four export buttons produce nonempty, format-appropriate downloads',downloaded);
    await page.locator('#methods').selectOption('trolley');
    await page.locator('#unit-b').uncheck();
    await page.locator('#share').click();
    const link=await page.evaluate(()=>navigator.clipboard.readText());
    assert.ok(link.startsWith(new URL(base).origin),link);
    await page.goto(link,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#methods').inputValue(),'trolley');
    assert.equal(await page.locator('#unit-a').isChecked(),true);
    assert.equal(await page.locator('#unit-b').isChecked(),false);
    assert.equal(await countActions(),4);
    note('Copied experiment link reloads the exact non-default brief',link);

    await page.setViewportSize({width:390,height:844});
    await page.locator('#reset').click();
    note('Mobile default has no horizontal overflow',await overflow());
    await page.screenshot({path:path.join(output,'mobile-default.png'),fullPage:true});
    await page.locator('#experiment').screenshot({path:path.join(output,'mobile-workbench.png')});
    await page.locator('#unit-b').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#unit-b').isChecked(),false);
    assert.equal(await countActions(),4);
    note('Mobile keyboard activation changes scope and regenerates work');
    for(const tab of ['reasons','wbs','comparison','findings']) {
      await page.locator(`#tab-${tab}`).click();
      assert.ok(await page.locator(`#panel-${tab}`).isVisible());
      note(`Mobile ${tab} panel has no horizontal overflow`,await overflow());
      await page.locator(`#panel-${tab}`).screenshot({path:path.join(output,`mobile-${tab}-panel.png`)});
    }
    await page.locator('#tab-comparison').click();
    await page.screenshot({path:path.join(output,'mobile-comparison.png'),fullPage:true});
    assert.deepEqual(errors,[],`Browser errors: ${errors.join('\n')}`);
    note('No application JavaScript or console errors');
    await fs.writeFile(path.join(output,'browser-receipt.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),checks,errors},null,2)+'\n');
    console.log(`Verified ${checks.length} ordinary-interface checks. Evidence: ${output}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
