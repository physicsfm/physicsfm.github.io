// D.CRITICK 24/7 — общий скрипт вещания

// mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.channels-nav');
if(toggle && nav){
  toggle.addEventListener('click', ()=>{
    nav.classList.toggle('open');
    toggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
}

// broadcast timecode clock — decorative "24/7 on air since" counter
const clockEl = document.getElementById('clock');
if(clockEl){
  const epoch = new Date('2024-01-01T00:00:00');
  function tick(){
    const diff = Math.floor((Date.now() - epoch.getTime())/1000);
    const d = Math.floor(diff/86400);
    const h = String(Math.floor((diff%86400)/3600)).padStart(2,'0');
    const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
    const s = String(diff%60).padStart(2,'0');
    clockEl.textContent = `В ЭФИРЕ ${d} ДН ${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

// occasional whole-page glitch flicker (very subtle)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if(!reduceMotion.matches){
  setInterval(()=>{
    if(Math.random() < 0.06){
      document.body.style.filter = 'brightness(1.06) saturate(1.15)';
      setTimeout(()=> document.body.style.filter = '', 80);
    }
  }, 3500);
}

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item=>{
  const q = item.querySelector('.faq-q');
  if(!q) return;
  q.addEventListener('click', ()=>{
    const willOpen = !item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item').forEach(i=> i.classList.remove('open'));
    if(willOpen) item.classList.add('open');
  });
});

