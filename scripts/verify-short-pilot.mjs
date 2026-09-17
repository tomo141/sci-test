import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const pilot=JSON.parse(await readFile('content/science-short-pilot-20260917.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
  await mkdir('implementation/local/short-pilot',{recursive:true});
  for(const viewport of [{width:1280,height:960},{width:390,height:844}]) {
    const context=await browser.newContext({viewport});
    const page=await context.newPage(), errors=[], requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.url().startsWith('http'))requests.push(r.url());});
    await page.goto(pathToFileURL(resolve('implementation/short-questions/index.html')).href);
    assert.equal(await page.locator('#instant').isChecked(),false);
    await page.keyboard.press('1');
    assert.equal(await page.locator('#feedback').count(),0);
    assert.equal(await page.locator('.choice.selected').count(),1);
    await page.locator('#confirm').click();
    assert.equal(await page.locator('#feedback').count(),1);
    await page.locator('#next').click();
    await page.locator('#instant').check();
    await page.keyboard.press('2');
    assert.equal(await page.locator('#feedback').count(),1);
    await page.locator('#next').click();
    await page.reload();
    assert.equal(await page.locator('#instant').isChecked(),true);
    assert.match(await page.locator('h2').innerText(),/pH/);
    await page.screenshot({path:`implementation/local/short-pilot/${viewport.width}-question.png`,fullPage:true});
    for(let i=2;i<20;i++){
      const q=pilot.items[i];
      assert.equal(await page.locator('.choice').count(),4);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if(q.id==='short-chemistry-02')assert.equal(await page.locator('h2 sub').innerText(),'N');
      await page.locator('.choice').filter({hasText:q.choices[q.correctIndex]}).first().click();
      assert.equal(await page.locator('#feedback').count(),1);
      if(i===12)await page.screenshot({path:`implementation/local/short-pilot/${viewport.width}-sn2.png`,fullPage:true});
      if(i===2){await page.getByText('この問題へのメモ（任意）',{exact:true}).click();await page.locator('#question-note').fill('確認用の合成メモ 1234');assert.equal(await page.locator('#next').count(),1);}
      await page.locator('#next').click();
    }
    await page.getByLabel('ちょうどよい',{exact:true}).first().check();
    await page.getByLabel('さくさく解けた',{exact:true}).check();
    await page.locator('#overall-note').fill('自動検査の合成入力。本人の感想ではない。');
    assert.match(await page.locator('#summary').innerText(),/回答 20\/20/);
    assert.match(await page.locator('#summary').innerText(),/確認用の合成メモ 1234/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`implementation/local/short-pilot/${viewport.width}-summary.png`,fullPage:true});
    await page.reload();
    assert.match(await page.locator('#overall-note').inputValue(),/本人の感想ではない/);
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    results.push({viewport,questionsCompleted:20,defaultKeyboardSelectOnly:true,checkedKeyboardImmediate:true,clickImmediate:true,resume:true,notation:true,feedbackPreserved:true,noOverflow:true,externalRequests:requests.length,pageErrors:errors});
    await context.close();
  }
} finally {await browser.close();}
const report={observedAt:new Date().toISOString(),version:pilot.version,syntheticBrowserInputs:true,realUserResponses:false,productionDataTouched:false,results};
await writeFile('implementation/checks/short-pilot-browser-20260917.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
