// Browser input and start-up: hand and action clicks, settings controls, static page text, then the first game.
// Not loaded by tests or tools/sim.js.
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
bind('optHints','hints',true);bind('optOneTap','oneTap',true);bind('optSkip','autoSkip',true);bind('optSpeed','speed',false);bind('optLen','len',false);bind('optAI','ai',false);bind('optTheme','theme',false);bind('optLang','lang',false);
const aiHint=()=>{$('#aiHint').textContent=L('aiHint')[S.ai]||L('aiHint').normal;};
$('#optAI').addEventListener('change',aiHint);
// Starting over throws the current game away, so ask first once anything has been played.
$('#btnNew').addEventListener('click',()=>{if(G&&G.players.some(p=>p.river.length)&&typeof confirm==='function'&&!confirm(t('confirmNew')))return;newGame();});

// Header buttons show the current language and theme next to their icons.
function updateTools(){
  $('#langCur').textContent=LANG_NAMES[LANG];
  $('#themeCur').textContent=t('opt.'+(['light','dark','classic'].includes(S.theme)?S.theme:'auto'));
}
function renderYakuTable(){
  const desc=L('yakuDesc'),head=L('yakuHead');let i=0;
  $('#yakuTable').innerHTML=`<tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>`+YAKU_REF.map((rows,g)=>`<tr class="grp"><td colspan="3">${L('yakuGroups')[g]}</td></tr>`+
    rows.map(([names,han])=>`<tr><td>${names.split('|').map(YN).join(' / ')}</td><td>${han||t('yakuman')}</td><td>${desc[i++]}</td></tr>`).join('')).join('');
}
// Static page text: elements carry data-i18n (text) or data-i18n-html (markup) keys.
function translatePage(){
  document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n);});
  document.querySelectorAll('[data-i18n-aria]').forEach(e=>{e.setAttribute('aria-label',t(e.dataset.i18nAria));});
  document.querySelectorAll('[data-i18n-title]').forEach(e=>{e.setAttribute('title',t(e.dataset.i18nTitle));});
  updateTools();
  $('#rulesList').innerHTML=L('rules').map(r=>`<li>${r}</li>`).join('');
  renderYakuTable();aiHint();
  const root=document.documentElement;if(!root)return;
  root.lang=LANG;document.title=t('title');
  const meta=(sel,v)=>{const m=document.querySelector(sel);if(m)m.setAttribute('content',v);};
  meta('meta[name=description]',t('desc'));meta('meta[name=apple-mobile-web-app-title]',t('short'));
  const man=document.querySelector('link[rel=manifest]');if(man)man.setAttribute('href',LANG==='zh-CN'?'manifest.webmanifest':`manifest.${LANG}.webmanifest`);
}
$('#optLang').addEventListener('change',()=>{setLang(S.lang);translatePage();render();});
translatePage();

newGame();
