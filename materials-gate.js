// ============================================================
// D.CRITICK 24/7 — гейт доступа к материалам и Google Classroom
// Показывает содержимое .gate-unlocked только вошедшим пользователям,
// иначе показывает панель .gate-locked с призывом войти.
// Подключается ПОСЛЕ supabase-client.js
// ============================================================

(function(){
  const gates = document.querySelectorAll('.materials-gate');
  if(!gates.length) return;

  function setState(isAuthed){
    gates.forEach(gate=>{
      gate.classList.toggle('is-unlocked', isAuthed);
    });
  }

  (async ()=>{
    try{
      const { data: { session } } = await sb.auth.getSession();
      setState(!!session);
    }catch(e){
      setState(false);
    }
  })();

  sb.auth.onAuthStateChange((event, session)=>{
    setState(!!session);
  });
})();
