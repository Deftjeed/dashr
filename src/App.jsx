import { useState, useEffect } from "react";

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
function cf(f,t){const p=[f,t].sort().join("-");return p==="ARS-COP"?.96:(p==="COP-VES"||p==="ARS-VES")?.94:.915}
function calc(a,f,t,r){if(!a||a<=0||f===t||!r||!r[f]||!r[t])return{result:0,rate:0};const u=a/r[f],b=u*r[t],fin=b*cf(f,t),rd=Math.floor(fin/100)*100;return{result:Math.max(0,rd),rate:a>0?rd/a:0}}

// ══════════ CONFIG ══════════
const WA="573117405064";
const CU=[{c:"COP",n:"Colombia",s:"$",sub:"Peso colombiano"},{c:"ARS",n:"Argentina",s:"$",sub:"Peso argentino"},{c:"VES",n:"Venezuela",s:"Bs.",sub:"Bolívar"},{c:"MXN",n:"México",s:"$",sub:"Peso mexicano"},{c:"CLP",n:"Chile",s:"$",sub:"Peso chileno"}];
const PR={COP:[100000,200000,500000],ARS:[50000,100000,500000],VES:[100,500,1000],MXN:[1000,5000,10000],CLP:[50000,100000,500000]};
const fm=n=>Math.floor(n).toLocaleString("es-CO");
const pa=s=>parseInt(s.replace(/[^0-9]/g,""),10)||0;
const gc=c=>CU.find(x=>x.c===c);
const STARS=String.fromCharCode(9733,9733,9733,9733,9733);
const WASvg=({size=18,color="white"})=><svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

