/* Trishi: explicit review and send. Never auto-send or include personal notes. */
(()=>{
'use strict';
const screen=document.getElementById('send-answers');
if(!screen)return;
const $=id=>document.getElementById(id);
const history=[];
function remember(group,question,answer){
  if(!question||!answer)return;
  history.push({question:(group+' — '+question).slice(0,125),answer:answer.slice(0,125)});
  while(history.length>16)history.shift();
}
// Only choices selected by clicking existing quiz buttons are kept temporarily.
document.querySelectorAll('#choice-a,#choice-b').forEach(button=>{
  button.addEventListener('click',()=>{
    if(button.hidden||button.disabled)return;
    const q=$('choice-prompt')?.textContent||'This or That';
    const other=$(button.id==='choice-a'?'choice-b':'choice-a');
    remember('This or That',q+': '+button.textContent+' / '+(other?.textContent||''),button.textContent);
  },true);
});
document.querySelectorAll('#wyr-a,#wyr-b').forEach(button=>{
  button.addEventListener('click',()=>{
    if(button.hidden||button.disabled)return;
    const other=$(button.id==='wyr-a'?'wyr-b':'wyr-a');
    remember('Would You Rather',button.textContent+' / '+(other?.textContent||''),button.textContent);
  },true);
});
const cleanText=id=>($(id)?.textContent||'').trim().slice(0,100);
function getScores(){
  const tests=[
    ['Memory Match','match-status',t=>/matches|pairs/.test(t)&&!/^0(?:\s*\/\s*6)?\s*(?:matches|\/\s*6)/.test(t)],
    ['Tap Challenge','tap-score',t=>/taps/i.test(t)&&!/^Taps:\s*0$/i.test(t)],
    ['Tic-Tac-Toe','ttt-score',t=>/\d/.test(t)&&!/You 0 · CPU 0 · Draw 0/.test(t)],
    ['Rock Paper Scissors','rps-score',t=>/\d/.test(t)&&!/You 0 · Computer 0 · Ties 0/.test(t)],
    ['Catch the Cake','whack-result',t=>/^Round over/.test(t)],
    ['Reaction Speed','reaction-result',t=>/^\d+\s*ms/.test(t)],
    ['Guess the Number','number-result',t=>/Correct!|Out of tries/.test(t)],
    ['Word Scramble','word-progress',t=>/\bScore\s+[1-9]\d*/.test(t)]
  ];
  return tests.map(([game,id,accept])=>{
    const score=cleanText(id);
    return accept(score)?{game,score}:null;
  }).filter(Boolean);
}
function currentRating(){
  const match=cleanText('rating-output').match(/^([1-5])\s*\/\s*5/);
  return match?Number(match[1]):null;
}
const config=()=>window.TRISHI_RESPONSE_CONFIG||{};
const configured=()=>/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config().supabaseUrl||'');
function selection(){
  return {
    choices:$('share-choices').checked?history.slice():[],
    scores:$('share-scores').checked?getScores():[],
    rating:$('share-rating').checked?currentRating():null
  };
}
function render(){
  const selected=selection();
  const lines=[];
  if($('share-choices').checked){
    lines.push('CHOICES');
    lines.push(...(selected.choices.length?selected.choices.map(x=>'• '+x.question+'\n  → '+x.answer):['(No choices recorded yet)']));
  }
  if($('share-scores').checked){
    lines.push('\nGAME SCORES');
    lines.push(...(selected.scores.length?selected.scores.map(x=>'• '+x.game+': '+x.score):['(No completed games recorded yet)']));
  }
  if($('share-rating').checked){
    lines.push('\nWEBSITE RATING');
    lines.push(selected.rating===null?'(Not rated yet)':selected.rating+' out of 5');
  }
  $('share-preview').value=lines.join('\n').trim()||'Select what you want to share above.';
  $('share-config-status').textContent=configured()
    ?'Secure submission is configured. No data is sent until you press Send.'
    :'Submissions are not connected yet. Ash needs to finish the private setup.';
  const hasContent=selected.choices.length||selected.scores.length||selected.rating!==null;
  $('share-submit').disabled=!configured()||!hasContent||!$('share-consent').checked;
}
['share-choices','share-scores','share-rating','share-consent'].forEach(id=>$(id).addEventListener('change',render));
document.querySelectorAll('[data-go="send-answers"]').forEach(button=>button.addEventListener('click',()=>{
  $('share-status').textContent='';render();
}));
$('share-recalculate').addEventListener('click',render);
$('share-form').addEventListener('submit',async e=>{
  e.preventDefault();render();
  if(!configured()){return $('share-status').textContent='Ash has not connected the backend yet.'}
  if(!$('share-consent').checked){return $('share-status').textContent='Please confirm sharing.'}
  const code=$('share-code').value.trim();
  if(code.length<16){return $('share-status').textContent='Enter the private invite code from Ash.'}
  const payload=selection();
  if(!payload.choices.length&&!payload.scores.length&&payload.rating===null){
    return $('share-status').textContent='No selected answers or results to share.';
  }
  const cfg=config();
  $('share-submit').disabled=true;
  $('share-submit').textContent='Sending…';
  $('share-status').textContent='Saving the selected results…';
  try{
    const endpoint=cfg.supabaseUrl.replace(/\/$/,'')+'/functions/v1/'+encodeURIComponent(cfg.functionName||'submit-birthday');
    const headers={'Content-Type':'application/json'};
    if(cfg.publishableKey)headers.apikey=cfg.publishableKey;
    const response=await fetch(endpoint,{
      method:'POST',mode:'cors',headers,
      body:JSON.stringify({...payload,code,consent:true,submissionId:crypto.randomUUID()})
    });
    let data={};
    try{data=await response.json()}catch{}
    if(!response.ok||!data.ok)throw Error(data.error||'Service not ready. Try again.');
    $('share-status').textContent=data.emailSent
      ?'Sent! Results saved for Ash and an email alert was sent.'
      :'Saved for Ash in the private dashboard. Email notifications may not be configured yet.';
    $('share-code').value='';
    $('share-consent').checked=false;
    history.length=0;
  }catch(error){
    $('share-status').textContent=String(error?.message||'Could not send. Retry.');
  }finally{
    $('share-submit').textContent='Send selected results to Ash';
    render();
  }
});
render();
})();
