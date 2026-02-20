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
    
    // Mirror disabled state - ensure it's explicitly set
    if (isMainButtonDisabled) {
      stickyButtonElement.setAttribute('disabled', 'disabled');
      stickyButtonElement.disabled = true;
    } else {
      stickyButtonElement.removeAttribute('disabled');
      stickyButtonElement.disabled = false;
    }
    
    // Mirror button text - copy from main button
    const mainButtonTextSpan = originalButton.querySelector('span');
    if (mainButtonTextSpan) {
      const mainButtonText = mainButtonTextSpan.textContent.trim();
      // Always update text to ensure it stays in sync
      // The check for difference is removed to ensure updates happen even if text appears the same
      stickyButtonTextSpan.textContent = mainButtonText;
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
        // Ensure it's explicitly disabled for sold out variants
        // This is the most important part - the button must be disabled for sold out variants
        if (isAvailable) {
          stickyButtonElement.removeAttribute('disabled');
          stickyButtonElement.disabled = false;
        } else {
          stickyButtonElement.setAttribute('disabled', 'disabled');
          stickyButtonElement.disabled = true;
        }
        
        // Try to get button text directly from the fetched HTML in the event
        // This is more reliable than copying from the main button which might not be updated yet
        if (event.data.html) {
          const sectionId = event.data.sectionId || document.querySelector('product-info')?.dataset?.section;
          if (sectionId) {
            const submitButtonInHtml = event.data.html.getElementById(`ProductSubmitButton-${sectionId}`);
            if (submitButtonInHtml) {
              const buttonTextSpanInHtml = submitButtonInHtml.querySelector('span');
              if (buttonTextSpanInHtml) {
                const fetchedText = buttonTextSpanInHtml.textContent.trim();
                const soldOutText = window.variantStrings?.soldOut || 'Sold out';
                
                // Only update if variant is available OR if HTML shows sold out (to handle sold out variants)
                // This matches the logic in product-info.js
                if (variant && variant.available && fetchedText === soldOutText) {
                  // Don't update - keep current text to avoid flash (same logic as product-info.js)
                } else {
                  // Update text from fetched HTML
                  stickyButtonTextSpan.textContent = fetchedText;
                }
              }
            }
          }
        }
      }
      
      // Also mirror from main button as backup (in case HTML method didn't work)
      mirrorButtonState();
      
      // Always mirror the main button's state and text to the sticky button
      // Use multiple attempts with increasing delays to ensure main button has been updated
      setTimeout(() => {
        mirrorButtonState();
      }, 100);
      setTimeout(() => {
        mirrorButtonState();
      }, 300);
      setTimeout(() => {
        mirrorButtonState();
      }, 600);
      setTimeout(() => {
        mirrorButtonState();
      }, 1000);
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
  setTimeout(() => {
    mirrorButtonState();
  }, 500);

  // Initial check
  updateStickyButton();

  // Update on scroll
  window.addEventListener('scroll', updateStickyButton);
}); 