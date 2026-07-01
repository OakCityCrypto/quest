import React, { useState, useEffect, useRef, useCallback } from "react";
import { PASSAGES } from "./passages.js";

/* ===========================================================================
   QUEST — offline build (Path A) with Model-B data capture
=========================================================================== */
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const today=()=>new Date().toISOString().slice(0,10);
const yesterday=()=>new Date(Date.now()-864e5).toISOString().slice(0,10);

/* -------- math generators (each tagged with a topic for analytics) -------- */
function gInteger(g){const r=g===6?12:g===7?20:40;const op=pick(["+","-","×"]);let a,b,ans;
 if(op==="×"){a=g===6?rand(2,9):rand(-12,12);b=g===6?rand(2,9):rand(-12,12);ans=a*b;}
 else{a=g===6?rand(2,r):rand(-r,r);b=g===6?rand(1,a):rand(-r,r);ans=op==="+"?a+b:a-b;}
 const f=n=>n<0?`(${n})`:`${n}`;return{topic:"integers",prompt:`${f(a)} ${op} ${f(b)} =`,answer:ans,tol:0.001,solution:`${f(a)} ${op} ${f(b)} = ${ans}`};}
function gOrder(g){const a=rand(2,9),b=rand(2,9),c=rand(2,6);
 if(g>=7&&Math.random()<.5){const ans=(a+b)*c;return{topic:"order of operations",prompt:`(${a} + ${b}) × ${c} =`,answer:ans,tol:0.001,solution:`(${a}+${b})=${a+b}; ×${c} = ${ans}`};}
 const ans=a+b*c;return{topic:"order of operations",prompt:`${a} + ${b} × ${c} =`,answer:ans,tol:0.001,solution:`${b}×${c}=${b*c}; +${a} = ${ans}`};}
function gFrac(){const d=pick([2,4,5,8,10,20,25]),n=rand(1,d-1);
 if(Math.random()<.5){const ans=n/d;return{topic:"fractions/decimals",prompt:`Write ${n}/${d} as a decimal.`,answer:ans,tol:0.001,solution:`${n} ÷ ${d} = ${ans}`};}
 const ans=n/d*100;return{topic:"fractions/percents",prompt:`Write ${n}/${d} as a percent (just the number).`,answer:ans,tol:0.01,solution:`${n}/${d} = ${n/d} = ${ans}%`};}
function gPercent(){if(Math.random()<.5){const p=pick([10,15,20,25,40,50,75]),n=pick([20,40,60,80,120,200]);const ans=p/100*n;
 return{topic:"percents",prompt:`What is ${p}% of ${n}?`,answer:ans,tol:0.01,solution:`${p/100} × ${n} = ${ans}`};}
 const p=pick([10,20,25,30,40,50]),n=pick([20,40,50,80,100,120]);const ans=n*(1-p/100);
 return{topic:"percents",prompt:`A $${n} item is ${p}% off. Sale price? (just the number)`,answer:ans,tol:0.01,solution:`discount=${p/100*n}; ${n}−${p/100*n}=${ans}`};}
function gProp(){const a=rand(2,6),b=rand(2,8),m=rand(2,5);const ans=a*m;
 return{topic:"proportions",prompt:`Solve for x:  ${a}/${b} = x/${b*m}`,answer:ans,tol:0.001,solution:`${b}×${m}=${b*m}, so x=${a}×${m}=${ans}`};}
function gEq(g){const x=rand(-8,9);
 if(g===6){if(Math.random()<.5){const b=rand(1,20),c=x+b;return{topic:"equations",prompt:`Solve:  n + ${b} = ${c}`,answer:x,tol:0.001,solution:`n = ${c} − ${b} = ${x}`};}
  const a=rand(2,6),c=a*Math.abs(x);return{topic:"equations",prompt:`Solve:  ${a}n = ${c}`,answer:Math.abs(x),tol:0.001,solution:`n = ${c} ÷ ${a} = ${Math.abs(x)}`};}
 if(g===8&&Math.random()<.4){const a=rand(3,6),c=rand(1,a-1),b=rand(-6,6);const d=(a-c)*x+b;
  return{topic:"equations",prompt:`Solve:  ${a}n + ${b} = ${c}n + ${d}`,answer:x,tol:0.001,solution:`${a-c}n = ${d-b}; n = ${x}`};}
 const a=rand(2,6),b=rand(-10,10),c=a*x+b,bs=b<0?`− ${-b}`:`+ ${b}`;
 return{topic:"equations",prompt:`Solve:  ${a}n ${bs} = ${c}`,answer:x,tol:0.001,solution:`${a}n = ${c-b}; n = ${x}`};}
function gGeo(g){const k=pick(g===6?["rA","rP","tA"]:g===7?["rA","tA","cA","cC","v"]:["cA","cC","v","py","tA"]);
 if(k==="rA"){const l=rand(3,14),w=rand(2,12);return{topic:"geometry",prompt:`Area of a rectangle ${l} by ${w}?`,answer:l*w,tol:0.001,solution:`${l}×${w}=${l*w}`};}
 if(k==="rP"){const l=rand(3,14),w=rand(2,12);return{topic:"geometry",prompt:`Perimeter of a rectangle ${l} by ${w}?`,answer:2*(l+w),tol:0.001,solution:`2(${l}+${w})=${2*(l+w)}`};}
 if(k==="tA"){let b=rand(3,12),h=rand(2,12);if((b*h)%2)b+=1;return{topic:"geometry",prompt:`Area of a triangle, base ${b}, height ${h}?`,answer:b*h/2,tol:0.001,solution:`½×${b}×${h}=${b*h/2}`};}
 if(k==="cA"){const r=rand(2,9);return{topic:"geometry",prompt:`Area of a circle, radius ${r}? (use 3.14)`,answer:3.14*r*r,tol:0.6,solution:`3.14×${r}²=${(3.14*r*r).toFixed(2)}`};}
 if(k==="cC"){const r=rand(2,9);return{topic:"geometry",prompt:`Circumference, radius ${r}? (use 3.14)`,answer:2*3.14*r,tol:0.6,solution:`2×3.14×${r}=${(2*3.14*r).toFixed(2)}`};}
 if(k==="v"){const l=rand(2,8),w=rand(2,8),h=rand(2,8);return{topic:"geometry",prompt:`Volume of a box ${l}×${w}×${h}?`,answer:l*w*h,tol:0.001,solution:`${l}×${w}×${h}=${l*w*h}`};}
 const t=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15]]);
 return{topic:"geometry",prompt:`Right triangle, legs ${t[0]} and ${t[1]}. Hypotenuse?`,answer:t[2],tol:0.01,solution:`${t[0]}²+${t[1]}²=${t[0]**2+t[1]**2}; c=${t[2]}`};}
function gExp(){if(Math.random()<.5){const b=rand(2,6),e=rand(2,3);return{topic:"exponents",prompt:`Evaluate:  ${b}^${e}`,answer:b**e,tol:0.001,solution:`${Array(e).fill(b).join("×")}=${b**e}`};}
 const r=rand(4,12);return{topic:"exponents",prompt:`Evaluate:  √${r*r}`,answer:r,tol:0.001,solution:`${r}×${r}=${r*r}`};}
function gWord(){return pick([
 ()=>{const n=pick([3,4,5,6]),c=n*pick([2,3,4]),q=pick([8,10,12]);return{topic:"word problems",prompt:`${n} notebooks cost $${c}. How much for ${q}?`,answer:c/n*q,tol:0.01,solution:`$${c}÷${n}=$${c/n}; ×${q}=$${c/n*q}`};},
 ()=>{const m=pick([120,150,180,200]),h=pick([2,3]);return{topic:"word problems",prompt:`A car goes ${m} miles in ${h} hours. Speed (mph)?`,answer:m/h,tol:0.01,solution:`${m}÷${h}=${m/h} mph`};},
 ()=>{const t=pick([24,30,36,40]),p=pick([25,50,75]);return{topic:"word problems",prompt:`${p}% of ${t} students walk. How many?`,answer:p/100*t,tol:0.01,solution:`${p/100}×${t}=${p/100*t}`};},
])();}
/* Each generator's topic tag(s), for adaptive weighting against captured accuracy.
   Paired explicitly (not by function.name) because minifiers rename function identifiers. */
