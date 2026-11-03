// Rendering: tile faces, the table, your hand, action buttons, coach panel, log and result modals.
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
function tileHTML(id,cls='',attr=''){return`<div class="tile ${cls}" ${attr} title="${TN(tt(id))}${RED_IDS.has(id)?t('red'):''}"><div class="face">${face(tt(id),RED_IDS.has(id))}</div></div>`;}
function tileT(t,cls=''){return tileHTML(t*4+3,cls);}
function backHTML(cls=''){return`<div class="tile back ${cls}"></div>`;}
function meldHTML(m,cls=''){
  if(m.type==='ankan')return`<div class="meld">${backHTML(cls)}${tileHTML(m.ids[1],cls)}${tileHTML(m.ids[2],cls)}${backHTML(cls)}</div>`;
  const others=m.ids.filter(id=>id!==m.called).sort((a,b)=>a-b).map(id=>tileHTML(id,cls));
  const side=tileHTML(m.called,cls+' yoko');
  const seq=m.from===3?[side,...others]:m.from===2?[others[0],side,...others.slice(1)]:[...others,side];
  return`<div class="meld">${seq.join('')}</div>`;
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
  return`<div class="deltas">${[0,1,2,3].map(i=>`<div><small>${P(i)} · ${W4(seatOf(i))}</small>${before[i]+deltas[i]}<small class="${deltas[i]>0?'up':deltas[i]<0?'dn':''}">${deltas[i]>0?'+':''}${deltas[i]||'±0'}</small></div>`).join('')}</div>`;
}
function winModal(w,l,winId,res,deltas,before){
  const pl=G.players[w];
  const hand=(l===null?pl.hand.filter(x=>x!==winId):pl.hand.slice()).sort((a,b)=>a-b);
  const handH=hand.map(id=>tileHTML(id)).join('')+'<span class="gap"></span>'+tileHTML(winId,'win')+(pl.melds.length?'<span class="gap"></span>':'')+pl.melds.map(m=>meldHTML(m)).join('');
  let rows=res.yaku.map(([n,h])=>`<li><span>${YN(n)}</span><b>${typeof h==='number'?t('han',{n:h}):t('yakuman')}</b></li>`).join('');
  if(!res.yakuman)rows+=[[t('dora'),res.dora],[t('aka'),res.aka],[t('ura'),res.ura]].filter(x=>x[1]).map(([n,h])=>`<li><span>${n}</span><b>${t('han',{n:h})}</b></li>`).join('');
  const total=res.yakuman?LBL(res.label):t('fuHan',{fu:res.fu,han:res.han,label:LBL(res.label)});
  const pay=l===null?(res.isDealer?t('payAll',{n:res.tsumoAll}):t('payTsumo',{d:res.tsumoD,n:res.tsumoN})):t('payRon',{p:P(l),n:res.ron});
  const extra=(G.honba?(l===null?t('honbaTsumo',{n:G.honba*100}):t('honbaRon',{n:G.honba*300})):'');
  const ura=(pl.riichi)?`<div>${t('uraInd')} ${uraInds().map(x=>tileT(x,'xs')).join('')}</div>`:'';
  return`<div><span class="mkind">${l===null?t('tsumo'):t('ron')}</span><h2>${w===0?t('youWon'):t('playerWon',{p:P(w)})}${l===0?t('youDealt'):''}</h2></div>
  <div class="mhand">${handH}</div>
  <div class="mdora"><div>${t('doraInd')} ${doraInds().map(x=>tileT(x,'xs')).join('')}</div>${ura}</div>
  <ul class="myaku">${rows}</ul>
  <div class="mtotal">${total}<small>${pay}${extra}</small></div>
  ${deltasHTML(deltas,before)}`;
}

