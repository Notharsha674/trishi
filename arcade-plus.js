/* Bonus Arcade for Trishi: five fully local, replayable games.
   No analytics, no automatic submission, no external dependencies. */
(()=>{'use strict';
const root=document.getElementById('fun');if(!root)return;
const $=id=>document.getElementById(id);
const randint=max=>Math.floor(Math.random()*max);
const choose=items=>items[randint(items.length)];
const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randint(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const store={
  get(k){try{return Number(localStorage.getItem('trishi-arcade-'+k))||0}catch{return 0}},
  best(k,val){const previous=store.get(k);if(val>previous){try{localStorage.setItem('trishi-arcade-'+k,String(val))}catch{}}return Math.max(previous,val)}
};
const bestKeys=[
  ['2048 high score','2048'],['Sequence rounds','simon'],
  ['Typing WPM','typing'],['Math questions','math'],
  ['Emoji puzzles','emoji']
];
function scoreBoard(){
  $('arcade-records').replaceChildren();
  for(const [name,key] of bestKeys){
    const cell=document.createElement('div');cell.className='arcade-record';
    const label=document.createElement('span');label.textContent=name;
    const number=document.createElement('strong');number.textContent=store.get(key);
    cell.append(label,number);$('arcade-records').append(cell);
  }
}
scoreBoard();

// 2048 on a 4x4 grid: arrow keys when the board is focused, and touch buttons.
let tiles=[],sum2048=0,round2048=0;
function emptyIndices(b){return b.map((x,i)=>x===0?i:-1).filter(i=>i>=0)}
function spawn(b){const free=emptyIndices(b);if(!free.length)return; b[choose(free)]=Math.random()<0.9?2:4}
function start2048(){tiles=Array(16).fill(0);sum2048=0;round2048++;spawn(tiles);spawn(tiles);draw2048('Use the arrows or swipe to combine matching numbers.')}
function collapse2048(row){
  const nonzero=row.filter(Boolean),packed=[];let bonus=0;
  for(let i=0;i<nonzero.length;i++){
    if(nonzero[i]===nonzero[i+1]){packed.push(nonzero[i]*2);bonus+=nonzero[i]*2;i++}
    else packed.push(nonzero[i]);
  }
  while(packed.length<4)packed.push(0);
  return {packed,bonus};
}
function lineIndices(direction,index){
  const line=[];
  for(let j=0;j<4;j++){
    if(direction==='left')line.push(index*4+j);
    else if(direction==='right')line.push(index*4+(3-j));
    else if(direction==='up')line.push(j*4+index);
    else if(direction==='down')line.push((3-j)*4+index);
  }
  return line;
}
function hasMove(b){
  if(b.some(v=>v===0))return true;
  for(let i=0;i<16;i++){
    if(i%4!==3&&b[i]===b[i+1])return true;
    if(i<12&&b[i]===b[i+4])return true;
  }return false;
}
function draw2048(status){
  const grid=$('game2048-board');grid.replaceChildren();
  for(const value of tiles){
    const tile=document.createElement('div');tile.className='tile2048 tile2048-'+Math.min(2048,value);
    tile.textContent=value||'';grid.append(tile);
  }
  $('game2048-score').textContent='Score: '+sum2048;
  $('game2048-best').textContent='Best: '+store.get('2048');
  $('game2048-status').textContent=status||'';
  scoreBoard();
}
function move2048(direction){
  if(root.hidden||$('game2048-board').closest('[data-fun-panel]')?.hidden)return;
  if(!['left','right','up','down'].includes(direction))return;
  const next=tiles.slice();let bonus=0;
  for(let i=0;i<4;i++){
    const indices=lineIndices(direction,i);
    const out=collapse2048(indices.map(index=>tiles[index]));
    indices.forEach((index,j)=>{next[index]=out.packed[j]});
    bonus+=out.bonus;
  }
  if(next.every((v,i)=>v===tiles[i]))return;
  tiles=next;sum2048+=bonus;spawn(tiles);store.best('2048',sum2048);
  const max=Math.max(...tiles);
  draw2048(!hasMove(tiles)?'No moves left. Start a new game.':max>=2048?'2048 reached! Keep going if you want.':'Nice move.');
}
$('game2048-reset').addEventListener('click',start2048);
document.querySelectorAll('[data-2048-move]').forEach(button=>button.addEventListener('click',()=>move2048(button.dataset['2048Move'])));
$('game2048-board').addEventListener('keydown',e=>{
  const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];
  if(d){e.preventDefault();move2048(d)}
});
let startTouch=null;
$('game2048-board').addEventListener('touchstart',e=>{
  const touch=e.touches[0];startTouch={x:touch.clientX,y:touch.clientY};
},{passive:true});
$('game2048-board').addEventListener('touchend',e=>{
  if(!startTouch)return;
  const touch=e.changedTouches[0],dx=touch.clientX-startTouch.x,dy=touch.clientY-startTouch.y;
  startTouch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;
  move2048(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');
},{passive:true});
start2048();

// Sequence Recall: taps in the same order as coloured pads light up.
const pads=[...document.querySelectorAll('[data-simon]')];
let pattern=[],entered=0,simonActive=false,simonPreview=false,simonToken=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function simonMessage(text){$('simon-status').textContent=text}
function cancelSimon(){
  simonToken++;simonActive=false;simonPreview=false;pattern=[];
  pads.forEach(p=>p.classList.remove('lit'));
  $('simon-start').disabled=false;
}
async function previewSimon(token){
  simonPreview=true;simonMessage('Watch the pattern — round '+pattern.length);
  for(const digit of pattern){
    if(token!==simonToken||root.hidden)return;
    await sleep(330);
    if(token!==simonToken||root.hidden)return;
    pads[digit].classList.add('lit');
    await sleep(520);
    if(token!==simonToken||root.hidden)return;
    pads[digit].classList.remove('lit');
  }
  if(token!==simonToken||root.hidden)return;
  entered=0;simonPreview=false;simonActive=true;
  simonMessage('Your turn: repeat '+pattern.length+' tap'+(pattern.length>1?'s':'')+'.');
}
function nextSimon(){
  if(root.hidden)return;
  pattern.push(randint(4));const token=++simonToken;
  simonActive=false;void previewSimon(token);
}
$('simon-start').addEventListener('click',()=>{
  cancelSimon();$('simon-start').disabled=true;nextSimon();
});
pads.forEach((pad,index)=>pad.addEventListener('click',()=>{
  if(!simonActive||simonPreview)return;
  pad.classList.add('press');setTimeout(()=>pad.classList.remove('press'),160);
  if(pattern[entered]!==index){
    const rounds=pattern.length-1;store.best('simon',rounds);
    simonMessage('Not quite. Reached round '+pattern.length+'. Press Play again.');
    cancelSimon();scoreBoard();return;
  }
  entered++;
  if(entered===pattern.length){
    const completed=pattern.length;
    store.best('simon',completed);scoreBoard();simonActive=false;
    simonMessage('Correct! Round '+completed+' completed.');
    const token=simonToken;
    setTimeout(()=>{if(token===simonToken&&!root.hidden)nextSimon()},850);
  }else simonMessage('Good. '+(pattern.length-entered)+' more.');
}));
$('simon-best').textContent='Best: '+store.get('simon')+' rounds';

// Typing sprint: no upload of typed text; 30-second run, WPM and accuracy.
const sentences=[
  'Good friends make even ordinary days a little more interesting.',
  'A perfect plan is optional but good snacks are absolutely necessary.',
  'The best photos are often the ones nobody planned to take.',
  'Sometimes a simple conversation turns into a brilliant memory.',
  'A birthday website really should not have this many mini games.',
  'Take your time and enjoy the little things along the way.',
  'The playlist was good and the conversations were even better.'
];
let typingText='',typingRunning=false,typingStarted=0,typingInterval=null,typingDone=false;
function resetTyping(){
  if(typingInterval){clearInterval(typingInterval);typingInterval=null}
  typingText=choose(sentences);typingRunning=false;typingStarted=0;typingDone=false;
  $('typing-prompt').textContent=typingText;
  $('typing-input').value='';$('typing-input').disabled=false;
  $('typing-time').textContent='30.0s';
  $('typing-result').textContent='Type the text below. The clock starts when you type.';
  $('typing-input').maxLength=typingText.length+35;
  $('typing-best').textContent='Best: '+store.get('typing')+' WPM';
}
function typingResult(finish=false){
  if(typingDone)return;
  const typed=$('typing-input').value;
  let correct=0;for(let i=0;i<Math.min(typed.length,typingText.length);i++)if(typed[i]===typingText[i])correct++;
  const elapsed=typingRunning?Math.min(30,(performance.now()-typingStarted)/1000):0;
  const minutes=Math.max(elapsed,1)/60;
  const wpm=Math.round(correct/5/minutes);
  const accuracy=typed.length?Math.round(correct/typed.length*100):0;
  if(finish){
    typingDone=true;
    if(typingInterval){clearInterval(typingInterval);typingInterval=null}
    $('typing-input').disabled=true;
    store.best('typing',wpm);
    $('typing-best').textContent='Best: '+store.get('typing')+' WPM';
    $('typing-result').textContent='Finished: '+wpm+' WPM · '+accuracy+'% accuracy.';
    scoreBoard();
  }else $('typing-result').textContent=wpm+' WPM · '+accuracy+'% accuracy';
}
function typingTick(){
  if(!typingRunning||typingDone)return;
  const remaining=Math.max(0,30-(performance.now()-typingStarted)/1000);
  $('typing-time').textContent=remaining.toFixed(1)+'s';
  if(remaining<=0)typingResult(true);
}
$('typing-input').addEventListener('input',()=>{
  if(typingDone)return;
  if(!typingRunning){
    typingRunning=true;typingStarted=performance.now();
    typingInterval=setInterval(typingTick,100);
  }
  typingResult(false);
  if($('typing-input').value===typingText)typingResult(true);
});
$('typing-reset').addEventListener('click',()=>{resetTyping();$('typing-input').focus()});
resetTyping();

// Math round: 10 questions, no countdown; no pressure.
let mathRound=[],mathPos=0,mathScore=0,mathCompleted=false;
function makeMath(){
  const a=1+randint(25),b=1+randint(16);
  const operators=['+','−','×'],op=choose(operators);
  const answer=op==='+'?a+b:op==='−'?a-b:a*b;
  const wrongs=new Set();
  while(wrongs.size<3){
    const offset=(randint(13)+1)*(Math.random()<.5?-1:1);
    if(answer+offset!==answer)wrongs.add(answer+offset);
  }
  return {text:a+' '+op+' '+b+' = ?',answer,options:shuffle([answer,...wrongs])};
}
function mathDisplay(){
  if(mathPos>=mathRound.length){
    mathCompleted=true;
    $('math-question').textContent='Round complete.';
    $('math-status').textContent=mathScore+' / 10 correct. Press New round to replay.';
    $('math-options').replaceChildren();
    store.best('math',mathScore);scoreBoard();$('math-best').textContent='Best: '+store.get('math')+'/10';
    return;
  }
  const q=mathRound[mathPos];
  $('math-question').textContent=q.text;
  $('math-status').textContent='Question '+(mathPos+1)+' / 10 · '+mathScore+' correct';
  const target=$('math-options');target.replaceChildren();
  for(const answer of q.options){
    const btn=document.createElement('button');btn.type='button';btn.className='fun-secondary';
    btn.textContent=answer;
    btn.addEventListener('click',()=>{if(mathCompleted)return; if(answer===q.answer)mathScore++;mathPos++;mathDisplay()});
    target.append(btn);
  }
}
function mathReset(){mathRound=Array.from({length:10},makeMath);mathPos=0;mathScore=0;mathCompleted=false;mathDisplay()}
$('math-reset').addEventListener('click',mathReset);mathReset();
$('math-best').textContent='Best: '+store.get('math')+'/10';

// Emoji decoding, with multiple-choice options and no misleading factual claims.
const emojiPuzzles=[
  {emoji:'🍿🎥🌙',answer:'Movie night',alts:['Morning jog','Office meeting','Roadside tea']},
  {emoji:'🚗🗺️🎶',answer:'Road trip',alts:['Online shopping','Coffee break','Book club']},
  {emoji:'📸🕰️💭',answer:'Old memories',alts:['Phone update','Video call','Wake up early']},
  {emoji:'🎂🕯️🎉',answer:'Birthday party',alts:['Football match','Family breakfast','Bus ride']},
  {emoji:'☕🌧️📖',answer:'Rainy reading',alts:['Gym workout','Dance class','Beach party']},
  {emoji:'👟🎒✈️',answer:'Time to travel',alts:['Time for dinner','Online class','Late-night movie']},
  {emoji:'🎧🎵🔁',answer:'Song on repeat',alts:['Music concert','Phone charging','Radio silence']},
  {emoji:'🍜🔥😋',answer:'Spicy noodles',alts:['Cold ice cream','Fruit salad','Breakfast cereal']},
  {emoji:'📱😂💬',answer:'Funny group chat',alts:['Lost phone','Morning alarm','Shopping list']},
  {emoji:'🌞🏖️🕶️',answer:'Beach day',alts:['Rainy evening','Cold winter','Library visit']}
];
let emojis=shuffle(emojiPuzzles),emojiPos=0,emojiScore=0,emojiFinished=false;
function showEmoji(){
  const p=$('emoji-prompt'),opts=$('emoji-options');
  opts.replaceChildren();
  if(emojiPos>=emojis.length){
    emojiFinished=true;p.textContent='Done!';
    $('emoji-status').textContent=emojiScore+' / '+emojis.length+' correct. New round?';
    store.best('emoji',emojiScore);$('emoji-best').textContent='Best: '+store.get('emoji')+'/10';scoreBoard();return;
  }
  const q=emojis[emojiPos];p.textContent=q.emoji;
  $('emoji-status').textContent='Puzzle '+(emojiPos+1)+' / '+emojis.length+' · '+emojiScore+' correct';
  shuffle([q.answer,...q.alts]).forEach(value=>{
    const btn=document.createElement('button');btn.type='button';btn.className='fun-secondary';btn.textContent=value;
    btn.addEventListener('click',()=>{if(emojiFinished)return;if(value===q.answer)emojiScore++;emojiPos++;showEmoji()});
    opts.append(btn);
  });
}
$('emoji-reset').addEventListener('click',()=>{
  emojis=shuffle(emojiPuzzles);emojiPos=0;emojiScore=0;emojiFinished=false;showEmoji();
});
showEmoji();$('emoji-best').textContent='Best: '+store.get('emoji')+'/10';

// Pause timers and preview sequences when leaving the fun zone.
const cleanup=()=>{
  if(!root.hidden)return;
  cancelSimon();
  if(typingInterval){clearInterval(typingInterval);typingInterval=null}
  if(typingRunning&&!typingDone)typingResult(true);
};
new MutationObserver(cleanup).observe(root,{attributes:true,attributeFilter:['hidden']});
document.querySelectorAll('[data-fun-tab]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.funTab!=='games'){cancelSimon();if(typingRunning&&!typingDone)typingResult(true)}
}));
})();
