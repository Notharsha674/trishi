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
  if (id === 'final') launchConfetti();
  if (id === 'secret') resetSecretGift();
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
let memorySwitchId=0;
const memorySlots=Array.from(document.querySelectorAll('.memory-card'));
const memoryGallery=document.querySelector('.memory-gallery');
const memoryPageLabel=document.getElementById('mem-page');
const memoryPrev=document.getElementById('mem-prev');
const memoryNext=document.getElementById('mem-next');
const memoryNames=['chhoti Trishi ♡','mini madam','bachpan ki star','cutie era','sweet memories','time flies yaar','iconic as always','yeh pose 😭','still adorable','birthday girl ♡'];
const photosPerPage=memorySlots.length;
const totalMemoryPages=Math.ceil(memoryPhotos.length/photosPerPage);
const memoryImagePromises=new Map();

// Load AND decode the next page early, rather than fetching the images after the click.
function warmMemoryImage(path){
  if(memoryImagePromises.has(path))return memoryImagePromises.get(path);
  const task=new Promise(resolve=>{
    const image=new Image();
    image.decoding='async';
    image.onload=()=>{
      if(typeof image.decode==='function'){
        image.decode().catch(()=>{}).then(()=>resolve(true));
      }else resolve(true);
    };
    image.onerror=()=>resolve(false);
    image.src=path;
  });
  memoryImagePromises.set(path,task);
  return task;
}
function warmMemoryPage(page){
  if(page<0||page>=totalMemoryPages)return Promise.resolve([]);
  return Promise.all(memoryPhotos.slice(page*photosPerPage,(page+1)*photosPerPage).map(warmMemoryImage));
}
function setMemoryPager(loading=false){
  memoryPageLabel.textContent=`${memoryPage+1} / ${totalMemoryPages}`;
  memoryPrev.disabled=loading||memoryPage===0;
  memoryNext.disabled=loading||memoryPage===totalMemoryPages-1;
  memoryPrev.setAttribute('aria-busy',String(loading));
  memoryNext.setAttribute('aria-busy',String(loading));
}
async function showMemoryPage(page){
  const nextPage=Math.max(0,Math.min(totalMemoryPages-1,page));
  if(nextPage===memoryPage)return;
  const ticket=++memorySwitchId;
  memoryPage=nextPage;

  // Immediately cover the old photos. Page 1 must never remain visible while page 2 loads.
  memoryGallery.classList.add('is-loading');
  memoryGallery.setAttribute('aria-busy','true');
  setMemoryPager(true);
  await warmMemoryPage(nextPage);
  if(ticket!==memorySwitchId)return;

  const decodes=[];
  memorySlots.forEach((card,i)=>{
    const index=memoryPage*photosPerPage+i;
    const photo=card.querySelector('img');
    const label=card.querySelector('small');
    const exists=index<memoryPhotos.length;
    card.style.visibility=exists?'visible':'hidden';
    if(!exists)return;
    photo.style.display='';
    photo.src=memoryPhotos[index];
    photo.alt=`Trishi photo ${index+1} of ${memoryPhotos.length}`;
    label.textContent=memoryNames[index];
    if(typeof photo.decode==='function'){
      decodes.push(photo.decode().catch(()=>{photo.style.display='none';}));
    }else{
      decodes.push(new Promise(resolve=>{
        if(photo.complete)return resolve();
        photo.addEventListener('load',resolve,{once:true});
        photo.addEventListener('error',()=>{photo.style.display='none';resolve();},{once:true});
      }));
    }
  });
  await Promise.all(decodes);
  if(ticket!==memorySwitchId)return;

  memorySlots.forEach(card=>{
    card.classList.remove('flip-photo');
    void card.offsetWidth;
    card.classList.add('flip-photo');
  });
  memoryGallery.classList.remove('is-loading');
  memoryGallery.setAttribute('aria-busy','false');
  setMemoryPager(false);
  // Keep both page sets cached so navigating backwards is instant.
  void warmMemoryPage(memoryPage+1);
  void warmMemoryPage(memoryPage-1);
}
memoryPrev.addEventListener('click',()=>{void showMemoryPage(memoryPage-1);});
memoryNext.addEventListener('click',()=>{void showMemoryPage(memoryPage+1);});
setMemoryPager();
// Prefetch the second page as soon as the birthday website starts loading.
void warmMemoryPage(1);



