"use strict";(()=>{var e={};e.id=138,e.ids=[138],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},5315:e=>{e.exports=require("path")},8621:e=>{e.exports=require("punycode")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},2623:e=>{e.exports=require("worker_threads")},1568:e=>{e.exports=require("zlib")},7561:e=>{e.exports=require("node:fs")},4492:e=>{e.exports=require("node:stream")},2477:e=>{e.exports=require("node:stream/web")},596:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>g,requestAsyncStorage:()=>h,routeModule:()=>d,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>p});var n=r(9919),o=r(7665),i=r(8747),a=r(8635),u=r(6654),l=r(4596);let c=null;async function p(e){let t=function(){if(c)return c;let e=process.env.ANTHROPIC_API_KEY;return e?c=new u.ZP({apiKey:e}):null}();if(!t)return a.NextResponse.json({error:"AI service not configured. Please contact your teacher."},{status:503});try{let r,s;let n=await (0,l.h3)(e);if(!n.authenticated||!n.userId)return(0,l.m)(n.error);let o=(0,l.Dn)(`brainstorm:${n.userId}`,l.fp.ai);if(!o.allowed)return(0,l.tm)(o.resetIn);try{r=await e.json()}catch{return a.NextResponse.json({error:"Invalid JSON body"},{status:400})}let{sessionType:i,messages:u,studentSkills:c,studentContext:p}=r;if(!i||!u)return a.NextResponse.json({error:"Missing required fields"},{status:400});let d={show_skill:`You are a Socratic brainstorming partner helping a high school student find creative ways to demonstrate a skill they've learned. 
        
Your approach:
- Never give direct answers - ask questions that help them discover ideas
- Connect their interests to the skill they want to demonstrate
- Push them to think about WHO would benefit and WHY it matters
- Help them find ideas that are achievable this week, not "someday"
- Focus on real-world application, not just academic proof

Student skills: ${c?.join(", ")||"various leadership skills"}
${p?`Context: ${p}`:""}

Keep responses concise (2-3 sentences max). Always end with a question.`,combine_skills:`You are a Socratic brainstorming partner helping a high school student create a project that combines multiple skills.

Your approach:
- Help them find the "thread" that connects different skills
- Ask about their passions outside of class
- Push for concrete, actionable projects (not vague ideas)
- Encourage them to think about impact, not just completion

Student skills: ${c?.join(", ")||"various leadership skills"}
${p?`Context: ${p}`:""}

Keep responses concise. Always end with a question.`,give_back:`You are a Socratic brainstorming partner helping a high school student find meaningful ways to give back to their community.

Your approach:
- Help them identify problems they personally care about
- Ask what UNIQUE perspective or skill they bring
- Push them beyond one-time charity to sustainable impact
- Connect giving back to their personal growth

Student skills: ${c?.join(", ")||"various leadership skills"}
${p?`Context: ${p}`:""}

Keep responses concise. Always end with a question.`,start_ripple:`You are a Socratic brainstorming partner helping a high school student create a "ripple" - an action that inspires others to pay it forward.

Your approach:
- Good ripples are: easy to start, meaningful to receive, inspiring to pass on
- Ask how their action could multiply beyond the first person
- Push them to think systemically, not just individually
- Help them see how small actions can have exponential impact

Student skills: ${c?.join(", ")||"various leadership skills"}
${p?`Context: ${p}`:""}

Keep responses concise. Always end with a question.`,group_tier_up:`You are a Socratic facilitator helping a group of high school students plan a collaborative project to "tier up" their connected worlds.

Your approach:
- Help them find the intersection of their different passions
- Push for clear role division (everyone leads something)
- Focus on projects that require teamwork, not just parallel work
- Guide them toward community impact, not just personal benefit

Student skills: ${c?.join(", ")||"various leadership skills"}
${p?`Context: ${p}`:""}

Keep responses concise. Always end with a question.`},h=d[i]||d.show_skill,m=u.map(e=>({role:e.role,content:e.content})),f=new AbortController,w=setTimeout(()=>f.abort(),25e3);try{s=await t.messages.create({model:"claude-sonnet-4-20250514",max_tokens:300,system:h,messages:m},{signal:f.signal})}catch(e){if("AbortError"===e.name)return a.NextResponse.json({message:"Still thinking... The AI is taking longer than usual. Please try again.",sessionType:i});return console.error("[BRAINSTORM] Anthropic error:",e.message||"Unknown"),(0,l.Vd)("AI service temporarily unavailable")}finally{clearTimeout(w)}let g="text"===s.content[0].type?s.content[0].text:"";return a.NextResponse.json({message:g,sessionType:i})}catch(e){return console.error("[BRAINSTORM] Error:",e instanceof Error?e.message:"Unknown"),(0,l.Vd)("Failed to process brainstorm request")}}let d=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/ai/brainstorm/route",pathname:"/api/ai/brainstorm",filename:"route",bundlePath:"app/api/ai/brainstorm/route"},resolvedPagePath:"/workspace/leadership-platform/src/app/api/ai/brainstorm/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:f}=d,w="/api/ai/brainstorm/route";function g(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},4596:(e,t,r)=>{r.d(t,{Cp:()=>x,Dn:()=>w,M2:()=>h,Py:()=>c,Vd:()=>d,bQ:()=>i,fp:()=>f,h3:()=>a,ks:()=>p,m:()=>l,ni:()=>y,oN:()=>u,tm:()=>g});var s=r(8635),n=r(2380);let o=null;function i(){if(o)return o;let e="https://apakkhzuydsfzvypewwa.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWtraHp1eWRzZnp2eXBld3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDEyODQsImV4cCI6MjA4NDA3NzI4NH0.c3hiZOEKMIXMP7aB0SVgrbQH58nwxseycVmeH23KsNQ";if(!e||!t)throw Error("FATAL: Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");return o=(0,n.eI)(e,t)}async function a(e){try{let t=i(),r=new URL(e.url),s=r.searchParams.get("studentId")||r.searchParams.get("userId");if(!s&&("POST"===e.method||"PATCH"===e.method))try{let t=await e.clone().json();s=t.studentId||t.student_id||t.userId||t.user_id||t.teacherId||t.teacher_id}catch{}if(!s)return{authenticated:!1,error:"No user identifier provided"};if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s))return{authenticated:!1,error:"Invalid user identifier format"};let{data:n,error:o}=await t.from("users").select("id, role, class_id").eq("id",s).single();if(o||!n)return{authenticated:!1,error:"User not found"};return{authenticated:!0,userId:n.id,role:n.role,classId:n.class_id}}catch(e){return console.error("[AUTH] Validation error:",e instanceof Error?e.message:"Unknown"),{authenticated:!1,error:"Authentication failed"}}}async function u(e,t){try{let r=i(),{data:s}=await r.from("users").select("class_id").eq("id",e).single();return s?.class_id===t}catch{return!1}}function l(e="Unauthorized"){return s.NextResponse.json({error:e},{status:401})}function c(e="Forbidden"){return s.NextResponse.json({error:e},{status:403})}function p(e){return s.NextResponse.json({error:e},{status:400})}function d(e="Internal server error"){return s.NextResponse.json({error:e},{status:500})}function h(e){return s.NextResponse.json({error:e},{status:503})}let m=new Map,f={ai:{windowMs:6e4,maxRequests:10},standard:{windowMs:6e4,maxRequests:60},write:{windowMs:6e4,maxRequests:30}};function w(e,t=f.standard){let r=Date.now();m.size>1e4&&m.forEach((e,t)=>{e.resetAt<r&&m.delete(t)});let s=m.get(e);return!s||s.resetAt<r?(m.set(e,{count:1,resetAt:r+t.windowMs}),{allowed:!0,remaining:t.maxRequests-1,resetIn:t.windowMs}):s.count>=t.maxRequests?{allowed:!1,remaining:0,resetIn:s.resetAt-r}:(s.count++,{allowed:!0,remaining:t.maxRequests-s.count,resetIn:s.resetAt-r})}function g(e){return s.NextResponse.json({error:"Too many requests. Please slow down."},{status:429,headers:{"Retry-After":String(Math.ceil(e/1e3)),"X-RateLimit-Reset":String(Math.ceil(e/1e3))}})}function y(e){return"string"==typeof e&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e)}function x(e,t=1e4){return"string"==typeof e&&e.length>0&&e.length<=t}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[469,16,654],()=>r(596));module.exports=s})();