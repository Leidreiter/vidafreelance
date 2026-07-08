const btnMenu = document.getElementById('btn-menu');
const sidebar = document.getElementById('sidebar');

btnMenu.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

// Cerrar sidebar al hacer clic en un enlace
const sidebarLinks = sidebar.querySelectorAll('a');
sidebarLinks.forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
});

// Fade in up para recursos
const recursosContainer = document.querySelector('.recursos-container');
if (recursosContainer) {
  const recursosObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.recurso');
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.add('fade-up');
          }, i * 200);
        });
        recursosObserver.disconnect();
      }
    });
  });
  recursosObserver.observe(recursosContainer);
}