const GEN_TOPICS=[[gInteger,["integers"]],[gOrder,["order of operations"]],[gFrac,["fractions/decimals","fractions/percents"]],[gPercent,["percents"]],[gProp,["proportions"]],[gEq,["equations"]],[gGeo,["geometry"]],[gExp,["exponents"]],[gWord,["word problems"]]];
function topicsFor(fn){const hit=GEN_TOPICS.find(([f])=>f===fn);return hit?hit[1]:[];}
function weightedPick(pool,topicAcc){
 const weights=pool.map(fn=>{
  const topics=topicsFor(fn);
  if(!topics.length)return 1;
  const accs=topics.map(t=>topicAcc[t]).filter(a=>a!=null);
  if(!accs.length)return 1;
  const worst=Math.min(...accs);
  return 1+Math.max(0,0.7-worst)*3; // below 70% accuracy → up to 4x more likely to appear
 });
 const total=weights.reduce((a,b)=>a+b,0);
 let r=Math.random()*total;
 for(let i=0;i<pool.length;i++){r-=weights[i];if(r<=0)return pool[i];}
 return pool[pool.length-1];
}
function buildMath(g,count=10,topicAcc={}){const pool=g===6?[gInteger,gOrder,gFrac,gPercent,gProp,gEq,gGeo,gWord]:g===7?[gInteger,gOrder,gFrac,gPercent,gProp,gEq,gGeo,gWord]:[gInteger,gOrder,gFrac,gPercent,gProp,gEq,gGeo,gExp,gWord];
 const out=[],seen=new Set();let guard=0;
 while(out.length<count&&guard<200){guard++;const p=weightedPick(pool,topicAcc)(g);if(seen.has(p.prompt))continue;seen.add(p.prompt);out.push({id:out.length,...p});}return out;}
function checkMath(p,raw){if(raw==null)return false;let s=String(raw).trim().replace(/[%$,]/g,"");if(!s)return false;let num;
 if(s.includes("/")){const[a,b]=s.split("/").map(parseFloat);if(!isFinite(a)||!isFinite(b)||!b)return false;num=a/b;}else num=parseFloat(s);
 if(!isFinite(num))return false;return Math.abs(num-p.answer)<=(p.tol??0.01);}

/* -------- reading from the offline bank, tuned to Lexile, avoiding repeats -------- */
function chooseReading(lexile,recent){
 let c=PASSAGES.filter(p=>Math.abs(p.lexile-lexile)<=70&&!recent.includes(p.title));
 if(!c.length)c=PASSAGES.filter(p=>!recent.includes(p.title));
 if(!c.length)c=PASSAGES;
 return pick(c);
}
const RQTYPE=(i,total)=>(total>=5?["main idea","detail","vocabulary","vocabulary","inference"]:["main idea","detail","vocabulary","inference"])[i]||"other";

/* -------- motivation -------- */
const MOT={
 champion:{label:"Champion",emoji:"🏆",blurb:"You love leveling up and beating your own best.",reward:"Every session pushes your level higher. Beat your best for bonus rewards."},
 collector:{label:"Collector",emoji:"🎖️",blurb:"You love earning badges and filling collections.",reward:"Earn badges for streaks, perfect scores, and milestones."},
 designer:{label:"Designer",emoji:"🛠️",blurb:"You love upgrading your gear and making it yours.",reward:"Spend coins to upgrade your avatar, colors, and paint job."},
 earner:{label:"Earner",emoji:"💰",blurb:"You love turning effort into real rewards.",reward:"Coins convert to real rewards your parent set up."},
 explorer:{label:"Explorer",emoji:"🎁",blurb:"You love surprises and never knowing what's next.",reward:"Finish a day to open a mystery box."},
 star:{label:"Star",emoji:"⭐",blurb:"You love showing what you can do.",reward:"Earn share cards from your best days."},
};
const QUIZ=[
 {q:"When you beat a hard video-game level, the best part is…",a:[["Seeing a high score with my name","champion"],["Unlocking a new item or character","designer"],["Getting to the next world","explorer"],["Showing someone what I did","star"]]},
 {q:"If you earned points, you'd most want to spend them on…",a:[["Real rewards — screen time, treats, money","earner"],["Gear to customize my avatar","designer"],["Badges and trophies to collect","collector"],["Surprise mystery boxes","explorer"]]},
 {q:"Which sounds most fun?",a:[["Beating my own best every day","champion"],["Filling up a whole collection","collector"],["Designing my own look","designer"],["Never knowing what I'll get","explorer"]]},
 {q:"What makes you keep going?",a:[["Leveling up and getting stronger","champion"],["Earning something I actually want","earner"],["People noticing I'm good","star"],["It keeps surprising me","explorer"]]},
 {q:"Pick your vibe:",a:[["Champion 🏆","champion"],["Collector 🎖️","collector"],["Designer 🛠️","designer"],["Treasure hunter 🎁","explorer"]]},
];
const FACES=["🔥","⚡","🐺","🤘","💀","🐉","🦇","🎸","🏍️","⚙️","🦈","🦁","🐯","🤖","👾","🚀"];
const FREE_FACES=["🔥","⚡","🐺","🤘"];
const COLORS=["#7c5cff","#ff1744","#26c6da","#ffb020","#39ff14","#ff7043","#5c6bc0","#b0bec5"];
const FREE_COLORS=["#7c5cff","#39ff14","#ff1744"];
const THEMES=[{id:"violet",label:"Voltage",a:"#7c5cff",a2:"#22d3ee",cost:0},{id:"sunset",label:"Redline",a:"#ff1744",a2:"#ff6d00",cost:40},{id:"mint",label:"Circuit",a:"#00e5ff",a2:"#39ff14",cost:40},{id:"ember",label:"Rust",a:"#ff6d00",a2:"#ffab00",cost:60},{id:"galaxy",label:"Static",a:"#7c3aed",a2:"#ec4899",cost:80}];
const READING_LEVELS=[{id:830,label:"Building",sub:"≈830L · his level now"},{id:925,label:"On grade 6",sub:"≈925L · the goal"},{id:1010,label:"Stretch",sub:"≈1010L"}];
const BADGES=[
 {id:"first",emoji:"🏁",label:"First Day",test:p=>p.totalDays>=1,progress:p=>[Math.min(p.totalDays,1),1]},
 {id:"s3",emoji:"🔥",label:"3-Day Streak",test:p=>p.streak>=3,progress:p=>[Math.min(p.streak,3),3]},
 {id:"s7",emoji:"⚔️",label:"7-Day Streak",test:p=>p.streak>=7,progress:p=>[Math.min(p.streak,7),7]},
 {id:"s14",emoji:"⚡",label:"14-Day Streak",test:p=>p.streak>=14,progress:p=>[Math.min(p.streak,14),14]},
 {id:"reader",emoji:"📚",label:"Bookworm (10 readings)",test:p=>p.readCount>=10,progress:p=>[Math.min(p.readCount,10),10]},
 {id:"perfect",emoji:"🎯",label:"Perfect Math",test:p=>p.perfectCount>=1,progress:p=>[Math.min(p.perfectCount,1),1]},
 {id:"clean",emoji:"✅",label:"7 School-work Days",test:p=>p.swStreak>=7||p.swCount>=7,progress:p=>[Math.min(Math.max(p.swStreak,p.swCount),7),7]},
 {id:"ten",emoji:"🏅",label:"10 Days Logged",test:p=>p.totalDays>=10,progress:p=>[Math.min(p.totalDays,10),10]},
];
const DEFAULT_STORE=[{id:"r1",emoji:"📱",label:"30 min screen time",cost:50},{id:"r2",emoji:"🎮",label:"1 hour gaming",cost:80},{id:"r3",emoji:"🍦",label:"Ice-cream trip",cost:120},{id:"r4",emoji:"💵",label:"$5 allowance",cost:150}];

async function load(key,def){try{if(typeof window!=="undefined"&&window.storage){const r=await window.storage.get(key);if(r&&r.value)return JSON.parse(r.value);}else if(typeof localStorage!=="undefined"){const v=localStorage.getItem(key);if(v)return JSON.parse(v);}}catch(e){}return def;}
function save(key,val){try{if(typeof window!=="undefined"&&window.storage){window.storage.set(key,JSON.stringify(val),false);}else if(typeof localStorage!=="undefined"){localStorage.setItem(key,JSON.stringify(val));}}catch(e){}}

const DEFAULT_PROGRESS={xp:0,coins:0,streak:0,lastDate:null,totalDays:0,perfectCount:0,bestMath:0,bestReadScore:0,readCount:0,recentReads:[],swLastDate:null,swStreak:0,swCount:0,swLog:[],badges:[],unlockFaces:[...FREE_FACES],unlockColors:[...FREE_COLORS],unlockThemes:["violet"],theme:"violet",redemptions:[],shareCards:[],
 extraSetsCount:0,coinsEarnedTotal:0,coinsSpentTotal:0,storeVisits:0,badgeVisits:0,avatarVisits:0,themeVisits:0,shareVisits:0,boxOpenDelays:[],soundOn:false,useBlended:false};

/* -------- turning what he DOES (not just the quiz) into a motivation signal --------
   Quiz gives a declared type on day 1. From there we watch behavior — how fast he
   opens mystery boxes, whether he lingers in the store vs. the badge case, whether he
   grinds extra sets — and blend it in only if a parent opts in (see Parent tab). */
