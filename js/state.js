// Settings, game state and the async primitives every other script uses (pause, input, abort).
// Loaded after engine.js and i18n.js; no DOM work at load time beyond the $ helper.
// ===================== Settings =====================
const S=(()=>{const d={hints:true,oneTap:false,autoSkip:false,speed:'mid',len:'east',ai:'normal',theme:'auto',lang:'auto'};try{return Object.assign(d,JSON.parse(localStorage.getItem('rmj-settings')||'{}'));}catch(e){return d;}})();
function saveS(){try{localStorage.setItem('rmj-settings',JSON.stringify(S));}catch(e){}}
const DELAY={slow:950,mid:560,fast:220};
const delay=()=>DELAY[S.speed]||560;
const $=s=>document.querySelector(s);
setLang(S.lang);

// ===================== Game state =====================
let G=null,GEN=0,inputResolve=null;
const ABORT={abort:true};
const UI={mode:'idle',selected:null,riichiMode:false,opts:null,call:null};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function pause(ms){const g=GEN;await sleep(ms);if(g!==GEN)throw ABORT;}
async function input(){const g=GEN;const v=await new Promise(r=>inputResolve=r);if(v.type==='abort'||g!==GEN)throw ABORT;return v;}
function give(v){if(inputResolve){const r=inputResolve;inputResolve=null;r(v);}}
// Log entries are stored as a key plus raw values and translated when shown, so switching language rewrites them.
function log(k,v){G.log.push({k,v});}
const seatOf=p=>(p-G.dealer+4)%4;
const roundName=()=>t('round',{b:G.bakaze,k:G.kyoku});
const doraInds=()=>G.dead.slice(4,4+G.doraCount).map(tt);
const uraInds=()=>G.dead.slice(9,9+G.doraCount).map(tt);
const isMenzen=pl=>pl.melds.every(m=>m.type==='ankan');
const shName=SH;
