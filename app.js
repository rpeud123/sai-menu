const KEY="sai_web_data_v1";
async function loadData(){const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);const d=await (await fetch("data/menu.json")).json();localStorage.setItem(KEY,JSON.stringify(d));return d}
const won=n=>new Intl.NumberFormat("ko-KR").format(Number(n||0))+"원";
const grade=(s,d)=>d.settings.grades.find(g=>s>=g.min)?.name||"C";
const tier=(p,d)=>d.settings.priceTiers.find(t=>p<=t.max)?.name||"프리미엄";
const rate=x=>x.price?Math.round((Number(x.cost||0)/x.price)*1000)/10:0;
const items=d=>[...d.signatures,...d.menu];
function cards(list,d,el){el.innerHTML=list.map(x=>`<article class="card"><div class="kicker">${x.category}</div><h3>${x.name}</h3><p>${x.oneLine||""}</p><div class="meta"><span class="tag">${x.abv||"도수 정보 없음"}</span><span class="tag">${tier(x.price,d)}</span></div><div style="display:flex;justify-content:space-between"><div><div class="price">${won(x.price)}</div><small>원가율 ${rate(x)}%</small></div><div style="text-align:center"><span class="grade">${grade(x.score||70,d)}</span><div>${x.score||70}점</div></div></div>${x.letter?`<details><summary>사이의 편지</summary><p class="muted">${x.letter}</p></details>`:""}</article>`).join("")}
function splash(){const s=document.querySelector("#splash");if(!s)return;const day=new Date().toISOString().slice(0,10);if(localStorage.getItem("sai_seen")==day){s.remove();return}const close=()=>{localStorage.setItem("sai_seen",day);s.style.opacity=0;setTimeout(()=>s.remove(),600)};setTimeout(close,5600);document.querySelector("#skip").onclick=close}
