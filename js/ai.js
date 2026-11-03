// Computer opponents: discard choice, calls, riichi and kan decisions per difficulty level. No DOM.
// ===================== AI =====================
// Difficulty levels. 入门: noisy efficiency with slips, calls without a yaku plan, folds only when hopeless.
// 普通: pure tile efficiency, folds against riichi when far from tenpai.
// 困难: picks the tenpai wait with the best expected score, damaten on big hands, push/fold by hand value,
// reads dangerous open hands as threats, uses suji / kabe / no-chance when folding, avoids kan into a riichi.
const MIXED=[null,'easy','normal','hard'];
function lvl(p){return S.ai==='mixed'?MIXED[p]:(['easy','normal','hard'].includes(S.ai)?S.ai:'normal');}
const rnd=rand;
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
