# User Flows (MVP)

## Overview
Family Meal Planner is a private PWA for two adults and two kids (4 & 9). The core weekly loop is:
1) Import recipes from whitelisted sites
2) Get suggested dinners (favorites + season + “use what we have”)
3) Pick exactly **3 dinners** for the coming week
4) Generate shopping list (needs minus inventory)
5) Mark items as bought → inventory updates automatically
6) (Optional) Take a fridge photo to identify what we have and improve suggestions

---

## Navigation (MVP)
Bottom nav (recommended):
- **This Week**
- **Discover**
- **Recipes**
- **Shopping**
- **Inventory**

Secondary (settings):
- Whitelisted sites
- Household settings (children-friendly toggle default on)

---

## Flow 0 — Onboarding (Household setup)
**Goal:** Make the app usable for “us two” quickly.

### Steps
1. User opens PWA
2. Login / Access method (MVP option):
   - Simple household PIN, or magic link (later)
3. Household created (or loaded)
4. Default settings set:
   - Dinners per week: 3 (fixed)
   - “Family-friendly” filter: ON
   - “Minimize food waste”: ON
   - Whitelist sites: empty (user adds)

### Success criteria
- User can reach “This Week” screen and start importing recipes.

---

## Flow 1 — Maintain whitelist of recipe websites
**Goal:** Only allow importing/discovery from trusted sites.

### Entry points
- Settings → “Whitelisted sites”
- Import recipe screen (if domain not allowed) → “Add domain”

### Steps
1. View list of whitelisted sites (domain + name + status)
2. Add new site:
   - Input domain (e.g., `valdemarsro.dk`)
   - Optional name (e.g., “Valdemarsro”)
   - Save
3. Disable/remove site (soft delete recommended)

### Rules
- Import and discovery only work for active whitelisted domains.

### Success criteria
- Domain is stored and used for validation immediately.

---

## Flow 2 — Import recipe by URL
**Goal:** Add a recipe to our library by pasting a URL.

### Entry points
- Recipes → “Add recipe”
- This Week → “Add recipe”
- Discover → “Import from URL”

### Steps
1. User pastes URL
2. System validates domain:
   - If not whitelisted → show blocking message + quick add domain CTA
3. System imports recipe:
   - Extract title, image, ingredients (line items), steps, servings (if available)
   - Prefer JSON-LD Recipe schema if present; else site parser fallback
4. Show **Preview** screen:
   - Title + image
   - Ingredients list (editable as text lines in MVP)
   - Steps (editable text in MVP)
   - Tags (optional, minimal in MVP)
   - Favorite toggle
5. User clicks “Save”
6. Recipe stored in DB as “clean recipe”
7. Confirmation toast + option “View recipe” or “Add another”

### Error/edge handling
- Import fails → show reason + allow “Save as manual recipe draft” (optional MVP)
- Partial parse → mark `needs_review=true` and open preview editor

### Success criteria
- Recipe appears in Recipes library and is selectable for weekly plan.

---

## Flow 3 — Browse and manage recipe library
**Goal:** Find and reuse recipes quickly.

### Entry points
- Recipes tab

### Steps
1. User sees recipe cards:
   - image, title, tags, favorite star
2. Search by text (title)
3. Filters (MVP minimal):
   - Favorites only
   - Family-friendly (tag-based or default)
4. Open recipe detail:
   - Ingredients, steps, servings default
   - Actions:
     - Toggle favorite
     - “Add to This Week” (if week not full)
     - “Edit” (simple editor: ingredients lines + steps)

### Success criteria
- User can reliably find a known recipe and add it to the weekly plan.

---

## Flow 4 — Weekly planning (select exactly 3 dinners)
**Goal:** Choose three dinners for the coming week.

### Entry points
- This Week tab (primary)
- From Recipe detail: “Add to This Week”
- From Discover suggestions: “Select”

### Steps
1. This Week shows:
   - Week start date
   - Slots: 0/3, 1/3, 2/3, 3/3
   - CTA: “Get suggestions”
2. User fills slots by selecting recipes:
   - From Discover (recommended)
   - From Recipes library
3. Optional per recipe:
   - Adjust servings (default 4)
4. When 3 recipes selected:
   - Show “Plan complete” state
   - CTA: “Generate shopping list” (or auto-generate)

### Rules
- Exactly 3 dinners (fixed in MVP)
- No calendar/day assignment required in MVP (optional later)

### Success criteria
- Weekly plan has 3 recipe items stored for that week.

---

