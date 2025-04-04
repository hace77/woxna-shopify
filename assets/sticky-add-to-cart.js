document.addEventListener('DOMContentLoaded', function() {
  console.log('Sticky cart: DOM loaded');
  
  const productInfo = document.querySelector('product-info');
  const stickyButton = document.querySelector('.sticky-add-to-cart');

  if (!productInfo || !stickyButton) return;

  console.log('Sticky cart: elements found', {
    productInfo: productInfo,
    stickyButton: stickyButton
  });

  function updateStickyButton() {
    const productInfoRect = productInfo.getBoundingClientRect();
    const isProductInfoVisible = productInfoRect.bottom > 0;
    
    if (!isProductInfoVisible) {
      stickyButton.style.display = 'block';
    } else {
      stickyButton.style.display = 'none';
    }
  }

  // Initial check
  updateStickyButton();

  // Update on scroll
  window.addEventListener('scroll', updateStickyButton);
}); 