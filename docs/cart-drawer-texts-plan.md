# Plan: Texter i Cart Drawer

## Bakgrund

Cart drawern renderas idag från:
- **Section:** `sections/cart-drawer.liquid` (en rad: `{% render 'cart-drawer' %}`)
- **Snippet:** `snippets/cart-drawer.liquid` (all HTML och logik)

Det finns **inga** inställningar för egna texter i drawern idag. I theme settings finns bara:
- `cart_drawer_collection` – collection vid tom kundvagn
- `cart_drawer_upsell_product` – upsell-produkt
- `show_cart_note` – visa orderanteckning

---

## Mål

Kunna lägga in **redigerbara texter** i cart drawern på valfria ställen, t.ex.:
- Fri frakt-info
- Kampanjmeddelanden
- Länk till returpolicy / villkor
- Text ovanför eller under checkout-knappen

---

## Alternativ

### Alternativ A: Theme settings (enklast)

Lägga till **färdiga textfält** i **Theme settings → Cart** (inga blocks).

- **Fördelar:** Enkelt, snabbt, inga ändringar i section/snippet-struktur.
- **Nackdelar:** Fast antal texter (t.ex. 1–2), fasta positioner.

**Exempel:**
- `cart_drawer_text_above_checkout` (textarea eller richtext)
- `cart_drawer_text_below_checkout` (textarea eller richtext)

Positionerna hårdkodas i snippet (t.ex. en rad ovanför knappen, en under).

---

### Alternativ B: Section med blocks (flexibelt)

Ge **cart drawer-sectionen** ett **schema med blocks** så man i theme editor kan lägga till/ta bort/ordna texter.

- **Fördelar:** Fler texter, valfri ordning, möjlighet att lägga till fler blocktyper senare (t.ex. bild, kampanj).
- **Nackdelar:** Kräver att sectionen får schema och att snippet antingen får blocks som parameter eller att delar av drawern flyttas till section-filen.

**Blocktyp:** t.ex. "Text" med:
- `content` (richtext eller html)
- `position` (dropdown: "Ovanför varukorgsrader" / "Under upsell" / "Ovanför checkout-knappen" / "Under checkout-knappen")

Section-filen måste då antingen:
1. Skicka `section.blocks` till snippeten och snippeten renderar texterna på rätt plats utifrån `position`, **eller**
2. Rendera blocken i section-filen på flera ställen (då behöver man partials eller flera `render` med olika delar av drawern).

Rekommendation: **1** – behåll all HTML i snippeten, skicka in `blocks` och gör platshållare i snippeten där texterna ska visas.

---

### Alternativ C: Bara ett par fasta theme settings (kompromiss)

Två eller tre färdiga fält i theme settings, med tydliga positioner:

| Setting | Position |
|--------|----------|
| `cart_drawer_message_above_checkout` | Ovanför "Estimerad total" / checkout-knappen |
| `cart_drawer_message_below_checkout` | Under checkout-knappen (t.ex. "Säkra betalningar", länk till policy) |

Inga blocks, bara läsa `settings.*` i snippeten och rendera om de är ifyllda.

---

## Rekommendation

- **Vill ni enkelt och snabbt:** **Alternativ C** (2–3 fasta textfält i theme settings).
- **Vill ni kunna lägga till många texter och styra ordning/position:** **Alternativ B** (section med blocks).

---

## Teknisk översikt (om Alternativ B)

1. **`sections/cart-drawer.liquid`**
   - Lägg till `{% schema %}` med:
     - `blocks`: typ `text` (eller `richtext`) med `position` (dropdown).
   - Ändra anrop till: `{% render 'cart-drawer', text_blocks: section.blocks %}`.

2. **`snippets/cart-drawer.liquid`**
   - Ta emot `text_blocks` (optional).
   - På varje position (ovanför rader, under upsell, ovanför checkout, under checkout):
     - Loopa `text_blocks` och visa block där `block.settings.position == 'that_position'`.
   - Använd t.ex. en wrapper-klass: `.cart-drawer__custom-text` för styling.

3. **`config/settings_schema.json`** (om Alternativ A/C)
   - Under cart: nya fält av typ `textarea`, `richtext` eller `html`.

4. **Locales**
   - Nycklar för block/settings-labels (t.ex. `sections.cart_drawer.blocks.text.position.options.*`).

5. **CSS**
   - Eventuellt några rader i `component-cart-drawer.css` för `.cart-drawer__custom-text` (marginal, typografi).

---

## Nästa steg

1. Välj alternativ (A, B eller C).
2. Implementera enligt valt alternativ (jag kan skriva exakt Liquid/schema/locales).
3. Testa i theme editor och på frontend (drawer öppnas, texterna syns på rätt plats).

Om du säger vilket alternativ du vill ha kan nästa steg vara att jag föreslår exakt diff för de filer som ska ändras.
