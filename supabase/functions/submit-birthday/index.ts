// Public intake for explicitly shared birthday results.
// Deploy using: supabase functions deploy submit-birthday --no-verify-jwt
// Never put secret keys, invite codes or recipient email into GitHub Pages.
import { withSupabase } from "npm:@supabase/server@1";

const ALLOWED_ORIGIN = "https://notharsha674.github.io";
const HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Cache-Control": "no-store",
  "Vary": "Origin",
};
function result(body: Record<string, unknown>, status=200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...HEADERS, "content-type":"application/json; charset=utf-8" },
  });
}
const boundedText=(value:unknown, limit:number):string =>
  typeof value==="string" ? value.trim().slice(0,limit) : "";
const isUUID=(value:unknown): value is string =>
  typeof value==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
async function equalSecret(a:string,b:string) {
  // Compare constant-length hashes so code mismatch length is not revealed.
  const enc=new TextEncoder(), hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s)));
  const [x,y]=await Promise.all([hash(a),hash(b)]);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
  return diff===0;
}
function normalizeChoices(items:unknown) {
  if(!Array.isArray(items))return [];
  return items.slice(0,16).map(item=>({
    question: boundedText(item?.question, 125),
    answer: boundedText(item?.answer, 125),
  })).filter(entry=>entry.question.length>0 && entry.answer.length>0);
}
function normalizeScores(items:unknown) {
  if(!Array.isArray(items))return [];
  return items.slice(0,15).map(item=>({
    game: boundedText(item?.game,65),
    score: boundedText(item?.score,100),
  })).filter(entry=>entry.game.length>0 && entry.score.length>0);
}
function notificationText(record:{choices:{question:string,answer:string}[],scores:{game:string,score:string}[],rating:number|null}) {
  const lines=["New voluntarily submitted birthday results","",
    "Choices:", ...record.choices.map(c=>"- "+c.question+": "+c.answer),"",
    "Game results:", ...record.scores.map(s=>"- "+s.game+": "+s.score),"",
    "Website rating: "+(record.rating??"Not shared"),"",
    "Dashboard: https://notharsha674.github.io/trishi/ash-dashboard.html",
    "Sent only after the visitor reviewed and confirmed sharing.",
  ];
  return lines.join("\n");
}
export default {
  fetch: withSupabase({auth:"none"}, async(req,ctx):Promise<Response>=>{
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:HEADERS});
    if(req.method!=="POST")return result({error:"Only POST is allowed."},405);
    if(req.headers.get("origin")!==ALLOWED_ORIGIN) return result({error:"Origin not allowed."},403);
    if(!req.headers.get("content-type")?.startsWith("application/json"))return result({error:"JSON required."},415);
    const declared=Number(req.headers.get("content-length")||0);
    if(declared>8000)return result({error:"Submission too large."},413);
    const raw=await req.text();
    if(raw.length>8000)return result({error:"Submission too large."},413);
    let input:Record<string,unknown>;
    try{input=JSON.parse(raw)}catch{return result({error:"Invalid JSON."},400)}
    if(!input || Array.isArray(input) || typeof input!=="object")return result({error:"Invalid payload."},400);
    if(input.consent!==true)return result({error:"Consent is required."},400);
    const secret=Deno.env.get("SUBMISSION_INVITE_CODE")||"";
    const supplied=boundedText(input.code,100);
    if(secret.length<16 || !supplied || !(await equalSecret(supplied,secret)))
      return result({error:"Incorrect invite code or submissions not configured."},403);
    if(!isUUID(input.submissionId))return result({error:"Invalid submission ID."},400);
    const choices=normalizeChoices(input.choices),scores=normalizeScores(input.scores);
    const rating=Number.isInteger(input.rating) && Number(input.rating)>=1 && Number(input.rating)<=5?Number(input.rating):null;
    if(!choices.length && !scores.length && rating===null)
      return result({error:"Choose at least one answer, score or rating to share."},400);
    const sanitized={choices,scores,rating};
    if(JSON.stringify(sanitized).length>5000)return result({error:"Too much content."},413);

    // Small global daily limit bounds abuse even if the private invite code is shared onward.
    const since=new Date(Date.now()-24*60*60*1000).toISOString();
    const {count,error:countError}=await ctx.supabaseAdmin
      .from("ash_birthday_responses").select("id",{count:"exact",head:true})
      .gte("submitted_at",since);
    if(countError)return result({error:"Submission service temporarily unavailable."},503);
    if((count||0)>=25)return result({error:"Daily submission limit reached."},429);

    const {data:existing}=await ctx.supabaseAdmin
      .from("ash_birthday_responses").select("id,email_sent")
      .eq("submission_id",input.submissionId).maybeSingle();
    if(existing)return result({ok:true,stored:true,emailSent:existing.email_sent});

    const {data, error}=await ctx.supabaseAdmin.from("ash_birthday_responses")
      .insert({submission_id:input.submissionId,response_data:sanitized})
      .select("id").single();
    if(error||!data)return result({error:"Could not save the response."},503);

    let emailSent=false;
    const apiKey=Deno.env.get("RESEND_API_KEY");
    const to=Deno.env.get("ALERT_TO_EMAIL");
    const from=Deno.env.get("ALERT_FROM_EMAIL");
    if(apiKey && to && from) {
      try{
        const send=await fetch("https://api.resend.com/emails",{
          method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
          body:JSON.stringify({
            from,to:[to],subject:"Trishi birthday — submitted answers & scores",
            text:notificationText(sanitized)
          })
        });
        emailSent=send.ok;
        if(emailSent)await ctx.supabaseAdmin.from("ash_birthday_responses")
          .update({email_sent:true}).eq("id",data.id);
      }catch{/* Saved record still appears in the private dashboard. */}
    }
    return result({ok:true,stored:true,emailSent},201);
  })
};
