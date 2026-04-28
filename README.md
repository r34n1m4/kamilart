# Art Gallery Website - Stage 1

A scalable, production-quality personal art gallery built with pure HTML, CSS, and vanilla JavaScript. Designed to evolve from static frontend to a full web application without rewriting code.

## 🎨 Features

- **Fully Responsive Design** - Mobile-first approach, works on all devices
- **Image Gallery Grid** - Dynamic rendering from data source
- **Category Filtering** - Filter artworks by type (watercolor, acrylic, sketches, etc.)
- **Image Lightbox** - Click to view full-size image with navigation
- **Smooth Animations** - Fade-in, hover effects, and transitions
- **Minimalist Aesthetic** - Clean, modern design focused on artwork presentation
- **Modular Architecture** - Easily maintainable code structure
- **Future-Proof** - Ready to migrate to backend API without frontend rewrite

## 📁 Project Structure

```
kamilart/
├── index.html         # Main HTML structure (no hardcoded content)
├── style.css          # All styling with CSS variables
├── script.js          # Modular JavaScript with separation of concerns
├── artworks.json      # Sample data file (optional)
└── README.md          # This file
```

## 🚀 Getting Started

### Quick Start

1. **Open in browser**: Simply open `index.html` in any modern web browser
   - No build tools required
   - No dependencies to install
   - Works offline (except for remote images)

2. **Customize artworks**: Edit the `artworks` array in `script.js` (around line 23)

### Adding Your Own Artworks

The data model is defined in `script.js` under `ArtworkData.artworks`. Each artwork follows this structure:

```javascript
{
    id: '001',              // Unique identifier
    title: 'Artwork Name',  // Display title
    category: 'watercolor', // Category for filtering
    image: 'url-to-image',  // Image URL
    description: 'Text',    // Optional description
    year: 2025              // Optional year created
}
```

**Example:**
```javascript
{
    id: '009',
    title: 'My Beautiful Painting',
    category: 'acrylic',
    image: 'path/to/my-painting.jpg',
    description: 'Description of the artwork',
    year: 2025
}
```

### Using Local Images

1. Create an `images/` folder in the same directory as `index.html`
2. Add your images to this folder
3. Update the `image` property to use relative paths:
   ```javascript
   image: 'images/my-painting.jpg'
   ```

### Customizing Categories

Categories are automatically extracted from the artwork data. To add a new category:

1. Add an artwork with a new `category` value
2. The category filter button will appear automatically

Current categories:
- `watercolor`
- `acrylic`
- `sketches`
- `experiments`

## 🎨 Customization Guide

### Colors & Styling

All colors are defined as CSS variables in `style.css` (around line 8):

```css
:root {
    --primary-dark: #1a1a1a;      /* Main dark color */
    --primary-light: #ffffff;     /* Main light color */
    --accent-gray: #f5f5f5;       /* Background accent */
    --text-primary: #2c2c2c;      /* Main text color */
    --text-secondary: #666666;    /* Secondary text */
    /* ... more variables ... */
}
```

Change these values to match your brand.

### Typography

Modify font sizes and weights in `style.css`:
- Hero title: `.hero-title` (line ~185)
- Gallery title: `.gallery-title` (line ~240)
- Navigation: `.nav-brand`, `.nav-link` (line ~85)

### Animations

Animation durations are defined in CSS variables:
```css
--transition-fast: 0.2s ease-in-out;
--transition-normal: 0.3s ease-in-out;
--transition-smooth: 0.5s ease-in-out;
```

Adjust these values to speed up or slow down animations.

### About Section

Edit the about text in `index.html` (line ~41):
```html
<p>Each piece is a thoughtful exploration of color, form, and emotion...</p>
```

## 🏗️ Architecture

### Separation of Concerns

The JavaScript is organized into clear modules:

1. **ArtworkData** (line 20)
   - Handles all data operations
   - Easy to replace with API calls later
   - Provides methods: `getAll()`, `getByCategory()`, `getById()`

2. **GalleryUI** (line 80)
   - Renders HTML from data
   - Creates gallery items
   - Handles HTML escaping for security

