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
// Per game. hands: hands dealt; wins / riichi / calls (hands in which you called) / dealIn: your counts.
const newStats=()=>({decisions:0,match:0,defend:0,slow:0,back:0,lost:0,dealIn:0,hands:0,wins:0,riichi:0,calls:0});

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

// ===================== History across games =====================
// One entry per finished game in localStorage['rmj-history'] (the newest 200), for the stats card.
const HIST_KEY='rmj-history',HIST_MAX=200;
function loadHistory(){try{const h=JSON.parse(localStorage.getItem(HIST_KEY)||'[]');return Array.isArray(h)?h:[];}catch(e){return[];}}
function clearHistory(){try{localStorage.removeItem(HIST_KEY);}catch(e){}}
function recordGame(rank,score){
  const h=loadHistory();
  h.push({at:Date.now(),len:G.lastWind?'south':'east',ai:S.ai,rank,score,...(G.stats||newStats())});
  if(h.length>HIST_MAX)h.splice(0,h.length-HIST_MAX);
  try{localStorage.setItem(HIST_KEY,JSON.stringify(h));}catch(e){}
}
// Totals and rates over a history list; trend = coach match rate (%) of the last 20 games that had decisions.
function historySummary(h){
  const sum=k=>h.reduce((a,g)=>a+(g[k]||0),0),hands=sum('hands'),dec=sum('decisions');
  const rate=(a,b)=>b?a/b:null;
  return{games:h.length,hands,avgRank:rate(sum('rank'),h.length),first:rate(h.filter(g=>g.rank===1).length,h.length),
    win:rate(sum('wins'),hands),dealIn:rate(sum('dealIn'),hands),riichi:rate(sum('riichi'),hands),calls:rate(sum('calls'),hands),
    match:rate(sum('match')+sum('defend'),dec),
    trend:h.filter(g=>g.decisions).slice(-20).map(g=>Math.round(100*(g.match+g.defend)/g.decisions))};
}
