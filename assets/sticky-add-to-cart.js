document.addEventListener('DOMContentLoaded', function() {
  const stickyButton = document.querySelector('.sticky-add-to-cart');
  const productSection = document.querySelector('product-info');
  
  if (!stickyButton || !productSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        stickyButton.style.display = 'block';
      } else {
        stickyButton.style.display = 'none';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '-100px 0px 0px 0px'
  });

  observer.observe(productSection);
}); 