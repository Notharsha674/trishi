/* Trishi / Ash: fun zone interactions.
   No external dependencies; state stays in this browser only. */
(function(){
'use strict';
const root=document.getElementById('fun');
if(!root)return;
const el=id=>document.getElementById(id);
const storage={
  get(key){try{return localStorage.getItem('ash-trishi-'+key)}catch(e){return null}},
  set(key,value){try{localStorage.setItem('ash-trishi-'+key,value)}catch(e){}},
  remove(key){try{localStorage.removeItem('ash-trishi-'+key)}catch(e){}}
};
const random=arr=>arr[Math.floor(Math.random()*arr.length)];
const shuffle=arr=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const birthdayAudioEl=document.getElementById('birthday-audio');
let currentTab='games';
let slideTimer=null,tapTimer=null;
function tab(name){
  currentTab=name;
  root.querySelectorAll('[data-fun-tab]').forEach(button=>{
    const active=button.dataset.funTab===name;
    button.setAttribute('aria-selected',String(active));
    button.classList.toggle('selected',active);
  });
  root.querySelectorAll('[data-fun-panel]').forEach(panel=>{panel.hidden=panel.dataset.funPanel!==name});
  if(name!=='photos')stopSlides();
  if(name==='extras')requestAnimationFrame(sizeScratch);
  el('fun-body').scrollTop=0;
}
root.querySelectorAll('[data-fun-tab]').forEach(button=>button.addEventListener('click',()=>tab(button.dataset.funTab)));
tab('games');

// Flip and match: six pairs, twelve tiles, keyboard-friendly.
const matchIcons=['🍕','🎂','📸','🎬','🎮','☕'];
let matchFirst=null,matchLock=false,matchMoves=0,matched=0,matchVersion=0;
function newMatch(){
  matchVersion++;matchFirst=null;matchLock=false;matchMoves=0;matched=0;
  el('match-status').textContent='0 matches · 0 moves';
  const board=el('match-board');board.replaceChildren();
  shuffle(matchIcons.concat(matchIcons)).forEach(icon=>{
    const b=document.createElement('button');b.type='button';b.className='match-tile';
    b.dataset.symbol=icon;b.textContent='?';b.setAttribute('aria-label','Hidden match card');
    b.addEventListener('click',()=>flip(b));
    board.appendChild(b);
  });
}
function flip(b){
  if(matchLock||b.classList.contains('flipped')||b.classList.contains('matched'))return;
  b.textContent=b.dataset.symbol;b.classList.add('flipped');
  b.setAttribute('aria-label',b.dataset.symbol);
  if(!matchFirst){matchFirst=b;return}
  matchMoves++;
  const first=matchFirst;matchFirst=null;
  if(first.dataset.symbol===b.dataset.symbol){
    first.classList.add('matched');b.classList.add('matched');matched++;
    el('match-status').textContent=matched+' / 6 pairs · '+matchMoves+' moves';
    if(matched===6){
      el('match-status').textContent='All matched in '+matchMoves+' moves. Nice!';
      if(typeof launchConfetti==='function')launchConfetti();
    }
  }else{
    matchLock=true;
    const version=matchVersion;
    window.setTimeout(()=>{
      if(version!==matchVersion)return;
      [first,b].forEach(tile=>{tile.textContent='?';tile.classList.remove('flipped');tile.setAttribute('aria-label','Hidden match card')});
      matchLock=false;
    },680);
    el('match-status').textContent=matched+' / 6 pairs · '+matchMoves+' moves';
  }
}
el('match-reset').addEventListener('click',newMatch);
newMatch();

// Ten-second tap challenge, local personal best.
let taps=0,tapEnd=0;
const tapBtn=el('tap-target');
const tapBest=Number(storage.get('tap-best'))||0;
el('tap-best').textContent='Best: '+tapBest;
function positionTap(){
  const arena=el('tap-arena');
  const x=Math.max(0,arena.clientWidth-tapBtn.offsetWidth-10);
  const y=Math.max(0,arena.clientHeight-tapBtn.offsetHeight-10);
  tapBtn.style.left=Math.round(5+Math.random()*x)+'px';
  tapBtn.style.top=Math.round(5+Math.random()*y)+'px';
}
function endTap(){
  if(tapTimer!==null){clearInterval(tapTimer);tapTimer=null}
  tapBtn.disabled=true;el('tap-start').disabled=false;
  el('tap-time').textContent='0.0s';
  let best=Number(storage.get('tap-best'))||0;
  if(taps>best){best=taps;storage.set('tap-best',String(taps));el('tap-best').textContent='Best: '+best}
  el('tap-score').textContent=taps+' taps · '+(taps>=best&&taps>0?'new best or tied!':'round complete');
}
function updateTap(){
  const left=Math.max(0,(tapEnd-performance.now())/1000);
  el('tap-time').textContent=left.toFixed(1)+'s';
  if(left<=0)endTap();
}
el('tap-start').addEventListener('click',()=>{
  if(tapTimer!==null)return;
  taps=0;tapBtn.disabled=false;el('tap-start').disabled=true;
  el('tap-score').textContent='Taps: 0';tapEnd=performance.now()+10000;
  positionTap();updateTap();tapTimer=window.setInterval(updateTap,90);tapBtn.focus();
});
tapBtn.addEventListener('click',()=>{
  if(tapTimer===null)return;
  if(performance.now()>=tapEnd){endTap();return}
  taps++;el('tap-score').textContent='Taps: '+taps;positionTap();
});

// This or that, no weird fact claims about Trishi.
const choices=[
  ['Movie night','Long drive'],['Pizza','Biryani'],['Beach','Mountains'],
  ['Spontaneous plans','Proper itinerary'],['Late-night chats','Early mornings'],
  ['Comedy','Thriller'],['Coffee','Iced tea'],['Photos','No photos, please']
];
let choiceIndex=0,choiceAnswers=[];
function showChoice(){
  const done=choiceIndex>=choices.length;
  el('choice-a').hidden=done;el('choice-b').hidden=done;
  el('choice-next').hidden=!done;
  if(done){
    el('choice-prompt').textContent='Done. You picked '+choiceAnswers.length+' options.';
    el('choice-progress').textContent=choiceAnswers.slice(-4).join(' · ');
  }else{
    el('choice-prompt').textContent='Pick one ('+(choiceIndex+1)+'/'+choices.length+')';
    el('choice-a').textContent=choices[choiceIndex][0];
    el('choice-b').textContent=choices[choiceIndex][1];
    el('choice-progress').textContent='No wrong answers.';
  }
}
['choice-a','choice-b'].forEach((id,i)=>el(id).addEventListener('click',()=>{
  if(choiceIndex>=choices.length)return;
  choiceAnswers.push(choices[choiceIndex][i]);choiceIndex++;showChoice();
}));
el('choice-next').addEventListener('click',()=>{choiceIndex=0;choiceAnswers=[];showChoice()});
showChoice();

// Low-stakes choices with one question at a time.
const wouldYouRather=[
  ['Have unlimited snacks','Have unlimited movie tickets'],
  ['Travel somewhere new','Repeat your favourite holiday'],
  ['Lose Wi-Fi for a day','Lose music for a day'],
  ['Only send voice notes','Only send long texts'],
  ['Always be 10 minutes early','Always be 10 minutes late'],
  ['Get a surprise trip','Get a surprise concert ticket'],
  ['Take 100 photos','Take just one perfect photo'],
  ['Choose the restaurant','Choose the playlist']
];
let wyrIndex=0,wyrPicked=0;
function showWyr(){
  const question=wouldYouRather[wyrIndex%wouldYouRather.length];
  el('wyr-count').textContent=(wyrIndex%wouldYouRather.length+1)+' / '+wouldYouRather.length;
  el('wyr-a').textContent=question[0];el('wyr-b').textContent=question[1];
  el('wyr-result').textContent='Choose one.';
  el('wyr-next').disabled=true;el('wyr-a').disabled=false;el('wyr-b').disabled=false;
}
['wyr-a','wyr-b'].forEach((id,i)=>el(id).addEventListener('click',()=>{
  const choice=wouldYouRather[wyrIndex%wouldYouRather.length][i];
  el('wyr-result').textContent='Noted: '+choice+'. Interesting choice.';
  el('wyr-a').disabled=true;el('wyr-b').disabled=true;el('wyr-next').disabled=false;wyrPicked++;
}));
el('wyr-next').addEventListener('click',()=>{wyrIndex++;showWyr()});showWyr();

// Friendly roasts, hype and random predictions.
const roasts=[
  'Tera "2 minute" ka matlab kaunsa time zone hota hai?',
  'Tu argument jeetne se pehle hi winner speech ready kar leti hai.',
  'Tere phone ki battery se zyada fast tera topic change hota hai.',
  'Tu 5-minute story ko full web series bana deti hai.',
  'Aaj birthday hai. Isliye teri overthinking temporarily free hai.',
  'Tu reply kare toh notification ko national holiday declare kar dein?',
  'Itna attitude? EMI pe liya tha kya?',
  'Tujhe roast karna easy hai. Material tu khud deti hai.',
  'BKL, teri punctuality ek unsolved mystery hai.',
  'Tu "main bas ek cheez bolungi" bolke 40-minute speech de deti hai.'
];
const hypes=[
  'Teri conversations kabhi boring nahi hoti. That is a skill.',
  'Tu apni baat clearly bolti hai. Respect.',
  'Good humour and good timing? Rare combo.',
  'Tere plans actually fun ho sakte hain. Usually.',
  'Being a reliable friend is underrated. Keep that.',
  'Tu funny hai. Bas zyada hawa mein mat ud.',
  'Tujhe interesting moments notice karna aata hai.',
  'Tu naye things try karti rahe. Nice things happen that way.'
];
const fortunes=[
  'Forecast: a very decent week and one excellent snack.',
  'A plan you thought would fail might actually work.',
  'Your next photo will be worth keeping.',
  'Someone will send a meme at exactly the right time.',
  'The next good idea may come during a boring afternoon.',
  'Future you says: keep the receipts and the screenshots.',
  'A conversation will turn into a very funny story.',
  'Unexpected good news? Possible. Unexpected hunger? Certain.',
  'Your to-do list may finally start behaving.',
  'You will win one argument. Probably with yourself.'
];
function rotateText(id,arr){el(id).textContent=random(arr)}
el('roast-go').addEventListener('click',()=>rotateText('roast-output',roasts));
el('hype-go').addEventListener('click',()=>rotateText('hype-output',hypes));
el('fortune-go').addEventListener('click',()=>rotateText('fortune-output',fortunes));

// Memory slideshow reuses existing public gallery photos and preloads the next photo.
const photoPaths=(typeof memoryPhotos!=='undefined')?memoryPhotos:[
  'assets/memory1.jpg','assets/memory2.jpg','assets/memory3.jpg'
];
const photoCaptions=(typeof memoryNames!=='undefined')?memoryNames:[];
let slideIndex=0;
function showSlide(){
  const image=el('slide-image'),caption=el('slide-caption');
  image.src=photoPaths[slideIndex];
  image.alt='Memory photo '+(slideIndex+1);
  caption.textContent=(photoCaptions[slideIndex]||'Photo')+' · '+(slideIndex+1)+' / '+photoPaths.length;
  const preload=new Image();preload.src=photoPaths[(slideIndex+1)%photoPaths.length];
}
function slide(delta){slideIndex=(slideIndex+delta+photoPaths.length)%photoPaths.length;showSlide()}
function stopSlides(){
  if(slideTimer!==null)clearInterval(slideTimer);
  slideTimer=null;el('slide-auto').textContent='▶ Auto';
  el('slide-auto').setAttribute('aria-pressed','false');
}
el('slide-prev').addEventListener('click',()=>slide(-1));
el('slide-next').addEventListener('click',()=>slide(1));
el('slide-random').addEventListener('click',()=>{slideIndex=Math.floor(Math.random()*photoPaths.length);showSlide()});
el('slide-auto').addEventListener('click',()=>{
  if(slideTimer!==null){stopSlides();return}
  slideTimer=setInterval(()=>slide(1),3200);
  el('slide-auto').textContent='⏸ Stop';
  el('slide-auto').setAttribute('aria-pressed','true');
});
showSlide();

// Scratch card, including a no-canvas and keyboard-friendly Reveal button.
const canvas=el('scratch-canvas'),ctx=canvas.getContext('2d');
const scratchHost=el('scratch-host');
let scratching=false,scratchCount=0,scratchRevealed=false;
function sizeScratch(){
  if(!ctx||currentTab!=='extras'||root.hidden)return;
  const rect=canvas.getBoundingClientRect();
  if(rect.width<10)return;
  const ratio=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(rect.width*ratio);
  canvas.height=Math.round(rect.height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#d5b8a9';ctx.fillRect(0,0,rect.width,rect.height);
  ctx.fillStyle='#874d46';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 21px Arial';ctx.fillText('SCRATCH HERE',rect.width/2,rect.height/2);
  scratchCount=0;scratchRevealed=false;canvas.style.display='block';
  scratchHost.classList.remove('revealed');
}
function scratchAt(e){
  if(!ctx||scratchRevealed)return;
  const r=canvas.getBoundingClientRect();
  ctx.globalCompositeOperation='destination-out';
  ctx.beginPath();ctx.arc(e.clientX-r.left,e.clientY-r.top,19,0,Math.PI*2);ctx.fill();
  scratchCount++;
  if(scratchCount>30)revealScratch();
}
function revealScratch(){
  scratchRevealed=true;canvas.style.display='none';
  scratchHost.classList.add('revealed');
}
canvas.addEventListener('pointerdown',e=>{
  scratching=true;canvas.setPointerCapture(e.pointerId);scratchAt(e);e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{if(scratching){scratchAt(e);e.preventDefault()}});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>canvas.addEventListener(ev,()=>{scratching=false}));
el('scratch-reveal').addEventListener('click',revealScratch);
el('scratch-reset').addEventListener('click',sizeScratch);
window.addEventListener('resize',()=>{if(currentTab==='extras')sizeScratch()});

// Note to self: saved only in this device's browser, never sent to Ash.
const wishText=el('wish-text'),wishStatus=el('wish-status-local');
wishText.value=storage.get('wish-note')||'';
el('wish-save').addEventListener('click',()=>{
  storage.set('wish-note',wishText.value.slice(0,240));
  wishStatus.textContent='Saved on this device.';
});
el('wish-clear').addEventListener('click',()=>{
  wishText.value='';storage.remove('wish-note');wishStatus.textContent='Cleared.';
});

// Choose a low-stakes birthday plan, purely for fun.
const plans={
  food:'Food plan chosen. Priorities: tasty food, zero arguments over the menu.',
  movie:'Movie plan chosen. Remember to agree on a genre this time.',
  chill:'Chill plan chosen. No schedule. Sounds good.',
  outing:'Outing chosen. Water, headphones, phone charge — done.'
};
root.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{
  el('plan-output').textContent=plans[b.dataset.plan];
  root.querySelectorAll('[data-plan]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
}));

// A local-only rating. Never sends ratings or personal data anywhere.
const ratingButtons=Array.from(root.querySelectorAll('[data-rate]'));
function showRating(value){
  ratingButtons.forEach(b=>{const n=Number(b.dataset.rate);b.setAttribute('aria-pressed',String(n<=value && value>0));b.setAttribute('aria-label',n+' out of 5 stars');});
  el('rating-output').textContent=value?value+' / 5 saved on this device. Thanks!':'Pick a rating.';
}
ratingButtons.forEach(b=>b.addEventListener('click',()=>{
  storage.set('rating',b.dataset.rate);showRating(Number(b.dataset.rate));
}));
showRating(Number(storage.get('rating'))||0);

// Song scrubbing, while the small persistent player remains in place.
function stamp(seconds){
  if(!Number.isFinite(seconds))return '0:00';
  return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
}
const seek=el('song-seek');
function updateSeek(){
  if(!birthdayAudioEl)return;
  const duration=birthdayAudioEl.duration;
  const pos=birthdayAudioEl.currentTime;
  seek.disabled=!(Number.isFinite(duration)&&duration>0);
  if(!seek.matches(':active')&&seek.disabled===false){
    seek.value=String(Math.round(pos/duration*1000));
  }
  el('song-time').textContent=stamp(pos)+' / '+stamp(duration);
}
seek.addEventListener('input',()=>{
  if(!birthdayAudioEl||!Number.isFinite(birthdayAudioEl.duration))return;
  birthdayAudioEl.currentTime=Number(seek.value)/1000*birthdayAudioEl.duration;
  updateSeek();
});
if(birthdayAudioEl){
  ['timeupdate','loadedmetadata','durationchange','seeked'].forEach(ev=>birthdayAudioEl.addEventListener(ev,updateSeek));
}
updateSeek();

// Friendly share button: copies the GitHub Pages URL when available.
el('copy-link').addEventListener('click',async()=>{
  const button=el('copy-link');
  const url=location.protocol==='file:'?'https://notharsha674.github.io/trishi/':location.href;
  try{
    await navigator.clipboard.writeText(url);button.textContent='Link copied!';
  }catch(e){
    button.textContent='Copy from browser address bar';
  }
  setTimeout(()=>{button.textContent='Copy website link';},2200);
});
el('confetti-button').addEventListener('click',()=>{
  if(typeof launchConfetti==='function')launchConfetti();
});

// A small Shinchan easter egg, not a fake floating PNG.
let shinchanTaps=0,toastTimer=null;
document.querySelectorAll('img.character').forEach(image=>{
  image.title='Tap Shinchan five times';
  image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-label','Shinchan easter egg');
  function tap(){
    shinchanTaps++;
    if(shinchanTaps>=5){
      shinchanTaps=0;el('fun-toast').textContent='Shinchan says: happy birthday, Trishi. Now cake kahan hai?';
      el('fun-toast').hidden=false;
      if(typeof launchConfetti==='function')launchConfetti();
      if(toastTimer)clearTimeout(toastTimer);
      toastTimer=setTimeout(()=>{el('fun-toast').hidden=true},4200);
    }
  }
  image.addEventListener('click',tap);
  image.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tap()}});
});

// Stop timers when leaving the fun zone; keep the rest of the site responsive.
const observer=new MutationObserver(()=>{
  if(root.hidden){
    stopSlides();
    if(tapTimer!==null)endTap();
  }
});
observer.observe(root,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('keydown',e=>{
  if(e.key==='?'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
    if(typeof goTo==='function')goTo('fun');
  }
});
})();
