// Settings, game state and the async primitives every other script uses (pause, input, abort).
// Loaded after engine.js and i18n.js; no DOM work at load time beyond the $ helper.
// ===================== Settings =====================
const S=(()=>{const d={oneTap:false,autoSkip:false,speed:'mid',len:'east',ai:'normal',theme:'auto',lang:'auto'};try{return Object.assign(d,JSON.parse(localStorage.getItem('rmj-settings')||'{}'));}catch(e){return d;}})();
// Hints: full (coach panel and recommended tiles), mistakes (only warn about a discard that loses draws or
// steps back, then show it), off (exam mode: the review after each hand is all you get). Older saves had hints:true/false.
if(!['full','mistakes','off'].includes(S.hint))S.hint=S.hints===false?'off':'full';
delete S.hints;
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

// Seeded random numbers (mulberry32). The generator state lives in G.rng, so a game is fully determined by
// its seed and the human's choices, and a saved game resumes with the same shuffles and AI decisions.
// Use rand() for anything random in the game; only newSeed() may call Math.random.
// Each round's wall is shuffled by its own generator (dealRng), so the n-th hand of a seed is the same deal
// whatever happened before it; that is what makes a challenge link replay the same tiles.
function mbStep(s){s=(s+0x6D2B79F5)|0;let x=Math.imul(s^s>>>15,1|s);x=x+Math.imul(x^x>>>7,61|x)^x;return[s,((x^x>>>14)>>>0)/4294967296];}
function rand(){const r=mbStep(G.rng);G.rng=r[0];return r[1];}
// A stand-alone generator, for things that must not depend on G.rng (round deals, practice puzzles).
function seeded(seed){let s=seed|0;return()=>{const r=mbStep(s);s=r[0];return r[1];};}
const dealRng=(seed,n)=>seeded((seed^Math.imul(n+1,0x9E3779B1))|0);
const newSeed=()=>Math.floor(Math.random()*4294967296);

// Save and resume. roundLoop() stores G (with G.flow = whose turn and how it starts) at the start of every
// turn, so reopening the page continues from the turn that was in progress. Sets are stored as {$set:[…]}.
// Bump SAVE_V when the shape of G changes; older saves are then ignored.
const SAVE_KEY='rmj-game',SAVE_V=3;
function saveGame(){if(!G)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:SAVE_V,G},(k,v)=>v instanceof Set?{$set:[...v]}:v));}catch(e){}}
function loadSave(){
  try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null',(k,v)=>v&&typeof v==='object'&&Array.isArray(v.$set)?new Set(v.$set):v);
    return d&&d.v===SAVE_V&&d.G&&d.G.flow?d.G:null;}catch(e){return null;}
}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