// Bonus surprise gift: interactive reveal and confetti.
const secretOpen=document.getElementById('secret-open');
const secretReveal=document.getElementById('secret-reveal');
function resetSecretGift(){
  secretReveal.hidden=true;
  secretOpen.textContent='OPEN THE SECRET ♡';
  secretOpen.setAttribute('aria-expanded','false');
}
secretOpen.addEventListener('click',()=>{
  if(!secretReveal.hidden)return;
  secretReveal.hidden=false;
  secretOpen.setAttribute('aria-expanded','true');
  secretOpen.textContent='SECRET UNLOCKED ♡';
  launchConfetti();
});

// A full-size, keyboard-accessible memory photo viewer.
const memoryZoom=document.getElementById('memory-zoom');
const zoomImage=document.getElementById('zoom-image');
const zoomCaption=document.getElementById('zoom-caption');
const zoomPrev=document.getElementById('zoom-prev');
const zoomNext=document.getElementById('zoom-next');
const zoomClose=document.getElementById('zoom-close');
let zoomIndex=0,zoomOpener=null;
function displayZoomPhoto(index){
  zoomIndex=(index+memoryPhotos.length)%memoryPhotos.length;
  zoomImage.style.opacity='0';
  zoomImage.onload=()=>{zoomImage.style.opacity='1';};
  zoomImage.onerror=()=>{zoomImage.style.opacity='1';};
  zoomImage.src=memoryPhotos[zoomIndex];
  if(zoomImage.complete && zoomImage.naturalWidth)zoomImage.style.opacity='1';
  zoomImage.alt=`Trishi's memory photo ${zoomIndex+1}`;
  zoomCaption.textContent=`${memoryNames[zoomIndex]} · ${zoomIndex+1} / ${memoryPhotos.length}`;
  void warmMemoryImage(memoryPhotos[(zoomIndex+1)%memoryPhotos.length]);
}
function openMemoryZoom(slot){
  if(memoryGallery.classList.contains('is-loading'))return;
  const index=memoryPage*photosPerPage+slot;
  if(index>=memoryPhotos.length)return;
  zoomOpener=memorySlots[slot];
  memoryZoom.hidden=false;
  displayZoomPhoto(index);
  zoomClose.focus();
}
function closeMemoryZoom(){
  if(memoryZoom.hidden)return;
  memoryZoom.hidden=true;
  zoomImage.onload=null;
  zoomImage.onerror=null;
  zoomImage.removeAttribute('src');
  zoomOpener?.focus();
}
memorySlots.forEach((card,slot)=>{
  card.tabIndex=0;
  card.setAttribute('role','button');
  card.setAttribute('aria-label','View memory photo '+(slot+1));
  card.addEventListener('click',()=>openMemoryZoom(slot));
  card.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();openMemoryZoom(slot);}
  });
});
zoomClose.addEventListener('click',closeMemoryZoom);
zoomPrev.addEventListener('click',()=>displayZoomPhoto(zoomIndex-1));
zoomNext.addEventListener('click',()=>displayZoomPhoto(zoomIndex+1));
memoryZoom.addEventListener('click',e=>{if(e.target===memoryZoom)closeMemoryZoom();});
document.addEventListener('keydown',e=>{
  if(memoryZoom.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMemoryZoom();}
  else if(e.key==='ArrowLeft'){e.preventDefault();displayZoomPhoto(zoomIndex-1);}
  else if(e.key==='ArrowRight'){e.preventDefault();displayZoomPhoto(zoomIndex+1);}
},true);

// Reading progress for the already-visible long Hinglish letter.
const letterScroll=document.querySelector('.letter-scroll');
const letterProgress=document.getElementById('letter-progress');
const letterProgressFill=document.getElementById('letter-progress-fill');
function updateLetterProgress(){
  const max=letterScroll.scrollHeight-letterScroll.clientHeight;
  const percent=max>0?Math.max(0,Math.min(100,Math.round(letterScroll.scrollTop/max*100))):100;
  letterProgressFill.style.width=percent+'%';
  letterProgress.setAttribute('aria-valuenow',String(percent));
}
letterScroll.addEventListener('scroll',updateLetterProgress,{passive:true});
updateLetterProgress();

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
