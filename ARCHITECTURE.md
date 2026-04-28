# Architecture & Development Guide

This document provides detailed information about the gallery's architecture and how to extend it.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│             USER INTERFACE LAYER                    │
│  (HTML Structure in index.html)                      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│          PRESENTATION LAYER (script.js)             │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  GalleryUI   │  │   Gallery   │  │ Lightbox   │ │
│  │ (Rendering)  │  │ (Filtering) │  │ (Modals)   │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│            DATA LAYER (script.js)                   │
│  ┌──────────────────────────────────────────────┐   │
│  │         ArtworkData Module                   │   │
│  │  - getAll()      (fetch all artworks)        │   │
│  │  - getByCategory (fetch filtered)            │   │
│  │  - getById       (fetch single)              │   │
│  │  - getCategories (fetch categories)          │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   DATA SOURCE         │
         │  In-memory JS object  │
         │  (Currently static)   │
         └───────────────────────┘
```

### Future Migration Path

```
In-Memory Data
      ↓
   JSON File (via fetch)
      ↓
   REST API Endpoint
      ↓
   GraphQL API
      ↓
   Database with Authentication
```

Each layer change requires modifications only in the `ArtworkData` module—zero changes to UI layer.

## Module Reference

### ArtworkData Module

**Purpose:** Abstraction layer for data access

**Key Methods:**
- `getAll()` - Returns Promise resolving to all artworks
- `getByCategory(category)` - Returns Promise with filtered results
- `getById(id)` - Returns single artwork object
- `getCategories()` - Returns array of unique categories

**Design Pattern:** Repository pattern with async/await

**Future Replacement:**
```javascript
// Current: In-memory
async getAll() {
    return Promise.resolve(this.artworks);
}

// Future: REST API
async getAll() {
    const response = await fetch(`${API_BASE_URL}/artworks`);
    if (!response.ok) throw new Error('Failed to fetch artworks');
    const data = await response.json();
    return data.artworks;
}

