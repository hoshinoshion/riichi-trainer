// ===================== Settings =====================
const S=(()=>{const d={hints:true,oneTap:false,autoSkip:false,speed:'mid',len:'east',ai:'normal',theme:'auto'};try{return Object.assign(d,JSON.parse(localStorage.getItem('rmj-settings')||'{}'));}catch(e){return d;}})();
function saveS(){try{localStorage.setItem('rmj-settings',JSON.stringify(S));}catch(e){}}
const DELAY={slow:950,mid:560,fast:220};
const delay=()=>DELAY[S.speed]||560;
const $=s=>document.querySelector(s);
const NAMES=['你','下家','对家','上家'];
const ROT=[0,-90,180,90];

// ===================== Tile rendering =====================
const C={B:'#22479a',G:'#16704a',R:'#c3302a',I:'#fcf8ee'};
const PIN_POS={2:[[15,10.5],[15,29.5]],3:[[7.5,8],[15,20],[22.5,32]],4:[[9,11],[21,11],[9,29],[21,29]],5:[[8.5,9],[21.5,9],[15,20],[8.5,31],[21.5,31]],6:[[9,8],[21,8],[9,22],[21,22],[9,33],[21,33]],7:[[7,6],[15,10],[23,14],[9,24],[21,24],[9,34],[21,34]],8:[[9,5.5],[21,5.5],[9,15.2],[21,15.2],[9,24.8],[21,24.8],[9,34.5],[21,34.5]],9:[[7,8],[15,8],[23,8],[7,20],[15,20],[23,20],[7,32],[15,32],[23,32]]};
const PIN_R={2:7,3:5.6,4:5.4,5:5,6:4.7,7:4.2,8:4.2,9:4};
const PIN_COL={2:'GB',3:'BRG',4:'BGGB',5:'BGRGB',6:'GGRRRR',7:'GGGRRRR',8:'BBBBBBBB',9:'BBBRRRGGG'};
const SOU={2:{p:[[15,10.5],[15,29.5]],h:15},3:{p:[[15,10.5],[9,29.5],[21,29.5]],h:15},4:{p:[[9,10.5],[21,10.5],[9,29.5],[21,29.5]],h:15},5:{p:[[8,10.5],[22,10.5],[15,20],[8,29.5],[22,29.5]],h:15,red:[2]},6:{p:[[7,10.5],[15,10.5],[23,10.5],[7,29.5],[15,29.5],[23,29.5]],h:15},7:{p:[[15,7],[7,20.5],[15,20.5],[23,20.5],[7,33],[15,33],[23,33]],h:10.5,red:[0]},8:{p:[[6,10.5],[12,10.5],[18,10.5],[24,10.5],[6,29.5],[12,29.5],[18,29.5],[24,29.5]],h:15,w:3.6},9:{p:[[7,7],[15,7],[23,7],[7,20],[15,20],[23,20],[7,33],[15,33],[23,33]],h:11,red:[1,4,7]}};
function stick(x,y,w,h,c){return`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${w/2}" fill="${c}"/><rect x="${x-w/2-.4}" y="${y-.5}" width="${w+.8}" height="1" rx=".5" fill="${c}"/><line x1="${x}" y1="${y-h/2+1.8}" x2="${x}" y2="${y+h/2-1.8}" stroke="${C.I}" class="hs" stroke-width=".6" opacity=".6"/>`;}
function pinSVG(n,red){
  let s='';
  if(n===1)s=`<circle cx="15" cy="20" r="11.5" fill="${C.G}"/><circle cx="15" cy="20" r="9" fill="${C.I}" class="h"/><circle cx="15" cy="20" r="7" fill="${C.B}"/><circle cx="15" cy="20" r="3.8" fill="${C.I}" class="h"/><circle cx="15" cy="20" r="2.2" fill="${C.R}"/>`;
  else PIN_POS[n].forEach(([x,y],i)=>{const c=C[red?'R':PIN_COL[n][i]],r=PIN_R[n];s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${(r*.6).toFixed(2)}" fill="${C.I}" class="h"/><circle cx="${x}" cy="${y}" r="${(r*.3).toFixed(2)}" fill="${c}"/>`;});
  return`<svg viewBox="0 0 30 40" aria-hidden="true">${s}</svg>`;
}
function souSVG(n,red){
  let s='';
  if(n===1)s=stick(15,22,7,30,C.G)+`<circle cx="15" cy="8" r="4.2" fill="${C.R}"/><circle cx="15" cy="8" r="1.6" fill="${C.I}" class="h"/>`;
  else{const L=SOU[n];L.p.forEach(([x,y],i)=>{s+=stick(x,y,L.w||4,L.h,(red||(L.red&&L.red.includes(i)))?C.R:C.G);});}
  return`<svg viewBox="0 0 30 40" aria-hidden="true">${s}</svg>`;
}
const faceCache={};
function face(t,red){
  const k=t+(red?'r':'');if(faceCache[k])return faceCache[k];
  let h;
  if(t<9)h=`<div class="mf${red?' red':''}"><span class="n">${NUMK[t]}</span><span class="s">萬</span></div>`;
  else if(t<18)h=pinSVG(t-8,red);
  else if(t<27)h=souSVG(t-17,red);
  else if(t===31)h=`<div class="haku"></div>`;
  else h=`<div class="hf h${t}">${'東南西北白發中'[t-27]}</div>`;
  return faceCache[k]=h;
}
function tileHTML(id,cls='',attr=''){return`<div class="tile ${cls}" ${attr} title="${tName(tt(id))}${RED_IDS.has(id)?'（赤）':''}"><div class="face">${face(tt(id),RED_IDS.has(id))}</div></div>`;}
function tileT(t,cls=''){return tileHTML(t*4+3,cls);}
function backHTML(cls=''){return`<div class="tile back ${cls}"></div>`;}
function meldHTML(m,cls=''){
  if(m.type==='ankan')return`<div class="meld">${backHTML(cls)}${tileHTML(m.ids[1],cls)}${tileHTML(m.ids[2],cls)}${backHTML(cls)}</div>`;
  const others=m.ids.filter(id=>id!==m.called).sort((a,b)=>a-b).map(id=>tileHTML(id,cls));
  const side=tileHTML(m.called,cls+' yoko');
  const seq=m.from===3?[side,...others]:m.from===2?[others[0],side,...others.slice(1)]:[...others,side];
  return`<div class="meld">${seq.join('')}</div>`;
}

// ===================== Game state =====================
let G=null,GEN=0,inputResolve=null;
const ABORT={abort:true};
const UI={mode:'idle',selected:null,riichiMode:false,opts:null,call:null};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function pause(ms){const g=GEN;await sleep(ms);if(g!==GEN)throw ABORT;}
async function input(){const g=GEN;const v=await new Promise(r=>inputResolve=r);if(v.type==='abort'||g!==GEN)throw ABORT;return v;}
function give(v){if(inputResolve){const r=inputResolve;inputResolve=null;r(v);}}
function log(s){G.log.push(s);}
const seatOf=p=>(p-G.dealer+4)%4;
const roundName=()=>`${'东南西北'[G.bakaze]}${'一二三四'[G.kyoku]}局`;
const doraInds=()=>G.dead.slice(4,4+G.doraCount).map(tt);
const uraInds=()=>G.dead.slice(9,9+G.doraCount).map(tt);
const isMenzen=pl=>pl.melds.every(m=>m.type==='ankan');
const shName=s=>s<0?'和了':s===0?'听牌':s===1?'一向听':s===2?'两向听':s+' 向听';

function newGame(){
  GEN++;give({type:'abort'});
  G={players:[0,1,2,3].map(i=>({id:i,isHuman:i===0,score:25000,hand:[],melds:[],river:[],drawn:null,safe:new Set()})),
     dealer:0,kyoku:0,bakaze:0,honba:0,kyotaku:0,lastWind:S.len==='south'?1:0,log:[],turn:0,wall:[],dead:[],kanCount:0,doraCount:1,pendingDora:0,noCalls:true,last:null};
  $('#modal').hidden=true;
  gameLoop();
}
function startRound(){
  const w=[...Array(136).keys()];
  for(let i=w.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[w[i],w[j]]=[w[j],w[i]];}
  G.dead=w.splice(0,14);G.wall=w;
  G.kanCount=0;G.doraCount=1;G.pendingDora=0;G.noCalls=true;G.last=null;G.turn=G.dealer;G.log=[];
  for(const p of G.players)Object.assign(p,{hand:[],melds:[],river:[],drawn:null,riichi:false,doubleRiichi:false,ippatsu:false,riichiPending:false,tempFuriten:false,riichiFuriten:false,safe:new Set()});
  for(let i=0;i<13;i++)for(let k=0;k<4;k++)G.players[(G.dealer+k)%4].hand.push(G.wall.pop());
  G.players.forEach(p=>p.hand.sort((a,b)=>a-b));
  Object.assign(UI,{mode:'idle',selected:null,riichiMode:false,opts:null,call:null});
  log(`${roundName()} ${G.honba}本场 开始，庄家：${NAMES[G.dealer]}`);
}
function ctxFor(p,winId,isTsumo,sit,withUra){
  const pl=G.players[p];
  return{hand:pl.hand,melds:pl.melds,winId,isTsumo,seat:27+seatOf(p),round:27+G.bakaze,isDealer:p===G.dealer,sit,doraInd:doraInds(),uraInd:withUra?uraInds():null};
}
function sitFor(p,isTsumo,rinshan){
  const pl=G.players[p],first=pl.river.length===0&&G.noCalls&&!rinshan;
  return{riichi:pl.riichi,double:pl.doubleRiichi,ippatsu:pl.ippatsu,rinshan,haitei:isTsumo&&!rinshan&&G.wall.length===0,houtei:!isTsumo&&G.wall.length===0,
    tenhou:isTsumo&&first&&p===G.dealer,chiihou:isTsumo&&first&&p!==G.dealer};
}
function waitsFor(hand,mc){
  const c=counts(hand),w=[];
  if(hand.length%3!==1)return w;
  for(let t=0;t<34;t++){if(c[t]>=4)continue;c[t]++;if(shanten(c,mc)===-1)w.push(t);c[t]--;}
  return w;
}
function waitsOf(p){const pl=G.players[p];return waitsFor(pl.hand,pl.melds.length);}
function isFuriten(p,w){const pl=G.players[p];w=w||waitsOf(p);return pl.tempFuriten||pl.riichiFuriten||pl.river.some(r=>w.includes(tt(r.id)));}
function markMissed(p){const pl=G.players[p];pl.tempFuriten=true;if(pl.riichi)pl.riichiFuriten=true;}
function ronCheck(q,id){
  const w=waitsOf(q);if(!w.includes(tt(id)))return{inWait:false,res:null};
  if(isFuriten(q,w))return{inWait:true,res:null,furiten:true};
  return{inWait:true,res:evaluate(ctxFor(q,id,false,sitFor(q,false,false),true))};
}
function visibleTo(p){
  const v=new Array(34).fill(0);
  for(const id of G.players[p].hand)v[tt(id)]++;
  for(const q of G.players){for(const r of q.river)if(!r.called)v[tt(r.id)]++;for(const m of q.melds)for(const id of m.ids)v[tt(id)]++;}
  for(const i of doraInds())v[i]++;
  return v;
}
// Memoised per seat: render() and the AI ask for the same table several times per turn.
// The key covers everything visibleTo() reads. Callers must not mutate the returned rows.
const ukCache=new Map();
function ukeireTable(p){
  const pl=G.players[p];
  const key=pl.hand.join()+'|'+G.players.map(q=>q.river.length+'.'+q.melds.map(m=>m.ids.length).join('')).join()+'|'+G.doraCount;
  const hit=ukCache.get(p);if(hit&&hit.g===G&&hit.key===key)return hit.rows;
  const rows=ukeireCompute(p);ukCache.set(p,{g:G,key,rows});return rows;
}
function ukeireCompute(p){
  const pl=G.players[p],c=counts(pl.hand),mc=pl.melds.length,vis=visibleTo(p),rows=[];
  for(let d=0;d<34;d++){
    if(!c[d])continue;c[d]--;
    const s=shanten(c,mc);let n=0;const tiles=[];
    for(let t=0;t<34;t++){const rem=4-vis[t];if(rem<=0)continue;c[t]++;if(shanten(c,mc)<s){tiles.push([t,rem]);n+=rem;}c[t]--;}
    c[d]++;rows.push({d,s,n,tiles});
  }
  rows.sort((a,b)=>a.s-b.s||b.n-a.n);
  return rows;
}
function riichiTypes(p){
  const pl=G.players[p],set=new Set();
  if(!isMenzen(pl)||pl.riichi||pl.score<1000||G.wall.length<4)return set;
  const c=counts(pl.hand),mc=pl.melds.length;
  for(let d=0;d<34;d++){if(!c[d])continue;c[d]--;if(shanten(c,mc)===0)set.add(d);c[d]++;}
  return set;
}
function kanOptions(p){
  const pl=G.players[p];if(G.wall.length===0||G.kanCount>=4)return[];
  const c=counts(pl.hand),o=[];
  if(pl.riichi){
    // After riichi: only a closed kan of the tile just drawn, and only if it leaves the waits unchanged.
    if(pl.drawn==null)return o;const t=tt(pl.drawn);if(c[t]!==4)return o;
    const before=waitsFor(pl.hand.filter(id=>id!==pl.drawn),pl.melds.length);
    const after=waitsFor(pl.hand.filter(id=>tt(id)!==t),pl.melds.length+1);
    if(before.length&&before.join()===after.join())o.push({kind:'ankan',t});
    return o;
  }
  for(let t=0;t<34;t++)if(c[t]===4)o.push({kind:'ankan',t});
  pl.melds.forEach((m,i)=>{if(m.type==='pon'&&c[tt(m.ids[0])])o.push({kind:'kakan',t:tt(m.ids[0]),i});});
  return o;
}
// Kuikae: after a call the called tile type may not be discarded, nor, after a chi on the end of a
// ryanmen (e.g. 34 + 2), the tile at the other end (5).
function kuikaeOf(t,useT){
  const f=[t];if(!useT||useT[0]===useT[1])return f;
  const lo=Math.min(...useT),hi=Math.max(...useT);
  if(lo===t+1&&t%9<=5)f.push(t+3);
  if(hi===t-1&&t%9>=3)f.push(t-3);
  return f;
}
// A call is only allowed if the caller still has a legal discard afterwards.
function leavesDiscard(c,useT,t){const r=c.slice();for(const u of useT)r[u]--;for(const f of kuikaeOf(t,useT))r[f]=0;return r.some(x=>x>0);}
function chiPatterns(t,c){
  if(t>=27)return[];const n=t%9,o=[];
  if(n>=2&&c[t-2]&&c[t-1])o.push([t-2,t-1]);
  if(n>=1&&n<=7&&c[t-1]&&c[t+1])o.push([t-1,t+1]);
  if(n<=6&&c[t+1]&&c[t+2])o.push([t+1,t+2]);
  return o.filter(u=>leavesDiscard(c,u,t));
}

// ===================== Actions =====================
function drawTile(p,id){const pl=G.players[p];pl.hand.push(id);pl.drawn=id;}
function doDiscard(p,id,riichi){
  flushDora();
  const pl=G.players[p];pl.hand.splice(pl.hand.indexOf(id),1);
  const tsumogiri=id===pl.drawn;pl.drawn=null;pl.hand.sort((a,b)=>a-b);
  if(riichi){pl.doubleRiichi=G.noCalls&&pl.river.length===0;pl.riichi=true;pl.ippatsu=true;pl.riichiPending=true;log(`${NAMES[p]} ${pl.doubleRiichi?'两立直':'立直'}！打 ${tName(tt(id))}`);}
  else{pl.ippatsu=false;log(`${NAMES[p]} 打 ${tName(tt(id))}${tsumogiri?'（摸切）':''}`);}
  pl.river.push({id,riichi,tsumogiri,fresh:true});
  pl.tempFuriten=false;
  G.players.forEach((q,i)=>{if(i!==p&&q.riichi)q.safe.add(tt(id));});
  G.last={p,id};
}
function brokeFlow(){G.noCalls=false;G.players.forEach(x=>x.ippatsu=false);}
// Closed kan: the new dora indicator is turned at once. Open or added kan: it is turned when the next
// tile is discarded (or at the next kan), so a rinshan win on an open kan does not see it.
function flushDora(){G.doraCount+=G.pendingDora;G.pendingDora=0;}
function revealKan(open){G.kanCount++;G.wall.shift();flushDora();if(open)G.pendingDora++;else G.doraCount++;}
function doSelfKan(p,o){
  const pl=G.players[p];
  if(o.kind==='ankan'){const ids=pl.hand.filter(id=>tt(id)===o.t);pl.hand=pl.hand.filter(id=>tt(id)!==o.t);pl.melds.push({type:'ankan',ids,called:null,from:0});log(`${NAMES[p]} 暗杠 ${tName(o.t)}`);}
  else{const id=pl.hand.find(x=>tt(x)===o.t);pl.hand.splice(pl.hand.indexOf(id),1);const m=pl.melds[o.i];m.type='kakan';m.ids.push(id);log(`${NAMES[p]} 加杠 ${tName(o.t)}`);}
  pl.drawn=null;pl.hand.sort((a,b)=>a-b);brokeFlow();revealKan(o.kind!=='ankan');
}
function applyCall(call,d,id){
  const pl=G.players[call.q],use=[];
  for(const t of call.useT){const x=pl.hand.find(h=>tt(h)===t&&!use.includes(h));use.push(x);}
  pl.hand=pl.hand.filter(h=>!use.includes(h));
  const dr=G.players[d].river;dr[dr.length-1].called=true;
  pl.melds.push({type:call.type==='kan'?'minkan':call.type,ids:[...use,id],called:id,from:(d-call.q+4)%4});
  brokeFlow();
  if(call.type==='kan')revealKan(true);
  log(`${NAMES[call.q]} ${{pon:'碰',chi:'吃',kan:'明杠'}[call.type]} ${tName(tt(id))}`);
}

// ===================== AI =====================
// Difficulty levels. 入门: noisy efficiency with slips, calls without a yaku plan, folds only when hopeless.
// 普通: pure tile efficiency, folds against riichi when far from tenpai.
// 困难: picks the tenpai wait with the best expected score, damaten on big hands, push/fold by hand value,
// reads dangerous open hands as threats, uses suji / kabe / no-chance when folding, avoids kan into a riichi.
const LEVELS={easy:'入门',normal:'普通',hard:'困难'};
const MIXED=[null,'easy','normal','hard'];
function lvl(p){return S.ai==='mixed'?MIXED[p]:(LEVELS[S.ai]?S.ai:'normal');}
const rnd=Math.random;
function keepValue(t,p){
  const pl=G.players[p],c=counts(pl.hand);let v;
  const seat=27+seatOf(p),round=27+G.bakaze;
  if(t>=27){v=(isDragon(t)||t===seat||t===round)?(c[t]>=2?9:2):0;}
  else{const n=t%9;v=(n===0||n===8)?1:(n===1||n===7)?2:3;}
  for(const i of doraInds())if(doraOf(i)===t)v+=5;
  return v;
}
function danger(t,r){
  const rp=G.players[r];
  if(rp.river.some(x=>tt(x.id)===t)||rp.safe.has(t))return 0;
  // Called river tiles are counted once, in the caller's meld.
  let vis=0;for(const q of G.players){for(const x of q.river)if(!x.called&&tt(x.id)===t)vis++;for(const m of q.melds)for(const id of m.ids)if(tt(id)===t)vis++;}
  if(t>=27)return vis>=3?1:vis===2?3:5;
  const n=t%9,b=t-n,inR=k=>rp.river.some(x=>tt(x.id)===b+k);
  if(n<=2?inR(n+3):n>=6?inR(n-3):(inR(n-3)&&inR(n+3)))return isTerm(t)?2:3;
  if(n>=3&&n<=5&&(inR(n-3)||inR(n+3)))return 6;
  return isTerm(t)?6:(n===1||n===7)?7:9;
}
// Hard-level danger: adds kabe / no-chance (a ryanmen shape that needs a tile whose 4 copies are all visible to us
// cannot exist) and a tanki-only reading for honours and terminals with three copies out.
function dangerHard(t,r,vis){
  let d=danger(t,r);if(d===0)return 0;
  if(vis[t]>=3)return Math.min(d,1);
  if(t<27){
    const n=t%9,gone=k=>vis[k]>=4;
    const lowOK=n<2||gone(t-1)||gone(t-2), highOK=n>6||gone(t+1)||gone(t+2);
    if(lowOK&&highOK)d=Math.min(d,isTerm(t)?2:3);
    else if((n>=3&&n<=5)&&(lowOK||highOK))d=Math.min(d,5);
  }
  const rp=G.players[r];if(rp.melds.length&&!rp.riichi)d=Math.max(0,d-1);
  return d;
}
function chooseId(pl,t){const ids=pl.hand.filter(x=>tt(x)===t);if(pl.drawn!=null&&tt(pl.drawn)===t)return pl.drawn;return ids.find(x=>!RED_IDS.has(x))??ids[0];}
// Who p should be afraid of. Easy/normal only see riichi; hard also sees dangerous open hands.
function threatsFor(p){
  return [0,1,2,3].filter(i=>{if(i===p)return false;const q=G.players[i];if(q.riichi)return true;if(lvl(p)!=='hard')return false;
    // Hard also respects open hands: three melds, or two melds showing a yakuhai pon or dora.
    const di=doraInds().map(doraOf),yh=t=>isDragon(t)||t===27+seatOf(i)||t===27+G.bakaze;
    return q.melds.length>=3||(q.melds.length>=2&&q.melds.some(m=>(m.type!=='chi'&&yh(tt(m.ids[0])))||m.ids.some(id=>RED_IDS.has(id)||di.includes(tt(id)))));});
}
// Rough han-value of p's hand for push/fold: dora (incl. red), yakuhai triplets and pairs, riichi if closed.
function handValue(p){
  const pl=G.players[p],ids=[...pl.hand,...pl.melds.flatMap(m=>m.ids)],c=counts(ids),di=doraInds();
  let v=0;for(const id of ids){if(RED_IDS.has(id))v++;for(const i of di)if(doraOf(i)===tt(id))v++;}
  for(const t of [31,32,33,27+seatOf(p),27+G.bakaze])if(c[t]>=3)v++;else if(c[t]===2&&pl.melds.length)v+=.5;
  if(isMenzen(pl))v++;
  return v;
}
// Expected ron value of being tenpai after discarding type d: sum over waits of (copies left × points).
function tenpaiEV(p,d,vis,asRiichi){
  const pl=G.players[p],idx=pl.hand.findIndex(x=>tt(x)===d),hand=pl.hand.filter((_,i)=>i!==idx);
  const c=counts(hand),mc=pl.melds.length;let ev=0,left=0,minRon=Infinity,allYaku=true;
  const riv=new Set([...pl.river.map(r=>tt(r.id)),d]);
  const waits=[];for(let t=0;t<34;t++){if(c[t]>=4)continue;c[t]++;if(shanten(c,mc)===-1)waits.push(t);c[t]--;}
  const furiten=waits.some(t=>riv.has(t));
  for(const t of waits){
    const rem=Math.max(0,4-vis[t]);left+=rem;
    // Use a copy not in hand, and not the red five unless it is the only one left, so aka is not overcounted.
    const wid=[3,2,1,0].map(k=>t*4+k).filter(id=>!hand.includes(id)).sort((a,b)=>RED_IDS.has(a)-RED_IDS.has(b))[0];
    const sit={riichi:asRiichi,double:false,ippatsu:false,rinshan:false,haitei:false,houtei:false,tenhou:false,chiihou:false};
    const res=evaluate({hand,melds:pl.melds,winId:wid,isTsumo:false,seat:27+seatOf(p),round:27+G.bakaze,isDealer:p===G.dealer,sit,doraInd:doraInds(),uraInd:null});
    if(!res){allYaku=false;if(!asRiichi&&isMenzen(pl))ev+=rem*1000*.35;continue;}
    minRon=Math.min(minRon,res.ron);ev+=rem*res.ron*(furiten?.3:1);
  }
  return{ev,left,waits,furiten,minRon:waits.length?minRon:0,allYaku:allYaku&&waits.length>0};
}
// Two-step look-ahead used by hard: for discard d, how many tiles advance the hand, weighted by how wide
// the best follow-up is. Favours good shapes (ryanmen, complete 1-shanten) over raw tile count.
function ukeire2(p,d,vis){
  const pl=G.players[p],c=counts(pl.hand),mc=pl.melds.length;c[d]--;
  const s=shanten(c,mc);let tot=0;
  for(let t=0;t<34;t++){
    const rem=4-vis[t];if(rem<=0)continue;c[t]++;
    if(shanten(c,mc)<s){
      let best=0;
      for(let e=0;e<34;e++){if(!c[e]||e===t)continue;c[e]--;
        if(shanten(c,mc)===s-1){let n=0;for(let u=0;u<34;u++){const r2=4-vis[u]-(u===t?1:0);if(r2<=0)continue;c[u]++;if(shanten(c,mc)<s-1)n+=r2;c[u]--;}if(n>best)best=n;}
        c[e]++;}
      tot+=rem*(1+best);
    }
    c[t]--;
  }
  c[d]++;return tot;
}
function aiChooseDiscard(p,forbid=[]){
  const pl=G.players[p],L=lvl(p);let rows=ukeireTable(p).filter(r=>!forbid.includes(r.d));
  if(!rows.length)rows=ukeireTable(p);
  const bestS=Math.min(...rows.map(r=>r.s));
  const atk=r=>r.s*1000-r.n*10+keepValue(r.d,p);
  let pick;
  if(L==='easy'){
    // Beginner: folds only when hopeless, otherwise plays roughly by efficiency with plenty of noise,
    // and about one discard in ten is a slip that may even step backwards.
    const threats=threatsFor(p);
    if(threats.length&&bestS>=3&&rnd()<.5){const dg=r=>Math.max(...threats.map(q=>danger(r.d,q)));pick=rows.slice().sort((a,b)=>dg(a)-dg(b))[0];}
    else{
      const pool=rnd()<.1?rows.filter(r=>r.s<=bestS+1):rows.filter(r=>r.s===bestS);
      pick=pool.map(r=>({r,k:atk(r)+rnd()*60})).sort((a,b)=>a.k-b.k)[0].r;
    }
  }else if(L==='hard'){
    const vis=visibleTo(p),threats=threatsFor(p),riichis=threats.filter(q=>G.players[q].riichi);
    const dg=r=>threats.length?Math.max(...threats.map(q=>dangerHard(r.d,q,vis)*(G.players[q].riichi?1:.6)*(q===G.dealer?1.3:1))):0;
    const val=handValue(p),late=G.wall.length<24;
    let fold=false;
    if(riichis.length){
      if(bestS>=2)fold=true;
      else if(bestS===1)fold=val<2||(late&&val<4)||riichis.length>1;
      else{
        // Tenpai against riichi: push through a discard unless the wait is poor, the hand cheap and the tile dangerous.
        const opts=rows.filter(r=>r.s===0).map(r=>({r,e:tenpaiEV(p,r.d,vis,isMenzen(pl)&&!pl.riichi)}));
        const ok=opts.filter(o=>o.e.left>0&&(dg(o.r)<=5||o.e.left>=4||o.e.minRon>=5200||(isMenzen(pl)&&!late)));
        fold=!ok.length;
        if(!fold){ok.sort((a,b)=>(b.e.furiten?0:1)-(a.e.furiten?0:1)||b.e.ev/(2+dg(b.r))-a.e.ev/(2+dg(a.r)));pick=ok[0].r;}
      }
    }else if(threats.length)fold=bestS>=2&&G.wall.length<45;
    if(pick);
    else if(fold)pick=rows.slice().sort((a,b)=>dg(a)-dg(b)||atk(a)-atk(b))[0];
    else if(bestS===0){
      const cand=rows.filter(r=>r.s===0).map(r=>({r,e:tenpaiEV(p,r.d,vis,isMenzen(pl))}));
      cand.sort((a,b)=>(b.e.furiten?0:1)-(a.e.furiten?0:1)||b.e.ev-a.e.ev||dg(a.r)-dg(b.r));
      pick=cand[0].r;
    }else{
      // Attack: among the efficient choices, look two steps ahead for shape, then keep value and safety.
      const top=rows.filter(r=>r.s===bestS),maxN=Math.max(...top.map(r=>r.n));
      let cand=top.filter(r=>r.n>=maxN*.75);
      if(bestS<=2&&cand.length>1){const sc=cand.map(r=>({r,v:ukeire2(p,r.d,vis)-keepValue(r.d,p)*12-dg(r)*15}));sc.sort((a,b)=>b.v-a.v);pick=sc[0].r;}
      else pick=cand.sort((a,b)=>keepValue(a.d,p)-keepValue(b.d,p)||dg(a)-dg(b)||b.n-a.n)[0];
    }
  }else{
    const threats=threatsFor(p);
    if(threats.length&&(bestS>=2||(bestS===1&&G.wall.length<40))){
      const dg=r=>Math.max(...threats.map(q=>danger(r.d,q)));
      pick=rows.slice().sort((a,b)=>dg(a)-dg(b)||atk(a)-atk(b))[0];
    }else pick=rows.slice().sort((a,b)=>atk(a)-atk(b))[0];
  }
  return{id:chooseId(pl,pick.d),s:pick.s,d:pick.d};
}
function yakuPathOpen(q,newT){
  const pl=G.players[q],seat=27+seatOf(q),round=27+G.bakaze,yh=t=>isDragon(t)||t===seat||t===round;
  if(pl.melds.some(m=>m.type!=='chi'&&yh(tt(m.ids[0]))))return true;
  if(newT.every(x=>x===newT[0])&&yh(newT[0]))return true;
  const c=counts(pl.hand);if([31,32,33,seat,round].some(t=>c[t]>=3))return true;
  const simple=pl.melds.every(m=>m.ids.every(id=>!isYao(tt(id))))&&newT.every(t=>!isYao(t));
  return simple&&pl.hand.filter(id=>isYao(tt(id))).length<=1;
}
function aiPon(q,id){
  const pl=G.players[q],L=lvl(q);if(pl.riichi||G.wall.length===0)return null;
  const t=tt(id),c=counts(pl.hand),mc=pl.melds.length;if(c[t]<2)return null;
  const s0=shanten(c,mc);c[t]-=2;const s1=shanten(c,mc+1);c[t]+=2;
  const yh=isDragon(t)||t===27+seatOf(q)||t===27+G.bakaze;
  if(L==='easy'){
    // Beginners love calling: any yakuhai, and now and then a pon that does not hurt, yaku or not.
    if(yh||(s1<s0&&rnd()<.3)||(s1<s0&&yakuPathOpen(q,[t,t,t])))return{q,type:'pon',useT:[t,t]};
    return null;
  }
  const threat=G.players.some((x,i)=>i!==q&&x.riichi);
  if(threat&&s0>=(L==='hard'?1:2)&&!(L==='hard'&&yh&&s1===0))return null;
  if(L==='hard'&&s1>s0)return null;
  if((yh&&s1<=s0)||(s1<s0&&s0<=3&&yakuPathOpen(q,[t,t,t])))return{q,type:'pon',useT:[t,t]};
  return null;
}
function aiChi(q,id){
  const pl=G.players[q],L=lvl(q);if(pl.riichi||G.wall.length===0)return null;
  const t=tt(id),c=counts(pl.hand),mc=pl.melds.length,s0=shanten(c,mc);
  if(L==='easy'){
    if(rnd()>=.5)return null;
    for(const [a,b] of chiPatterns(t,c)){c[a]--;c[b]--;const s1=shanten(c,mc+1);c[a]++;c[b]++;if(s1<s0&&(rnd()<.3||yakuPathOpen(q,[a,b,t])))return{q,type:'chi',useT:[a,b]};}
    return null;
  }
  if(s0>3||G.players.some((x,i)=>i!==q&&x.riichi))return null;
  // Hard does not throw away a closed hand worth riichi for a cheap open one this early.
  if(L==='hard'&&isMenzen(pl)&&s0>=2&&G.wall.length>40&&handValue(q)<3)return null;
  for(const [a,b] of chiPatterns(t,c)){c[a]--;c[b]--;const s1=shanten(c,mc+1);c[a]++;c[b]++;if(s1<s0&&yakuPathOpen(q,[a,b,t]))return{q,type:'chi',useT:[a,b]};}
  return null;
}
// Should the AI declare riichi with this tenpai discard? Easy and normal always do.
// Hard stays damaten when the hand already has a yaku and is worth a mangan, or when every wait is dead.
function aiWantsRiichi(p,d){
  if(lvl(p)!=='hard')return true;
  const e=tenpaiEV(p,d,visibleTo(p),false);
  if(e.left===0)return false;
  if(e.allYaku&&!e.furiten&&e.minRon>=7700)return false;
  return true;
}
async function aiTurn(p,info){
  await pause(delay());
  const pl=G.players[p],L=lvl(p);
  if(!info.afterCall){const res=evaluate(ctxFor(p,pl.drawn,true,sitFor(p,true,info.rinshan),true));if(res)return{type:'tsumo',res};}
  if(pl.riichi){const k=kanOptions(p);if(k.length)return{type:'kan',opt:k[0]};return{type:'discard',id:pl.drawn};}
  if(!info.afterCall){
    const c=counts(pl.hand),mc=pl.melds.length,s0=shanten(c,mc);
    const riichiNear=G.players.some((x,i)=>i!==p&&x.riichi);
    for(const o of kanOptions(p)){
      if(L==='hard'&&riichiNear&&s0>=1)break;
      if(o.kind==='ankan'){c[o.t]-=4;const s=shanten(c,mc+1);c[o.t]+=4;if(s<=s0)return{type:'kan',opt:o};}
      else{c[o.t]--;const s=shanten(c,mc);c[o.t]++;if(s<=s0)return{type:'kan',opt:o};}
    }
  }
  const ch=aiChooseDiscard(p,info.forbid);
  const riichi=!info.afterCall&&ch.s===0&&riichiTypes(p).has(ch.d)&&aiWantsRiichi(p,ch.d);
  return{type:'discard',id:ch.id,riichi};
}

// ===================== Human =====================
async function humanTurn(p,info){
  const pl=G.players[p];
  const opts={tsumo:null,riichi:new Set(),kans:[],forbid:info.forbid};
  if(!info.afterCall)opts.tsumo=evaluate(ctxFor(p,pl.drawn,true,sitFor(p,true,info.rinshan),true));
  if(pl.riichi){
    opts.kans=kanOptions(p);
    if(opts.tsumo||opts.kans.length){UI.mode='riichiTsumo';UI.opts=opts;render();const v=await input();UI.mode='idle';UI.opts=null;if(v.type==='tsumo')return{type:'tsumo',res:opts.tsumo};if(v.type==='kan')return v;}
    else{render();await pause(Math.min(delay(),650));}
    return{type:'discard',id:pl.drawn};
  }
  if(!info.afterCall){opts.riichi=riichiTypes(p);opts.kans=kanOptions(p);}
  Object.assign(UI,{mode:'discard',opts,selected:null,riichiMode:false});render();
  const v=await input();
  Object.assign(UI,{mode:'idle',opts:null,selected:null,riichiMode:false});
  if(v.type==='tsumo')return{type:'tsumo',res:opts.tsumo};
  return v;
}

// ===================== Round flow =====================
async function resolveCalls(d,id){
  const t=tt(id),order=[1,2,3].map(k=>(d+k)%4),ronRes={};let hOpts={ron:null,inWait:false};
  for(const q of order){
    const rc=ronCheck(q,id);
    if(q===0)hOpts=rc;
    else if(rc.res)ronRes[q]=rc.res;
    else if(rc.inWait)markMissed(q);
  }
  let hc={type:'pass'};
  if(d!==0){
    const pl=G.players[0],c=counts(pl.hand);
    const o={ron:hOpts.res,pon:false,kan:false,chis:[]};
    if(!pl.riichi&&G.wall.length>0){o.pon=c[t]>=2;o.kan=c[t]>=3&&G.kanCount<4;if(d===3)o.chis=chiPatterns(t,c);}
    const any=o.ron||((o.pon||o.kan||o.chis.length)&&!S.autoSkip);
    if(any){Object.assign(UI,{mode:'call',call:{d,id,...o}});render();hc=await input();Object.assign(UI,{mode:'idle',call:null});}
    if(hOpts.inWait&&hc.type!=='ron')markMissed(0);
    if(hc.type==='ron')ronRes[0]=hOpts.res;
  }
  const rq=order.find(q=>ronRes[q]!==undefined);
  if(rq!==undefined)return{ron:{q:rq,res:ronRes[rq]}};
  if(G.wall.length===0)return{};
  if(hc.type==='pon')return{call:{q:0,type:'pon',useT:[t,t]}};
  if(hc.type==='kan')return{call:{q:0,type:'kan',useT:[t,t,t]}};
  for(const q of order){if(q===0)continue;const dec=aiPon(q,id);if(dec)return{call:dec};}
  if(hc.type==='chi')return{call:{q:0,type:'chi',useT:hc.useT}};
  const q1=(d+1)%4;if(q1!==0){const dec=aiChi(q1,id);if(dec)return{call:dec};}
  return{};
}
async function roundLoop(){
  let p=G.dealer,mode='draw',forbid=[];
  while(true){
    const pl=G.players[p];let rinshan=false;G.turn=p;
    if(mode==='draw'){if(!G.wall.length)return await exhaustive();drawTile(p,G.wall.pop());}
    else if(mode==='rinshan'){drawTile(p,G.dead[G.kanCount-1]);rinshan=true;}
    render();
    const info={rinshan,afterCall:mode==='call',forbid:mode==='call'?forbid:[]};
    const dec=pl.isHuman?await humanTurn(p,info):await aiTurn(p,info);
    if(dec.type==='tsumo')return await finishWin(p,null,pl.drawn,dec.res);
    if(dec.type==='kan'){doSelfKan(p,dec.opt);render();await pause(delay()*.6);mode='rinshan';continue;}
    doDiscard(p,dec.id,!!dec.riichi);
    render();G.players.forEach(x=>x.river.forEach(r=>r.fresh=false));
    await pause(pl.isHuman?150:delay()*.45);
    const cr=await resolveCalls(p,dec.id);
    if(cr.ron)return await finishWin(cr.ron.q,p,dec.id,cr.ron.res);
    if(pl.riichiPending){pl.riichiPending=false;pl.score-=1000;G.kyotaku++;}
    if(cr.call){applyCall(cr.call,p,dec.id);forbid=kuikaeOf(tt(dec.id),cr.call.useT);p=cr.call.q;mode=cr.call.type==='kan'?'rinshan':'call';render();await pause(delay()*.6);continue;}
    p=(p+1)%4;mode='draw';
  }
}
async function finishWin(w,l,winId,res){
  const pl=G.players[w],isD=w===G.dealer,h=G.honba,deltas=[0,0,0,0];
  if(l===null){
    for(let q=0;q<4;q++){if(q===w)continue;const pay=(isD?res.tsumoAll:(q===G.dealer?res.tsumoD:res.tsumoN))+100*h;deltas[q]-=pay;deltas[w]+=pay;}
  }else{const pay=res.ron+300*h;deltas[l]-=pay;deltas[w]+=pay;}
  deltas[w]+=G.kyotaku*1000;
  const before=G.players.map(x=>x.score);
  G.players.forEach((x,i)=>x.score+=deltas[i]);G.kyotaku=0;
  log(`${NAMES[w]} ${l===null?'自摸':'荣和'}${l!==null?'（'+NAMES[l]+'放铳）':''} ${res.yakuman?res.label:res.han+'番'}`);
  G.turn=-1;render();
  await showModal(winModal(w,l,winId,res,deltas,before),'下一局');
  return{winner:w};
}
async function exhaustive(){
  const ten=G.players.map(p=>shanten(counts(p.hand),p.melds.length)===0),n=ten.filter(Boolean).length,deltas=[0,0,0,0];
  if(n>0&&n<4)ten.forEach((x,i)=>deltas[i]=x?3000/n:-3000/(4-n));
  const before=G.players.map(x=>x.score);
  G.players.forEach((x,i)=>x.score+=deltas[i]);
  log(`流局：听牌 ${ten.map((x,i)=>x?NAMES[i]:null).filter(Boolean).join('、')||'无人'}`);
  G.turn=-1;render();
  const hands=G.players.map((pl,i)=>ten[i]?`<div class="mrow"><div><b>${NAMES[i]}</b> 听牌：${waitsOf(i).map(t=>tName(t)).join(' ')}</div><div class="mhand">${pl.hand.map(id=>tileHTML(id)).join('')}${pl.melds.length?'<span class="gap"></span>':''}${pl.melds.map(m=>meldHTML(m)).join('')}</div></div>`:'').join('');
  await showModal(`<div><span class="mkind draw">流局</span><h2>牌山摸完了</h2></div>${hands||'<p class="note">四家都没听牌，不用付点。</p>'}<p class="note">流局时没听牌的人向听牌的人共付 3000 点。庄家听牌则连庄，本场数 +1。</p>${deltasHTML(deltas,before)}`,'下一局');
  return{draw:true,dealerTenpai:ten[G.dealer]};
}
async function gameLoop(){
  const g=GEN;
  try{
    while(true){
      startRound();render();
      const r=await roundLoop();
      if(g!==GEN)return;
      let rotate=false;
      if(r.draw){G.honba++;rotate=!r.dealerTenpai;}
      else if(r.winner===G.dealer)G.honba++;
      else{G.honba=0;rotate=true;}
      if(rotate){G.dealer=(G.dealer+1)%4;G.kyoku++;if(G.kyoku>=4){G.kyoku=0;G.bakaze++;}}
      if(G.players.some(p=>p.score<0)||G.bakaze>G.lastWind){await showFinal();return;}
    }
  }catch(e){if(e!==ABORT)console.error(e);}
}
async function showFinal(){
  const order=[0,1,2,3].sort((a,b)=>G.players[b].score-G.players[a].score||a-b);
  G.players[order[0]].score+=G.kyotaku*1000;G.kyotaku=0;
  render();
  const html=`<div><span class="mkind">终局</span><h2>${order[0]===0?'恭喜，你拿下第一！':'对局结束'}</h2></div><div class="rank">${order.map((p,i)=>`<div><b>${i+1}</b><span>${NAMES[p]}</span><span>${G.players[p].score}</span></div>`).join('')}</div>`;
  await showModal(html,'再来一局');
  newGame();
}

// ===================== Modals =====================
function showModal(html,btn){
  const g=GEN;
  return new Promise((res,rej)=>{
    const m=$('#modal');m.innerHTML=`<div class="mbox" role="dialog" aria-modal="true">${html}<div><button class="btn gold" id="mclose" type="button">${btn}</button></div></div>`;m.hidden=false;
    const b=$('#mclose');b.focus();
    b.onclick=()=>{m.hidden=true;if(g!==GEN)rej(ABORT);else res();};
  });
}
function deltasHTML(deltas,before){
  return`<div class="deltas">${[0,1,2,3].map(i=>`<div><small>${NAMES[i]} · ${WIND_CH[seatOf(i)]}</small>${before[i]+deltas[i]}<small class="${deltas[i]>0?'up':deltas[i]<0?'dn':''}">${deltas[i]>0?'+':''}${deltas[i]||'±0'}</small></div>`).join('')}</div>`;
}
function winModal(w,l,winId,res,deltas,before){
  const pl=G.players[w];
  const hand=(l===null?pl.hand.filter(x=>x!==winId):pl.hand.slice()).sort((a,b)=>a-b);
  const handH=hand.map(id=>tileHTML(id)).join('')+'<span class="gap"></span>'+tileHTML(winId,'win')+(pl.melds.length?'<span class="gap"></span>':'')+pl.melds.map(m=>meldHTML(m)).join('');
  let rows=res.yaku.map(([n,h])=>`<li><span>${n}</span><b>${typeof h==='number'?h+' 番':h}</b></li>`).join('');
  if(!res.yakuman)rows+=[['宝牌',res.dora],['赤宝牌',res.aka],['里宝牌',res.ura]].filter(x=>x[1]).map(([n,h])=>`<li><span>${n}</span><b>${h} 番</b></li>`).join('');
  const total=res.yakuman?res.label:`${res.fu} 符 ${res.han} 番${res.label?' · '+res.label:''}`;
  const pay=l===null?(res.isDealer?`每家付 ${res.tsumoAll}`:`庄家付 ${res.tsumoD}，闲家各付 ${res.tsumoN}`):`${NAMES[l]} 付 ${res.ron}`;
  const extra=(G.honba?`，本场 +${l===null?G.honba*100+'/家':G.honba*300}`:'');
  const ura=(pl.riichi)?`<div>里宝牌指示 ${uraInds().map(t=>tileT(t,'xs')).join('')}</div>`:'';
  return`<div><span class="mkind">${l===null?'自摸':'荣和'}</span><h2>${w===0?'你和牌了！':NAMES[w]+' 和牌'}${l===0?'（你放铳）':''}</h2></div>
  <div class="mhand">${handH}</div>
  <div class="mdora"><div>宝牌指示 ${doraInds().map(t=>tileT(t,'xs')).join('')}</div>${ura}</div>
  <ul class="myaku">${rows}</ul>
  <div class="mtotal">${total}<small>${pay}${extra}</small></div>
  ${deltasHTML(deltas,before)}`;
}

// ===================== Rendering =====================
function render(){if(!G)return;renderStatus();renderOpps();renderSquare();renderMe();renderActions();renderCoach();renderLog();}
function renderStatus(){
  const inds=doraInds();
  $('#status').innerHTML=`<div class="stat"><small>场次</small><b>${roundName()} ${G.honba}本场</b></div>
  <div class="stat"><small>供托</small><b>${G.kyotaku}</b></div>
  <div class="stat"><small>余牌</small><b>${G.wall.length}</b></div>
  <div class="stat"><small>宝牌指示</small><div class="dora">${[0,1,2,3,4].map(i=>i<inds.length?tileT(inds[i]):backHTML()).join('')}</div></div>`;
}
function renderOpps(){
  $('#opps').innerHTML=[3,2,1].map(p=>{
    const pl=G.players[p],sw=seatOf(p);
    return`<div class="plate${G.turn===p?' on':''}"><div class="ph"><span class="wb${sw===0?' dealer':''}">${WIND_CH[sw]}</span><span class="nm">${NAMES[p]}</span><span class="lv lv-${lvl(p)}" title="电脑难度">${LEVELS[lvl(p)]}</span><span class="sc">${pl.score}</span></div>
    <div class="pb"><div class="backs">${'<i></i>'.repeat(pl.hand.length)}</div>${pl.riichi?'<span class="rtag">立直</span>':''}</div>
    <div class="pm">${pl.melds.map(m=>meldHTML(m,'mini')).join('')}</div></div>`;
  }).join('');
}
function renderSquare(){
  let h='';
  for(let p=0;p<4;p++){
    const pl=G.players[p];
    h+=`<div class="pond" style="--r:${ROT[p]}deg">${pl.river.map((r,i)=>tileHTML(r.id,[r.riichi?'yoko':'',r.called?'gone':'',r.fresh?'fresh':'',G.last&&G.last.p===p&&i===pl.river.length-1&&!r.called&&G.turn!==-1?'last':''].join(' '))).join('')}</div>`;
  }
  h+='<div class="center">';
  for(let p=0;p<4;p++){const pl=G.players[p];h+=`<div class="seat${G.turn===p?' on':''}${seatOf(p)===0?' dealer':''}" style="--r:${ROT[p]}deg"><b>${WIND_CH[seatOf(p)]}</b><span>${pl.score}</span>${pl.riichi?'<i class="stick"></i>':''}</div>`;}
  h+=`<div class="mid"><b>${roundName()}</b><span>余 ${G.wall.length}</span></div></div>`;
  $('#square').innerHTML=h;
}
function renderMe(){
  const pl=G.players[0],sw=seatOf(0);
  const w0=pl.hand.length%3===1?waitsOf(0):[],fur=w0.length&&isFuriten(0,w0);
  $('#mebar').innerHTML=`<span>你 · <b>${WIND_CH[sw]}家${sw===0?'（庄）':''}</b></span><span>点数 <b>${pl.score}</b></span>${pl.riichi?'<span class="rtag">立直中</span>':''}${fur?'<span class="ftag">振听</span>':''}`;
  const ids=pl.hand.filter(x=>x!==pl.drawn).sort((a,b)=>a-b);
  if(pl.drawn!=null)ids.push(pl.drawn);
  const dset=new Set(doraInds().map(doraOf));
  let rec=new Set();
  if(S.hints&&UI.mode==='discard'&&!UI.riichiMode){const rows=ukeireTable(0).filter(r=>!UI.opts.forbid.includes(r.d));if(rows.length){const b=rows[0];rec=new Set(rows.filter(r=>r.s===b.s&&r.n===b.n).map(r=>r.d));}}
  // Re-rendering replaces the tiles, so put keyboard focus back on the same tile (or the first one).
  const ae=document.activeElement,fid=ae&&ae.closest&&ae.closest('#hand')?ae.dataset.id:null;
  $('#hand').innerHTML=ids.map(id=>{
    const t=tt(id),cls=[];
    if(id===pl.drawn&&pl.hand.length%3===2)cls.push('drawn');
    if(UI.selected===id)cls.push('sel');
    if(UI.mode==='discard'&&(UI.opts.forbid.includes(t)||(UI.riichiMode&&!UI.opts.riichi.has(t))))cls.push('dim');
    if(rec.has(t)&&(id===pl.drawn||ids.filter(x=>tt(x)===t)[0]===id))cls.push('rec');
    if(dset.has(t))cls.push('dora');
    return tileHTML(id,cls.join(' '),`data-id="${id}" role="button" tabindex="0"`);
  }).join('');
  if(fid!=null){const el=$(`#hand [data-id="${fid}"]`)||$('#hand .tile[data-id]');if(el)el.focus();}
  $('#mymelds').innerHTML=pl.melds.map(m=>meldHTML(m)).join('');
}
function renderActions(){
  const el=$('#actions');let h='';
  const ae=document.activeElement,act=ae&&ae.closest&&ae.closest('#actions')?ae.dataset.act:null;
  if(UI.mode==='discard'){
    const o=UI.opts;
    if(UI.riichiMode)h+=`<span class="amsg">点选立直宣言牌：亮着的牌打出后都能听牌</span><button class="btn ghost" data-act="riichi-cancel" type="button">取消</button>`;
    else{
      h+=`<span class="amsg">${UI.selected!=null?'再点一次打出 <b>'+tName(tt(UI.selected))+'</b>':'轮到你：'+(S.oneTap?'点一张牌打出':'点一张牌选中，再点一次打出')}</span>`;
      if(o.tsumo)h+=`<button class="btn win" data-act="tsumo" type="button">自摸</button>`;
      if(o.riichi.size)h+=`<button class="btn gold" data-act="riichi" type="button">立直</button>`;
      o.kans.forEach((k,i)=>h+=`<button class="btn" data-act="kan:${i}" type="button">${k.kind==='ankan'?'暗杠':'加杠'} ${tileT(k.t)}</button>`);
    }
  }else if(UI.mode==='riichiTsumo'){
    const o=UI.opts;
    h=`<span class="amsg">${o.tsumo?'摸到和牌了！':'立直中：这张可以暗杠，听牌不变'}</span>`;
    if(o.tsumo)h+=`<button class="btn win" data-act="tsumo" type="button">自摸</button>`;
    o.kans.forEach((k,i)=>h+=`<button class="btn" data-act="kan:${i}" type="button">暗杠 ${tileT(k.t)}</button>`);
    h+=`<button class="btn ghost" data-act="pass" type="button">${o.tsumo?'不和，摸切':'不杠，摸切'}</button>`;
  }else if(UI.mode==='call'){
    const c=UI.call;
    h=`<span class="amsg">${NAMES[c.d]} 打出 ${tileHTML(c.id,'chip')}</span>`;
    if(c.ron)h+=`<button class="btn win" data-act="ron" type="button">荣和</button>`;
    if(c.pon)h+=`<button class="btn gold" data-act="pon" type="button">碰</button>`;
    if(c.kan)h+=`<button class="btn" data-act="kan" type="button">杠</button>`;
    c.chis.forEach((p,i)=>h+=`<button class="btn" data-act="chi:${i}" type="button">吃 ${tileT(p[0])}${tileT(p[1])}</button>`);
    h+=`<button class="btn ghost" data-act="pass" type="button">跳过</button>`;
  }else if(G.turn>=1){
    h=`<span class="amsg">${NAMES[G.turn]} 思考中…</span>`;
  }else if(G.turn===0&&G.players[0].riichi){h=`<span class="amsg">立直中，自动摸切</span>`;}
  el.innerHTML=h;
  if(act){const b=el.querySelector(`[data-act="${act}"]`);if(b)b.focus();}
}
function waitLine(t,rem){
  const res=evaluate(ctxFor(0,t*4+3,false,{riichi:G.players[0].riichi,double:G.players[0].doubleRiichi},false));
  const txt=res?`荣和 ${res.yakuman?res.label:res.han+'番'} · ${res.ron} 点`:(isMenzen(G.players[0])?'<span class="noyaku">无役：要立直或自摸才能和</span>':'<span class="noyaku">无役：这张来了也不能和</span>');
  return`<div class="wait">${tileT(t,'chip')}<div class="wl">${tName(t)} <small>剩 ${rem} 张</small><br>${txt}</div></div>`;
}
function renderCoach(){
  const body=$('#coachBody'),tag=$('#coachTag');
  if(!S.hints){body.innerHTML='<p class="note">学习提示已关闭，可在「设置」里打开。</p>';tag.textContent='';return;}
  const pl=G.players[0];let h='';
  if(!pl.hand.length){body.innerHTML='';return;}
  const vis=visibleTo(0);
  if(pl.hand.length%3===2){
    const c=counts(pl.hand);const cur=shanten(c,pl.melds.length);
    let rows=ukeireTable(0);if(UI.opts&&UI.opts.forbid)rows=rows.filter(r=>!UI.opts.forbid.includes(r.d));
    if(UI.riichiMode)rows=rows.filter(r=>UI.opts.riichi.has(r.d));
    tag.textContent='14 张 · 选择打哪张';
    h+=`<div class="big${cur<=0?' tenpai':''}">${cur===-1?'已经和了！':'现在 '+shName(cur)}</div>`;
    h+=`<p class="note">下面按「打出后的向听数 → 有效进张数」排序。进张越多，越快听牌。</p>`;
    const selT=UI.selected!=null?tt(UI.selected):-1;
    let show=rows.slice(0,5);const sr=rows.find(r=>r.d===selT);if(sr&&!show.includes(sr))show.push(sr);
    h+=show.map((r,i)=>`<div class="crow${i===0?' best':''}${r.d===selT?' sel':''}">${tileT(r.d,'chip')}<div><div class="cl">打 <b>${tName(r.d)}</b> → ${r.s===0?'<b>听牌</b> · 听 '+r.tiles.length+' 种 '+r.n+' 张':shName(r.s)+' · 进张 '+r.tiles.length+' 种 '+r.n+' 张'}${i===0?' · 推荐':''}</div><div class="ct">${r.tiles.map(([t,n])=>tileT(t,'xs')+`<span class="cnt">${n}</span>`).join('')}</div></div></div>`).join('');
  }else{
    const c=counts(pl.hand),s=shanten(c,pl.melds.length);
    tag.textContent='13 张 · 等待中';
    h+=`<div class="big${s===0?' tenpai':''}">${shName(s)}</div>`;
    if(s===0){
      const w=waitsOf(0),fur=isFuriten(0,w);
      h+=`<p class="note">${fur?'<span class="noyaku">振听中：只能自摸，不能荣和。</span>':'听这些牌。别人打出来可以荣和，自己摸到可以自摸。'}</p>`;
      h+=w.map(t=>waitLine(t,4-vis[t])).join('');
    }else{
      const acc=[];let n=0;
      for(let t=0;t<34;t++){const rem=4-vis[t];if(rem<=0)continue;c[t]++;if(shanten(c,pl.melds.length)<s){acc.push([t,rem]);n+=rem;}c[t]--;}
      h+=`<p class="note">摸到这些牌会前进一步（共 ${acc.length} 种 ${n} 张）：</p><div class="chips">${acc.map(([t,r])=>tileT(t,'xs')+`<span class="cnt" style="font-size:11px;color:var(--muted);align-self:flex-end;margin:0 4px 0 1px">${r}</span>`).join('')}</div>`;
    }
  }
  const threats=[1,2,3].filter(i=>G.players[i].riichi);
  if(threats.length&&!pl.riichi){
    const mine=[...new Set(pl.hand.map(tt))];
    const safe=mine.filter(t=>threats.every(r=>danger(t,r)===0));
    const semi=mine.filter(t=>!safe.includes(t)&&threats.every(r=>danger(t,r)<=3));
    h+=`<div class="safe"><h3>${threats.map(i=>NAMES[i]).join('、')} 已立直 · 防守参考</h3>
    <div class="note" style="margin:0 0 4px">现物（绝对安全）：</div><div class="chips">${safe.map(t=>tileT(t,'xs')).join('')||'<span class="note" style="margin:0">没有</span>'}</div>
    <div class="note" style="margin:8px 0 4px">较安全（筋牌、见得多的字牌）：</div><div class="chips">${semi.map(t=>tileT(t,'xs')).join('')||'<span class="note" style="margin:0">没有</span>'}</div></div>`;
  }
  body.innerHTML=h;
}
function renderLog(){$('#log').innerHTML=G.log.slice(-12).reverse().map(s=>`<li>${s}</li>`).join('');}

// ===================== Events =====================
function submit(v){Object.assign(UI,{selected:null,riichiMode:false});give(v);}
$('#hand').addEventListener('click',e=>{
  const el=e.target.closest('.tile[data-id]');if(!el||UI.mode!=='discard')return;
  const id=+el.dataset.id,t=tt(id);
  if(UI.opts.forbid.includes(t))return;
  if(UI.riichiMode&&!UI.opts.riichi.has(t))return;
  if(UI.selected===id||S.oneTap){UI.mode='idle';submit({type:'discard',id,riichi:UI.riichiMode});}
  else{UI.selected=id;renderMe();renderActions();renderCoach();}
});
$('#hand').addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.click();return;}
  // Arrow keys move focus along the hand.
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    const tiles=[...document.querySelectorAll('#hand .tile[data-id]')],i=tiles.indexOf(e.target);if(i<0)return;
    e.preventDefault();const n=tiles[i+(e.key==='ArrowRight'?1:-1)];if(n)n.focus();
  }
});
$('#actions').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const [a,i]=b.dataset.act.split(':');
  if(UI.mode==='discard'){
    if(a==='tsumo'){UI.mode='idle';submit({type:'tsumo'});}
    else if(a==='riichi'){UI.riichiMode=true;UI.selected=null;render();}
    else if(a==='riichi-cancel'){UI.riichiMode=false;UI.selected=null;render();}
    else if(a==='kan'){const o=UI.opts.kans[+i];UI.mode='idle';submit({type:'kan',opt:o});}
  }else if(UI.mode==='riichiTsumo'){if(a==='kan')submit({type:'kan',opt:UI.opts.kans[+i]});else submit({type:a==='tsumo'?'tsumo':'pass'});}
  else if(UI.mode==='call'){
    if(a==='chi')submit({type:'chi',useT:UI.call.chis[+i]});
    else submit({type:a});
  }
});
const bind=(id,key,isBox)=>{const el=$('#'+id);if(isBox)el.checked=S[key];else el.value=S[key];el.addEventListener('change',()=>{S[key]=isBox?el.checked:el.value;saveS();render();});};
bind('optHints','hints',true);bind('optOneTap','oneTap',true);bind('optSkip','autoSkip',true);bind('optSpeed','speed',false);bind('optLen','len',false);bind('optAI','ai',false);bind('optTheme','theme',false);
const AI_HINT={easy:'入门：只看大致牌效，经常打错，常无役乱鸣，几乎不弃和。适合刚学规则时练手。',
  normal:'普通：按进张数打牌效，有人立直且自己离听牌远时弃和。',
  hard:'困难：多看两步、优先好形，听牌时选打点期望最高的听法，大牌默听，按手牌价值决定押退，会防危险的副露，弃和时用筋、壁、No Chance。',
  mixed:'混合：下家入门、对家普通、上家困难，方便比较三种打法。'};