function findNextBadge(prog){
 const locked=BADGES.filter(b=>!prog.badges.includes(b.id));
 if(!locked.length)return null;
 return locked.map(b=>{const[v,t]=b.progress(prog);return{...b,value:v,target:t,frac:t?v/t:0};}).sort((a,b)=>b.frac-a.frac)[0];
}
function findNextReward(store,coins){
 const locked=(store||[]).filter(it=>it.cost>coins);
 if(!locked.length)return null;
 return locked.map(it=>({...it,gap:it.cost-coins,frac:it.cost?coins/it.cost:0})).sort((a,b)=>a.gap-b.gap)[0];
}
function normalizeVec(v){const sum=Object.values(v).reduce((a,b)=>a+b,0)||1;const o={};for(const k in v)o[k]=v[k]/sum;return o;}
function behaviorRaw(prog){
 const earned=prog.coinsEarnedTotal||0,spent=prog.coinsSpentTotal||0;
 const spendRatio=earned>0?Math.min(1,spent/earned):0;
 const delays=prog.boxOpenDelays||[];
 const avgDelay=delays.length?delays.reduce((a,b)=>a+b,0)/delays.length:null;
 const speed=avgDelay==null?0:Math.max(0,1-Math.min(avgDelay,20000)/20000);
 return{
  champion:(prog.extraSetsCount||0)*1.5+(prog.perfectCount||0),
  collector:(prog.badgeVisits||0)*1.5+(prog.badges?prog.badges.length:0),
  designer:(prog.avatarVisits||0)+(prog.themeVisits||0)+Math.max(0,(prog.unlockFaces?prog.unlockFaces.length:4)-4)+Math.max(0,(prog.unlockColors?prog.unlockColors.length:3)-3),
  earner:(prog.storeVisits||0)*1.5+(prog.redemptions?prog.redemptions.length:0)*2+spendRatio*3,
  explorer:speed*4+(prog.extraSetsCount||0)*0.5,
  star:(prog.shareVisits||0)*1.5+(prog.shareCards?prog.shareCards.length:0)*2,
 };
}
function observedMotivator(profile,prog){
 if(!prog||(prog.totalDays||0)<5)return null;
 const quiz=normalizeVec(profile.quizScores||{champion:1,collector:1,designer:1,earner:1,explorer:1,star:1});
 const behavior=normalizeVec(behaviorRaw(prog));
 const combo={};for(const k in quiz)combo[k]=quiz[k]*0.6+(behavior[k]||0)*0.4;
 return Object.entries(combo).sort((a,b)=>b[1]-a[1])[0][0];
}
function effectiveMotivator(profile,prog){
 if(prog&&prog.useBlended){const o=observedMotivator(profile,prog);if(o)return o;}
 return profile.motivator;
}
const REASON={
 champion:"He does extra practice sets and racks up perfect scores.",
 collector:"He checks his badges often and keeps collecting them.",
 designer:"He spends time customizing his avatar and themes.",
 earner:"He visits the reward store often and cashes in coins quickly.",
 explorer:"He opens mystery boxes right away, chasing the surprise.",
 star:"He revisits his share cards.",
};
function chime(kind){
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
  const ctx=new Ctx();const o=ctx.createOscillator();const g=ctx.createGain();o.type="sine";
  const freqs=kind==="day"?[523.25,659.25,783.99]:kind==="badge"?[783.99,987.77]:[659.25];
  g.gain.setValueAtTime(0.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.15,ctx.currentTime+0.02);
  o.connect(g);g.connect(ctx.destination);o.frequency.value=freqs[0];o.start();
  const t=ctx.currentTime;freqs.forEach((f,i)=>o.frequency.setValueAtTime(f,t+i*0.12));
  g.gain.exponentialRampToValueAtTime(0.0001,t+freqs.length*0.12+0.25);o.stop(t+freqs.length*0.12+0.3);
  setTimeout(()=>ctx.close(),freqs.length*150+400);
 }catch(e){}
}

