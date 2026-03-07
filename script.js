document.getElementById('year').textContent = new Date().getFullYear();
if (window.lucide) window.lucide.createIcons();
window.addEventListener('load', () => window.lucide && window.lucide.createIcons());
