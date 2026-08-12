// ============================================================
// D.CRITICK 24/7 — регистрация и личный кабинет (Supabase)
// Вход по email + паролю — без писем на почту.
// Подключается ПОСЛЕ supabase-client.js
// ============================================================

// ---------- страница регистрации (register.html) ----------
const regForm = document.getElementById('regForm');
if(regForm){
  const errorBox = document.getElementById('regError');
  const alreadyPanel = document.getElementById('alreadyRegisteredPanel');

  // если в этом браузере уже есть активная сессия — форму не показываем
  (async ()=>{
    const { data: { session } } = await sb.auth.getSession();
    if(session){
      regForm.closest('.form-card').style.display = 'none';
      if(alreadyPanel) alreadyPanel.style.display = 'block';
    }
  })();

  regForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!regForm.checkValidity()){
      regForm.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(regForm).entries());

    if(data.password !== data.password2){
      if(errorBox){
        errorBox.textContent = 'Пароли не совпадают — проверьте оба поля.';
        errorBox.style.display = 'block';
      }
      return;
    }

    const submitBtn = regForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрируем…';
    if(errorBox){ errorBox.style.display = 'none'; }

    const { error } = await sb.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          grade: data.grade,
          school: data.school,
          city: data.city,
          telegram: data.telegram
        }
      }
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Отправить заявку';

    if(error){
      if(errorBox){
        errorBox.textContent = 'Не получилось зарегистрироваться: ' + error.message;
        errorBox.style.display = 'block';
      }
      return;
    }

    regForm.closest('.form-card').style.display = 'none';
    document.getElementById('successPanel').classList.add('show');
    // кабинет откроется сразу — сессия уже установлена после signUp
    setTimeout(()=>{ window.location.href = 'cabinet.html'; }, 700);
  });
}