function Avatar({face,color,size=44}){return <div className="avatar" style={{width:size,height:size,background:color,fontSize:size*0.55}}>{face}</div>;}
function Timer({minutes=20}){const[s,setS]=useState(minutes*60);const[run,setRun]=useState(false);const ref=useRef(null);
 useEffect(()=>{if(run){ref.current=setInterval(()=>setS(x=>x<=1?0:x-1),1000);return()=>clearInterval(ref.current);}},[run]);
 useEffect(()=>{if(s===0)setRun(false);},[s]);
 const mm=String(Math.floor(s/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");
 return <button className="timer" onClick={()=>setRun(r=>!r)}>{run?"⏸":"▶"} {mm}:{ss}</button>;}

export default function Quest(){
 const[ready,setReady]=useState(false);
 const[profile,setProfile]=useState(null);
 const[prog,setProg]=useState(DEFAULT_PROGRESS);
 const[store,setStore]=useState(DEFAULT_STORE);
 const[events,setEvents]=useState([]);
 const[screen,setScreen]=useState("home");
 const[dayKey,setDayKey]=useState(0);

 const[math,setMath]=useState([]);const[mathAns,setMathAns]=useState({});const[mathChecked,setMathChecked]=useState(false);const[showSol,setShowSol]=useState({});const[mathDone,setMathDone]=useState(false);
 const[reading,setReading]=useState(null);const[mcPick,setMcPick]=useState({});const[readChecked,setReadChecked]=useState(false);const[readDone,setReadDone]=useState(false);
 const[sw,setSw]=useState({portal:false,homework:false,note:""});
 const[completedToday,setCompletedToday]=useState(false);
 const[celebrate,setCelebrate]=useState(null);const[toast,setToast]=useState(null);
 const readStart=useRef(0),mathStart=useRef(0);
 const pbRef=useRef({math:false,read:false});
 const eventsRef=useRef([]);
 useEffect(()=>{eventsRef.current=events;},[events]);

 const level=Math.floor(prog.xp/100)+1, xpInto=prog.xp%100;
 const theme=THEMES.find(t=>t.id===prog.theme)||THEMES[0];
 const swDoneToday=prog.swLastDate===today();

 useEffect(()=>{(async()=>{
  setProfile(await load("quest:profile",null));
  const pr=await load("quest:prog",DEFAULT_PROGRESS);setProg({...DEFAULT_PROGRESS,...pr});
  setStore(await load("quest:store",DEFAULT_STORE));
  setEvents(await load("quest:events",[]));
  if(pr&&pr.lastDate===today())setCompletedToday(true);
  setReady(true);
 })();},[]);
 useEffect(()=>{if(ready)save("quest:prog",prog);},[prog,ready]);
 useEffect(()=>{if(ready&&profile)save("quest:profile",profile);},[profile,ready]);
 useEffect(()=>{if(ready)save("quest:store",store);},[store,ready]);
 useEffect(()=>{if(ready)save("quest:events",events);},[events,ready]);

 function logEvent(ev){setEvents(e=>[...e,{ts:Date.now(),date:today(),...ev}].slice(-1500));}

 function mathTopicAccuracy(evs){
  const agg={};
  evs.forEach(e=>{if(e.type==="math")e.perProblem?.forEach(p=>{const t=agg[p.topic]||(agg[p.topic]={c:0,n:0});t.n++;if(p.correct)t.c++;});});
  const out={};for(const t in agg)if(agg[t].n>=3)out[t]=agg[t].c/agg[t].n; // ignore topics with too little data to be reliable
  return out;
 }

 const regen=useCallback(()=>{
  if(!profile)return;
  setMath(buildMath(profile.mathGrade,10,mathTopicAccuracy(eventsRef.current)));
  setMathAns({});setMathChecked(false);setShowSol({});setMathDone(false);
  setMcPick({});setReadChecked(false);setReadDone(false);
  setSw({portal:false,homework:false,note:""});
  pbRef.current={math:false,read:false};
  const r=chooseReading(profile.lexile,prog.recentReads||[]);
  setReading(r);
  setProg(p=>({...p,recentReads:[r.title,...(p.recentReads||[])].slice(0,8)}));
 },[profile]); // eslint-disable-line
 useEffect(()=>{if(ready&&profile)regen();},[ready,profile?.mathGrade,profile?.lexile,dayKey]); // eslint-disable-line
 useEffect(()=>{if(screen==="reading"&&!readStart.current)readStart.current=Date.now();if(screen==="math"&&!mathStart.current)mathStart.current=Date.now();},[screen]);

 useEffect(()=>{const earned=BADGES.filter(b=>b.test(prog)).map(b=>b.id);const miss=earned.filter(id=>!prog.badges.includes(id));if(miss.length)setProg(p=>({...p,badges:[...p.badges,...miss]}));},[prog.totalDays,prog.streak,prog.perfectCount,prog.readCount,prog.swStreak,prog.swCount]); // eslint-disable-line

 function finishReading(){if(readDone||!reading)return;setReadDone(true);
  const per=reading.mc.map((q,i)=>({idx:i,type:RQTYPE(i,reading.mc.length),q:q.q,chosen:mcPick[i]??null,answer:q.answer,correct:mcPick[i]===q.answer}));
  const score=per.filter(x=>x.correct).length;
  const newBestRead=score>(prog.bestReadScore||0);
  if(newBestRead)pbRef.current.read=true;
  logEvent({type:"reading",lexile:reading.lexile,genre:reading.genre,title:reading.title,score,total:reading.mc.length,
   ms:readStart.current?Date.now()-readStart.current:null,perQuestion:per,open:{q:reading.open.q,answer:(mcPick.open||"").trim()}});
  readStart.current=0;
  setProg(p=>({...p,xp:p.xp+35,coins:p.coins+15,coinsEarnedTotal:(p.coinsEarnedTotal||0)+15,readCount:p.readCount+1,bestReadScore:Math.max(p.bestReadScore||0,score)}));
  flashToast("Reading done · +35 XP · +15 🪙");}

 function finishMath(){if(mathDone)return;
  const per=math.map(p=>({topic:p.topic,prompt:p.prompt,answer:mathAns[p.id]??null,correct:checkMath(p,mathAns[p.id])}));
  const score=per.filter(x=>x.correct).length,perfect=score===math.length,newBest=score>prog.bestMath;
  if(newBest)pbRef.current.math=true;
  let xp=25,coins=10,extra="";if(perfect){xp+=15;coins+=10;extra=" · PERFECT! +15 XP";}if(newBest)coins+=10;
  logEvent({type:"math",score,total:math.length,perfect,ms:mathStart.current?Date.now()-mathStart.current:null,perProblem:per});
  mathStart.current=0;
  setProg(p=>({...p,xp:p.xp+xp,coins:p.coins+coins,coinsEarnedTotal:(p.coinsEarnedTotal||0)+coins,perfectCount:p.perfectCount+(perfect?1:0),bestMath:Math.max(p.bestMath,score)}));
  setMathDone(true);
  flashToast(`Math ${score}/${math.length}${extra}${newBest?" · NEW BEST! +10 🪙":""}`);}

 function finishSchoolwork(){if(swDoneToday)return;if(!sw.portal||!sw.homework){flashToast("Check both boxes first");return;}
  const last=prog.swLastDate,nextStreak=last===yesterday()?prog.swStreak+1:1;
  logEvent({type:"schoolwork",missing:!!sw.note.trim(),note:sw.note||"All clear",streak:nextStreak});
  setProg(p=>({...p,xp:p.xp+20,coins:p.coins+15,coinsEarnedTotal:(p.coinsEarnedTotal||0)+15,swLastDate:today(),swStreak:nextStreak,swCount:p.swCount+1,swLog:[{date:today(),note:sw.note||"All clear",missing:!!sw.note.trim()},...p.swLog].slice(0,40)}));
  flashToast("School work logged · +20 XP · +15 🪙");setScreen("home");}

 useEffect(()=>{if(readDone&&mathDone&&!completedToday){setCompletedToday(true);
  const last=prog.lastDate,nextStreak=last===yesterday()?prog.streak+1:(last===today()?prog.streak:1);
  const dayXp=20,dayCoins=15+Math.min(nextStreak*2,20),box=rollBox(),before=prog.badges;
  const eff=effectiveMotivator(profile,prog);
  const bonusBox=eff==="explorer"&&Math.random()<0.2?rollBox():null;
  setProg(p=>{
   let np={...p,xp:p.xp+dayXp,coins:p.coins+dayCoins,coinsEarnedTotal:(p.coinsEarnedTotal||0)+dayCoins,streak:nextStreak,lastDate:today(),totalDays:p.totalDays+1};
   np=applyBox(np,box);if(box.t==="coins")np={...np,coinsEarnedTotal:(np.coinsEarnedTotal||0)+box.v};
   if(bonusBox){np=applyBox(np,bonusBox);if(bonusBox.t==="coins")np={...np,coinsEarnedTotal:(np.coinsEarnedTotal||0)+bonusBox.v};}
   return np;
  });
  logEvent({type:"day_complete",streak:nextStreak,allThree:swDoneToday,bonus:!!bonusBox});
  const projected={...prog,streak:nextStreak,totalDays:prog.totalDays+1,xp:prog.xp+dayXp};
  const newBadges=BADGES.filter(b=>b.test(projected)&&!before.includes(b.id));
  if(eff==="star")setProg(p=>({...p,shareCards:[...p.shareCards,{date:today(),streak:nextStreak,level:Math.floor(p.xp/100)+1}]}));
  if(prog.soundOn){chime("day");if(newBadges.length)setTimeout(()=>chime("badge"),350);}
  setCelebrate({xp:dayXp,coins:dayCoins,newBadges,box,bonusBox,streak:nextStreak,allThree:swDoneToday,emphasis:eff,pb:{...pbRef.current}});
  pbRef.current={math:false,read:false};
 }},[readDone,mathDone]); // eslint-disable-line

 function rollBox(){return pick([{t:"coins",v:10},{t:"coins",v:20},{t:"coins",v:30},{t:"face"},{t:"theme"},{t:"color"}]);}
 function applyBox(p,box){if(box.t==="coins")return{...p,coins:p.coins+box.v};
  if(box.t==="face"){const l=FACES.filter(f=>!p.unlockFaces.includes(f));if(l.length){box.label=pick(l);return{...p,unlockFaces:[...p.unlockFaces,box.label]};}box.t="coins";box.v=20;return{...p,coins:p.coins+20};}
  if(box.t==="color"){const l=COLORS.filter(c=>!p.unlockColors.includes(c));if(l.length){box.label=pick(l);return{...p,unlockColors:[...p.unlockColors,box.label]};}box.t="coins";box.v=20;return{...p,coins:p.coins+20};}
  if(box.t==="theme"){const l=THEMES.filter(t=>!p.unlockThemes.includes(t.id));if(l.length){const th=pick(l);box.label=th.label;return{...p,unlockThemes:[...p.unlockThemes,th.id]};}box.t="coins";box.v=20;return{...p,coins:p.coins+20};}
  return p;}
 function flashToast(m){setToast(m);setTimeout(()=>setToast(null),2600);}
 function buyFace(f){if(prog.unlockFaces.includes(f)){setProfile({...profile,avatar:{...profile.avatar,face:f}});return;}if(prog.coins<20){flashToast("Need 20 🪙");return;}setProg(p=>({...p,coins:p.coins-20,coinsSpentTotal:(p.coinsSpentTotal||0)+20,unlockFaces:[...p.unlockFaces,f]}));setProfile({...profile,avatar:{...profile.avatar,face:f}});flashToast("Unlocked! −20 🪙");}
 function buyColor(c){if(prog.unlockColors.includes(c)){setProfile({...profile,avatar:{...profile.avatar,color:c}});return;}if(prog.coins<15){flashToast("Need 15 🪙");return;}setProg(p=>({...p,coins:p.coins-15,coinsSpentTotal:(p.coinsSpentTotal||0)+15,unlockColors:[...p.unlockColors,c]}));setProfile({...profile,avatar:{...profile.avatar,color:c}});flashToast("Unlocked! −15 🪙");}
 function buyTheme(t){if(prog.unlockThemes.includes(t.id)){setProg(p=>({...p,theme:t.id}));return;}if(prog.coins<t.cost){flashToast(`Need ${t.cost} 🪙`);return;}setProg(p=>({...p,coins:p.coins-t.cost,coinsSpentTotal:(p.coinsSpentTotal||0)+t.cost,unlockThemes:[...p.unlockThemes,t.id],theme:t.id}));flashToast("Theme unlocked!");}
 function redeem(it){if(prog.coins<it.cost){flashToast(`Need ${it.cost} 🪙`);return;}logEvent({type:"redeem",item:it.label,cost:it.cost});setProg(p=>({...p,coins:p.coins-it.cost,coinsSpentTotal:(p.coinsSpentTotal||0)+it.cost,redemptions:[{...it,date:today(),claimed:false},...p.redemptions]}));flashToast(`Redeemed: ${it.label}`);}

 if(!ready)return <><InstallBanner/><div className="boot" style={{"--accent":THEMES[0].a}}><div className="boot-in">Loading…</div></div></>;
 if(!profile)return <><InstallBanner/><Onboarding onDone={pf=>setProfile(pf)}/></>;
 const rootStyle={"--accent":theme.a,"--accent2":theme.a2};

 return(<><InstallBanner/><div className="app" style={rootStyle}>
  <header className="top">
   <button className="who" onClick={()=>setScreen("rewards")}><Avatar face={profile.avatar.face} color={profile.avatar.color} size={40}/>
    <div className="who-txt"><span className="who-name">{profile.name}</span><span className="who-mot">{MOT[profile.motivator].emoji} {MOT[profile.motivator].label}</span></div></button>
   <div className="top-stats"><span className="coinpill">🪙 {prog.coins}</span><span className="streakpill">🔥 {prog.streak}</span></div>
  </header>
  <div className="lvlbar"><span className="lvl">LV {level}</span><div className="xptrack"><div className="xpfill" style={{width:`${xpInto}%`}}/></div><span className="xpnum">{xpInto}/100</span></div>
  <main className="scroll">
   {screen==="home"&&<Home {...{profile,prog,level,readDone,mathDone,swDoneToday,setScreen,setDayKey,setProg}}/>}
   {screen==="reading"&&<Reading {...{reading,mcPick,setMcPick,readChecked,setReadChecked,readDone,finishReading,setScreen}}/>}
   {screen==="math"&&<Math2 {...{math,mathAns,setMathAns,mathChecked,setMathChecked,showSol,setShowSol,mathDone,finishMath,setScreen}}/>}
   {screen==="school"&&<School {...{sw,setSw,swDoneToday,finishSchoolwork,setScreen,portalUrl:profile.portalUrl,prog}}/>}
   {screen==="rewards"&&<Rewards {...{profile,prog,store,buyFace,buyColor,buyTheme,redeem,level,setProg}}/>}
   {screen==="parent"&&<Parent {...{profile,setProfile,store,setStore,prog,setProg,events,setEvents,flashToast}}/>}
  </main>
  <nav className="tabbar">{[["home","🏠","Today"],["rewards",MOT[profile.motivator].emoji,"Rewards"],["parent","⚙️","Parent"]].map(([k,e,l])=>(
   <button key={k} className={`tabbtn ${screen===k?"on":""}`} onClick={()=>setScreen(k)}><span className="tabe">{e}</span><span className="tabl">{l}</span></button>))}</nav>
  {toast&&<div className="toast">{toast}</div>}
  {celebrate&&<Celebrate {...{celebrate,profile,prog,store,setProg,onClose:()=>setCelebrate(null)}}/>}
 </div></>);
}

function Onboarding({onDone}){
 const[step,setStep]=useState(0);const[scores,setScores]=useState({champion:0,collector:0,designer:0,earner:0,explorer:0,star:0});
 const[name,setName]=useState("");const[face,setFace]=useState("🔥");const[color,setColor]=useState("#39ff14");const total=QUIZ.length;
 const motivator=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
 return(<div className="app onb" style={{"--accent":"#7c5cff","--accent2":"#22d3ee"}}>
  {step<total&&(<div className="onb-card"><div className="onb-prog"><div style={{width:`${step/total*100}%`}}/></div>
   <p className="onb-step">Question {step+1} of {total}</p><h2 className="onb-q">{QUIZ[step].q}</h2>
   <div className="onb-opts">{QUIZ[step].a.map(([t,k],i)=>(<button key={i} className="onb-opt" onClick={()=>{setScores(s=>({...s,[k]:s[k]+1}));setStep(step+1);}}>{t}</button>))}</div></div>)}
  {step===total&&(<div className="onb-card"><div className="result-emoji">{MOT[motivator].emoji}</div><h2 className="onb-q center">You're a {MOT[motivator].label}!</h2>
   <p className="onb-blurb">{MOT[motivator].blurb}</p><p className="onb-reward">{MOT[motivator].reward}</p><button className="cta" onClick={()=>setStep(total+1)}>Set up my profile →</button></div>)}
  {step===total+1&&(<div className="onb-card"><h2 className="onb-q center">Make it yours</h2><div className="avatar-preview"><Avatar face={face} color={color} size={88}/></div>
   <input className="name-in" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} maxLength={14}/>
   <p className="pick-lbl">Pick a face</p><div className="pick-grid">{FREE_FACES.map(f=>(<button key={f} className={`pick-face ${face===f?"on":""}`} onClick={()=>setFace(f)}>{f}</button>))}</div>
   <p className="pick-lbl">Pick a color</p><div className="pick-grid">{FREE_COLORS.map(c=>(<button key={c} className={`pick-color ${color===c?"on":""}`} style={{background:c}} onClick={()=>setColor(c)}>{color===c?"✓":""}</button>))}</div>
   <button className="cta" disabled={!name.trim()} onClick={()=>onDone({setup:true,name:name.trim(),avatar:{face,color},motivator,quizScores:scores,mathGrade:7,lexile:830,portalUrl:""})}>Start →</button>
   <p className="onb-foot">A grown-up sets the exact reading & math level in the Parent tab.</p></div>)}
 </div>);
}

function Home({profile,prog,level,readDone,mathDone,swDoneToday,setScreen,setDayKey,setProg}){
 const emphasis=effectiveMotivator(profile,prog);
 const m=MOT[emphasis];
 const spot=emphasis==="champion"?`Level ${level} · best math ${prog.bestMath}/10`:emphasis==="collector"?`${prog.badges.length}/${BADGES.length} badges earned`:emphasis==="designer"?`${prog.coins} 🪙 to spend on gear`:emphasis==="earner"?`${prog.coins} 🪙 toward your rewards`:emphasis==="explorer"?`Finish today to open a mystery box`:`${prog.streak}-day streak — show it off`;
 return(<div className="page">
  <div className="hello"><h1>{greet()}, {profile.name}.</h1><p className="hello-sub">Reading is today's focus. Finish your missions.</p></div>
  <div className="spotlight"><span className="spot-emoji">{m.emoji}</span><div><div className="spot-title">{spot}</div><div className="spot-sub">{m.reward}</div></div></div>
  <button className={`mission read ${readDone?"done":""}`} onClick={()=>setScreen("reading")}>
   <div className="mi-top"><span className="mi-tag">📖 Reading <em className="prio">PRIORITY</em></span><span className="mi-time">20 min</span></div>
   <div className="mi-title">Today's passage + 5 questions</div><div className="mi-foot">{readDone?"Completed ✓":"+35 XP · +15 🪙"}<span className="mi-go">{readDone?"":"Start →"}</span></div></button>
  <button className={`mission school ${swDoneToday?"done":""}`} onClick={()=>setScreen("school")}>
   <div className="mi-top"><span className="mi-tag">📋 School Work</span><span className="mi-time">2 min</span></div>
   <div className="mi-title">Check grades · turn in everything</div><div className="mi-foot">{swDoneToday?"Logged ✓":"+20 XP · +15 🪙"}<span className="mi-go">{swDoneToday?"":"Check →"}</span></div></button>
  <button className={`mission math ${mathDone?"done":""}`} onClick={()=>setScreen("math")}>
   <div className="mi-top"><span className="mi-tag">🔢 Math</span><span className="mi-time">20 min</span></div>
   <div className="mi-title">10 fresh problems</div><div className="mi-foot">{mathDone?"Completed ✓":"+25 XP · +10 🪙 · perfect = bonus"}<span className="mi-go">{mathDone?"":"Start →"}</span></div></button>
  {readDone&&mathDone&&(<div className="day-done"><div className="dd-emoji">{swDoneToday?"🌟":"✅"}</div>
   <div className="dd-txt"><strong>{swDoneToday?"Perfect day — all 3!":"Day complete!"}</strong> {prog.totalDays} day{prog.totalDays===1?"":"s"} logged · {prog.streak}-day streak.</div>
   <button className="cta small" onClick={()=>{setProg(p=>({...p,extraSetsCount:(p.extraSetsCount||0)+1}));setDayKey(k=>k+1);setScreen("home");}}>New set (extra practice)</button></div>)}
 </div>);
}
function greet(){const h=new Date().getHours();return h<12?"Morning":h<18?"Afternoon":"Evening";}

function Reading({reading,mcPick,setMcPick,readChecked,setReadChecked,readDone,finishReading,setScreen}){
 const score=reading?reading.mc.reduce((n,q,i)=>n+(mcPick[i]===q.answer?1:0),0):0;
 const[speaking,setSpeaking]=useState(false);
 const canSpeak=typeof window!=="undefined"&&"speechSynthesis"in window;
 useEffect(()=>()=>{try{window.speechSynthesis.cancel();}catch(e){}},[]);
 useEffect(()=>{try{window.speechSynthesis.cancel();}catch(e){}setSpeaking(false);},[reading?.title]);
 function toggleSpeak(){
  if(!canSpeak||!reading)return;
  if(speaking){try{window.speechSynthesis.cancel();}catch(e){}setSpeaking(false);return;}
  try{
   const u=new SpeechSynthesisUtterance(`${reading.title}. ${reading.passage}`);
   u.rate=0.95;u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);
   window.speechSynthesis.cancel();window.speechSynthesis.speak(u);setSpeaking(true);
  }catch(e){}
 }
 return(<div className="page session"><div className="sess-head"><button className="back" onClick={()=>setScreen("home")}>← Today</button>
  <div className="sess-tools">{canSpeak&&<button className="back" onClick={toggleSpeak}>{speaking?"⏸ Stop":"🔊 Listen"}</button>}<Timer/></div></div>
  {reading&&<><div className="active-tip">📖 Read it twice. Find the main idea before you answer.</div>
   <div className="passage"><span className="genre">{reading.genre}</span><h2 className="ptitle">{reading.title}</h2><p className="ptext">{reading.passage}</p></div>
   {reading.mc.map((q,i)=>{const ch=mcPick[i];return(<div className="q" key={i}><p className="qtext"><b>{i+1}.</b> {q.q}</p>
    <div className="opts">{q.options.map((o,oi)=>{let c="opt";if(readChecked){if(oi===q.answer)c+=" ok";else if(ch===oi)c+=" no";}else if(ch===oi)c+=" sel";
     return <button key={oi} className={c} disabled={readChecked} onClick={()=>setMcPick({...mcPick,[i]:oi})}><span className="ol">{"ABCD"[oi]}</span>{o}</button>;})}</div>
    {readChecked&&<p className="why">{q.why}</p>}</div>);})}
   <div className="q"><p className="qtext"><b>{reading.mc.length+1}.</b> {reading.open.q}</p>
    <textarea className="open" rows={3} placeholder="Write a sentence or two…" value={mcPick.open||""} onChange={e=>setMcPick({...mcPick,open:e.target.value})}/>
    {readChecked&&<div className="model"><b>One strong answer:</b> {reading.open.model}</div>}</div></>}
  <div className="sticky-cta">{!readChecked?<button className="cta" onClick={()=>setReadChecked(true)}>Check answers</button>:
   readDone?<button className="cta done" onClick={()=>setScreen("home")}>Reading done ✓ · Back</button>:
   <button className="cta" onClick={()=>{finishReading();setScreen("home");}}>Got {score}/{reading.mc.length} · Claim reward →</button>}</div></div>);
}