const aiHint=()=>{$('#aiHint').textContent=AI_HINT[S.ai]||AI_HINT.normal;};
$('#optAI').addEventListener('change',aiHint);aiHint();
$('#btnNew').addEventListener('click',newGame);

const YAKU=[['1 番',[['立直','1','门清听牌时宣言，交 1000 点'],['一发','1','立直后一巡内和牌，中途无人鸣牌'],['门前清自摸和','1','没鸣牌，自摸和牌'],['平和','1','4 组顺子 + 非役牌雀头 + 两面听，门清'],['断幺九','1 / 1','全部是 2–8 的数牌，鸣牌也算'],['一杯口','1','两组完全相同的顺子，门清'],['役牌','1 / 1','白、发、中、自风、场风的刻子，各算 1 番'],['海底摸月 / 河底捞鱼','1 / 1','摸最后一张自摸 / 荣和最后一张打出的牌'],['岭上开花','1 / 1','杠后补的岭上牌自摸']]],
['2 番',[['两立直','2','第一巡就立直'],['七对子','2','7 个不同的对子，门清，固定 25 符'],['三色同顺','2 / 1','万筒索同数字的顺子，如 345 万筒索'],['一气通贯','2 / 1','同一花色 123、456、789'],['混全带幺九','2 / 1','每组面子和雀头都带幺九或字牌，含顺子'],['对对和','2 / 2','4 组都是刻子'],['三暗刻','2 / 2','3 组自己摸到的刻子'],['三色同刻','2 / 2','三种花色同数字的刻子'],['三杠子','2 / 2','杠了 3 次'],['混老头','2 / 2','只有幺九牌和字牌'],['小三元','2 / 2','白发中中两组刻子 + 一组雀头']]],
['3 番以上',[['混一色','3 / 2','一种花色 + 字牌'],['纯全带幺九','3 / 2','每组都带 1 或 9，没有字牌'],['二杯口','3','两个一杯口，门清'],['清一色','6 / 5','只有一种花色']]],
['役满',[['国士无双','役满','13 种幺九牌各一张，其中一种成对'],['四暗刻','役满','4 组暗刻'],['大三元','役满','白发中三组刻子'],['小四喜 / 大四喜','役满','东南西北：三刻一对 / 四刻'],['字一色 / 绿一色 / 清老头','役满','全字牌 / 全绿色牌 / 全 1、9'],['九莲宝灯','役满','同花色 1112345678999 + 任意一张'],['四杠子','役满','杠了 4 次'],['天和 / 地和','役满','庄家起手和 / 闲家第一巡自摸']]]];
$('#yakuTable').innerHTML='<tr><th>役</th><th>番（门清 / 鸣牌）</th><th>条件</th></tr>'+YAKU.map(([g,rows])=>`<tr class="grp"><td colspan="3">${g}</td></tr>`+rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')).join('');

newGame();
