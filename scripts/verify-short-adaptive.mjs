import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const bank=JSON.parse(await readFile('content/science-short-balanced-20260917.json','utf8'));
const pilot=JSON.parse(await readFile('content/science-short-pilot-20260917.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{await mkdir('implementation/local/short-adaptive',{recursive:true});
for(const viewport of [{width:1280,height:960},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('http'))requests.push(r.url());});
  await page.addInitScript(items=>{if(!localStorage.getItem('science-short-pilot:short-pilot-v1-20260917'))localStorage.setItem('science-short-pilot:short-pilot-v1-20260917',JSON.stringify({answers:Object.fromEntries(items.map((q,i)=>[q.id,{selectedIndex:i===19?(q.correctIndex+1)%4:q.correctIndex}]))}));},pilot.items);
  await page.goto(pathToFileURL(resolve('implementation/short-questions/adaptive.html')).href);
  assert.equal(await page.locator('#use-history').isChecked(),true);assert.match(await page.locator('#app').innerText(),/参考にできる回答：20問/);
  await page.getByText('最初の20問を仮難度で計算した参考スコア',{exact:true}).click();
  assert.equal(await page.locator('.score').count(),1);
  await page.screenshot({path:`implementation/local/short-adaptive/${viewport.width}-start.png`,fullPage:true});
  await page.locator('#start').click();
  const getState=()=>page.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('science-short-adaptive:'));return JSON.parse(localStorage.getItem(key));});
  assert.equal((await getState()).history.length,20);
  await page.keyboard.press('1');assert.equal(await page.locator('.choice.selected').count(),1);assert.equal(await page.locator('#feedback').count(),0);
  await page.locator('#confirm').click();assert.equal(await page.locator('#feedback').count(),1);assert.equal(await page.locator('.score').count(),1);
  await page.locator('#next').click();await page.locator('#instant').check();await page.keyboard.press('2');assert.equal(await page.locator('#feedback').count(),1);await page.locator('#next').click();await page.reload();
  assert.equal(await page.locator('#instant').isChecked(),true);
  await page.screenshot({path:`implementation/local/short-adaptive/${viewport.width}-question.png`,fullPage:true});
  for(let i=2;i<20;i++){
    const state=await getState(),q=bank.items.find(q=>q.id===state.issued[i].id);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator(`.choice[data-index="${q.content.correctIndex}"]`).click();assert.equal(await page.locator('#feedback').count(),1);
    if(i===2){await page.getByText('この問題へのメモ',{exact:true}).click();await page.locator('#question-note').fill('自動検査の合成メモ');}
    await page.locator('#next').click();
  }
  assert.equal(await page.locator('h2').innerText(),'20問、おつかれさまでした。');
  await page.getByText('分野ごとの参考スコア',{exact:true}).click();assert.equal(await page.locator('table tr').count(),11);
  await page.locator('#note').fill('合成入力。本人の回答ではない。');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`implementation/local/short-adaptive/${viewport.width}-result.png`,fullPage:true});
  await page.reload();assert.match(await page.locator('#note').inputValue(),/合成入力/);
  const completed=await getState(),scoreText=await page.locator('.score').innerText();
  assert.equal(Object.keys(completed.answers).length,20);assert.equal(new Set(completed.issued.map(q=>q.id)).size,20);
  const counts=Object.fromEntries([...new Set(bank.items.map(q=>q.domain))].map(d=>[d,completed.issued.filter(i=>bank.items.find(q=>q.id===i.id).domain===d).length]));
  assert.ok(Object.values(counts).every(n=>n===2));
  await page.locator('#again').click();assert.match(await page.locator('#app').innerText(),/参考にできる回答：40問/);
  await page.locator('#start').click();const next=await getState();assert.equal(next.history.length,40);assert.equal(Object.keys(next.answers).length,0);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  results.push({viewport,completed:20,counts,scoreText,historyExcludedFromCurrentScore:true,keyboard:true,reload:true,anotherTrial:true,noOverflow:true,externalRequests:0,pageErrors:errors});
  await context.close();
}}finally{await browser.close();}
const report={observedAt:new Date().toISOString(),syntheticInputs:true,realUserResponses:false,productionDataTouched:false,bankVersion:bank.version,results};
await writeFile('implementation/checks/short-adaptive-browser-20260917.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
