/* ── placeholder for broken images ── */
function emptyThumb() {
  return `<div class="card-placeholder">
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    <span>add photo</span>
  </div>`;
}

/* ══════════════════════════════════════════
   DECK STACKS
══════════════════════════════════════════ */
const LAYERS = ['is-front', 'is-mid', 'is-back'];

class DeckController {
  constructor(scene) {
    this.scene   = scene;
    this.wrap    = scene.closest('.deck-wrap');
    this.cards   = Array.from(scene.querySelectorAll('.stack-card'));
    this.counter = this.wrap.querySelector('.deck-counter');
    this.panel   = this.wrap.closest('.section-inner').querySelector('.text-panel');

    /* order[i] = index of card currently at layer i (front=0, mid=1, back=2) */
    this.order = this.cards.map((_, i) => i);

    /* set the deck-scene height to match the front card once rendered */
    this.syncHeight();
    window.addEventListener('resize', () => this.syncHeight());

    /* nav buttons */
    this.wrap.querySelector('.deck-prev').addEventListener('click', () => this.shift(-1));
    this.wrap.querySelector('.deck-next').addEventListener('click', () => this.shift( 1));

    /* click front card → open lightbox */
    this.cards.forEach((card) => {
      card.addEventListener('click', () => {
        if (card.classList.contains('is-front')) {
          openLightbox(this.buildItems(), 0);
        }
      });
    });

    this.updateUI();
  }

  syncHeight() {
    const front = this.cards[this.order[0]];
    this.scene.style.height = front.offsetHeight + 'px';
  }

  /* shift direction: +1 = next card comes forward, -1 = prev */
  shift(dir) {
    if (dir > 0) {
      /* rotate order left: front→back, mid→front, back→mid */
      this.order.push(this.order.shift());
    } else {
      /* rotate order right: back→front, front→mid, mid→back */
      this.order.unshift(this.order.pop());
    }
    this.applyLayers();
    this.updateUI();
    setTimeout(() => this.syncHeight(), 60);
  }

  applyLayers() {
    this.cards.forEach(c => c.classList.remove(...LAYERS));
    this.order.forEach((cardIdx, layerIdx) => {
      this.cards[cardIdx].classList.add(LAYERS[layerIdx]);
    });
  }

  updateUI() {
    const total     = this.cards.length;
    const frontCard = this.cards[this.order[0]];
    const caption   = frontCard.dataset.caption;
    const date      = frontCard.dataset.date;

    const displayIdx = this.order[0] + 1;
    this.counter.textContent = `${displayIdx} / ${total}`;

    if (this.panel) {
      const capEl  = this.panel.querySelector('.panel-caption');
      const dateEl = this.panel.querySelector('.panel-date');
      if (capEl && dateEl) {
        capEl.classList.add('swapping');
        dateEl.classList.add('swapping');
        setTimeout(() => {
          capEl.innerHTML        = caption;
          dateEl.textContent     = date;
          capEl.classList.remove('swapping');
          dateEl.classList.remove('swapping');
        }, 220);
      }
    }
  }

  buildItems() {
    return this.order.map(i => ({
      src:     this.cards[i].dataset.src,
      caption: this.cards[i].dataset.caption,
      date:    this.cards[i].dataset.date,
    }));
  }
}

document.querySelectorAll('.deck-scene').forEach(scene => new DeckController(scene));

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
let lbItems = [];
let lbIdx   = 0;

const lb      = document.getElementById('lightbox');
const lbImg   = document.getElementById('lb-img');
const lbCap   = document.getElementById('lb-caption');
const lbDate  = document.getElementById('lb-date');
const lbCount = document.getElementById('lb-counter');

function openLightbox(items, startIdx) {
  lbItems = items;
  lbIdx   = startIdx;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  showSlide(lbIdx, false);
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
}

function showSlide(idx, animate = true) {
  lbIdx = ((idx % lbItems.length) + lbItems.length) % lbItems.length;
  const item = lbItems[lbIdx];

  if (animate) {
    lbImg.classList.add('swapping');
    setTimeout(() => {
      lbImg.src = item.src;
      lbImg.alt = item.caption;
      lbImg.classList.remove('swapping');
    }, 200);
  } else {
    lbImg.src = item.src;
    lbImg.alt = item.caption;
  }

  lbCap.innerHTML     = item.caption;
  lbDate.textContent  = item.date;
  lbCount.textContent = `${lbIdx + 1} / ${lbItems.length}`;
}

document.getElementById('lb-prev').addEventListener('click', () => showSlide(lbIdx - 1));
document.getElementById('lb-next').addEventListener('click', () => showSlide(lbIdx + 1));
document.getElementById('lb-close').addEventListener('click', closeLightbox);
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  showSlide(lbIdx - 1);
  if (e.key === 'ArrowRight') showSlide(lbIdx + 1);
  if (e.key === 'Escape')     closeLightbox();
});

/* ══════════════════════════════════════════
   BIDIRECTIONAL FADE-IN / FADE-OUT
══════════════════════════════════════════ */
let lastScrollY = window.scrollY;
let scrollDir   = 0; // +1 = down, -1 = up

window.addEventListener('scroll', () => {
  scrollDir   = window.scrollY > lastScrollY ? 1 : -1;
  lastScrollY = window.scrollY;
}, { passive: true });

const fadeObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('exit-up');
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
        if (scrollDir >= 0) {
          entry.target.classList.add('exit-up');
        } else {
          entry.target.classList.remove('exit-up');
        }
      }
    });
  },
  { threshold: [0, 0.08], rootMargin: "-18% 0px -18% 0px" }
);

const chapterObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('exit-up');
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
        if (scrollDir >= 0) {
          entry.target.classList.add('exit-up');
        } else {
          entry.target.classList.remove('exit-up');
        }
      }
    });
  },
  { threshold: [0, 0.08], rootMargin: "-18% 0px -40% 0px" }
);

document.querySelectorAll('.fade-in:not(.fade-chapter)').forEach(el => fadeObserver.observe(el));
document.querySelectorAll('.fade-chapter').forEach(el => chapterObserver.observe(el));
