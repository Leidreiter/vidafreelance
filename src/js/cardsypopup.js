// -------- POPUPS --------
const cards = document.querySelectorAll('.card');
const popups = document.querySelectorAll('.popup');
const closeBtns = document.querySelectorAll('.popup-close');

let currentPopupIndex = -1;
let popupTransitionTimer = null;

// Helper seguro para seleccionar la pista del carrusel (coincida por id o clase)
let carouselTrack = document.getElementById('carouselTrack') || document.querySelector('.carousel-track');
const carouselWrapper = document.querySelector('.carousel-wrapper');
const carouselControls = document.querySelectorAll('.carousel-control');

let isCarouselManual = false;
let manualOffset = 0;
let manualResumeTimeout = null;

if (!carouselTrack) {
  console.error('carouselTrack no encontrado. Asegurate de tener <div class="carousel-track"> o id="carouselTrack" en el HTML.');
} else {
  console.log('carouselTrack encontrado:', carouselTrack);
}

// Crear botones de navegación
const navPrev = document.createElement('button');
navPrev.className = 'popup-nav popup-prev';
navPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
navPrev.setAttribute('aria-label', 'Capítulo anterior');

const navNext = document.createElement('button');
navNext.className = 'popup-nav popup-next';
navNext.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
navNext.setAttribute('aria-label', 'Capítulo siguiente');

document.body.appendChild(navPrev);
document.body.appendChild(navNext);

function finishPopupTransition() {
  if (popupTransitionTimer) {
    clearTimeout(popupTransitionTimer);
    popupTransitionTimer = null;
  }
  popups.forEach(p => p.classList.remove('active', 'fade-out'));
}

function openPopup(index) {
  if (index < 0 || index >= popups.length) return;
  finishPopupTransition();
  currentPopupIndex = index;
  popups[currentPopupIndex].classList.add('active');
  updateNavButtons();
  pauseCarousel();
}

function closeCurrentPopup() {
  if (currentPopupIndex < 0 || popupTransitionTimer) return;
  const popup = popups[currentPopupIndex];
  popup.classList.add('fade-out');
  popupTransitionTimer = setTimeout(() => {
    popups.forEach(p => p.classList.remove('active', 'fade-out'));
    currentPopupIndex = -1;
    updateNavButtons();
    resumeCarousel();
    popupTransitionTimer = null;
  }, 250);
}

function navigatePopup(direction) {
  if (currentPopupIndex < 0 || popupTransitionTimer) return;
  const nextIndex = currentPopupIndex + (direction === 'next' ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= popups.length) return;
  const prevPopup = popups[currentPopupIndex];
  prevPopup.classList.add('fade-out');
  popupTransitionTimer = setTimeout(() => {
    prevPopup.classList.remove('active', 'fade-out');
    currentPopupIndex = nextIndex;
    popups[currentPopupIndex].classList.add('active');
    updateNavButtons();
    popupTransitionTimer = null;
  }, 250);
}

function updateNavButtons() {
  const isOpen = currentPopupIndex >= 0;
  navPrev.classList.toggle('visible', isOpen && currentPopupIndex > 0);
  navNext.classList.toggle('visible', isOpen && currentPopupIndex < popups.length - 1);
}

// Abrir popup
if (cards && cards.length) {
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-popup');
      const popup = document.getElementById(id);

      if (!popup) {
        console.warn(`Popup con id "${id}" no encontrado.`);
        return;
      }

      // Encontrar el índice
      const index = Array.from(popups).indexOf(popup);
      if (index >= 0) openPopup(index);
    });

    card.addEventListener('mouseenter', () => {
      pauseCarousel();
    });
    card.addEventListener('mouseleave', () => {
      const anyOpen = document.querySelector('.popup.active');
      if (!anyOpen) resumeCarousel();
    });
  });
} else {
  console.warn('No se encontraron .card en el DOM.');
}

// Cerrar con botón close (si existe)
if (closeBtns && closeBtns.length) {
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeCurrentPopup();
    });
  });
}

// Cerrar clickeando fuera del contenido
popups.forEach(p => {
  p.addEventListener('click', e => {
    if (e.target === p) {
      closeCurrentPopup();
    }
  });
});

// Navegación con botones
navPrev.addEventListener('click', () => navigatePopup('prev'));
navNext.addEventListener('click', () => navigatePopup('next'));

// Cerrar con tecla Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCurrentPopup();
  }
  if (e.key === 'ArrowLeft' && currentPopupIndex >= 0) {
    navigatePopup('prev');
  }
  if (e.key === 'ArrowRight' && currentPopupIndex >= 0) {
    navigatePopup('next');
  }
});

// -------- CARRUSEL CONTROL DINÁMICO --------
function pauseCarousel() {
  if (!carouselTrack || isCarouselManual) return;
  const hasAnim = getComputedStyle(carouselTrack).animationName !== 'none';
  if (hasAnim) {
    carouselTrack.style.animationPlayState = 'paused';
    console.log('Carrusel pausado');
  }
}

function resumeCarousel() {
  if (!carouselTrack || isCarouselManual) return;
  carouselTrack.style.animationPlayState = 'running';
  console.log('Carrusel reanudado');
}

