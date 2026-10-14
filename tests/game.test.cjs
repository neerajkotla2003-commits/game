// Optional: node --test tests/game.test.cjs (Node.js 18+). No npm packages needed.
// These tests execute the real game code with a simulated DOM, Canvas and clock.
// They check game behavior, not browser rendering or the Docker image.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');

function game(storage = new Map()) {
  function target() {
    const listeners = new Map();
    return { hidden: false, disabled: false, textContent: '', innerHTML: '',
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
      dispatch(type, data={}) { for (const fn of listeners.get(type)||[]) fn({preventDefault(){}, ...data}); },
      setAttribute(){}, setPointerCapture(){}, focus(){} };
  }
  const elements = Object.fromEntries(['game','score','speed','best','pause','overlay','overlay-tag','overlay-title','overlay-message','overlay-note','start','announcement','left','right'].map(id=>[id,target()]));
  const ctx = new Proxy({}, {get: (_, key) => key === 'createLinearGradient' ? () => ({addColorStop(){}}) : () => {}, set:()=>true});
  elements.game.getContext=()=>ctx;
  const document=Object.assign(target(), {getElementById:id=>elements[id],hidden:false});
  const window=target();
  let nextFrame, now=0;
  const math=Object.create(Math);math.random=()=>.5; // Traffic always arrives in center lane.
  vm.runInNewContext(code, {document,window,Math:math,Number,String,
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
    requestAnimationFrame:fn=>{nextFrame=fn;} });
  nextFrame(1);
  return {elements,window,document,storage,
    tick(seconds) { for(let i=0;i<Math.round(seconds*60);i++){now+=1000/60;nextFrame(now+1);} },
    start(){elements.start.dispatch('click');},
    key(key,type='keydown'){window.dispatch(type,{key,repeat:false});} };
}

test('starting a race resets the score and enables pause',()=>{
  const g=game();g.start();assert.equal(g.elements.overlay.hidden,true);assert.equal(g.elements.pause.disabled,false);
  assert.equal(g.elements.score.textContent,'00000');g.tick(1);assert(Number(g.elements.score.textContent)>0);
});
test('pause freezes score, resume continues, blur and hidden tab pause',()=>{
  const g=game();g.start();g.tick(.5);g.key('p');const score=g.elements.score.textContent;
  g.tick(1);assert.equal(g.elements.score.textContent,score);assert.equal(g.elements['overlay-title'].textContent,'Pit stop.');
  g.key(' ');g.tick(.5);assert(Number(g.elements.score.textContent)>Number(score));
  g.window.dispatch('blur');assert.equal(g.elements.overlay.hidden,false);
  g.start();g.document.hidden=true;g.document.dispatch('visibilitychange');assert.equal(g.elements.overlay.hidden,false);
});
test('collision ends the run, records best, restart resets, storage persists',()=>{
  const g=game();g.start();g.tick(5);assert.equal(g.elements['overlay-title'].textContent,'What a run.');
  assert.equal(g.elements.pause.disabled,true);const best=g.elements.best.textContent;assert(Number(best)>0);
  g.start();assert.equal(g.elements.score.textContent,'00000');assert.equal(g.elements.overlay.hidden,true);
  assert.equal(game(g.storage).elements.best.textContent,best);
});
test('keyboard steering avoids center-lane traffic and clamps to road bounds',()=>{
  const g=game();g.start();g.key('ArrowLeft');g.tick(1);g.key('ArrowLeft','keyup');g.tick(4);
  assert.equal(g.elements.overlay.hidden,true);assert(Number(g.elements.score.textContent)>100);
});
test('touch steering avoids traffic and handles pointer cancellation',()=>{
  const g=game();g.start();g.elements.right.dispatch('pointerdown',{pointerId:1});g.tick(.5);
  g.elements.right.dispatch('pointercancel');g.tick(4);assert.equal(g.elements.overlay.hidden,true);
});
test('simultaneous opposite keyboard inputs cancel each other',()=>{
  const g=game();g.start();g.key('a');g.key('d');g.tick(5);assert.equal(g.elements['overlay-title'].textContent,'What a run.');
});
test('game files referenced by HTML exist and no external assets are required',()=>{
  const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if(match[1]==='./') continue;
    assert(!match[1].startsWith('http'));assert(fs.existsSync(path.join(root,match[1])));
  }
});