// Future: GraphQL API
async getAll() {
    const query = `
        query {
            artworks {
                id title category image description year
            }
        }
    `;
    const response = await fetch(`${GRAPHQL_ENDPOINT}`, {
        method: 'POST',
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data.data.artworks;
}
```

### GalleryUI Module

**Purpose:** All rendering logic

**Key Methods:**
- `renderGallery(artworks)` - Renders grid from data array
- `createGalleryItem(artwork)` - Creates HTML for single item
- `escapeHtml(text)` - Sanitizes HTML for security

**Design Pattern:** Template-based rendering

**Extension Points:**
```javascript
// Add new rendering method
renderGalleryAlternative(artworks) {
    // Render as masonry layout, carousel, etc.
}

// Add new item format
createGalleryItemCompact(artwork) {
    // Alternative gallery item HTML
}
```

### Gallery Module

**Purpose:** Filter management and user interaction

**Key Methods:**
- `init()` - Initialize gallery
- `renderFilterButtons()` - Create category filters
- `applyFilter(category)` - Update gallery on filter
- `attachFilterListeners()` - Wire up click handlers

**State:**
- `currentFilter` - Active category filter

**Extension Points:**
```javascript
// Add multi-select filtering
applyMultiFilter(categories) {
    // Filter by multiple categories simultaneously
}

// Add sorting
applySortBy(sortKey) {
    // Sort artworks by date, title, etc.
}

// Add search
applySearch(query) {
    // Filter by title or description
}
```

### Lightbox Module

**Purpose:** Modal image viewing and navigation

**Key Methods:**
- `open(artworkId)` - Opens modal for specific artwork
- `display()` - Renders current image and info
- `next()`, `prev()` - Navigate between images
- `close()` - Closes modal
- `attachListeners()` - Wire up keyboard/click handlers

**State:**
- `currentIndex` - Active image position
- `currentArtworks` - Images in current filter

**Keyboard Shortcuts:**
- Arrow Left/Right - Navigate images
- Escape - Close modal

**Extension Points:**
```javascript
// Add share functionality
share(platform) {
    // Share current artwork on social media
}

// Add favorites
toggleFavorite(artworkId) {
    // Add/remove from favorites list
}

// Add comments (requires backend)
loadComments(artworkId) {
    // Fetch and display comments
}
```

## Styling Architecture

### CSS Organization

**Root Variables** (line 8-23)
- Centralized color management
- Easy theme switching
- Reusable spacing scale

**Component Sections**
1. Reset & Global (line 37)
2. Navigation (line 56)
3. Hero (line 87)
4. About (line 137)
5. Gallery (line 160)
6. Lightbox (line 267)
7. Footer (line 356)

### Responsive Design Approach

**Mobile-First**
- Base styles for mobile
- Breakpoints add complexity as needed

**Key Breakpoints:**
```css
/* Mobile (default) */
/* Tablet */
@media (max-width: 768px) { }

/* Small mobile */
@media (max-width: 480px) { }
```

### CSS Variables Strategy

**Color System:**
```css
--primary-dark    /* Darkest color, used for text/accents */
--primary-light   /* Lightest color, used for backgrounds */
--accent-gray     /* Secondary background */
--text-primary    /* Main text color */
--text-secondary  /* Muted text color */
```

**Spacing Scale (1.5x):**
```
--spacing-xs  = 0.5rem  (8px)
--spacing-sm  = 1rem    (16px)
--spacing-md  = 1.5rem  (24px)
--spacing-lg  = 2rem    (32px)
--spacing-xl  = 3rem    (48px)
```

**Transitions:**
```
--transition-fast    = 0.2s (UI feedback)
--transition-normal  = 0.3s (hover states)
--transition-smooth  = 0.5s (enter animations)
```

## Data Model

### Artwork Schema

```javascript
{
    id: string,              // Unique identifier (e.g., '001')
    title: string,           // Artwork name
    category: string,        // Category for filtering
    image: string,           // Image URL or path
    description: string,     // Optional description
    year: number             // Optional creation year
}
```

### Validation

Currently: None (trust user data)

**Future:** Add validation layer
```javascript
class ArtworkValidator {
    static validate(artwork) {
        if (!artwork.id) throw new Error('Missing id');
        if (!artwork.title) throw new Error('Missing title');
        if (!artwork.image) throw new Error('Missing image');
        return true;
    }
}
```

## Error Handling

**Current Approach:**
- Try/catch blocks in init functions
- Console error logging
- Graceful UI fallback (empty state)

**Example:**
```javascript
catch (error) {
    console.error('Error initializing gallery:', error);
    // UI continues working with empty gallery
}
```

**Future Enhancements:**
```javascript
// User-visible error messages
showError('Failed to load artworks. Please try again.');

// Error tracking/reporting
logErrorToService(error);

// Retry logic with exponential backoff
await retryWithBackoff(() => ArtworkData.getAll());
```

## Testing Strategy

### Manual Testing Checklist

**Functionality:**
- [ ] Gallery loads with sample data
- [ ] Filter buttons appear for each category
- [ ] Clicking filter updates gallery
- [ ] Clicking image opens lightbox
- [ ] Previous/next navigation works
- [ ] Escape key closes lightbox
- [ ] Arrow keys navigate images

**Responsive Design:**
- [ ] Mobile (375px, iPhone SE)
- [ ] Tablet (768px, iPad)
- [ ] Desktop (1200px, standard monitor)
- [ ] Large (1920px, HD monitor)

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] High contrast text readable
- [ ] Images have alt text
- [ ] Reduced motion respected

**Performance:**
- [ ] Images load quickly (lazy loading)
- [ ] Smooth animations (60fps)
- [ ] No console errors

### Automated Testing (Future)

```javascript
// Example with Jest
describe('Gallery', () => {
    test('initializes with all artworks', async () => {
        await Gallery.init();
        const items = document.querySelectorAll('.gallery-item');
        expect(items.length).toBeGreaterThan(0);
    });

    test('filters by category', async () => {
        await Gallery.applyFilter('watercolor');
        const items = document.querySelectorAll('[data-category="watercolor"]');
        expect(items.length).toBeGreaterThan(0);
    });
});
```

## Performance Optimization

### Current Implementation

- ✅ Lazy image loading (`loading="lazy"`)
- ✅ CSS animations (no JavaScript animation)
- ✅ Event delegation where possible
- ✅ Minimal DOM manipulation
- ✅ No external dependencies

### Future Optimizations

```javascript
// Image optimization
const imageOptimizer = {
    getResponsiveUrl(image, width) {
        // Serve appropriately sized image based on device
    },
    
    lazyLoadImage(element) {
        // Intersection Observer API
    }
};

// State management optimization
const cacheManager = {
    cache: {},
    
    get(key) {
        return this.cache[key];
    },
    
    set(key, value) {
        this.cache[key] = value;
    }
};
```

## Security Considerations

### Current Measures

- ✅ HTML escaping in `escapeHtml()` function
- ✅ No `eval()` or `innerHTML` with user data
- ✅ No sensitive data in frontend

### Future Security

When adding backend:
- ✅ HTTPS only
- ✅ CSRF tokens for mutations
- ✅ Authentication via JWT
- ✅ Server-side validation
- ✅ Rate limiting
- ✅ Input sanitization

```javascript
// Example: Secure API request
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': getCsrfToken()
        }
    });
    
    if (response.status === 401) {
        // Handle unauthorized
        redirectToLogin();
    }
    
    return response.json();
}
```

## SEO Optimization

### Current Implementation

- ✅ Semantic HTML
- ✅ Meta description
- ✅ Proper heading hierarchy
- ✅ Image alt text

### Future Enhancements

```html
<!-- Open Graph for social sharing -->
<meta property="og:title" content="Art Gallery">
<meta property="og:image" content="thumbnail.jpg">

<!-- Structured data (Schema.org) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ArtGallery",
  "name": "Art Gallery",
  "image": "logo.jpg"
}
</script>
```

## Deployment Options

### Static Hosting (Recommended for Stage 1)

- GitHub Pages (free)
- Netlify (free tier available)
- Vercel (free tier available)
- AWS S3 + CloudFront
- Firebase Hosting

### Full Backend (For future stages)

- Node.js + Express
- Django/Python
- Ruby on Rails
- Other preferred backend framework

---

**Last Updated:** 2026
**Version:** 1.0 (Stage 1)