## Flow 5 — Discover (recipe suggestions)
**Goal:** Suggest dinners that match preferences and reduce waste.

### Entry points
- Discover tab
- This Week → “Get suggestions”
- After fridge photo analysis → “Find recipes using these”

### Filters (MVP)
Toggle chips:
- Favorites influence: ON/OFF
- Seasonal: ON/OFF
- Nutrition: ON/OFF (MVP: basic tags or “light score”)
- Use what we have: ON/OFF
- Family-friendly: ON/OFF (default ON)

### Steps
1. User opens Discover
2. User optionally adjusts filters
3. System fetches candidates:
   - From local library + optionally “approved suggestions” pool
   - (If internet discovery is enabled in MVP: only from whitelisted sites and added to “Suggestions” queue, not directly saved)
4. System ranks results by:
   - Waste minimization score (matches with inventory/fridge items)
   - Favorites similarity
   - Season tags
   - Family-friendly tags
5. User browses list and selects recipes:
   - “Select for This Week”
6. If This Week already has 3 → show message and offer “Replace one”

### Success criteria
- User can select dinners from suggestions with minimal friction.

---

## Flow 6 — Generate shopping list (needs minus inventory)
**Goal:** Build a grocery list for the selected 3 dinners.

### Entry points
- This Week → “Shopping list”
- Shopping tab

### Steps
1. When weekly plan changes (add/remove recipe, change servings):
   - System recalculates ingredient needs
2. Shopping list screen shows grouped items:
   - Produce, Dairy, Meat/Fish, Pantry, Frozen, Other
3. For each item:
   - Name
   - Suggested pack size / count (MVP)
   - Checkbox (not bought/bought)

### Rules
- No unit conversions in MVP
- Pack-size logic is heuristic and simple:
  - If qty is known and pack mapping exists → suggest packs
  - Else suggest “1 stk” / “1 pack” fallback

### Success criteria
- Shopping list is clear and covers required ingredients not already on hand.

---

## Flow 7 — Mark items as bought → update inventory
**Goal:** Inventory maintenance happens by using the shopping list.

### Entry points
- Shopping tab (primary)

### Steps
1. User is at the store and checks items as bought
2. On check:
   - Item marked `bought=true`
   - Inventory updated (light):
     - Add item name to inventory if not present
     - Update `updated_at`
     - Location defaults to Pantry (user can change to Fridge)
3. “Undo” supported (uncheck removes inventory update or marks as pending)

### Edge handling
- If user buys substitutes → allow quick edit of item name (optional MVP)

### Success criteria
- After shopping, inventory reflects newly purchased items automatically.

---

## Flow 8 — Inventory (light)
**Goal:** See what we have and optionally adjust.

### Entry points
- Inventory tab

### Steps
1. Show two lists:
   - Fridge/Freezer
   - Pantry
2. Search + quick add (“Add item”)
3. Remove item (“We don’t have this anymore”)
4. Optional: “Clear pantry basics” (bulk remove) (later)

### Rules
- No quantities required in MVP
- Items are string-based canonical-ish names (simple normalization)

### Success criteria
- User can quickly correct the inventory when it’s wrong.

---

## Flow 9 — Fridge photo → identify items → improve suggestions
**Goal:** Use an image to identify what’s in the fridge and reduce waste.

### Entry points
- This Week → “Take fridge photo”
- Inventory → “Scan fridge”
- Discover → “Use fridge photo”

### Steps
1. User takes or uploads a photo
2. System analyzes and returns a proposed list of items
3. User reviews list:
   - Remove false positives
   - Add missing items (optional)
4. User chooses how to use results (two options):
   - **A) Use for suggestions only (default)**:
     - Store photo result as “temporary fridge context”
   - **B) Update inventory**:
     - Add selected items to inventory (Fridge)
5. CTA: “Find recipes using these items”
6. Discover opens with “Use what we have” filter ON

### Rules
- Photo results are best-effort; user confirmation is required before inventory updates.

### Success criteria
- User gets better suggestions and can optionally update inventory from photo.

---

## Weekly Routine (Happy path summary)
1. Open This Week → “Get suggestions”
2. Select 3 dinners
3. Open Shopping list → go shopping
4. Mark items bought → inventory updates
5. (Optional) Take fridge photo midweek → find recipes using leftovers

---

## Non-goals (MVP)
- Multi-household or sharing
- Unit conversion or nutrition calculation
- Precise expiry tracking
- Automatic barcode scanning or receipt parsing
- Full internet-wide recipe crawling (whitelist only)
