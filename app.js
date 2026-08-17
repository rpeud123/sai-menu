
const DBKEY='sai_v23_db', VISITOR='sai_visitor_name';
let DB=null, currentTab='home';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('ko-KR').format(Number(n||0))+'원';
async function initDB(){
  // V3.4.2 migration: always take structural/config data from the deployed data.json.
  // Keep only user-created content from localStorage so stale menu/custom-builder settings
  // (old mixers, old minimum price, etc.) can never survive a deployment.
  const fresh=await (await fetch('data.json?v=342',{cache:'no-store'})).json();
  let saved=null;
  try{ saved=JSON.parse(localStorage.getItem(DBKEY)||'null'); }catch(_){ saved=null; }
  DB=fresh;
  if(saved){
    // Preserve user content, never preserve pricing/menu/customBuilder configuration.
    for(const key of ['memories','recipes','userMemories','messages','community']){
      if(saved[key]!=null) DB[key]=saved[key];
    }
  }
  // Hard safety rails for YOUR SAI pricing/config.
  DB.customBuilder.minimumPrice=13000;
  DB.customBuilder.pricing={
    ...(DB.customBuilder.pricing||{}),
    baseIncludedOz:2,
    liqueurIncludedOz:2,
    baseExtraPerHalfOz:500,
    ronDiazExtraPerHalfOz:1000,
    liqueurExtraPerHalfOz:1000
  };
  DB.customBuilder.mixers=['토닉','탄산수','오렌지 주스','크랜베리주스','콜라','레몬주스','음료 없음'];
  saveDB();
}
function saveDB(){localStorage.setItem(DBKEY,JSON.stringify(DB))}
function allDrinks(){return [...DB.signatures,...DB.menu]}
function grade(score){return score>=90?'S':score>=80?'A':score>=70?'B':'C'}
function tab(name){
  currentTab=name;
  $$('.page').forEach(x=>x.classList.add('hidden'));
  $('#page-'+name)?.classList.remove('hidden');
  $$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  window.scrollTo({top:0,behavior:'smooth'});if(name==='your')updateCustomSummary();
}
function bindTabs(){$$('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab))}
function setupSplash(){
 const s=$('#splash');if(!s)return;
 const close=()=>{s.style.transition='opacity .65s';s.style.opacity=0;setTimeout(()=>s.remove(),700)};
 $('#skip')?.addEventListener('click',close);setTimeout(close,5900);
}
function renderFeatured(){
 const items=DB.signatures.slice(0,3);
 $('#featured').innerHTML=items.map(cardHTML).join('');
}
function cardHTML(x){
 return `<article class="card menu-card"><div class="eyebrow">${x.category}</div><h3>${x.name}</h3><p>${x.copy}</p><div>${(x.tags||[]).map(t=>`<span class="pill">#${t}</span>`).join('')}</div><div class="row between" style="margin-top:14px"><div><div class="price">${money(x.price)}</div><small class="muted">${x.abv||''}</small></div><div class="row"><span class="grade">${grade(x.score)}</span><strong>${x.score}</strong></div></div><button class="btn ghost order-btn" data-id="${x.id}" style="margin-top:12px">이 술의 이전 글귀 보기</button></article>`;
}
function renderMenu(cat='전체'){
 const cats=['전체',...new Set(allDrinks().map(x=>x.category))];
 $('#filters').innerHTML=cats.map(c=>`<button class="btn ${c===cat?'primary':''}" data-cat="${c}">${c}</button>`).join('');
 const items=cat==='전체'?allDrinks():allDrinks().filter(x=>x.category===cat);
 $('#menuGrid').innerHTML=items.map(cardHTML).join('');
 $('#filters').onclick=e=>{if(e.target.dataset.cat)renderMenu(e.target.dataset.cat)};
 bindOrderButtons();
}
function bindOrderButtons(){
 $$('.order-btn').forEach(b=>b.onclick=()=>openMessageChain(b.dataset.id));
}
function openMessageChain(id){
 const drink=allDrinks().find(x=>x.id===id);const list=DB.messages[id]||[];
 $('#chainDrink').textContent=drink.name;
 $('#previousMessage').textContent=list.at(-1)||'아직 이 술에 남겨진 첫 글이 없습니다. 당신이 첫 문장을 남겨주세요.';
 $('#chainDrinkId').value=id;
 $('#messageModal').classList.remove('hidden');
}
function closeModal(){ $('#messageModal').classList.add('hidden') }
function saveNextMessage(){
 const id=$('#chainDrinkId').value,msg=$('#nextMessage').value.trim();if(!msg)return alert('다음 사람에게 남길 글을 적어주세요.');
 DB.messages[id]??=[];DB.messages[id].push(msg);DB.userMemories.push(msg);saveDB();$('#nextMessage').value='';closeModal();alert('다음 손님에게 이어질 글귀가 저장되었습니다.');
}
function recommend(){
 const budget=+$('select[name=budget]').value,strength=$('select[name=strength]').value,taste=$('select[name=taste]').value,mood=$('select[name=mood]').value;
 let arr=allDrinks().filter(x=>x.price<=budget).map(x=>{let r=x.score;const tx=(x.copy+' '+(x.tags||[]).join(' '));if(strength==='none'&&(x.abv==='논알콜'||x.category==='논알콜'))r+=30;if(strength==='high'&&(/30|50|60|높음/.test(x.abv)))r+=20;if(strength==='low'&&(/가벼움|6~8/.test(x.abv)))r+=17;if(tx.includes(taste))r+=18;if(tx.includes(mood))r+=14;return {...x,rank:r}}).sort((a,b)=>b.rank-a.rank).slice(0,3);
 $('#recommendResult').innerHTML=`<div class="notice">오늘의 마음을 기준으로 사장님이 고르듯 추천했어요.</div><div class="grid" style="margin-top:14px">${arr.map(cardHTML).join('')}</div>`;bindOrderButtons();
}
function renderMemories(){
 const list=[...DB.memories].sort((a,b)=>b.date.localeCompare(a.date));
 $('#memoryFeed').innerHTML=list.map(m=>`<article class="feed-post"><img src="${m.image}" alt=""><div class="feed-body"><div class="row between"><strong>${m.pick?'✨ SAI PICK · ':''}${m.author}</strong><small class="muted">${m.date}</small></div><p>${m.text}</p><div>${m.tags.map(t=>`<span class="pill">#${t}</span>`).join('')}</div><div class="row" style="margin-top:12px"><button class="btn like" data-id="${m.id}">♡ ${m.likes}</button><button class="btn comment-open" data-id="${m.id}">댓글 ${m.comments.length}</button></div><div class="comments">${m.comments.map(c=>`<p class="muted">— ${c}</p>`).join('')}</div></div></article>`).join('');
 $$('.like').forEach(b=>b.onclick=()=>{const m=DB.memories.find(x=>x.id===b.dataset.id);m.likes++;saveDB();renderMemories()});
 $$('.comment-open').forEach(b=>b.onclick=()=>{const c=prompt('이 추억에 남길 댓글');if(c){DB.memories.find(x=>x.id===b.dataset.id).comments.push(c);saveDB();renderMemories()}});
}
function verifyVisit(){
 sessionStorage.setItem('sai_verified','1');$('#verifyState').textContent='방문 인증 완료 ✓';$('#memoryUpload').disabled=false;
}
function uploadMemory(){
 if(sessionStorage.getItem('sai_verified')!=='1')return alert('먼저 매장 QR 방문 인증을 완료해주세요.');
 const f=$('#memoryImage').files[0],text=$('#memoryText').value.trim(),author=$('#memoryAuthor').value.trim()||'익명의 손님';
 if(!f||!text)return alert('사진과 한줄 기억을 입력해주세요.');
 const r=new FileReader();r.onload=()=>{DB.memories.unshift({id:'m'+Date.now(),image:r.result,author,text,date:new Date().toISOString().slice(0,10),likes:0,comments:[],tags:['손님의기록'],pick:false});saveDB();renderMemories();$('#memoryText').value='';alert('사이의 추억에 기록되었습니다.');};r.readAsDataURL(f);
}
function createRecipe(){
 const name=$('#recipeName').value.trim(),creator=$('#recipeCreator').value.trim()||'익명의 손님',base=$('#recipeBase').value,taste=$('#recipeTaste').value,mood=$('#recipeMood').value,note=$('#recipeNote').value.trim();
 if(!name||!note)return alert('칵테일 이름과 이야기를 입력해주세요.');
 DB.recipes.push({id:'r'+Date.now(),name,creator,base,taste,mood,note,likes:0,uses:0,month:new Date().toISOString().slice(0,7)});saveDB();renderRecipes();alert('당신의 사이 레시피가 공유되었습니다.');
}
function renderRecipes(){
 const arr=[...DB.recipes].sort((a,b)=>(b.likes+b.uses)-(a.likes+a.uses));
 $('#recipeRanking').innerHTML=arr.map((r,i)=>`<article class="card wide"><div class="eyebrow">${i===0?'이달의 칵테일 후보 1위':'당신의 사이'}</div><h3>${r.name}</h3><p>${r.note}</p><div><span class="pill">${r.base}</span><span class="pill">${r.taste}</span><span class="pill">${r.mood}</span></div><p class="muted">by ${r.creator}</p><div class="row"><button class="btn recipe-like" data-id="${r.id}">♡ 공감 ${r.likes}</button><button class="btn recipe-use" data-id="${r.id}">이 레시피 선택 ${r.uses}</button></div></article>`).join('');
 $$('.recipe-like').forEach(b=>b.onclick=()=>{DB.recipes.find(x=>x.id===b.dataset.id).likes++;saveDB();renderRecipes()});
 $$('.recipe-use').forEach(b=>b.onclick=()=>{DB.recipes.find(x=>x.id===b.dataset.id).uses++;saveDB();renderRecipes();alert('이 레시피를 선택했습니다. 선택 수가 집계됩니다.')});
}
function showOldMemory(){
 const arr=DB.userMemories||[];$('#oldMemoryText').textContent=arr.length?arr[Math.floor(Math.random()*arr.length)]:'아직 사이에 남긴 글귀가 없습니다. 오늘 첫 문장을 남겨보세요.';
}

let builderStep=1;
let customState={bases:{},liqueurs:{},mixer:null,flavors:[],aromas:[],glass:null,ice:null,garnish:null};
const OZML=29.5735;
function ingredientRows(items,type){return items.map((x,i)=>`<div class="ingredient-row"><div><strong>${x.name}</strong><small>${x.abv}%</small></div><div class="oz-buttons">${DB.customBuilder.ozOptions.map(o=>`<button data-ing-type="${type}" data-index="${i}" data-oz="${o}">${o}oz</button>`).join('')}<button data-ing-type="${type}" data-index="${i}" data-oz="0">빼기</button></div></div>`).join('')}
function simpleChoices(id,items,type,multi=false){$(id).innerHTML=items.map((x,i)=>{let name=x.name||x;return `<button class="choice" data-simple-type="${type}" data-index="${i}" data-multi="${multi}"><strong>${name}</strong></button>`}).join('')}
function initCustomBuilder(){
 const c=DB.customBuilder;
 $('#baseChoices').innerHTML=ingredientRows(c.bases,'bases'); $('#liqueurChoices').innerHTML=ingredientRows(c.liqueurs,'liqueurs');
 simpleChoices('#mixerChoices',c.mixers,'mixer'); simpleChoices('#flavorChoices',c.flavors,'flavors',true); simpleChoices('#aromaChoices',c.aromas,'aromas',true); simpleChoices('#glassChoices',c.glasses,'glass'); simpleChoices('#iceChoices',c.ices,'ice'); simpleChoices('#garnishChoices',c.garnishes,'garnish');
 $$('[data-ing-type]').forEach(b=>b.onclick=()=>setIngredient(b)); $$('[data-simple-type]').forEach(b=>b.onclick=()=>setSimple(b));
 $$('.builder-step').forEach(b=>b.onclick=()=>goBuilderStep(+b.dataset.builderStep)); $('#builderPrev').onclick=()=>goBuilderStep(Math.max(1,builderStep-1)); $('#builderNext').onclick=()=>builderStep<9?goBuilderStep(builderStep+1):finishBuilder();
 $('#customName').oninput=e=>$('#customPreviewName').textContent=e.target.value.trim()||'당신의 사이'; $('#randomRecommend').onclick=randomOwnerRecommend; $('#saveCustomSignature').onclick=saveCustomRecipe;
 goBuilderStep(1); updateCustomSummary();
}
function setIngredient(btn){const type=btn.dataset.ingType,i=+btn.dataset.index,oz=+btn.dataset.oz,item=DB.customBuilder[type][i]; if(oz===0)delete customState[type][item.name];else customState[type][item.name]={...item,oz}; $$(`[data-ing-type="${type}"][data-index="${i}"]`).forEach(x=>x.classList.toggle('selected',+x.dataset.oz===oz&&oz>0));updateCustomSummary()}
function setSimple(btn){const type=btn.dataset.simpleType,i=+btn.dataset.index,multi=btn.dataset.multi==='true',arr=DB.customBuilder[type]||[];let val=arr[i]; if(multi){let name=val.name||val,at=customState[type].indexOf(name);if(at>=0)customState[type].splice(at,1);else customState[type].push(name);btn.classList.toggle('selected',at<0)}else{$$(`[data-simple-type="${type}"]`).forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');customState[type]=val}updateCustomSummary()}
function goBuilderStep(n){builderStep=n;$$('.builder-screen').forEach(x=>x.classList.toggle('hidden',+x.dataset.screen!==n));$$('.builder-step').forEach(x=>x.classList.toggle('active',+x.dataset.builderStep===n));$('#builderPrev').disabled=n===1;$('#builderNext').textContent=n===9?'AI 사장 분석 완료':'다음'}
function chosen(type){return Object.values(customState[type])}
function estimateCustom(){
 const bases=chosen('bases'),liqs=chosen('liqueurs'),glass=customState.glass||DB.customBuilder.glasses[0],ice=customState.ice||DB.customBuilder.ices[0];
 const alcoholMl=[...bases,...liqs].reduce((s,x)=>s+x.oz*OZML*x.abv/100,0), spiritMl=[...bases,...liqs].reduce((s,x)=>s+x.oz*OZML,0), usable=Math.max(60,glass.capacity-ice.space), mixerMl=Math.max(0,usable-spiritMl), finalMl=usable*(1+ice.dilution), abv=finalMl?alcoholMl/finalMl*100:0;
 const cost=[...bases,...liqs].reduce((s,x)=>s+x.costPerOz*x.oz,0)+Math.max(250,mixerMl*3)+300; const price=Math.max(15000,Math.ceil((cost/.20)/1000)*1000);
 let score=100,baseOz=bases.reduce((s,x)=>s+x.oz,0),liqOz=liqs.reduce((s,x)=>s+x.oz,0); score-=Math.min(30,Math.abs(baseOz-2)*12); if(liqOz<1)score-=Math.min(18,(1-liqOz)*18);if(liqOz>2)score-=Math.min(25,(liqOz-2)*15);if(spiritMl>usable)score-=35;if(!customState.mixer)score-=8;if(!customState.glass)score-=5;if(!customState.ice)score-=3;if(customState.flavors.length===0)score-=5;score=Math.max(0,Math.min(100,Math.round(score)));
 let recommended= spiritMl>200?'롱드링크':abv>25?'온더락':customState.mixer==='탄산수'||customState.mixer==='토닉워터'?'하이볼':abv<15?'롱드링크':'쿠페';
 return {bases,liqs,glass,ice,baseOz,liqOz,spiritMl,mixerMl,abv,cost,price,score,recommended,overflow:spiritMl>usable};
}
function listText(xs){return xs.length?xs.map(x=>`${x.name} ${x.oz}oz`).join(', '):'선택 전'}
function updateCustomSummary(){if(!DB?.customBuilder)return;const e=estimateCustom();$('#summaryBase').textContent=listText(e.bases);$('#summaryLiqueur').textContent=listText(e.liqs);$('#summaryMixer').textContent=customState.mixer?`${customState.mixer} 약 ${Math.round(e.mixerMl)}ml`:'선택 전';$('#summaryAbv').textContent=e.spiritMl?`약 ${e.abv.toFixed(1)}%`:'-';$('#summaryFlavor').textContent=customState.flavors.join(' · ')||'-';$('#summaryColor').textContent=estimateColor(e);$('#summaryGlass').textContent=e.recommended;$('#summaryPrice').textContent=money(e.price);$('#balanceScore').textContent=`${e.score} / 100`;$('#balanceBar').style.width=e.score+'%';$('#balanceLabel').textContent=e.score>=90?'사이 추천 조합':e.score>=70?'개성이 강한 조합':'호불호가 큰 조합';$('#aiTasteReview').textContent=aiReview(e);$('#ownerRecommendation').textContent=ownerText(e);let hue=e.score>=90?'#bd6e2d':e.score>=70?'#78562b':'#672743';$('#orbCore').style.background=`radial-gradient(circle at 35% 30%,#ffd987,${hue} 58%,#211018)`;let w=$('#glassWarning');if(e.overflow){w.classList.remove('hidden');w.textContent=`⚠️ 선택한 ${e.glass.name} 잔의 권장 용량을 초과했습니다. 롱드링크 잔으로 변경하는 것을 추천합니다.`}else w.classList.add('hidden')}
function estimateColor(e){let colors=[...e.bases,...e.liqs].map(x=>x.color).filter(x=>x&&x!=='투명');if(customState.mixer?.includes('크랜베리'))return'루비핑크';if(customState.mixer?.includes('오렌지'))return'오렌지';if(customState.mixer?.includes('자몽'))return'핑크 자몽';if(customState.mixer==='콜라')return'짙은 갈색';if(customState.mixer==='우유')return'크림색';return colors.at(-1)||'투명'}
function aiReview(e){if(!e.bases.length)return'기주부터 선택하면 AI 사장이 맛과 균형을 분석해드릴게요.';let out=[];if(e.baseOz>3)out.push('기주의 총량이 권장량보다 많아 도수가 강하고 무겁게 느껴질 수 있습니다.');else if(e.baseOz>=1.5&&e.baseOz<=2.5)out.push('기주의 양이 안정적인 범위에 있습니다.');if(e.liqOz>2)out.push('리큐르가 많아 단맛과 향이 기주를 덮을 수 있습니다.');else if(e.liqOz>=1)out.push('리큐르 비율도 균형이 좋습니다.');if(e.overflow)out.push('현재 잔에는 재료가 모두 담기 어려우니 더 큰 잔을 추천합니다.');if(customState.flavors.length)out.push(`${customState.flavors.join('·')} 중심의 개성이 예상됩니다.`);return out.join(' ')||'재료를 조금 더 선택하면 자세한 총평을 보여드릴게요.'}
function ownerText(e){if(e.score>=90)return'비율이 안정적입니다. 지금 조합 그대로 완성해도 좋아요.';if(e.baseOz>2.5)return'기주를 0.5~1oz 줄이면 향과 음료의 균형이 더 좋아집니다.';if(e.liqOz>2)return'리큐르 한 가지를 0.5oz 줄여보세요.';if(!customState.mixer)return'음료를 선택하면 잔의 남은 양을 자동으로 채워드릴게요.';return`${e.recommended} 잔에 담으면 현재 조합의 장점이 잘 살아납니다.`}
function randomOwnerRecommend(){customState={bases:{보드카:{...DB.customBuilder.bases.find(x=>x.name==='보드카'),oz:1.5}},liqueurs:{피치트리:{...DB.customBuilder.liqueurs.find(x=>x.name==='피치트리'),oz:1}},mixer:'파인애플주스',flavors:['상큼','과일'],aromas:['과일향'],glass:DB.customBuilder.glasses.find(x=>x.name==='하이볼'),ice:DB.customBuilder.ices.find(x=>x.name==='큰 얼음'),garnish:'레몬'};initCustomBuilderSelection();updateCustomSummary()}
function initCustomBuilderSelection(){$$('[data-ing-type]').forEach(b=>{let item=DB.customBuilder[b.dataset.ingType][+b.dataset.index],sel=customState[b.dataset.ingType][item.name];b.classList.toggle('selected',!!sel&&+b.dataset.oz===sel.oz)});$$('[data-simple-type]').forEach(b=>{let type=b.dataset.simpleType,val=DB.customBuilder[type][+b.dataset.index],name=val.name||val,sel=Array.isArray(customState[type])?customState[type].includes(name):(customState[type]?.name||customState[type])===name;b.classList.toggle('selected',sel)})}
function finishBuilder(){const e=estimateCustom();if(!e.bases.length)return alert('기주를 한 가지 이상 선택해주세요.');if(!customState.mixer)return alert('음료를 선택해주세요.');if(!customState.glass)return alert('잔을 선택해주세요.');updateCustomSummary();$('#saveCustomSignature').classList.remove('hidden');$('#saveCustomSignature').scrollIntoView({behavior:'smooth',block:'center'})}
function saveCustomRecipe(){const e=estimateCustom(),name=$('#customName').value.trim()||'이름 없는 당신의 사이',story=$('#customStory').value.trim()||'오늘의 마음을 담아 만든 한 잔';DB.recipes.push({id:'r'+Date.now(),name,creator:localStorage.getItem(VISITOR)||'익명의 손님',base:e.bases.map(x=>x.name).join(' + '),taste:customState.flavors.join(' · ')||'커스텀',mood:e.score>=90?'SAI APPROVED 후보':'개성 있는 조합',note:story,likes:0,uses:0,month:new Date().toISOString().slice(0,7),price:e.price,abv:+e.abv.toFixed(1),liqueur:e.liqs.map(x=>x.name).join(' + '),estimatedCost:Math.round(e.cost),balanceScore:e.score,glass:e.glass.name,mixer:customState.mixer,approved:false});saveDB();renderRecipes();alert('당신의 사이 레시피가 저장되고 공유되었습니다.')}

document.addEventListener('DOMContentLoaded',async()=>{await initDB();setupSplash();bindTabs();renderFeatured();renderMenu();renderMemories();renderRecipes();showOldMemory();initCustomBuilder();$('#recommendBtn').onclick=recommend;$('#closeModal').onclick=closeModal;$('#saveNextMessage').onclick=saveNextMessage;$('#verifyVisit').onclick=verifyVisit;$('#memoryUpload').onclick=uploadMemory;$('#createRecipe')&&($('#createRecipe').onclick=createRecipe);bindOrderButtons()});

// ===== V2.4 overrides =====
function v24Drawer(open){
  document.querySelector('#sideDrawer')?.classList.toggle('open',open);
  document.querySelector('#drawerDim')?.classList.toggle('open',open);
  document.body.classList.toggle('drawer-open',open);
}
function v24BindDrawer(){
  $('#menuToggle')?.addEventListener('click',()=>v24Drawer(true));
  $('#drawerClose')?.addEventListener('click',()=>v24Drawer(false));
  $('#drawerDim')?.addEventListener('click',()=>v24Drawer(false));
  $$('#sideDrawer [data-tab]').forEach(b=>b.addEventListener('click',()=>v24Drawer(false)));
}
const oldCardHTML=cardHTML;
cardHTML=function(x){
  if(x.name==='당신의 사이') return `<article class="card menu-card your-direct" data-tab="your"><div class="eyebrow">SIGNATURE · CUSTOM</div><h3>${x.name}</h3><p>${x.copy||'당신이 직접 완성하는 한 잔'}</p><div class="row between" style="margin-top:14px"><div class="price">13,000원</div><span class="pill">바로 만들기 →</span></div></article>`;
  const bottle=x.bottlePrice?`<small class="muted">Bottle ${money(x.bottlePrice)}</small>`:'';
  return `<article class="card menu-card"><div class="eyebrow">${x.category}</div><h3>${x.name}</h3><p>${x.copy||''}</p><div>${(x.tags||[]).map(t=>`<span class="pill">#${t}</span>`).join('')}</div><div class="row between" style="margin-top:14px"><div><div class="price">${money(x.price)}</div>${bottle}</div><div class="row"><span class="grade">${grade(x.score||80)}</span><strong>${x.score||80}</strong></div></div><button class="btn ghost order-btn" data-id="${x.id}" style="margin-top:12px">이 술의 이전 글귀 보기</button></article>`;
}
const oldBindTabs=bindTabs;
bindTabs=function(){
 oldBindTabs();
 $$('.your-direct').forEach(el=>el.onclick=()=>tab('your'));
}
const oldRenderFeatured=renderFeatured;
renderFeatured=function(){oldRenderFeatured();$$('.your-direct').forEach(el=>el.onclick=()=>tab('your'))}
const oldRenderMenu=renderMenu;
renderMenu=function(cat='전체'){
 const whiskeyCats=['피트','셰리','스카치 싱글몰트','스카치 블렌디드','버번','아이리시','재패니즈','브랜디·꼬냑','데킬라'];
 const cats=['전체','시그니처','칵테일','하이볼','논알콜','위스키·브랜디'];
 $('#filters').innerHTML=cats.map(c=>`<button class="btn ${c===cat?'primary':''}" data-cat="${c}">${c}</button>`).join('');
 let items;
 if(cat==='전체') items=allDrinks();
 else if(cat==='위스키·브랜디') items=allDrinks().filter(x=>whiskeyCats.includes(x.category));
 else items=allDrinks().filter(x=>x.category===cat || (cat==='시그니처'&&DB.signatures.includes(x)));
 if(cat==='위스키·브랜디'){
   $('#menuGrid').innerHTML=whiskeyCats.map((wc,i)=>{const arr=items.filter(x=>x.category===wc);if(!arr.length)return'';return `<section class="whiskey-group card full"><button class="whiskey-head" data-wgroup="${i}"><span>${wc}</span><span>${arr.length}종 ＋</span></button><div class="whiskey-body ${i===0?'':'hidden'}">${arr.map(cardHTML).join('')}</div></section>`}).join('');
   $$('.whiskey-head').forEach(b=>b.onclick=()=>{const body=b.nextElementSibling;$$('.whiskey-body').forEach(x=>{if(x!==body)x.classList.add('hidden')});body.classList.toggle('hidden')});
 } else $('#menuGrid').innerHTML=items.map(cardHTML).join('');
 $('#filters').onclick=e=>{if(e.target.dataset.cat)renderMenu(e.target.dataset.cat)};
 bindOrderButtons();$$('.your-direct').forEach(el=>el.onclick=()=>tab('your'));
}
function v24BaseExtra(item,oz){ return 0; }
const oldEstimateCustom=estimateCustom;
estimateCustom=function(){
 const e=oldEstimateCustom();
 const pricing=DB.customBuilder.pricing||{};
 const baseIncluded=Number(pricing.baseIncludedOz??2);
 const liqIncluded=Number(pricing.liqueurIncludedOz??2);
 const hasRonDiaz=e.bases.some(x=>String(x.name||'').replace(/\s+/g,'').includes('론디아즈'));
 const baseStep=hasRonDiaz?Number(pricing.ronDiazExtraPerHalfOz??1000):Number(pricing.baseExtraPerHalfOz??500);
 const liqStep=Number(pricing.liqueurExtraPerHalfOz??1000);
 const baseOz=e.bases.reduce((s,x)=>s+x.oz,0);
 const liqOz=e.liqs.reduce((s,x)=>s+x.oz,0);
 const baseOver=Math.max(0,baseOz-baseIncluded);
 const liqOver=Math.max(0,liqOz-liqIncluded);
 const baseExtra=Math.ceil(baseOver/0.5)*baseStep;
 const liqExtra=Math.ceil(liqOver/0.5)*liqStep;
 e.price=Math.max(13000,13000+baseExtra+liqExtra);
 e.baseExtra=baseExtra;
 e.liqueurExtra=liqExtra;
 e.baseIncluded=baseIncluded;
 e.liqueurIncluded=liqIncluded;
 return e;
}
const oldUpdateCustomSummary=updateCustomSummary;
updateCustomSummary=function(){
 oldUpdateCustomSummary();
 const e=estimateCustom();
 $('#summaryPrice').textContent=money(e.price);
 const baseTotal=e.baseOz;
 let hint=document.querySelector('#baseProgressHint');
 if(!hint){hint=document.createElement('div');hint.id='baseProgressHint';hint.className='base-progress-hint';document.querySelector('[data-screen="1"] h2')?.after(hint)}
 const liqTotal=e.liqOz;
 hint.innerHTML=`<div class="row between"><strong>기주 ${baseTotal.toFixed(1)} / ${e.baseIncluded.toFixed(1)}oz</strong><span>${baseTotal>=e.baseIncluded?'기본 포함량 완료 ✓':'기본가격 포함'}</span></div><div class="base-progress"><i style="width:${Math.min(100,baseTotal/e.baseIncluded*100)}%"></i></div><p>기주 ${e.baseIncluded}oz + 리큐르 ${e.liqueurIncluded}oz + 원하는 음료까지 13,000원입니다. 초과분은 0.5oz 단위로 추가요금이 적용됩니다.</p>`;
}
const oldSetIngredient=setIngredient;
setIngredient=function(btn){
 oldSetIngredient(btn);
 if(btn.dataset.ingType==='bases'){
   const total=chosen('bases').reduce((s,x)=>s+x.oz,0);
   if(total>=2 && builderStep===1){
     setTimeout(()=>{if(confirm('기주 기본 포함량 2oz가 완성되었습니다. 리큐르 단계로 넘어갈까요?'))goBuilderStep(2)},80);
   }
 }
}
function renderCommunity(filter='전체'){
 const cats=['전체','추가됐으면 하는 위스키','추가됐으면 하는 칵테일','불편했던 점','개선 제안','궁금한 점','좋았던 점','자유 이야기'];
 $('#communityTabs').innerHTML=cats.map(c=>`<button class="btn ${filter===c?'primary':''}" data-community-cat="${c}">${c}</button>`).join('');
 const posts=(DB.community||[]).filter(p=>filter==='전체'||p.category===filter).sort((a,b)=>b.date.localeCompare(a.date));
 $('#communityList').innerHTML=posts.map(p=>`<article class="card full community-post"><div class="row between"><span class="pill">${p.category}</span><small class="muted">${p.date}</small></div><h3>${p.title}</h3><p>${p.content}</p><p class="muted">by ${p.author} · 조회 ${p.views||0}</p>${p.ownerReply?`<div class="owner-reply"><strong>${p.status==='반영 완료'?'✓ 반영 완료':'SAI 답변'}</strong><p>${p.ownerReply}</p></div>`:''}<div class="row"><button class="btn community-like" data-id="${p.id}">♡ 공감 ${p.likes||0}</button><button class="btn community-comment" data-id="${p.id}">댓글 ${(p.comments||[]).length}</button><button class="btn community-share" data-id="${p.id}">공유</button></div><div class="comments">${(p.comments||[]).map(c=>`<p class="muted">— ${c}</p>`).join('')}</div></article>`).join('')||'<div class="notice">아직 등록된 글이 없습니다.</div>';
 $$('[data-community-cat]').forEach(b=>b.onclick=()=>renderCommunity(b.dataset.communityCat));
 $$('.community-like').forEach(b=>b.onclick=()=>{const p=DB.community.find(x=>x.id===b.dataset.id);p.likes=(p.likes||0)+1;saveDB();renderCommunity(filter)});
 $$('.community-comment').forEach(b=>b.onclick=()=>{const c=prompt('댓글을 입력해주세요.');if(c){const p=DB.community.find(x=>x.id===b.dataset.id);p.comments??=[];p.comments.push(c);saveDB();renderCommunity(filter)}});
 $$('.community-share').forEach(b=>b.onclick=async()=>{const p=DB.community.find(x=>x.id===b.dataset.id);const text=`[사이 커뮤니티] ${p.title}\n${p.content}`;try{await navigator.share({title:p.title,text})}catch{navigator.clipboard?.writeText(text);alert('게시글 내용이 복사되었습니다.')}})
}
function submitCommunity(){
 const title=$('#communityTitle').value.trim(),content=$('#communityContent').value.trim();if(!title||!content)return alert('제목과 내용을 입력해주세요.');
 DB.community??=[];DB.community.push({id:'c'+Date.now(),category:$('#communityCategory').value,title,content,author:$('#communityAuthor').value.trim()||'익명의 손님',date:new Date().toISOString().slice(0,10),likes:0,views:1,comments:[],ownerReply:'',status:''});saveDB();$('#communityTitle').value='';$('#communityContent').value='';renderCommunity();alert('커뮤니티에 게시되었습니다.');
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
 v24BindDrawer();renderCommunity();$('#communitySubmit')&&($('#communitySubmit').onclick=submitCommunity);
 // replace old stored v23 structure with v24 defaults once
 if(!localStorage.getItem('sai_v24_migrated')){localStorage.removeItem('sai_v23_db');localStorage.setItem('sai_v24_migrated','1');location.reload()}
},0));


// ===== V2.5 engagement & usability upgrade =====
let v25MenuQuery='', v25MenuMood='', v25MemoryView='feed', v25MemoryTag='전체', v25CommunitySort='recent';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const catIcon=c=>({'추가됐으면 하는 위스키':'🥃','추가됐으면 하는 칵테일':'🍸','불편했던 점':'🪑','개선 제안':'💡','궁금한 점':'🙋','좋았던 점':'💛','자유 이야기':'💬'}[c]||'💬');

function v25OpenSheet(id, open){
 const el=$(id); if(!el)return;
 el.classList.toggle('hidden',!open); document.body.classList.toggle('sheet-open',open);
}
function v25ImagePreview(input, target){
 const file=input?.files?.[0], box=$(target); if(!box)return;
 if(!file){box.classList.add('hidden');box.innerHTML='';return}
 const r=new FileReader(); r.onload=()=>{box.innerHTML=`<img src="${r.result}" alt="미리보기"><button type="button" class="preview-remove">사진 지우기</button>`;box.classList.remove('hidden');box.querySelector('button').onclick=()=>{input.value='';box.classList.add('hidden');box.innerHTML=''}};r.readAsDataURL(file);
}
function renderHomeTrending(){
 const recipes=[...(DB.recipes||[])].sort((a,b)=>(b.likes+b.uses)-(a.likes+a.uses)).slice(0,2);
 const posts=[...(DB.community||[])].sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,1);
 const memories=[...(DB.memories||[])].sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,1);
 const cards=[
  ...recipes.map(r=>({type:'당신의 사이',title:r.name,meta:`공감 ${r.likes} · 선택 ${r.uses}`,tab:'your',emoji:'🍸'})),
  ...posts.map(p=>({type:p.category,title:p.title,meta:`공감 ${p.likes||0} · 댓글 ${(p.comments||[]).length}`,tab:'community',emoji:catIcon(p.category)})),
  ...memories.map(m=>({type:m.pick?'SAI PICK':'사이의 추억',title:m.text,meta:`♡ ${m.likes}`,tab:'memories',image:m.image}))
 ].slice(0,4);
 $('#homeTrending').innerHTML=cards.map(c=>`<button class="trend-card" data-tab="${c.tab}">${c.image?`<img src="${c.image}" alt="">`:`<span class="trend-emoji">${c.emoji}</span>`}<span><small>${esc(c.type)}</small><strong>${esc(c.title)}</strong><em>${esc(c.meta)}</em></span></button>`).join('');
 bindTabs();
}

const v24RenderMenu = renderMenu;
renderMenu=function(cat='전체'){
 const whiskeyCats=['피트','셰리','스카치 싱글몰트','스카치 블렌디드','버번','아이리시','재패니즈','브랜디·꼬냑','데킬라'];
 const cats=['전체','시그니처','칵테일','하이볼','논알콜','위스키·브랜디'];
 $('#filters').innerHTML=cats.map(c=>`<button class="btn ${c===cat?'primary':''}" data-cat="${c}">${c}</button>`).join('');
 let items=cat==='전체'?allDrinks():cat==='위스키·브랜디'?allDrinks().filter(x=>whiskeyCats.includes(x.category)):allDrinks().filter(x=>x.category===cat||(cat==='시그니처'&&DB.signatures.includes(x)));
 const norm=s=>String(s??'').toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu,'');
 const fuzzy2=(query,text)=>{
   const q=norm(query), t=norm(text);
   if(!q)return true;
   if(t.includes(q))return true;
   if(q.length===1)return t.includes(q);
   for(let i=0;i<q.length-1;i++){ if(t.includes(q.slice(i,i+2))) return true; }
   return false;
 };
 const q=v25MenuQuery.trim();
 if(q)items=items.filter(x=>fuzzy2(q, x.name+' '+(x.copy||'')+' '+x.abv+' '+(x.tags||[]).join(' ')));
 if(v25MenuMood)items=items.filter(x=>(x.name+' '+x.copy+' '+x.abv+' '+(x.tags||[]).join(' ')).includes(v25MenuMood));
 const popular=[...allDrinks()].sort((a,b)=>(b.score||0)-(a.score||0))[0];
 $('#menuSpotlight').innerHTML=popular?`<div class="spotlight-copy"><small>지금 가장 추천하는 한 잔</small><strong>${esc(popular.name)}</strong><p>${esc(popular.copy)}</p><button class="btn primary order-btn" data-id="${popular.id}">이 술의 이야기 보기</button></div><div class="spotlight-glass"><i></i></div>`:'';
 if(cat==='위스키·브랜디'&&!q&&!v25MenuMood){
   $('#menuGrid').innerHTML=whiskeyCats.map((wc,i)=>{const arr=items.filter(x=>x.category===wc);if(!arr.length)return'';return `<section class="whiskey-group card full"><button class="whiskey-head" data-wgroup="${i}"><span><small>${arr.length}종</small>${wc}</span><span>펼치기 ＋</span></button><div class="whiskey-body ${i===0?'':'hidden'}">${arr.map(cardHTML).join('')}</div></section>`}).join('');
   $$('.whiskey-head').forEach(b=>b.onclick=()=>{const body=b.nextElementSibling;body.classList.toggle('hidden');b.querySelector('span:last-child').textContent=body.classList.contains('hidden')?'펼치기 ＋':'접기 −'});
 }else{
   $('#menuGrid').innerHTML=items.length?items.map(cardHTML).join(''):'<div class="empty-state card full"><span>🥃</span><h3>조건에 맞는 메뉴가 없어요.</h3><p class="muted">검색어나 맛 필터를 바꿔보세요.</p></div>';
 }
 $('#filters').onclick=e=>{if(e.target.dataset.cat)renderMenu(e.target.dataset.cat)};
 bindOrderButtons();$$('.your-direct').forEach(el=>el.onclick=()=>tab('your'));
}
function v25BindMenu(){
 $('#menuSearch')?.addEventListener('input',e=>{v25MenuQuery=e.target.value;renderMenu('전체')});
 $$('[data-menu-mood]').forEach(b=>b.onclick=()=>{v25MenuMood=v25MenuMood===b.dataset.menuMood?'':b.dataset.menuMood;$$('[data-menu-mood]').forEach(x=>x.classList.toggle('active',x.dataset.menuMood===v25MenuMood));renderMenu('전체')});
 $('#menuRandom')?.addEventListener('click',()=>{const x=allDrinks()[Math.floor(Math.random()*allDrinks().length)];$('#menuSpotlight').innerHTML=`<div class="spotlight-copy"><small>오늘의 랜덤 한 잔</small><strong>${esc(x.name)}</strong><p>${esc(x.copy)}</p><button class="btn primary order-btn" data-id="${x.id}">이 술의 이야기 보기</button></div><div class="spotlight-glass random"><i></i></div>`;bindOrderButtons();$('#menuSpotlight').scrollIntoView({behavior:'smooth',block:'center'})});
}

