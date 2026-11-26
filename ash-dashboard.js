/* Owner-only dashboard. Supabase Auth + Row Level Security enforce access.
   This code contains NO service keys; all user data is added using textContent. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.TRISHI_RESPONSE_CONFIG||{};
const publicUrl=cfg.supabaseUrl||'';
const publishable=cfg.publishableKey||'';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(publicUrl)||!publishable||!window.supabase?.createClient){
  $('admin-setup').hidden=false;return;
}
const client=window.supabase.createClient(publicUrl,publishable);
let allRows=[];
function section(id){
  for(const name of ['admin-setup','admin-login','admin-denied','admin-content'])
    $(name).hidden=name!==id;
}
const textEl=(tag,text,cls)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  el.textContent=String(text);
  return el;
};
const formatDate=str=>{
  try{return new Date(str).toLocaleString()}catch{return str}
};
function createResults(){
  const filter=$('admin-filter').value;
  const rows=allRows.filter(r=>{
    const p=r.response_data||{};
    return filter==='all'
      ||filter==='choices'&&Array.isArray(p.choices)&&p.choices.length
      ||filter==='scores'&&Array.isArray(p.scores)&&p.scores.length
      ||filter==='rating'&&Number.isInteger(p.rating);
  });
  const container=$('admin-results');
  container.replaceChildren();
  $('admin-count').textContent=allRows.length+' submissions · '+rows.length+' matching filter';
  if(!rows.length){
    container.append(textEl('p','No submissions to show yet. Nothing is collected until the visitor deliberately sends results.','admin-empty'));
    return;
  }
  for(const row of rows){
    const data=row.response_data||{};
    const card=textEl('article','','submission-card');
    const header=textEl('div','','submission-header');
    header.append(textEl('strong',formatDate(row.submitted_at)));
    header.append(textEl('span',row.email_sent?'Email sent':'Email not sent','admin-badge'));
    card.append(header);
    if(Array.isArray(data.choices)&&data.choices.length){
      card.append(textEl('h3','Choices'));
      const list=document.createElement('ul');
      for(const item of data.choices){
        list.append(textEl('li',String(item.question||'')+' → '+String(item.answer||'')));
      }
      card.append(list);
    }
    if(Array.isArray(data.scores)&&data.scores.length){
      card.append(textEl('h3','Game results'));
      const list=document.createElement('ul');
      for(const item of data.scores){
        list.append(textEl('li',String(item.game||'')+': '+String(item.score||'')));
      }
      card.append(list);
    }
    if(Number.isInteger(data.rating)&&data.rating>=1&&data.rating<=5)
      card.append(textEl('p','Website rating: '+data.rating+' / 5'));
    container.append(card);
  }
}
async function load(){
  $('admin-results').replaceChildren(textEl('p','Loading…'));
  const {data,error}=await client.from('ash_birthday_responses')
    .select('id,submitted_at,response_data,email_sent')
    .order('submitted_at',{ascending:false}).limit(200);
  if(error){
    $('admin-results').replaceChildren(textEl('p','Could not load results: '+error.message));
    return;
  }
  allRows=data||[];
  createResults();
}
async function check(){
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user){section('admin-login');return}
  const {data:owner,error:ownerError}=await client.from('ash_dashboard_owners')
    .select('owner_id').eq('owner_id',user.id).maybeSingle();
  if(ownerError||!owner){section('admin-denied');return}
  section('admin-content');
  await load();
}
$('admin-login-form').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const email=$('admin-email').value.trim().toLowerCase();
  const status=$('admin-login-status');
  status.textContent='Requesting sign-in email…';
  const redirect=location.origin+location.pathname;
  const {error}=await client.auth.signInWithOtp({
    email,options:{emailRedirectTo:redirect,shouldCreateUser:true}
  });
  status.textContent=error?error.message:'Check your inbox for a sign-in link. Only the configured owner can view results.';
});
async function signOut(){await client.auth.signOut();allRows=[];section('admin-login')}
$('admin-signout').addEventListener('click',signOut);
$('admin-denied-logout').addEventListener('click',signOut);
$('admin-refresh').addEventListener('click',load);
$('admin-filter').addEventListener('change',createResults);
$('admin-export').addEventListener('click',()=>{
  // An explicit download, initiated by the signed-in owner only.
  const data=JSON.stringify(allRows,null,2);
  const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  const a=document.createElement('a');
  a.href=url;a.download='ash-birthday-submissions.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
client.auth.onAuthStateChange((_event,_session)=>{
  setTimeout(check,0);
});
check();
})();
