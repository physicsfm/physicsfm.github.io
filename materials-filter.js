// ============================================================
// D.CRITICK 24/7 — поиск и фильтр по категориям на странице «Статьи»
// Работает полностью на клиенте, без обращений к базе.
// ============================================================

(()=>{
  const grid = document.getElementById('materialsGrid');
  const filtersBox = document.getElementById('tagFilters');
  const searchInput = document.getElementById('materialSearch');
  const emptyNote = document.getElementById('materialsEmpty');
  if(!grid) return;

  const cards = Array.from(grid.querySelectorAll('.article-card'));

  // ---- собираем уникальные категории прямо из карточек ----
  const allTags = new Set();
  cards.forEach(card=>{
    (card.dataset.tags || '').split(',').map(t=> t.trim()).filter(Boolean).forEach(t=> allTags.add(t));
  });

  let activeTag = null;

  function renderPills(){
    const pills = ['<button class="tag-pill active" data-tag="">Все</button>']
      .concat([...allTags].map(t=> `<button class="tag-pill" data-tag="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`));
    filtersBox.innerHTML = pills.join('');

    filtersBox.querySelectorAll('.tag-pill').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        activeTag = btn.dataset.tag || null;
        filtersBox.querySelectorAll('.tag-pill').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  }

  function applyFilters(){
    const query = (searchInput.value || '').trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card=>{
      const tags = (card.dataset.tags || '').split(',').map(t=> t.trim());
      const matchesTag = !activeTag || tags.includes(activeTag);
      const text = card.textContent.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const show = matchesTag && matchesSearch;
      card.style.display = show ? '' : 'none';
      if(show) visibleCount++;
    });

    emptyNote.style.display = visibleCount === 0 ? 'block' : 'none';
    grid.style.display = visibleCount === 0 ? 'none' : '';
  }

  searchInput.addEventListener('input', applyFilters);

  renderPills();
  applyFilters();
})();