function Math2({math,mathAns,setMathAns,mathChecked,setMathChecked,showSol,setShowSol,mathDone,finishMath,setScreen}){
 const score=math.reduce((n,p)=>n+(checkMath(p,mathAns[p.id])?1:0),0);
 return(<div className="page session"><div className="sess-head"><button className="back" onClick={()=>setScreen("home")}>← Today</button><Timer/></div>
  <div className="active-tip">🔢 Show your steps. Check each answer before moving on.</div>
  {math.map((p,i)=>{const ok=checkMath(p,mathAns[p.id]);const ans=mathAns[p.id]!=null&&String(mathAns[p.id]).trim()!=="";return(<div className="mrow" key={p.id}>
   <div className="mrow-main"><span className="mnum">{i+1}</span><span className="mprompt">{p.prompt}</span>
    <input className={`minput ${mathChecked?(ok?"ok":ans?"no":""):""}`} inputMode="decimal" value={mathAns[p.id]??""} disabled={mathChecked} onChange={e=>setMathAns({...mathAns,[p.id]:e.target.value})} placeholder="?"/>
    {mathChecked&&<span className="mmark">{ok?"✓":"✗"}</span>}</div>
   {mathChecked&&<button className="solbtn" onClick={()=>setShowSol({...showSol,[p.id]:!showSol[p.id]})}>{showSol[p.id]?"Hide":"How?"}</button>}
   {mathChecked&&showSol[p.id]&&<div className="msol">{p.solution}</div>}</div>);})}
  <div className="sticky-cta">{!mathChecked?<button className="cta" onClick={()=>setMathChecked(true)}>Check answers</button>:
   mathDone?<button className="cta done" onClick={()=>setScreen("home")}>Math done ✓ · Back</button>:
   <button className="cta" onClick={()=>{finishMath();setScreen("home");}}>Scored {score}/{math.length} · Claim reward →</button>}</div></div>);
}

