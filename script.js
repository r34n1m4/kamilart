/* ====================================
   SCRIPT: Art Gallery JavaScript
   Modular, maintainable architecture
   Future-proof for API integration
   ==================================== */

/* ====================================
   1. DATA LAYER
   Fetches artworks from Supabase via API
   Uses caching to minimize API calls
   ==================================== */

const ArtworkData = {
    // Cache for artworks fetched from API
    artworks: [],
    isLoaded: false,

    /**
     * Fetches all published artworks from Supabase via API
     * @returns {Promise<Array>} Array of artwork objects
     */
    async getAll() {
        if (!this.isLoaded) {
            await this.fetchFromAPI();
        }
        return this.artworks;
    },

    /**
     * Fetches artworks by category from cached data
     * @param {string} category - Category filter (e.g., 'oil', 'pastel')
     * @returns {Promise<Array>} Filtered array of artworks
     */
    async getByCategory(category) {
        const allArtworks = await this.getAll();
        
        if (category === 'all') {
            return allArtworks;
        }
        
        return allArtworks.filter(artwork => artwork.category === category);
    },

    /**
     * Gets all unique categories from cached data
     * @returns {Promise<Array<string>>} Array of unique categories sorted
     */
    async getCategories() {
        const allArtworks = await this.getAll();
        const categories = new Set(allArtworks.map(a => a.category));
        return Array.from(categories).sort();
    },

    /**
     * Finds artwork by ID in cached data
     * @param {string} id - Artwork ID
     * @returns {Promise<Object|null>} Artwork object or null
     */
    async getById(id) {
        const allArtworks = await this.getAll();
        return allArtworks.find(artwork => artwork.id === id) || null;
    },

    /**
     * Fetches artworks from Supabase API endpoint
     * @private
     */
    async fetchFromAPI() {
        try {
            const response = await fetch('/api/artworks');
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch artworks');
            }
            
            this.artworks = await response.json();
            this.isLoaded = true;
            
            console.log(`Loaded ${this.artworks.length} artworks from Supabase`);
        } catch (error) {
            console.error('Error fetching artworks from API:', error);
            // Fallback to empty array to prevent UI breakage
            this.artworks = [];
            this.isLoaded = true;
        }
    }
};

/* ====================================
   2. UI LAYER - Gallery Rendering
   Modular rendering functions
   ==================================== */

