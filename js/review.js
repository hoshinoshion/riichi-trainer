// Post-round review. Each of your discards is recorded with what the coach would have played, judged, and
// kept in G.review (this round) and G.stats (this game), so it survives a reload with the rest of G.
// No DOM: render.js draws the review in the result screens.

// Highest danger of tile type t against the given riichi players (0 = genbutsu to all of them).
function dangerVs(t,threats){return threats.length?Math.max(...threats.map(r=>danger(t,r))):0;}

// Judge discarding tile type d, given the coach's rows (sorted best first, as from ukeireTable).
//   match  — as good as the recommendation (same shanten, same effective draws)
//   defend — less efficient but safer against a riichi than the most efficient tile: a fold, not a mistake
//   slow   — same shanten, fewer effective draws; loss = draws given up
//   back   — steps back in shanten
function judgeDiscard(rows,d,threats){
  const best=rows[0],mine=rows.find(r=>r.d===d);
  if(!best||!mine||(mine.s===best.s&&mine.n===best.n))return{kind:'match',loss:0};
  if(threats.length&&dangerVs(d,threats)<dangerVs(best.d,threats))return{kind:'defend',loss:0};
  if(mine.s>best.s)return{kind:'back',loss:0};
  return{kind:'slow',loss:best.n-mine.n};
}
const reviewCost=r=>r.kind==='back'?1000+(r.mine.s-r.best.s)*100+r.best.n:r.kind==='slow'?r.loss:0;
const newStats=()=>({decisions:0,match:0,defend:0,slow:0,back:0,lost:0,dealIn:0});

// Called with your 14-tile hand just before the discard goes out. forbid: tile types kuikae rules out.
function recordDiscard(id,forbid){
  const pl=G.players[0],d=tt(id);
  const rows=ukeireTable(0).filter(r=>!forbid.includes(r.d));
  if(!rows.length)return;
  const threats=[1,2,3].filter(i=>G.players[i].riichi);
  const j=judgeDiscard(rows,d,threats),best=rows[0],mine=rows.find(r=>r.d===d)||best;
  const kinds=[...new Set(pl.hand.map(tt))];
  G.review.push({turn:pl.river.length+1,hand:pl.hand.slice().sort((a,b)=>a-b),id,kind:j.kind,loss:j.loss,
    mine:{s:mine.s,n:mine.n},best:{d:best.d,s:best.s,n:best.n},
    recs:rows.filter(r=>r.s===best.s&&r.n===best.n).map(r=>r.d),
    // Per riichi player: how dangerous this tile was, and which tiles in hand were genbutsu against them.
    th:threats.map(p=>({p,dg:danger(d,p),safe:kinds.filter(t=>danger(t,p)===0)}))});
  if(!G.stats)G.stats=newStats();
  G.stats.decisions++;G.stats[j.kind]++;G.stats.lost+=j.loss;
}

// The costliest decisions of this round, worst first.
function reviewMistakes(n=3){return G.review.filter(r=>r.kind==='slow'||r.kind==='back').sort((a,b)=>reviewCost(b)-reviewCost(a)).slice(0,n);}

// Why you dealt in to player w with winId. rec is your recorded decision for that discard, if it was one
// (after riichi you only discard what you draw, so there is no decision to look at).
function dealInInfo(w,winId){
  const me=G.players[0],wp=G.players[w],last=G.review[G.review.length-1];
  const rec=last&&last.id===winId?last:null;
  const vsW=rec&&rec.th.find(x=>x.p===w);
  return{w,t:tt(winId),locked:!rec,riichi:wp.riichi,melds:wp.melds.length,
    s:rec?rec.mine.s:null,dg:vsW?vsW.dg:null,safe:vsW?vsW.safe:[]};
}