// ══════════ CSS ANIMATIONS ══════════
const CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes orbit{from{transform:rotate(0deg) translateX(120px) rotate(0deg)}to{transform:rotate(360deg) translateX(120px) rotate(-360deg)}}
@keyframes orbit3d{0%{transform:rotate(var(--start)) translateX(var(--radius)) rotate(calc(-1*var(--start))) scale(1);opacity:1;filter:blur(0)}50%{transform:rotate(calc(var(--start) + 180deg)) translateX(var(--radius)) rotate(calc(-1*(var(--start) + 180deg))) scale(0.7);opacity:0.5;filter:blur(1px)}100%{transform:rotate(calc(var(--start) + 360deg)) translateX(var(--radius)) rotate(calc(-1*(var(--start) + 360deg))) scale(1);opacity:1;filter:blur(0)}}
@keyframes coreGlow{0%,100%{box-shadow:0 0 30px rgba(130,10,209,0.3),0 0 60px rgba(130,10,209,0.15),inset 0 0 30px rgba(255,255,255,0.1)}50%{box-shadow:0 0 50px rgba(130,10,209,0.45),0 0 100px rgba(130,10,209,0.2),inset 0 0 40px rgba(255,255,255,0.15)}}
@keyframes coreSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes coinSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
@keyframes particleFloat{0%,100%{opacity:0;transform:translate(0,0) scale(0.5)}25%{opacity:0.6}50%{opacity:0.8;transform:translate(var(--px),var(--py)) scale(1)}75%{opacity:0.4}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(130,10,209,0.15)}50%{box-shadow:0 0 40px rgba(130,10,209,0.3)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.fade-up{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
.fade-in{animation:fadeIn .6s ease both}
.slide-in{animation:slideIn .7s cubic-bezier(.22,1,.36,1) both}
.d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}.d4{animation-delay:.4s}.d5{animation-delay:.5s}
.btn-glow{transition:all .25s cubic-bezier(.22,1,.36,1)}
.btn-glow:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 8px 32px rgba(130,10,209,0.35)!important}
.btn-glow:active{transform:translateY(0) scale(.98)}
.btn-outline{transition:all .25s cubic-bezier(.22,1,.36,1)}
.btn-outline:hover{background:rgba(130,10,209,0.06)!important;transform:translateY(-1px)}
.card-lift{transition:all .3s cubic-bezier(.22,1,.36,1)}
.card-lift:hover{transform:translateY(-8px);box-shadow:0 16px 48px rgba(130,10,209,0.14)!important}
.sim-card{animation:float 6s ease-in-out infinite,glow 4s ease-in-out infinite}
.pulse-dot{animation:pulse 2s ease-in-out infinite}
.orbit-item{position:absolute;animation:orbit linear infinite}
.nav-link{transition:color .2s}.nav-link:hover{color:#820AD1!important}
.input-focus{transition:border-color .2s,box-shadow .2s}
.input-focus:focus-within{border-color:#820AD1!important;box-shadow:0 0 0 3px rgba(130,10,209,0.1)!important}
`;

function Fq({q,a,i}){const[o,setO]=useState(false);return(
<div className={"fade-up d"+(i%4+1)} style={{background:"#fff",borderRadius:14,marginBottom:10,border:"1px solid #f0f0f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.03)",transition:"box-shadow .2s"}}
  onMouseOver={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(130,10,209,0.08)"}
  onMouseOut={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.03)"}>
  <button onClick={()=>setO(!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",background:"none",border:"none",cursor:"pointer",padding:"20px 22px",fontFamily:"inherit",gap:16}}>
    <span style={{fontSize:15,fontWeight:600,color:"#1a1a1a",textAlign:"left"}}>{q}</span>
    <span style={{fontSize:14,color:"#820AD1",transition:"transform .3s cubic-bezier(.22,1,.36,1)",transform:o?"rotate(180deg)":"none",flexShrink:0}}>{o?String.fromCharCode(8963):String.fromCharCode(8964)}</span>
  </button>
  <div style={{maxHeight:o?200:0,overflow:"hidden",transition:"max-height .4s cubic-bezier(.22,1,.36,1)"}}><div style={{padding:"0 22px 20px",fontSize:14,color:"#666",lineHeight:1.7}}>{a}</div></div>
</div>)}

function FlagSvg({country,size=32}){
  const s=size;
  if(country==="CO") return <svg width={s} height={s} viewBox="0 0 40 30" style={{borderRadius:4,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.12))"}}><rect width="40" height="15" fill="#FCD116"/><rect y="15" width="40" height="7.5" fill="#003893"/><rect y="22.5" width="40" height="7.5" fill="#CE1126"/></svg>;
  if(country==="AR") return <svg width={s} height={s} viewBox="0 0 40 30" style={{borderRadius:4,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.12))"}}><rect width="40" height="30" fill="#fff"/><rect width="40" height="10" fill="#75AADB"/><rect y="20" width="40" height="10" fill="#75AADB"/><circle cx="20" cy="15" r="3.5" fill="#F6B40E"/></svg>;
  if(country==="VE") return <svg width={s} height={s} viewBox="0 0 40 30" style={{borderRadius:4,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.12))"}}><rect width="40" height="10" fill="#CF142B"/><rect y="10" width="40" height="10" fill="#00247D"/><rect y="20" width="40" height="10" fill="#FC0"/>{[0,1,2,3,4,5,6].map(function(j){return <circle key={j} cx={12+j*2.3} cy="15" r="0.8" fill="#fff"/>})}</svg>;
  if(country==="MX") return <svg width={s} height={s} viewBox="0 0 40 30" style={{borderRadius:4,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.12))"}}><rect width="13.3" height="30" fill="#006847"/><rect x="13.3" width="13.4" height="30" fill="#fff"/><rect x="26.7" width="13.3" height="30" fill="#CE1126"/><circle cx="20" cy="15" r="3" fill="#6B3A2A"/></svg>;
  if(country==="CL") return <svg width={s} height={s} viewBox="0 0 40 30" style={{borderRadius:4,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.12))"}}><rect width="40" height="30" fill="#D52B1E"/><rect y="0" width="40" height="15" fill="#fff"/><rect width="13.3" height="15" fill="#0039A6"/><polygon points="6.65,4 7.5,7 10.5,7 8,8.8 8.8,12 6.65,10 4.5,12 5.3,8.8 2.8,7 5.8,7" fill="#fff"/></svg>;
  return null;
}

function OrbitingCountries(){
  const[hovered,setHovered]=useState(null);
  const items=[
    {cc:"CO",code:"COP",name:"Colombia",angle:0,speed:24,radius:130},
    {cc:"AR",code:"ARS",name:"Argentina",angle:72,speed:28,radius:130},
    {cc:"VE",code:"VES",name:"Venezuela",angle:144,speed:32,radius:130},
    {cc:"MX",code:"MXN",name:"México",angle:216,speed:22,radius:130},
    {cc:"CL",code:"CLP",name:"Chile",angle:288,speed:26,radius:130},
  ];
  const particles=Array.from({length:12},function(_,i){return i});
  return <div style={{position:"relative",width:320,height:320,margin:"32px auto"}}
    onMouseEnter={function(){}}
    onMouseLeave={function(){setHovered(null)}}>
    {/* Orbital rings */}
    <div style={{position:"absolute",top:"50%",left:"50%",width:260,height:260,marginTop:-130,marginLeft:-130,borderRadius:"50%",border:"1px solid rgba(130,10,209,0.08)",background:"radial-gradient(ellipse,rgba(130,10,209,0.03) 0%,transparent 70%)"}}/>
    <div style={{position:"absolute",top:"50%",left:"50%",width:220,height:220,marginTop:-110,marginLeft:-110,borderRadius:"50%",border:"1px dashed rgba(130,10,209,0.06)"}}/>
    {/* Particles */}
    {particles.map(function(p){var a=p*30,r=100+Math.random()*60,px=Math.cos(a*Math.PI/180)*r,py=Math.sin(a*Math.PI/180)*r;return <div key={"p"+p} style={{position:"absolute",top:"50%",left:"50%",width:3+Math.random()*3,height:3+Math.random()*3,borderRadius:"50%",background:"rgba(130,10,209,"+(0.15+Math.random()*0.2)+")",marginTop:-1.5,marginLeft:-1.5,animation:"particleFloat "+(4+Math.random()*6)+"s ease-in-out infinite",animationDelay:(-Math.random()*6)+"s","--px":px+"px","--py":py+"px"}}/>})}
    {/* Core sphere */}
    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#A855F7,#820AD1 50%,#6B21A8 100%)",animation:"coreGlow 3s ease-in-out infinite",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,borderRadius:"50%",background:"radial-gradient(circle at 30% 25%,rgba(255,255,255,0.35) 0%,transparent 50%)"}}/>
      <span style={{color:"#fff",fontWeight:800,fontSize:14,zIndex:1,textShadow:"0 1px 4px rgba(0,0,0,0.2)",letterSpacing:-0.5}}>DA$HR</span>
    </div>
    {/* Inner glow */}
    <div style={{position:"absolute",top:"50%",left:"50%",width:100,height:100,marginTop:-50,marginLeft:-50,borderRadius:"50%",background:"radial-gradient(circle,rgba(130,10,209,0.12) 0%,transparent 70%)",animation:"coreSpin 20s linear infinite",pointerEvents:"none"}}/>
    {/* Orbiting flag coins */}
    {items.map(function(item,i){return <div key={i} style={{position:"absolute",top:"50%",left:"50%",marginTop:-30,marginLeft:-30,animation:"orbit3d "+item.speed+"s linear infinite",animationPlayState:hovered!==null?"paused":"running","--start":item.angle+"deg","--radius":item.radius+"px",zIndex:hovered===i?20:5,cursor:"pointer"}}
      onMouseEnter={function(){setHovered(i)}}
      onMouseLeave={function(){setHovered(null)}}>
      <div style={{width:60,height:60,borderRadius:18,background:"linear-gradient(145deg,#fff 0%,#f5f3ff 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,boxShadow:hovered===i?"0 8px 32px rgba(130,10,209,0.25),0 0 20px rgba(130,10,209,0.15)":"0 4px 20px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04)",border:hovered===i?"1.5px solid rgba(130,10,209,0.3)":"1px solid rgba(0,0,0,0.06)",transition:"all 0.4s cubic-bezier(.22,1,.36,1)",transform:hovered===i?"scale(1.18)":"scale(1)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(180deg,rgba(255,255,255,0.7) 0%,transparent 100%)",borderRadius:"18px 18px 0 0",pointerEvents:"none"}}/>
        <FlagSvg country={item.cc} size={28}/>
        <span style={{fontSize:9,fontWeight:800,color:"#820AD1",letterSpacing:0.5,zIndex:1}}>{item.code}</span>
      </div>
      {hovered===i&&<div style={{position:"absolute",top:66,left:"50%",transform:"translateX(-50%)",background:"rgba(26,26,26,0.92)",backdropFilter:"blur(8px)",borderRadius:10,padding:"8px 14px",whiteSpace:"nowrap",zIndex:30,boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{item.name}</div>
        <div style={{fontSize:10,color:"#A78BFA",marginTop:2}}>Tasa en tiempo real</div>
      </div>}
    </div>})}
    {/* Bottom shadow */}
    <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",width:180,height:20,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(130,10,209,0.08) 0%,transparent 70%)"}}/>
  </div>
}

export default function App(){
  const[fromC,setFromC]=useState("COP");
  const[toC,setToC]=useState("ARS");
  const[input,setInput]=useState("500.000");
  const[rates,setRates]=useState(FALLBACK_RATES);
  const[ready,setReady]=useState(false);
  useEffect(()=>{loadRates().then(r=>{setRates(r.rates);setReady(true)});var iv=setInterval(()=>{loadRates().then(r=>{setRates(r.rates)})},CACHE_MS);return()=>clearInterval(iv)},[]);
  const amt=pa(input),{result,rate}=calc(amt,fromC,toC,rates),fi=gc(fromC),ti=gc(toC);
  const swap=()=>{const t=fromC;setFromC(toC);setToC(t);setInput(result>0?fm(result):"100.000")};
  const hF=v=>{if(v===toC)setToC(fromC);setFromC(v)};
  const hT=v=>{if(v===fromC)setFromC(toC);setToC(v)};
  const openWA=()=>{const m=encodeURIComponent("Hola DASHR, quiero hacer una remesa: Envío: "+fm(amt)+" "+fromC+" Destino: "+toC+" Mi destinatario recibiría: "+fm(result)+" "+toC+" Cómo procedo?");window.open("https://wa.me/"+WA+"?text="+m,"_blank")};
  const toSim=()=>document.getElementById("sim")?.scrollIntoView({behavior:"smooth"});
  const P="#820AD1";

  return(
<div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:"#1a1a1a",background:"#fff",minHeight:"100vh"}}>
<style>{CSS}</style>

{/* NAV */}
<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.85)",backdropFilter:"blur(20px) saturate(1.8)",borderBottom:"1px solid rgba(0,0,0,0.06)",padding:"0 clamp(16px,4vw,48px)",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
  <span style={{fontWeight:800,fontSize:24,color:P,letterSpacing:-0.5}}>DA$HR</span>
  <div style={{display:"flex",gap:32,fontSize:14,fontWeight:500}}>{["Beneficios","Como funciona","Destinos","FAQ"].map((t,i)=><a key={i} href={"#s"+i} className="nav-link" style={{textDecoration:"none",color:"#888"}}>{t}</a>)}</div>
  <button onClick={toSim} className="btn-glow" style={{background:P,color:"#fff",border:"none",borderRadius:100,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 12px rgba(130,10,209,0.25)"}}>Cotizar ahora</button>
</nav>

{/* HERO */}
<section style={{padding:"clamp(60px,10vw,120px) clamp(16px,4vw,48px) 80px",display:"flex",flexWrap:"wrap",gap:"clamp(32px,5vw,80px)",alignItems:"center",maxWidth:1200,margin:"0 auto",position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-200,right:-200,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(130,10,209,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>

  <div className="fade-up" style={{flex:"1 1 420px",minWidth:0,position:"relative",zIndex:1}}>
    <div className="fade-up d1" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#F3E8FF",borderRadius:100,padding:"8px 18px",marginBottom:28}}>
      <span className="pulse-dot" style={{width:8,height:8,borderRadius:"50%",background:"#22C55E"}}/>
      <span style={{fontSize:13,fontWeight:600,color:P}}>Tasa en tiempo real</span>
    </div>
    <h1 className="fade-up d2" style={{fontSize:"clamp(40px,5.5vw,60px)",fontWeight:800,lineHeight:1.04,letterSpacing:-2.5,margin:"0 0 20px"}}>{"Envía dinero a"}<br/><span style={{color:P,background:"linear-gradient(135deg,#820AD1,#A855F7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Argentina</span><br/>{"y recíbelo "}<span style={{color:P,background:"linear-gradient(135deg,#820AD1,#A855F7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>hoy</span></h1>
    <p className="fade-up d3" style={{fontSize:17,color:"#666",lineHeight:1.6,margin:"0 0 8px"}}>Sin apps, sin registros. Todo por WhatsApp.</p>
    <p className="fade-up d3" style={{fontSize:14,color:"#aaa",lineHeight:1.6,margin:"0 0 32px",maxWidth:440}}>La mejor tasa del mercado, sin comisiones ocultas. Tu dinero llega en minutos a Argentina, Venezuela y más.</p>
    <div className="fade-up d4" style={{display:"flex",flexDirection:"column",gap:12}}>
      <button onClick={openWA} className="btn-glow" style={{background:P,color:"#fff",border:"none",borderRadius:14,padding:"18px 36px",fontSize:16,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,maxWidth:420,boxShadow:"0 4px 24px rgba(130,10,209,0.3)"}}><WASvg/> Cotizar por WhatsApp</button>
      <button onClick={()=>document.getElementById("s1")?.scrollIntoView({behavior:"smooth"})} className="btn-outline" style={{background:"transparent",border:"2px solid "+P,borderRadius:14,padding:"16px 36px",fontSize:15,fontWeight:600,cursor:"pointer",color:P,maxWidth:260}}>{"¿Cómo funciona?"}</button>
    </div>
    <div className="fade-up d5" style={{display:"flex",gap:24,marginTop:28,fontSize:13,color:"#aaa"}}>
      <span style={{display:"flex",alignItems:"center",gap:5}}><span className="pulse-dot" style={{width:7,height:7,borderRadius:"50%",background:"#22C55E"}}/>Tasa en vivo</span>
      <span>{"🔒"} Seguro</span>
      <span>{"⚡"} En minutos</span>
    </div>
  </div>

  {/* SIMULATOR - Glassmorphism */}
  <div id="sim" className="slide-in" style={{flex:"1 1 400px",maxWidth:460,minWidth:0}}>
    <div className="sim-card" style={{background:"rgba(255,255,255,0.8)",backdropFilter:"blur(20px) saturate(1.5)",borderRadius:28,padding:32,boxShadow:"0 8px 60px rgba(130,10,209,0.1)",border:"1px solid rgba(255,255,255,0.6)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <span style={{fontWeight:700,fontSize:19}}>Simulador de envío</span>
        <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#22C55E",fontWeight:600,background:"#F0FDF4",padding:"5px 14px",borderRadius:100}}><span className="pulse-dot" style={{width:7,height:7,borderRadius:"50%",background:"#22C55E"}}/>{ready?"En vivo":"Cargando..."}</span>
      </div>
      <label style={{fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:8}}>Tú envías</label>
      <div className="input-focus" style={{display:"flex",gap:8,marginBottom:6}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#FAFAFA",border:"1.5px solid #e8e8e8",borderRadius:14,padding:"0 16px",transition:"all .2s"}}>
          <span style={{fontSize:14,color:"#ccc",fontWeight:700}}>{fromC.substring(0,2)}</span>
          <input type="text" inputMode="numeric" value={input} onChange={e=>{const r=pa(e.target.value);setInput(r>0?fm(r):"")}} style={{flex:1,fontSize:24,fontWeight:700,fontFamily:"'SF Mono','Fira Code',monospace",padding:"16px 0",border:"none",outline:"none",background:"transparent",color:"#1a1a1a",minWidth:0}}/>
        </div>
        <select value={fromC} onChange={e=>hF(e.target.value)} style={{width:85,fontSize:14,fontWeight:600,padding:"16px 8px",background:"#FAFAFA",border:"1.5px solid #e8e8e8",borderRadius:14,color:P,cursor:"pointer",outline:"none",transition:"border .2s"}}>{CU.map(c=><option key={c.c} value={c.c}>{c.c}</option>)}</select>
      </div>
      <div style={{fontSize:11,color:"#ccc",marginBottom:12}}>{fi.sub}</div>
      <div style={{display:"flex",justifyContent:"center",margin:"4px 0 12px"}}><button onClick={swap} className="btn-outline" style={{width:44,height:44,borderRadius:"50%",border:"1.5px solid #e8e8e8",background:"#fff",cursor:"pointer",fontSize:18,color:P,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",transition:"all .3s cubic-bezier(.22,1,.36,1)"}} onMouseOver={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseOut={e=>e.currentTarget.style.transform=""}>{"↓"}</button></div>
      <label style={{fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:8}}>Ellos reciben</label>
      <div style={{display:"flex",gap:8,marginBottom:6}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#F3E8FF,#EDE9FE)",border:"1.5px solid #E9D5FF",borderRadius:14,padding:"0 16px",transition:"all .3s"}}>
          <span style={{fontSize:14,color:"#A78BFA",fontWeight:700}}>{toC.substring(0,2)}</span>
          <input type="text" readOnly value={fm(result)} style={{flex:1,fontSize:24,fontWeight:700,fontFamily:"'SF Mono','Fira Code',monospace",padding:"16px 0",border:"none",outline:"none",background:"transparent",color:P,cursor:"default",minWidth:0,transition:"color .3s"}}/>
        </div>
        <select value={toC} onChange={e=>hT(e.target.value)} style={{width:85,fontSize:14,fontWeight:600,padding:"16px 8px",background:"#FAFAFA",border:"1.5px solid #e8e8e8",borderRadius:14,color:P,cursor:"pointer",outline:"none"}}>{CU.map(c=><option key={c.c} value={c.c}>{c.c}</option>)}</select>
      </div>
      <div style={{fontSize:11,color:"#ccc",marginBottom:16}}>{ti.sub}</div>
      <div style={{fontSize:13,color:"#888",marginBottom:20,padding:"10px 14px",background:"#FAFAFA",borderRadius:10,transition:"all .3s"}}>{rate>0?"Tasa actualizada: 1 "+fromC+" = "+rate.toFixed(4)+" "+toC:"Ingresa un monto para ver la tasa"}</div>
      <button onClick={openWA} disabled={result<=0} className="btn-glow" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:18,border:"none",borderRadius:14,background:result>0?P:"#e8e8e8",color:"#fff",fontSize:17,fontWeight:700,cursor:result>0?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:result>0?"0 4px 24px rgba(130,10,209,0.3)":"none"}}><WASvg/> {"Cotizar por WhatsApp →"}</button>
      <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:12}}>Respuesta en menos de 2 minutos</p>
    </div>
  </div>
</section>

{/* STATS */}
<section style={{background:"linear-gradient(135deg,#F3E8FF,#EDE9FE)",padding:"44px clamp(16px,4vw,48px)"}}>
  <div style={{maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:24}}>
    {[{n:"+2,500",l:"Envíos realizados"},{n:"< 30 min",l:"Tiempo promedio"},{n:"$0",l:"Comisiones ocultas"},{n:"4.9 "+STARS.charAt(0),l:"Calificación"}].map((s,i)=><div key={i} style={{textAlign:"center",minWidth:130}}><div style={{fontSize:34,fontWeight:800,color:P}}>{s.n}</div><div style={{fontSize:13,color:"#6B21A8",marginTop:4,opacity:0.6}}>{s.l}</div></div>)}
  </div>
</section>

{/* PRODUCT FLOW - Stripe style */}
<section style={{padding:"80px clamp(16px,4vw,48px)",background:"#fff",overflow:"hidden"}}>
  <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
    <h2 className="fade-up" style={{fontSize:"clamp(28px,4vw,38px)",fontWeight:800,marginBottom:12}}>{"Así se ve "}<span style={{color:P}}>en acción</span></h2>
    <p style={{color:"#999",fontSize:15,marginBottom:48}}>Tu dinero cruza fronteras en minutos</p>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",gap:20}}>
      <div className="card-lift" style={{background:"#FAFAFA",borderRadius:20,padding:24,minWidth:200,boxShadow:"0 2px 12px rgba(0,0,0,0.04)",border:"1px solid #f0f0f0"}}>
        <div style={{fontSize:11,color:"#aaa",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Envias</div>
        <div style={{fontSize:28,fontWeight:800,color:"#1a1a1a",fontFamily:"'SF Mono',monospace"}}>$500.000</div>
        <div style={{fontSize:13,color:"#888",marginTop:4}}>COP Colombia</div>
      </div>
      <div style={{fontSize:28,color:P,fontWeight:300}}>{"→"}</div>
      <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#820AD1,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(130,10,209,0.3)"}}>
        <WASvg size={28} color="white"/>
      </div>
      <div style={{fontSize:28,color:P,fontWeight:300}}>{"→"}</div>
      <div className="card-lift" style={{background:"linear-gradient(135deg,#F3E8FF,#EDE9FE)",borderRadius:20,padding:24,minWidth:200,boxShadow:"0 2px 12px rgba(130,10,209,0.08)",border:"1px solid #E9D5FF"}}>
        <div style={{fontSize:11,color:"#6B21A8",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Reciben</div>
        <div style={{fontSize:28,fontWeight:800,color:P,fontFamily:"'SF Mono',monospace"}}>{fm(calc(500000,"COP","ARS",rates).result)}</div>
        <div style={{fontSize:13,color:"#7C3AED",marginTop:4}}>ARS Argentina</div>
      </div>
    </div>
  </div>
</section>

{/* CARDS */}
<section style={{padding:"80px clamp(16px,4vw,48px)",background:"#F8F7FC"}}>
  <div style={{maxWidth:1100,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(28px,4vw,38px)",fontWeight:800,marginBottom:12}}>Tu dinero en modo fácil</h2>
    <p style={{color:"#999",fontSize:15,marginBottom:40}}>Simple, rápido y sin complicaciones</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20}}>
      {[{t:"Rápido",d:"Envía y recibe en minutos sin complicaciones",dt:"WhatsApp directo",ic:"⚡",cl:"#7C3AED"},{t:"Simple",d:"Sin apps, sin registros, sin formularios",dt:"Solo simula y escribe",ic:"💬",cl:"#9333EA"},{t:"Transparente",d:"Ves exactamente cuánto reciben antes de enviar",dt:"Tasa en tiempo real",ic:"👁",cl:"#A855F7"},{t:"Seguro",d:"Atención personal y seguimiento de cada operación",dt:"Soporte 24/7",ic:"🔒",cl:"#6B21A8"}].map((c,i)=>(
        <div key={i} className={"card-lift fade-up d"+(i+1)} style={{borderRadius:22,overflow:"hidden",background:"#fff",boxShadow:"0 2px 16px rgba(130,10,209,0.06)",border:"1px solid #f0f0f0"}}>
          <div style={{height:140,background:"linear-gradient(135deg,"+c.cl+",#C084FC)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <span style={{fontSize:44,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.2))"}}>{c.ic}</span>
            <h3 style={{position:"absolute",bottom:14,left:18,color:"#fff",fontSize:20,fontWeight:700,margin:0,fontStyle:"italic",textShadow:"0 1px 6px rgba(0,0,0,0.15)"}}>{c.t}</h3>
          </div>
          <div style={{padding:"18px 20px 24px"}}><p style={{fontSize:14,color:"#555",lineHeight:1.5,margin:"0 0 8px"}}>{c.d}</p><span style={{fontSize:12,color:P,fontWeight:600}}>{c.dt}</span></div>
        </div>))}
    </div>
  </div>
</section>

{/* BENEFITS */}
<section id="s0" style={{padding:"80px clamp(16px,4vw,48px)",background:"#fff"}}>
  <div style={{maxWidth:1100,margin:"0 auto",textAlign:"center"}}>
    <h2 style={{fontSize:"clamp(28px,4vw,38px)",fontWeight:800,marginBottom:8}}>{"¿Por qué "}<span style={{color:P}}>+2,500 personas</span>{" eligen DASHR?"}</h2>
    <p style={{color:"#999",fontSize:15,marginBottom:48}}>No somos un banco. Somos más rápidos, más baratos y más humanos.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      {[{i:"$",t:"Mejor tasa garantizada",d:"Comparamos en tiempo real para darte la tasa más competitiva."},{i:"⚡",t:"Recibe en minutos",d:"Tu dinero llega en menos de 30 minutos."},{i:"🔒",t:"100% seguro",d:"Encriptacion y verificacion de identidad."},{i:"🕐",t:"Disponible 24/7",d:"Disponible todos los días, incluso feriados."},{i:"👤",t:"Atención personalizada",d:"Un asesor real por WhatsApp. Nada de bots."},{i:"🌎",t:"Soporte en español",d:"Hablamos tu idioma. Sin menús automáticos."}].map((b,i)=>(
        <div key={i} className={"card-lift fade-up d"+(i%4+1)} style={{background:"#fff",borderRadius:20,padding:"28px 24px",textAlign:"left",boxShadow:"0 2px 12px rgba(130,10,209,0.04)",border:"1px solid #f0f0f0"}}>
          <div style={{width:50,height:50,borderRadius:16,background:"#F3E8FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:16}}>{b.i}</div>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>{b.t}</h3>
          <p style={{fontSize:14,color:"#888",lineHeight:1.6,margin:0}}>{b.d}</p>
        </div>))}
    </div>
  </div>
</section>

{/* HOW IT WORKS */}
<section id="s1" style={{padding:"80px clamp(16px,4vw,48px)",background:"#F8F7FC"}}>
  <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
    <h2 style={{fontSize:"clamp(28px,4vw,38px)",fontWeight:800,marginBottom:8}}>{"Enviar dinero nunca fue "}<span style={{color:P}}>tan fácil</span></h2>
    <p style={{color:"#999",fontSize:15,marginBottom:48}}>3 pasos simples. Todo por WhatsApp.</p>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:40,marginBottom:40}}>
      {[{n:"01",ic:"💬",t:"Escríbenos por WhatsApp",d:"Dinos cuánto quieres enviar y a dónde."},{n:"02",ic:"💱",t:"Haz la transferencia",d:"Transfiere a nuestra cuenta local."},{n:"03",ic:"✅",t:"¡Dinero entregado!",d:"Reciben en minutos. Comprobante por WhatsApp."}].map((s,i)=>(
        <div key={i} className={"fade-up d"+(i+1)} style={{flex:"1 1 220px",maxWidth:260}}>
          <div className="card-lift" style={{width:68,height:68,borderRadius:20,background:"#F3E8FF",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26,boxShadow:"0 4px 16px rgba(130,10,209,0.08)"}}>{s.ic}</div>
          <div style={{color:P,fontWeight:800,fontSize:14,marginBottom:6}}>{s.n}</div>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>{s.t}</h3>
          <p style={{fontSize:13,color:"#999",lineHeight:1.6}}>{s.d}</p>
        </div>))}
    </div>
    <button onClick={openWA} className="btn-glow" style={{background:P,color:"#fff",border:"none",borderRadius:14,padding:"16px 40px",fontSize:16,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 24px rgba(130,10,209,0.3)",display:"inline-flex",alignItems:"center",gap:8}}><WASvg size={16}/> {"Cotizar por WhatsApp →"}</button>
  </div>
</section>

{/* ORBITING COUNTRIES */}
<section style={{padding:"80px clamp(16px,4vw,48px) 60px",background:"linear-gradient(180deg,#fff 0%,#F8F7FC 100%)",overflow:"hidden",position:"relative"}}>
  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(130,10,209,0.04) 0%,transparent 60%)",pointerEvents:"none"}}/>
  <div style={{maxWidth:600,margin:"0 auto",textAlign:"center",position:"relative"}}>
    <h2 style={{fontSize:"clamp(26px,3.5vw,36px)",fontWeight:800,marginBottom:4}}>{"Conectamos "}<span style={{color:P}}>toda Latinoamérica</span></h2>
    <p style={{color:"#aaa",fontSize:14,marginBottom:0}}>5 países, una sola plataforma</p>
    <OrbitingCountries/>
    <p style={{color:"#bbb",fontSize:13,marginTop:4}}>Pasa el mouse sobre las banderas</p>
  </div>
</section>

{/* DESTINATIONS */}
<section id="s2" style={{padding:"60px clamp(16px,4vw,48px)",background:"#F8F7FC"}}>
  <div style={{maxWidth:900,margin:"0 auto"}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
      {[{c:"ARS",n:"Argentina",from:"Desde Colombia",pop:true,d:"Nuestro corredor principal. La mejor tasa COP a ARS."},{c:"VES",n:"Venezuela",from:"Desde Colombia, México, Chile",pop:false,d:"Envía bolívares desde 4 países. Sin apps."}].map((dest,i)=>(
        <div key={i} className="card-lift" style={{background:"#fff",borderRadius:22,padding:28,border:i===0?"2px solid "+P:"1px solid #f0f0f0",textAlign:"left",position:"relative",boxShadow:i===0?"0 8px 30px rgba(130,10,209,0.12)":"0 2px 12px rgba(0,0,0,0.04)"}}>
          {dest.pop&&<div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#FEF9C3",border:"1px solid #FDE68A",borderRadius:100,padding:"5px 14px",fontSize:12,fontWeight:600,color:"#A16207",marginBottom:14}}>{"⭐"} Más popular</div>}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><span style={{fontSize:14,fontWeight:700,color:"#ccc"}}>{dest.c}</span><div><div style={{fontWeight:700,fontSize:22}}>{dest.n}</div><div style={{fontSize:12,color:"#999"}}>{dest.from}</div></div></div>
          <p style={{fontSize:14,color:"#888",lineHeight:1.5,marginBottom:18}}>{dest.d}</p>
          <button onClick={openWA} className="btn-glow" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:14,border:i===0?"none":"1.5px solid "+P,borderRadius:14,background:i===0?P:"transparent",color:i===0?"#fff":P,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:i===0?"0 4px 20px rgba(130,10,209,0.25)":"none"}}><WASvg size={14} color={i===0?"white":"#820AD1"}/> {"Cotizar envío →"}</button>
        </div>))}
    </div>
  </div>
</section>

{/* TESTIMONIALS */}
<section style={{padding:"80px clamp(16px,4vw,48px)",background:"#fff"}}>
  <div style={{maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
    <h2 style={{fontSize:"clamp(28px,4vw,38px)",fontWeight:800,marginBottom:8}}>{"Lo que dicen "}<span style={{color:P,fontStyle:"italic"}}>nuestros clientes</span></h2>
    <p style={{color:"#999",fontSize:15,marginBottom:48}}>Miles de familias confían en DASHR</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
      {[{q:"Llevo 6 meses usando DASHR y es otra cosa. Mi mamá recibe la plata en menos de 20 minutos.",n:"Carolina M.",c:"Bogotá → Buenos Aires"},{q:"Por fin un servicio donde te atiende una persona real. Me respondieron a las 11pm un domingo.",n:"Andrés P.",c:"Medellín → Caracas"},{q:"Con DASHR recibo más pesos argentinos que con cualquier otra empresa. 100% recomendado.",n:"María L.",c:"Cali → Buenos Aires"},{q:"En 15 minutos mi familia en Venezuela ya tenía el dinero. Increíble la velocidad.",n:"Juan D.",c:"CDMX → Maracaibo"}].map((t,i)=>(
        <div key={i} className={"card-lift fade-up d"+(i%4+1)} style={{background:"#fff",borderRadius:20,padding:26,textAlign:"left",boxShadow:"0 2px 12px rgba(0,0,0,0.04)",border:"1px solid #f0f0f0"}}>
          <div style={{color:"#EAB308",marginBottom:10,fontSize:15,letterSpacing:2}}>{STARS}</div>
          <p style={{fontSize:14,color:"#555",lineHeight:1.7,marginBottom:16}}>{'"'+t.q+'"'}</p>
          <div style={{fontWeight:700,fontSize:14}}>{t.n}</div>
          <div style={{fontSize:12,color:P,fontWeight:500}}>{t.c}</div>
        </div>))}
    </div>
  </div>
</section>

{/* FAQ */}
<section id="s3" style={{padding:"80px clamp(16px,4vw,48px)",background:"#F8F7FC"}}>
  <div style={{maxWidth:700,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(28px,4vw,38px)",fontWeight:800,textAlign:"center",marginBottom:40}}>{"Preguntas "}<span style={{color:P}}>frecuentes</span></h2>
    {["¿Es seguro enviar dinero con DASHR?|Sí. Encriptación de nivel bancario, verificación de identidad y comprobante de cada operación.","¿Cuánto tarda en llegar?|Típicamente menos de 30 minutos. Usualmente en menos de 15.","¿Cuánto cobran de comisión?|La tasa del simulador ya incluye todo. Sin cargos ocultos.","¿Necesito descargar algo?|No. Todo funciona por WhatsApp. Sin apps ni registros.","¿Qué métodos de pago aceptan?|Bancolombia, Nequi, Daviplata y más. Te damos los datos por WhatsApp.","¿Monto mínimo y máximo?|Mínimo $50.000 COP. Para montos grandes consulta por WhatsApp."].map(function(item,i){var parts=item.split("|");return <Fq key={i} q={parts[0]} a={parts[1]} i={i}/>})}
  </div>
</section>

{/* CTA */}
<section style={{padding:"80px clamp(16px,4vw,48px)",background:"linear-gradient(135deg,#820AD1,#6B21A8)",textAlign:"center",position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-100,left:-100,width:300,height:300,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none"}}/>
  <div style={{position:"absolute",bottom:-80,right:-80,width:250,height:250,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>
  <h2 className="fade-up" style={{fontSize:"clamp(32px,5vw,48px)",fontWeight:800,marginBottom:12,color:"#fff",position:"relative"}}>{"Tu dinero puede llegar "}<span style={{color:"#E9D5FF"}}>hoy mismo</span></h2>
  <p className="fade-up d1" style={{fontSize:16,color:"rgba(255,255,255,0.7)",maxWidth:480,margin:"0 auto 32px"}}>Escríbenos ahora y envía con la mejor tasa del mercado.</p>
  <button onClick={openWA} className="btn-glow fade-up d2" style={{background:"#fff",color:P,border:"none",borderRadius:100,padding:"18px 48px",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 24px rgba(0,0,0,0.2)",display:"inline-flex",alignItems:"center",gap:8,position:"relative"}}><WASvg size={18} color="#820AD1"/> {"Cotizar ahora →"}</button>
</section>

{/* FOOTER */}
<footer style={{background:"#0f0f1a",padding:"40px clamp(16px,4vw,48px)",fontSize:13}}>
  <div style={{maxWidth:900,margin:"0 auto",display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",gap:16}}>
    <div><span style={{fontWeight:800,fontSize:20,color:P}}>DA$HR</span><p style={{color:"#555",marginTop:8}}>Remesas rápidas, seguras y sin comisiones ocultas.</p></div>
    <div style={{display:"flex",gap:24}}>{[["WhatsApp","https://wa.me/"+WA],["Beneficios","#s0"],["FAQ","#s3"]].map(([t,h],i)=><a key={i} href={h} target={h.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" className="nav-link" style={{color:"#555",textDecoration:"none"}}>{t}</a>)}</div>
  </div>
  <div style={{maxWidth:900,margin:"20px auto 0",textAlign:"center",color:"#333",fontSize:12}}>{"© 2026 DASHR Remesas. Todos los derechos reservados."}</div>
</footer>
</div>);
}
