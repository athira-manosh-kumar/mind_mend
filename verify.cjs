const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/app.js','utf8');

// Isolate each launch and expose cancellable timers plus the DOM APIs used by render().
function createApp({search='',saved=null,reduced=false}={}){
  const nodes={},storage=new Map(),timeouts=new Map(),intervals=new Map();let nextTimer=0;
  const location={search,pathname:'/index.html'},listeners=new Map(),browserVisits=[{state:null,url:'/index.html'+search}],popEvents=[];let browserIndex=0;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  function setLocation(url){const query=url.indexOf('?');location.pathname=query<0?url:url.slice(0,query);location.search=query<0?'':url.slice(query)}
  function traverse(delta){const target=browserIndex+delta;if(target<0||target>=browserVisits.length)return;browserIndex=target;setLocation(browserVisits[target].url);popEvents.push({state:clone(browserVisits[target].state)})}
  const history={get state(){return clone(browserVisits[browserIndex].state)},get length(){return browserVisits.length},
    pushState(state,unused,url){browserVisits.splice(browserIndex+1);browserVisits.push({state:clone(state),url});browserIndex++;setLocation(url)},
    replaceState(state,unused,url){browserVisits[browserIndex]={state:clone(state),url};setLocation(url)},
    back:()=>traverse(-1),forward:()=>traverse(1),go:delta=>traverse(delta)};
  const window={history,addEventListener(name,handler){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(handler)}};
  function flushHistory(){while(popEvents.length){const event=popEvents.shift();for(const handler of listeners.get('popstate')||[])handler(event)}}
  if(saved)storage.set('mindmend-v1',JSON.stringify(saved));
  const document={activeElement:null};
  const classList=()=>{const values=new Set();return {toggle(name,on){const enabled=on===undefined?!values.has(name):on;if(enabled)values.add(name);else values.delete(name);return enabled},add(...names){names.forEach(n=>values.add(n))},remove(...names){names.forEach(n=>values.delete(n))},contains:name=>values.has(name)}};
  function makeNode(){
    const attributes={};let html='',controls=[],heading=null;
    const el={textContent:'',value:'',scrollTop:0,style:{},classList:classList(),
      setAttribute(name,value){attributes[name]=String(value)},getAttribute:name=>attributes[name]??null,removeAttribute(name){delete attributes[name]},
      focus(){document.activeElement=el},
      querySelectorAll(selector){return selector==='button,input,textarea'?controls:[]},
      querySelector(selector){if(selector==='h1,h2')return heading;const key=selector.match(/^\[data-focus-key="([^"]+)"\]$/)?.[1];return key?controls.find(c=>c.getAttribute('data-focus-key')===key)||null:null}
    };
    Object.defineProperty(el,'innerHTML',{get:()=>html,set(value){html=value;controls=[...html.matchAll(/<(button|input|textarea)\b[^>]*>/g)].map(()=>makeNode());heading=/<h[12]\b/.test(html)?makeNode():null;if(el===nodes['#app'])document.activeElement=document.body}});
    return el;
  }
  const node=selector=>nodes[selector]||(nodes[selector]=makeNode());
  document.body=makeNode();document.querySelector=node;document.getElementById=id=>node('#'+id);
  const sandbox={URLSearchParams,location,window,matchMedia:()=>({matches:reduced}),document,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    setInterval:(callback,delay)=>{const id=++nextTimer;intervals.set(id,{callback,delay});return id},clearInterval:id=>intervals.delete(id),
    setTimeout:(callback,delay)=>{const id=++nextTimer;timeouts.set(id,{callback,delay});return id},clearTimeout:id=>timeouts.delete(id),alert:()=>{},console};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  return {node,storage,timeouts,intervals,document,history,location,browserVisits,flushHistory,
    run(code){const result=vm.runInContext(code,sandbox);flushHistory();return result},
    browserBack(){history.back();flushHistory()},browserForward(){history.forward();flushHistory()},
    fireTimeout(id){const timer=timeouts.get(id);assert(timer,'timeout must be pending');timeouts.delete(id);timer.callback();flushHistory()},
    tickInterval(id){const timer=intervals.get(id);assert(timer,'interval must be pending');timer.callback();flushHistory()}};
}

const fresh=createApp();assert.equal(fresh.run('state.page'),'splash');assert.equal(fresh.node('#nav').style.display,'none');assert(fresh.node('.device').classList.contains('no-nav'));
assert.equal(fresh.timeouts.size,1);const [freshId,freshTimer]=[...fresh.timeouts][0];assert.equal(freshTimer.delay,2800);fresh.fireTimeout(freshId);assert.equal(fresh.run('state.page'),'welcome');assert.equal(fresh.timeouts.size,0);

const saved=createApp({saved:{persist:true,mode:'Working Professional',checks:[],entries:[]}});assert.equal(saved.run('state.page'),'splash');saved.fireTimeout([...saved.timeouts.keys()][0]);assert.equal(saved.run('state.page'),'today');assert.equal(saved.run('state.mode'),'Working Professional');assert.equal(saved.node('#nav').style.display,'flex');

const skipped=createApp();const stale=[...skipped.timeouts.values()][0].callback;skipped.run('finishSplash()');assert.equal(skipped.run('state.page'),'welcome');assert.equal(skipped.timeouts.size,0);skipped.run("go('mode')");stale();assert.equal(skipped.run('state.page'),'mode','a canceled splash callback must not redirect a later page');
const navigated=createApp();const oldCallback=[...navigated.timeouts.values()][0].callback;navigated.run("go('toolkit')");assert.equal(navigated.timeouts.size,0);oldCallback();assert.equal(navigated.run('state.page'),'toolkit');

for(const [query,expectedMode] of [['student','Student'],['work','Working Professional']]){const app=createApp({search:'?screen=today&mode='+query});assert.equal(app.run('state.page'),'today');assert.equal(app.run('state.mode'),expectedMode);assert.equal(app.timeouts.size,0,'direct screen links bypass splash')}
const routeReload=createApp({search:'?screen=reflection&mode=work'});assert.equal(routeReload.run('state.mood'),'','a screen reload does not invent check-in feelings');assert.equal(routeReload.run('state.influences.length'),0);const explicitSample=createApp({search:'?screen=recommendation&sample=1'});assert.equal(explicitSample.run('state.mood'),'Overwhelmed');
const held=createApp({search:'?screen=splash&hold=1'});assert.equal(held.run('state.page'),'splash');assert.equal(held.timeouts.size,0);held.run('finishSplash()');assert.equal(held.run('state.page'),'welcome');
const reduced=createApp({reduced:true});assert.equal(reduced.run('state.reduced'),true);assert(reduced.document.body.classList.contains('reduce-motion'));const [reducedId,reducedTimer]=[...reduced.timeouts][0];assert.equal(reducedTimer.delay,900);reduced.fireTimeout(reducedId);assert.equal(reduced.run('state.page'),'welcome');

const app=createApp({search:'?screen=today'});const {run,node,storage}=app;
run("go('mode')");assert(node('#app').innerHTML.includes('enter-forward'));const choice=node('#app').querySelectorAll('button,input,textarea')[2];choice.focus();const focusKey=choice.getAttribute('data-focus-key');run("chooseMode('Working Professional')");assert(!node('#app').innerHTML.includes('enter-forward'),'selection must not replay a page transition');assert.equal(app.document.activeElement.getAttribute('data-focus-key'),focusKey,'same-screen selection restores keyboard focus');run("go('welcome','back')");assert(node('#app').innerHTML.includes('enter-back'));assert.equal(app.document.activeElement.getAttribute('tabindex'),'-1','navigation focuses the page heading');run('render()');assert(!node('#app').innerHTML.includes('enter-back'),'same-screen render must not replay backward navigation');

const screens=['splash','welcome','mode','goals','privacy','today','mood','influence','reflection','complete','recommendation','reset','breathing','reset-done','toolkit','activity','focus','timer','focus-reflection','focus-done','insights','pattern','history','profile','journal','journal-entry','support','preferences','privacy-data','delete-confirm','accessibility'];
for(const mode of ['Student','Working Professional'])for(const screen of screens){run(`state.mode=${JSON.stringify(mode)};state.activity='Grounding';state.focusReflection='More settled';go(${JSON.stringify(screen)})`);assert(node('#app').innerHTML.length>40,`${mode} ${screen}`);assert(!node('#app').innerHTML.includes('undefined'),`${screen} undefined`)}
run("state.checks=[];state.mood='Overwhelmed';state.influences=['Meetings'];state.note='sample';completeCheck()");assert.equal(run('state.checks.length'),1);assert.equal(run('recommend()[0]'),'Find a little room');
run('state.persist=true;save()');assert(storage.has('mindmend-v1'));run("state.entries=[{text:'sample'}];erase()");assert.equal(run('state.entries.length'),0);assert.equal(run('state.checks.length'),0);assert(!storage.has('mindmend-v1'));
run('state.duration=15;startFocus()');assert.equal(run('state.remaining'),900);[...app.intervals.values()].at(-1).callback();assert.equal(run('state.remaining'),899);run("go('today')");assert.equal(run('state.focusRunning'),false);assert.equal(run('state.focusStarted'),true);
run('startBreath()');assert.equal(run('state.breathRunning'),true);const breathId=run('breathInterval');run("go('toolkit')");assert.equal(run('state.breathRunning'),false);assert(!app.intervals.has(breathId),'leaving breathing clears its interval');
function clickBack(target){const action=target.node('#app').innerHTML.match(/aria-label="Back" onclick="([^"]+)"/)?.[1];assert(action,'screen must expose a Back control');target.run(action)}
function expectPage(target,page,message){assert.equal(target.run('state.page'),page,message);assert.equal(target.history.state.page,page,'browser and app history must agree');assert.equal(new URLSearchParams(target.location.search).get('screen'),page,'URL must describe the visible screen')}

// A Back control follows the route actually taken rather than its deep-link fallback.
for(const mode of ['student','work'])for(const [origin,destination] of [
  ['today','preferences'],['today','journal'],['profile','journal'],['profile','support'],['profile','privacy-data'],['profile','accessibility'],
  ['complete','recommendation'],['recommendation','reset'],['pattern','reset'],['activity','journal-entry'],['reset-done','journal-entry']
]){
  const route=createApp({search:'?screen=today&mode='+mode});
  route.run(`state.activity='Grounding';go(${JSON.stringify(origin)})`);route.node('#app').scrollTop=137;
  route.run(`go(${JSON.stringify(destination)})`);assert.equal(route.node('#app').scrollTop,0);clickBack(route);
  expectPage(route,origin,`${mode}: ${origin} → ${destination} → Back`);assert.equal(route.node('#app').scrollTop,137,'Back restores origin scroll');
}
for(const origin of ['today','profile']){
  const prefs=createApp({search:'?screen='+origin});prefs.run("go('preferences');chooseMode('Working Professional')");
  assert(prefs.node('#app').innerHTML.includes("save();back('profile')"),'Preferences Done must use actual origin');
  prefs.run("save();back('profile')");expectPage(prefs,origin);assert.equal(prefs.run('state.mode'),'Working Professional','Back retains preferences');
}

const historyCheck=createApp({search:'?screen=history'});historyCheck.run('startCheck()');clickBack(historyCheck);expectPage(historyCheck,'history');
const checkFlow=createApp({search:'?screen=today'});
checkFlow.run("startCheck();state.mood='Low';go('influence');state.influences=['Exams'];go('reflection');state.note='Draft note'");
clickBack(checkFlow);expectPage(checkFlow,'influence');assert.equal(checkFlow.run('state.note'),'Draft note');assert.equal(checkFlow.run('state.mood'),'Low');
clickBack(checkFlow);expectPage(checkFlow,'mood');assert.equal(checkFlow.run('state.influences[0]'),'Exams');
checkFlow.run("go('influence');go('reflection');completeCheck();go('recommendation')");clickBack(checkFlow);expectPage(checkFlow,'complete');
checkFlow.browserBack();expectPage(checkFlow,'reflection');checkFlow.run("state.note='Revised note';completeCheck()");
assert.equal(checkFlow.run('state.checks.length'),1,'revisiting and finishing one check-in must not duplicate it');assert.equal(checkFlow.run('state.checks[0].note'),'Revised note');
checkFlow.run("go('today');startCheck();state.mood='Steady';completeCheck()");assert.equal(checkFlow.run('state.checks.length'),2,'a deliberately new check-in remains separate');

const activityRoute=createApp({search:'?screen=reset'});activityRoute.run("activity('Grounding')");clickBack(activityRoute);expectPage(activityRoute,'reset');
const toolkitRoute=createApp({search:'?screen=toolkit'});
toolkitRoute.run("state.query='Ground';state.filter='1 minute';render()");toolkitRoute.node('#app').scrollTop=214;
toolkitRoute.run("activity('Grounding');state.activityStep=2;render()");toolkitRoute.node('#app').scrollTop=84;
toolkitRoute.run("go('journal-entry');state.journalDraft='Something I can set down';render()");clickBack(toolkitRoute);
expectPage(toolkitRoute,'activity');assert.equal(toolkitRoute.run('state.activity'),'Grounding');assert.equal(toolkitRoute.run('state.activityStep'),2);assert.equal(toolkitRoute.node('#app').scrollTop,84);assert.equal(toolkitRoute.run('state.journalDraft'),'Something I can set down');
clickBack(toolkitRoute);expectPage(toolkitRoute,'toolkit');assert.equal(toolkitRoute.run('state.query'),'Ground');assert.equal(toolkitRoute.run('state.filter'),'1 minute');assert.equal(toolkitRoute.node('#app').scrollTop,214);
toolkitRoute.browserForward();expectPage(toolkitRoute,'activity');assert.equal(toolkitRoute.run('state.activityStep'),2);
toolkitRoute.browserForward();expectPage(toolkitRoute,'journal-entry');assert(toolkitRoute.node('#app').innerHTML.includes('Something I can set down'),'forward restores retained draft');

const browserRoute=createApp({search:'?screen=today'});browserRoute.node('#app').scrollTop=161;
browserRoute.run("go('journal')");browserRoute.node('#app').scrollTop=73;browserRoute.run("go('journal-entry')");
browserRoute.browserBack();expectPage(browserRoute,'journal');assert.equal(browserRoute.node('#app').scrollTop,73);assert(browserRoute.node('#app').innerHTML.includes('enter-back'),'browser Back uses a backward transition');
browserRoute.browserBack();expectPage(browserRoute,'today');assert.equal(browserRoute.node('#app').scrollTop,161);
browserRoute.browserForward();expectPage(browserRoute,'journal');assert(browserRoute.node('#app').innerHTML.includes('enter-forward'),'browser Forward uses a forward transition');browserRoute.run("go('support')");
const branchedVisits=browserRoute.history.length;browserRoute.browserForward();expectPage(browserRoute,'support');assert.equal(browserRoute.history.length,branchedVisits,'new navigation truncates the forward branch');
browserRoute.run("go('support')");assert.equal(browserRoute.history.length,branchedVisits,'reselecting the current page creates no duplicate history entry');
clickBack(browserRoute);expectPage(browserRoute,'journal');browserRoute.browserForward();expectPage(browserRoute,'support');

for(const reducedMotion of [false,true]){
  const opening=createApp({reduced:reducedMotion});opening.run('finishSplash()');opening.run("go('mode');go('goals');go('privacy')");
  clickBack(opening);expectPage(opening,'goals');clickBack(opening);expectPage(opening,'mode');clickBack(opening);expectPage(opening,'welcome');
  assert.equal(opening.run("visits.some(v=>v.page==='splash')"),false,'splash is excluded from app Back history');
  assert.equal(opening.browserVisits.some(v=>v.state?.page==='splash'),false,'splash is excluded from browser Back history');
}
const deep=createApp({search:'?screen=privacy'});clickBack(deep);expectPage(deep,'goals');assert.equal(deep.history.length,1,'deep-link fallback replaces the entry');
const deepJournal=createApp({search:'?screen=journal-entry'});clickBack(deepJournal);expectPage(deepJournal,'journal');

const journalFromList=createApp({search:'?screen=journal'});journalFromList.run("go('journal-entry');state.journalDraft='Saved reflection'");
journalFromList.node('#journal-text').value='Saved reflection';journalFromList.run('journalSave()');expectPage(journalFromList,'journal');assert.equal(journalFromList.run('state.entries.length'),1);assert.equal(journalFromList.run('state.journalDraft'),'');
journalFromList.browserForward();expectPage(journalFromList,'journal-entry');assert(!journalFromList.node('#app').innerHTML.includes('>Saved reflection</textarea>'),'saved text is not restored as a draft');
journalFromList.node('#journal-text').value='';journalFromList.run('journalSave()');assert.equal(journalFromList.run('state.entries.length'),1,'blank revisited form cannot duplicate a saved reflection');
const journalFromActivity=createApp({search:'?screen=reset'});journalFromActivity.run("activity('Grounding');go('journal-entry');state.journalDraft='A pause helped'");
journalFromActivity.node('#journal-text').value='A pause helped';journalFromActivity.run('journalSave()');expectPage(journalFromActivity,'journal');clickBack(journalFromActivity);expectPage(journalFromActivity,'activity');
assert.equal(journalFromActivity.run("visits.some(v=>v.page==='journal-entry')"),false,'saving from an activity replaces the submitted form');

const focusRestore=createApp({search:'?screen=focus'});focusRestore.run("state.duration=15;state.focusTask='Review one chapter';startFocus()");
focusRestore.tickInterval(focusRestore.run('focusInterval'));focusRestore.run("go('profile')");assert.equal(focusRestore.run('state.focusRunning'),false);
focusRestore.browserBack();expectPage(focusRestore,'timer');assert.equal(focusRestore.run('state.remaining'),899);assert.equal(focusRestore.run('state.focusRunning'),false,'restored Focus session is paused');
focusRestore.run('toggleFocus()');focusRestore.tickInterval(focusRestore.run('focusInterval'));assert.equal(focusRestore.run('state.remaining'),898,'Focus resumes through a recreated clock');
clickBack(focusRestore);expectPage(focusRestore,'focus');focusRestore.run("state.duration=45;state.focusTask='A new task';render();go('timer')");
assert.equal(focusRestore.run('state.focusSessionDuration'),15);assert.equal(focusRestore.run('state.focusSessionTask'),'Review one chapter');assert(focusRestore.node('#app').innerHTML.includes('OF 15 MINUTES'));
const unnamedFocus=createApp({search:'?screen=focus'});unnamedFocus.run("state.focusTask='';startFocus();go('focus');state.focusTask='New draft task';go('timer')");
assert(!unnamedFocus.node('#app').innerHTML.includes('New draft task'),'an active session with no task keeps its original empty task');
const focusZero=createApp({search:'?screen=focus'});focusZero.run('startFocus();state.remaining=1');focusZero.tickInterval(focusZero.run('focusInterval'));expectPage(focusZero,'focus-reflection');
focusZero.browserBack();expectPage(focusZero,'timer');assert.equal(focusZero.run('state.remaining'),0);assert.equal(focusZero.run('state.focusRunning'),false);assert.equal(focusZero.run('state.focusStarted'),false);
focusZero.run('toggleFocus()');expectPage(focusZero,'focus');assert.equal(focusZero.intervals.size,0,'finished Focus cannot start a zero-length clock');

const breathRestore=createApp({search:'?screen=reset'});breathRestore.run('startBreath()');breathRestore.tickInterval(breathRestore.run('breathInterval'));breathRestore.run("go('profile')");assert.equal(breathRestore.intervals.size,0);
breathRestore.browserBack();expectPage(breathRestore,'breathing');assert.equal(breathRestore.run('state.breathSeconds'),59);assert.equal(breathRestore.run('state.breathRunning'),false);
breathRestore.run('toggleBreath()');breathRestore.tickInterval(breathRestore.run('breathInterval'));assert.equal(breathRestore.run('state.breathSeconds'),58,'breathing resumes through a recreated clock');
breathRestore.run('state.breathSeconds=1');breathRestore.tickInterval(breathRestore.run('breathInterval'));expectPage(breathRestore,'reset-done');breathRestore.browserBack();expectPage(breathRestore,'breathing');
assert.equal(breathRestore.run('state.breathSeconds'),0);assert.equal(breathRestore.run('state.breathRunning'),false);breathRestore.run('toggleBreath()');assert.equal(breathRestore.run('state.breathSeconds'),60,'a finished reset starts a fresh minute');assert.equal(breathRestore.intervals.size,1);

const erasure=createApp({search:'?screen=history'});erasure.run("state.checks=[{mood:'Steady',influences:[],note:'Private note',mode:'Student',date:'Today'}];state.entries=[{text:'Private reflection',date:'Today',mode:'Student'}];state.journalDraft='Unfinished';state.persist=true;save();go('journal');go('privacy-data');go('delete-confirm');erase()");
for(let i=0;i<4;i++)erasure.browserBack();assert.equal(erasure.run('state.checks.length'),0);assert.equal(erasure.run('state.entries.length'),0);assert.equal(erasure.run('state.journalDraft'),'');assert.equal(erasure.run('state.note'),'');assert.equal(erasure.run('state.persist'),false);assert(!erasure.storage.has('mindmend-v1'),'Back after erasure cannot resurrect data');

console.log('PASS: 31 screens in both modes; splash lifecycle; real-origin app and browser Back/Forward; scroll, drafts, filters and activity restoration; branch truncation; deep-link fallback; saved-data and deletion integrity; paused timer restoration, resume and completion.');
