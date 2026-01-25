# API Contract (MVP)

Base URL: `/api`
Content-Type: `application/json` unless otherwise noted.

Notes:
- Single private household; `householdId` is implicit server-side unless otherwise stated.
- Exactly 3 dinner recipes per week (server enforces on create/update).
- Only whitelisted domains can be imported/discovered.
- Inventory is presence-based (no quantities).
- No unit conversions.

## Common Errors

```json
{
  "error": {
    "code": "STRING",
    "message": "Human readable message",
    "details": { "optional": "object" }
  }
}
```

Common error codes:
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `NOT_ALLOWED`
- `CONFLICT`
- `IMPORT_FAILED`

---

## Whitelist Management

### GET /api/whitelist
List all whitelist sites.

Response 200:
```json
{
  "sites": [
    {
      "id": "site_123",
      "domain": "smittenkitchen.com",
      "name": "Smitten Kitchen",
      "isActive": true,
      "createdAt": "2026-01-25T10:00:00.000Z",
      "updatedAt": "2026-01-25T10:00:00.000Z"
    }
  ]
}
```

### POST /api/whitelist
Add a domain to the whitelist.

Request:
```json
{
  "domain": "valdemarsro.dk",
  "name": "Valdemarsro"
}
```

Response 201:
```json
{
  "site": {
    "id": "site_456",
    "domain": "valdemarsro.dk",
    "name": "Valdemarsro",
    "isActive": true,
    "createdAt": "2026-01-25T10:05:00.000Z",
    "updatedAt": "2026-01-25T10:05:00.000Z"
  }
}
```

Errors:
- 409 `CONFLICT` if domain already exists for the household.

### PATCH /api/whitelist/:id
Update a whitelist site (enable/disable or rename).

Request:
```json
{
  "name": "Valdemarsro",
  "isActive": false
}
```

Response 200:
```json
{ "site": { "id": "site_456", "domain": "valdemarsro.dk", "name": "Valdemarsro", "isActive": false } }
```

---

## Recipe Import (URL-based)

### POST /api/recipes/import
Import a recipe from a whitelisted URL.

Request:
```json
{
  "url": "https://smittenkitchen.com/spaghetti-and-meatballs"
}
```

Response 201:
```json
{
  "recipe": {
    "id": "recipe_123",
    "title": "Spaghetti and Meatballs",
    "imageUrl": "https://...",
    "sourceUrl": "https://smittenkitchen.com/spaghetti-and-meatballs",
    "sourceDomain": "smittenkitchen.com",
    "servings": 4,
    "isFavorite": false,
    "isFamilyFriendly": true,
    "needsReview": false,
    "ingredients": [
      { "id": "ing_1", "position": 1, "line": "400 g spaghetti" }
    ],
    "steps": ["Boil pasta", "Cook meatballs"],
    "createdAt": "2026-01-25T10:10:00.000Z",
    "updatedAt": "2026-01-25T10:10:00.000Z"
  }
}
```

Errors:
- 403 `NOT_ALLOWED` if domain is not whitelisted or is inactive.
- 422 `IMPORT_FAILED` if parsing fails.

---

## Recipe List & Detail

### GET /api/recipes
List recipes with optional filters.

Query params:
- `q` (string, optional): search by title
- `favorites` (boolean, optional)
- `familyFriendly` (boolean, optional)

Response 200:
```json
{
  "recipes": [
    {
      "id": "recipe_123",
      "title": "Spaghetti and Meatballs",
      "imageUrl": "https://...",
      "isFavorite": true,
      "isFamilyFriendly": true,
      "servings": 4,
      "createdAt": "2026-01-25T10:10:00.000Z",
      "updatedAt": "2026-01-25T10:10:00.000Z"
    }
  ]
}
```

### GET /api/recipes/:id
Get recipe detail.

Response 200:
```json
{
  "recipe": {
    "id": "recipe_123",
    "title": "Spaghetti and Meatballs",
    "imageUrl": "https://...",
    "sourceUrl": "https://smittenkitchen.com/spaghetti-and-meatballs",
    "sourceDomain": "smittenkitchen.com",
    "servings": 4,
    "isFavorite": true,
    "isFamilyFriendly": true,
    "needsReview": false,
    "ingredients": [
      { "id": "ing_1", "position": 1, "line": "400 g spaghetti" }
    ],
    "steps": ["Boil pasta", "Cook meatballs"],
    "createdAt": "2026-01-25T10:10:00.000Z",
    "updatedAt": "2026-01-25T10:10:00.000Z"
  }
}
```

