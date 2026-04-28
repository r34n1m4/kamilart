# Quick Start & Customization Guide

Get your art gallery up and running in 5 minutes, then customize it to match your style.

## 5-Minute Quick Start

### Step 1: Replace Artwork Data (2 minutes)

Open `script.js` and find the `ArtworkData.artworks` array (around line 23).

Replace with your artworks:

```javascript
const ArtworkData = {
    artworks: [
        {
            id: '001',
            title: 'Your First Painting',
            category: 'watercolor',
            image: 'https://link-to-your-image.jpg',
            description: 'Description of your artwork',
            year: 2025
        },
        {
            id: '002',
            title: 'Your Second Painting',
            category: 'acrylic',
            image: 'https://another-link.jpg',
            description: 'Another description',
            year: 2025
        }
        // Add more artworks...
    ],
    // ... rest of the code stays the same
};
```

### Step 2: Update About Section (1 minute)

Open `index.html` and find the About section (around line 35):

```html
<section id="about" class="about">
    <div class="container">
        <div class="about-content">
            <h2>About</h2>
            <p>Replace this with your personal bio and artistic statement.</p>
        </div>
    </div>
</section>
```

### Step 3: Open in Browser (1 minute)

Double-click `index.html` or drag it into your browser. Done! ✨

### Step 4: Test It (1 minute)

- Click on images - should open in modal
- Click filter buttons - should update gallery
- Try arrow keys and Escape in the modal
- Test on your phone

## Customization Guide

### Option 1: Using Online Images (Easiest)

Use existing images from:
- Unsplash: `https://unsplash.com`
- Pexels: `https://pexels.com`
- Your own server/cloud storage

```javascript
{
    id: '001',
    title: 'Beautiful Sunset',
    category: 'watercolor',
    image: 'https://images.unsplash.com/photo-xxx?w=600&h=600&fit=crop',
    year: 2025
}
```

### Option 2: Using Local Images

1. Create an `images/` folder in the same directory as `index.html`
2. Add your images to it
3. Update the `image` property to use relative paths:

```
kamilart/
├── index.html
├── style.css
├── script.js
└── images/
    ├── painting1.jpg
    ├── painting2.jpg
    └── painting3.jpg
```

In `script.js`:
```javascript
{
    id: '001',
    title: 'My Painting',
    category: 'acrylic',
    image: 'images/painting1.jpg',
    year: 2025
}
```

### Customizing Colors

Open `style.css` and update the CSS variables at the top (lines 8-23):

**Change Background Color:**
```css
:root {
    --primary-light: #f8f8f8;  /* Changed from white (#ffffff) */
}
```

**Change Text Color:**
```css
:root {
    --text-primary: #333333;   /* Darker or lighter gray */
}
```

**Create a Dark Theme:**
```css
:root {
    --primary-light: #1a1a1a;      /* Dark background */
    --primary-dark: #ffffff;       /* Light text */
    --accent-gray: #2a2a2a;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
}
```

**Change Accent Color (hover effects):**
```css
:root {
    --border-color: #cc0000;   /* Red accents instead of gray */
}
```

### Customizing Typography

**Change Hero Title Font Size:**
```css
.hero-title {
    font-size: clamp(2rem, 8vw, 5rem);  /* Changed from 2.5rem to 5rem */
}
```

**Change Font Family (Google Fonts example):**

1. Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
```

2. Update in `style.css`:
```css
body {
    font-family: 'Playfair Display', serif;
}
```

### Customizing Spacing

All spacing is controlled by CSS variables (lines 15-21):

```css
:root {
    --spacing-xs: 0.5rem;    /* Extra small */
    --spacing-sm: 1rem;      /* Small */
    --spacing-md: 1.5rem;    /* Medium */
    --spacing-lg: 2rem;      /* Large */
    --spacing-xl: 3rem;      /* Extra large */
}
```

To make everything more compact:
```css
:root {
    --spacing-md: 1rem;      /* Reduced from 1.5rem */
    --spacing-lg: 1.5rem;    /* Reduced from 2rem */
    --spacing-xl: 2rem;      /* Reduced from 3rem */
}
```

### Customizing Gallery Layout

**Change Grid Columns (more/fewer items per row):**

In `style.css`, find `.gallery-grid` (around line 283):

```css
.gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    /* Larger minmax = fewer items per row */
    /* Smaller minmax = more items per row */
}
```

**Examples:**
```css
/* 5 items per row on desktop */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* 2 items per row on desktop */
grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
```

### Customizing Hero Section

**Add Background Image:**

```css
.hero {
    background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), 
                url('path/to/background.jpg');
    background-size: cover;
    background-position: center;
}
```

**Remove the floating pattern:**

Find `.hero::before` (around line 123) and delete it or set `display: none`:

```css
.hero::before {
    display: none;
}
```

### Customizing Category Names

Edit categories directly in `script.js`:

Find categories where they're defined:
```javascript
artworks: [
    {
        // Change from 'watercolor' to 'watercolour' or 'water_color'
        category: 'watercolor',
        // ...
    }
]
```

Categories are auto-generated from artwork data, so just update the data.

## Deployment

### Deploy to GitHub Pages (Free)

1. Create a GitHub repository named `yourusername.github.io`
2. Push these files to the repository
3. Visit `https://yourusername.github.io` - done!