function School({sw,setSw,swDoneToday,finishSchoolwork,setScreen,portalUrl,prog}){
 return(<div className="page session"><div className="sess-head"><button className="back" onClick={()=>setScreen("home")}>← Today</button><span className="streakpill">📋 {prog.swStreak} day</span></div>
  <h1 className="rw-title">School Work Check</h1><p className="store-intro">Two minutes that fix grades faster than anything else: know what's due, and turn it all in.</p>
  {portalUrl?<a className="portal-btn" href={portalUrl} target="_blank" rel="noreferrer">🔗 Open my grades portal</a>:<div className="portal-missing">Ask a parent to add your grades-portal link in the Parent tab.</div>}
  {swDoneToday?<div className="sw-done">✅ Logged for today — nice work. Come back tomorrow.</div>:<>
   <button className={`checkrow ${sw.portal?"on":""}`} onClick={()=>setSw({...sw,portal:!sw.portal})}><span className="cbox">{sw.portal?"✓":""}</span><span>I checked the portal for <b>missing or late</b> work</span></button>
   <button className={`checkrow ${sw.homework?"on":""}`} onClick={()=>setSw({...sw,homework:!sw.homework})}><span className="cbox">{sw.homework?"✓":""}</span><span>I did and <b>turned in</b> everything due today</span></button>
   <p className="pick-lbl">Anything still missing? (write it down so it doesn't get lost)</p>
   <textarea className="open" rows={2} placeholder="e.g. Science lab from Tuesday — turning in tomorrow" value={sw.note} onChange={e=>setSw({...sw,note:e.target.value})}/>
   <div className="sticky-cta"><button className="cta" disabled={!sw.portal||!sw.homework} onClick={finishSchoolwork}>Log school work · +20 XP · +15 🪙</button></div></>}
 </div>);
}

function Rewards({profile,prog,store,buyFace,buyColor,buyTheme,redeem,level,setProg}){
 const m=effectiveMotivator(profile,prog);
 const order=m==="collector"?["badges","avatar","themes","store"]:m==="designer"?["avatar","themes","badges","store"]:m==="earner"?["store","badges","avatar","themes"]:m==="star"?["share","badges","avatar","themes"]:["progress","badges","avatar","themes"];
 const[view,setView]=useState(order[0]);const labels={progress:"Progress",badges:"Badges",avatar:"Avatar",themes:"Themes",store:"Rewards",share:"Share"};const tabs=[...new Set([...order,"store"])];
 function selectView(t){setView(t);const map={store:"storeVisits",badges:"badgeVisits",avatar:"avatarVisits",themes:"themeVisits",share:"shareVisits"};if(map[t])setProg(p=>({...p,[map[t]]:(p[map[t]]||0)+1}));}
 const nextBadge=findNextBadge(prog);
 return(<div className="page"><h1 className="rw-title">Rewards</h1>
  <div className="rw-tabs">{tabs.map(t=>(<button key={t} className={`rwtab ${view===t?"on":""}`} onClick={()=>selectView(t)}>{labels[t]}</button>))}</div>
  {view==="progress"&&(<div className="rw-body"><div className="bigstat"><span className="bs-num">{level}</span><span className="bs-lbl">Level</span></div>
   <div className="statline">🔥 {prog.streak}-day streak</div><div className="statline">📚 {prog.readCount} readings done</div>
   <div className="statline">🎯 Best math score: {prog.bestMath}/10</div><div className="statline">📋 School-work days: {prog.swCount}</div><div className="statline">🪙 {prog.coins} coins</div>
   {nextBadge&&<div className="next-line">Next: {nextBadge.emoji} {nextBadge.label} — {nextBadge.value}/{nextBadge.target}<div className="next-bar"><div style={{width:`${Math.round(nextBadge.frac*100)}%`}}/></div></div>}</div>)}
  {view==="badges"&&(<div className="badge-grid">{BADGES.map(b=>{const got=prog.badges.includes(b.id);return(<div key={b.id} className={`badge ${got?"got":"locked"}`}><span className="be">{got?b.emoji:"🔒"}</span><span className="bl">{b.label}</span></div>);})}</div>)}
  {view==="avatar"&&(<div className="rw-body"><div className="avatar-preview"><Avatar face={profile.avatar.face} color={profile.avatar.color} size={84}/></div>
   <p className="pick-lbl">Faces <span className="hint">tap to equip · 🔒 = 20🪙</span></p>
   <div className="pick-grid wide">{FACES.map(f=>{const u=prog.unlockFaces.includes(f);return(<button key={f} className={`pick-face ${profile.avatar.face===f?"on":""} ${u?"":"locked"}`} onClick={()=>buyFace(f)}>{u?f:"🔒"}</button>);})}</div>
   <p className="pick-lbl">Colors <span className="hint">🔒 = 15🪙</span></p>
   <div className="pick-grid wide">{COLORS.map(c=>{const u=prog.unlockColors.includes(c);return(<button key={c} className={`pick-color ${profile.avatar.color===c?"on":""}`} style={{background:u?c:"#3a3550"}} onClick={()=>buyColor(c)}>{u?(profile.avatar.color===c?"✓":""):"🔒"}</button>);})}</div></div>)}
  {view==="themes"&&(<div className="rw-body theme-list">{THEMES.map(t=>{const u=prog.unlockThemes.includes(t.id);const on=prog.theme===t.id;return(<button key={t.id} className={`theme-row ${on?"on":""}`} onClick={()=>buyTheme(t)}>
   <span className="swatch" style={{background:`linear-gradient(135deg,${t.a},${t.a2})`}}/><span className="theme-name">{t.label}</span><span className="theme-cost">{on?"Active":u?"Equip":`${t.cost} 🪙`}</span></button>);})}</div>)}
  {view==="store"&&(<div className="rw-body"><p className="store-intro">Real rewards set up by your parent. Earn coins, then cash them in.</p>
   {prog.redemptions.length>0&&<><p className="pick-lbl">Your tickets</p>{prog.redemptions.slice(0,6).map((r,i)=>(<div key={i} className="ticket">{r.emoji} {r.label} <span className="tk-date">{r.date} · show your parent</span></div>))}</>}
   <p className="pick-lbl">Spend coins</p>{store.map(it=>(<div key={it.id} className="store-row"><span className="store-emoji">{it.emoji}</span><span className="store-label">{it.label}</span>
    <button className="redeem" disabled={prog.coins<it.cost} onClick={()=>redeem(it)}>{it.cost} 🪙</button></div>))}</div>)}
  {view==="share"&&(<div className="rw-body"><p className="store-intro">Share cards from your best days.</p>
   {prog.shareCards.length===0&&<div className="empty">Finish a day to earn your first card ⭐</div>}
   {prog.shareCards.slice().reverse().slice(0,8).map((c,i)=>(<div key={i} className="sharecard"><div className="sc-top">⭐ {profile.name}</div><div className="sc-mid">Level {c.level} · {c.streak}-day streak</div><div className="sc-date">{c.date}</div></div>))}</div>)}
 </div>);
}

function Parent({profile,setProfile,store,setStore,prog,setProg,events,setEvents,flashToast}){
 const[label,setLabel]=useState("");const[cost,setCost]=useState("");const[emoji,setEmoji]=useState("🎁");const[url,setUrl]=useState(profile.portalUrl||"");
 function addReward(){if(!label.trim()||!cost)return;setStore([...store,{id:"c"+Date.now(),emoji:emoji||"🎁",label:label.trim(),cost:Math.max(1,parseInt(cost)||50)}]);setLabel("");setCost("");setEmoji("🎁");flashToast("Reward added");}
 // ---- insights from captured events ----
 const mathEv=events.filter(e=>e.type==="math");const readEv=events.filter(e=>e.type==="reading");
 const topicAgg={};mathEv.forEach(e=>e.perProblem?.forEach(p=>{const t=topicAgg[p.topic]||(topicAgg[p.topic]={c:0,n:0});t.n++;if(p.correct)t.c++;}));
 const weakTopics=Object.entries(topicAgg).map(([t,v])=>({t,acc:v.n?v.c/v.n:1,n:v.n})).filter(x=>x.n>=3).sort((a,b)=>a.acc-b.acc).slice(0,4);
 const typeAgg={};readEv.forEach(e=>e.perQuestion?.forEach(q=>{const t=typeAgg[q.type]||(typeAgg[q.type]={c:0,n:0});t.n++;if(q.correct)t.c++;}));
 const readTypes=Object.entries(typeAgg).map(([t,v])=>({t,acc:v.n?v.c/v.n:1,n:v.n})).sort((a,b)=>a.acc-b.acc);
 function exportData(){
  const blob=new Blob([JSON.stringify({exported:new Date().toISOString(),profile:{name:profile.name,motivator:profile.motivator,mathGrade:profile.mathGrade,lexile:profile.lexile},summary:{level:Math.floor(prog.xp/100)+1,streak:prog.streak,totalDays:prog.totalDays,readCount:prog.readCount,bestMath:prog.bestMath,swCount:prog.swCount},events},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`quest-data-${today()}.json`;document.body.appendChild(a);a.click();a.remove();flashToast("Data exported");
 }
 async function copyData(){try{await navigator.clipboard.writeText(JSON.stringify({profile:{name:profile.name},events},null,2));flashToast("Copied to clipboard");}catch(e){flashToast("Copy failed");}}
 const observed=observedMotivator(profile,prog);
 return(<div className="page"><h1 className="rw-title">Parent settings</h1>
  <div className="psec"><p className="pick-lbl">What motivates him</p>
   <div className="mot-now">{MOT[profile.motivator].emoji} {MOT[profile.motivator].label} <span className="hint">— from his quiz</span></div>
   {observed?(<div className="obs-row">Lately his actions lean <b>{MOT[observed].emoji} {MOT[observed].label}</b>. {REASON[observed]}</div>):
    (<div className="obs-row">Still gathering signal — after about 5 days of use we'll show what his actions suggest.</div>)}
   <div className="blend-toggle"><span>Let real behavior fine-tune rewards</span>
    <button className={`switch ${prog.useBlended?"on":""}`} onClick={()=>setProg(p=>({...p,useBlended:!p.useBlended}))}><span className="knob"/></button></div>
   <p className="hint">Off = rewards always match his quiz result. On = as we see more days, reward emphasis nudges toward what he actually responds to — his declared type never changes, only which rewards get spotlighted.</p>
   <button className="ghost-btn" onClick={()=>setProfile(null)}>Retake the quiz</button></div>

  <div className="psec"><p className="pick-lbl">Sound</p>
   <div className="sound-row"><span>Celebration chimes</span>
    <button className={`switch ${prog.soundOn?"on":""}`} onClick={()=>setProg(p=>({...p,soundOn:!p.soundOn}))}><span className="knob"/></button></div>
   <p className="hint">Off by default. A soft chime plays on day-complete and new badges.</p></div>

  <div className="psec"><p className="pick-lbl">Reading level <span className="hint">the priority — start at his level, climb</span></p>
   <div className="level-list">{READING_LEVELS.map(l=>(<button key={l.id} className={`level-row ${profile.lexile===l.id?"on":""}`} onClick={()=>{setProfile({...profile,lexile:l.id});flashToast("Reading set: "+l.label);}}><span className="lv-name">{l.label}</span><span className="lv-sub">{l.sub}</span></button>))}</div></div>
  <div className="psec"><p className="pick-lbl">Math level <span className="hint">he's accelerated — keep him at 7th</span></p>
   <div className="grade-row">{[6,7,8].map(g=>(<button key={g} className={`gpill ${profile.mathGrade===g?"on":""}`} onClick={()=>{setProfile({...profile,mathGrade:g});flashToast("Math set: "+g+"th");}}>{g}th</button>))}</div></div>
  <div className="psec"><p className="pick-lbl">Grades portal link <span className="hint">PowerSchool / Canvas URL</span></p>
   <input className="url-in" placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)}/><button className="addbtn full" onClick={()=>{setProfile({...profile,portalUrl:url.trim()});flashToast("Portal link saved");}}>Save link</button></div>

  <div className="psec"><p className="pick-lbl">Insights <span className="hint">from his actual answers</span></p>
   {weakTopics.length===0&&readTypes.length===0&&<div className="empty">Insights appear after a few sessions.</div>}
   {weakTopics.length>0&&<><div className="ins-h">Math — weakest topics</div>{weakTopics.map(w=>(<div key={w.t} className="ins-row"><span>{w.t}</span><span className="ins-pct">{Math.round(w.acc*100)}%</span></div>))}</>}
   {readTypes.length>0&&<><div className="ins-h">Reading — accuracy by question type</div>{readTypes.map(w=>(<div key={w.t} className="ins-row"><span>{w.t}</span><span className="ins-pct">{Math.round(w.acc*100)}%</span></div>))}</>}
  </div>

  <div className="psec"><p className="pick-lbl">Model-B data <span className="hint">{events.length} events captured</span></p>
   <p className="store-intro">Full log of every answer, score, vocabulary item, writing sample, and timing — the training & calibration data for the live-generation model.</p>
   <button className="addbtn full" onClick={exportData}>⬇ Export data (.json)</button>
   <button className="ghost-btn" onClick={copyData}>Copy to clipboard</button>
   <button className="ghost-btn warn" onClick={()=>{if(confirm("Clear captured data log? (progress stays)")){setEvents([]);flashToast("Data log cleared");}}}>Clear data log</button></div>

  <div className="psec"><p className="pick-lbl">School-work log <span className="hint">for your weekly review</span></p>
   {prog.swLog.length===0&&<div className="empty">No check-ins yet.</div>}
   {prog.swLog.slice(0,8).map((r,i)=>(<div key={i} className={`ticket ${r.missing?"flag":""}`}>{r.missing?"⚠️":"✅"} {r.date} — {r.note}</div>))}</div>

  <div className="psec"><p className="pick-lbl">Reward store <span className="hint">~55 🪙 ≈ a full day</span></p>
   {store.map(it=>(<div key={it.id} className="store-row edit"><span className="store-emoji">{it.emoji}</span><span className="store-label">{it.label}</span><span className="cost-tag">{it.cost} 🪙</span><button className="rm" onClick={()=>setStore(store.filter(s=>s.id!==it.id))}>✕</button></div>))}
   <div className="add-row"><input className="emoji-in" value={emoji} onChange={e=>setEmoji(e.target.value)} maxLength={2}/><input className="lab-in" placeholder="Reward (e.g. movie night)" value={label} onChange={e=>setLabel(e.target.value)}/><input className="cost-in" inputMode="numeric" placeholder="🪙" value={cost} onChange={e=>setCost(e.target.value)}/><button className="addbtn" onClick={addReward}>Add</button></div></div>

  <div className="psec danger"><button className="ghost-btn warn" onClick={()=>{if(confirm("Reset ALL progress, coins, badges?")){setProg(DEFAULT_PROGRESS);flashToast("Progress reset");}}}>Reset all progress</button></div>
  <p className="hint center">The streak is a nudge, not a punishment. A missed day just restarts it — never shame it.</p>
 </div>);
}

function InstallBanner(){
 const[show,setShow]=useState(false);
 useEffect(()=>{try{
  const standalone=window.navigator.standalone||(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);
  const isIOS=/iphone|ipad|ipod/i.test(window.navigator.userAgent)&&!window.MSStream;
  const dismissed=localStorage.getItem("quest:installDismissed")==="1";
  if(isIOS&&!standalone&&!dismissed)setShow(true);
 }catch(e){}},[]);
 if(!show)return null;
 function dismiss(){setShow(false);try{localStorage.setItem("quest:installDismissed","1");}catch(e){}}
 return(<div className="install-banner"><span>📲 Add Quest to your Home Screen: tap <b>Share</b> → <b>Add to Home Screen</b></span><button className="ib-x" onClick={dismiss}>✕</button></div>);
}

function Confetti({colors}){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce)return;
  const ctx=canvas.getContext("2d");
  const w=canvas.width=canvas.offsetWidth||360,h=canvas.height=canvas.offsetHeight||400;
  const parts=Array.from({length:50},()=>({x:Math.random()*w,y:-20-Math.random()*h*0.5,vx:(Math.random()-0.5)*2,vy:2+Math.random()*3,size:4+Math.random()*5,rot:Math.random()*360,vr:(Math.random()-0.5)*10,color:colors[Math.floor(Math.random()*colors.length)]}));
  let raf,frame=0;
  function tick(){frame++;ctx.clearRect(0,0,w,h);
   parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.03;p.rot+=p.vr;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);ctx.restore();});
   if(frame<160)raf=requestAnimationFrame(tick);}
  raf=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(raf);
 },[colors]);
 return <canvas ref={ref} className="confetti-canvas"/>;
}