function communityCard(p){
 return `<article class="community-card" data-post="${p.id}">
   ${p.image?`<img class="community-photo" src="${p.image}" alt="">`:''}
   <div class="community-card-body">
    <div class="row between"><span class="category-badge">${catIcon(p.category)} ${esc(p.category)}</span><small class="muted">${esc(p.date)}</small></div>
    <h3>${esc(p.title)}</h3><p>${esc(p.content)}</p>
    <div class="post-author"><span class="avatar">${esc((p.author||'익').slice(0,1))}</span><span><strong>${esc(p.author||'익명의 손님')}</strong><small>조회 ${p.views||0}</small></span></div>
    ${p.ownerReply?`<div class="owner-reply"><strong>${p.status==='반영 완료'?'✓ 반영 완료':'SAI 답변'}</strong><p>${esc(p.ownerReply)}</p></div>`:''}
    <div class="post-actions"><button class="community-like" data-id="${p.id}">♡ <span>${p.likes||0}</span></button><button class="toggle-comments" data-id="${p.id}">💬 <span>${(p.comments||[]).length}</span></button><button class="community-share" data-id="${p.id}">↗ 공유</button></div>
    <div class="inline-comments hidden" id="comments-${p.id}">
      <div class="comment-list">${(p.comments||[]).map(c=>`<div class="comment-row"><span class="mini-avatar">손</span><p>${esc(typeof c==='string'?c:c.text)}</p></div>`).join('')||'<p class="muted">첫 댓글을 남겨보세요.</p>'}</div>
      <div class="comment-compose"><input placeholder="따뜻한 댓글을 남겨주세요"><button data-id="${p.id}">등록</button></div>
    </div>
   </div>
 </article>`;
}
function renderCommunity(filter='전체'){
 const cats=['전체','추가됐으면 하는 위스키','추가됐으면 하는 칵테일','불편했던 점','개선 제안','궁금한 점','좋았던 점','자유 이야기'];
 $('#communityTabs').innerHTML=cats.map(c=>`<button class="${filter===c?'active':''}" data-community-cat="${c}">${c==='전체'?'전체':catIcon(c)+' '+c}</button>`).join('');
 let posts=(DB.community||[]).filter(p=>filter==='전체'||p.category===filter);
 posts.sort((a,b)=>v25CommunitySort==='popular'?(b.likes||0)-(a.likes||0):v25CommunitySort==='comments'?(b.comments||[]).length-(a.comments||[]).length:b.date.localeCompare(a.date));
 const top=[...(DB.community||[])].sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,3);
 $('#communityHighlights').innerHTML=top.map((p,i)=>`<button data-focus-post="${p.id}"><small>${i===0?'이번 달 가장 공감받은 의견':'많이 본 이야기'}</small><strong>${catIcon(p.category)} ${esc(p.title)}</strong><em>공감 ${p.likes||0}</em></button>`).join('');
 $('#communityList').innerHTML=posts.length?posts.map(communityCard).join(''):'<div class="empty-state"><span>💬</span><h3>첫 이야기를 기다리고 있어요.</h3></div>';
 $$('[data-community-cat]').forEach(b=>b.onclick=()=>renderCommunity(b.dataset.communityCat));
 $$('.community-like').forEach(b=>b.onclick=()=>{const p=DB.community.find(x=>x.id===b.dataset.id);p.likes=(p.likes||0)+1;saveDB();renderCommunity(filter)});
 $$('.toggle-comments').forEach(b=>b.onclick=()=>$('#comments-'+b.dataset.id).classList.toggle('hidden'));
 $$('.comment-compose button').forEach(b=>b.onclick=()=>{const input=b.previousElementSibling,c=input.value.trim();if(!c)return;const p=DB.community.find(x=>x.id===b.dataset.id);p.comments??=[];p.comments.push(c);saveDB();renderCommunity(filter);setTimeout(()=>$('#comments-'+b.dataset.id)?.classList.remove('hidden'),0)});
 $$('.community-share').forEach(b=>b.onclick=async()=>{const p=DB.community.find(x=>x.id===b.dataset.id),text=`[사이 커뮤니티] ${p.title}\n${p.content}`;try{await navigator.share({title:p.title,text})}catch{navigator.clipboard?.writeText(text);alert('게시글 내용이 복사되었습니다.')}});
 $$('[data-focus-post]').forEach(b=>b.onclick=()=>document.querySelector(`[data-post="${b.dataset.focusPost}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}));
}
function submitCommunity(){
 const title=$('#communityTitle').value.trim(),content=$('#communityContent').value.trim();if(!title||!content)return alert('제목과 내용을 입력해주세요.');
 const finish=image=>{DB.community??=[];DB.community.push({id:'c'+Date.now(),category:$('#communityCategory').value,title,content,author:$('#communityAuthor').value.trim()||'익명의 손님',date:new Date().toISOString().slice(0,10),likes:0,views:1,comments:[],ownerReply:'',status:'',image});saveDB();['communityTitle','communityContent','communityAuthor'].forEach(id=>$('#'+id).value='');$('#communityImage').value='';$('#communityImagePreview').classList.add('hidden');v25OpenSheet('#communityComposer',false);renderCommunity();renderHomeTrending();alert('사이 커뮤니티에 이야기가 올라갔습니다.')};
 const f=$('#communityImage')?.files?.[0];if(f){const r=new FileReader();r.onload=()=>finish(r.result);r.readAsDataURL(f)}else finish('');
}

function memoryCard(m){
 return `<article class="memory-post" data-memory="${m.id}">
  <div class="memory-image-wrap"><img src="${m.image}" alt=""><span class="memory-date">${esc(m.date)}</span>${m.pick?'<span class="sai-pick">✨ SAI PICK</span>':''}</div>
  <div class="memory-post-body"><div class="post-author"><span class="avatar">${esc((m.author||'사').slice(0,1))}</span><span><strong>${esc(m.author)}</strong><small>${(m.tags||[]).map(t=>'#'+t).join(' ')}</small></span></div>
  <p class="memory-caption">${esc(m.text)}</p>
  <div class="post-actions"><button class="memory-like" data-id="${m.id}">♡ <span>${m.likes||0}</span></button><button class="memory-comments-toggle" data-id="${m.id}">💬 <span>${(m.comments||[]).length}</span></button><button class="memory-share" data-id="${m.id}">↗ 공유</button></div>
  <div class="inline-comments hidden" id="memory-comments-${m.id}"><div class="comment-list">${(m.comments||[]).map(c=>`<div class="comment-row"><span class="mini-avatar">손</span><p>${esc(c)}</p></div>`).join('')||'<p class="muted">이 순간에 첫 댓글을 남겨보세요.</p>'}</div><div class="comment-compose"><input placeholder="이 추억에 댓글 남기기"><button data-id="${m.id}">등록</button></div></div>
  </div></article>`;
}
function renderMemories(){
 let list=[...(DB.memories||[])].sort((a,b)=>b.date.localeCompare(a.date));
 if(v25MemoryTag!=='전체')list=list.filter(m=>(m.tags||[]).includes(v25MemoryTag));
 const tags=['전체',...new Set((DB.memories||[]).flatMap(m=>m.tags||[]))];
 $('#memoryTagFilters').innerHTML=tags.map(t=>`<button class="${v25MemoryTag===t?'active':''}" data-memory-tag="${t}">${t==='전체'?'전체':'#'+t}</button>`).join('');
 const feature=[...(DB.memories||[])].sort((a,b)=>(Number(b.pick)-Number(a.pick))||(b.likes-a.likes))[0];
 $('#memoryFeature').innerHTML=feature?`<img src="${feature.image}" alt=""><div><small>${feature.pick?'✨ SAI PICK':'오늘 많이 본 추억'}</small><strong>${esc(feature.text)}</strong><p>${esc(feature.author)} · ♡ ${feature.likes}</p></div>`:'';
 $('#memoryFeed').className=v25MemoryView==='grid'?'memory-grid-v25':'feed memory-feed';
 $('#memoryFeed').innerHTML=list.map(memoryCard).join('');
 $$('[data-memory-tag]').forEach(b=>b.onclick=()=>{v25MemoryTag=b.dataset.memoryTag;renderMemories()});
 $$('.memory-like').forEach(b=>b.onclick=()=>{const m=DB.memories.find(x=>x.id===b.dataset.id);m.likes++;saveDB();renderMemories();renderHomeTrending()});
 $$('.memory-comments-toggle').forEach(b=>b.onclick=()=>$('#memory-comments-'+b.dataset.id).classList.toggle('hidden'));
 $$('#memoryFeed .comment-compose button').forEach(b=>b.onclick=()=>{const input=b.previousElementSibling,c=input.value.trim();if(!c)return;DB.memories.find(x=>x.id===b.dataset.id).comments.push(c);saveDB();renderMemories();setTimeout(()=>$('#memory-comments-'+b.dataset.id)?.classList.remove('hidden'),0)});
 $$('.memory-share').forEach(b=>b.onclick=async()=>{const m=DB.memories.find(x=>x.id===b.dataset.id),text=`[사이의 추억] ${m.text}`;try{await navigator.share({text})}catch{navigator.clipboard?.writeText(text);alert('추억 문장이 복사되었습니다.')}});
}
function uploadMemory(){
 if(sessionStorage.getItem('sai_verified')!=='1')return alert('먼저 매장 QR 방문 인증을 완료해주세요.');
 const f=$('#memoryImage').files[0],text=$('#memoryText').value.trim(),author=$('#memoryAuthor').value.trim()||'익명의 손님';if(!f||!text)return alert('사진과 한줄 기억을 입력해주세요.');
 const tags=($('#memoryTags')?.value||'').split(',').map(x=>x.trim().replace(/^#/,'')).filter(Boolean);
 const r=new FileReader();r.onload=()=>{DB.memories.unshift({id:'m'+Date.now(),image:r.result,author,text,date:new Date().toISOString().slice(0,10),likes:0,comments:[],tags:tags.length?tags:['손님의기록'],pick:false});saveDB();renderMemories();renderHomeTrending();['memoryText','memoryAuthor','memoryTags'].forEach(id=>{if($('#'+id))$('#'+id).value=''});$('#memoryImage').value='';$('#memoryImagePreview').classList.add('hidden');v25OpenSheet('#memoryComposer',false);alert('사이의 추억에 기록되었습니다.');};r.readAsDataURL(f);
}

function v25Preset(name){
 const bases=DB.customBuilder.bases, liqs=DB.customBuilder.liqueurs;
 customState={bases:{},liqueurs:{},mixer:'',flavors:[],aromas:[],glass:null,ice:null,garnish:''};
 const set=(collection,label,oz,target)=>{const item=collection.find(x=>x.name===label);if(item)target[item.name]={...item,oz}};
 if(name==='fresh'){set(bases,'보드카',2,customState.bases);set(liqs,'트리플섹',1,customState.liqueurs);customState.mixer='탄산수';customState.flavors=['상큼','시트러스'];customState.aromas=['과일향']}
 if(name==='sweet'){set(bases,'럼',2,customState.bases);set(liqs,'피치트리',1.5,customState.liqueurs);customState.mixer='파인애플주스';customState.flavors=['달콤','과일'];customState.aromas=['과일향']}
 if(name==='dry'){set(bases,'진',1,customState.bases);set(bases,'봄베이 진',1,customState.bases);customState.mixer='토닉워터';customState.flavors=['드라이','청량'];customState.aromas=['허브']}
 if(name==='bold'){set(bases,'론디아즈',1.5,customState.bases);set(bases,'럼',.5,customState.bases);set(liqs,'말리부',1,customState.liqueurs);customState.mixer='파인애플주스';customState.flavors=['묵직','과일'];customState.aromas=['과일향']}
 customState.glass=DB.customBuilder.glasses.find(x=>x.name==='하이볼')||DB.customBuilder.glasses[0];customState.ice=DB.customBuilder.ices.find(x=>x.name==='큰 얼음')||DB.customBuilder.ices[0];customState.garnish='레몬';
 initCustomBuilderSelection();updateCustomSummary();goBuilderStep(1);document.querySelector('.custom-builder')?.scrollIntoView({behavior:'smooth',block:'start'});
}
const v24UpdateCustomSummary=updateCustomSummary;
updateCustomSummary=function(){
 v24UpdateCustomSummary();
 const e=estimateCustom(), status=$('#mobileCustomStatus');
 if(status){status.querySelector('span').textContent=e.baseOz>=2?`기주 ${e.baseOz.toFixed(1)}oz · ${e.score}점`:`기주 ${e.baseOz.toFixed(1)} / 2oz`;status.querySelector('strong').textContent=money(e.price)}
}
function v25Bind(){
 renderHomeTrending();v25BindMenu();renderCommunity();renderMemories();
 $('#communityWriteOpen')?.addEventListener('click',()=>v25OpenSheet('#communityComposer',true));$('#communitySideWrite')?.addEventListener('click',()=>v25OpenSheet('#communityComposer',true));
 $$('[data-close-composer]').forEach(x=>x.onclick=()=>v25OpenSheet('#communityComposer',false));
 $('#communityImage')?.addEventListener('change',e=>v25ImagePreview(e.target,'#communityImagePreview'));
 $('#communitySort')?.addEventListener('change',e=>{v25CommunitySort=e.target.value;renderCommunity()});
 $('#communitySubmit')&&($('#communitySubmit').onclick=submitCommunity);
 $('#memoryWriteOpen')?.addEventListener('click',()=>v25OpenSheet('#memoryComposer',true));$$('[data-close-memory]').forEach(x=>x.onclick=()=>v25OpenSheet('#memoryComposer',false));
 $('#memoryImage')?.addEventListener('change',e=>v25ImagePreview(e.target,'#memoryImagePreview'));
 $$('[data-memory-view]').forEach(b=>b.onclick=()=>{v25MemoryView=b.dataset.memoryView;$$('[data-memory-view]').forEach(x=>x.classList.toggle('active',x===b));renderMemories()});
 $$('.preset-card[data-preset]').forEach(b=>b.onclick=()=>v25Preset(b.dataset.preset));$('#surprisePreset')?.addEventListener('click',randomRecommendation);
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(v25Bind,80));


// ===== V2.6 QR TABLE ORDER + REALTIME STAFF BOARD =====
const ORDER_CART_KEY='sai_order_cart_v26';
const ORDER_DEVICE_KEY='sai_order_device_v26';
let orderCart=[];
let orderClient=null;
let lastOrderId=null;

function getTableNumber(){
  const p=new URLSearchParams(location.search);
  const raw=(p.get('table')||p.get('seat')||'').trim();
  return /^[0-9]{1,2}$/.test(raw)?raw:'';
}
function getOrderDeviceId(){
  let id=localStorage.getItem(ORDER_DEVICE_KEY);
  if(!id){id=(crypto.randomUUID?crypto.randomUUID():'device-'+Date.now()+'-'+Math.random().toString(16).slice(2));localStorage.setItem(ORDER_DEVICE_KEY,id)}
  return id;
}
function supabaseReady(){
  const c=window.SAI_SUPABASE||{};
  return c.url && c.publishableKey && !c.url.includes('PASTE_') && !c.publishableKey.includes('PASTE_') && window.supabase?.createClient;
}
function initOrderClient(){
  if(supabaseReady()){
    orderClient=window.supabase.createClient(window.SAI_SUPABASE.url,window.SAI_SUPABASE.publishableKey);
    $('#orderSetupWarning')?.classList.add('hidden');
  }else{
    $('#orderSetupWarning')?.classList.remove('hidden');
  }
}
function loadOrderCart(){
  try{orderCart=JSON.parse(sessionStorage.getItem(ORDER_CART_KEY)||'[]')}catch{orderCart=[]}
}
function saveOrderCart(){sessionStorage.setItem(ORDER_CART_KEY,JSON.stringify(orderCart));renderOrderCart()}
function orderItemById(id){return allDrinks().find(x=>x.id===id)}
function addOrderItem(id){
  const item=orderItemById(id);if(!item)return;
  const found=orderCart.find(x=>x.id===id);
  if(found)found.qty+=1;else orderCart.push({id:item.id,name:item.name,price:Number(item.price||0),qty:1,category:item.category});
  saveOrderCart();
  const btn=document.querySelector(`.add-cart[data-id="${CSS.escape(id)}"]`);
  if(btn){const old=btn.textContent;btn.textContent='담겼어요 ✓';btn.classList.add('added');setTimeout(()=>{btn.textContent=old;btn.classList.remove('added')},850)}
}
function changeOrderQty(id,delta){
  const x=orderCart.find(i=>i.id===id);if(!x)return;
  x.qty+=delta;if(x.qty<=0)orderCart=orderCart.filter(i=>i.id!==id);saveOrderCart();
}
function renderOrderCart(){
  const count=orderCart.reduce((s,x)=>s+x.qty,0),total=orderCart.reduce((s,x)=>s+x.qty*x.price,0);
  if($('#cartCount'))$('#cartCount').textContent=count;
  if($('#cartTotal'))$('#cartTotal').textContent=money(total);
  const table=getTableNumber();
  if($('#cartTableNotice'))$('#cartTableNotice').innerHTML=table?`<strong>${table}번 자리</strong><span>이 자리로 주문이 전달됩니다.</span>`:'<strong>자리 번호가 없습니다.</strong><span>테이블 QR로 다시 접속하거나 직원에게 자리 번호를 확인해주세요.</span>';
  if($('#cartItems'))$('#cartItems').innerHTML=orderCart.length?orderCart.map(x=>`<article class="cart-row"><div><strong>${esc(x.name)}</strong><small>${money(x.price)} · ${esc(x.category)}</small></div><div class="qty-control"><button data-cart-minus="${x.id}">−</button><span>${x.qty}</span><button data-cart-plus="${x.id}">＋</button></div><strong>${money(x.price*x.qty)}</strong></article>`).join(''):'<div class="empty-cart"><span>🍸</span><strong>아직 담긴 메뉴가 없어요.</strong><p>메뉴에서 원하는 술을 담아주세요.</p></div>';
  $$('[data-cart-minus]').forEach(b=>b.onclick=()=>changeOrderQty(b.dataset.cartMinus,-1));
  $$('[data-cart-plus]').forEach(b=>b.onclick=()=>changeOrderQty(b.dataset.cartPlus,1));
}
function openOrderCart(open=true){
  $('#cartSheet')?.classList.toggle('hidden',!open);document.body.classList.toggle('sheet-open',open);renderOrderCart();
}
function orderCardHTML(x){
  const direct=x.id==='your-sai';
  return `<article class="card menu-card"><div class="eyebrow">${esc(x.category)}</div><h3>${esc(x.name)}</h3><p>${esc(x.copy)}</p><div>${(x.tags||[]).map(t=>`<span class="pill">#${esc(t)}</span>`).join('')}</div><div class="row between" style="margin-top:14px"><div><div class="price">${money(x.price)}</div><small class="muted">${esc(x.abv||'')}</small></div><div class="row"><span class="grade">${grade(x.score)}</span><strong>${x.score}</strong></div></div><div class="menu-order-actions">${direct?`<button class="btn primary your-direct" data-tab="your">직접 만들기</button>`:`<button class="btn primary add-cart" data-id="${x.id}">주문에 담기</button>`}<button class="btn ghost order-btn" data-id="${x.id}">이전 손님의 글</button></div></article>`;
}
cardHTML=orderCardHTML;
const oldBindOrderButtonsV26=bindOrderButtons;
bindOrderButtons=function(){
  oldBindOrderButtonsV26();
  $$('.add-cart').forEach(b=>b.onclick=()=>addOrderItem(b.dataset.id));
  $$('.your-direct').forEach(b=>b.onclick=()=>tab('your'));
};
function makeOrderId(){
  if(window.crypto?.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
async function submitTableOrder(){
  const table=getTableNumber();
  if(!table)return alert('테이블 QR로 접속해야 주문할 수 있습니다. 직원에게 QR을 요청해주세요.');
  if(!orderCart.length)return alert('주문할 메뉴를 먼저 담아주세요.');

  const total=orderCart.reduce((s,x)=>s+x.qty*x.price,0);
  const orderId=makeOrderId();
  const payload={
    id:orderId,
    table_no:Number(table),
    items:orderCart.map(x=>({id:x.id,name:x.name,price:Number(x.price),qty:Number(x.qty),category:x.category,details:x.details||''})),
    total_amount:Number(total),
    note:($('#orderNote')?.value||'').trim(),
    status:'new',
    device_id:getOrderDeviceId()
  };

  const btn=$('#submitOrder');
  if(btn){btn.disabled=true;btn.textContent='주문 전송 중…'}

  try{
    const c=window.SAI_SUPABASE||{};
    if(!c.url || !c.publishableKey || c.url.includes('PASTE_') || c.publishableKey.includes('PASTE_')){
      throw new Error('주문 서버 설정이 없습니다. 직원에게 말씀해주세요.');
    }

    // Production orders always go directly to Supabase REST using native fetch.
    // Do not silently fall back to localStorage: a local-only success would never reach staff.
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    let res;
    try{
      res=await fetch(c.url.replace(/\/$/,'')+'/rest/v1/orders',{
        method:'POST',
        headers:{
          'apikey':c.publishableKey,
          'Authorization':'Bearer '+c.publishableKey,
          'Content-Type':'application/json',
          'Prefer':'return=minimal'
        },
        body:JSON.stringify(payload),
        signal:controller.signal,
        cache:'no-store'
      });
    }finally{clearTimeout(timer)}

    if(!res.ok){
      let detail='';
      try{detail=await res.text()}catch{}
      throw new Error(`서버 응답 ${res.status}${detail?` · ${detail.slice(0,240)}`:''}`);
    }

    lastOrderId=orderId;
    orderCart=[];
    saveOrderCart();
    openOrderCart(false);

    if($('#orderStatusBadge'))$('#orderStatusBadge').textContent='주문 전송 완료';
    if($('#orderSuccessText'))$('#orderSuccessText').textContent=`${table}번 자리 · ${money(total)} 주문이 직원에게 전달되었습니다.`;
    $('#orderSuccess')?.classList.remove('hidden');
  }catch(err){
    console.error('SAI_ORDER_INSERT_ERROR',err);
    const detail=err?.name==='AbortError'?'주문 서버 응답 시간이 초과되었습니다.':(err?.message||err?.details||'알 수 없는 오류');
    alert(`주문 전송 실패\n${detail}\n\n직원에게 말씀해주세요.`);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='주문 보내기'}
  }
}
function subscribeCustomerOrder(orderId){
  if(!orderClient)return;
  orderClient.channel('customer-order-'+orderId)
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders',filter:`id=eq.${orderId}`},payload=>{
     const s=payload.new.status,label={new:'주문 접수 대기',accepted:'주문 접수 완료',making:'제조 중',ready:'준비 완료',served:'제공 완료',cancelled:'주문 취소'}[s]||s;
     if($('#orderStatusBadge'))$('#orderStatusBadge').textContent=label;
   }).subscribe();
}
function initTableOrderUI(){
  initOrderClient();loadOrderCart();renderOrderCart();
  const table=getTableNumber();
  if(table&&$('#tableBadge')){$('#tableBadge').textContent=`${table}번 자리`;$('#tableBadge').classList.remove('hidden')}
  $('#cartOpen')?.addEventListener('click',()=>openOrderCart(true));
  $$('[data-close-cart]').forEach(x=>x.onclick=()=>openOrderCart(false));
  $('#submitOrder')?.addEventListener('click',submitTableOrder);
  $('#orderSuccessClose')?.addEventListener('click',()=>{$('#orderSuccess').classList.add('hidden');tab('menu')});
  bindOrderButtons();
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(initTableOrderUI,120));

// ===== V3.4.1 approved UI + YOUR SAI bugfix =====
customState={bases:{},liqueurs:{},mixer:null};
function ysCard(x,type,i){const name=x?.name||x;return `<button type="button" class="ys-choice" data-ys-type="${type}" data-index="${i}"><strong>${name}</strong>${x?.taste?`<small>${x.taste}</small>`:''}</button>`}
function ysAmount(type){const vals=Object.values(customState[type]||{}),total=vals.reduce((s,x)=>s+Number(x.oz||0),0);return `<span>사용량</span><button type="button" data-ys-minus="${type}">−</button><strong>${total.toFixed(1)} oz</strong><button type="button" data-ys-plus="${type}">＋</button><small>${total<=2?'기본 포함':'추가금 적용'}</small>`}
function initCustomBuilder(){
 const c=DB.customBuilder;if(!$('#ysBases'))return;
 $('#ysBases').innerHTML=c.bases.map((x,i)=>ysCard(x,'bases',i)).join('');
 const fruit=c.liqueurs.map((x,i)=>({...x,_i:i})).filter(x=>x.group==='fruit'),other=c.liqueurs.map((x,i)=>({...x,_i:i})).filter(x=>x.group!=='fruit');
 $('#ysFruitLiq').innerHTML=fruit.map(x=>ysCard(x,'liqueurs',x._i)).join('');
 $('#ysOtherLiq').innerHTML=other.map(x=>ysCard(x,'liqueurs',x._i)).join('');
 $('#ysMixers').innerHTML=c.mixers.map((x,i)=>ysCard(x,'mixer',i)).join('');
 // Choice clicks are handled by delegated click below (more reliable on iOS/Safari and after re-render).
 $('#saveCustomSignature').onclick=saveCustomRecipe;
 updateCustomSummary();
}
function ysSelect(btn){
 const type=btn.dataset.ysType,i=Number(btn.dataset.index);
 // UI type is singular `mixer`, but the data source is plural `mixers`.
 // Using the singular key here caused an exception on every mixer tap.
 const sourceKey=type==='mixer'?'mixers':type;
 const source=DB.customBuilder?.[sourceKey]||[];
 const raw=source[i];
 if(raw==null){console.error('[YOUR SAI] choice data not found', {type,sourceKey,i});return;}
 const name=raw?.name||raw;
 if(type==='mixer'){
   $$('[data-ys-type="mixer"]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');customState.mixer=name;
   const map={'토닉':'청량 · 탄산','토닉워터':'청량 · 탄산','탄산수':'청량 · 깔끔','오렌지 주스':'과일 · 달콤 · 상큼','크랜베리주스':'과일 · 새콤','콜라':'달콤 · 탄산','레몬주스':'시트러스 · 새콤','음료 없음':'진한 맛'};
   if($('#ysMixerInfo'))$('#ysMixerInfo').innerHTML=`<strong>${name} 선택됨 ✓</strong><span>${map[name]||'선택한 음료가 예상 도수와 맛에 반영됩니다.'}</span>`;
 }else if(type==='bases'){
   customState.bases={};$$('[data-ys-type="bases"]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');customState.bases[name]={...raw,oz:2};
 }else{
   if(customState.liqueurs[name]){delete customState.liqueurs[name];btn.classList.remove('selected')}
   else{customState.liqueurs[name]={...raw,oz:Object.keys(customState.liqueurs).length?1:2};btn.classList.add('selected');if($('#ysLiqInfo'))$('#ysLiqInfo').innerHTML=`<strong>${name}</strong><span>${raw.taste||''}${raw.tags?` 맛 · ${raw.tags}`:''}</span>`}
 }
 updateCustomSummary();
}
function ysChange(type,delta){const vals=Object.values(customState[type]||{});if(!vals.length)return;const x=vals[vals.length-1],next=Math.max(.5,Math.min(4,Number(x.oz||0)+delta));x.oz=Math.round(next*2)/2;customState[type][x.name]=x;updateCustomSummary()}
document.addEventListener('click',e=>{
 const choice=e.target.closest?.('.ys-choice[data-ys-type]');
 if(choice){e.preventDefault();ysSelect(choice);return;}
 const plus=e.target.closest?.('[data-ys-plus]'),minus=e.target.closest?.('[data-ys-minus]');
 if(plus){e.preventDefault();ysChange(plus.dataset.ysPlus,.5);return;}
 if(minus){e.preventDefault();ysChange(minus.dataset.ysMinus,-.5);}
});
function chosen(type){return Object.values(customState[type]||{})}
function estimateCustom(){
 const bases=chosen('bases'),liqs=chosen('liqueurs'),baseOz=bases.reduce((s,x)=>s+Number(x.oz||0),0),liqOz=liqs.reduce((s,x)=>s+Number(x.oz||0),0),mixer=customState.mixer;
 const spiritOz=baseOz+liqOz,mixerOz=mixer&&mixer!=='음료 없음'?3:0,finalOz=Math.max(1,spiritOz+mixerOz);
 const alcohol=bases.concat(liqs).reduce((s,x)=>s+Number(x.oz||0)*Number(x.abv||0)/100,0),abv=alcohol/finalOz*100;
 const baseExtraSteps=Math.max(0,Math.ceil((baseOz-2)/.5));
 const liqExtraSteps=Math.max(0,Math.ceil((liqOz-2)/.5));
 const hasRonDiaz=bases.some(x=>String(x.name||'').replace(/\s+/g,'').includes('론디아즈'));
 const baseRate=hasRonDiaz?1000:500;
 const price=Math.max(13000,13000+baseExtraSteps*baseRate+liqExtraSteps*1000);
 let mystery=false;if(liqs.length>=2){for(let i=0;i<liqs.length;i++)for(let j=i+1;j<liqs.length;j++)if(Math.abs(Number(liqs[i].oz)-Number(liqs[j].oz))<.01)mystery=true}
 let tags=[];liqs.forEach(x=>tags.push(...String(x.tags||x.taste||'').split(/\s*·\s*/)));
 const mixTags={'토닉':['청량','탄산'],'토닉워터':['청량','탄산'],'탄산수':['청량'],'오렌지 주스':['과일','달콤'],'크랜베리주스':['과일','새콤'],'콜라':['달콤','탄산'],'레몬주스':['시트러스','새콤'],'음료 없음':[]};
 tags.push(...(mixTags[mixer]||[]));if(!tags.length&&bases.length)tags=String(bases[0].taste||'').split(/\s*·\s*/);tags=[...new Set(tags.filter(Boolean))].slice(0,3);
 return {bases,liqs,baseOz,liqOz,abv,price,mystery,tags,mixer};
}
function updateCustomSummary(){if(!$('#ysBases'))return;const e=estimateCustom();$('#ysBaseAmount').innerHTML=ysAmount('bases');$('#ysLiqAmount').innerHTML=ysAmount('liqueurs');$('#summaryAbv').textContent=e.bases.length?`약 ${e.abv.toFixed(0)}%`:'-';$('#summaryPrice').textContent=money(Math.max(13000,e.price));$('#summaryFlavor').textContent=e.mystery?'측정 불가':(e.tags.join(' · ')||'-');$('#ysMystery').classList.toggle('hidden',!e.mystery);let note=$('#ysPriceNote');if(!note){note=document.createElement('div');note.id='ysPriceNote';note.className='ys-price-note';document.querySelector('.ys-result')?.after(note)}const p=DB.customBuilder.pricing||{};const bo=Math.max(0,e.baseOz-2),lo=Math.max(0,e.liqOz-2),hasRon=e.bases.some(x=>String(x.name||'').replace(/\s+/g,'').includes('론디아즈')),baseRate=hasRon?Number(p.ronDiazExtraPerHalfOz||1000):Number(p.baseExtraPerHalfOz||500),be=Math.ceil(bo/.5)*baseRate,le=Math.ceil(lo/.5)*Number(p.liqueurExtraPerHalfOz||1000);note.textContent=(be||le)?`기본 13,000원 + 기주 초과 ${money(be)} + 리큐르 초과 ${money(le)}`:'기주 2oz + 리큐르 2oz + 음료까지 기본 13,000원';}
function saveCustomRecipe(){const e=estimateCustom();if(!e.bases.length)return alert('기주를 선택해주세요.');if(!e.liqs.length)return alert('리큐르를 한 가지 이상 선택해주세요.');if(!customState.mixer)return alert('음료를 선택해주세요.');const name=$('#customName').value.trim()||'당신의 사이',story=$('#customStory').value.trim()||'오늘의 취향을 담아 만든 한 잔',price=Math.max(13000,e.price),details=`기주: ${e.bases.map(x=>`${x.name} ${Number(x.oz).toFixed(1)}oz`).join(' + ')} / 리큐르: ${e.liqs.map(x=>`${x.name} ${Number(x.oz).toFixed(1)}oz`).join(' + ')} / 음료: ${e.mixer} / 예상도수: ${e.abv.toFixed(0)}% / 예상맛: ${e.mystery?'측정 불가':(e.tags.join(' · ')||'-')}`;DB.recipes.push({id:'r'+Date.now(),name,creator:localStorage.getItem(VISITOR)||'익명의 손님',base:e.bases.map(x=>x.name).join(' + '),taste:e.mystery?'측정 불가':e.tags.join(' · '),mood:'당신의 사이',note:story,likes:0,uses:0,month:new Date().toISOString().slice(0,7),price,abv:+e.abv.toFixed(1),liqueur:e.liqs.map(x=>x.name).join(' + '),mixer:e.mixer,approved:false});saveDB();renderRecipes();const id='your-sai-'+Date.now();orderCart.push({id,name:`당신의 사이 · ${name}`,price,qty:1,category:'시그니처 · 커스텀',details});saveOrderCart();openOrderCart(true);alert('완성한 당신의 사이를 주문에 담았습니다. 주문 확인 후 보내주세요.')}

// Approved menu usability interactions
function v341BindApprovedMenu(){
 $('#showAllMenu')?.addEventListener('click',()=>{v25MenuQuery='';v25MenuMood='';if($('#menuSearch'))$('#menuSearch').value='';$$('[data-menu-mood]').forEach(x=>x.classList.remove('active'));renderMenu('전체');$('#filters')?.scrollIntoView({behavior:'smooth',block:'start'})});
 $('#tasteMoreToggle')?.addEventListener('click',()=>{const box=$('#tasteMore');box?.classList.toggle('hidden');if(box)$('#tasteMoreToggle').textContent=box.classList.contains('hidden')?'취향 더보기 ＋':'취향 접기 −'});
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(v341BindApprovedMenu,160));





// ===== V3.4.8 YOUR SAI ORDER / SAVE SPLIT =====
function validateYourSaiSelection(){
  const e=estimateCustom();
  if(!e.bases.length){alert('기주를 선택해주세요.');return null;}
  if(!e.liqs.length){alert('리큐르를 한 가지 이상 선택해주세요.');return null;}
  if(!customState.mixer){alert('음료를 선택해주세요.');return null;}
  return e;
}
function buildYourSaiDetails(e){
  return `기주: ${e.bases.map(x=>`${x.name} ${Number(x.oz).toFixed(1)}oz`).join(' + ')} / 리큐르: ${e.liqs.map(x=>`${x.name} ${Number(x.oz).toFixed(1)}oz`).join(' + ')} / 음료: ${e.mixer} / 예상도수: ${e.abv.toFixed(0)}% / 예상맛: ${e.mystery?'측정 불가':(e.tags.join(' · ')||'-')}`;
}
function addYourSaiToOrder(){
  const e=validateYourSaiSelection(); if(!e)return;
  const customName=$('#customName')?.value.trim()||'당신의 사이';
  const price=Math.max(13000,Number(e.price||13000));
  const item={id:'your-sai-'+Date.now(),name:`당신의 사이 · ${customName}`,price,qty:1,category:'시그니처 · 커스텀',details:buildYourSaiDetails(e)};
  orderCart.push(item);
  saveOrderCart();
  updateCartCount();
  const st=$('#customActionStatus'); if(st)st.textContent=`주문에 담겼어요 ✓ · ${money(price)}`;
  const btn=$('#saveCustomSignature'); if(btn)btn.textContent='주문에 담김 ✓';
  openOrderCart(true);
}
function saveYourSaiRecipeOnly(){
  const e=validateYourSaiSelection(); if(!e)return;
  const name=$('#customName')?.value.trim()||'이름 없는 당신의 사이';
  const story=$('#customStory')?.value.trim()||'오늘의 취향을 담아 만든 한 잔';
  DB.recipes.push({id:'r'+Date.now(),name,creator:localStorage.getItem(VISITOR)||'익명의 손님',base:e.bases.map(x=>x.name).join(' + '),taste:e.mystery?'측정 불가':e.tags.join(' · '),mood:'당신의 사이',note:story,likes:0,uses:0,month:new Date().toISOString().slice(0,7),price:Math.max(13000,e.price),abv:+e.abv.toFixed(1),liqueur:e.liqs.map(x=>x.name).join(' + '),mixer:e.mixer,approved:false});
  saveDB(); renderRecipes();
  const st=$('#customActionStatus'); if(st)st.textContent='나만의 칵테일로 저장했어요 ✓';
  alert('나만의 칵테일로 저장되었습니다.');
}
function updateCartCount(){const el=$('#cartCount');if(el)el.textContent=orderCart.reduce((s,x)=>s+Number(x.qty||0),0)}
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  const orderBtn=$('#saveCustomSignature'); if(orderBtn)orderBtn.onclick=addYourSaiToOrder;
  const saveBtn=$('#saveCustomRecipeOnly'); if(saveBtn)saveBtn.onclick=saveYourSaiRecipeOnly;
  updateCartCount();
},220));
