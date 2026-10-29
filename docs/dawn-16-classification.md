# Dawn 16 classification

Branch: `dawn-16`  
Compared against Dawn tags `v15.2.0` and `v16.0.0`.

| Bucket | Count | Meaning |
| --- | ---: | --- |
| `MANUAL_MERGE` | 88 | Changed by us and by Dawn → merge by hand |
| `TAKE_DAWN16` | 38 | Identical to Dawn 15.2.0 → copy Dawn 16 as-is |
| `ADD_FROM_DAWN16` | 11 | New in Dawn 16 → add |
| `REMOVED_IN_DAWN16` | 15 | Gone in Dawn 16 → review (often legacy customer pages) |
| `KEEP_CUSTOM` | 167 | Only ours, or we changed and Dawn did not → keep |
| `NO_ACTION` | 183 | Already matches Dawn 16 → skip |

## MANUAL_MERGE (88 total, 30 core, 58 locales/templates/settings_data)

### Core files

- `assets/base.css`
- `assets/cart-drawer.js`
- `assets/component-cart-drawer.css`
- `assets/product-form.js`
- `assets/product-info.js`
- `assets/quick-order-list.css`
- `config/settings_schema.json`
- `layout/theme.liquid`
- `sections/collapsible-content.liquid`
- `sections/featured-collection.liquid`
- `sections/featured-product.liquid`
- `sections/footer-group.json`
- `sections/footer.liquid`
- `sections/header-group.json`
- `sections/header.liquid`
- `sections/image-banner.liquid`
- `sections/main-collection-product-grid.liquid`
- `sections/main-product.liquid`
- `sections/main-search.liquid`
- `sections/multicolumn.liquid`
- `sections/multirow.liquid`
- `sections/related-products.liquid`
- `sections/rich-text.liquid`
- `sections/slideshow.liquid`
- `snippets/card-product.liquid`
- `snippets/cart-drawer.liquid`
- `snippets/header-drawer.liquid`
- `snippets/price.liquid`
- `snippets/product-variant-options.liquid`
- `snippets/product-variant-picker.liquid`

### Locales / templates / settings_data

- `config/`: 1 files
- `locales/`: 51 files
- `templates/`: 6 files

## TAKE_DAWN16 (38 total, 38 core, 0 locales/templates/settings_data)

### Core files

- `assets/cart-notification.js`
- `assets/cart.js`
- `assets/component-cart-items.css`
- `assets/component-cart-notification.css`
- `assets/component-facets.css`
- `assets/component-menu-drawer.css`
- `assets/component-price.css`
- `assets/facets.js`
- `assets/global.js`
- `assets/predictive-search.js`
- `assets/pubsub.js`
- `assets/quantity-popover.css`
- `assets/quick-add-bulk.js`
- `assets/quick-add.css`
- `assets/quick-add.js`
- `assets/quick-order-list.js`
- `sections/announcement-bar.liquid`
- `sections/cart-notification-product.liquid`
- `sections/collage.liquid`
- `sections/collection-list.liquid`
- `sections/email-signup-banner.liquid`
- `sections/featured-blog.liquid`
- `sections/image-with-text.liquid`
- `sections/main-article.liquid`
- `sections/main-blog.liquid`
- `sections/main-cart-footer.liquid`
- `sections/main-cart-items.liquid`
- `sections/main-collection-banner.liquid`
- `sections/main-list-collections.liquid`
- `sections/main-password-header.liquid`
- `sections/newsletter.liquid`
- `sections/predictive-search.liquid`
- `sections/quick-order-list.liquid`
- `snippets/facets.liquid`
- `snippets/pagination.liquid`
- `snippets/quantity-input.liquid`
- `snippets/quick-order-list-row.liquid`
- `snippets/quick-order-list.liquid`

## ADD_FROM_DAWN16 (11 total, 11 core, 0 locales/templates/settings_data)

### Core files

- `.prettierrc.json`
- `assets/cart-disclosure-modal.js`
- `assets/cart-disclosure-tooltip.js`
- `assets/component-disclosures.css`
- `assets/disclosures.js`
- `assets/icon-warning.svg`
- `assets/standard-actions-override.js`
- `sections/disclosures.liquid`
- `snippets/cart-disclosure-indicator.liquid`
- `snippets/product-disclosures.liquid`
- `snippets/unit-price.liquid`

## REMOVED_IN_DAWN16 (15 total, 8 core, 7 locales/templates/settings_data)

### Core files

- `assets/customer.css`
- `sections/main-account.liquid`
- `sections/main-activate-account.liquid`
- `sections/main-addresses.liquid`
- `sections/main-login.liquid`
- `sections/main-order.liquid`
- `sections/main-register.liquid`
- `sections/main-reset-password.liquid`

### Locales / templates / settings_data

- `templates/`: 7 files

Customer templates:
- `templates/customers/account.json`
- `templates/customers/activate_account.json`
- `templates/customers/addresses.json`
- `templates/customers/login.json`
- `templates/customers/order.json`
- `templates/customers/register.json`
- `templates/customers/reset_password.json`

