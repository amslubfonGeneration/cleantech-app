// Navbar scroll effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) navbar.classList.add('navbar-scrolled');
  else navbar.classList.remove('navbar-scrolled');
});

// Appear on scroll
const fadeElements = document.querySelectorAll('.fade-in');
const checkScroll = () => {
  fadeElements.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add('visible');
  });
};
window.addEventListener('scroll', checkScroll);
window.addEventListener('load', checkScroll);

// SweetAlert2 helper for forms (optional enhancement)
document.querySelectorAll('form').forEach(f => {
  f.addEventListener('submit', () => {
    if (window.Swal) Swal.fire({ title: 'Traitement...', text: 'Merci de patienter', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  });
});

// Script pour l'effet de scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});