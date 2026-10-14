(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const ui = Object.fromEntries(['score','speed','best','pause','overlay','overlay-tag','overlay-title','overlay-message','overlay-note','start','announcement'].map(id => [id, document.getElementById(id)]));
  const W = 420, H = 680, road = { left: 58, right: 362, lane: 304 / 3 };
  const player = { x: 210, y: 553, w: 42, h: 78 };
  let mode = 'ready', elapsed = 0, distance = 0, score = 0, offset = 0, spawnTimer = 0, traffic = [], lastTime = 0, best = 0;
  let keyboard = { left: false, right: false }, touch = { left: false, right: false };
  try { best = Math.max(0, Number(localStorage.getItem('nightshift-best')) || 0); } catch {}
  ui.best.textContent = format(best);
  function format(n) { return String(Math.floor(n)).padStart(5, '0'); }
  function clearControls() { keyboard = { left: false, right: false }; touch = { left: false, right: false }; }
  function speed() { return Math.min(610, 235 + elapsed * 4.2); }
  function showOverlay(tag, title, message, action, note) {
    ui['overlay-tag'].textContent = tag; ui['overlay-title'].textContent = title;
    ui['overlay-message'].textContent = message; ui['start'].innerHTML = action + ' <span>↗</span>';
    ui['overlay-note'].textContent = note; ui.overlay.hidden = false;
  }
  function start() {
    mode = 'running'; elapsed = 0; distance = 0; score = 0; spawnTimer = .8; traffic = []; player.x = W / 2; clearControls();
    ui.overlay.hidden = true; ui.pause.disabled = false; ui.pause.textContent = 'Ⅱ'; ui.pause.setAttribute('aria-label', 'Pause game');
    ui.announcement.textContent = 'Race started. Avoid the traffic.'; updateHUD(); canvas.focus();
  }
  function pause() {
    if (mode === 'running') {
      mode = 'paused'; clearControls(); ui.pause.textContent = '▶'; ui.pause.setAttribute('aria-label','Resume game');
      showOverlay('TAKE A BREATHER', 'Pit stop.', 'Your run is waiting right here.', 'Resume race', 'PRESS P OR SPACE TO RESUME');
      ui.announcement.textContent = 'Game paused.';
    } else if (mode === 'paused') {
      mode = 'running'; clearControls(); ui.overlay.hidden = true; ui.pause.textContent = 'Ⅱ'; ui.pause.setAttribute('aria-label','Pause game'); ui.announcement.textContent = 'Race resumed.';
    }
  }
  function crash() {
    mode = 'over'; clearControls(); ui.pause.disabled = true;
    const newBest = score > best;
    if (newBest) { best = score; ui.best.textContent = format(best); try { localStorage.setItem('nightshift-best', String(best)); } catch {} }
    showOverlay(newBest ? 'NEW PERSONAL BEST' : 'END OF THE ROAD', 'What a run.', `You scored ${score} points. Ready for another lap?`, 'Race again', 'KEEP YOUR EYES ON THE NEXT GAP');
    ui.announcement.textContent = `Game over. Score ${score}. ${newBest ? 'New personal best.' : ''}`;
  }
  function collides(a, b) {
    // A small inset makes grazing a bumper forgiving.
    return Math.abs(a.x-b.x) < (a.w+b.w)/2-9 && Math.abs(a.y-b.y) < (a.h+b.h)/2-9;
  }
  function spawn() {
    const lane = Math.floor(Math.random()*3);
    traffic.push({x:road.left+road.lane*(lane+.5),y:-90,w:44,h:80,color:['#f27474','#c4acff','#efb95e','#75c9eb'][Math.floor(Math.random()*4)],passed:false});
  }
  function updateHUD() { ui.score.textContent = format(score); ui.speed.textContent = mode === 'ready' ? '0' : String(Math.round(speed()*.42)); }
  function update(dt) {
    elapsed += dt; const velocity = speed(); offset = (offset + velocity*dt)%100;
    distance += velocity*dt / 10; score = Math.floor(distance);
    const direction = Number(keyboard.right||touch.right)-Number(keyboard.left||touch.left);
    player.x = Math.max(road.left+player.w/2+6, Math.min(road.right-player.w/2-6, player.x+direction*310*dt));
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawn(); spawnTimer = Math.max(.68,1.18-elapsed*.008); }
    for (const car of traffic) {
      car.y += velocity*dt;
      if (collides(player,car)) { updateHUD(); crash(); return; }
    }
    traffic = traffic.filter(car=>car.y < H+100); updateHUD();
  }
  function roundedRect(x,y,w,h,r,color) { ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
  function drawCar(car, isPlayer=false) {
    const {x,y,w,h}=car, color=isPlayer?'#d2ff62':car.color;
    ctx.save(); ctx.translate(x,y);
    roundedRect(-w/2+4,-h/2+6,w,h,9,'#0008');
    roundedRect(-w/2-3,-h/2+14,8,17,2,'#080b0f'); roundedRect(w/2-5,-h/2+14,8,17,2,'#080b0f');
    roundedRect(-w/2-3,h/2-28,8,17,2,'#080b0f'); roundedRect(w/2-5,h/2-28,8,17,2,'#080b0f');
    roundedRect(-w/2,-h/2,w,h,8,color);
    roundedRect(-w/2+4,-h/2+7,w-8,16,4,'#ffffff22');
    roundedRect(-w/2+6,-h/2+26,w-12,17,3,'#18212d');
    roundedRect(-w/2+6,h/2-22,w-12,11,3,'#222d38');
    roundedRect(-w/2+3,-h/2+2,9,4,2,'#f5ffdc'); roundedRect(w/2-12,-h/2+2,9,4,2,'#f5ffdc');
    roundedRect(-w/2+3,h/2-6,8,3,1,'#ff3d62'); roundedRect(w/2-11,h/2-6,8,3,1,'#ff3d62');
    if (isPlayer) {
      ctx.fillStyle='#d2ff6208';ctx.beginPath();ctx.moveTo(-17,-h/2);ctx.lineTo(-43,-h/2-145);ctx.lineTo(43,-h/2-145);ctx.lineTo(17,-h/2);ctx.fill();
      roundedRect(-3,-h/2+8,6,13,1,'#17201755');
    }
    ctx.restore();
  }
  function draw() {
    ctx.fillStyle='#111a22'; ctx.fillRect(0,0,W,H);
    // Quiet city blocks beside the highway; no external image assets.
    for(let side=0;side<2;side++) for(let i=0;i<9;i++) {
      const x=side===0?8:378, y=(i*90+offset*.35)%810-90;
      roundedRect(x,y,34,60,3,'#1b2630');
      ctx.fillStyle=i%3===0?'#c5d89a38':'#70adbe20';ctx.fillRect(x+7,y+10,5,6);ctx.fillRect(x+22,y+30,5,6);
    }
    ctx.fillStyle='#252c35';ctx.fillRect(road.left,0,road.right-road.left,H);
    ctx.fillStyle='#29313a';ctx.fillRect(road.left+road.lane,0,road.lane,H);
    ctx.fillStyle='#d2ff6266'; ctx.fillRect(road.left-3,0,2,H);ctx.fillRect(road.right+1,0,2,H);
    ctx.fillStyle='#b3bfcb55';for(let lane=1;lane<3;lane++)for(let y=-100+offset;y<H;y+=100)ctx.fillRect(road.left+road.lane*lane-1,y,2,42);
    for(let y=-100+offset;y<H;y+=100){ctx.fillStyle='#93a1ad';ctx.fillRect(road.left-11,y,4,22);ctx.fillRect(road.right+7,y,4,22);}
    traffic.forEach(car=>drawCar(car)); drawCar(player,true);
    const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#080d1733');shade.addColorStop(.6,'#080d1700');shade.addColorStop(1,'#080d1740');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
  }
  function frame(time) { const dt = lastTime ? Math.min((time-lastTime)/1000,.04) : 0; lastTime=time; if(mode==='running')update(dt); draw(); requestAnimationFrame(frame); }
  ui.start.addEventListener('click',()=>mode==='paused'?pause():start()); ui.pause.addEventListener('click',pause);
  canvas.tabIndex=0;
  const keySide=key=>['ArrowLeft','a','A'].includes(key)?'left':['ArrowRight','d','D'].includes(key)?'right':null;
  window.addEventListener('keydown',event=>{
    const side=keySide(event.key);
    if(side){event.preventDefault();if(mode==='running')keyboard[side]=true;}
    if(['p','P',' '].includes(event.key) && ['running','paused'].includes(mode)) { event.preventDefault();if(!event.repeat)pause(); }
  });
  window.addEventListener('keyup',event=>{const side=keySide(event.key);if(side){event.preventDefault();keyboard[side]=false;}});
  for(const side of ['left','right']){
    const button=document.getElementById(side);
    button.addEventListener('pointerdown',event=>{event.preventDefault();if(mode==='running'){touch[side]=true;button.setPointerCapture(event.pointerId);}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>touch[side]=false);
  }
  window.addEventListener('blur',()=>{clearControls();if(mode==='running')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearControls();if(mode==='running')pause();}});
  requestAnimationFrame(frame);
})();
