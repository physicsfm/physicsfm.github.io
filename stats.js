// ============================================================
// D.CRITICK 24/7 — статистика и модерация (только для жюри)
// Подключается ПОСЛЕ supabase-client.js
// ============================================================

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, ch=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function countBy(arr, keyFn){
  const map = {};
  arr.forEach(x=>{
    const k = keyFn(x);
    if(!k) return;
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}

function renderDonut(container, segments){
  const total = segments.reduce((s,x)=> s + x.value, 0);
  if(total === 0){
    container.innerHTML = '<p class="empty-note">Пока нет данных.</p>';
    return;
  }
  const r = 40, cx = 50, cy = 50, sw = 16;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  let circles = '';
  segments.forEach(seg=>{
    const frac = seg.value / total;
    const dash = frac * circumference;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${sw}" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"></circle>`;
    offset += dash;
  });
  const legend = segments.map(seg=> `
    <div class="dl-item"><span class="dl-dot" style="background:${seg.color}"></span>${escapeHtml(seg.label)}<span class="dl-val">${seg.value}</span></div>
  `).join('');
  container.innerHTML = `
    <div class="donut-wrap">
      <svg width="130" height="130" viewBox="0 0 100 100">${circles}</svg>
      <div class="donut-legend">${legend}</div>
    </div>
  `;
}

function renderBarList(container, items){
  if(!items.length){
    container.innerHTML = '<p class="empty-note">Пока нет данных.</p>';
    return;
  }
  const max = Math.max(...items.map(i=> i.value));
  container.innerHTML = items.map(i=> `
    <div class="bar-row">
      <span class="bl">${escapeHtml(i.label)}</span>
      <span class="bt"><span class="bf" style="width:${Math.round(i.value / max * 100)}%"></span></span>
      <span class="bv">${i.value}</span>
    </div>
  `).join('');
}

function renderTimeline(container, items){
  if(!items.length){
    container.innerHTML = '<p class="empty-note">Пока нет данных.</p>';
    return;
  }
  const max = Math.max(...items.map(i=> i.value), 1);
  container.innerHTML = '<div class="vbar-chart">' + items.map(i=> `
    <div class="vb-col">
      <div class="vb-bar" style="height:${Math.max(6, Math.round(i.value / max * 100))}%"></div>
      <div class="vb-label">${escapeHtml(i.label)}</div>
    </div>
  `).join('') + '</div>';
}

(async ()=>{
  const gateSection = document.getElementById('gateSection');
  const gateMessage = document.getElementById('gateMessage');
  const statsContent = document.getElementById('statsContent');

  const { data: { session } } = await sb.auth.getSession();
  if(!session){
    gateMessage.textContent = 'Сначала войдите в личный кабинет под своей учётной записью жюри.';
    return;
  }

  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if(profile?.role !== 'jury'){
    gateMessage.textContent = 'Эта страница доступна только участникам с ролью жюри.';
    return;
  }

  gateSection.style.display = 'none';
  statsContent.style.display = 'block';

  // ---------- сколько человек сейчас на сайте (realtime presence) ----------
  const onlineChannel = sb.channel('dcritick-online', {
    config: { presence: { key: session.user.id } }
  });
  onlineChannel.on('presence', {event:'sync'}, ()=>{
    const state = onlineChannel.presenceState();
    document.getElementById('statOnline').textContent = Object.keys(state).length;
  });
  onlineChannel.subscribe(async (status)=>{
    if(status === 'SUBSCRIBED'){
      await onlineChannel.track({ online_at: new Date().toISOString(), page: 'stats' });
    }
  });

  // ---------- данные ----------
  const { data: allProfiles } = await sb
    .from('profiles')
    .select('full_name, grade, school, city, telegram, role, created_at')
    .order('created_at', {ascending:true});

  const profiles = allProfiles || [];
  const participants = profiles.filter(p=> p.role !== 'jury');
  const juryMembers = profiles.filter(p=> p.role === 'jury');

  const { data: allReviews } = await sb
    .from('reviews')
    .select('id, body, status, created_at, profiles(full_name)')
    .order('created_at', {ascending:false});

  const reviews = allReviews || [];
  const pendingReviews = reviews.filter(r=> r.status === 'pending');

  // ---------- обзорные цифры ----------
  document.getElementById('statTotal').textContent = participants.length;
  document.getElementById('statG7').textContent = participants.filter(p=> p.grade === '7').length;
  document.getElementById('statG8').textContent = participants.filter(p=> p.grade === '8').length;
  document.getElementById('statCities').textContent = new Set(participants.map(p=> p.city).filter(Boolean)).size;
  document.getElementById('statSchools').textContent = new Set(participants.map(p=> p.school).filter(Boolean)).size;
  document.getElementById('statJuryCount').textContent = juryMembers.length;
  document.getElementById('statReviewsTotal').textContent = reviews.length;
  document.getElementById('statPendingCount').textContent = pendingReviews.length;

  // ---------- график: по классам ----------
  renderDonut(document.getElementById('gradeDonut'), [
    {label:'7 класс', value: participants.filter(p=> p.grade === '7').length, color:'var(--cyan)'},
    {label:'8 класс', value: participants.filter(p=> p.grade === '8').length, color:'var(--magenta)'}
  ]);

  // ---------- график: регистрации по дням ----------
  const dayCounts = countBy(participants, p=> (p.created_at || '').slice(0,10));
  const days = Object.keys(dayCounts).sort();
  const timelineItems = days.slice(-14).map(d=>{
    const [, m, day] = d.split('-');
    return {label: `${day}.${m}`, value: dayCounts[d]};
  });
  renderTimeline(document.getElementById('regTimeline'), timelineItems);

  // ---------- график: топ городов ----------
  const cityCounts = countBy(participants, p=> p.city && p.city.trim());
  const cityItems = Object.entries(cityCounts)
    .sort((a,b)=> b[1]-a[1])
    .slice(0,6)
    .map(([label, value])=> ({label, value}));
  renderBarList(document.getElementById('cityChart'), cityItems);

  // ---------- график: топ школ ----------
  const schoolCounts = countBy(participants, p=> p.school && p.school.trim());
  const schoolItems = Object.entries(schoolCounts)
    .sort((a,b)=> b[1]-a[1])
    .slice(0,6)
    .map(([label, value])=> ({label, value}));
  renderBarList(document.getElementById('schoolChart'), schoolItems);

  // ---------- таблица участников + поиск ----------
  const sortedParticipants = [...participants].sort((a,b)=> (b.created_at||'').localeCompare(a.created_at||''));
  const tbody = document.getElementById('participantsBody');

  function renderTable(list){
    if(list.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);">Никого не найдено.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(p=> `
      <tr>
        <td class="g-topic">${escapeHtml(p.full_name || '—')}</td>
        <td>${escapeHtml(p.grade || '—')}</td>
        <td>${escapeHtml(p.school || '—')}</td>
        <td>${escapeHtml(p.city || '—')}</td>
        <td>${escapeHtml(p.telegram || '—')}</td>
        <td class="mono" style="font-size:.82rem; color:var(--muted);">${(p.created_at||'').slice(0,10)}</td>
      </tr>
    `).join('');
  }
  renderTable(sortedParticipants);

  const searchInput = document.getElementById('participantSearch');
  searchInput.addEventListener('input', ()=>{
    const q = searchInput.value.trim().toLowerCase();
    if(!q){ renderTable(sortedParticipants); return; }
    renderTable(sortedParticipants.filter(p=>
      [p.full_name, p.school, p.city, p.telegram].some(v=> (v||'').toLowerCase().includes(q))
    ));
  });

  // ---------- модерация отзывов ----------
  function renderModeration(){
    const modList = document.getElementById('reviewModerationList');
    const pending = reviews.filter(r=> r.status === 'pending');
    if(pending.length === 0){
      modList.innerHTML = '<p style="color:var(--muted);">Отзывов на модерации нет.</p>';
      return;
    }
    modList.innerHTML = pending.map(r=> `
      <div class="card" style="margin-bottom:14px;">
        <div class="mono" style="font-size:.78rem; color:var(--muted); margin-bottom:8px;">${escapeHtml(r.profiles?.full_name || 'Без имени')} · ${(r.created_at||'').slice(0,10)}</div>
        <p style="margin:0 0 14px;">${escapeHtml(r.body)}</p>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary review-approve" data-id="${r.id}">Одобрить</button>
          <button class="btn btn-ghost review-reject" data-id="${r.id}">Отклонить</button>
        </div>
      </div>
    `).join('');

    modList.querySelectorAll('.review-approve').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        btn.disabled = true;
        await sb.from('reviews').update({status:'approved'}).eq('id', btn.dataset.id);
        const r = reviews.find(x=> String(x.id) === btn.dataset.id);
        if(r) r.status = 'approved';
        document.getElementById('statPendingCount').textContent = reviews.filter(r=> r.status==='pending').length;
        renderModeration();
      });
    });
    modList.querySelectorAll('.review-reject').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        btn.disabled = true;
        await sb.from('reviews').update({status:'rejected'}).eq('id', btn.dataset.id);
        const r = reviews.find(x=> String(x.id) === btn.dataset.id);
        if(r) r.status = 'rejected';
        document.getElementById('statPendingCount').textContent = reviews.filter(r=> r.status==='pending').length;
        renderModeration();
      });
    });
  }
  renderModeration();
})();
