/**
 * Variant Metafield Section Handler
 * Updates standalone variant metafield sections when variants change
 */

if (!customElements.get('variant-metafield-section')) {
  customElements.define(
    'variant-metafield-section',
    class VariantMetafieldSection extends HTMLElement {
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

        // Fade out
        this.style.transition = 'opacity 0.2s ease';
        this.style.opacity = '0';

        fetch(url, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            // Parse the response
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            
            // Find the updated section content (handles both page-width and page-width--full)
            const newContent = html.querySelector('.variant-metafield-section .page-width, .variant-metafield-section .page-width--full');
            
            if (newContent) {
              const currentContent = this.querySelector('.page-width, .page-width--full');
              
              if (currentContent) {
                // Update the content
                currentContent.innerHTML = newContent.innerHTML;
              }
            }
            
            // Fade back in
            this.style.opacity = '1';
          })
          .catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Error updating variant metafield section:', error);
              // Fade back in even on error
              this.style.opacity = '1';
            }
          });
      }
    }
  );
}