const GalleryUI = {
    /**
     * Renders the gallery grid from artwork data
     * @param {Array} artworks - Array of artwork objects
     */
    renderGallery(artworks) {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (!galleryGrid) return;

        if (artworks.length === 0) {
            galleryGrid.innerHTML = '<div class="empty-state"><p>No artworks found.</p></div>';
            return;
        }

        galleryGrid.innerHTML = artworks.map(artwork => this.createGalleryItem(artwork)).join('');
        
        // Attach click handlers to gallery items
        galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const artworkId = item.dataset.id;
                Lightbox.open(artworkId);
            });
        });
    },

    /**
     * Creates HTML for a single gallery item
     * @param {Object} artwork - Artwork data object
     * @returns {string} HTML string
     */
    createGalleryItem(artwork) {
        return `
            <div class="gallery-item" data-id="${artwork.id}" data-category="${artwork.category}">
                <img src="${artwork.image}" alt="${artwork.title}" loading="lazy">
                <div class="gallery-item-overlay">
                    <div class="gallery-item-info">
                        <div class="gallery-item-title">${this.escapeHtml(artwork.title)}</div>
                        <div class="gallery-item-category">${artwork.category}</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Escapes HTML special characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};

/* ====================================
   3. FILTER FUNCTIONALITY
   Manages category filtering
   ==================================== */

const Gallery = {
    currentFilter: 'all',

    /**
     * Initializes the gallery
     */
    async init() {
        try {
            // Render initial gallery
            await this.applyFilter('all');

            // Attach filter button listeners
            this.attachFilterListeners();
        } catch (error) {
            console.error('Error initializing gallery:', error);
        }
    },

    /**
     * Applies filter and updates gallery
     * @param {string} category - Category to filter by
     */
    async applyFilter(category) {
        this.currentFilter = category;
        
        try {
            const artworks = await ArtworkData.getByCategory(category);
            GalleryUI.renderGallery(artworks);
            
            // Update active button state
            this.updateFilterButtons(category);
        } catch (error) {
            console.error('Error applying filter:', error);
        }
    },

    /**
     * Updates which filter button appears active
     * @param {string} category - Active category
     */
    updateFilterButtons(category) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });
    },

    /**
     * Attaches click listeners to filter buttons
     */
    attachFilterListeners() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.filter;
                this.applyFilter(category);
            });
        });
    }
};

/* ====================================
   4. SCROLL ANIMATIONS
   Premium scroll-triggered animations for hero section
   ==================================== */

const ScrollAnimations = {
    /**
     * Animation states
     */
    hasAnimated: false,

    /**
     * Initialize scroll animations
     */
    init() {
        this.setupIntersectionObserver();
        this.addScrollEffects();
    },

    /**
     * Setup Intersection Observer for hero section
     */
    setupIntersectionObserver() {
        const heroSection = document.querySelector('.hero');

        if (!heroSection) {
            console.warn('Hero section not found for scroll animations');
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.hasAnimated) {
                        this.animateHeroEntrance();
                        this.hasAnimated = true;
                    }
                });
            },
            {
                threshold: 0.18,
                rootMargin: '0px 0px -120px 0px'
            }
        );

        observer.observe(heroSection);
    },

    /**
     * Animate hero entrance with staggered effects
     */
    animateHeroEntrance() {
        const heroSection = document.querySelector('.hero');
        const logoContainer = document.querySelector('.hero-logo-container');
        const photoContainer = document.querySelector('.hero-photo-container');
        const bioContainer = document.querySelector('.hero-bio-container');

        heroSection?.classList.add('hero-visible');

        if (logoContainer) {
            setTimeout(() => {
                logoContainer.classList.add('animate-in');
            }, 180);
        }

        if (photoContainer) {
            setTimeout(() => {
                photoContainer.classList.add('animate-in');
            }, 360);
        }

        if (bioContainer) {
            setTimeout(() => {
                bioContainer.classList.add('animate-in');
            }, 540);
        }
    },

    /**
     * Add scroll-based parallax effects
     */
    addScrollEffects() {
        const heroSection = document.querySelector('.hero');

        if (!heroSection) return;

        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollEffects(heroSection);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    },

    /**
     * Update scroll-based effects
     */
    updateScrollEffects(heroSection) {
        const rect = heroSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const progress = Math.max(0, Math.min(1, 1 - rect.top / windowHeight));

        const offset = Math.round((progress - 0.5) * 12);
        heroSection.style.setProperty('--hero-bg-offset', `${offset}px`);
    }
};

/* ====================================
   5. LIGHTBOX / MODAL
   Handles image preview and navigation
   ==================================== */

const Lightbox = {
    currentIndex: 0,
    currentArtworks: [],

    /**
     * Opens lightbox for specific artwork
     * @param {string} artworkId - ID of artwork to display
     */
    async open(artworkId) {
        try {
            // Get all artworks in current filter
            this.currentArtworks = await ArtworkData.getByCategory(Gallery.currentFilter);
            
            // Find index of clicked artwork
            this.currentIndex = this.currentArtworks.findIndex(a => a.id === artworkId);
            
            if (this.currentIndex === -1) {
                console.error('Artwork not found');
                return;
            }

            this.display();
            this.showLightbox();
        } catch (error) {
            console.error('Error opening lightbox:', error);
        }
    },

    /**
     * Displays artwork in lightbox
     */
    display() {
        const artwork = this.currentArtworks[this.currentIndex];
        
        if (!artwork) return;

        const img = document.getElementById('lightboxImage');
        const title = document.getElementById('lightboxTitle');
        const category = document.getElementById('lightboxCategory');
        const description = document.getElementById('lightboxDescription');
        const year = document.getElementById('lightboxYear');

        img.src = artwork.image;
        img.alt = artwork.title;
        title.textContent = GalleryUI.escapeHtml(artwork.title);
        category.textContent = artwork.category;
        description.textContent = artwork.description || '';
        year.textContent = artwork.year ? `${artwork.year}` : '';

        // Update navigation button visibility
        this.updateNavButtons();
    },

    /**
     * Shows lightbox modal
     */
    showLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Closes lightbox modal
     */
    close() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },

    /**
     * Shows next artwork in gallery
     */
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.currentArtworks.length;
        this.display();
    },

    /**
     * Shows previous artwork in gallery
     */
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.currentArtworks.length) % this.currentArtworks.length;
        this.display();
    },

    /**
     * Updates navigation button states
     */
    updateNavButtons() {
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');

        // Enable/disable buttons based on position
        // (Optional: you can remove this for infinite loop navigation)
        if (prevBtn && nextBtn) {
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        }
    },

    /**
     * Attaches event listeners to lightbox controls
     */
    attachListeners() {
        const closBtn = document.getElementById('closeLightbox');
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        const lightbox = document.getElementById('lightbox');

        if (closBtn) {
            closBtn.addEventListener('click', () => this.close());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        // Close on background click
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    this.close();
                }
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (lightbox && lightbox.classList.contains('active')) {
                if (e.key === 'ArrowLeft') this.prev();
                if (e.key === 'ArrowRight') this.next();
                if (e.key === 'Escape') this.close();
            }
        });
    }
};

/* ====================================
   5. INITIALIZATION
   Runs when DOM is ready
   ==================================== */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize gallery
        await Gallery.init();

        // Attach lightbox listeners
        Lightbox.attachListeners();

        // Initialize scroll animations
        ScrollAnimations.init();

        console.log('Gallery and animations initialized successfully');
    } catch (error) {
        console.error('Error initializing gallery:', error);
    }
});
