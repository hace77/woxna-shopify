if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        
        // Initialize cart component asynchronously
        this.initializeCart();
        
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      async initializeCart() {
        this.cart = await this.findCartComponent();
        console.log('Cart component initialized:', this.cart);
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
        
        // Prevent submission if a disabled variant is selected
        const selectedVariantInput = this.form.querySelector('input[name="id"]');
        const selectedRadio = this.form.querySelector('input[type="radio"]:checked.js-disabled-variant');
        if (selectedRadio && selectedRadio.classList.contains('js-disabled-variant')) {
          // Don't submit form if disabled variant is selected
          return;
        }

        // Wait for cart to be initialized
        if (!this.cart) {
          await this.initializeCart();
        }

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text, customText = null) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          // Use custom text (variant button text) if available, otherwise use default sold out text
          this.submitButtonText.textContent = customText || text || window.variantStrings.soldOut;
        } else {
          this.submitButton.removeAttribute('disabled');
          // Use custom text (variant button text) if available, otherwise fall back to default
          this.submitButtonText.textContent = customText || window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }

      findCartComponent() {
        // First try to find cart drawer
        let cart = document.querySelector('cart-drawer');
        
        // If cart drawer is not found, wait a bit and try again
        if (!cart) {
          // Check if we should be using cart drawer based on theme settings
          const cartType = window.themeSettings?.cart_type || 'drawer';
          if (cartType === 'drawer') {
            // Wait for cart drawer to be available
            return new Promise((resolve) => {
              const checkForCartDrawer = () => {
                cart = document.querySelector('cart-drawer');
                if (cart) {
                  resolve(cart);
                } else {
                  setTimeout(checkForCartDrawer, 100);
                }
              };
              checkForCartDrawer();
            });
          }
        }
        
        // Fallback to cart notification if cart drawer is not available
        return cart || document.querySelector('cart-notification');
      }
    }
  );
}

// Product Page Upsell Form Handler
document.addEventListener('DOMContentLoaded', function() {
  const upsellForms = document.querySelectorAll('[data-product-page-upsell-form]');
  
  upsellForms.forEach(form => {
    form.addEventListener('submit', handleProductPageUpsellSubmit);
  });
});

async function handleProductPageUpsellSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const button = form.querySelector('[data-product-page-upsell-button]');
  const originalText = button.textContent;

  // Disable button and show loading state
  button.disabled = true;
  button.textContent = 'Adding...';

  try {
    const variantId = form.querySelector('input[name="id"]').value;
    const quantity = form.querySelector('input[name="quantity"]').value;
    
    // Same approach as your existing cart system
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', quantity);
    formData.append('sections', 'cart-drawer,cart-icon-bubble');
    formData.append('sections_url', window.location.pathname);
    
    const response = await fetch(window.routes.cart_add_url, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.status) {
      throw new Error(result.description || 'Failed to add to cart');
    }
    
    // Update cart components (same as your existing system)
    const cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    if (cart && cart.renderContents) {
      cart.renderContents(result);
    }
    
    // Show success message
    button.textContent = 'Added!';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1000);
    
  } catch (error) {
    console.error('Product page upsell error:', error);
    button.textContent = 'Error - Try Again';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }
}
