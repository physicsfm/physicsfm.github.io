// ============================================================
// D.CRITICK 24/7 — карточка Google Classroom на странице «Другое»
// До входа: заглушка с призывом войти.
// После входа: ссылка именно на тот класс (7 или 8), который указан
// в профиле пользователя (поле profiles.grade).
// Подключается ПОСЛЕ supabase-client.js
// ============================================================

(function(){
  const gate = document.getElementById('classroomGate');
  if(!gate) return;

  const unlocked = gate.querySelector('.gate-unlocked');

  const CLASSROOMS = {
    '7': { label: 'Google Classroom · 7 класс', url: 'https://classroom.google.com/c/ODY3OTE0MDU5MTc2?cjc=ur3d7wbh' },
    '8': { label: 'Google Classroom · 8 класс', url: 'https://classroom.google.com/c/Nzg1NjA5ODYzNDkz?cjc=3ebish5s' }
  };

  function showLocked(){
    gate.classList.remove('is-unlocked');
  }

  async function showUnlocked(session){
    let grade = null;
    try{
      const { data: profile } = await sb
        .from('profiles')
        .select('grade')
        .eq('id', session.user.id)
        .maybeSingle();
      grade = profile?.grade || null;
    }catch(e){ /* профиль не прочитался — покажем запасной вариант ниже */ }

    const info = CLASSROOMS[grade];
    if(unlocked){
      if(info){
        unlocked.innerHTML =
          '<div class="label">' + info.label + '</div>' +
          '<div class="value" style="word-break:break-word; font-size:.86rem;">' +
            '<a href="' + info.url + '" target="_blank" rel="noopener" style="color:var(--accent);">Перейти в класс</a>' +
          '</div>';
      }else{
        unlocked.innerHTML =
          '<div class="label">Google Classroom</div>' +
          '<div class="value" style="font-size:.86rem; color:var(--muted);">Укажите класс в профиле — тогда появится ссылка.</div>';
      }
    }
    gate.classList.add('is-unlocked');
  }

  (async ()=>{
    try{
      const { data: { session } } = await sb.auth.getSession();
      if(session){ await showUnlocked(session); } else { showLocked(); }
    }catch(e){
      showLocked();
    }
  })();

  sb.auth.onAuthStateChange((event, session)=>{
    if(event === 'SIGNED_IN' && session){ showUnlocked(session); }
    if(event === 'SIGNED_OUT'){ showLocked(); }
  });
})();
