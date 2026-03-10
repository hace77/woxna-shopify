## Variant–bild-koppling över flera språk – förslag och idéer

Sammanfattning av olika spår vi diskuterat för att koppla produktbilder till varianter på ett sätt som fungerar med flera språk.

---

### 1. Nuvarande lösning (alt‑text + variantnamn)

- **Idé**: Bilder visas utifrån om alt‑texten innehåller ord som matchar den valda variantens namn.
- **Implementation idag**:
  - I `snippets/product-media.liquid` sätts `data-media-alt="{{ media.alt }}"`.
  - I `product-info.js`:
    - `getSelectedOptionValueStrings()` hämtar valda variantvärden, helst från `data-original-value`, annars `value/textContent`.
    - `filterMediaByVariantOptions()`:
      - Bygger `variantString` av valda variantvärden.
      - Splittar både `variantString` och `data-media-alt` i ord.
      - Visar bilden om **minst ett ord i alt‑texten matchar** något ord i `variantString` (efter vår senaste ändring).
- **Fördelar**:
  - Enkel att förstå.
  - Fungerar utan extra metafält.
- **Nackdelar**:
  - Språkberoende – alt‑text och variantnamn måste dela ord för alla språk.
  - För många språk behöver alt‑texten innehålla väldigt många ord (ett per språk).

---

### 2. Multi‑språk i alt‑text (nuvarande “praktiska” workaround)

- **Idé**: Låta alt‑texten innehålla variantordet på alla språk, t.ex.:
  - `Linseed oil / Linolja / Leinöl / Linolie / Linolje`
- **Hur det funkar med nuvarande JS**:
  - När kundens språk är svenska och varianten heter t.ex. `Linolja`, räcker det att ordet `linolja` finns någonstans i alt‑texten för att bilden ska visas.
  - Detsamma gäller för andra språk.
- **Fördelar**:
  - Kräver ingen ny kod i temat (efter ändringen till “any word match”).
  - Fungerar för flera språk samtidigt.
- **Nackdelar**:
  - Alt‑texter blir långa och tekniska.
  - Inte optimalt för tillgänglighet och SEO.
  - Fortfarande underhållstungt när många språk och varianter finns.

---

### 3. Stabil nyckel per variant (t.ex. `image_key` via variantmetafält)

- **Idé**: Ge varje variant en egen, språkoberoende nyckel (t.ex. `linseed-oil`, `rust-protection-oil`) som:
  - Aldrig översätts.
  - Inte syns för kund.
  - Används för att matcha mot bilder.
- **Skiss på implementation**:
  1. Skapa ett **variantmetafält**, t.ex. `metafields.custom.image_key`.
  2. På varje variant sätt ett värde:
     - `custom.image_key = linseed-oil`
     - `custom.image_key = rust-protection-oil`
  3. I `snippets/product-variant-options.liquid`:
     - Läs `value.variant.metafields.custom.image_key`.
     - Skriv ut detta som `data-variant-key="{{ variant_key }}"` på inputs/options.
  4. Koppla bilder:
     - Antingen via media‑metafält (om Shopify/tema stöder det framöver).
     - Eller via produktmetafält/alt‑konvention (se nästa sektioner).
  5. I `product-info.js`:
     - Läs `data-variant-key` från valda inputs/options.
     - Läs motsvarande nyckel på media/thumbnails.
     - Visa bilder där någon media‑key matchar en vald variant‑key.
- **Fördelar**:
  - Helt språkoberoende.
  - Alt‑texter kan vara “rena” och översättas fritt.
- **Nackdelar**:
  - Kräver införande och underhåll av variantmetafält.
  - Kräver kodändringar i både Liquid och JS.

---

### 4. Använda `variant.id` som teknisk nyckel

