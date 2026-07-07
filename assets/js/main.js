// ===== Agnes Sobha Bridal Artistry — shared behaviour =====

var WHATSAPP_NUMBER = '6597696850';

// ---------- mobile menu (accessible: aria-expanded, Escape to close) ----------
(function(){
  const btn = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if(!btn || !menu) return;

  function setOpen(open){
    menu.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function(){
    setOpen(!menu.classList.contains('open'));
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
  });
})();

// ---------- header elevation on scroll ----------
(function(){
  const header = document.querySelector('header');
  if(!header) return;
  function onScroll(){ header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();

// ---------- scroll reveal ----------
(function(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.15, rootMargin:'0px 0px -40px 0px'});
  items.forEach(el=>io.observe(el));
})();

// ---------- chip-nav scrollspy (Services & Portfolio category jumps) ----------
(function(){
  const nav = document.querySelector('.chip-nav');
  if(!nav) return;
  const chips = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  const sections = chips
    .map(c => document.querySelector(c.getAttribute('href')))
    .filter(Boolean);
  if(!sections.length) return;

  function setActive(id){
    chips.forEach(c => c.classList.toggle('chip-active', c.getAttribute('href') === '#' + id));
    const active = nav.querySelector('.chip-active');
    if(active && nav.scrollWidth > nav.clientWidth + 4){
      const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
      nav.scrollTo({left: target, behavior: 'smooth'});
    }
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) setActive(entry.target.id);
    });
  }, {rootMargin:'-30% 0px -60% 0px'});
  sections.forEach(s => io.observe(s));
})();

// ---------- WhatsApp booking ----------
function buildWhatsAppMessage({name, service, date, message}){
  let text = `Hi Agnes, I'd like to enquire about a booking.\n\n`;
  text += `Name: ${name || '-'}\n`;
  text += `Service: ${service || '-'}\n`;
  if(date) text += `Date: ${date}\n`;
  if(message) text += `\nMessage: ${message}`;
  return text;
}

function sendToWhatsApp(data){
  const text = buildWhatsAppMessage(data);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

(function(){
  const form = document.getElementById('booking-form');
  if(!form) return;

  // native date picker: block past dates
  const dateInput = form.querySelector('[name="date"]');
  if(dateInput && dateInput.type === 'date'){
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value.trim();
    const service = form.querySelector('[name="service"]').value;
    const message = form.querySelector('[name="message"]').value.trim();

    let date = dateInput ? dateInput.value : '';
    if(date && dateInput.type === 'date'){
      const d = new Date(date + 'T00:00:00');
      if(!isNaN(d)){
        date = d.toLocaleDateString('en-SG', {day:'numeric', month:'long', year:'numeric'});
      }
    }

    if(!name){
      form.querySelector('[name="name"]').focus();
      return;
    }

    // brief visual feedback on the submit button
    const submitBtn = form.querySelector('[type="submit"]');
    if(submitBtn && !submitBtn.dataset.busy){
      submitBtn.dataset.busy = '1';
      const original = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Opening WhatsApp&hellip;';
      setTimeout(function(){
        submitBtn.innerHTML = original;
        delete submitBtn.dataset.busy;
      }, 2200);
    }

    sendToWhatsApp({name, service, date, message});
  });
})();

// ---------- quick-book buttons carrying a preset service (data-service attribute) ----------
document.querySelectorAll('[data-quick-whatsapp]').forEach(btn=>{
  btn.addEventListener('click', function(){
    const service = btn.getAttribute('data-service') || '';
    const text = service
      ? `Hi Agnes, I'd like to enquire about ${service}.`
      : `Hi Agnes, I'd like to enquire about a booking.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });
});

// ---------- portfolio lightbox (tap to view, swipe to browse) ----------
(function(){
  const IMG_RE = /\.(svg|jpe?g|png|webp|gif|avif)(\?.*)?$/i;
  const grids = document.querySelectorAll('.gallery-grid');
  if(!grids.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML =
    '<button type="button" class="lb-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lb-prev" aria-label="Previous image">&#10094;</button>' +
    '<img class="lb-img" src="" alt="">' +
    '<button type="button" class="lb-next" aria-label="Next image">&#10095;</button>' +
    '<div class="lb-caption" aria-hidden="true"></div>';
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lb-img');
  const caption = overlay.querySelector('.lb-caption');
  let group = [];
  let index = 0;
  let lastFocus = null;

  function show(i){
    index = (i + group.length) % group.length;
    const link = group[index];
    const thumb = link.querySelector('img');
    imgEl.src = link.getAttribute('href');
    imgEl.alt = thumb ? (thumb.getAttribute('alt') || '') : '';
    caption.textContent = (index + 1) + ' / ' + group.length;
  }
  function open(g, i, trigger){
    group = g;
    lastFocus = trigger || null;
    overlay.classList.add('open');
    document.body.classList.add('lb-open');
    show(i);
    overlay.querySelector('.lb-close').focus();
  }
  function close(){
    overlay.classList.remove('open');
    document.body.classList.remove('lb-open');
    imgEl.src = '';
    if(lastFocus) lastFocus.focus();
  }

  grids.forEach(grid=>{
    const links = Array.prototype.slice.call(grid.querySelectorAll('a.frame'))
      .filter(a => IMG_RE.test(a.getAttribute('href') || ''));
    links.forEach((link, i)=>{
      link.addEventListener('click', function(e){
        e.preventDefault();
        open(links, i, link);
      });
    });
  });

  overlay.querySelector('.lb-close').addEventListener('click', close);
  overlay.querySelector('.lb-prev').addEventListener('click', function(){ show(index - 1); });
  overlay.querySelector('.lb-next').addEventListener('click', function(){ show(index + 1); });
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) close();
  });
  document.addEventListener('keydown', function(e){
    if(!overlay.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') show(index - 1);
    if(e.key === 'ArrowRight') show(index + 1);
  });

  // swipe to browse on touch devices
  let touchX = null;
  overlay.addEventListener('touchstart', function(e){
    touchX = e.changedTouches[0].clientX;
  }, {passive:true});
  overlay.addEventListener('touchend', function(e){
    if(touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if(Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    touchX = null;
  }, {passive:true});
})();

// ---------- click ripple feedback on buttons ----------
(function(){
  function addRipple(e){
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  }
  document.querySelectorAll('.btn, .book-btn, .wa-float').forEach(el => {
    el.addEventListener('click', addRipple);
  });
})();
