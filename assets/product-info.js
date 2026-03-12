if (!customElements.get('product-info')) {
  customElements.define(
    'product-info',
    class ProductInfo extends HTMLElement {
      quantityInput = undefined;
      quantityForm = undefined;
      onVariantChangeUnsubscriber = undefined;
      cartUpdateUnsubscriber = undefined;
      abortController = undefined;
      pendingRequestUrl = null;
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];

      constructor() {
        super();

        this.quantityInput = this.querySelector('.quantity__input');
      }

      connectedCallback() {
        this.initializeProductSwapUtility();

        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.optionValueSelectionChange,
          this.handleOptionValueChange.bind(this)
        );

        this.initQuantityHandlers();
        
        // Handle clicks on disabled variant labels to show variant information
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(() => {
          this.initDisabledVariantClickHandlers();
        }, 200);
        
        // Filter media on initial load
        setTimeout(() => {
          this.filterMediaByVariantOptions();
          // Note: Modal content is NOT filtered - it shows all images regardless of variant
          // This prevents the white screen issue on mobile when opening the lightbox
        }, 100);
        
        this.dispatchEvent(new CustomEvent('product-info:loaded', { bubbles: true }));
      }

      initDisabledVariantClickHandlers() {
        // First, clean up any existing wrapper divs that might break CSS styling
        const existingWrappers = this.querySelectorAll('.disabled-variant-wrapper');
        existingWrappers.forEach((wrapper) => {
          const label = wrapper.querySelector('label');
          if (label && wrapper.parentNode) {
            wrapper.parentNode.insertBefore(label, wrapper);
            wrapper.remove();
          }
        });
        
        // Find all radio inputs with disabled class or attribute
        const allVariantInputs = this.querySelectorAll('input[type="radio"]');
        
        allVariantInputs.forEach((input) => {
          // Skip if already processed
          if (input.dataset.disabledClickHandler === 'true') return;
          
          // Check if this input represents a disabled/sold out variant
          const isDisabled = input.disabled || input.hasAttribute('disabled') || input.classList.contains('disabled');
          if (!isDisabled) return;
          
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (!label) return;
          
          // Mark that we've added handler
          input.dataset.disabledClickHandler = 'true';
          input.dataset.wasDisabled = 'true';
          
          // Remove disabled attribute but keep visual styling via class
          // This allows the label to be clickable while maintaining disabled appearance
          input.removeAttribute('disabled');
          input.disabled = false;
          input.classList.add('disabled');
          input.classList.add('js-disabled-variant');
          
          // Handler function for disabled variant clicks
          const handleDisabledVariantClick = (e) => {
            // Only handle if this is a disabled variant
            if (!input.classList.contains('js-disabled-variant')) {
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Visually mark this disabled variant as selected
            // Uncheck other options in the same group first
            const optionGroup = input.closest('fieldset') || input.closest('.product-form__input');
            if (optionGroup) {
              // Use a more robust method to find inputs with the same name
              // Get all radio inputs in the group and filter by name property
              const allRadioInputs = optionGroup.querySelectorAll('input[type="radio"]');
              allRadioInputs.forEach((otherInput) => {
                if (otherInput !== input && otherInput.name === input.name) {
                  otherInput.removeAttribute('checked');
                  otherInput.checked = false;
                }
              });
            }
            
            // Mark this input as checked
            input.setAttribute('checked', 'checked');
            input.checked = true;
            
            // Get current selected option values from variant-selects
            const variantSelects = this.querySelector('variant-selects');
            let selectedOptionValues = [];
            
            if (variantSelects) {
              // Get all currently selected inputs (including the one we just checked)
              const allSelected = variantSelects.querySelectorAll('select option[selected], fieldset input:checked');
              selectedOptionValues = Array.from(allSelected).map((el) => {
                return el.dataset.optionValueId || el.value;
              });
            } else {
              // Fallback: build from all checked inputs
              const allChecked = this.querySelectorAll('input[type="radio"]:checked');
              selectedOptionValues = Array.from(allChecked).map((el) => {
                return el.dataset.optionValueId || el.value;
              });
            }
            
            // Create a synthetic event to trigger variant change
            const syntheticEvent = {
              target: input,
              currentTarget: input,
              preventDefault: () => {},
              stopPropagation: () => {}
            };
            
            publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
              data: {
                event: syntheticEvent,
                target: input,
                selectedOptionValues: selectedOptionValues
              }
            });
          };
          
          // Add handler directly to label - now that input is not disabled, this should work
          // Use capture phase to ensure our handler runs first
          label.addEventListener('click', handleDisabledVariantClick, true);
          label.addEventListener('mousedown', handleDisabledVariantClick, true);
          
          // Make label appear clickable (but don't override CSS styling)
          label.style.cursor = 'pointer';
          label.style.pointerEvents = 'auto';
        });
      }

      getSelectedOptionValues() {
        // Get selected option values from variant-selects component if available
        const variantSelects = this.querySelector('variant-selects');
        if (variantSelects && variantSelects.selectedOptionValues) {
          return variantSelects.selectedOptionValues;
        }
        
        // Fallback: build from checked radio inputs
        const selectedValues = [];
        const radioInputs = this.querySelectorAll('input[type="radio"]:checked');
        radioInputs.forEach((input) => {
          selectedValues.push(input.value);
        });
        return selectedValues;
      }

      addPreProcessCallback(callback) {
        this.preProcessHtmlCallbacks.push(callback);
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;

        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber();
        this.cartUpdateUnsubscriber?.();
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push((html) =>
          html.querySelectorAll('.scroll-trigger').forEach((element) => element.classList.add('scroll-trigger--cancel'))
        );
        this.postProcessHtmlCallbacks.push((newNode) => {
          window?.Shopify?.PaymentButton?.init();
          window?.ProductModel?.loadShopifyXR();
        });
      }

      handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
        if (!this.contains(event.target)) return;

        this.resetProductFormState();

        const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;
        const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

        this.renderProductInfo({
          requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
          targetId: target.id,
          callback: shouldSwapProduct
            ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
            : this.handleUpdateProductInfo(productUrl),
        });
      }

      resetProductFormState() {
        const productForm = this.productForm;
        // Only disable the button, don't change text (it will be updated from fetched HTML)
        if (productForm?.submitButton) {
          productForm.submitButton.setAttribute('disabled', 'disabled');
        }
        productForm?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
          this.productModal?.remove();

          const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';
          const variant = this.getSelectedVariant(html.querySelector(selector));
          this.updateURL(productUrl, variant?.id);

          if (updateFullPage) {
            document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;

            HTMLUpdateUtility.viewTransition(
              document.querySelector('main'),
              html.querySelector('main'),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          } else {
            HTMLUpdateUtility.viewTransition(
              this,
              html.querySelector('product-info'),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          }
        };
      }

      renderProductInfo({ requestUrl, targetId, callback }) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        fetch(requestUrl, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            this.pendingRequestUrl = null;
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            callback(html);
          })
          .then(() => {
            // set focus to last clicked option value
            document.querySelector(`#${targetId}`)?.focus();
          })
          .catch((error) => {
            if (error.name === 'AbortError') {
              console.log('Fetch aborted by user');
            } else {
              console.error(error);
            }
          });
      }

      getSelectedVariant(productInfoNode) {
        const selectedVariant = productInfoNode.querySelector('variant-selects [data-selected-variant]')?.innerHTML;
        return !!selectedVariant ? JSON.parse(selectedVariant) : null;
      }

      buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
        const params = [];

        !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

        if (optionValues.length) {
          params.push(`option_values=${optionValues.join(',')}`);
        }

        return `${url}?${params.join('&')}`;
      }

      updateOptionValues(html) {
        const variantSelects = html.querySelector('variant-selects');
        if (variantSelects) {
          HTMLUpdateUtility.viewTransition(this.variantSelectors, variantSelects, this.preProcessHtmlCallbacks);
        }
      }

      handleUpdateProductInfo(productUrl) {
        return (html) => {
          const variant = this.getSelectedVariant(html);

          this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);
          
          // Re-initialize disabled variant click handlers after HTML update
          setTimeout(() => {
            this.initDisabledVariantClickHandlers();
          }, 200);

          if (!variant) {
            this.setUnavailable();
            return;
          }

          this.updateMedia(html, variant?.featured_media?.id);
          this.updateVariantMetafields(html);

          const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
            const source = html.getElementById(`${id}-${this.sectionId}`);
            const destination = this.querySelector(`#${id}-${this.dataset.section}`);
            if (source && destination) {
              destination.innerHTML = source.innerHTML;
              destination.classList.toggle('hidden', shouldHide(source));
            }
          };

          updateSourceFromDestination('price');
          updateSourceFromDestination('Sku', ({ classList }) => classList.contains('hidden'));
          updateSourceFromDestination('Inventory', ({ innerText }) => innerText === '');
          updateSourceFromDestination('Volume');
          updateSourceFromDestination('Price-Per-Item', ({ classList }) => classList.contains('hidden'));

          this.updateQuantityRules(this.sectionId, html);
          this.querySelector(`#Quantity-Rules-${this.dataset.section}`)?.classList.remove('hidden');
          this.querySelector(`#Volume-Note-${this.dataset.section}`)?.classList.remove('hidden');

          const submitButtonInHtml = html.getElementById(`ProductSubmitButton-${this.sectionId}`);
          const submitButton = this.querySelector(`#ProductSubmitButton-${this.dataset.section}`);
          
          // Determine if button should be disabled based on variant availability
          // Check both the HTML button state and the variant object
          const isDisabledFromHtml = submitButtonInHtml?.hasAttribute('disabled') ?? true;
          const isDisabledFromVariant = !variant || variant.available === false;
          const isDisabled = isDisabledFromHtml || isDisabledFromVariant;
          
          // Update button text directly from fetched HTML (includes variant button text if available)
          if (submitButtonInHtml && submitButton) {
            const buttonTextSpanInHtml = submitButtonInHtml.querySelector('span');
            const buttonTextSpan = submitButton.querySelector('span');
            if (buttonTextSpanInHtml && buttonTextSpan) {
              // Only update text if the fetched HTML doesn't show "sold out" when variant is actually available
              // This prevents the flash of "sold out" text during variant transitions
              const fetchedText = buttonTextSpanInHtml.textContent.trim();
              const soldOutText = window.variantStrings?.soldOut || 'Sold out';
              
              // If variant is available but HTML shows "sold out", preserve current text
              if (variant && variant.available && fetchedText === soldOutText) {
                // Don't update - keep current text to avoid flash
              } else {
                // Update the button text span directly from the fetched HTML
                buttonTextSpan.textContent = fetchedText;
              }
            }
            
            // Update disabled state - ensure it stays disabled for sold out variants
            if (isDisabled) {
              submitButton.setAttribute('disabled', 'disabled');
              submitButton.disabled = true;
            } else {
              submitButton.removeAttribute('disabled');
              submitButton.disabled = false;
            }
          }

          publish(PUB_SUB_EVENTS.variantChange, {
            data: {
              sectionId: this.sectionId,
              html,
              variant,
            },
          });
        };
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
        ).forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = variantId ?? '';
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }

      updateURL(url, variantId) {
        this.querySelector('share-button')?.updateUrl(
          `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`
        );

        if (this.dataset.updateUrl === 'false') return;
        window.history.replaceState({}, '', `${url}${variantId ? `?variant=${variantId}` : ''}`);
      }

      setUnavailable() {
        this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);

        const selectors = ['price', 'Inventory', 'Sku', 'Price-Per-Item', 'Volume-Note', 'Volume', 'Quantity-Rules']
          .map((id) => `#${id}-${this.dataset.section}`)
          .join(', ');
        document.querySelectorAll(selectors).forEach(({ classList }) => classList.add('hidden'));
      }

      /**
       * Get selected option value strings from variant picker
       * Returns array of option values like ["250mm", "Oak"]
       * Uses original values (data-original-value) if available for image tagging compatibility
       */
      getSelectedOptionValueStrings() {
        const variantSelects = this.variantSelectors;
        if (!variantSelects) return [];

        const selectedValues = [];
        variantSelects.querySelectorAll('select option[selected], fieldset input:checked').forEach((input) => {
          // Use original value if available (for image tagging compatibility with translated variant names)
          // Otherwise fall back to the displayed/translated value
          const originalValue = input.dataset.originalValue;
          const value = originalValue || input.value || input.textContent.trim();
          if (value) selectedValues.push(value);
        });

        return selectedValues;
      }

      /**
       * Filter media items based on variant option values matching alt text
       * If no variant is selected or no images have alt text, show all images
       */
      filterMediaByVariantOptions() {
        const selectedOptionValues = this.getSelectedOptionValueStrings();
        const mediaGallery = this.querySelector('media-gallery');
        if (!mediaGallery) return;

        // IMPORTANT: Never filter modal content - only filter the main gallery
        // Modal content should always show all images to prevent white screen issues

        // If no variant options selected, show all images
        if (selectedOptionValues.length === 0) {
          const allItems = mediaGallery.querySelectorAll('ul li[data-media-id]');
          allItems.forEach((item) => {
            // Only affect gallery items, not modal content
            if (!item.closest('.product-media-modal__content')) {
              item.style.display = '';
            }
          });
          return;
        }

        // Build variant string from selected options (e.g., "250mm Oak" or "250mm-Oak")
        const variantString = selectedOptionValues.join(' ').trim().toLowerCase();
        const variantStringAlt = selectedOptionValues.join('-').trim().toLowerCase();

        // Get all media items (both gallery and thumbnails)
        // Select all items with data-media-id, not just those with data-media-alt
        // IMPORTANT: Only select items within media-gallery, NOT modal content
        const galleryItems = mediaGallery.querySelectorAll('ul li[data-media-id]');
        const thumbnailItems = mediaGallery.querySelectorAll('ul.thumbnail-list li[data-target]');

        // First, reset all items to visible (important for items without data-media-alt attribute)
        galleryItems.forEach((item) => {
          item.style.display = '';
        });
        thumbnailItems.forEach((item) => {
          item.style.display = '';
        });

        // Filter gallery items - hide those that don't match
        galleryItems.forEach((item) => {
          // IMPORTANT: Skip modal content - never filter modal items
          if (item.closest('.product-media-modal__content')) {
            return;
          }

          // Check if item has data-media-alt attribute
          const hasAltAttribute = item.hasAttribute('data-media-alt');
          if (!hasAltAttribute) {
            // If no data-media-alt attribute, show the image for all variants
            return;
          }
          
          const altText = item.dataset.mediaAlt;
          if (!altText || altText.trim() === '') {
            // If alt text is empty, show the image for all variants
            return;
          }

          const altLower = altText.toLowerCase().trim();
          
          // Special tag: if alt text is exactly "all" or "shared", or contains them as words, show for all variants
          // Check for exact match or word boundaries (space, start, end, or hyphen)
          const isAllTag = altLower === 'all' || 
                          altLower.startsWith('all ') || 
                          altLower.endsWith(' all') || 
                          altLower.includes(' all ') ||
                          altLower === 'shared' ||
                          altLower.startsWith('shared ') ||
                          altLower.endsWith(' shared') ||
                          altLower.includes(' shared ');
          
          if (isAllTag) {
            return; // Show for all variants
          }

          // Show if alt text contains any of the selected variant option values
          // This allows partial matching (e.g., "250 mm" matches when "250 mm" + "Oak" is selected)
          const altWords = altLower.split(/[\s-]+/).filter(w => w.length > 0 && w !== 'all' && w !== 'shared');
          const selectedWords = variantString.split(/[\s-]+/).filter(w => w.length > 0);
          
          // Check if all words in alt text are found in selected values
          // This means if alt is "250 mm" and selected is "250 mm oak", it will match
          const shouldShow = altWords.length > 0 && altWords.every(word => 
            selectedWords.some(selected => selected.includes(word) || word.includes(selected))
          );
          
          item.style.display = shouldShow ? '' : 'none';
        });

        // Filter thumbnail items - hide those that don't match
        thumbnailItems.forEach((item) => {
          // IMPORTANT: Skip modal content - never filter modal items
          if (item.closest('.product-media-modal__content')) {
            return;
          }

          // Check if item has data-media-alt attribute
          const hasAltAttribute = item.hasAttribute('data-media-alt');
          if (!hasAltAttribute) {
            // If no data-media-alt attribute, show the thumbnail for all variants
            return;
          }
          
          const altText = item.dataset.mediaAlt;
          if (!altText || altText.trim() === '') {
            // If alt text is empty, show the thumbnail for all variants
            return;
          }

          const altLower = altText.toLowerCase().trim();
          
          // Special tag: if alt text is exactly "all" or "shared", or contains them as words, show for all variants
          // Check for exact match or word boundaries (space, start, end, or hyphen)
          const isAllTag = altLower === 'all' || 
                          altLower.startsWith('all ') || 
                          altLower.endsWith(' all') || 
                          altLower.includes(' all ') ||
                          altLower === 'shared' ||
                          altLower.startsWith('shared ') ||
                          altLower.endsWith(' shared') ||
                          altLower.includes(' shared ');
          
          if (isAllTag) {
            return; // Show for all variants
          }

          const altWords = altLower.split(/[\s-]+/).filter(w => w.length > 0 && w !== 'all' && w !== 'shared');
          const selectedWords = variantString.split(/[\s-]+/).filter(w => w.length > 0);
          
          const shouldShow = altWords.length > 0 && altWords.every(word => 
            selectedWords.some(selected => selected.includes(word) || word.includes(selected))
          );
          
          item.style.display = shouldShow ? '' : 'none';
        });
      }

      updateMedia(html, variantFeaturedMediaId) {
        if (!variantFeaturedMediaId) return;

        const mediaGallerySource = this.querySelector('media-gallery ul');
        const mediaGalleryDestination = html.querySelector(`media-gallery ul`);

        const refreshSourceData = () => {
          if (this.hasAttribute('data-zoom-on-hover')) enableZoomOnHover(2);
          const mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
          const sourceSet = new Set(mediaGallerySourceItems.map((item) => item.dataset.mediaId));
          const sourceMap = new Map(
            mediaGallerySourceItems.map((item, index) => [item.dataset.mediaId, { item, index }])
          );
          return [mediaGallerySourceItems, sourceSet, sourceMap];
        };

        if (mediaGallerySource && mediaGalleryDestination) {
          let [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
          const mediaGalleryDestinationItems = Array.from(
            mediaGalleryDestination.querySelectorAll('li[data-media-id]')
          );
          const destinationSet = new Set(mediaGalleryDestinationItems.map(({ dataset }) => dataset.mediaId));
          let shouldRefresh = false;

          // add items from new data not present in DOM
          for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
            if (!sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)) {
              mediaGallerySource.prepend(mediaGalleryDestinationItems[i]);
              shouldRefresh = true;
            }
          }

          // remove items from DOM not present in new data
          for (let i = 0; i < mediaGallerySourceItems.length; i++) {
            if (!destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)) {
              mediaGallerySourceItems[i].remove();
              shouldRefresh = true;
            }
          }

          // refresh
          if (shouldRefresh) [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();

          // if media galleries don't match, sort to match new data order
          mediaGalleryDestinationItems.forEach((destinationItem, destinationIndex) => {
            const sourceData = sourceMap.get(destinationItem.dataset.mediaId);

            if (sourceData && sourceData.index !== destinationIndex) {
              mediaGallerySource.insertBefore(
                sourceData.item,
                mediaGallerySource.querySelector(`li:nth-of-type(${destinationIndex + 1})`)
              );

              // refresh source now that it has been modified
              [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
            }
          });
        }

        // set featured media as active in the media gallery
        this.querySelector(`media-gallery`)?.setActiveMedia?.(
          `${this.dataset.section}-${variantFeaturedMediaId}`,
          true
        );

        // Filter media by variant options (multiple images per variant feature)
        this.filterMediaByVariantOptions();

        // update media modal
        const modalContent = this.productModal?.querySelector(`.product-media-modal__content`);
        const newModalContent = html.querySelector(`product-modal .product-media-modal__content`);
        if (modalContent && newModalContent) {
          modalContent.innerHTML = newModalContent.innerHTML;
          // Note: Modal content is NOT filtered - it shows all images regardless of variant
          // This prevents the white screen issue on mobile when opening the lightbox
        }
      }

      /**
       * Filter media modal images based on variant option values
       */
      filterModalMediaByVariantOptions() {
        const selectedOptionValues = this.getSelectedOptionValueStrings();
        const modalContent = this.productModal?.querySelector(`.product-media-modal__content`);
        if (!modalContent) return;

        // If no variant options selected, show all images
        if (selectedOptionValues.length === 0) {
          const allItems = modalContent.querySelectorAll('.product__media-item');
          allItems.forEach((item) => {
            item.style.display = '';
          });
          return;
        }

        const variantString = selectedOptionValues.join(' ').trim().toLowerCase();
        const variantStringAlt = selectedOptionValues.join('-').trim().toLowerCase();

        // Select all media items, not just those with data-media-alt
        const modalItems = modalContent.querySelectorAll('.product__media-item');
        
        // First, reset all items to visible
        modalItems.forEach((item) => {
          item.style.display = '';
        });
        
        // Filter modal items - hide those that don't match
        modalItems.forEach((item) => {
          // Check if item has data-media-alt attribute
          const hasAltAttribute = item.hasAttribute('data-media-alt');
          if (!hasAltAttribute) {
            // If no data-media-alt attribute, show the image for all variants
            return;
          }
          
          const altText = item.dataset.mediaAlt;
          if (!altText || altText.trim() === '') {
            // If alt text is empty, show the image for all variants
            return;
          }

          const altLower = altText.toLowerCase().trim();
          
          // Special tag: if alt text is exactly "all" or "shared", or contains them as words, show for all variants
          // Check for exact match or word boundaries (space, start, end, or hyphen)
          const isAllTag = altLower === 'all' || 
                          altLower.startsWith('all ') || 
                          altLower.endsWith(' all') || 
                          altLower.includes(' all ') ||
                          altLower === 'shared' ||
                          altLower.startsWith('shared ') ||
                          altLower.endsWith(' shared') ||
                          altLower.includes(' shared ');
          
          if (isAllTag) {
            return; // Show for all variants
          }

          const altWords = altLower.split(/[\s-]+/).filter(w => w.length > 0 && w !== 'all' && w !== 'shared');
          const selectedWords = variantString.split(/[\s-]+/).filter(w => w.length > 0);
          
          const shouldShow = altWords.length > 0 && altWords.every(word => 
            selectedWords.some(selected => selected.includes(word) || word.includes(selected))
          );
          
          item.style.display = shouldShow ? '' : 'none';
        });
      }

      updateVariantMetafields(html) {
        // Update all variant metafield blocks within product-info
        const currentBlocks = this.querySelectorAll('[data-variant-metafield]');
        
        currentBlocks.forEach((currentBlock) => {
          // Extract the unique ID from current block
          const blockId = currentBlock.id;
          
          if (!blockId) {
            console.warn('Variant metafield block missing ID', currentBlock);
            return;
          }
          
          // Find the corresponding block in the new HTML by ID
          const newBlock = html.querySelector(`#${blockId}`);
          
          if (!newBlock) {
            console.warn('Could not find new block for', blockId);
            return;
          }
          
          // Get the content wrappers
          const currentWrapper = currentBlock.querySelector('.variant-metafield__wrapper');
          const newWrapper = newBlock.querySelector('.variant-metafield__wrapper');
          
          // Handle case where metafield might be empty/hidden
          if (!newWrapper && currentWrapper) {
            // New variant doesn't have this metafield, hide the block
            currentBlock.style.transition = 'opacity 0.2s ease';
            currentBlock.style.opacity = '0';
            setTimeout(() => {
              currentBlock.innerHTML = '';
              currentBlock.style.opacity = '1';
            }, 200);
            return;
          }
          
          if (newWrapper && currentWrapper && currentWrapper.innerHTML !== newWrapper.innerHTML) {
            // Update with smooth transition
            currentBlock.style.transition = 'opacity 0.2s ease';
            currentBlock.style.opacity = '0';
            
            setTimeout(() => {
              currentBlock.innerHTML = newBlock.innerHTML;
              currentBlock.style.opacity = '1';
            }, 200);
          } else if (newWrapper && !currentWrapper) {
            // Current variant didn't have this metafield, but new one does
            currentBlock.style.transition = 'opacity 0.2s ease';
            currentBlock.style.opacity = '0';
            
            setTimeout(() => {
              currentBlock.innerHTML = newBlock.innerHTML;
              currentBlock.style.opacity = '1';
            }, 200);
          }
        });
        
        // Note: Standalone variant metafield sections (outside product-info) 
        // are handled by their own custom element (variant-metafield-section.js)
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.quantityInput.dataset.cartQuantity ? parseInt(this.quantityInput.dataset.cartQuantity) : 0,
          min: this.quantityInput.dataset.min ? parseInt(this.quantityInput.dataset.min) : 1,
          max: this.quantityInput.dataset.max ? parseInt(this.quantityInput.dataset.max) : null,
          step: this.quantityInput.step ? parseInt(this.quantityInput.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.quantityInput.min = min;

        if (max) {
          this.quantityInput.max = max;
        } else {
          this.quantityInput.removeAttribute('max');
        }
        this.quantityInput.value = min;

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;

        this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
          })
          .catch((e) => console.error(e))
          .finally(() => this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden'));
      }

      updateQuantityRules(sectionId, html) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();

        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === '.quantity__input') {
            const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) {
                current.setAttribute(attribute, valueUpdated);
              } else {
                current.removeAttribute(attribute);
              }
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }

      get productForm() {
        return this.querySelector(`product-form`);
      }

      get productModal() {
        return document.querySelector(`#ProductModal-${this.dataset.section}`);
      }

      get pickupAvailability() {
        return this.querySelector(`pickup-availability`);
      }

      get variantSelectors() {
        return this.querySelector('variant-selects');
      }

      get relatedProducts() {
        const relatedProductsSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          'related-products'
        );
        return document.querySelector(`product-recommendations[data-section-id^="${relatedProductsSectionId}"]`);
      }

      get quickOrderList() {
        const quickOrderListSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          'quick_order_list'
        );
        return document.querySelector(`quick-order-list[data-id^="${quickOrderListSectionId}"]`);
      }

      get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
      }
    }
  );
}
