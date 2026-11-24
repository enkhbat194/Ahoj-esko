import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('dist'), types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=createServer(async(req,res)=>{try{const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/cesky-reading-uiux/';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
try{
 await mkdir('test-artifacts',{recursive:true});
 for(const width of [390,320]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:640},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  // Deterministic test doubles: these check UI transitions, NOT microphone or audio quality.
  class U{constructor(text){this.text=text;}}
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'cs-CZ'}],cancel(){},speak(u){setTimeout(()=>u.onend?.(),20);}},configurable:true});
  class R{start(){this.onstart?.();setTimeout(()=>{this.onresult?.({results:[[{transcript:window.__heard||'Dobrý den.'}]]});this.onend?.();},30);}abort(){this.onend?.();}}
  Object.defineProperty(window,'SpeechRecognition',{value:R,configurable:true});
 });
 for(let li=1;li<=10;li++){
 const id='A0-T02-L'+String(li).padStart(2,'0');
 await page.goto(base+'speaking-pilot.html?lesson='+id);
 await page.waitForFunction(()=>!!window.AHOJ_SPEAKING_PILOT&&document.querySelector('#count').textContent==='1/9');
 const steps=await page.evaluate(id=>window.AHOJ_SPEAKING_PILOT.lessons.find(l=>l.id===id).steps,id);
 const clickText=async(text,scope='#exercise')=>page.locator(scope).getByRole('button',{name:text,exact:true}).first().click();
 for(let k=0;k<steps.length;k++){
 const s=steps[k];await page.waitForFunction(k=>document.querySelector('#count').textContent===(k+1)+'/9',k);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow '+width+' '+id+' '+k);
 assert.equal(await page.locator('input,textarea,.bottom-nav').count(),0);
 if(width===390&&li===1&&k===0)await page.screenshot({path:'test-artifacts/speaking-learn.png',fullPage:true});
 if(s.type==='learn'){await clickText('▷  Сонсох');await page.waitForFunction(()=>document.querySelector('#audioStatus').textContent.includes('дууслаа'));await page.evaluate(v=>window.__heard=v,s.example||s.cz);await page.getByRole('button',{name:'Чехээр ярих'}).click();await page.getByText('Танигдсан текст:',{exact:false}).waitFor();await clickText('Үргэлжлүүлэх');}
 else if(s.type==='match'){if(width===390&&li===1)await page.screenshot({path:'test-artifacts/speaking-match.png',fullPage:true});for(const [a,b] of s.pairs){await clickText(a);await clickText(b);}}
 else if(s.type==='listen'){for(const item of s.items){await clickText('▷  Сонсох');await page.waitForFunction(()=>document.querySelector('#audioStatus').textContent.includes('дууслаа'));await clickText(item.cz);await page.waitForTimeout(750);}}
 else if(s.type==='context'||s.type==='gap'){const wrong=s.options.find(o=>o!==s.answer);if(wrong){await clickText(wrong);await page.getByText('Дахин оролдоорой.',{exact:true}).waitFor();}await clickText(s.answer);}
 else if(s.type==='build'){for(const token of s.answer)await clickText(token,'.bank');}
 else if(s.type==='dialogue'||s.type==='recall'){for(const item of s.items){if(item.partner)await clickText('▷  Сонсох');await page.evaluate(v=>window.__heard=v,item.models[0]);await page.getByRole('button',{name:'Чехээр ярих'}).click();await page.getByText('Танигдсан текст:',{exact:false}).waitFor();await clickText('Үргэлжлүүлэх');}}
 else throw Error('Unknown step '+s.type);
 }
 await page.getByText('Хичээлийн дасгал дууссан.',{exact:false}).waitFor();
 assert(await page.evaluate(id=>JSON.parse(localStorage.getItem('ahoj:speaking-pilot:v1:'+id)).completed,id));
 await page.reload();await page.getByText('Хичээлийн дасгал дууссан.',{exact:false}).waitFor();
 if(width===390&&li===10)await page.screenshot({path:'test-artifacts/speaking-result.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);await page.close();console.log('PASS: '+width+'px, 10 lessons, 90 steps, mocked speech/audio, resume, no horizontal overflow');
 }
 // Exercise actual main-app entry: click Chapter 1 and confirm link to the pilot.
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'index.html?tab=stages');
 await page.locator('[data-chapter-start="1"]').click({force:true});
 for(let i=1;i<=10;i++) await page.locator('a[href="./speaking-pilot.html?lesson=A0-T02-L'+String(i).padStart(2,'0')+'"]').waitFor();
 await page.close();
 console.log('PASS: existing main app Chapter 1 link');
}finally{await browser.close();await new Promise(r=>server.close(r));}
