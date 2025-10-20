document.addEventListener('DOMContentLoaded', function() {
  const productInfo = document.querySelector('product-info');
  const stickyButton = document.querySelector('.sticky-add-to-cart');
  const stickyForm = document.querySelector('#sticky-product-form');
  const originalForm = document.querySelector('product-form form');
  const originalButton = originalForm.querySelector('[type="submit"]');
  const cartDrawer = document.querySelector('cart-drawer');

  if (!productInfo || !stickyButton || !stickyForm || !originalForm || !originalButton || !cartDrawer) return;

  // Simple function to sync variant ID only
  function syncVariantId() {
    const mainVariantInput = originalForm.querySelector('input[name="id"]');
    const stickyVariantInput = stickyForm.querySelector('input[name="id"]');
    
    if (mainVariantInput && stickyVariantInput) {
      stickyVariantInput.value = mainVariantInput.value;
    }
  }

  // Listen for variant changes in the original form
  originalForm.addEventListener('change', function(event) {
    const target = event.target;
    
    // Update sticky form's variant ID when main form variant changes
    if (target.type === 'radio' || (target.tagName === 'SELECT' && target.name.startsWith('options'))) {
      setTimeout(() => {
        syncVariantId();
      }, 50);
    }
  });
  
  // Also listen to variant change pub/sub events
  if (typeof subscribe !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
      // Use the variant ID from the event directly (most reliable)
      if (event.data.variant && event.data.variant.id) {
        const variantId = event.data.variant.id.toString();
        const stickyVariantInput = stickyForm.querySelector('input[name="id"]');
        if (stickyVariantInput) {
          stickyVariantInput.value = variantId;
        }
      }
    });
  }

  // Handle sticky form submission
  stickyForm.addEventListener('submit', function(event) {
    event.preventDefault();
    syncVariantId();
    
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

  // Initial sync on page load
  syncVariantId();

  // Initial check
  updateStickyButton();

  // Update on scroll
  window.addEventListener('scroll', updateStickyButton);
}); 