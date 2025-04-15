document.addEventListener('DOMContentLoaded', function() {
  console.log('Sticky cart: DOM loaded');
  
  const productInfo = document.querySelector('product-info');
  const stickyButton = document.querySelector('.sticky-add-to-cart');
  const stickyForm = document.querySelector('#sticky-product-form');
  const originalForm = document.querySelector('product-form form');
  const originalButton = originalForm.querySelector('[type="submit"]');
  const stickySubmitButton = stickyForm.querySelector('[type="submit"]');
  const cartDrawer = document.querySelector('cart-drawer');

  if (!productInfo || !stickyButton || !stickyForm || !originalForm || !originalButton || !cartDrawer) return;

  console.log('Sticky cart: elements found', {
    productInfo: productInfo,
    stickyButton: stickyButton
  });

  // Sync variant selection between original and sticky forms
  function syncVariantSelection() {
    const originalSelects = originalForm.querySelectorAll('select[name^="options"]');
    const stickySelects = stickyForm.querySelectorAll('select[name^="options"]');

    originalSelects.forEach((select, index) => {
      const stickySelect = stickySelects[index];
      if (stickySelect) {
        stickySelect.value = select.value;
      }
    });

    // Update hidden variant ID input
    const variantId = originalForm.querySelector('input[name="id"]').value;
    stickyForm.querySelector('input[name="id"]').value = variantId;
  }

  // Listen for variant changes in the original form
  originalForm.addEventListener('change', function(event) {
    if (event.target.name.startsWith('options')) {
      syncVariantSelection();
    }
  });

  // Handle sticky form submission
  stickyForm.addEventListener('submit', function(event) {
    event.preventDefault();
    syncVariantSelection();
    
    // Trigger click on the original button
    originalButton.click();
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