## KEEP_CUSTOM (167 total, 75 core, 92 locales/templates/settings_data)

### Core files

- `assets/collage-text-link.css`
- `assets/collage.css`
- `assets/collapsible-content.css`
- `assets/component-accordion.css`
- `assets/component-card.css`
- `assets/component-product-label.css`
- `assets/component-product-specs.css`
- `assets/component-product-variant-picker.css`
- `assets/component-variant-metafield.css`
- `assets/countdown-timer.css`
- `assets/countdown-timer.js`
- `assets/header-secondary-menu.css`
- `assets/icon-option-info.svg`
- `assets/icon-payment-klarna.svg`
- `assets/icon-payment-swish.svg`
- `assets/icon-star-filled.svg`
- `assets/pandectes-rules.min.js`
- `assets/pandectes-settings.json`
- `assets/product-modal.js`
- `assets/section-footer.css`
- `assets/section-hero-block.css`
- `assets/section-image-banner.css`
- `assets/section-main-product.css`
- `assets/section-product-reviews-slider.css`
- `assets/section-related-products.css`
- `assets/sticky-add-to-cart.css`
- `assets/sticky-add-to-cart.js`
- `assets/sticky-banner-button.css`
- `assets/sticky-banner-button.js`
- `assets/template-collection.css`
- `assets/variant-metafield-section.js`
- `assets/variant-text-section.js`
- `assets/video-banner.css`
- `sections/collage-text-link.liquid`
- `sections/countdown-timer.liquid`
- `sections/custom_img.liquid`
- `sections/hero-block.liquid`
- `sections/image-banner-animation.liquid`
- `sections/image-with-text-animation.liquid`
- `sections/logo-slider.liquid`
- `sections/multicolumn-form.liquid`
- `sections/product-comparison.liquid`
- `sections/product-reviews-slider.liquid`
- `sections/quote.liquid`
- `sections/read-more-content.liquid`
- `sections/retailers-locations.liquid`
- `sections/rich-text-h1.liquid`
- `sections/richtext_with_image.liquid`
- `sections/test.liquid`
- `sections/variant-metafield-display.liquid`
- `sections/variant-text-display.liquid`
- `sections/video-banner.liquid`
- `sections/video-bannerYT.liquid`
- `sections/video-scroll.liquid`
- `snippets/buy-buttons.liquid`
- `snippets/header-dropdown-menu.liquid`
- `snippets/header-mega-menu.liquid`
- `snippets/hero-block-grid-item.liquid`
- `snippets/icon-with-text.liquid`
- `snippets/klaviyo-fb-pixel-lead-tracking.liquid`
- `snippets/pandectes-rules.liquid`
- `snippets/product-collapsible-tab.liquid`
- `snippets/product-extra-products.liquid`
- `snippets/product-media-gallery.liquid`
- `snippets/product-media-modal.liquid`
- `snippets/product-media.liquid`
- `snippets/product-option-info-button.liquid`
- `snippets/product-payment-icons.liquid`
- `snippets/product-review-slide.liquid`
- `snippets/product-slide-caption.liquid`
- `snippets/product-specs-block.liquid`
- `snippets/product-specs.liquid`
- `snippets/product-thumbnail.liquid`
- `snippets/product-variant-options-custom.liquid`
- `snippets/sticky-add-to-cart-button.liquid`

### Locales / templates / settings_data

- `locales/`: 7 files
- `templates/`: 85 files

## NO_ACTION (183)

Theme already matches Dawn 16 for these files. Skipped in detail.

## Suggested next merge order

1. **MANUAL_MERGE** `sections/header.liquid`
2. **MANUAL_MERGE** `layout/theme.liquid`
3. **MANUAL_MERGE** `snippets/cart-drawer.liquid`
4. **MANUAL_MERGE** `assets/cart-drawer.js`
5. **TAKE_DAWN16** `assets/cart.js`
6. **MANUAL_MERGE** `sections/main-product.liquid`
7. **MANUAL_MERGE** `assets/product-info.js`
8. **MANUAL_MERGE** `assets/product-form.js`
9. **TAKE_DAWN16** `assets/global.js`
10. **KEEP_CUSTOM** `snippets/buy-buttons.liquid`
11. **MANUAL_MERGE** `snippets/product-variant-options.liquid`
12. **MANUAL_MERGE** `sections/featured-product.liquid`
13. **MANUAL_MERGE** `sections/footer.liquid`
14. **MANUAL_MERGE** `config/settings_schema.json`

## Next step

1. Copy all `TAKE_DAWN16` core files from `/Users/christianmartensson/Documents/Woxna/woxna-dev/dawn`.
2. Add `ADD_FROM_DAWN16` files.
3. Manually merge `MANUAL_MERGE` core files, starting with the suggested order above.
4. Keep `KEEP_CUSTOM` untouched.
5. Review `REMOVED_IN_DAWN16` (customer templates can be removed; you already use new customer accounts).

