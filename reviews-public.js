// ============================================================
// D.CRITICK 24/7 — публичный вывод одобренных отзывов (about.html)
// Подключается ПОСЛЕ supabase-client.js
// ============================================================

(async ()=>{
  const box = document.getElementById('reviewsList');
  if(!box) return;

  const { data: reviews, error } = await sb
    .from('reviews')
    .select('body, created_at, profiles(full_name)')
    .eq('status', 'approved')
    .order('created_at', {ascending:false})
    .limit(12);

  if(error || !reviews || reviews.length === 0){
    box.innerHTML = '<p style="color:var(--muted);">Пока нет опубликованных отзывов — будьте первыми, оставьте свой в личном кабинете.</p>';
    return;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, ch=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  box.innerHTML = reviews.map(r=> `
    <div class="card">
      <p style="margin:0 0 14px; color:var(--cream);">«${escapeHtml(r.body)}»</p>
      <div style="font-family:'Poppins',sans-serif; font-weight:700; font-size:.82rem; color:var(--accent);">${escapeHtml(r.profiles?.full_name || 'Участник Physics FM')}</div>
    </div>
  `).join('');
})();
