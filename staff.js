const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let client=null, orders=[], channel=null, audioCtx=null;
const money=n=>new Intl.NumberFormat('ko-KR').format(Number(n||0))+'원';
const ready=()=>{const c=window.SAI_SUPABASE||{};return c.url&&!c.url.includes('PASTE_')&&c.publishableKey&&!c.publishableKey.includes('PASTE_')&&window.supabase?.createClient};
function beep(){
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);
  o.frequency.setValueAtTime(880,audioCtx.currentTime);o.frequency.setValueAtTime(660,audioCtx.currentTime+.18);
  g.gain.setValueAtTime(.001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.24,audioCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.55);
  o.start();o.stop(audioCtx.currentTime+.56);navigator.vibrate?.([180,80,180]);
 }catch(e){console.warn(e)}
}
function statusLabel(s){return({new:'신규',accepted:'접수',making:'제조 중',ready:'준비 완료',served:'제공 완료',cancelled:'취소'}[s]||s)}
function orderCard(o){
 const items=(o.items||[]).map(x=>`<li><strong>${x.name}</strong><span>× ${x.qty}</span></li>`).join('');
 const next=o.status==='new'?'accepted':o.status==='accepted'?'making':o.status==='making'?'ready':o.status==='ready'?'served':'';
 const nextText={accepted:'접수하기',making:'제조 시작',ready:'준비 완료',served:'제공 완료'}[next];
 return `<article class="staff-order-card status-${o.status}"><div class="staff-order-top"><span class="table-number">${o.table_no}번 자리</span><span>${new Date(o.created_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</span></div><ul>${items}</ul>${o.note?`<div class="staff-note">요청: ${o.note}</div>`:''}<div class="row between"><strong>${money(o.total_amount)}</strong><span class="status-chip">${statusLabel(o.status)}</span></div><div class="staff-order-actions">${next?`<button class="btn primary" data-status-id="${o.id}" data-next="${next}">${nextText}</button>`:''}${!['served','cancelled'].includes(o.status)?`<button class="btn" data-cancel-id="${o.id}">취소</button>`:''}</div></article>`;
}
function render(){
 const newOrders=orders.filter(x=>['new','accepted'].includes(x.status)),making=orders.filter(x=>x.status==='making'),done=orders.filter(x=>['ready','served','cancelled'].includes(x.status));
 $('#countNew').textContent=newOrders.length;$('#countMaking').textContent=making.length;$('#countReady').textContent=orders.filter(x=>x.status==='ready').length;
 $('#ordersNew').innerHTML=newOrders.length?newOrders.map(orderCard).join(''):'<div class="staff-empty">새 주문이 없습니다.</div>';
 $('#ordersMaking').innerHTML=making.length?making.map(orderCard).join(''):'<div class="staff-empty">제조 중인 주문이 없습니다.</div>';
 $('#ordersDone').innerHTML=done.length?done.slice(0,20).map(orderCard).join(''):'<div class="staff-empty">완료된 주문이 없습니다.</div>';
 $$('[data-status-id]').forEach(b=>b.onclick=()=>updateStatus(b.dataset.statusId,b.dataset.next));
 $$('[data-cancel-id]').forEach(b=>b.onclick=()=>confirm('이 주문을 취소할까요?')&&updateStatus(b.dataset.cancelId,'cancelled'));
}
async function loadOrders(){
 if(client){
  const {data,error}=await client.from('orders').select('*').order('created_at',{ascending:false}).limit(100);if(error){console.error(error);return}
  orders=data||[];
 }else{orders=JSON.parse(localStorage.getItem('sai_demo_orders')||'[]')}
 render();
}
async function updateStatus(id,status){
 if(client){const {error}=await client.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)return alert('상태 변경 실패: '+error.message)}
 else{orders=JSON.parse(localStorage.getItem('sai_demo_orders')||'[]');const o=orders.find(x=>x.id===id);if(o)o.status=status;localStorage.setItem('sai_demo_orders',JSON.stringify(orders))}
 await loadOrders();
}
function flash(o){
 beep();$('#newOrderFlashText').textContent=`${o.table_no}번 자리 · ${(o.items||[]).map(x=>x.name+' '+x.qty).join(', ')}`;$('#newOrderFlash').classList.remove('hidden');setTimeout(()=>$('#newOrderFlash').classList.add('hidden'),5000);
}
function subscribe(){
 if(!client)return;
 channel=client.channel('staff-orders').on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},p=>{flash(p.new);loadOrders()}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},()=>loadOrders()).subscribe(s=>{$('#connectionState').textContent=s==='SUBSCRIBED'?'실시간 연결됨':'연결 중';$('#connectionState').classList.toggle('connected',s==='SUBSCRIBED')});
}
async function authState(){
 if(!client){$('#staffLogin').classList.add('hidden');$('#staffBoard').classList.remove('hidden');$('#connectionState').textContent='테스트 모드';loadOrders();return}
 const {data:{session}}=await client.auth.getSession();
 if(session){$('#staffLogin').classList.add('hidden');$('#staffBoard').classList.remove('hidden');$('#staffLogout').classList.remove('hidden');loadOrders();subscribe()}
 else{$('#staffLogin').classList.remove('hidden');$('#staffBoard').classList.add('hidden')}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('#soundTest').onclick=beep;$('#refreshOrders').onclick=loadOrders;
 if(ready()){client=window.supabase.createClient(window.SAI_SUPABASE.url,window.SAI_SUPABASE.publishableKey);$('#connectionState').textContent='로그인 필요';client.auth.onAuthStateChange(()=>authState())}
 else $('#staffLoginHelp').innerHTML='현재 <strong>테스트 모드</strong>입니다. 같은 브라우저에서 들어온 주문만 확인됩니다.';
 $('#staffLoginBtn').onclick=async()=>{if(!client)return authState();const email=$('#staffEmail').value.trim();if(!email)return alert('직원 이메일을 입력해주세요.');const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}});if(error)alert(error.message);else alert('이메일로 로그인 링크를 보냈습니다.')};
 $('#staffLogout').onclick=async()=>{await client?.auth.signOut();location.reload()};
 window.addEventListener('storage',e=>{if(e.key==='sai_demo_orders'){loadOrders();const a=JSON.parse(e.newValue||'[]');if(a[0])flash(a[0])}});
 authState();
});