function ShareCardCanvas({name,level,streak,theme}){
 const[src,setSrc]=useState(null);
 useEffect(()=>{
  const c=document.createElement("canvas");const W=600,H=760;c.width=W;c.height=H;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,theme.a);g.addColorStop(1,theme.a2);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="rgba(255,255,255,0.14)";ctx.beginPath();ctx.arc(W*0.82,H*0.16,140,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(W*0.14,H*0.86,110,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="700 40px -apple-system,Helvetica,Arial,sans-serif";ctx.fillText("⭐ QUEST",50,90);
  ctx.font="800 62px -apple-system,Helvetica,Arial,sans-serif";ctx.fillText(name,50,230);
  ctx.font="600 34px -apple-system,Helvetica,Arial,sans-serif";ctx.fillText(`Level ${level}`,50,300);
  ctx.fillText(`🔥 ${streak}-day streak`,50,350);
  ctx.font="400 22px -apple-system,Helvetica,Arial,sans-serif";ctx.fillStyle="rgba(255,255,255,0.85)";
  ctx.fillText(new Date().toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}),50,H-50);
  setSrc(c.toDataURL("image/png"));
 },[name,level,streak,theme]);
 function downloadImg(){if(!src)return;const a=document.createElement("a");a.href=src;a.download="quest-card.png";document.body.appendChild(a);a.click();a.remove();}
 return(<>
  {src?<img src={src} alt="Share card" className="sharecard-canvas"/>:<div className="sharecard-canvas" style={{height:180,display:"grid",placeItems:"center"}}>Rendering…</div>}
  <p className="hint center">Press and hold the image to save it to Photos.</p>
  <button className="ghost-btn" onClick={downloadImg}>⬇ Download card</button>
 </>);
}