3. **Gallery** (line 130)
   - Manages filtering
   - Renders filter buttons
   - Updates gallery on filter change

4. **Lightbox** (line 200)
   - Handles modal display
   - Navigation between images
   - Keyboard shortcuts support

### Why This Architecture?

✅ **Easy to test** - Each module has single responsibility  
✅ **Easy to maintain** - Changes in one module don't affect others  
✅ **Easy to extend** - Add new features without breaking existing code  
✅ **Easy to migrate** - Replace `ArtworkData` with API calls without changing UI code  

## 🔄 Migrating to a Backend (Future)

### From Static Data to API

**Step 1:** Update `ArtworkData.getAll()` in `script.js`:

```javascript
// Before (static)
async getAll() {
    return Promise.resolve(this.artworks);
}

// After (with API)
async getAll() {
    const response = await fetch('/api/artworks');
    return response.json();
}
```

**Step 2:** Update other methods similarly:

```javascript
async getByCategory(category) {
    if (category === 'all') return this.getAll();
    const response = await fetch(`/api/artworks?category=${category}`);
    return response.json();
}
```

**That's it!** The rest of the UI code remains unchanged.

### Example Backend Endpoint

Your backend API should return JSON in this format:

```json
{
  "status": "success",
  "data": [
    {
      "id": "001",
      "title": "Artwork Name",
      "category": "watercolor",
      "image": "url-to-image",
      "description": "Description",
      "year": 2025
    }
  ]
}
```

### Adding Features Later

**Comments system:**
1. Add backend endpoint: `GET /api/artworks/:id/comments`
2. Update `script.js` to fetch comments
3. Add HTML to display comments in lightbox

**Like button:**
1. Add backend endpoint: `POST /api/artworks/:id/like`
2. Add click handler in `Lightbox` module
3. Update UI to show like count

**User authentication:**
1. Add login form
2. Store token in localStorage
3. Include token in API requests

## 🔧 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ JavaScript support
- CSS Grid and Flexbox support
- Lazy loading for images

## ♿ Accessibility

- Semantic HTML structure
- Keyboard navigation support
  - Arrow keys: Navigate between images in lightbox
  - Escape: Close lightbox
- ARIA labels for screen readers
- High contrast color scheme
- Respects `prefers-reduced-motion` setting

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

Gallery grid adapts automatically.

## 🎯 Performance

- Lazy loading images (`loading="lazy"`)
- CSS animations instead of JavaScript
- No unnecessary DOM manipulation
- Efficient event delegation
- Minimal bundle size (pure HTML/CSS/JS)

## 🔒 Security

- HTML escaping to prevent XSS attacks
- Content Security Policy ready
- No eval() or dangerous patterns
- Sanitizes user-generated content (if added later)

## 📝 Code Style

- Comments explain the "why" not the "what"
- Descriptive variable names
- Consistent formatting
- Modular functions

## 🐛 Troubleshooting

### Images not loading?
- Check image URL is correct and accessible
- For local images, ensure path is relative: `images/photo.jpg`
- Check browser console for CORS errors

### Filters not working?
- Verify artwork `category` values match exactly
- Check browser console for JavaScript errors
- Ensure JavaScript is enabled

### Lightbox not opening?
- Verify `artwork.id` is unique
- Check that image URLs are valid
- Look for JavaScript errors in browser console

## 📚 Additional Resources

### CSS Units
- `rem` for responsive sizing (based on root font size)
- `clamp()` for fluid typography
- `vw/vh` for viewport-relative sizing

### JavaScript Patterns
- Async/await for API calls
- Object methods for organization
- Event delegation for performance
- Data-driven rendering

## 🚀 Next Steps

1. **Add your artworks** - Replace sample data with your paintings
2. **Customize colors** - Update CSS variables to match your brand
3. **Add images** - Upload your actual artwork images
4. **Test on devices** - Check responsive design on phone/tablet
5. **Deploy** - Host on GitHub Pages, Netlify, or any static host

## 📄 License

MIT License - Feel free to use and modify for your project.

---

**Built with simplicity and scalability in mind.** 🎨
