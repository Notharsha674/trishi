/*
 * TRISHI / YEON BIRTHDAY WEBSITE
 * Change only the values in CONFIG to personalize the site.
 * Drop your pictures into /assets/ as birthday-photo.jpg and memory1.jpg ... memory5.jpg.
 */
const CONFIG = {
  name: 'Trishi',
  nickname: 'Yeon',
  birthdayTitle: 'For Trishi 💌 | A Birthday Surprise'
};

document.title = CONFIG.birthdayTitle;
document.querySelectorAll('[data-name]').forEach(el => {el.textContent = CONFIG.name;});
const scenes = Array.from(document.querySelectorAll('.scene'));
let currentScene = 'welcome';
function goTo(id) {
  const next = document.getElementById(id);
  if (!next || !next.classList.contains('scene')) return;
  scenes.forEach(el => {el.hidden = true;el.classList.remove('is-active');});
  next.hidden = false;
  // force a new entrance animation whenever the screen is revisited
  void next.offsetWidth;
  next.classList.add('is-active');
  currentScene = id;
  if (id === 'cake') resetCake();
  if (id === 'letter') {const scroll = document.querySelector('.letter-scroll');if(scroll)scroll.scrollTop=0;}
}

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.go)));

const cake = document.getElementById('cake-click');
const status = document.getElementById('wish-status');
function resetCake(){cake.classList.remove('blown');status.textContent='Cake pe tap karke wish maang, jaldi jaldi! 🎂';}
function celebrate(){
  if (cake.classList.contains('blown')) {resetCake();return;}
  cake.classList.add('blown');
  status.textContent=`Wish universe ko bhej di, ${CONFIG.nickname}! Ab cake ka ek bite mere naam 😌✨`;
  launchConfetti();
}
cake.addEventListener('click', celebrate);

function launchConfetti(){
  const box=document.getElementById('confetti');box.textContent='';
  const palette=['#b51c28','#f8be47','#f9e9e4','#f1a8b1','#d86b41'];
  for(let i=0;i<65;i++){
    const dot=document.createElement('span');
    dot.className='confetti-dot';
    dot.style.setProperty('--color',palette[i%palette.length]);
    dot.style.setProperty('--left',`${Math.random()*100}%`);
    dot.style.setProperty('--dur',`${2.5+Math.random()*2}s`);
    dot.style.setProperty('--drift',`${Math.random()*200-100}px`);
    dot.style.setProperty('--angle',`${Math.random()*360}deg`);
    dot.style.animationDelay=`${Math.random()*.7}s`;
    box.appendChild(dot);
  }
  setTimeout(()=>{box.textContent='';},5400);
}

// Supports browser back navigation for a multi-screen birthday experience.
window.addEventListener('keydown', e => {
 if(e.key==='Escape' && !['welcome','gifts'].includes(currentScene))goTo('gifts');
});

// Ten chosen photos without the repeated nurse picture, five at a time on the hanging memory wall.
const memoryPhotos = ["assets/memory1.jpg","assets/memory2.jpg","assets/memory3.jpg","assets/memory5.jpg","assets/memory6.jpg","assets/memory7.jpg","assets/memory8.jpg","assets/memory9.jpg","assets/memory10.jpg","assets/memory11.jpg"];
let memoryPage=0;
const memorySlots=Array.from(document.querySelectorAll('.memory-card'));
const memoryNames=['chhoti Trishi ♡','mini madam','bachpan ki star','cutie era','sweet memories','time flies yaar','iconic as always','yeh pose 😭','still adorable','birthday girl ♡'];
function renderMemories(){
  memorySlots.forEach((card,i)=>{
    let index=memoryPage*5+i;
    const photo=card.querySelector('img');
    const label=card.querySelector('small');
    card.style.visibility=index<memoryPhotos.length?'visible':'hidden';
    if(index<memoryPhotos.length){
      photo.src=memoryPhotos[index];
      photo.alt=`Trishi photo ${index+1} of ${memoryPhotos.length}`;
      label.textContent=memoryNames[index];
    }
    card.classList.remove('flip-photo');void card.offsetWidth;card.classList.add('flip-photo');
  });
  document.getElementById('mem-page').textContent=`${memoryPage+1} / ${Math.ceil(memoryPhotos.length/5)}`;
  document.getElementById('mem-prev').disabled=memoryPage===0;
  document.getElementById('mem-next').disabled=memoryPage===Math.ceil(memoryPhotos.length/5)-1;
}
document.getElementById('mem-prev').addEventListener('click',()=>{memoryPage=Math.max(0,memoryPage-1);renderMemories()});
document.getElementById('mem-next').addEventListener('click',()=>{memoryPage=Math.min(Math.ceil(memoryPhotos.length/5)-1,memoryPage+1);renderMemories()});
renderMemories();

// Tiny bestie roast when opening gift three — the letter itself stays sweet.
const thirdGift = document.querySelector('.gift[data-go="letter"]');
if(thirdGift) thirdGift.title='Gift 3 mein cute letter aur free roast. Ready ho, madam? 😌';


// Try to start music immediately. Browsers may block sound until a user gesture.
const birthdayAudio=document.getElementById('birthday-audio');
const musicButton=document.getElementById('music-button');
const musicLabel=document.getElementById('music-label');
let userStoppedMusic=false;
birthdayAudio.volume=0.44;
function updateMusicButton(){
  const active=!birthdayAudio.paused;
  musicLabel.textContent=active?'Pause song':'Play song';
  musicButton.setAttribute('aria-label',active?'Pause birthday song':'Play birthday song');
  musicButton.setAttribute('aria-pressed',String(active));
}
function playBirthdayMusic(){
  const attempted=birthdayAudio.play();
  if(attempted?.catch)attempted.catch(()=>{
    updateMusicButton();
    if(!userStoppedMusic && birthdayAudio.paused){
      musicLabel.textContent='Tap to start music';
      musicButton.title='Tap anywhere to start the birthday song';
    }
  });
}
musicButton.addEventListener('click',()=>{
  if(birthdayAudio.paused){userStoppedMusic=false;playBirthdayMusic();}
  else{userStoppedMusic=true;birthdayAudio.pause();}
});
document.querySelectorAll('button[data-go]').forEach(button=>{
  button.addEventListener('click',()=>{if(birthdayAudio.paused && !userStoppedMusic)playBirthdayMusic();});
});
birthdayAudio.addEventListener('play',updateMusicButton);
birthdayAudio.addEventListener('pause',updateMusicButton);
birthdayAudio.addEventListener('error',()=>{
  musicLabel.textContent='Audio unavailable';
  musicButton.title='Song file missing — add assets/birthday-song.m4a';
});
updateMusicButton();

// Browsers often block sound on page load. The first tap anywhere unlocks it.
function startMusicOnInteraction(event){
  if(userStoppedMusic || !birthdayAudio.paused) return;
  if(event.target?.closest?.('#music-button')) return; // music button handles itself
  playBirthdayMusic();
}
document.addEventListener('pointerdown',startMusicOnInteraction,{capture:true});
document.addEventListener('keydown',event=>{
  if(!event.repeat) startMusicOnInteraction(event);
},{capture:true});
// Attempt immediately when page opens. This works on browsers that permit autoplay.
playBirthdayMusic();
