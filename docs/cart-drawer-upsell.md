# Cart drawer upsell

When a customer opens the cart drawer, the theme can show **one** suggested product (image, title, price, link, and sometimes an add button). You choose what to suggest—not in the cart itself, but on each **product** in the Shopify admin: “when someone has *this* product in the cart, suggest *that* product or variant.”

---

## Add an upsell from the product page (recommended)

1. In Shopify admin, go to **Products** and open the product that should **trigger** the suggestion—the one the customer has already added to the cart (for example the main product, not the accessory).
2. Scroll to **Metafields** (usually at the bottom of the product page).
3. Choose what to fill in:
   - **Upsell product** — Use this when you want to suggest a **product**. Pick the product from the list (for example an add-on or related item). If you only set this and leave variant empty, the theme picks a default variant according to the theme rules.
   - **Upsell variant** — Use this when you want to suggest one **specific variant** (one size, color, or SKU). Search and select that variant. You can use this field together with **Upsell product**, or on its own: if you only set **Upsell variant**, the theme figures out the product from that variant.

4. Click **Save**.

After you save, add that trigger product to the cart on the storefront and open the cart drawer—you should see your upsell. If you use both fields, make sure the variant belongs to the upsell product when both are set.

---

## Set a default upsell for the whole store (optional)

If you want **one** product suggested whenever no trigger product has its own upsell filled in:

1. Go to **Online Store → Themes → Customize**.
2. Open **Theme settings** (the gear icon at the bottom of the left sidebar).
3. Open **Cart**, then find **Cart drawer → Upsell product**.
4. Choose the default product and save.

---

## Quick choices (cheat sheet)

| What you want | What to fill |
|---------------|----------------|
| Suggest a product; any variant is OK | **Upsell product** only |
| Suggest one exact variant (size, color, etc.) | **Upsell product** + **Upsell variant**, or only **Upsell variant** if you pick the variant reference |

**Tip:** Do not leave **Upsell product** empty on purpose if the field is “active” but blank—you may block the store default upsell for that product. Either select a product or ask a developer how your metafields are set up.

---

## Before you start (setup)

The **Upsell product** and **Upsell variant** fields must exist on products. Check **Settings → Custom data → Products** for definitions named like **Upsell product** and **Upsell variant** (this theme uses namespace `custom`). If they are missing, a developer needs to add the metafield definitions first.

---

## Technical reference (theme & metafields)

The store default uses theme setting `cart_drawer_upsell_product` (**Theme settings → Cart → Cart drawer → Upsell product**). It applies only when no line item in the cart has its own upsell metafields set.

### Product metafields (`custom`)

| Metafield            | Type / notes                                                                 |
|----------------------|-------------------------------------------------------------------------------|
| `upsell_product`     | **Product reference** — product to suggest when this product is in the cart. |
| `upsell_variant`     | Optional. Picks **which variant** to show, price, and add to cart.          |

### Priority

1. The theme walks **cart line items** in order. The **first** line item that defines an upsell wins.
2. If `upsell_product` is set on that product and the referenced product is available → that product is the upsell. If `upsell_variant` is also set, it selects the variant (and the displayed product follows the variant when the variant is a **reference**).
3. If `upsell_product` is **not** set but `upsell_variant` is set as a **variant reference** → the upsell is that variant’s **parent product**, with that variant pre-selected.
4. If no line item has these metafields, the theme uses the **theme setting** upsell product.

If a product has the `upsell_product` metafield **defined in the admin** but left empty, the theme treats that as “this product has cart-drawer upsell configured” and **does not** fall back to the global theme upsell for that scenario.

### `upsell_variant` formats

Supported values for `upsell_variant`:

1. **Variant reference** (recommended) — single variant; title/link/pricing follow that variant’s product when needed.
2. **Numeric variant ID** — must belong to the product chosen via `upsell_product` (or the product resolved from a variant-only setup).
3. **URL** containing `?variant=…` — same as above; the ID is parsed from the query string.

### When the upsell is hidden

The block is not shown if:

- The cart is empty.
- The chosen upsell product is **already in the cart** (same product, any variant).
- The upsell product is unavailable, or no valid variant could be resolved.

---

## Try it / test

1. On the **storefront**, add the **trigger** product to the cart and open the cart drawer—check title, price, and link.
2. In the **theme editor** (**Customize**), you can sometimes add to cart from the preview; otherwise use **Preview** or the live shop.
3. If the cart has **several** products that each define an upsell, the **first line** in the cart (top of the list) decides which upsell shows.
4. If the suggested product is **already in the cart**, the upsell block hides for that suggestion.

---

## Translations (wording on the storefront)

Cart drawer upsell title and button text come from the theme **Locales** (e.g. `sections.cart.upsell`). To change customer-facing strings, use **Online Store → Themes → … → Edit default theme content** (or your translation app), depending on how your store is set up.