- **Idé**: Använd det stabila Shopify‑`variant.id` i stället för namn/nyckelsträng.
- **Variant A – bädda in ID i alt‑texten (utan media‑metafält)**:
  - Konvention i alt, t.ex.:
    - `alt="[v:1234567890] Linolja – golvbehandling"`
  - I `product-media.liquid`:
    - Extrahera delen mellan `[v:` och `]` → `1234567890`.
    - Sätt `data-variant-ids="1234567890"` på mediaelementet.
  - I `product-info.js`:
    - Läs vald `variant.id` (via `value.variant.id` → `data-variant-id` på inputs/options).
    - Jämför vald `variant.id` med listan i `data-variant-ids` på varje bild/thumbnail.
  - Alt kan sedan vara helt fri (förutom den lilla ID‑delen).
- **Variant B – produktmetafält som “mapping-tabell”**:
  - Skapa ett produktmetafält (t.ex. JSON eller text) som mappar `media.id` → lista av `variant.id`.
  - I Liquid:
    - Läs produktmetafältet.
    - För varje `media.id`, skriv ut `data-variant-ids="..."` på motsvarande mediaelement.
  - JS filtrerar sedan på `data-variant-ids` mot vald `variant.id`.
- **Fördelar**:
  - Mycket stabilt (ID ändras inte).
  - Språkoberoende.
- **Nackdelar**:
  - Kräver antingen ID‑konvention i alt, eller ett separat produktmetafält med mapping.
  - Lite mer avancerad att sätta upp initialt.

---

### 5. “Engelsk namnfil” som käll-sanning (extern mapping)

- **Idé**: Hålla en central fil i temat (t.ex. `config/variant-keys.json`) med mapping mellan:
  - teknisk variantnyckel → lista av namn på olika språk → ev. produkt/variant‑ID.
- **Exempel på filstruktur**:

```json
{
  "linseed-oil": {
    "product_handles": ["my-product-handle"],
    "variants": ["Linseed oil", "Linolja", "Leinöl", "Linolie", "Linolje"]
  },
  "rust-protection-oil": {
    "product_handles": ["my-product-handle"],
    "variants": ["Rust protection oil", "Rostskyddsolja", "Rostschutzöl", "Rustbeskyttelse"]
  }
}
```

- **Användning**:
  - Liquid/JS laddar denna fil som JSON.
  - När sidan renderas slår man upp `value.name` i listan med namn för att hitta rätt teknisk nyckel (`linseed-oil`).
  - Den tekniska nyckeln används sedan på samma sätt som i förslag 3 (data‑attribute).
- **Fördelar**:
  - All konfiguration i en fil som versioneras i Git.
  - Möjligt att hantera många språk.
- **Nackdelar**:
  - Kräver manuell eller scriptad uppdatering av filen vid ändringar.
  - Mer komplext än variant/metafälts‑lösningar.

---

### 6. Vad som är implementerat just nu (2026‑02‑06)

- Koden som är i drift nu (efter senaste justeringarna):
  - **Alt‑baserad matchning** med stöd för flera språk i samma alt:
    - Filtreringen i `product-info.js` kräver numera att **minst ett ord i alt‑texten** matchar någon del av den valda variantsträngen.
  - Detta gör att alt‑texter som innehåller alla språk för ett variantnamn fungerar, t.ex.:
    - `Linseed oil / Linolja / Leinöl / Linolie / Linolje`.
- Inga av de mer avancerade nyckel‑/ID‑lösningarna är ännu implementerade – de finns endast dokumenterade här som underlag för en framtida, mer hållbar lösning.

---

### 7. Rekommendation när vi tar upp detta igen

När vi bygger en långsiktigt hållbar lösning är det mest robusta spåret:

- **Införa en språkoberoende nyckel per variant** (metafält `custom.image_key` eller liknande).
- **Koppla bilder till samma nyckel** (via media‑metafält eller produktmetafält / alt‑konvention).
- **Justera `product-info.js`** så att den matchar på dessa nycklar/ID:n i stället för på alt‑ord.

Den här filen är tänkt som en snabb översikt över alla spår och trade‑offs när vi går vidare.

