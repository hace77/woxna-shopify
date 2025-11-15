if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
      }

      hide() {
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.showActiveMedia();
      }

      showActiveMedia() {
        const mediaId = this.openedBy.getAttribute('data-media-id');
        if (!mediaId) {
          console.warn('ProductModal: No media-id found on opener');
          return;
        }

        // Remove active class from all media item wrappers
        // DO NOT set inline display styles - let CSS handle visibility
        this.querySelectorAll('.product-media-modal__content .product__media-item').forEach((wrapper) => {
          wrapper.classList.remove('active');
        });

        // Find the element with matching data-media-id (could be img, deferred-media, or wrapper)
        let mediaElement = this.querySelector(`.product-media-modal__content [data-media-id="${mediaId}"]`);
        
        if (!mediaElement) {
          console.warn('ProductModal: Could not find media with id', mediaId);
          // Fallback: show first available media item
          const firstWrapper = this.querySelector('.product-media-modal__content .product__media-item');
          if (firstWrapper) {
            mediaElement = firstWrapper.querySelector('[data-media-id]') || firstWrapper;
          }
        }

        if (!mediaElement) {
          console.error('ProductModal: No media items found in modal');
          return;
        }

        // Find the parent .product__media-item wrapper (the element that needs .active class)
        let activeWrapper = mediaElement.closest('.product__media-item');
        
        // If mediaElement itself is the wrapper (for videos/models), use it directly
        if (!activeWrapper && mediaElement.classList.contains('product__media-item')) {
          activeWrapper = mediaElement;
        }

        if (!activeWrapper) {
          console.error('ProductModal: Could not find .product__media-item wrapper for media', mediaId);
          return;
        }

        // Load full-resolution image for modal
        const img = activeWrapper.querySelector('img');
        if (img && img.srcset) {
          // Update sizes to 100vw FIRST - this tells browser to select largest image
          img.sizes = '100vw';
          
          // Parse srcset to find the ORIGINAL image (last entry, full resolution)
          // Format: "url widthw" - the last entry is usually the original without width constraint
          const srcset = img.srcset;
          const srcsetParts = srcset.split(',').map(p => p.trim());
          
          // Get the last entry which should be the original image
          // Format: "{{ media.preview_image | image_url }} {{ media.preview_image.width }}w"
          const lastPart = srcsetParts[srcsetParts.length - 1];
          const originalMatch = lastPart.match(/^(\S+)\s+(\d+)w$/);
          
          if (originalMatch) {
            const originalUrl = originalMatch[1];
            const originalWidth = parseInt(originalMatch[2]);
            
            // Use the original URL as-is - Shopify's image_url without width returns original
            // The URL from srcset should already be the full resolution image
            console.log('ProductModal: Loading original image', originalUrl, 'width:', originalWidth);
            
            // Force load the original image immediately
            img.src = originalUrl;
            img.srcset = `${originalUrl} ${originalWidth}w`;
            img.sizes = '100vw';
            
            // Also update the currentSrc to ensure browser uses it
            if (img.complete) {
              // Image already loaded, trigger a refresh
              const currentSrc = img.currentSrc || img.src;
              if (currentSrc !== originalUrl) {
                img.src = originalUrl;
              }
            }
          } else {
            // Fallback: find largest from srcset
            let largestUrl = '';
            let largestWidth = 0;
            
            srcsetParts.forEach(part => {
              const match = part.match(/(\S+)\s+(\d+)w/);
              if (match) {
                const width = parseInt(match[2]);
                if (width > largestWidth) {
                  largestWidth = width;
                  largestUrl = match[1];
                }
              }
            });
            
            if (largestUrl) {
              img.src = largestUrl;
              img.srcset = `${largestUrl} ${largestWidth}w`;
              img.sizes = '100vw';
            }
          }
        }

        // Add active class - CSS will handle visibility
        activeWrapper.classList.add('active');

        // Scroll the wrapper into view
        activeWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Handle scrolling for horizontal layout
        const container = this.querySelector('[role="document"]');
        if (container && activeWrapper.width) {
          container.scrollLeft = (activeWrapper.width - container.clientWidth) / 2;
        }

        // Handle deferred media (videos/models)
        const activeMediaTemplate = activeWrapper.querySelector('template');
        const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
        
        if (
          (activeWrapper.nodeName == 'DEFERRED-MEDIA' || activeWrapper.querySelector('deferred-media')) &&
          activeMediaContent &&
          activeMediaContent.querySelector('.js-youtube')
        ) {
          const deferredMedia = activeWrapper.nodeName == 'DEFERRED-MEDIA' 
            ? activeWrapper 
            : activeWrapper.querySelector('deferred-media');
          if (deferredMedia && deferredMedia.loadContent) {
            deferredMedia.loadContent();
          }
        }
      }
    }
  );
}
