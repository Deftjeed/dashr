import { useState, useEffect, useRef } from "react";

// ══════════ RATE ENGINE (UNTOUCHED) ══════════
const DEBUG=false,FALLBACK_RATES={COP:3600,ARS:1445,VES:619,MXN:17.4,CLP:882},CURRENCIES_LIST=["COP","ARS","VES","MXN","CLP"],CACHE_MS=300000,RETRY_MS=30000,FETCH_TIMEOUT=8000;let _cache=null,_lastAttempt=0,_consecutiveFailures=0;const PROXY_URL="https://dashr-rates.jeans1jean1.workers.dev/rates";
function dbg(t,m,d){if(!DEBUG)return;const p="[DASHR "+new Date().toLocaleTimeString()+"]";if(t==="ok")console.log(p+" "+m,d||"");if(t==="warn")console.warn(p+" "+m,d||"");if(t==="err")console.error(p+" "+m,d||"")}
function fetchTO(u,o,ms){return Promise.race([fetch(u,o),new Promise((_,r)=>{setTimeout(()=>r(new Error("TIMEOUT")),ms)})])}
async function fpS(f,tt){try{const r=await fetchTO("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page:1,rows:5,payTypes:[],asset:"USDT",tradeType:tt,fiat:f,publisherType:null})},FETCH_TIMEOUT);if(!r.ok)return null;var j=await r.json(),ads=j&&j.data?j.data:[],prices=[];for(var i=0;i<ads.length;i++){var p=parseFloat(ads[i].adv&&ads[i].adv.price?ads[i].adv.price:"0");if(p>0)prices.push(p)}if(!prices.length)return null;var s=0;for(var k=0;k<prices.length;k++)s+=prices[k];return s/prices.length}catch(e){dbg("err","P2P "+f+"/"+tt,e.message);return null}}
async function fpR(f){var r=await Promise.all([fpS(f,"BUY"),fpS(f,"SELL")]);var b=r[0],s=r[1];if(b&&s)return Math.round(((b+s)/2)*100)/100;return b?Math.round(b*100)/100:s?Math.round(s*100)/100:null}
async function fProxy(){if(!PROXY_URL)return null;try{var r=await fetchTO(PROXY_URL,{},FETCH_TIMEOUT);if(!r.ok)return null;var j=await r.json();if(j&&j.rates&&Object.keys(j.rates).length>=3){dbg("ok","PROXY",j.rates);return j.rates}}catch(e){dbg("err","PROXY",e.message)}return null}
async function fBinance(){var rates={},count=0;var res=await Promise.allSettled(CURRENCIES_LIST.map(c=>fpR(c)));for(var i=0;i<res.length;i++){if(res[i].status==="fulfilled"&&res[i].value>0){rates[CURRENCIES_LIST[i]]=res[i].value;count++}}if(count>0){dbg("ok","BINANCE("+count+"/5)",rates);return rates}return null}
function mrg(api){var m={};for(var i=0;i<CURRENCIES_LIST.length;i++){var c=CURRENCIES_LIST[i];m[c]=(api&&api[c]&&api[c]>0)?api[c]:FALLBACK_RATES[c]}return m}
function vld(r){if(!r)return false;for(var i=0;i<CURRENCIES_LIST.length;i++){if(!r[CURRENCIES_LIST[i]]||r[CURRENCIES_LIST[i]]<=0)return false}return true}
async function loadRates(){var n=Date.now();if(_cache&&n-_cache.ts<CACHE_MS)return _cache;if(_consecutiveFailures>0&&n-_lastAttempt<RETRY_MS)return _cache||{rates:{...FALLBACK_RATES},src:"live",ts:n};_lastAttempt=n;var pr=await fProxy();if(pr){var m1=mrg(pr);if(vld(m1)){_consecutiveFailures=0;_cache={rates:m1,src:"live",ts:n};return _cache}}var br=await fBinance();if(br){var m2=mrg(br);if(vld(m2)){_consecutiveFailures=0;_cache={rates:m2,src:"live",ts:n};return _cache}}_consecutiveFailures++;_cache={rates:{...FALLBACK_RATES},src:"live",ts:n};return _cache}
function cf(f,t){const p=[f,t].sort().join("-");return p==="ARS-COP"?.95:(p==="COP-VES"||p==="ARS-VES")?.94:.915}
function calc(a,f,t,r){if(!a||a<=0||f===t||!r||!r[f]||!r[t])return{result:0,rate:0};const u=a/r[f],b=u*r[t],fin=b*cf(f,t),rd=Math.floor(fin/100)*100;return{result:Math.max(0,rd),rate:a>0?rd/a:0}}

// ══════════ CONFIG ══════════
const WA="573117405064";
const IG="https://instagram.com/dashremesas";
const CU=[{c:"COP",n:"Colombia",s:"$",sub:"Peso colombiano"},{c:"ARS",n:"Argentina",s:"$",sub:"Peso argentino"},{c:"VES",n:"Venezuela",s:"Bs.",sub:"Bolívar"},{c:"MXN",n:"México",s:"$",sub:"Peso mexicano"},{c:"CLP",n:"Chile",s:"$",sub:"Peso chileno"}];
const fm=n=>Math.floor(n).toLocaleString("es-CO");
const pa=s=>parseInt(s.replace(/[^0-9]/g,""),10)||0;
const gc=c=>CU.find(x=>x.c===c);
const STARS=String.fromCharCode(9733,9733,9733,9733,9733);

// ══════════ TOKENS ══════════
const T={
  purple:"#820AD1", purpleHi:"#A855F7", purpleDeep:"#6B21A8", purpleSoft:"#C77DFF",
  tint:"#F4ECFE", tintSoft:"#FAF7FF", border:"#ECE7F5", borderHi:"#E1D6F5",
  ink:"#190A2E", ink2:"#5C5470", ink3:"#9A93AD", wa:"#25D366", waDeep:"#1EBE5A",
  usdt:"#26A17B", usdtHi:"#2EBD8E",
  s1:"0 1px 2px rgba(25,10,46,.04), 0 2px 8px rgba(130,10,209,.05)",
  s2:"0 8px 24px rgba(130,10,209,.08)", s3:"0 20px 50px rgba(130,10,209,.14)",
  rCard:24, rField:16, rPill:100,
  font:"'Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
};
const P=T.purple;

const WASvg=({size=18,color="white"})=><svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

// ══════════ STYLES ══════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes ring{0%{box-shadow:0 0 0 0 rgba(37,211,102,.45)}70%{box-shadow:0 0 0 9px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes floaty2{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-16px) rotate(-6deg)}}
@keyframes floaty3{0%,100%{transform:translateY(0) rotate(8deg)}50%{transform:translateY(-10px) rotate(8deg)}}
@keyframes spinSlow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes auraShift{0%{transform:translate(0,0) scale(1)}33%{transform:translate(28px,-18px) scale(1.08)}66%{transform:translate(-18px,18px) scale(.95)}100%{transform:translate(0,0) scale(1)}}
@keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes dashFlow{to{stroke-dashoffset:-200}}
@keyframes barRise{from{transform:scaleY(.15)}to{transform:scaleY(1)}}
@keyframes rateFlash{0%{box-shadow:0 0 0 0 rgba(130,10,209,.5)}100%{box-shadow:0 0 0 10px rgba(130,10,209,0)}}
@keyframes sheen{0%{opacity:0;transform:translateX(-60%)}40%{opacity:.5}100%{opacity:0;transform:translateX(160%)}}
.pulse-dot{animation:pulse 2s ease-in-out infinite}
.live-ring{animation:ring 2.2s infinite}
.btn-wa{transition:transform .25s,box-shadow .25s,background .2s}
.btn-wa:hover{transform:translateY(-2px);background:#1EBE5A!important;box-shadow:0 12px 30px rgba(37,211,102,.4)!important}
.btn-wa:active{transform:translateY(0) scale(.985)}
.btn-glow{transition:transform .25s,box-shadow .25s,background .2s}
.btn-glow:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(130,10,209,.34)!important}
.btn-outline{transition:all .25s cubic-bezier(.22,1,.36,1)}
.btn-outline:hover{background:rgba(130,10,209,0.05)!important;transform:translateY(-1px)}
.eco{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s,border-color .35s}
.eco:hover{transform:translateY(-8px);box-shadow:0 22px 50px rgba(130,10,209,.16)!important;border-color:`+T.borderHi+`!important}
.eco:hover .eco-illu{transform:scale(1.08) rotate(-2deg)}
.eco-illu{transition:transform .45s cubic-bezier(.22,1,.36,1)}
.card-lift{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}
.card-lift:hover{transform:translateY(-6px);box-shadow:0 18px 44px rgba(130,10,209,.13)!important}
.sim-card{animation:floaty 7s ease-in-out infinite}
.nav-link{transition:color .2s}.nav-link:hover{color:`+P+`!important}
.flink{transition:color .2s}.flink:hover{color:#C77DFF!important}
.input-focus{transition:border-color .2s,box-shadow .2s}
.input-focus:focus-within{border-color:`+P+`!important;box-shadow:0 0 0 4px rgba(130,10,209,0.1)!important}
.swapbtn{transition:transform .4s cubic-bezier(.22,1,.36,1),background .2s}
.swapbtn:hover{transform:rotate(180deg);background:`+T.tint+`!important}
.nav-links{display:flex;gap:30px;font-size:14.5px;font-weight:500}
.coin3d{animation:floaty 6s ease-in-out infinite}
.gnode{cursor:pointer;transition:opacity .3s}
@media(max-width:760px){
  .nav-links{display:none}
  .hero-flex{flex-direction:column!important}
  .sim-amount{font-size:21px!important}
  .mwa{display:flex!important}
  .two-col{grid-template-columns:1fr!important}
  .hero-globe{display:none!important}
}
.mwa{display:none}
`;

function useCountUp(value){
  const[disp,setDisp]=useState(value);const ref=useRef(value);
  useEffect(()=>{const from=ref.current,to=value,dur=420,start=performance.now();let raf;
    function step(now){const p=Math.min(1,(now-start)/dur);const e=1-Math.pow(1-p,3);setDisp(Math.round(from+(to-from)*e));if(p<1)raf=requestAnimationFrame(step);else ref.current=to}
    raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf)},[value]);
  return disp;
}

function Reveal({children,delay=0,y=30,style}){
  const ref=useRef(null);const[seen,setSeen]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setSeen(true);o.disconnect()}},{threshold:.14});o.observe(el);return()=>o.disconnect()},[]);
  return <div ref={ref} style={{...style,opacity:seen?1:0,transform:seen?"none":"translateY("+y+"px)",transition:"opacity .8s cubic-bezier(.22,1,.36,1) "+delay+"s, transform .8s cubic-bezier(.22,1,.36,1) "+delay+"s"}}>{children}</div>;
}

// count-up que dispara al entrar en viewport
function StatNum({value,suffix,prefix}){
  const ref=useRef(null);const[v,setV]=useState(0);const done=useRef(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!done.current){done.current=true;const dur=1400,start=performance.now();
    function step(now){const p=Math.min(1,(now-start)/dur);const ea=1-Math.pow(1-p,3);setV(Math.round(value*ea));if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step);o.disconnect()}},{threshold:.4});o.observe(el);return()=>o.disconnect()},[value]);
  return <span ref={ref}>{(prefix||"")+v.toLocaleString("es-CO")+(suffix||"")}</span>;
}

function Fq({q,a,i}){const[o,setO]=useState(false);return(
<div style={{background:"#fff",borderRadius:16,marginBottom:10,border:"1px solid "+T.border,overflow:"hidden",transition:"box-shadow .2s"}}
  onMouseOver={e=>e.currentTarget.style.boxShadow=T.s1} onMouseOut={e=>e.currentTarget.style.boxShadow="none"}>
  <button onClick={()=>setO(!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",background:"none",border:"none",cursor:"pointer",padding:"20px 22px",fontFamily:"inherit",gap:16}}>
    <span style={{fontSize:15.5,fontWeight:600,color:T.ink,textAlign:"left",letterSpacing:-0.2}}>{q}</span>
    <span style={{fontSize:22,color:P,transition:"transform .3s",transform:o?"rotate(45deg)":"none",flexShrink:0,lineHeight:1}}>+</span>
  </button>
  <div style={{maxHeight:o?240:0,overflow:"hidden",transition:"max-height .4s cubic-bezier(.22,1,.36,1)"}}><div style={{padding:"0 22px 20px",fontSize:14.5,color:T.ink2,lineHeight:1.7}}>{a}</div></div>
</div>)}

function FlagSvg({country,size=32}){const s=size;const st={borderRadius:5,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.12))"};
  if(country==="CO")return <svg width={s} height={s} viewBox="0 0 40 30" style={st}><rect width="40" height="15" fill="#FCD116"/><rect y="15" width="40" height="7.5" fill="#003893"/><rect y="22.5" width="40" height="7.5" fill="#CE1126"/></svg>;
  if(country==="AR")return <svg width={s} height={s} viewBox="0 0 40 30" style={st}><rect width="40" height="30" fill="#fff"/><rect width="40" height="10" fill="#75AADB"/><rect y="20" width="40" height="10" fill="#75AADB"/><circle cx="20" cy="15" r="3.5" fill="#F6B40E"/></svg>;
  if(country==="VE")return <svg width={s} height={s} viewBox="0 0 40 30" style={st}><rect width="40" height="10" fill="#CF142B"/><rect y="10" width="40" height="10" fill="#00247D"/><rect y="20" width="40" height="10" fill="#FC0"/></svg>;
  if(country==="MX")return <svg width={s} height={s} viewBox="0 0 40 30" style={st}><rect width="13.3" height="30" fill="#006847"/><rect x="13.3" width="13.4" height="30" fill="#fff"/><rect x="26.7" width="13.3" height="30" fill="#CE1126"/><circle cx="20" cy="15" r="3" fill="#6B3A2A"/></svg>;
  if(country==="CL")return <svg width={s} height={s} viewBox="0 0 40 30" style={st}><rect width="40" height="30" fill="#D52B1E"/><rect y="0" width="40" height="15" fill="#fff"/><rect width="13.3" height="15" fill="#0039A6"/><polygon points="6.65,4 7.5,7 10.5,7 8,8.8 8.8,12 6.65,10 4.5,12 5.3,8.8 2.8,7 5.8,7" fill="#fff"/></svg>;
  return null;
}

// ══════════ GLOBO LATAM 3D (HERO) ══════════
function Globe(){
  const cx=210,cy=210,R=150;
  const flags={CO:[150,148],VE:[300,150],MX:[108,236],CL:[176,318],AR:[252,322]};
  const arcs=[["CO","VE"],["CO","MX"],["CO","CL"],["CO","AR"],["AR","CL"]];
  const arc=(a,b)=>{const[x1,y1]=flags[a],[x2,y2]=flags[b];const mx=(x1+x2)/2,my=(y1+y2)/2;const dx=mx-cx,dy=my-cy;const k=0.35;return"M"+x1+","+y1+" Q"+(mx+dx*k)+","+(my+dy*k)+" "+x2+","+y2};
  return <svg viewBox="0 0 420 420" style={{width:"100%",height:"100%",display:"block",overflow:"visible"}}>
    <defs>
      <radialGradient id="sphere" cx="38%" cy="32%" r="75%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="55%" stopColor="#F3E8FF"/><stop offset="100%" stopColor="#E4D3FA"/></radialGradient>
      <radialGradient id="nglow2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#A855F7" stopOpacity=".55"/><stop offset="100%" stopColor="#A855F7" stopOpacity="0"/></radialGradient>
      <linearGradient id="flow2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#820AD1" stopOpacity="0"/><stop offset="50%" stopColor="#C77DFF"/><stop offset="100%" stopColor="#820AD1" stopOpacity="0"/></linearGradient>
      <clipPath id="ball"><circle cx={cx} cy={cy} r={R}/></clipPath>
    </defs>
    <circle cx={cx} cy={cy} r={R+18} fill="url(#nglow2)"/>
    <circle cx={cx} cy={cy} r={R} fill="url(#sphere)" stroke="#E1D6F5" strokeWidth="1.5"/>
    <g clipPath="url(#ball)" stroke="#C9B6EE" strokeWidth="1" fill="none" opacity=".55">
      <g style={{transformOrigin:cx+"px "+cy+"px",animation:"spinSlow 26s linear infinite"}}>
        {[-110,-70,-35,0,35,70,110].map((rx,i)=><ellipse key={i} cx={cx} cy={cy} rx={Math.abs(rx)} ry={R}/>)}
      </g>
      {[-90,-45,0,45,90].map((o,i)=><ellipse key={"p"+i} cx={cx} cy={cy+o} rx={R} ry={Math.max(8,R-Math.abs(o)*1.2)}/>)}
    </g>
    {arcs.map((a,i)=>(<g key={i}>
      <path d={arc(a[0],a[1])} stroke="#E1D6F5" strokeWidth="1.4" fill="none"/>
      <path d={arc(a[0],a[1])} stroke="url(#flow2)" strokeWidth="2.4" fill="none" strokeDasharray="14 186" style={{animation:"dashFlow "+(3+i*0.5)+"s linear infinite"}}/>
      <circle r="3.2" fill="#820AD1"><animateMotion dur={(3+i*0.45)+"s"} repeatCount="indefinite" path={arc(a[0],a[1])}/></circle>
    </g>))}
    {Object.keys(flags).map(k=>{const[x,y]=flags[k];const hub=k==="CO";return <g key={k}>
      <circle cx={x} cy={y} r="22" fill="url(#nglow2)" style={{transformOrigin:x+"px "+y+"px",animation:hub?"pulse 2.4s ease-in-out infinite":"none"}}/>
      <g transform={"translate("+(x-20)+","+(y-20)+")"}>
        <rect width="40" height="40" rx="12" fill="#fff" stroke={hub?"#820AD1":"#E1D6F5"} strokeWidth={hub?"2":"1"} style={{filter:"drop-shadow(0 6px 16px rgba(130,10,209,.2))"}}/>
        <foreignObject x="8" y="9" width="24" height="22"><div style={{display:"flex",justifyContent:"center"}}><FlagSvg country={k} size={22}/></div></foreignObject>
      </g>
    </g>})}
  </svg>;
}

// ══════════ RED LATAM VIVA ══════════
function LatamNetwork(){
  const[hov,setHov]=useState(null);
  const nodes={MX:[110,72],CO:[300,176],VE:[438,120],CL:[176,352],AR:[346,350]};
  const names={MX:"México",CO:"Colombia",VE:"Venezuela",CL:"Chile",AR:"Argentina"};
  const links=[["CO","MX"],["CO","VE"],["CO","CL"],["CO","AR"],["AR","CL"],["VE","MX"]];
  const path=(a,b)=>"M"+nodes[a][0]+","+nodes[a][1]+" L"+nodes[b][0]+","+nodes[b][1];
  const active=(a,b)=>hov===null||hov===a||hov===b;
  const corridors=k=>links.filter(l=>l[0]===k||l[1]===k).map(l=>names[l[0]===k?l[1]:l[0]]);
  return <svg viewBox="0 0 560 430" style={{width:"100%",maxWidth:700,display:"block",margin:"0 auto",overflow:"visible"}}>
    <defs>
      <radialGradient id="ng" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#A855F7" stopOpacity=".5"/><stop offset="100%" stopColor="#A855F7" stopOpacity="0"/></radialGradient>
      <linearGradient id="fl" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#820AD1" stopOpacity="0"/><stop offset="50%" stopColor="#A855F7"/><stop offset="100%" stopColor="#820AD1" stopOpacity="0"/></linearGradient>
    </defs>
    {links.map((l,i)=>{const on=active(l[0],l[1]);return <g key={"b"+i} style={{opacity:on?1:.18,transition:"opacity .3s"}}>
      <path d={path(l[0],l[1])} stroke={on?"#D9C7F3":"#ECE7F5"} strokeWidth={hov&&(hov===l[0]||hov===l[1])?"2.4":"1.5"} fill="none" style={{transition:"stroke-width .3s,stroke .3s"}}/>
      <path d={path(l[0],l[1])} stroke="url(#fl)" strokeWidth="2.4" fill="none" strokeDasharray="14 186" style={{animation:"dashFlow "+(3.2+i*0.5)+"s linear infinite"}}/>
      <circle r="3.4" fill="#820AD1"><animateMotion dur={(3+i*0.4)+"s"} repeatCount="indefinite" path={path(l[0],l[1])}/></circle>
    </g>})}
    {Object.keys(nodes).map(k=>{const[x,y]=nodes[k];const hub=k==="CO";const on=hov===null||hov===k||links.some(l=>(l[0]===hov&&l[1]===k)||(l[1]===hov&&l[0]===k));return <g key={k} className="gnode" style={{opacity:on?1:.3}} onMouseEnter={()=>setHov(k)} onMouseLeave={()=>setHov(null)}>
      <circle cx={x} cy={y} r="26" fill="url(#ng)" style={{transformOrigin:x+"px "+y+"px",animation:(hub||hov===k)?"pulse 2.2s ease-in-out infinite":"none"}}/>
      <g transform={"translate("+(x-23)+","+(y-23)+")"}>
        <rect width="46" height="46" rx="14" fill="#fff" stroke={hov===k?"#820AD1":hub?"#820AD1":"#E1D6F5"} strokeWidth={(hub||hov===k)?"2":"1"} style={{filter:"drop-shadow(0 6px 16px rgba(130,10,209,.18))",transition:"stroke .2s"}}/>
        <foreignObject x="9" y="11" width="28" height="24"><div style={{display:"flex",justifyContent:"center"}}><FlagSvg country={k} size={24}/></div></foreignObject>
      </g>
      <text x={x} y={y+38} textAnchor="middle" fontSize="11" fontWeight="700" fill="#5C5470" fontFamily={T.font}>{k}</text>
      {hov===k&&<g>
        <rect x={x-78} y={y-86} width="156" height="56" rx="12" fill="#190A2E"/>
        <text x={x} y={y-66} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily={T.font}>{names[k]}</text>
        <text x={x} y={y-49} textAnchor="middle" fontSize="10" fill="#C77DFF" fontFamily={T.font}>Corredores: {corridors(k).length}</text>
        <text x={x} y={y-37} textAnchor="middle" fontSize="9.5" fill="#9A93AD" fontFamily={T.font}>{corridors(k).join(" · ")}</text>
      </g>}
    </g>})}
  </svg>;
}

function Illu({k}){const g="url(#ig)";const base=(ch)=><svg width="84" height="84" viewBox="0 0 84 84" className="eco-illu"><defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A855F7"/><stop offset="100%" stopColor="#820AD1"/></linearGradient></defs><circle cx="42" cy="42" r="40" fill="#F4ECFE"/>{ch}</svg>;
  if(k==="send")return base(<g><rect x="22" y="30" width="40" height="28" rx="6" fill="#fff" stroke="#E1D6F5" strokeWidth="1.5"/><path d="M24 34l18 12 18-12" fill="none" stroke="#C77DFF" strokeWidth="2"/><path d="M52 22l12 6-12 6 3-6z" fill={g}/><path d="M40 28h16" stroke={g} strokeWidth="3" strokeLinecap="round"/></g>);
  if(k==="receive")return base(<g><path d="M24 40c0-8 8-12 18-12s18 4 18 12v10a6 6 0 01-6 6H30a6 6 0 01-6-6z" fill="#fff" stroke="#E1D6F5" strokeWidth="1.5"/><circle cx="42" cy="44" r="9" fill={g}/><text x="42" y="49" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="Inter">$</text><path d="M42 14v12m0 0l-5-5m5 5l5-5" stroke={g} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>);
  if(k==="buy")return base(<g><circle cx="42" cy="42" r="19" fill="#26A17B"/><circle cx="42" cy="42" r="19" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".5"/><text x="42" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" fontFamily="Inter">₮</text><circle cx="60" cy="26" r="11" fill="#fff" stroke="#E1D6F5" strokeWidth="1.5"/><path d="M60 21v10m-5-5h10" stroke="#26A17B" strokeWidth="2.4" strokeLinecap="round"/></g>);
  if(k==="sell")return base(<g><circle cx="42" cy="42" r="19" fill="#26A17B"/><circle cx="42" cy="42" r="19" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".5"/><text x="42" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" fontFamily="Inter">₮</text><circle cx="60" cy="26" r="11" fill="#fff" stroke="#E1D6F5" strokeWidth="1.5"/><path d="M55 26h10" stroke="#26A17B" strokeWidth="2.4" strokeLinecap="round"/></g>);
  return null;
}

// ══════════ MONEDA USDT (verde oficial) ══════════
function UsdtCoin(){
  return <div style={{position:"relative",width:280,height:280,margin:"0 auto"}}>
    <div style={{position:"absolute",inset:-30,borderRadius:"50%",background:"radial-gradient(circle,rgba(38,161,123,.28),transparent 65%)",animation:"auraShift 9s ease-in-out infinite",filter:"blur(8px)"}}/>
    <div className="coin3d" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:190,height:190}}>
      <div style={{width:"100%",height:"100%",borderRadius:"50%",background:"radial-gradient(circle at 34% 30%,#2EBD8E,#26A17B 55%,#16795B 100%)",boxShadow:"0 30px 70px rgba(38,161,123,.4),inset 0 4px 14px rgba(255,255,255,.3),inset 0 -8px 18px rgba(0,0,0,.18)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.28)"}}/>
        <div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)",animation:"sheen 4.5s ease-in-out infinite"}}/>
        <span style={{fontSize:96,fontWeight:800,color:"#fff",textShadow:"0 4px 16px rgba(0,0,0,.25)",lineHeight:1}}>₮</span>
      </div>
    </div>
    <div style={{position:"absolute",top:18,right:6,background:"#fff",borderRadius:14,padding:"8px 12px",boxShadow:T.s2,fontSize:12,fontWeight:700,color:T.usdt,animation:"floaty2 6.5s ease-in-out infinite",display:"flex",alignItems:"center",gap:6}}><span className="pulse-dot" style={{width:7,height:7,borderRadius:"50%",background:T.usdt}}/>USDT · en vivo</div>
    <div style={{position:"absolute",bottom:30,left:0,background:"#fff",borderRadius:14,padding:"8px 12px",boxShadow:T.s2,fontSize:12,fontWeight:700,color:P,animation:"floaty3 7.5s ease-in-out infinite"}}>Atención real</div>
    <div style={{position:"absolute",bottom:64,right:14,background:T.usdt,borderRadius:14,padding:"8px 12px",boxShadow:T.s2,fontSize:12,fontWeight:700,color:"#fff",animation:"floaty 8s ease-in-out infinite"}}>1 USDT ≈ COP</div>
  </div>;
}

function TrustMeter(){
  const[t,setT]=useState(0);
  useEffect(()=>{const iv=setInterval(()=>setT(x=>x+1),2200);return()=>clearInterval(iv)},[]);
  const heights=[0.55,0.72,0.48,0.83,0.66,0.9,0.6,0.78];
  return <div style={{background:"#fff",border:"1px solid "+T.border,borderRadius:T.rCard,padding:26,boxShadow:T.s2}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <span style={{fontWeight:700,fontSize:15,color:T.ink}}>Mercado P2P · ahora</span>
      <span className="live-ring" style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5,fontWeight:600,color:T.waDeep,background:"#EAFBF1",padding:"5px 12px",borderRadius:T.rPill}}><span className="pulse-dot" style={{width:7,height:7,borderRadius:"50%",background:T.wa}}/>En vivo</span>
    </div>
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120,marginBottom:16}}>
      {heights.map((h,i)=><div key={i+"-"+t} style={{flex:1,height:(h*100)+"%",borderRadius:8,background:i%2?"linear-gradient(180deg,#C77DFF,#820AD1)":"linear-gradient(180deg,#A855F7,#6B21A8)",transformOrigin:"bottom",animation:"barRise .7s cubic-bezier(.22,1,.36,1) both",animationDelay:(i*0.06)+"s",opacity:.55+h*0.45}}/>)}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,color:T.ink2}}>
      <span>Analizando 5 mercados</span><span style={{fontWeight:700,color:P}}>Tasa transparente ✓</span>
    </div>
  </div>;
}

export default function App(){
  const[fromC,setFromC]=useState("COP");
  const[toC,setToC]=useState("ARS");
  const[input,setInput]=useState("500.000");
  const[rates,setRates]=useState(FALLBACK_RATES);
  const[ready,setReady]=useState(false);
  const[pulse,setPulse]=useState(0);
  useEffect(()=>{loadRates().then(r=>{setRates(r.rates);setReady(true)});var iv=setInterval(()=>{loadRates().then(r=>{setRates(r.rates)})},CACHE_MS);return()=>clearInterval(iv)},[]);
  const amt=pa(input),{result,rate}=calc(amt,fromC,toC,rates),fi=gc(fromC),ti=gc(toC);
  const dispResult=useCountUp(result);
  const bump=()=>setPulse(p=>p+1);
  const swap=()=>{const t=fromC;setFromC(toC);setToC(t);setInput(result>0?fm(result):"100.000");bump()};
  const hF=v=>{if(v===toC)setToC(fromC);setFromC(v);bump()};
  const hT=v=>{if(v===fromC)setFromC(toC);setToC(v);bump()};
  const openWA=(ctx)=>{const extra=ctx?(" ("+ctx+")"):"";const m=encodeURIComponent("Hola DASHR, quiero hacer una operación"+extra+": Envío: "+fm(amt)+" "+fromC+" Destino: "+toC+" Recibiría: "+fm(result)+" "+toC+" Cómo procedo?");window.open("https://wa.me/"+WA+"?text="+m,"_blank")};
  const toSim=()=>document.getElementById("sim")?.scrollIntoView({behavior:"smooth"});

  return(
<div style={{fontFamily:T.font,color:T.ink,background:"#fff",minHeight:"100vh",overflowX:"hidden"}}>
<style>{CSS}</style>

{/* NAV */}
<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.82)",backdropFilter:"blur(20px) saturate(1.8)",borderBottom:"1px solid "+T.border,padding:"0 clamp(16px,4vw,48px)",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
  <span style={{fontWeight:800,fontSize:23,color:P,letterSpacing:-0.6}}>DA$HR</span>
  <div className="nav-links">{[["Ecosistema","s-eco"],["USDT","s-usdt"],["Red LATAM","s-red"],["Por qué DASH","s-why"],["FAQ","s-faq"]].map(([t,h],i)=><a key={i} href={"#"+h} className="nav-link" style={{textDecoration:"none",color:T.ink2,whiteSpace:"nowrap"}}>{t}</a>)}</div>
  <button onClick={toSim} className="btn-glow" style={{background:P,color:"#fff",border:"none",borderRadius:T.rPill,padding:"11px 22px",fontSize:13.5,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 12px rgba(130,10,209,0.25)",whiteSpace:"nowrap"}}>Cotizar ahora</button>
</nav>

{/* HERO */}
<section className="hero-flex" style={{padding:"clamp(40px,6vw,84px) clamp(16px,4vw,48px) 70px",display:"flex",flexWrap:"wrap",gap:"clamp(24px,4vw,56px)",alignItems:"center",maxWidth:1200,margin:"0 auto",position:"relative"}}>
  <div style={{position:"absolute",top:-150,right:-100,width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,.14),transparent 66%)",animation:"auraShift 12s ease-in-out infinite",pointerEvents:"none"}}/>
  <div style={{flex:"1 1 400px",minWidth:0,position:"relative",zIndex:2,animation:"fadeUp .8s cubic-bezier(.22,1,.36,1) both"}}>
    <div style={{display:"inline-flex",alignItems:"center",gap:9,background:T.tint,borderRadius:T.rPill,padding:"8px 16px",marginBottom:24,border:"1px solid "+T.borderHi}}>
      <span className="pulse-dot" style={{width:8,height:8,borderRadius:"50%",background:T.wa}}/>
      <span style={{fontSize:13,fontWeight:600,color:P}}>Infraestructura financiera LATAM</span>
    </div>
    <h1 style={{fontSize:"clamp(38px,5vw,60px)",fontWeight:800,lineHeight:1.02,letterSpacing:-2.4,margin:"0 0 20px"}}>
      Mueve dinero entre países<br/><span style={{background:"linear-gradient(120deg,#820AD1,#A855F7,#C77DFF)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gradMove 6s ease infinite"}}>todos los días</span></h1>
    <p style={{fontSize:18,color:T.ink,fontWeight:500,lineHeight:1.55,margin:"0 0 8px"}}>Remesas y USDT en una sola experiencia. Todo por WhatsApp.</p>
    <p style={{fontSize:15,color:T.ink2,lineHeight:1.6,margin:"0 0 28px",maxWidth:440}}>Tasa de mercado en vivo, sin apps ni registros, con un asesor real en cada operación.</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <button onClick={()=>openWA()} className="btn-wa" style={{background:T.wa,color:"#fff",border:"none",borderRadius:14,padding:"17px 30px",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:9,boxShadow:"0 8px 24px rgba(37,211,102,0.32)"}}><WASvg/> Cotizar por WhatsApp</button>
      <button onClick={toSim} className="btn-outline" style={{background:"transparent",border:"1.5px solid "+T.borderHi,borderRadius:14,padding:"17px 26px",fontSize:15,fontWeight:600,cursor:"pointer",color:P}}>Simular envío</button>
    </div>
  </div>

  {/* VISUAL: globo + simulador encima */}
  <div style={{flex:"1 1 420px",maxWidth:520,minWidth:0,width:"100%",position:"relative",zIndex:1,minHeight:440}}>
    <div className="hero-globe" style={{position:"absolute",top:-20,left:"50%",transform:"translateX(-50%)",width:440,height:440,zIndex:0,opacity:.95}}><Globe/></div>
    <div style={{position:"relative",zIndex:2,maxWidth:430,marginLeft:"auto",marginTop:60}}>
      <div style={{position:"absolute",top:-24,left:-18,width:58,height:58,borderRadius:18,background:"linear-gradient(135deg,#26A17B,#16795B)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:26,boxShadow:T.s2,animation:"floaty2 6s ease-in-out infinite",zIndex:3}}>₮</div>
      <div id="sim" className="sim-card" style={{background:"#fff",borderRadius:T.rCard,padding:"clamp(22px,4vw,28px)",boxShadow:T.s3,border:"1px solid "+T.border,position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:700,fontSize:18.5,letterSpacing:-0.3}}>Simulador de envío</span>
          <span className={ready?"live-ring":""} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.waDeep,fontWeight:600,background:"#EAFBF1",padding:"5px 13px",borderRadius:T.rPill}}><span className="pulse-dot" style={{width:7,height:7,borderRadius:"50%",background:T.wa}}/>{ready?"En vivo":"Cargando..."}</span>
        </div>
        <label style={{fontSize:11,fontWeight:700,color:T.ink3,textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:8}}>Tú envías</label>
        <div className="input-focus" style={{display:"flex",gap:8,marginBottom:6}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:T.tintSoft,border:"1.5px solid "+T.border,borderRadius:T.rField,padding:"0 12px",minWidth:0}}>
            <span style={{fontSize:13,color:T.ink3,fontWeight:700}}>{fromC.substring(0,2)}</span>
            <input type="text" inputMode="numeric" value={input} onChange={e=>{const r=pa(e.target.value);setInput(r>0?fm(r):"")}} className="sim-amount" style={{flex:1,fontSize:23,fontWeight:700,fontFamily:"inherit",padding:"14px 0",border:"none",outline:"none",background:"transparent",color:T.ink,minWidth:0,width:"100%",letterSpacing:-0.5}}/>
          </div>
          <select value={fromC} onChange={e=>hF(e.target.value)} style={{width:82,fontSize:14,fontWeight:600,padding:"14px 6px",background:T.tintSoft,border:"1.5px solid "+T.border,borderRadius:T.rField,color:P,cursor:"pointer",outline:"none",fontFamily:"inherit"}}>{CU.map(c=><option key={c.c} value={c.c}>{c.c}</option>)}</select>
        </div>
        <div style={{fontSize:11.5,color:T.ink3,marginBottom:10}}>{fi.sub}</div>
        <div style={{display:"flex",justifyContent:"center",margin:"2px 0 10px"}}><button onClick={swap} className="swapbtn" style={{width:44,height:44,borderRadius:"50%",border:"1.5px solid "+T.border,background:"#fff",cursor:"pointer",fontSize:18,color:P,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:T.s1}}>↓</button></div>
        <label style={{fontSize:11,fontWeight:700,color:T.ink3,textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:8}}>Ellos reciben</label>
        <div key={pulse} style={{display:"flex",gap:8,marginBottom:6,borderRadius:T.rField,animation:"rateFlash .6s ease-out"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#820AD1,#6B21A8)",borderRadius:T.rField,padding:"0 14px",minWidth:0}}>
            <span style={{fontSize:13,color:"rgba(255,255,255,.7)",fontWeight:700}}>{toC.substring(0,2)}</span>
            <input type="text" readOnly value={fm(dispResult)} className="sim-amount" style={{flex:1,fontSize:24,fontWeight:800,fontFamily:"inherit",padding:"14px 0",border:"none",outline:"none",background:"transparent",color:"#fff",minWidth:0,width:"100%",letterSpacing:-0.5}}/>
          </div>
          <select value={toC} onChange={e=>hT(e.target.value)} style={{width:82,fontSize:14,fontWeight:600,padding:"14px 6px",background:T.tintSoft,border:"1.5px solid "+T.border,borderRadius:T.rField,color:P,cursor:"pointer",outline:"none",fontFamily:"inherit"}}>{CU.map(c=><option key={c.c} value={c.c}>{c.c}</option>)}</select>
        </div>
        <div style={{fontSize:11.5,color:T.ink3,marginBottom:14}}>{ti.sub}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,fontSize:12.5,color:T.ink2,marginBottom:16,padding:"11px 14px",background:T.tintSoft,borderRadius:12,border:"1px solid "+T.border}}>
          <span style={{display:"flex",alignItems:"center",gap:7}}><span className="pulse-dot" style={{width:6,height:6,borderRadius:"50%",background:T.wa}}/>{rate>0?<b style={{color:T.ink}}>1 {fromC} = {rate.toFixed(4)} {toC}</b>:"Ingresa un monto"}</span>
          <span style={{fontSize:10.5,color:T.ink3,fontWeight:600}}>Mercado P2P</span>
        </div>
        <button onClick={()=>openWA()} disabled={result<=0} className="btn-wa" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:17,border:"none",borderRadius:14,background:result>0?T.wa:"#E6E2EE",color:"#fff",fontSize:16.5,fontWeight:700,cursor:result>0?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:result>0?"0 8px 24px rgba(37,211,102,0.32)":"none"}}><WASvg/> Cotizar por WhatsApp →</button>
        <p style={{textAlign:"center",fontSize:11.5,color:T.ink3,marginTop:12}}>🔒 Confirmamos la tasa antes de que envíes · respuesta &lt;2 min</p>
      </div>
    </div>
  </div>
</section>

{/* PRUEBA SOCIAL */}
<section style={{background:"linear-gradient(135deg,#820AD1,#6B21A8)",padding:"58px clamp(16px,4vw,48px)"}}>
  <Reveal style={{maxWidth:1040,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:30}}>
    {[{n:2500,p:"+",l:"Operaciones realizadas"},{n:5,p:"",l:"Países conectados"},{n:5,p:"<",s:" min",l:"Respuesta promedio"},{n:100,p:"",s:"%",l:"Atención personalizada"}].map((s,i)=>(
      <div key={i} style={{textAlign:"center"}}>
        <div style={{fontSize:"clamp(40px,5vw,56px)",fontWeight:800,color:"#fff",letterSpacing:-2,lineHeight:1}}><StatNum value={s.n} prefix={s.p} suffix={s.s}/></div>
        <div style={{fontSize:14,color:"#E9D5FF",marginTop:8,fontWeight:500}}>{s.l}</div>
      </div>))}
  </Reveal>
</section>

{/* ECOSISTEMA */}
<section id="s-eco" style={{padding:"86px clamp(16px,4vw,48px)",background:"#fff"}}>
  <Reveal style={{maxWidth:760,margin:"0 auto",textAlign:"center"}}>
    <span style={{color:P,fontWeight:700,fontSize:13,letterSpacing:.04,textTransform:"uppercase"}}>El ecosistema DASH</span>
    <h2 style={{fontSize:"clamp(28px,4.2vw,42px)",fontWeight:800,margin:"12px 0 14px",letterSpacing:-1.4}}>Una sola plataforma para mover tu dinero</h2>
    <p style={{color:T.ink2,fontSize:16.5,lineHeight:1.6,maxWidth:540,margin:"0 auto"}}>Enviar, recibir y operar con USDT, sin saltar entre apps. Todo por WhatsApp con un asesor real.</p>
  </Reveal>
  <div className="two-col" style={{maxWidth:1080,margin:"50px auto 0",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20}}>
    {[{k:"send",t:"Enviar dinero",d:"A tu familia en 5 países de LATAM. Llega el mismo día."},{k:"receive",t:"Recibir dinero",d:"Recibe desde el exterior con tasa transparente y sin vueltas."},{k:"buy",t:"Comprar USDT",d:"Convierte tus pesos a dólar digital de forma simple y guiada."},{k:"sell",t:"Vender USDT",d:"Pasa tus USDT a pesos al instante, con cotización actualizada."}].map((c,i)=>(
      <Reveal key={c.k} delay={i*0.08}>
        <div className="eco" onClick={()=>openWA(c.t)} style={{cursor:"pointer",background:"#fff",border:"1px solid "+T.border,borderRadius:T.rCard,padding:"30px 26px",height:"100%",boxShadow:T.s1}}>
          <Illu k={c.k}/>
          <h3 style={{fontSize:19,fontWeight:700,margin:"18px 0 8px",letterSpacing:-0.4}}>{c.t}</h3>
          <p style={{fontSize:14.5,color:T.ink2,lineHeight:1.6,margin:0}}>{c.d}</p>
          <span style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:16,color:P,fontWeight:600,fontSize:14}}>Cotizar <span style={{fontSize:16}}>→</span></span>
        </div>
      </Reveal>))}
  </div>
</section>

{/* USDT */}
<section id="s-usdt" style={{padding:"86px clamp(16px,4vw,48px)",background:"linear-gradient(180deg,#FAF7FF,#F4ECFE)",position:"relative",overflow:"hidden"}}>
  <div className="two-col" style={{maxWidth:1080,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"clamp(30px,5vw,64px)",alignItems:"center"}}>
    <Reveal>
      <span style={{display:"inline-flex",alignItems:"center",gap:7,color:T.usdt,fontWeight:700,fontSize:13,letterSpacing:.04,textTransform:"uppercase"}}><span style={{width:8,height:8,borderRadius:"50%",background:T.usdt}} className="pulse-dot"/>Dólar digital</span>
      <h2 style={{fontSize:"clamp(28px,4.2vw,42px)",fontWeight:800,margin:"12px 0 16px",letterSpacing:-1.4}}>Compra y vende USDT fácilmente</h2>
      <p style={{color:T.ink2,fontSize:16.5,lineHeight:1.65,marginBottom:24,maxWidth:460}}>Operaciones rápidas, atención personalizada y cotizaciones actualizadas. Tu dólar digital como parte natural de tu vida financiera en DASH — sin complicaciones de exchange.</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28}}>
        {[["⚡","Operación guiada por WhatsApp, paso a paso"],["📈","Cotización del mercado actualizada al momento"],["🤝","Un asesor real, no una pantalla de trading"]].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:13}}>
            <span style={{flexShrink:0,width:40,height:40,borderRadius:12,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:T.s1}}>{f[0]}</span>
            <span style={{fontSize:15,color:T.ink,fontWeight:500}}>{f[1]}</span>
          </div>))}
      </div>
      <button onClick={()=>openWA("USDT")} className="btn-wa" style={{background:T.wa,color:"#fff",border:"none",borderRadius:14,padding:"16px 32px",fontSize:16,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:9,boxShadow:"0 8px 24px rgba(37,211,102,0.3)"}}><WASvg/> Operar USDT por WhatsApp</button>
    </Reveal>
    <Reveal delay={0.1}><UsdtCoin/></Reveal>
  </div>
</section>

{/* CONFIANZA EN VIVO */}
<section style={{padding:"86px clamp(16px,4vw,48px)",background:"#fff"}}>
  <div className="two-col" style={{maxWidth:1080,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"clamp(30px,5vw,64px)",alignItems:"center"}}>
    <Reveal>
      <span style={{color:P,fontWeight:700,fontSize:13,letterSpacing:.04,textTransform:"uppercase"}}>Tasa transparente</span>
      <h2 style={{fontSize:"clamp(28px,4.2vw,40px)",fontWeight:800,margin:"12px 0 16px",letterSpacing:-1.4}}>No inventamos la tasa.<br/><span style={{color:P}}>La leemos del mercado, en vivo.</span></h2>
      <p style={{color:T.ink2,fontSize:16.5,lineHeight:1.65,maxWidth:460}}>Analizamos el mercado P2P en tiempo real para darte una cotización real y competitiva. La ves antes de mover un solo peso — sin comisiones escondidas, sin letra chica.</p>
    </Reveal>
    <Reveal delay={0.1}><TrustMeter/></Reveal>
  </div>
</section>

{/* RED LATAM */}
<section id="s-red" style={{padding:"86px clamp(16px,4vw,48px)",background:"linear-gradient(180deg,#fff,#FAF7FF)",position:"relative",overflow:"hidden"}}>
  <Reveal style={{maxWidth:680,margin:"0 auto 12px",textAlign:"center"}}>
    <span style={{color:P,fontWeight:700,fontSize:13,letterSpacing:.04,textTransform:"uppercase"}}>Red financiera</span>
    <h2 style={{fontSize:"clamp(28px,4.2vw,42px)",fontWeight:800,margin:"12px 0 14px",letterSpacing:-1.4}}>Una red operando en tiempo real</h2>
    <p style={{color:T.ink2,fontSize:16.5,lineHeight:1.6,maxWidth:520,margin:"0 auto"}}>5 países conectados, dinero moviéndose todos los días. Pasa el mouse sobre un país para ver sus corredores activos.</p>
  </Reveal>
  <Reveal delay={0.1} style={{maxWidth:740,margin:"24px auto 0"}}><LatamNetwork/></Reveal>
</section>

{/* POR QUÉ DASH (COMPARATIVA) */}
<section id="s-why" style={{padding:"86px clamp(16px,4vw,48px)",background:"#fff"}}>
  <Reveal style={{maxWidth:760,margin:"0 auto 44px",textAlign:"center"}}>
    <span style={{color:P,fontWeight:700,fontSize:13,letterSpacing:.04,textTransform:"uppercase"}}>Por qué DASH</span>
    <h2 style={{fontSize:"clamp(28px,4.2vw,42px)",fontWeight:800,margin:"12px 0 0",letterSpacing:-1.4}}>La diferencia se siente desde el primer mensaje</h2>
  </Reveal>
  <Reveal style={{maxWidth:920,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}} className="two-col">
    <div style={{background:"#FBF7FF",border:"1px solid "+T.border,borderRadius:T.rCard,padding:"28px 26px"}}>
      <div style={{fontSize:13,fontWeight:700,color:T.ink3,textTransform:"uppercase",letterSpacing:.06,marginBottom:18}}>Otros servicios</div>
      {["Formularios largos","Apps obligatorias","Tasas poco claras","Soporte lento por tickets"].map((t,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderTop:i?"1px solid "+T.border:"none"}}>
          <span style={{flexShrink:0,width:24,height:24,borderRadius:"50%",background:"#FBE3E3",color:"#C0392B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>✕</span>
          <span style={{fontSize:15,color:T.ink2}}>{t}</span>
        </div>))}
    </div>
    <div style={{background:"linear-gradient(160deg,#fff,#FAF4FF)",border:"2px solid "+P,borderRadius:T.rCard,padding:"28px 26px",boxShadow:T.s2,position:"relative"}}>
      <div style={{position:"absolute",top:-13,right:22,background:P,color:"#fff",fontSize:12,fontWeight:700,padding:"5px 14px",borderRadius:T.rPill}}>DASH</div>
      <div style={{fontSize:13,fontWeight:800,color:P,textTransform:"uppercase",letterSpacing:.06,marginBottom:18}}>Con DASH</div>
      {["WhatsApp directo","Sin descargas ni registros","Mercado en vivo, transparente","Atención personalizada real"].map((t,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderTop:i?"1px solid "+T.border:"none"}}>
          <span style={{flexShrink:0,width:24,height:24,borderRadius:"50%",background:"#E5F8EF",color:T.waDeep,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>✓</span>
          <span style={{fontSize:15,color:T.ink,fontWeight:600}}>{t}</span>
        </div>))}
    </div>
  </Reveal>
</section>

{/* TESTIMONIOS */}
<section style={{padding:"80px clamp(16px,4vw,48px)",background:"#FAF7FF"}}>
  <Reveal style={{maxWidth:1000,margin:"0 auto 44px",textAlign:"center"}}>
    <span style={{color:P,fontWeight:700,fontSize:13,letterSpacing:.04,textTransform:"uppercase"}}>Historias reales</span>
    <h2 style={{fontSize:"clamp(28px,4vw,40px)",fontWeight:800,margin:"12px 0 0",letterSpacing:-1.2}}>Familias que ya confían en DASH</h2>
  </Reveal>
  <div style={{maxWidth:1040,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:20}}>
    {[{q:"Envié de Bogotá a Caracas y llegó el mismo día. No lo podía creer.",n:"Laura G.",city:"Bogotá",co:"CO"},{q:"La tasa fue transparente y mejor de lo que esperaba. Cero sorpresas.",n:"Martín R.",city:"Buenos Aires",co:"AR"},{q:"Todo el proceso fue por WhatsApp y muy rápido. Me atendió una persona real.",n:"Daniela P.",city:"Santiago",co:"CL"},{q:"Compré USDT por primera vez y me guiaron paso a paso. Muy fácil.",n:"José M.",city:"Ciudad de México",co:"MX"},{q:"Le mando a mi familia en Maracaibo cada mes. Siempre puntual.",n:"Andrés V.",city:"Medellín",co:"CO"},{q:"Mejor tasa que mi banco y sin filas ni formularios. Recomendado.",n:"Sofía L.",city:"Córdoba",co:"AR"}].map((t,i)=>(
      <Reveal key={i} delay={(i%3)*0.07}>
        <div className="card-lift" style={{background:"#fff",borderRadius:T.rCard,padding:28,boxShadow:T.s1,border:"1px solid "+T.border,height:"100%",position:"relative"}}>
          <div style={{position:"absolute",top:20,right:24,fontSize:48,color:T.tint,fontWeight:800,lineHeight:1,fontFamily:"Georgia,serif"}}>&rdquo;</div>
          <div style={{color:"#F5A623",marginBottom:12,fontSize:15,letterSpacing:2}}>{STARS}</div>
          <p style={{fontSize:15.5,color:T.ink,lineHeight:1.65,marginBottom:20,fontWeight:500}}>{t.q}</p>
          <div style={{display:"flex",alignItems:"center",gap:12,borderTop:"1px solid "+T.border,paddingTop:16}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#A855F7,#820AD1)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16}}>{t.n.charAt(0)}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14.5}}>{t.n}</div><div style={{fontSize:12.5,color:T.ink3}}>{t.city}</div></div>
            <FlagSvg country={t.co} size={26}/>
          </div>
        </div>
      </Reveal>))}
  </div>
</section>

<section style={{padding:"80px clamp(16px,4vw,48px)",background:"#fff"}}>
  <Reveal style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
    <h2 style={{fontSize:"clamp(26px,4vw,38px)",fontWeight:800,marginBottom:8,letterSpacing:-1.2}}>Así de fácil, en 3 pasos</h2>
    <p style={{color:T.ink3,fontSize:15,marginBottom:48}}>Todo por WhatsApp. Sin apps, sin registros.</p>
  </Reveal>
  <div style={{maxWidth:900,margin:"0 auto",display:"flex",flexWrap:"wrap",justifyContent:"center",gap:40,marginBottom:40}}>
    {[{n:"01",ic:"💬",t:"Escríbenos",d:"Dinos qué quieres hacer: enviar, recibir u operar USDT."},{n:"02",ic:"💱",t:"Confirma la tasa",d:"Te mostramos la cotización en vivo y haces la transferencia."},{n:"03",ic:"✅",t:"Listo",d:"Recibes en minutos. Comprobante por WhatsApp."}].map((s,i)=>(
      <Reveal key={i} delay={i*0.1} style={{flex:"1 1 220px",maxWidth:260}}>
        <div className="card-lift" style={{width:68,height:68,borderRadius:20,background:T.tint,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26,boxShadow:T.s1}}>{s.ic}</div>
        <div style={{color:P,fontWeight:800,fontSize:14,marginBottom:6,textAlign:"center"}}>{s.n}</div>
        <h3 style={{fontSize:16.5,fontWeight:700,marginBottom:8,textAlign:"center",letterSpacing:-0.3}}>{s.t}</h3>
        <p style={{fontSize:13.5,color:T.ink2,lineHeight:1.6,textAlign:"center"}}>{s.d}</p>
      </Reveal>))}
  </div>
  <div style={{textAlign:"center"}}><button onClick={()=>openWA()} className="btn-wa" style={{background:T.wa,color:"#fff",border:"none",borderRadius:14,padding:"16px 36px",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 24px rgba(37,211,102,0.3)",display:"inline-flex",alignItems:"center",gap:8}}><WASvg size={16}/> Empezar por WhatsApp →</button></div>
</section>

<section id="s-faq" style={{padding:"80px clamp(16px,4vw,48px)",background:"#FAF7FF"}}>
  <Reveal style={{maxWidth:700,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(26px,4vw,38px)",fontWeight:800,textAlign:"center",marginBottom:40,letterSpacing:-1.2}}>Preguntas <span style={{color:P}}>frecuentes</span></h2>
    {["¿Qué puedo hacer con DASH?|Enviar y recibir dinero entre 5 países de LATAM, y comprar o vender USDT. Todo por WhatsApp.","¿Cómo funciona la compra/venta de USDT?|Nos escribes, te damos la cotización en vivo y te guiamos paso a paso. Sin exchange ni apps complicadas.","¿Cuánto tarda en llegar una remesa?|Típicamente menos de 30 minutos. Usualmente en menos de 15.","¿Cuánto cobran de comisión?|La tasa del simulador ya incluye todo. Sin cargos ocultos.","¿Necesito descargar algo?|No. Todo funciona por WhatsApp, sin apps ni registros.","¿Es seguro?|Verificación y comprobante de cada operación, con un asesor real acompañándote."].map(function(item,i){var p=item.split("|");return <Fq key={i} q={p[0]} a={p[1]} i={i}/>})}
  </Reveal>
</section>

<section style={{padding:"84px clamp(16px,4vw,48px)",background:"linear-gradient(135deg,#820AD1,#6B21A8)",textAlign:"center",position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-110,left:-110,width:320,height:320,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)"}}/>
  <div style={{position:"absolute",bottom:-90,right:-90,width:260,height:260,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.08)"}}/>
  <h2 style={{fontSize:"clamp(30px,5vw,46px)",fontWeight:800,marginBottom:12,color:"#fff",position:"relative",letterSpacing:-1.4}}>Tu dinero, sin fronteras.<br/>Empieza <span style={{color:"#E9D5FF"}}>hoy</span>.</h2>
  <p style={{fontSize:16,color:"rgba(255,255,255,0.78)",maxWidth:480,margin:"0 auto 32px"}}>Envía, recibe u opera USDT. Un WhatsApp y listo.</p>
  <button onClick={()=>openWA()} className="btn-glow" style={{background:"#fff",color:P,border:"none",borderRadius:T.rPill,padding:"18px 44px",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:"0 10px 30px rgba(0,0,0,0.2)",display:"inline-flex",alignItems:"center",gap:9,position:"relative"}}><WASvg size={18} color="#820AD1"/> Cotizar ahora →</button>
</section>

<footer style={{background:"#15071F",padding:"56px clamp(16px,4vw,48px) 36px",fontSize:14,color:"#8A8398"}}>
  <div style={{maxWidth:1080,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:32}}>
    <div style={{gridColumn:"1 / -1",maxWidth:320}}>
      <span style={{fontWeight:800,fontSize:22,color:"#A855F7"}}>DA$HR</span>
      <p style={{marginTop:10,lineHeight:1.6}}>Remesas y USDT para toda Latinoamérica. Rápido, transparente y humano.</p>
      <div style={{display:"flex",gap:12,marginTop:18}}>
        <a href={"https://wa.me/"+WA} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{width:40,height:40,borderRadius:12,background:"rgba(37,211,102,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><WASvg size={18} color="#25D366"/></a>
        <a href={IG} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{width:40,height:40,borderRadius:12,background:"rgba(168,85,247,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C77DFF" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#C77DFF" stroke="none"/></svg></a>
      </div>
    </div>
    <div>
      <div style={{color:"#fff",fontWeight:700,fontSize:13,marginBottom:14}}>Países</div>
      {["🇨🇴 Colombia","🇦🇷 Argentina","🇻🇪 Venezuela","🇲🇽 México","🇨🇱 Chile"].map((c,i)=><div key={i} style={{marginBottom:9}}>{c}</div>)}
    </div>
    <div>
      <div style={{color:"#fff",fontWeight:700,fontSize:13,marginBottom:14}}>Servicios</div>
      {[["Enviar dinero","#s-eco"],["Recibir dinero","#s-eco"],["Comprar USDT","#s-usdt"],["Vender USDT","#s-usdt"]].map(([t,h],i)=><div key={i} style={{marginBottom:9}}><a href={h} className="flink" style={{color:"#8A8398",textDecoration:"none"}}>{t}</a></div>)}
    </div>
    <div>
      <div style={{color:"#fff",fontWeight:700,fontSize:13,marginBottom:14}}>Legal</div>
      {[["Términos y condiciones","#"],["Política de privacidad","#"],["Preguntas frecuentes","#s-faq"],["Contacto","https://wa.me/"+WA]].map(([t,h],i)=><div key={i} style={{marginBottom:9}}><a href={h} target={h.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" className="flink" style={{color:"#8A8398",textDecoration:"none"}}>{t}</a></div>)}
    </div>
  </div>
  <div style={{maxWidth:1080,margin:"36px auto 0",borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:22,display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:10,fontSize:12.5,color:"#5A5470"}}>
    <span>© 2026 DASHR. Todos los derechos reservados.</span>
    <span>Hecho con 💜 para Latinoamérica</span>
  </div>
</footer>

<div className="mwa" style={{position:"fixed",bottom:14,left:14,right:14,zIndex:120}}>
  <button onClick={()=>openWA()} className="btn-wa" style={{width:"100%",justifyContent:"center",background:T.wa,color:"#fff",border:"none",borderRadius:14,padding:16,fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 10px 30px rgba(37,211,102,0.45)",fontFamily:"inherit"}}><WASvg size={18}/> Cotizar por WhatsApp</button>
</div>
</div>);
}
