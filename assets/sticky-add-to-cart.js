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

  // Function to mirror main button state and text to sticky button
  function mirrorButtonState() {
    const stickyButtonElement = stickyForm.querySelector('button[type="submit"]');
    const stickyButtonTextSpan = stickyButtonElement?.querySelector('span');
    
    if (!originalButton || !stickyButtonElement || !stickyButtonTextSpan) return;
    
    // Check if main button is disabled (check both attribute and property)
    const isMainButtonDisabled = originalButton.hasAttribute('disabled') || originalButton.disabled;
    
    // Mirror disabled state
    if (isMainButtonDisabled) {
      stickyButtonElement.setAttribute('disabled', 'disabled');
      stickyButtonElement.disabled = true;
    } else {
      stickyButtonElement.removeAttribute('disabled');
      stickyButtonElement.disabled = false;
    }
    
    // Mirror button text
    const mainButtonTextSpan = originalButton.querySelector('span');
    if (mainButtonTextSpan) {
      stickyButtonTextSpan.textContent = mainButtonTextSpan.textContent.trim();
    }
  }

  // Listen for variant changes in the original form
  originalForm.addEventListener('change', function(event) {
    const target = event.target;
    
    // Update sticky form's variant ID when main form variant changes
    if (target.type === 'radio' || (target.tagName === 'SELECT' && target.name.startsWith('options'))) {
      setTimeout(() => {
        syncVariantId();
        // Also mirror button state after syncing variant ID
        mirrorButtonState();
      }, 50);
      setTimeout(() => {
        mirrorButtonState();
      }, 200);
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
      
      // Update sticky button state based on variant availability
      const stickyButtonElement = stickyForm.querySelector('button[type="submit"]');
      const stickyButtonTextSpan = stickyButtonElement?.querySelector('span');
      
      if (event.data.variant && stickyButtonElement && stickyButtonTextSpan) {
        const variant = event.data.variant;
        const isAvailable = variant.available !== false;
        
        // Update disabled state based on variant availability
        if (isAvailable) {
          stickyButtonElement.removeAttribute('disabled');
          stickyButtonElement.disabled = false;
        } else {
          stickyButtonElement.setAttribute('disabled', 'disabled');
          stickyButtonElement.disabled = true;
        }
      }
      
      // Mirror the main button's state and text to the sticky button
      // Use multiple attempts with increasing delays to ensure main button has been updated
      setTimeout(() => {
        mirrorButtonState();
      }, 50);
      setTimeout(() => {
        mirrorButtonState();
      }, 150);
      setTimeout(() => {
        mirrorButtonState();
      }, 300);
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
  
  // Initial button state mirror (after a short delay to ensure main button is ready)
  setTimeout(() => {
    mirrorButtonState();
  }, 100);

  // Initial check
  updateStickyButton();

  // Update on scroll
  window.addEventListener('scroll', updateStickyButton);
}); 