// --- PAUSA EN HOVER SOBRE EL WRAPPER (FIABLE) ---
if (carouselWrapper) {
  carouselWrapper.addEventListener('mouseenter', pauseCarousel);
  carouselWrapper.addEventListener('mouseleave', () => {
    const anyOpen = document.querySelector('.popup.active');
    if (!anyOpen) resumeCarousel();
  });
  console.log('Listeners de hover agregados en .carousel-wrapper');
} else {
  console.warn('.carousel-wrapper no encontrado; se usarán listeners en las cards como fallback.');
}

// -------- CONTROLES MANUALES DEL CARRUSEL --------
if (carouselControls && carouselControls.length) {
  carouselControls.forEach(control => {
    control.addEventListener('click', () => {
      const direction = control.dataset.direction === 'prev' ? 'prev' : 'next';
      moveCarousel(direction);
    });
  });
}

function moveCarousel(direction = 'next') {
  if (!carouselTrack) return;
  lockCarouselAnimation();

  const step = getCarouselStep();
  if (!step) return;

  manualOffset += direction === 'prev' ? step : -step;

  const overflow = Math.max(0, carouselTrack.scrollWidth - (carouselWrapper?.clientWidth || 0));
  const maxNegative = -overflow;
  if (manualOffset < maxNegative) {
    manualOffset = maxNegative;
  } else if (manualOffset > 0) {
    manualOffset = 0;
  }

  carouselTrack.style.transform = `translateX(${manualOffset}px)`;
  scheduleAutoResume();
}

function lockCarouselAnimation() {
  if (!carouselTrack || isCarouselManual) return;

  manualOffset = getCurrentTranslateX(carouselTrack);
  carouselTrack.style.animation = 'none';
  carouselTrack.classList.add('is-manual');
  carouselTrack.style.transform = `translateX(${manualOffset}px)`;
  isCarouselManual = true;
  console.log('Carrusel bloqueado en modo manual');
}

function scheduleAutoResume() {
  clearTimeout(manualResumeTimeout);
  manualResumeTimeout = setTimeout(() => {
    unlockCarouselAnimation();
  }, 4000);
}

function unlockCarouselAnimation() {
  if (!carouselTrack || !isCarouselManual) return;

  isCarouselManual = false;
  manualOffset = 0;
  carouselTrack.classList.remove('is-manual');
  carouselTrack.style.removeProperty('transform');
  carouselTrack.style.removeProperty('animation');
  carouselTrack.style.animationPlayState = 'running';
  console.log('Carrusel vuelve al modo automático');
}

function getCurrentTranslateX(element) {
  const style = window.getComputedStyle(element);
  const transform = style.transform;

  if (transform && transform !== 'none') {
    try {
      const MatrixCtor = window.DOMMatrixReadOnly || window.DOMMatrix || window.WebKitCSSMatrix;
      if (MatrixCtor) {
        const matrix = new MatrixCtor(transform);
        if (typeof matrix.m41 === 'number') return matrix.m41;
        if (typeof matrix.m13 === 'number') return matrix.m13;
      }
    } catch (error) {
      const match2d = transform.match(/matrix\(([^)]+)\)/);
      if (match2d) {
        const values = match2d[1].split(',').map(parseFloat);
        return values[4] || 0;
      }
      const match3d = transform.match(/matrix3d\(([^)]+)\)/);
      if (match3d) {
        const values = match3d[1].split(',').map(parseFloat);
        return values[12] || 0;
      }
    }
  }

  return 0;
}

function getCarouselStep() {
  if (!carouselTrack) return 0;
  const card = carouselTrack.querySelector('.card');
  const gapValue = parseFloat(getComputedStyle(carouselTrack).columnGap || getComputedStyle(carouselTrack).gap || '0');
  const cardWidth = card ? card.getBoundingClientRect().width : 0;
  return cardWidth + gapValue;
}

// -------- SWIPE TÁCTIL (MOBILE) --------
let startX = 0;
let currentX = 0;
let isDragging = false;

if (carouselWrapper && carouselTrack) {
  carouselWrapper.addEventListener('touchstart', onTouchStart, { passive: true });
  carouselWrapper.addEventListener('touchmove', onTouchMove, { passive: true });
  carouselWrapper.addEventListener('touchend', onTouchEnd);
}

function onTouchStart(e) {
  startX = e.touches[0].clientX;
  isDragging = true;
}

function onTouchMove(e) {
  if (!isDragging) return;
  currentX = e.touches[0].clientX;
}

function onTouchEnd() {
  if (!isDragging) return;

  const diff = currentX - startX;
  const threshold = 50;

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      moveCarousel('prev');
    } else {
      moveCarousel('next');
    }
  }

  isDragging = false;
  startX = 0;
  currentX = 0;
}

// -------- SWIPE TÁCTIL EN POPUPS --------
let popupSwipeStartX = 0;
let popupSwipeStartY = 0;

popups.forEach(p => {
  p.addEventListener('touchstart', e => {
    popupSwipeStartX = e.changedTouches[0].screenX;
    popupSwipeStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  p.addEventListener('touchend', e => {
    if (currentPopupIndex < 0) return;
    const diffX = e.changedTouches[0].screenX - popupSwipeStartX;
    const diffY = e.changedTouches[0].screenY - popupSwipeStartY;
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) navigatePopup('prev');
      else navigatePopup('next');
    }
  }, { passive: true });
});