document.addEventListener('DOMContentLoaded', function() {
  const productInfo = document.querySelector('product-info');
  const stickyButton = document.querySelector('.sticky-add-to-cart');
  const stickyForm = document.querySelector('#sticky-product-form');
  const originalForm = document.querySelector('product-form form');
  const originalButton = originalForm?.querySelector('[type="submit"]');
  const cartDrawer = document.querySelector('cart-drawer');

  if (!productInfo || !stickyButton || !stickyForm || !originalForm || !originalButton || !cartDrawer) return;

  const stickyButtonElement = stickyForm.querySelector('button[type="submit"]');
  const stickyButtonTextSpan = stickyButtonElement?.querySelector('span');
  const stickyVariantLabel = stickyButton.querySelector('[data-sticky-variant]');
  const stickyPrice = stickyButton.querySelector('[data-sticky-price]');

  function getVariantLabel(variant) {
    if (!variant) return '';

    if (Array.isArray(variant.options) && variant.options.length) {
      const optionsLabel = variant.options
        .map((option) => (option == null ? '' : String(option).trim()))
        .filter((option) => option && option !== 'Default Title')
        .join(' / ');

      if (optionsLabel) return optionsLabel;
    }

    const title = variant.title ? String(variant.title).trim() : '';
    if (!title || title === 'Default Title') return '';

    return title;
  }

  function updateStickyVariantLabel(variant) {
    if (!stickyVariantLabel) return;

    const label = getVariantLabel(variant);
    stickyVariantLabel.textContent = label;
    stickyVariantLabel.classList.toggle('hidden', !label);
  }

  function updateStickyPrice(html, sectionId) {
    if (!stickyPrice || !html || !sectionId) return;

    const priceSource = html.getElementById(`price-${sectionId}`);
    if (!priceSource) return;

    const priceItem =
      priceSource.querySelector('.price-item--sale') ||
      priceSource.querySelector('.price-item--regular') ||
      priceSource.querySelector('.price-item');

    if (!priceItem) return;

    stickyPrice.textContent = priceItem.textContent.trim();
  }

  function syncVariantId() {
    const mainVariantInput = originalForm.querySelector('input[name="id"]');
    const stickyVariantInput = stickyForm.querySelector('input[name="id"]');

    if (mainVariantInput && stickyVariantInput) {
      stickyVariantInput.value = mainVariantInput.value;
    }
  }

  function mirrorButtonState() {
    if (!originalButton || !stickyButtonElement || !stickyButtonTextSpan) return;

    const isMainButtonDisabled = originalButton.hasAttribute('disabled') || originalButton.disabled;

    if (isMainButtonDisabled) {
      stickyButtonElement.setAttribute('disabled', 'disabled');
      stickyButtonElement.disabled = true;
    } else {
      stickyButtonElement.removeAttribute('disabled');
      stickyButtonElement.disabled = false;
    }

    const mainButtonTextSpan = originalButton.querySelector('span');
    if (mainButtonTextSpan) {
      stickyButtonTextSpan.textContent = mainButtonTextSpan.textContent.trim();
    }
  }

  originalForm.addEventListener('change', function(event) {
    const target = event.target;

    if (target.type === 'radio' || (target.tagName === 'SELECT' && target.name.startsWith('options'))) {
      setTimeout(() => {
        syncVariantId();
        mirrorButtonState();
      }, 50);
      setTimeout(() => {
        mirrorButtonState();
      }, 200);
    }
  });

  if (typeof subscribe !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
      const variant = event.data?.variant;
      const sectionId = event.data?.sectionId || productInfo.dataset?.section;

      if (variant?.id) {
        const stickyVariantInput = stickyForm.querySelector('input[name="id"]');
        if (stickyVariantInput) {
          stickyVariantInput.value = variant.id.toString();
        }
        updateStickyVariantLabel(variant);
      }

      updateStickyPrice(event.data?.html, sectionId);

      if (variant && stickyButtonElement && stickyButtonTextSpan) {
        const isAvailable = variant.available !== false;

        if (isAvailable) {
          stickyButtonElement.removeAttribute('disabled');
          stickyButtonElement.disabled = false;
        } else {
          stickyButtonElement.setAttribute('disabled', 'disabled');
          stickyButtonElement.disabled = true;
        }

        if (event.data?.html && sectionId) {
          const submitButtonInHtml = event.data.html.getElementById(`ProductSubmitButton-${sectionId}`);
          if (submitButtonInHtml) {
            const buttonTextSpanInHtml = submitButtonInHtml.querySelector('span');
            if (buttonTextSpanInHtml) {
              const fetchedText = buttonTextSpanInHtml.textContent.trim();
              const soldOutText = window.variantStrings?.soldOut || 'Sold out';

              if (!(variant.available && fetchedText === soldOutText)) {
                stickyButtonTextSpan.textContent = fetchedText;
              }
            }
          }
        }
      }

      mirrorButtonState();

      setTimeout(() => {
        mirrorButtonState();
      }, 100);
      setTimeout(() => {
        mirrorButtonState();
      }, 300);
    });
  }

  stickyForm.addEventListener('submit', function(event) {
    event.preventDefault();
    syncVariantId();
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

  syncVariantId();

  setTimeout(() => {
    mirrorButtonState();
  }, 100);
  setTimeout(() => {
    mirrorButtonState();
  }, 500);

  updateStickyButton();
  window.addEventListener('scroll', updateStickyButton);
});