### PATCH /api/recipes/:id
Update editable fields.

Request:
```json
{
  "title": "Spaghetti & Meatballs",
  "imageUrl": "https://...",
  "servings": 4,
  "isFavorite": true,
  "isFamilyFriendly": true,
  "ingredients": [
    { "position": 1, "line": "400 g spaghetti" },
    { "position": 2, "line": "500 g ground beef" }
  ],
  "steps": ["Boil pasta", "Cook meatballs"]
}
```

Response 200:
```json
{ "recipe": { "id": "recipe_123", "title": "Spaghetti & Meatballs" } }
```

Errors:
- 404 `NOT_FOUND` if recipe does not exist.

---

## Weekly Plan CRUD (Fixed 3 Items)

### GET /api/weekly-plan
Get current week plan.

Response 200:
```json
{
  "weeklyPlan": {
    "id": "plan_123",
    "weekStart": "2026-01-19T00:00:00.000Z",
    "items": [
      { "id": "item_1", "recipeId": "recipe_123", "servings": 4 }
    ]
  }
}
```

### PUT /api/weekly-plan
Replace weekly plan items (exactly 3 required).

Request:
```json
{
  "weekStart": "2026-01-19T00:00:00.000Z",
  "items": [
    { "recipeId": "recipe_123", "servings": 4 },
    { "recipeId": "recipe_456", "servings": 4 },
    { "recipeId": "recipe_789", "servings": 4 }
  ]
}
```

Response 200:
```json
{
  "weeklyPlan": {
    "id": "plan_123",
    "weekStart": "2026-01-19T00:00:00.000Z",
    "items": [
      { "id": "item_1", "recipeId": "recipe_123", "servings": 4 },
      { "id": "item_2", "recipeId": "recipe_456", "servings": 4 },
      { "id": "item_3", "recipeId": "recipe_789", "servings": 4 }
    ]
  }
}
```

Errors:
- 400 `VALIDATION_ERROR` if items length != 3.

---

## Shopping List Generation

### POST /api/shopping-list/generate
Generate (or regenerate) shopping list for current weekly plan.

Response 200:
```json
{
  "shoppingList": {
    "weeklyPlanId": "plan_123",
    "items": [
      {
        "id": "shop_1",
        "name": "ground beef",
        "category": "MEAT_FISH",
        "quantityText": "500 g",
        "isBought": false
      }
    ]
  }
}
```

Errors:
- 409 `CONFLICT` if weekly plan is incomplete.

### PATCH /api/shopping-list/items/:id
Update a shopping list item (toggle bought or edit name).

Request:
```json
{
  "isBought": true,
  "name": "ground beef",
  "quantityText": "500 g",
  "category": "MEAT_FISH"
}
```

Response 200:
```json
{ "item": { "id": "shop_1", "isBought": true } }
```

---

## Inventory List & Updates

### GET /api/inventory
List inventory items.

Query params:
- `location` (optional): `FRIDGE` or `PANTRY`
- `active` (optional): boolean (default true)

Response 200:
```json
{
  "items": [
    { "id": "inv_1", "name": "olive oil", "location": "PANTRY", "isActive": true }
  ]
}
```

### POST /api/inventory
Add an inventory item.

Request:
```json
{
  "name": "milk",
  "location": "FRIDGE"
}
```

Response 201:
```json
{ "item": { "id": "inv_2", "name": "milk", "location": "FRIDGE", "isActive": true } }
```

### PATCH /api/inventory/:id
Update inventory item (rename, move, deactivate).

Request:
```json
{
  "name": "whole milk",
  "location": "FRIDGE",
  "isActive": false
}
```

Response 200:
```json
{ "item": { "id": "inv_2", "name": "whole milk", "location": "FRIDGE", "isActive": false } }
```

---

## Fridge Photo Upload (Stub)

### POST /api/fridge-photo
Upload a fridge photo (stubbed). Multipart form-data.

Request (multipart):
- `photo` (file)
- `useForInventory` (boolean, optional)

Response 200:
```json
{
  "detectedItems": ["milk", "carrots"],
  "mode": "suggestions_only"
}
```

Errors:
- 415 `VALIDATION_ERROR` if file is missing/invalid.