### Deploy to Netlify (Free)

1. Drag and drop the `kamilart` folder into Netlify
2. Get a live URL instantly
3. Optional: Connect custom domain

### Deploy to Vercel (Free)

1. Connect your GitHub repository
2. Vercel auto-deploys on every push
3. Optional: Add custom domain

## Adding More Features (Future)

### Add Search Functionality

```javascript
// In script.js, add to Gallery module:

async applySearch(query) {
    const artworks = await ArtworkData.getAll();
    const results = artworks.filter(a => 
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.description?.toLowerCase().includes(query.toLowerCase())
    );
    GalleryUI.renderGallery(results);
}
```

### Add Sorting

```javascript
// Sort by date (newest first)
function sortByYear(artworks) {
    return artworks.sort((a, b) => (b.year || 0) - (a.year || 0));
}

// Sort alphabetically
function sortByTitle(artworks) {
    return artworks.sort((a, b) => a.title.localeCompare(b.title));
}
```

### Add Favorites

```javascript
const Favorites = {
    storage: 'gallery_favorites',
    
    add(artworkId) {
        const list = this.getAll();
        if (!list.includes(artworkId)) {
            list.push(artworkId);
            localStorage.setItem(this.storage, JSON.stringify(list));
        }
    },
    
    remove(artworkId) {
        const list = this.getAll();
        const updated = list.filter(id => id !== artworkId);
        localStorage.setItem(this.storage, JSON.stringify(updated));
    },
    
    getAll() {
        const data = localStorage.getItem(this.storage);
        return data ? JSON.parse(data) : [];
    }
};
```

### Add Sharing Buttons

Add to lightbox info section in `index.html`:

```html
<div class="lightbox-share">
    <button onclick="shareOnTwitter()" title="Share on Twitter">Twitter</button>
    <button onclick="shareOnFacebook()" title="Share on Facebook">Facebook</button>
    <button onclick="copyLinkToClipboard()" title="Copy link">Copy Link</button>
</div>
```

Add to `script.js`:

```javascript
function shareOnTwitter() {
    const artwork = Lightbox.currentArtworks[Lightbox.currentIndex];
    const text = `Check out "${artwork.title}" in my art gallery: `;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url);
}

function copyLinkToClipboard() {
    const artwork = Lightbox.currentArtworks[Lightbox.currentIndex];
    navigator.clipboard.writeText(window.location.href + '#' + artwork.id);
}
```

## Troubleshooting

### "Gallery not showing"
- Check browser console (F12) for errors
- Ensure `artworks` array in `script.js` is not empty
- Verify image URLs are correct

### "Images won't load"
- Check image URLs are accessible (try in address bar)
- For local images, verify path is correct (e.g., `images/photo.jpg`)
- Check browser console for CORS errors

### "Filters not working"
- Verify `category` values are spelled consistently
- Check JavaScript isn't disabled in browser
- Look for errors in browser console (F12)

### "Lightbox freezes/crashes"
- Check image URLs are valid
- Try in a different browser
- Clear browser cache (Ctrl+Shift+Delete)

## Next Steps

1. ✅ Replace sample data with your artworks
2. ✅ Customize colors and fonts
3. ✅ Test on mobile devices
4. ✅ Deploy to hosting service
5. ✅ Share your gallery!

## Need Help?

- Check `README.md` for full documentation
- Check `ARCHITECTURE.md` for technical details
- Review code comments for explanations
- Check browser console for error messages

---

**Happy Creating! 🎨**