function Celebrate({celebrate,profile,prog,store,setProg,onClose}){
 const[opened,setOpened]=useState(false);
 const[bonusOpened,setBonusOpened]=useState(false);
 const shownAt=useRef(Date.now());
 const m=celebrate.emphasis||profile.motivator;
 const box=celebrate.box;
 const boxText=b=>b.t==="coins"?`+${b.v} 🪙`:b.t==="face"?`New avatar: ${b.label}`:b.t==="color"?`New color unlocked`:b.t==="theme"?`New theme: ${b.label}`:`+20 🪙`;
 function openBox(which){
  const delay=Date.now()-shownAt.current;
  setProg(p=>({...p,boxOpenDelays:[...(p.boxOpenDelays||[]),delay].slice(-20)}));
  if(which==="main")setOpened(true);else setBonusOpened(true);
 }
 const nextBadge=findNextBadge(prog);
 const nextReward=findNextReward(store,prog.coins);
 const reduceMotion=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 return(<div className="modal-bg" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
  {!reduceMotion&&<Confetti colors={["#ffd66b","#7c5cff","#3ddc84","#ff5c8a","#26c6da"]}/>}
  <div className="cel-emoji">{celebrate.allThree?"🌟":MOT[m].emoji}</div>
  <h2 className="cel-title">{celebrate.allThree?"Perfect day!":"Day complete!"}</h2>

  {celebrate.pb?.math&&<div className="pb-banner">🏆 New math personal best!</div>}
  {celebrate.pb?.read&&<div className="pb-banner">🏆 New reading personal best!</div>}

  <p className="cel-sub">{m==="champion"?`+${celebrate.xp} XP toward your next level`:m==="earner"?`+${celebrate.coins} 🪙 toward your rewards`:`+${celebrate.xp} XP · +${celebrate.coins} 🪙`}</p>
  <div className="cel-rewards"><span>+{celebrate.xp} XP</span><span>+{celebrate.coins} 🪙</span><span>🔥 {celebrate.streak}</span></div>

  {celebrate.newBadges.length>0&&(<div className="cel-badges"><p className="cel-bl">New badge{celebrate.newBadges.length>1?"s":""}!</p><div className="cel-brow">{celebrate.newBadges.map(b=>(<span key={b.id} className="cel-badge">{b.emoji} {b.label}</span>))}</div></div>)}

  {m==="collector"&&nextBadge&&(<div className="next-line">Next up: {nextBadge.emoji} {nextBadge.label} — {nextBadge.value}/{nextBadge.target}
   <div className="next-bar"><div style={{width:`${Math.round(nextBadge.frac*100)}%`}}/></div></div>)}
  {m==="designer"&&(<div className="next-line">{prog.coins} 🪙 saved — themes start at 40 🪙. Check the shop for what's next.</div>)}
  {m==="earner"&&nextReward&&(<div className="next-line">{Math.round(nextReward.frac*100)}% funded toward {nextReward.emoji} {nextReward.label}
   <div className="next-bar"><div style={{width:`${Math.round(nextReward.frac*100)}%`}}/></div></div>)}

  <div className="mystery">{!opened?<button className="box-btn" onClick={()=>openBox("main")}>🎁 Tap to open your mystery box</button>:<div className="box-open">🎉 {boxText(box)}</div>}</div>
  {celebrate.bonusBox&&(<div className="mystery">{!bonusOpened?<button className="box-btn" onClick={()=>openBox("bonus")}>✨ Bonus box! Tap to open</button>:<div className="box-open">🎉 {boxText(celebrate.bonusBox)}</div>}</div>)}

  {m==="star"&&<ShareCardCanvas name={profile.name} level={Math.floor(prog.xp/100)+1} streak={celebrate.streak} theme={THEMES.find(t=>t.id===prog.theme)||THEMES[0]}/>}

  <button className="cta" onClick={onClose}>Awesome →</button>
 </div></div>);
}
