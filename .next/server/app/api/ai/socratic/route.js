"use strict";(()=>{var e={};e.id=451,e.ids=[451],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},3139:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>I,requestAsyncStorage:()=>f,routeModule:()=>y,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var n={};r.r(n),r.d(n,{POST:()=>p});var o=r(9919),s=r(7665),a=r(8747),i=r(8635),u=r(6654),l=r(4596);let c=null,h={self_harm:[/\b(kill myself|want to die|end it all|suicide|self.?harm|hurt myself|cutting)\b/i,/\b(no point in living|better off dead|don't want to be here|disappear forever)\b/i],helplessness:[/\b(no hope|hopeless|can't go on|give up on everything|nothing matters)\b/i,/\b(no one cares|completely alone|nobody would notice)\b/i],rage:[/\b(kill (them|him|her|someone)|hurt (them|him|her|someone)|violent thoughts)\b/i,/\b(want to destroy|burn it down|make them pay)\b/i],abuse:[/\b(being hit|beats me|touches me|abuse|molest|assault)\b/i,/\b(scared to go home|parents hurt me|forced to)\b/i]},d=[/\b(as an AI|I cannot|I'm designed to)\b/i,/\b(certainly|absolutely|definitely|obviously)\b.*\b(important|crucial|vital)\b/i,/\b(firstly|secondly|thirdly|in conclusion|to summarize)\b/i,/it's (important|crucial|essential) to (note|remember|understand)/i];async function p(e){let t=function(){if(c)return c;let e=process.env.ANTHROPIC_API_KEY;return e?c=new u.ZP({apiKey:e}):(console.error("[SOCRATIC] ANTHROPIC_API_KEY not configured"),null)}();if(!t)return(0,l.M2)("AI service not configured. Please contact your teacher.");try{let r,n;let o=await (0,l.h3)(e);if(!o.authenticated||!o.userId)return(0,l.m)(o.error);let s=(0,l.Dn)(`ai:${o.userId}`,l.fp.ai);if(!s.allowed)return(0,l.tm)(s.resetIn);try{r=await e.json()}catch{return i.NextResponse.json({error:"Invalid JSON body"},{status:400})}let{type:a,lesson_id:u,student_id:c,class_id:p,conversation_history:y,user_message:f,lesson_context:g,response_count:m,min_responses:w}=r;if(!(0,l.ni)(c))return i.NextResponse.json({error:"Invalid student_id"},{status:400});if(!(0,l.ni)(p))return i.NextResponse.json({error:"Invalid class_id"},{status:400});if(!(0,l.Cp)(f,5e3))return i.NextResponse.json({error:"Invalid or too long message"},{status:400});if(!Array.isArray(y)||y.length>20)return i.NextResponse.json({error:"Invalid conversation history"},{status:400});if("number"!=typeof m||m<0||m>100)return i.NextResponse.json({error:"Invalid response_count"},{status:400});if("number"!=typeof w||w<1||w>20)return i.NextResponse.json({error:"Invalid min_responses"},{status:400});let I=(0,l.bQ)(),b=function(e){for(let[t,r]of Object.entries(h))for(let n of r){let r=e.match(n);if(r)return{detected:!0,type:t,trigger:r[0]}}return{detected:!1,type:null,trigger:null}}(f);if(b.detected)return(async()=>{try{await I.from("crisis_alerts").insert({student_id:c,class_id:p,lesson_id:u,trigger_type:b.type,trigger_text:b.trigger,conversation_context:y.slice(-5),status:"unread"})}catch(e){console.error("[SOCRATIC] Crisis alert insert failed:",e)}})(),i.NextResponse.json({message:`I need to pause here. What you just shared sounds really difficult, and I want you to know that you're not alone. 

Please talk to your teacher, school counselor, or another trusted adult about what you're going through. They want to help.

If you're in crisis right now, please text HOME to 741741 (Crisis Text Line) or call 988 (Suicide & Crisis Lifeline).

We can continue our conversation after you've had a chance to talk to someone. You matter. 💙`,crisis_detected:!0,should_complete:!1});let v=function(e){if(e.trim().split(/\s+/).length<8||["idk","i dont know","i don't know","sure","ok","okay","fine","whatever","idc","maybe","probably","i guess","not sure","no idea","beats me","yes","no","yeah","nah","true","false","agree","disagree","makes sense","sounds good","that works","fair enough","good point"].includes(e.toLowerCase().trim()))return!0;for(let t of[/^(i think|i believe|i feel|it is|it's|that's|this is|because)\s+\w{1,10}\.?$/i,/^just\s+\w+\.?$/i,/^\w+\.?$/])if(t.test(e.trim()))return!0;return!1}(f),A=function(e){for(let t of d)if(t.test(e))return!0;return!1}(f);if(v&&m<w){let e=["That's not a conversation - it's a text message. Give me at least two sentences: what you think AND why you think it.","I need more than that. Real learning happens when you push past the easy answer. What's actually going on in your head?","One-word answers are how you survive class. Actual thinking is how you grow. Try again with substance.","Here's the thing about short answers: they let you hide from actually thinking. Give me something I can work with - a real thought with reasoning behind it.","That reads like you're trying to get this over with. I get it. But you're only cheating yourself. What do you ACTUALLY think about this?"];return i.NextResponse.json({message:e[Math.floor(Math.random()*e.length)],should_complete:!1})}if(A)return i.NextResponse.json({message:"Hold up — that reads like it was generated by AI or copied from somewhere. I need YOUR words, YOUR thoughts. Even if they're messy or uncertain. What do YOU actually think about this?",should_complete:!1});let x=g?.skill_name||"leadership",k=g?.compelling_question||"this topic",E={do_now:`You are a Socratic coach inspired by Adam Grant's intellectual curiosity. Your role: help students think deeply about "${x}".

ADAM GRANT PRINCIPLES:
- Be genuinely curious, not performatively nice
- Challenge assumptions with "What makes you so sure?" and "What would change your mind?"
- Introduce productive conflict: "Here's where I'd push back..."
- Never accept the first answer - the interesting thinking happens in the second and third layers
- Use phrases like: "That's interesting, but...", "I'm curious why you didn't mention...", "What's the counterargument?"

VYGOTSKY ZONE 2 (Zone of Proximal Development):
- Keep them in productive struggle - challenging but achievable
- Scaffold UP: If they give a shallow answer, add complexity: "And what happens when that doesn't work?"
- Scaffold DOWN: If overwhelmed, narrow the question: "Let's focus on just one piece..."
- NEVER solve it for them - guide them to discover the insight themselves

DESIRABLE DIFFICULTIES (Learning Science):
- Make them WORK for understanding - easy answers don't stick
- Space out insights: "Before we move on, sit with that for a second..."
- Require elaboration: "Explain that like I've never heard it before"
- Force connections: "How does that connect to something you've actually experienced?"

RESPONSE FORMAT:
- Acknowledge their point briefly (1 sentence max, NO praise)
- Add a complication, contradiction, or deeper angle (1-2 sentences)
- End with ONE provocative question that requires a substantive answer (not yes/no)

CONVERSATION QUALITY GATE:
- If they give 1-5 words: "That's not a conversation. Give me a real thought - at least two sentences about what you actually think and WHY."
- If they give a generic answer: "That's what everyone says. What do YOU specifically believe, and what experience shaped that?"
- If they ask you to answer: "I could tell you what I think, but you'd forget it in 10 minutes. Work through it yourself."

COMPELLING QUESTION: "${k}"

COMPLETION:
After ${w}+ exchanges with GENUINE depth (not just word count), synthesize their key insight and how it connects to their life. Add [COMPLETE] only when they've truly wrestled with the idea.`,scenario:`You are a scenario coach using Adam Grant's "Think Again" approach. Skill focus: "${x}".

SCENARIO DESIGN:
1. Present a messy, realistic situation with no obvious right answer
2. Include competing values or stakeholders with legitimate concerns
3. Make the "easy answer" have hidden downsides

ADAM GRANT COACHING MOVES:
- "What would a critic say about that approach?"
- "You're solving for X, but what about Y?"
- "That works in theory. Walk me through exactly how it plays out in practice."
- "What's the version of you that would handle this badly? What would they do?"
- Challenge their confidence: "On a scale of 1-10, how sure are you? What would make you less sure?"

DESIRABLE DIFFICULTIES:
- After they propose a solution, introduce a realistic complication
- Make them consider perspectives they initially ignored
- Force trade-off thinking: "You can't have both. Which matters more and why?"
- Require specificity: "That's vague. Give me the exact words you'd say."

ZONE 2 CALIBRATION:
- Too easy: Add stakeholders, constraints, or consequences
- Too hard: "Let's break this down - what's the FIRST thing you'd do?"
- Just right: They're struggling but making progress

ANTI-SYCOPHANCY:
- NEVER say "Great thinking!" or "That's a solid approach!"
- Instead: "Okay, and then what?" or "What's the risk there?"
- Their discomfort is the learning

COMPLETION:
After ${w}+ exchanges where they genuinely grappled with complexity, help them articulate a specific action plan with contingencies. Add [COMPLETE].`,exit_ticket:`You are a reflection coach helping students crystallize learning about "${x}".

ADAM GRANT REFLECTION STYLE:
- Push beyond "I learned that X is important"
- Require specificity: "What's one thing you believed before that you now question?"
- Future-focus: "When will this actually matter in your life? Be specific."
- Metacognition: "What was the hardest part of today's thinking?"

DESIRABLE DIFFICULTY:
- Don't let them off easy with generic reflections
- Ask "why" at least once
- Connect to their actual context

After 3-4 meaningful exchanges, synthesize and add [COMPLETE].`},R=E[a]||E.do_now,T=y.filter(e=>e&&"string"==typeof e.role&&"string"==typeof e.content).map(e=>({role:"assistant"===e.role?"assistant":"user",content:String(e.content).slice(0,5e3)}));T.push({role:"user",content:f});let N=new AbortController,O=setTimeout(()=>N.abort(),25e3);try{n=await t.messages.create({model:"claude-sonnet-4-20250514",max_tokens:500,system:R,messages:T},{signal:N.signal})}catch(e){if("AbortError"===e.name)return i.NextResponse.json({message:"I'm thinking hard about this one! The response is taking longer than usual. Please try again.",should_complete:!1});return console.error("[SOCRATIC] Anthropic API error:",e.message||"Unknown"),(0,l.Vd)("AI service temporarily unavailable. Please try again.")}finally{clearTimeout(O)}let C="text"===n.content[0].type?n.content[0].text:"",S=C.includes("[COMPLETE]")&&m>=w-1,_=C.replace("[COMPLETE]","").trim(),P=new Date().toISOString().split("T")[0];return(async()=>{try{await I.rpc("increment_ai_usage",{p_student_id:c,p_date:P})}catch(e){console.error("[SOCRATIC] Usage tracking failed:",e)}})(),i.NextResponse.json({message:_,should_complete:S,response_count:m+1})}catch(e){return console.error("[SOCRATIC] Unexpected error:",e.message||"Unknown"),(0,l.Vd)("An unexpected error occurred. Please try again.")}}let y=new o.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/ai/socratic/route",pathname:"/api/ai/socratic",filename:"route",bundlePath:"app/api/ai/socratic/route"},resolvedPagePath:"/workspace/leadership-platform/src/app/api/ai/socratic/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:f,staticGenerationAsyncStorage:g,serverHooks:m}=y,w="/api/ai/socratic/route";function I(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},4596:(e,t,r)=>{r.d(t,{Cp:()=>I,Dn:()=>g,M2:()=>p,Py:()=>c,Vd:()=>d,bQ:()=>a,fp:()=>f,h3:()=>i,ks:()=>h,m:()=>l,ni:()=>w,oN:()=>u,tm:()=>m});var n=r(8635),o=r(2380);let s=null;function a(){if(s)return s;let e="https://apakkhzuydsfzvypewwa.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWtraHp1eWRzZnp2eXBld3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDEyODQsImV4cCI6MjA4NDA3NzI4NH0.c3hiZOEKMIXMP7aB0SVgrbQH58nwxseycVmeH23KsNQ";if(!e||!t)throw Error("FATAL: Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");return s=(0,o.eI)(e,t)}async function i(e){try{let t=a(),r=new URL(e.url),n=r.searchParams.get("studentId")||r.searchParams.get("userId");if(!n&&("POST"===e.method||"PATCH"===e.method))try{let t=await e.clone().json();n=t.studentId||t.student_id||t.userId||t.user_id||t.teacherId||t.teacher_id}catch{}if(!n)return{authenticated:!1,error:"No user identifier provided"};if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(n))return{authenticated:!1,error:"Invalid user identifier format"};let{data:o,error:s}=await t.from("users").select("id, role, class_id").eq("id",n).single();if(s||!o)return{authenticated:!1,error:"User not found"};return{authenticated:!0,userId:o.id,role:o.role,classId:o.class_id}}catch(e){return console.error("[AUTH] Validation error:",e instanceof Error?e.message:"Unknown"),{authenticated:!1,error:"Authentication failed"}}}async function u(e,t){try{let r=a(),{data:n}=await r.from("users").select("class_id").eq("id",e).single();return n?.class_id===t}catch{return!1}}function l(e="Unauthorized"){return n.NextResponse.json({error:e},{status:401})}function c(e="Forbidden"){return n.NextResponse.json({error:e},{status:403})}function h(e){return n.NextResponse.json({error:e},{status:400})}function d(e="Internal server error"){return n.NextResponse.json({error:e},{status:500})}function p(e){return n.NextResponse.json({error:e},{status:503})}let y=new Map,f={ai:{windowMs:6e4,maxRequests:10},standard:{windowMs:6e4,maxRequests:60},write:{windowMs:6e4,maxRequests:30}};function g(e,t=f.standard){let r=Date.now();y.size>1e4&&y.forEach((e,t)=>{e.resetAt<r&&y.delete(t)});let n=y.get(e);return!n||n.resetAt<r?(y.set(e,{count:1,resetAt:r+t.windowMs}),{allowed:!0,remaining:t.maxRequests-1,resetIn:t.windowMs}):n.count>=t.maxRequests?{allowed:!1,remaining:0,resetIn:n.resetAt-r}:(n.count++,{allowed:!0,remaining:t.maxRequests-n.count,resetIn:n.resetAt-r})}function m(e){return n.NextResponse.json({error:"Too many requests. Please slow down."},{status:429,headers:{"Retry-After":String(Math.ceil(e/1e3)),"X-RateLimit-Reset":String(Math.ceil(e/1e3))}})}function w(e){return"string"==typeof e&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e)}function I(e,t=1e4){return"string"==typeof e&&e.length>0&&e.length<=t}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[469,16,654],()=>r(3139));module.exports=n})();