// Post-round review (review.js): agreement with the coach, then the costliest discards with the hand as it was.
function reviewHTML(){
  const R=G.review||[];if(!R.length)return'';
  const a=R.filter(r=>r.kind==='match').length,d=R.filter(r=>r.kind==='defend').length,list=reviewMistakes();
  const items=list.map(r=>{
    const v={t:tt(r.id),s:r.mine.s,n:r.mine.n,b:r.best.d,bs:r.best.s,bn:r.best.n};
    const hand=r.hand.map(id=>tileHTML(id,[id===r.id?'mine':'',r.recs.includes(tt(id))&&id!==r.id?'recd':''].join(' '))).join('');
    return`<div class="rv"><div class="rvh"><b>${t('rv.turn',{n:r.turn})}</b> ${t(r.kind==='back'?'rv.back':'rv.slow',v)}</div><div class="rvhand">${hand}</div></div>`;
  }).join('');
  return`<details class="review"${list.length?' open':''}><summary>${t('rv.title')} · ${t('rv.agree',{a,n:R.length,d})}</summary>
  ${list.length?`<p class="note">${t('rv.legend')}</p>${items}`:`<p class="note">${t('rv.none')}</p>`}</details>`;
}
// Deal-in analysis from dealInInfo(): what you could have known when the tile went out.
function dealInHTML(x){
  let h;
  if(x.locked)h=`<p>${t('di.locked')}</p>`;
  else if(!x.riichi||x.dg==null)h=`<p>${t('di.dama',{p:x.w,m:x.melds})}</p>`;
  else{
    h=`<p>${t(x.dg<=3?'di.semi':'di.danger',{t:x.t,p:x.w})}</p>`;
    h+=x.safe.length?`<div class="dirow">${t('di.hadSafe')}<span class="chips">${x.safe.map(k=>tileT(k,'xs')).join('')}</span></div>`:`<p>${t('di.noSafe')}</p>`;
    if(x.safe.length)h+=`<p>${t(x.s>=1?'di.fold':'di.push',{s:x.s})}</p>`;
  }
  return`<div class="dealin"><h3>${t('di.title')}</h3>${h}</div>`;
}
// Challenge link: a friend opening it plays the same deals.
function challengeHTML(){return`<div class="share"><button class="btn" type="button" data-share="challenge">${t('shareChallenge')}</button><small>${t('shareNote',{seed:G.seed})}</small></div>`;}
// Stats card: totals over finished games (review.js history) and a sparkline of the coach match rate.
function renderStats(){
  const h=loadHistory(),x=historySummary(h);
  $('#btnClearStats').hidden=!h.length;
  if(!h.length){$('#statsBody').innerHTML=`<p class="note">${t('stats.empty')}</p>`;return;}
  const pct=v=>v==null?'–':Math.round(100*v)+'%';
  const cells=[[t('stats.games'),x.games],[t('stats.avgRank'),x.avgRank.toFixed(2)],[t('stats.first'),pct(x.first)],[t('stats.win'),pct(x.win)],
    [t('stats.dealIn'),pct(x.dealIn)],[t('stats.riichi'),pct(x.riichi)],[t('stats.calls'),pct(x.calls)],[t('stats.match'),pct(x.match)]];
  let spark='';
  if(x.trend.length){
    const n=x.trend.length,X=i=>n===1?100:4+i*192/(n-1),Y=v=>36-v*.32,pts=x.trend.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    const last=x.trend[n-1];
    spark=`<figure class="spark"><svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="${Y(50)}" x2="200" y2="${Y(50)}" class="grid"/><polygon points="${X(0)},36 ${pts.join(' ')} ${X(n-1)},36" class="area"/>
      <polyline points="${pts.join(' ')}" class="line"/><circle cx="${X(n-1)}" cy="${Y(last)}" r="2.6" class="dot"/></svg>
      <figcaption>${t('stats.trend',{n,last})}</figcaption></figure>`;
  }
  $('#statsBody').innerHTML=`<dl class="sgrid">${cells.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>${spark}`;
}
// End-of-game summary from G.stats.
function summaryHTML(){
  const st=G.stats;if(!st||!st.decisions)return'';
  const ok=st.match+st.defend,pct=Math.round(100*ok/st.decisions);
  const li=[t('sum.agree',{pct,a:ok,n:st.decisions})];
  if(st.defend)li.push(t('sum.defend',{n:st.defend}));
  li.push(t('sum.back',{n:st.back}),t('sum.lost',{n:st.lost}),t('sum.dealIn',{n:st.dealIn}));
  return`<div class="summary"><h3>${t('sum.title')}</h3><ul>${li.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
}

// ===================== Rendering =====================
function render(){if(!G)return;updateTools();renderOpps();renderSquare();renderMe();renderActions();renderCoach();renderLog();}
// Opponents sit around the discard area: 下家 (1) right, 对家 (2) top, 上家 (3) left.
function renderOpps(){
  for(const p of [1,2,3]){
    const pl=G.players[p],sw=seatOf(p);
    $('#opp'+p).innerHTML=`<div class="plate${G.turn===p?' on':''}">
    <div class="ph"><span class="wb${sw===0?' dealer':''}">${WIND_CH[sw]}</span><span class="nm">${P(p)}</span><span class="lv lv-${lvl(p)}" title="${t('lvTitle')}">${L('lv')[lvl(p)]}</span><b class="sc">${pl.score}</b>${pl.riichi?`<span class="rtag">${t('riichiTag')}</span>`:''}</div>
    <div class="pb"><div class="backs">${'<i></i>'.repeat(pl.hand.length)}</div><div class="pm">${pl.melds.map(m=>meldHTML(m,'mini')).join('')}</div></div></div>`;
  }
}
function renderSquare(){
  let h='';
  for(let p=0;p<4;p++){
    const pl=G.players[p];
    h+=`<div class="pond" style="--r:${ROT[p]}deg">${pl.river.map((r,i)=>tileHTML(r.id,[r.riichi?'yoko':'',r.called?'gone':'',r.fresh?'fresh':'',G.last&&G.last.p===p&&i===pl.river.length-1&&!r.called&&G.turn!==-1?'last':''].join(' '))).join('')}</div>`;
  }
  // Centre: each seat's wind on its edge (highlighted on that player's turn, riichi stick when declared);
  // round, honba, riichi deposits, dora indicators and the wall count in the middle.
  h+='<div class="center">';
  for(let p=0;p<4;p++){const pl=G.players[p];h+=`<div class="seat${G.turn===p?' on':''}${seatOf(p)===0?' dealer':''}" style="--r:${ROT[p]}deg"><b>${WIND_CH[seatOf(p)]}</b>${pl.riichi?'<i class="stick"></i>':''}</div>`;}
  const inds=doraInds();
  h+=`<div class="mid"><b>${roundName()}</b><span>${t('honba',{n:G.honba})} · <i class="stick" title="${t('stat.kyotaku')}"></i>×${G.kyotaku}</span>
    <div class="cdora" title="${t('stat.dora')}">${[0,1,2,3,4].map(i=>i<inds.length?tileT(inds[i]):backHTML()).join('')}</div>
    <span>${t('wallLeft',{n:G.wall.length})}</span></div></div>`;
  $('#square').innerHTML=h;
}
function renderMe(){
  const pl=G.players[0],sw=seatOf(0);
  const w0=pl.hand.length%3===1?waitsOf(0):[],fur=w0.length&&isFuriten(0,w0);
  $('#mebar').classList.toggle('on',G.turn===0);
  $('#mebar').innerHTML=`<span>${t('seat',{w:sw,dealer:sw===0})}</span><span>${t('points')} <b>${pl.score}</b></span>${pl.riichi?`<span class="rtag">${t('riichiOn')}</span>`:''}${fur?`<span class="ftag">${t('furiten')}</span>`:''}`;
  const ids=pl.hand.filter(x=>x!==pl.drawn).sort((a,b)=>a-b);
  if(pl.drawn!=null)ids.push(pl.drawn);
  const dset=new Set(doraInds().map(doraOf));
  let rec=new Set();
  if(S.hint==='full'&&UI.mode==='discard'&&!UI.riichiMode){const rows=ukeireTable(0).filter(r=>!UI.opts.forbid.includes(r.d));if(rows.length){const b=rows[0];rec=new Set(rows.filter(r=>r.s===b.s&&r.n===b.n).map(r=>r.d));}}
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
    if(UI.riichiMode)h+=`<span class="amsg">${t('pickRiichi')}</span><button class="btn ghost" data-act="riichi-cancel" type="button">${t('cancel')}</button>`;
    else{
      h+=`<span class="amsg">${UI.selected!=null?t('tapAgain',{t:TN(tt(UI.selected))}):t('yourTurn',{one:S.oneTap})}</span>`;
      if(UI.selected!=null&&S.hint==='mistakes'){const w=discardWarning(UI.selected);if(w)h+=`<span class="amsg warn">${w}</span>`;}
      if(o.tsumo)h+=`<button class="btn win" data-act="tsumo" type="button">${t('tsumo')}</button>`;
      if(o.riichi.size)h+=`<button class="btn gold" data-act="riichi" type="button">${t('riichi')}</button>`;
      o.kans.forEach((k,i)=>h+=`<button class="btn" data-act="kan:${i}" type="button">${k.kind==='ankan'?t('ankan'):t('kakan')} ${tileT(k.t)}</button>`);
    }
  }else if(UI.mode==='riichiTsumo'){
    const o=UI.opts;
    h=`<span class="amsg">${o.tsumo?t('gotWin'):t('riichiKanOK')}</span>`;
    if(o.tsumo)h+=`<button class="btn win" data-act="tsumo" type="button">${t('tsumo')}</button>`;
    o.kans.forEach((k,i)=>h+=`<button class="btn" data-act="kan:${i}" type="button">${t('ankan')} ${tileT(k.t)}</button>`);
    h+=`<button class="btn ghost" data-act="pass" type="button">${o.tsumo?t('passNoWin'):t('passNoKan')}</button>`;
  }else if(UI.mode==='call'){
    const c=UI.call;
    h=`<span class="amsg">${t('discardedBy',{p:P(c.d)})} ${tileHTML(c.id,'chip')}</span>`;
    if(c.ron)h+=`<button class="btn win" data-act="ron" type="button">${t('ron')}</button>`;
    if(c.pon)h+=`<button class="btn gold" data-act="pon" type="button">${t('pon')}</button>`;
    if(c.kan)h+=`<button class="btn" data-act="kan" type="button">${t('kan')}</button>`;
    c.chis.forEach((p,i)=>h+=`<button class="btn" data-act="chi:${i}" type="button">${t('chi')} ${tileT(p[0])}${tileT(p[1])}</button>`);
    h+=`<button class="btn ghost" data-act="pass" type="button">${t('skip')}</button>`;
  }else if(G.turn>=1){
    h=`<span class="amsg">${t('thinking',{p:P(G.turn)})}</span>`;
  }else if(G.turn===0&&G.players[0].riichi){h=`<span class="amsg">${t('riichiAuto')}</span>`;}
  el.innerHTML=h;
  if(act){const b=el.querySelector(`[data-act="${act}"]`);if(b)b.focus();}
}
function waitLine(x,rem){
  const res=evaluate(ctxFor(0,x*4+3,false,{riichi:G.players[0].riichi,double:G.players[0].doubleRiichi},false));
  const txt=res?t('ronValue',{v:res.yakuman?LBL(res.label):t('han',{n:res.han}),pts:res.ron}):`<span class="noyaku">${isMenzen(G.players[0])?t('noYakuClosed'):t('noYakuOpen')}</span>`;
  return`<div class="wait">${tileT(x,'chip')}<div class="wl">${TN(x)} <small>${t('left',{n:rem})}</small><br>${txt}</div></div>`;
}
// "Only warn on mistakes" mode: a warning while a costly tile is selected, and the last costly discard afterwards.
function discardWarning(id){
  const rows=ukeireTable(0).filter(r=>!UI.opts.forbid.includes(r.d)),j=judgeDiscard(rows,tt(id),[1,2,3].filter(i=>G.players[i].riichi));
  return j.kind==='slow'?t('warnSlow',{n:j.loss}):j.kind==='back'?t('warnBack'):'';
}
function lastMistakeHTML(){
  const r=(G.review||[]).slice(-1)[0];
  if(!r||(r.kind!=='slow'&&r.kind!=='back'))return`<p class="note">${t('mistakesNone')}</p>`;
  const v={t:tt(r.id),s:r.mine.s,n:r.mine.n,b:r.best.d,bs:r.best.s,bn:r.best.n};
  return`<h3>${t('lastMove')}</h3><p class="note">${t(r.kind==='back'?'rv.back':'rv.slow',v)}</p>`;
}
function renderCoach(){
  const body=$('#coachBody'),tag=$('#coachTag');
  if(S.hint==='off'){body.innerHTML=`<p class="note">${t('hintsOff')}</p>`;tag.textContent='';return;}
  if(S.hint==='mistakes'){body.innerHTML=lastMistakeHTML();tag.textContent=t('opt.hintMistakes');return;}
  const pl=G.players[0];let h='';
  if(!pl.hand.length){body.innerHTML='';return;}
  const vis=visibleTo(0);
  if(pl.hand.length%3===2){
    const c=counts(pl.hand);const cur=shanten(c,pl.melds.length);
    let rows=ukeireTable(0);if(UI.opts&&UI.opts.forbid)rows=rows.filter(r=>!UI.opts.forbid.includes(r.d));
    if(UI.riichiMode)rows=rows.filter(r=>UI.opts.riichi.has(r.d));
    tag.textContent=t('tag14');
    h+=`<div class="big${cur<=0?' tenpai':''}">${cur===-1?t('won'):t('now',{s:shName(cur)})}</div>`;
    h+=`<p class="note">${t('sortNote')}</p>`;
    const selT=UI.selected!=null?tt(UI.selected):-1;
    let show=rows.slice(0,5);const sr=rows.find(r=>r.d===selT);if(sr&&!show.includes(sr))show.push(sr);
    h+=show.map((r,i)=>`<div class="crow${i===0?' best':''}${r.d===selT?' sel':''}">${tileT(r.d,'chip')}<div><div class="cl">${t('crow',{t:TN(r.d),s:r.s,kinds:r.tiles.length,n:r.n,best:i===0})}</div><div class="ct">${r.tiles.map(([x,n])=>tileT(x,'xs')+`<span class="cnt">${n}</span>`).join('')}</div></div></div>`).join('');
  }else{
    const c=counts(pl.hand),s=shanten(c,pl.melds.length);
    tag.textContent=t('tag13');
    h+=`<div class="big${s===0?' tenpai':''}">${shName(s)}</div>`;
    if(s===0){
      const w=waitsOf(0),fur=isFuriten(0,w);
      h+=`<p class="note">${fur?`<span class="noyaku">${t('furitenNote')}</span>`:t('tenpaiNote')}</p>`;
      h+=w.map(x=>waitLine(x,4-vis[x])).join('');
    }else{
      const acc=[];let n=0;
      for(let x=0;x<34;x++){const rem=4-vis[x];if(rem<=0)continue;c[x]++;if(shanten(c,pl.melds.length)<s){acc.push([x,rem]);n+=rem;}c[x]--;}
      h+=`<p class="note">${t('advance',{kinds:acc.length,n})}</p><div class="chips">${acc.map(([x,r])=>tileT(x,'xs')+`<span class="cnt" style="font-size:11px;color:var(--muted);align-self:flex-end;margin:0 4px 0 1px">${r}</span>`).join('')}</div>`;
    }
  }
  const threats=[1,2,3].filter(i=>G.players[i].riichi);
  if(threats.length&&!pl.riichi){
    const mine=[...new Set(pl.hand.map(tt))];
    const safe=mine.filter(x=>threats.every(r=>danger(x,r)===0));
    const semi=mine.filter(x=>!safe.includes(x)&&threats.every(r=>danger(x,r)<=3));
    const none=`<span class="note" style="margin:0">${t('none')}</span>`;
    h+=`<div class="safe"><h3>${t('safeHead',{names:threats.map(P)})}</h3>
    <div class="note" style="margin:0 0 4px">${t('genbutsu')}</div><div class="chips">${safe.map(x=>tileT(x,'xs')).join('')||none}</div>
    <div class="note" style="margin:8px 0 4px">${t('semiSafe')}</div><div class="chips">${semi.map(x=>tileT(x,'xs')).join('')||none}</div></div>`;
  }
  body.innerHTML=h;
}
function renderLog(){$('#log').innerHTML=G.log.slice(-12).reverse().map(e=>`<li>${t('log.'+e.k,e.v)}</li>`).join('');}
