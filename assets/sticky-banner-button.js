document.addEventListener('DOMContentLoaded', function() {
  console.log('Sticky Banner Button: DOM loaded');
  
  // Find all sticky banner sections on the page
  const stickyBannerSections = document.querySelectorAll('[id^="sticky-banner-button-"]');
  
  if (stickyBannerSections.length === 0) {
    console.log('Sticky Banner Button: No sticky banner sections found');
    return;
  }
  
  stickyBannerSections.forEach(function(stickyButton) {
    const sectionId = stickyButton.id.replace('sticky-banner-button-', '');
    const bannerSection = document.querySelector(`#Banner-${sectionId}`);
    
    if (!bannerSection) {
      console.log(`Sticky Banner Button: Banner section not found for ${sectionId}`);
      return;
    }
    
    console.log(`Sticky Banner Button: Initializing for section ${sectionId}`);
    
    // Get the original buttons from the banner
    const originalButtons = bannerSection.querySelectorAll('[id^="banner-button-"]');
    const stickyButtons = stickyButton.querySelectorAll('.sticky-banner-button__link');
    
    if (originalButtons.length === 0 || stickyButtons.length === 0) {
      console.log(`Sticky Banner Button: No buttons found for section ${sectionId}`);
      return;
    }
    
    // Sync button states and click handlers
    function syncButtonStates() {
      originalButtons.forEach(function(originalButton, index) {
        const stickyButton = stickyButtons[index];
        if (stickyButton) {
          // Sync disabled state
          if (originalButton.hasAttribute('aria-disabled') && originalButton.getAttribute('aria-disabled') === 'true') {
            stickyButton.setAttribute('aria-disabled', 'true');
            stickyButton.style.pointerEvents = 'none';
            stickyButton.style.opacity = '0.6';
          } else {
            stickyButton.removeAttribute('aria-disabled');
            stickyButton.style.pointerEvents = 'auto';
            stickyButton.style.opacity = '1';
          }
          
          // Sync href if it's a link
          if (originalButton.tagName === 'A' && originalButton.href) {
            stickyButton.href = originalButton.href;
          }
        }
      });
    }
    
    // Handle sticky button clicks
    stickyButtons.forEach(function(stickyButton, index) {
      stickyButton.addEventListener('click', function(event) {
        const originalButton = originalButtons[index];
        if (originalButton) {
          // If the original button is disabled, prevent the click
          if (originalButton.hasAttribute('aria-disabled') && originalButton.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
            return;
          }
          
          // If it's a link, let it navigate normally
          if (originalButton.tagName === 'A' && originalButton.href) {
            // Let the default link behavior happen
            return;
          }
          
          // If it's a button, trigger the original button click
          if (originalButton.tagName === 'BUTTON' || originalButton.tagName === 'A') {
            event.preventDefault();
            originalButton.click();
          }
        }
      });
    });
    
    // Function to show/hide sticky button based on banner visibility
    function updateStickyButton() {
      const bannerRect = bannerSection.getBoundingClientRect();
      const isBannerVisible = bannerRect.bottom > 0;
      
      if (!isBannerVisible) {
        stickyButton.style.display = 'block';
        syncButtonStates();
      } else {
        stickyButton.style.display = 'none';
      }
    }
    
    // Initial check
    updateStickyButton();
    
    // Update on scroll
    window.addEventListener('scroll', updateStickyButton);
    
    // Update on resize (in case layout changes)
    window.addEventListener('resize', updateStickyButton);
    
    // Listen for changes to the original buttons (e.g., if they become disabled/enabled)
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'aria-disabled' || 
             mutation.attributeName === 'href' || 
             mutation.attributeName === 'class')) {
          syncButtonStates();
        }
      });
    });
    
    // Observe changes to original buttons
    originalButtons.forEach(function(button) {
      observer.observe(button, {
        attributes: true,
        attributeFilter: ['aria-disabled', 'href', 'class']
      });
    });
  });
});
