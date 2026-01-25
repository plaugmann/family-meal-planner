# MVP Scope

## 🎯 MVP Goal

The MVP of **Family Meal Planner** must solve one concrete problem:

> *Plan exactly three family-friendly dinners per week and generate a correct shopping list with minimal effort and minimal food waste.*

The MVP prioritizes **reliability, simplicity, and speed of use** over completeness or automation.

---

## 👤 Target Users (MVP)

- One private household
- Two adults
- Two children (ages 4 and 9)
- No external users, sharing, or social features

---

## 🍽️ Core Use Case (MVP)

1. Import trusted recipes via URL  
2. Choose **3 dinner recipes** for the upcoming week  
3. Automatically generate a shopping list  
4. Mark items as bought → inventory updates  
5. Optionally use a fridge photo to improve recipe suggestions  

If this loop works smoothly, the MVP is successful.

---

## ✅ Included Features (In Scope)

### 1. Recipe Management
- Import recipes via URL
- Only from **whitelisted domains**
- Store **cleaned recipe content only**:
  - Title
  - Image
  - Ingredients (line-based)
  - Steps / instructions
  - Default servings (if available)
- Manual editing of imported recipes (basic text editing)
- Recipe library with:
  - Search by title
  - Favorite marking
  - Family-friendly tagging (manual or default)

---

### 2. Whitelisted Recipe Sites
- Maintain a list of allowed domains
- Only whitelisted domains can be:
  - Imported
  - Used for discovery
- Sites can be enabled/disabled
- No automatic crawling beyond whitelist

---

### 3. Weekly Dinner Planning
- Fixed planning unit: **3 dinners per week**
- No breakfast/lunch planning
- Weekly plan includes:
  - Recipe reference
  - Servings (default = family size)
- No calendar-day assignment required

---

### 4. Recipe Discovery & Suggestions
Suggestions can be filtered by:
- Favorites influence
- Seasonality (basic tagging)
- Family-friendly preference
- “Use what we have” (inventory + fridge photo)

Discovery sources:
- Existing recipe library
- Approved recipes from whitelisted sites (if implemented)

Ranking logic (simple in MVP):
- Prefer recipes using ingredients already in inventory
- Prefer favorites and similar recipes
- Prefer family-friendly recipes

---

### 5. Inventory (Light)
- Two locations:
  - Fridge / Freezer
  - Pantry
- Inventory is **presence-based**, not quantity-based
- Items are string-based (best-effort normalization)
- Inventory is updated by:
  - Marking shopping list items as bought
  - Manual add/remove
  - Optional fridge photo confirmation

No expiry dates or strict quantities in MVP.

---

### 6. Shopping List
- Generated automatically from weekly plan
- Ingredients aggregated across all 3 recipes
- Inventory items are excluded
- Items grouped by category:
  - Produce
  - Dairy
  - Meat/Fish
  - Pantry
  - Frozen
  - Other
- Simple “suggested pack size” logic (heuristic)
- Checkbox-based interaction:
  - Mark as bought
  - Automatically updates inventory

---

### 7. Fridge Photo (Assistive Feature)
- User can upload/take a photo of the fridge
- System identifies likely ingredients (best-effort)
- User reviews detected items before use
- Results can be:
  - Used only for recipe suggestions (default)
  - Optionally added to inventory

Fridge photo feature is **assistive**, not authoritative.

---

### 8. Platform & UX
- Progressive Web App (PWA)
- Mobile-first design
- Works offline for:
  - Viewing recipes
  - Viewing shopping list
- Simple household authentication (PIN or equivalent)

---

## 🚫 Explicitly Out of Scope (MVP)

The following are **not included** in the MVP:

### Cooking & Nutrition
- Unit conversion (g ↔ dl ↔ cups)
- Nutritional calculations (calories, macros)
- Dietary restrictions or allergy handling

### Inventory Complexity
- Exact quantities
- Expiry dates
- Automatic depletion after cooking
- Barcode scanning or receipt scanning

### Social / Sharing
- Multiple households
- Sharing recipes publicly
- User accounts beyond the household

### Automation & Integrations
- Automatic grocery ordering
- Store-specific pricing
- Smart fridge integrations
- Voice assistants

---

## 🧪 MVP Quality Bar

The MVP is considered successful if:

- A full weekly cycle can be completed in **under 5 minutes**
- Shopping list is correct and usable in a real store
- Imported recipes rarely require manual fixes
- Inventory stays “mostly correct” with minimal effort
- The system reliably suggests usable dinner ideas

---

## 🔜 Explicit Post-MVP Candidates (v2+)

These are **deliberately deferred**:
- Quantity-based inventory
- Expiry-aware food waste optimization
- Nutrition scoring
- Calendar-based meal scheduling
- Receipt scanning
- Multi-user households
- Cross-device sync improvements

---

## 📌 Guiding Principle

> *If a feature does not clearly reduce weekly planning effort or food waste, it does not belong in the MVP.*