// ---------- страница кабинета (cabinet.html) ----------
const cabinetLogin = document.getElementById('cabinetLogin');
if(cabinetLogin){
  const loginCard = document.getElementById('loginCard');
  const loginError = document.getElementById('loginError');
  const dashSections = document.querySelectorAll('.dash-section');
  const greetName = document.getElementById('greetName');
  const logoutBtn = document.getElementById('logoutBtn');
  const editToggleBtn = document.getElementById('editToggleBtn');
  const editForm = document.getElementById('editForm');
  const reviewForm = document.getElementById('reviewForm');
  const juryPanel = document.getElementById('juryPanel');

  let currentSession = null;
  let presenceChannel = null;

  function startPresence(session){
    if(presenceChannel) return;
    presenceChannel = sb.channel('dcritick-online', {
      config: { presence: { key: session.user.id } }
    });
    presenceChannel.subscribe(async (status)=>{
      if(status === 'SUBSCRIBED'){
        await presenceChannel.track({ online_at: new Date().toISOString(), page: 'cabinet' });
      }
    });
  }

  function stopPresence(){
    if(presenceChannel){
      sb.removeChannel(presenceChannel);
      presenceChannel = null;
    }
  }

  cabinetLogin.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if(!email || !password) return;
    const submitBtn = cabinetLogin.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Входим…';
    if(loginError) loginError.style.display = 'none';

    const { error } = await sb.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Войти';

    if(error){
      if(loginError){
        loginError.textContent = 'Не получилось войти: неверный email или пароль.';
        loginError.style.display = 'block';
      }
      return;
    }
    // dashboard подхватится через onAuthStateChange (SIGNED_IN)
  });

  // ---- переключатель формы редактирования профиля ----
  if(editToggleBtn){
    editToggleBtn.addEventListener('click', ()=>{
      editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
    });
  }

  function fillEditForm(profile){
    document.getElementById('editName').value = profile?.full_name || '';
    document.getElementById('editGrade').value = profile?.grade || '7';
    document.getElementById('editCity').value = profile?.city || '';
    document.getElementById('editSchool').value = profile?.school || '';
    document.getElementById('editTelegram').value = profile?.telegram || '';
  }

  if(editForm){
    editForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!currentSession) return;
      const fd = Object.fromEntries(new FormData(editForm).entries());
      const btn = editForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Сохраняем…';

      const { error } = await sb.from('profiles').update({
        full_name: fd.full_name,
        grade: fd.grade,
        city: fd.city,
        school: fd.school,
        telegram: fd.telegram
      }).eq('id', currentSession.user.id);

      btn.disabled = false; btn.textContent = 'Сохранить';

      if(error){
        alert('Не получилось сохранить: ' + error.message);
        return;
      }

      greetName.textContent = fd.full_name;
      document.getElementById('statGrade').textContent = fd.grade;
      editForm.style.display = 'none';
    });
  }

  // ---- отзыв участника ----
  async function loadOwnReview(){
    if(!currentSession) return;
    const { data: review } = await sb
      .from('reviews')
      .select('*')
      .eq('user_id', currentSession.user.id)
      .order('created_at', {ascending:false})
      .limit(1)
      .maybeSingle();

    const formCard = document.getElementById('reviewFormCard');
    const statusCard = document.getElementById('reviewStatusCard');
    const statusText = document.getElementById('reviewStatusText');
    if(!review){
      formCard.style.display = 'block';
      statusCard.style.display = 'none';
      return;
    }
    formCard.style.display = 'none';
    statusCard.style.display = 'block';
    const labels = {
      pending: 'На модерации — как только жюри его проверит, он появится на сайте.',
      approved: 'Одобрен и опубликован на странице «О нас». Спасибо!',
      rejected: 'Не прошёл модерацию. Можно отправить новый отзыв ниже.'
    };
    statusText.textContent = labels[review.status] || review.status;
    if(review.status === 'rejected'){
      formCard.style.display = 'block';
    }
  }

  if(reviewForm){
    reviewForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!currentSession) return;
      const body = document.getElementById('reviewBody').value.trim();
      if(!body) return;
      const btn = reviewForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Отправляем…';

      const { error } = await sb.from('reviews').insert({
        user_id: currentSession.user.id,
        body,
        status: 'pending'
      });

      btn.disabled = false; btn.textContent = 'Отправить на модерацию';

      if(error){
        alert('Не получилось отправить отзыв: ' + error.message);
        return;
      }
      reviewForm.reset();
      loadOwnReview();
    });
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, ch=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  async function loadDashboard(session){
    currentSession = session;
    startPresence(session);
    loginCard.style.display = 'none';
    dashSections.forEach(s=> s.style.display = 'block');
    if(editForm) editForm.style.display = 'none';

    const { data: profile } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    greetName.textContent = profile?.full_name || 'участник';
    document.getElementById('statGrade').textContent = profile?.grade || '—';
    document.getElementById('statSeason').textContent = '03';
    fillEditForm(profile);

    const { data: results } = await sb
      .from('results')
      .select('*')
      .eq('user_id', session.user.id)
      .order('round');

    const roundsBox = document.getElementById('roundsList');
    if(roundsBox){
      if(!results || results.length === 0){
        roundsBox.innerHTML = '<div class="round-row"><span class="rname" style="color:var(--muted);">Результатов пока нет — они появятся здесь после проверки тура.</span></div>';
      }else{
        const statusLabel = {pending:['Ожидание проверки','pending'], checked:['Проверено','ok'], appeal:['На апелляции','pending']};
        roundsBox.innerHTML = results.map(r=>{
          const [label, cls] = statusLabel[r.status] || ['—','muted'];
          return `<div class="round-row">
            <span class="rname">Тур ${r.round}</span>
            <span class="rscore">${r.score != null ? r.score + ' / 100' : '—'}</span>
            <span class="status ${cls}">${label}</span>
          </div>`;
        }).join('');
      }
    }

    await loadOwnReview();

    if(juryPanel){
      juryPanel.style.display = (profile?.role === 'jury') ? 'block' : 'none';
    }
  }

  async function init(){
    const { data: { session } } = await sb.auth.getSession();
    if(session){
      loadDashboard(session);
    }
  }

  sb.auth.onAuthStateChange((event, session)=>{
    if(event === 'SIGNED_IN' && session){
      loadDashboard(session);
    }
    if(event === 'SIGNED_OUT'){
      currentSession = null;
      stopPresence();
      loginCard.style.display = 'block';
      dashSections.forEach(s=> s.style.display = 'none');
    }
  });

  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      await sb.auth.signOut();
    });
  }

  init();
}
