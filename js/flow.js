// Game and round flow: new game, dealing, turns for the human and the AI, call resolution, wins and draws.
// seed: optional, for a reproducible game (tests, the simulator); otherwise a fresh random one.
function newGame(seed){
  GEN++;give({type:'abort'});
  seed=seed??newSeed();
  G={seed,rng:seed,dealt:0,flow:null,stats:newStats(),review:[],players:[0,1,2,3].map(i=>({id:i,isHuman:i===0,score:25000,hand:[],melds:[],river:[],drawn:null,safe:new Set()})),
     dealer:0,kyoku:0,bakaze:0,honba:0,kyotaku:0,lastWind:S.len==='south'?1:0,log:[],turn:0,wall:[],dead:[],kanCount:0,doraCount:1,pendingDora:0,noCalls:true,last:null};
  $('#modal').hidden=true;
  gameLoop(false);
}
// Continue a game from loadSave(): the round picks up at the start of the saved turn.
function resumeGame(saved){
  GEN++;give({type:'abort'});
  G=saved;Object.assign(UI,{mode:'idle',selected:null,riichiMode:false,opts:null,call:null});
  $('#modal').hidden=true;
  log('resume',{});
  gameLoop(true);
}
function startRound(){
  const w=[...Array(136).keys()],r=dealRng(G.seed,G.dealt++);
  for(let i=w.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[w[i],w[j]]=[w[j],w[i]];}
  G.dead=w.splice(0,14);G.wall=w;
  G.kanCount=0;G.doraCount=1;G.pendingDora=0;G.noCalls=true;G.last=null;G.turn=G.dealer;G.log=[];G.flow=null;G.review=[];if(G.stats)G.stats.hands++;
  for(const p of G.players)Object.assign(p,{hand:[],melds:[],river:[],drawn:null,riichi:false,doubleRiichi:false,ippatsu:false,riichiPending:false,tempFuriten:false,riichiFuriten:false,safe:new Set()});
  for(let i=0;i<13;i++)for(let k=0;k<4;k++)G.players[(G.dealer+k)%4].hand.push(G.wall.pop());
  G.players.forEach(p=>p.hand.sort((a,b)=>a-b));
  Object.assign(UI,{mode:'idle',selected:null,riichiMode:false,opts:null,call:null});
  log('start',{b:G.bakaze,k:G.kyoku,h:G.honba,d:G.dealer});
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
  if(v.type==='discard')recordDiscard(v.id,opts.forbid);
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
  let {p,mode,forbid}=G.flow||{p:G.dealer,mode:'draw',forbid:[]};
  while(true){
    G.flow={p,mode,forbid};saveGame();
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
  log('win',{w,l,ym:res.yakuman,label:res.label,han:res.han});
  const dealIn=l===0?dealInInfo(w,winId):null;
  if(dealIn)G.stats.dealIn++;
  if(w===0&&G.stats)G.stats.wins++;
  G.turn=-1;render();
  await showModal(winModal(w,l,winId,res,deltas,before)+(dealIn?dealInHTML(dealIn):'')+reviewHTML(),t('next'));
  return{winner:w};
}
async function exhaustive(){
  const ten=G.players.map(p=>shanten(counts(p.hand),p.melds.length)===0),n=ten.filter(Boolean).length,deltas=[0,0,0,0];
  if(n>0&&n<4)ten.forEach((x,i)=>deltas[i]=x?3000/n:-3000/(4-n));
  const before=G.players.map(x=>x.score);
  G.players.forEach((x,i)=>x.score+=deltas[i]);
  log('draw',{ten:ten.map((x,i)=>x?i:-1).filter(i=>i>=0)});
  G.turn=-1;render();
  const hands=G.players.map((pl,i)=>ten[i]?`<div class="mrow"><div>${t('tenpaiLine',{p:P(i),waits:waitsOf(i).map(TN).join(' ')})}</div><div class="mhand">${pl.hand.map(id=>tileHTML(id)).join('')}${pl.melds.length?'<span class="gap"></span>':''}${pl.melds.map(m=>meldHTML(m)).join('')}</div></div>`:'').join('');
  await showModal(`<div><span class="mkind draw">${t('drawKind')}</span><h2>${t('drawTitle')}</h2></div>${hands||`<p class="note">${t('noTenpai')}</p>`}<p class="note">${t('drawNote')}</p>${deltasHTML(deltas,before)}${reviewHTML()}`,t('next'));
  return{draw:true,dealerTenpai:ten[G.dealer]};
}
// resume: the first round is already in G (from a save), so it is not dealt again.
async function gameLoop(resume){
  const g=GEN;
  try{
    while(true){
      if(resume)resume=false;else startRound();
      render();
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
  clearSave();
  const order=[0,1,2,3].sort((a,b)=>G.players[b].score-G.players[a].score||a-b);
  G.players[order[0]].score+=G.kyotaku*1000;G.kyotaku=0;
  recordGame(order.indexOf(0)+1,G.players[0].score);renderStats();
  render();
  const html=`<div><span class="mkind">${t('endKind')}</span><h2>${order[0]===0?t('firstPlace'):t('gameOver')}</h2></div><div class="rank">${order.map((p,i)=>`<div><b>${i+1}</b><span>${P(p)}</span><span>${G.players[p].score}</span></div>`).join('')}</div>${summaryHTML()}${challengeHTML()}`;
  await showModal(html,t('again'));
  newGame();
}
