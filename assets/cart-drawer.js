class CartDrawer extends HTMLElement {
  constructor() {
    super();
    console.log('Cart drawer constructor called');

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    this.setupUpsellForms();
    
    // Also listen for form submissions at document level as fallback
    document.addEventListener('submit', (e) => {
      if (e.target.closest('[data-upsell-form]')) {
        console.log('Document-level upsell form prevention');
        e.preventDefault();
        e.stopPropagation();
        this.handleUpsellSubmit(e);
        return false;
      }
    }, true);
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  setupUpsellForms() {
    const upsellForms = this.querySelectorAll('[data-upsell-form]');
    console.log('Setting up upsell forms, found:', upsellForms.length);
    upsellForms.forEach((form, index) => {
      console.log('Setting up form', index, form);
      // Add event listener with capture to ensure it runs first
      form.addEventListener('submit', this.handleUpsellSubmit.bind(this), true);
      // Also add a backup prevention
      form.addEventListener('submit', (e) => {
        console.log('Backup submit prevention');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
    });
  }

  async handleUpsellSubmit(event) {
    console.log('Upsell form submit handler called!');
    event.preventDefault();
    
    const form = event.target;
    const button = form.querySelector('[data-upsell-button]');
    const originalText = button.textContent;

    // Disable button and show loading state
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
      // Use the exact same approach as the working product-form.js
      const variantId = form.querySelector('input[name="id"]').value;
      const quantity = form.querySelector('input[name="quantity"]').value;
      
      console.log('Adding variant:', variantId, 'quantity:', quantity);
      
      // Create the same config that product-form.js uses
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', quantity);
      formData.append('sections', 'cart-drawer,cart-icon-bubble');
      formData.append('sections_url', window.location.pathname);
      
      const config = {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: formData
      };
      
      console.log('Using same config as product-form.js');
      
      // Use the same fetch approach as product-form.js
      const response = await fetch(window.routes.cart_add_url, config);
      const result = await response.json();
      
      if (result.status) {
        // Handle error like product-form.js does
        console.log('Cart add error:', result);
        throw new Error(result.description || 'Failed to add to cart');
      } else {
        console.log('Cart add successful:', result);
        // Use the same renderContents approach as product-form.js
        this.renderContents(result);
      }
      
      // Show success message and update button
      button.textContent = 'Added!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        // The cart drawer should now show the updated contents
        // and the upsell section should be hidden since the product is now in cart
      }, 1000);
      
    } catch (error) {
      console.error('Upsell form submission error:', error);
      button.textContent = 'Error - Try Again';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
