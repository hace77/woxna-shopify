/**
 * Variant Text Section Handler
 * Updates standalone variant text sections when variants change
 */

if (!customElements.get('variant-text-section')) {
  customElements.define(
    'variant-text-section',
    class VariantTextSection extends HTMLElement {
      constructor() {
        super();
        this.sectionId = this.dataset.sectionId;
        this.abortController = null;
      }

      connectedCallback() {
        // Subscribe to variant change events
        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.variantChange,
          this.handleVariantChange.bind(this)
        );
      }

      disconnectedCallback() {
        if (this.onVariantChangeUnsubscriber) {
          this.onVariantChangeUnsubscriber();
        }
      }

      handleVariantChange({ data: { variant } }) {
        if (!variant) return;
        
        // Fetch the updated section content
        this.updateSection(variant.id);
      }

      updateSection(variantId) {
        // Cancel any pending requests
        this.abortController?.abort();
        this.abortController = new AbortController();

        // Build the URL to fetch just this section with the new variant
        const url = `${window.location.pathname}?variant=${variantId}&section_id=${this.sectionId}`;

        // Get the content container
        const contentContainer = this.querySelector('.rich-text__blocks');
        if (!contentContainer) return;

        // Fade out
        contentContainer.style.transition = 'opacity 0.2s ease';
        contentContainer.style.opacity = '0';

        fetch(url, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            // Parse the response
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            
            // Find the updated content
            const newContent = html.querySelector('.variant-text-section .rich-text__blocks');
            
            if (newContent) {
              // Update the content
              contentContainer.innerHTML = newContent.innerHTML;
            }
            
            // Fade back in
            contentContainer.style.opacity = '1';
          })
          .catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Error updating variant text section:', error);
              // Fade back in even on error
              contentContainer.style.opacity = '1';
            }
          });
      }
    }
  );
}

