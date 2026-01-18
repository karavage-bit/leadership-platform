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

Keep responses concise. Always end with a question.`},h=d[i]||d.show_skill,m=u.map(e=>({role:e.role,content:e.content})),f=new AbortController,w=setTimeout(()=>f.abort(),25e3);try{s=await t.messages.create({model:"claude-sonnet-4-20250514",max_tokens:300,system:h,messages:m},{signal:f.signal})}catch(e){if("AbortError"===e.name)return a.NextResponse.json({message:"Still thinking... The AI is taking longer than usual. Please try again.",sessionType:i});return console.error("[BRAINSTORM] Anthropic error:",e.message||"Unknown"),(0,l.Vd)("AI service temporarily unavailable")}finally{clearTimeout(w)}let g="text"===s.content[0].type?s.content[0].text:"";return a.NextResponse.json({message:g,sessionType:i})}catch(e){return console.error("[BRAINSTORM] Error:",e instanceof Error?e.message:"Unknown"),(0,l.Vd)("Failed to process brainstorm request")}}let d=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/ai/brainstorm/route",pathname:"/api/ai/brainstorm",filename:"route",bundlePath:"app/api/ai/brainstorm/route"},resolvedPagePath:"/workspace/leadership-platform/src/app/api/ai/brainstorm/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:f}=d,w="/api/ai/brainstorm/route";function g(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},4596:(e,t,r)=>{r.d(t,{Cp:()=>k,Dn:()=>x,Gu:()=>l,M2:()=>f,Py:()=>d,Vd:()=>m,bQ:()=>a,fp:()=>g,h3:()=>u,ks:()=>h,m:()=>p,ni:()=>b,oN:()=>c,pG:()=>v,tm:()=>y,uw:()=>i,vJ:()=>q});var s=r(8635),n=r(2380);function o(){let e="https://apakkhzuydsfzvypewwa.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Missing Supabase service configuration");return(0,n.eI)(e,t)}function i(e){let t="https://apakkhzuydsfzvypewwa.supabase.co",r="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYWtraHp1eWRzZnp2eXBld3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDEyODQsImV4cCI6MjA4NDA3NzI4NH0.c3hiZOEKMIXMP7aB0SVgrbQH58nwxseycVmeH23KsNQ";if(!t||!r)throw Error("Missing Supabase configuration");let s=e.headers.get("Authorization");return(0,n.eI)(t,r,{global:{headers:s?{Authorization:s}:{}}})}let a=o;async function u(e){try{let t=i(e),{data:{user:r},error:s}=await t.auth.getUser();if(s||!r)return{authenticated:!1,error:"Invalid or expired session"};let{data:n,error:o}=await t.from("users").select("id, role, class_id").eq("id",r.id).single();if(o||!n)return{authenticated:!1,error:"User profile not found"};return{authenticated:!0,userId:r.id,role:n.role,classId:n.class_id}}catch(e){return console.error("[AUTH] Validation error:",e instanceof Error?e.message:"Unknown"),{authenticated:!1,error:"Authentication failed"}}}async function l(e){let t=await u(e);if(t.authenticated)return"student"!==t.role?{authenticated:!1,error:"Student access required"}:t;try{let t=await e.clone().json(),r=t?.student_id;if(!r||!b(r))return{authenticated:!1,error:"Invalid or expired session"};let s=o(),{data:n,error:i}=await s.from("users").select("id, role, class_id").eq("id",r).eq("role","student").single();if(i||!n)return{authenticated:!1,error:"Student not found"};return{authenticated:!0,userId:n.id,role:"student",classId:n.class_id}}catch{return{authenticated:!1,error:"Authentication failed"}}}async function c(e,t){let r=await u(e);if(!r.authenticated)return r;if("teacher"===r.role){let s=i(e),{data:n}=await s.from("classes").select("id").eq("id",t).eq("teacher_id",r.userId).single();if(!n)return{authenticated:!1,error:"Not authorized for this class"}}else if(r.classId!==t)return{authenticated:!1,error:"Not authorized for this class"};return r}function p(e="Unauthorized"){return s.NextResponse.json({error:e},{status:401})}function d(e="Forbidden"){return s.NextResponse.json({error:e},{status:403})}function h(e){return s.NextResponse.json({error:e},{status:400})}function m(e="Internal server error"){return s.NextResponse.json({error:e},{status:500})}function f(e){return s.NextResponse.json({error:e},{status:503})}let w=new Map,g={ai:{windowMs:6e4,maxRequests:10},standard:{windowMs:6e4,maxRequests:60},write:{windowMs:6e4,maxRequests:30}};function x(e,t=g.standard){let r=Date.now();w.size>1e4&&w.forEach((e,t)=>{e.resetAt<r&&w.delete(t)});let s=w.get(e);return!s||s.resetAt<r?(w.set(e,{count:1,resetAt:r+t.windowMs}),{allowed:!0,remaining:t.maxRequests-1,resetIn:t.windowMs}):s.count>=t.maxRequests?{allowed:!1,remaining:0,resetIn:s.resetAt-r}:(s.count++,{allowed:!0,remaining:t.maxRequests-s.count,resetIn:s.resetAt-r})}function y(e){return s.NextResponse.json({error:"Too many requests. Please slow down."},{status:429,headers:{"Retry-After":String(Math.ceil(e/1e3)),"X-RateLimit-Reset":String(Math.ceil(e/1e3))}})}function b(e){return"string"==typeof e&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e)}function k(e,t=5e3){if("string"!=typeof e)return!1;let r=e.trim();return r.length>0&&r.length<=t}function v(e){return"string"==typeof e&&["do_now","scenario","challenge","exit_ticket"].includes(e)}function q(e){return e.replace(/<[^>]*>/g,"").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,"").trim()}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[469,16,654],()=>r(596));module.exports=s})();