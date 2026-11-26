/* Extra mini-games for Trishi's birthday.
   Entirely client-side, no tracking, no external libraries. */
(() => {
  'use strict';
  const page=document.getElementById('fun');
  if(!page)return;
  const $=id=>document.getElementById(id);
  const randomInt=max=>Math.floor(Math.random()*max);
  const pick=items=>items[randomInt(items.length)];
  const saved={
    read(key){try{return localStorage.getItem('trishi-minigames-'+key)}catch(e){return null}},
    write(key,val){try{localStorage.setItem('trishi-minigames-'+key,String(val))}catch(e){}}
  };
  const best=(key,value,label)=>{
    let old=Number(saved.read(key))||0;
    if(value>old){old=value;saved.write(key,old)}
    $(label).textContent='Best: '+old;
  };

  // ROCK PAPER SCISSORS
  let rpsWins=0,rpsLosses=0,rpsTies=0;
  const beats={rock:'scissors',paper:'rock',scissors:'paper'};
  const names={rock:'Rock ✊',paper:'Paper ✋',scissors:'Scissors ✌️'};
  function showRpsScore(){
    $('rps-score').textContent='You '+rpsWins+' · Computer '+rpsLosses+' · Ties '+rpsTies;
  }
  document.querySelectorAll('[data-rps]').forEach(button=>button.addEventListener('click',()=>{
    const you=button.dataset.rps,computer=pick(Object.keys(beats));
    let result;
    if(you===computer){rpsTies++;result='Tie.';}
    else if(beats[you]===computer){rpsWins++;result='You win!';}
    else{rpsLosses++;result='Computer wins.';}
    $('rps-result').textContent=names[you]+' vs '+names[computer]+'. '+result;
    showRpsScore();
  }));
  $('rps-reset').addEventListener('click',()=>{
    rpsWins=0;rpsLosses=0;rpsTies=0;showRpsScore();$('rps-result').textContent='Choose rock, paper or scissors.';
  });
  showRpsScore();

  // TIC TAC TOE: a fair computer opponent that can win, block, or pick a free square.
  const tttBoard=$('ttt-board');
  const winLines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let cells=[],tttFinished=false,tttRounds={you:0,cpu:0,draw:0};
  function winner(board,symbol){return winLines.some(line=>line.every(pos=>board[pos]===symbol))}
  function tttMoveOptions(board){return board.map((v,i)=>v===''?i:null).filter(x=>x!==null)}
  function cpuChoice(board){
    const open=tttMoveOptions(board);
    for(const symbol of ['O','X']){
      for(const pos of open){
        const trial=board.slice();trial[pos]=symbol;
        if(winner(trial,symbol))return pos;
      }
    }
    if(open.includes(4))return 4;
    const corners=open.filter(i=>[0,2,6,8].includes(i));
    return pick(corners.length?corners:open);
  }
  function finishTtt(message,key){
    tttFinished=true;
    $('ttt-result').textContent=message;
    if(key)tttRounds[key]++;
    $('ttt-score').textContent='You '+tttRounds.you+' · CPU '+tttRounds.cpu+' · Draw '+tttRounds.draw;
    tttBoard.querySelectorAll('button').forEach(b=>b.disabled=true);
  }
  function paintTtt(){
    tttBoard.querySelectorAll('button').forEach((b,i)=>{
      b.textContent=cells[i]||' ';
      b.disabled=tttFinished||Boolean(cells[i]);
      b.setAttribute('aria-label','Square '+(i+1)+': '+(cells[i]||'empty'));
    });
  }
  function playTtt(i){
    if(tttFinished||cells[i])return;
    cells[i]='X';
    if(winner(cells,'X')){finishTtt('You won this round!','you');paintTtt();return}
    let open=tttMoveOptions(cells);
    if(!open.length){finishTtt('Draw.','draw');paintTtt();return}
    cells[cpuChoice(cells)]='O';
    if(winner(cells,'O')){finishTtt('Computer won. Try again.','cpu');paintTtt();return}
    open=tttMoveOptions(cells);
    if(!open.length){finishTtt('Draw.','draw');paintTtt();return}
    $('ttt-result').textContent='Your turn (X).';
    paintTtt();
  }
  for(let i=0;i<9;i++){
    const b=document.createElement('button');b.type='button';b.className='ttt-cell';
    b.addEventListener('click',()=>playTtt(i));tttBoard.appendChild(b);
  }
  function newTtt(){cells=Array(9).fill('');tttFinished=false;$('ttt-result').textContent='Your turn (X).';paintTtt()}
  $('ttt-reset').addEventListener('click',newTtt);
  newTtt();

  // GUESS THE NUMBER: 1–50, seven tries, with hints.
  let secretNumber=1,numberTries=0,numberDone=false;
  function newNumber(){
    secretNumber=1+randomInt(50);numberTries=0;numberDone=false;
    $('number-input').value='';
    $('number-input').disabled=false;
    $('number-submit').disabled=false;
    $('number-result').textContent='Guess a number from 1 to 50. You have 7 attempts.';
    $('number-history').textContent='';
  }
  function guessNumber(e){
    e.preventDefault();if(numberDone)return;
    const val=Number($('number-input').value);
    if(!Number.isInteger(val)||val<1||val>50){$('number-result').textContent='Enter a whole number between 1 and 50.';return}
    numberTries++;
    $('number-history').textContent+=($('number-history').textContent?' · ':'')+val;
    if(val===secretNumber){
      numberDone=true;
      $('number-result').textContent='Correct! '+numberTries+' attempt'+(numberTries===1?'':'s')+'.';
      if(typeof launchConfetti==='function')launchConfetti();
    }else if(numberTries>=7){
      numberDone=true;$('number-result').textContent='Out of tries. It was '+secretNumber+'.';
    }else{
      $('number-result').textContent=(val<secretNumber?'Higher ↑':'Lower ↓')+' · '+(7-numberTries)+' tries left.';
    }
    $('number-input').value='';
    if(numberDone){$('number-input').disabled=true;$('number-submit').disabled=true}
  }
  $('number-form').addEventListener('submit',guessNumber);
  $('number-reset').addEventListener('click',newNumber);
  newNumber();

  // WORD SCRAMBLE: genuine input/check/skip/hint/score.
  const wordList=[
    ['CAMERA','Used to take photos'],
    ['BIRTHDAY','An annual celebration'],
    ['PLAYLIST','A collection of songs'],
    ['BIRYANI','A popular rice dish'],
    ['FRIEND','Someone you can count on'],
    ['PUZZLE','A problem made for solving'],
    ['MOVIE','Something you watch on a screen'],
    ['COFFEE','Popular caffeinated drink'],
    ['TRAVEL','Go to a different place'],
    ['MEMORY','Something you remember'],
    ['SUNDAY','The day before Monday'],
    ['PARTY','A celebration with people']
  ];
  let wordDeck=[],wordIndex=0,wordScore=0,wordHinted=false;
  function scrambleWord(word){
    let arr=word.split(''),attempt=0;
    do{
      for(let i=arr.length-1;i>0;i--){const j=randomInt(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
      attempt++;
    }while(arr.join('')===word&&attempt<15);
    if(arr.join('')===word)arr.reverse();
    return arr.join(' ');
  }
  function showWord(){
    $('word-input').value='';
    if(wordIndex>=wordDeck.length){
      $('word-display').textContent='DONE!';
      $('word-result').textContent='Final score: '+wordScore+' / '+wordDeck.length+'. Press New Game to play again.';
      $('word-hint-text').textContent='';
      $('word-check').disabled=true;$('word-input').disabled=true;$('word-skip').disabled=true;$('word-hint').disabled=true;return;
    }
    $('word-check').disabled=false;$('word-input').disabled=false;$('word-skip').disabled=false;$('word-hint').disabled=false;
    $('word-display').textContent=scrambleWord(wordDeck[wordIndex][0]);
    $('word-progress').textContent=(wordIndex+1)+' / '+wordDeck.length+' · Score '+wordScore;
    $('word-result').textContent='Unscramble the letters.';
    $('word-hint-text').textContent='';
    wordHinted=false;
  }
  function wordSubmit(e){
    e.preventDefault();
    if(wordIndex>=wordDeck.length)return;
    const guess=$('word-input').value.trim().toUpperCase().replace(/\s/g,'');
    if(!guess){$('word-result').textContent='Type an answer first.';return}
    if(guess!==wordDeck[wordIndex][0]){$('word-result').textContent='Not quite. Try again.';return}
    wordScore++;
    wordIndex++;showWord();
    if(wordIndex<wordDeck.length)$('word-result').textContent='Correct! Next word.';
  }
  $('word-form').addEventListener('submit',wordSubmit);
  $('word-hint').addEventListener('click',()=>{
    if(wordIndex>=wordDeck.length)return;
    $('word-hint-text').textContent='Hint: '+wordDeck[wordIndex][1];
    wordHinted=true;
  });
  $('word-skip').addEventListener('click',()=>{
    if(wordIndex>=wordDeck.length)return;
    const old=wordDeck[wordIndex][0];
    wordIndex++;showWord();
    if(wordIndex<wordDeck.length)$('word-result').textContent='Skipped '+old+'. Next word.';
  });
  $('word-reset').addEventListener('click',()=>{
    wordDeck=wordList.slice();
    // shuffle without needing global state from other scripts
    for(let i=wordDeck.length-1;i>0;i--){const j=randomInt(i+1);[wordDeck[i],wordDeck[j]]=[wordDeck[j],wordDeck[i]]}
    wordIndex=0;wordScore=0;showWord();
  });
  $('word-reset').click();

  // REACTION SPEED: click before green = too early. Lowest milliseconds wins.
  let reactionState='idle',reactionTimeout=null,reactionStart=0;
  const reactionPad=$('reaction-pad');
  function reactionReset(){
    if(reactionTimeout!==null){clearTimeout(reactionTimeout);reactionTimeout=null}
    reactionState='idle';
    reactionPad.className='reaction-pad';
    reactionPad.textContent='Start reaction test';
    $('reaction-result').textContent='Wait for green, then tap as fast as you can.';
  }
  function reactionTap(){
    if(reactionState==='idle'||reactionState==='done'){
      reactionReset();
      reactionState='waiting';reactionPad.classList.add('waiting');
      reactionPad.textContent='WAIT...';
      reactionTimeout=window.setTimeout(()=>{
        reactionTimeout=null;
        if(reactionState!=='waiting')return;
        reactionState='ready';reactionPad.className='reaction-pad ready';
        reactionPad.textContent='TAP NOW!';
        reactionStart=performance.now();
      },1200+randomInt(2600));
    }else if(reactionState==='waiting'){
      clearTimeout(reactionTimeout);reactionTimeout=null;
      reactionState='done';reactionPad.className='reaction-pad too-soon';
      reactionPad.textContent='Too early! Try again';
      $('reaction-result').textContent='You tapped before green. Tap the pad to retry.';
    }else if(reactionState==='ready'){
      const ms=Math.round(performance.now()-reactionStart);
      reactionState='done';reactionPad.className='reaction-pad result';
      reactionPad.textContent='Try again';
      $('reaction-result').textContent=ms+' ms. '+(ms<250?'Quick reaction.':ms<400?'Nice.':'You can beat that.');
      const old=Number(saved.read('reaction-best'))||Infinity;
      if(ms<old)saved.write('reaction-best',ms);
      $('reaction-best').textContent='Best: '+(Number(saved.read('reaction-best'))||ms)+' ms';
    }
  }
  reactionPad.addEventListener('click',reactionTap);
  reactionReset();
  const initialReaction=Number(saved.read('reaction-best'));
  $('reaction-best').textContent=initialReaction?'Best: '+initialReaction+' ms':'Best: —';

  // WHACK-A-CAKE: 20s, target moves, personal best persists on device.
  const whackBoard=$('whack-board');
  let whackRunning=false,whackEnd=0,whackTarget=-1,whackScore=0,whackTicker=null;
  const whackTiles=[];
  for(let i=0;i<9;i++){
    const b=document.createElement('button');b.type='button';b.className='whack-tile';
    b.setAttribute('aria-label','Empty square '+(i+1));b.textContent='·';
    b.addEventListener('click',()=>{
      if(!whackRunning||i!==whackTarget)return;
      whackScore++;
      $('whack-score').textContent='Score: '+whackScore;
      drawWhack();
    });
    whackBoard.appendChild(b);whackTiles.push(b);
  }
  function drawWhack(){
    const old=whackTarget;
    do{whackTarget=randomInt(9)}while(whackTarget===old);
    whackTiles.forEach((b,i)=>{
      const active=i===whackTarget;
      b.textContent=active?'🍰':'·';
      b.classList.toggle('target',active);
      b.setAttribute('aria-label',active?'Tap the cake':'Empty');
    });
  }
  function stopWhack(finished){
    if(whackTicker!==null){clearInterval(whackTicker);whackTicker=null}
    whackRunning=false;whackTarget=-1;
    whackTiles.forEach(b=>{b.classList.remove('target');b.textContent='·'});
    $('whack-start').disabled=false;
    if(finished){
      $('whack-result').textContent='Round over: '+whackScore+' points.';
      best('whack-best',whackScore,'whack-best');
    }else $('whack-result').textContent='Tap Start to play.';
    $('whack-time').textContent='20s';
  }
  function whackTick(){
    if(!whackRunning)return;
    let left=Math.max(0,(whackEnd-performance.now())/1000);
    $('whack-time').textContent=left.toFixed(1)+'s';
    if(left<=0){stopWhack(true);return}
    drawWhack();
  }
  $('whack-start').addEventListener('click',()=>{
    if(whackRunning)return;
    whackRunning=true;whackScore=0;
    $('whack-score').textContent='Score: 0';
    $('whack-result').textContent='Catch the cake!';
    $('whack-start').disabled=true;
    whackEnd=performance.now()+20000;
    whackTick();whackTicker=setInterval(whackTick,660);
  });
  $('whack-best').textContent='Best: '+(Number(saved.read('whack-best'))||0);
  stopWhack(false);

  // Avoid running hidden game timers when navigating away from Fun Zone.
  const funScene=document.getElementById('fun');
  const cleanup=()=>{
    if(reactionState==='waiting'||reactionState==='ready')reactionReset();
    if(whackRunning)stopWhack(false);
  };
  document.querySelectorAll('[data-fun-tab]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.funTab!=='games')cleanup();
  }));
  const watcher=new MutationObserver(()=>{if(funScene.hidden)cleanup()});
  watcher.observe(funScene,{attributes:true,attributeFilter:['hidden']});


  // Game picker: jump to a real board, instead of making visitors scroll through every card.
  const gameScroller=document.getElementById('fun-body');
  document.querySelectorAll('[data-game-jump]').forEach(button=>{
    button.addEventListener('click',()=>{
      const target=document.getElementById(button.dataset.gameJump);
      if(!target||!gameScroller)return;
      const targetRect=target.getBoundingClientRect();
      const scrollRect=gameScroller.getBoundingClientRect();
      const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gameScroller.scrollBy({top:targetRect.top-scrollRect.top-12,behavior:reduceMotion?'auto':'smooth'});
      target.classList.add('game-card-highlight');
      window.setTimeout(()=>target.classList.remove('game-card-highlight'),1500);
    });
  });
})();
