// Supabase Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://fpvuwegibnwucgxieirp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const categoryContainer = document.querySelector('.category-block');
const productsContainer = document.querySelector('.products');
const productCountEl = document.querySelector('.product-count');
let selectedCategorySlug = 'all'; // Default selected category slug
let isSearchActive = false; // Track if search is active

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bx bx-info-circle notification-icon"></i>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Position it
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.backgroundColor = type === 'error' ? '#ff5555' : '#55aaff';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.transition = 'opacity 0.5s ease';
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Add skeleton loader styles to head
        addSkeletonStyles();
        updateCartCount();
        
        // Show skeleton loader immediately
        showSkeletonLoader();
        
        // Load categories first
        await loadCategories();
        
        // Then load all products
        await loadProducts();
        
        // Set up event handlers
        setupCategoryFiltering();
        setupLikeButtons();
        setupSearch();
        
        // Load favorites from localStorage
        loadFavorites();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification(`Error loading data: ${error.message}`, 'error');
    }
});

// Add skeleton loader styles to head
function addSkeletonStyles() {
    if (!document.getElementById('skeleton-styles')) {
        const skeletonStyles = document.createElement('style');
        skeletonStyles.id = 'skeleton-styles';
        skeletonStyles.textContent = `
            .skeleton-pulse {
                display: block;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            .skeleton-pulse-small {
                display: block;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: pulse 1.5s ease-in-out infinite;
                border-radius: 4px;
            }
            
            @keyframes pulse {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-category {
                height: 36px;
                width: 100px;
                border-radius: 18px;
                margin-right: 10px;
                overflow: hidden;
            }
            
            .skeleton-image {
                position: relative;
                height: 200px;
                overflow: hidden;
                border-radius: 8px;
                overflow: hidden;
                
            }
            
            .skeleton-like {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                overflow: hidden;
            }

            
            
            .skeleton-price {
                height: 20px;
                width: 80px;
                margin-bottom: 10px;
            }
            
            .skeleton-name {
                height: 18px;
                width: 100%;
                margin-bottom: 8px;
            }
            
            .skeleton-company {
                height: 16px;
                width: 60%;
            }
        `;
        document.head.appendChild(skeletonStyles);
    }
}

// Show skeleton loader for categories
function showCategorySkeletonLoader() {
    categoryContainer.innerHTML = '';
    
    // Create 5 skeleton loaders for categories
    for (let i = 0; i < 5; i++) {
        const skeletonCategory = document.createElement('div');
        skeletonCategory.className = 'category skeleton-category';
        skeletonCategory.innerHTML = `<div class="skeleton-pulse"></div>`;
        categoryContainer.appendChild(skeletonCategory);
    }
}

// Show skeleton loader for products
function showSkeletonLoader() {
    productsContainer.innerHTML = '';
    
    // Create 8 skeleton loaders (two rows of 4 products)
    const productCount = window.innerWidth > 768 ? 8 : 4;
    
    for (let i = 0; i < productCount; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'product-card skeleton';
        
        skeletonCard.innerHTML = `
            <div class="image skeleton-image">
                <div class="skeleton-pulse"></div>
                <div class="like skeleton-like"><div class="skeleton-pulse-small"></div></div>
            </div>
            <div class="details">
                <div class="price skeleton-price">
                    <div class="skeleton-pulse-small"></div>
                </div>
                <div class="product-name skeleton-name">
                    <div class="skeleton-pulse-small"></div>
                </div>
                <div class="company-name skeleton-company">
                    <div class="skeleton-pulse-small"></div>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(skeletonCard);
    }
}

// Load categories from Supabase
async function loadCategories() {
    try {
        // Show skeleton loader for categories
        showCategorySkeletonLoader();
        
        // Get all categories from categories table
        const { data: categories, error } = await supabase
            .from('categories')
            .select('name, slug');

        if (error) {
            console.error('Error loading categories:', error);
            throw new Error(error.message);
        }

        if (!categories || categories.length === 0) {
            console.log('No categories found');
            return;
        }

        console.log('Categories loaded:', categories);
        
        // Clear existing categories
        categoryContainer.innerHTML = '';
        
        // Add "All" category first
        const allCategory = document.createElement('div');
        allCategory.className = 'category active';
        allCategory.innerHTML = `<p>All</p>`;
        categoryContainer.appendChild(allCategory);
        
        // Add categories to the UI
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category';
            categoryElement.dataset.slug = category.slug;
            categoryElement.innerHTML = `<p>${category.name}</p>`;
            categoryContainer.appendChild(categoryElement);
        });
    } catch (error) {
        console.error('Error in loadCategories:', error);
        categoryContainer.innerHTML = `<div class="error">Error loading categories: ${error.message}</div>`;
        throw error;
    }
}

// Load products from Supabase
async function loadProducts(categorySlug = 'all', searchTerm = '') {
    try {
        // Show skeleton loader
        showSkeletonLoader();
        
        // Get all categories with their slugs
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name, slug');

        if (catError) {
            console.error('Error loading categories:', catError);
            throw new Error(catError.message);
        }

        if (!categories || categories.length === 0) {
            console.log('No categories found');
            productsContainer.innerHTML = '<div class="no-products">No categories found</div>';
            return;
        }

        console.log('Loading products for category slug:', categorySlug);
        
        // Fetch products from each category or specific category
        const allProducts = [];
        
        if (categorySlug === 'all') {
            // Load from all categories
            for (const cat of categories) {
                try {
                    console.log(`Fetching products from table: ${cat.slug}`);
                    const { data: products, error: prodError } = await supabase
                        .from(cat.slug)
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (prodError) {
                        console.error(`Error loading products from ${cat.slug}:`, prodError);
                        continue;
                    }

                    if (products && products.length > 0) {
                        console.log(`Found ${products.length} products in ${cat.slug}`);
                        // Add category name for display purposes
                        allProducts.push(...products.map(p => ({ 
                            ...p, 
                            categorySlug: cat.slug,
                            categoryName: cat.name
                        })));
                    }
                } catch (err) {
                    console.error(`Error with ${cat.slug} table:`, err);
                }
            }
        } else {
            // Load from specific category slug
            try {
                // Find the category name that corresponds to the slug
                const category = categories.find(c => c.slug === categorySlug);
                if (!category) {
                    throw new Error(`Category with slug '${categorySlug}' not found`);
                }
                
                console.log(`Fetching products from table: ${categorySlug}`);
                const { data: products, error: prodError } = await supabase
                    .from(categorySlug)
                    .select('*')
                    .order('created_at', { ascending: false });

                if (prodError) {
                    console.error(`Error loading products from ${categorySlug}:`, prodError);
                    throw new Error(prodError.message);
                }

                if (products && products.length > 0) {
                    console.log(`Found ${products.length} products in ${categorySlug}`);
                    allProducts.push(...products.map(p => ({ 
                        ...p, 
                        categorySlug: categorySlug,
                        categoryName: category.name
                    })));
                }
            } catch (err) {
                console.error(`Error with ${categorySlug} table:`, err);
                throw err;
            }
        }

        // Filter by search term if provided
        let filteredProducts = allProducts;
        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            filteredProducts = allProducts.filter(product => 
                (product.name && product.name.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm))
            );
        }

        console.log(`Total products loaded: ${filteredProducts.length}`);
        
        // Update product count
        if (productCountEl) {
            productCountEl.textContent = `${filteredProducts.length} products`;
        }
        
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Error in loadProducts:', error);
        productsContainer.innerHTML = `<div class="error">Error loading products: ${error.message}</div>`;
        throw error;
    }
}

// Render products to the UI
function renderProducts(products) {
    // Clear existing products
    productsContainer.innerHTML = '';
    
    // Show message if no products
    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products found</div>';
        return;
    }
    
    // Add each product to the UI
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Format price
        const price = product.price ? parseFloat(product.price).toFixed(2) : '0.00';
        const oldPrice = product.old_price ? parseFloat(product.old_price).toFixed(2) : null;
        
        // Get first available image, fallback to placeholder
        const imageUrl = product.im1 || product.im2 || product.im3 || product.im4 || 'assets/images/kit.webp';
        
        productCard.innerHTML = `
            <div class="image">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='assets/images/kit.webp'">
                <div class="like"><i class='bx bx-heart' data-id="${product.id}" data-category-slug="${product.categorySlug}"></i></div>
            </div>
            <div class="details">
                <div class="price">
                    <p class="actual-price">$${price}</p>
                    ${oldPrice ? `<p class="old-price">$${oldPrice}</p>` : ''}
                </div>
                <div class="product-name">${product.name || 'Unnamed Product'}</div>
                <div class="company-name">${product.categoryName || product.categorySlug}</div>
            </div>
        `;
        
        // Add click event to view product details
        productCard.addEventListener('click', (e) => {
            // Don't navigate if clicking the heart icon
            if (e.target.closest('.like')) {
                return;
            }
            
            // Navigate to product detail page with product ID and category
            window.location.href = `../item/?id=${product.id}&category=${product.categorySlug}`;
            console.log('Navigating to product:', product);
            showNotification(`Viewing ${product.name}`);
        });
        
        productsContainer.appendChild(productCard);
    });
    
    // After rendering, load favorites to mark any liked products
    loadFavorites();
}

// Setup category filtering
function setupCategoryFiltering() {
    categoryContainer.addEventListener('click', async (e) => {
        const categoryDiv = e.target.closest('.category');
        if (!categoryDiv) return;
        
        // Remove active class from all categories
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
        });
        
        // Add active class to clicked category
        categoryDiv.classList.add('active');
        
        // Get category slug
        // First category is "All" (has no dataset)
        let categorySlug;
        if (categoryDiv.querySelector('p').textContent.trim().toLowerCase() === 'all') {
            categorySlug = 'all';
        } else {
            categorySlug = categoryDiv.dataset.slug;
        }
        
        selectedCategorySlug = categorySlug;
        console.log('Selected category slug:', selectedCategorySlug);
        
        // Reset search if active
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
            isSearchActive = false;
        }
        
        // Load products for this category
        try {
            const categoryName = categoryDiv.querySelector('p').textContent;
            showNotification(`Loading ${categorySlug === 'all' ? 'all products' : categoryName + ' products'}...`);
            await loadProducts(categorySlug);
        } catch (error) {
            console.error('Error filtering products:', error);
            showNotification(`Error loading products: ${error.message}`, 'error');
        }
    });
}

// Setup like/heart functionality
function setupLikeButtons() {
    productsContainer.addEventListener('click', (e) => {
        const heartIcon = e.target.closest('.bx-heart, .bxs-heart');
        if (!heartIcon) return;
        
        e.stopPropagation(); // Prevent product card click
        
        // Toggle heart icon
        heartIcon.classList.toggle('bx-heart');
        heartIcon.classList.toggle('bxs-heart');
        
        // If filled, product is liked
        const isLiked = heartIcon.classList.contains('bxs-heart');
        
        // Show notification
        showNotification(isLiked ? 'Added to favorites' : 'Removed from favorites');
        
        // Save to localStorage
        const productId = heartIcon.dataset.id;
        const categorySlug = heartIcon.dataset.categorySlug;
        
        const favoritesKey = 'user_favorites';
        let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
        
        if (isLiked) {
            // Add to favorites if not already there
            if (!favorites.some(f => f.id === productId && f.categorySlug === categorySlug)) {
                favorites.push({ id: productId, categorySlug: categorySlug });
            }
        } else {
            // Remove from favorites
            favorites = favorites.filter(f => !(f.id === productId && f.categorySlug === categorySlug));
        }
        
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    });
}

// Setup search functionality
function setupSearch() {
    const searchIcon = document.querySelector('.bx-search');
    if (!searchIcon) return;
    
    let searchInput = null;
    
    searchIcon.addEventListener('click', () => {
        // Create search input if it doesn't exist
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'search-input';
            searchInput.placeholder = 'Search products...';
            
            // Position it in the header
            const header = document.querySelector('.header');
            header.appendChild(searchInput);
            
            // Style it
            searchInput.style.position = 'absolute';
            searchInput.style.top = '50px';
            searchInput.style.right = '20px';
            searchInput.style.padding = '8px 12px';
            searchInput.style.borderRadius = '4px';
            searchInput.style.border = '1px solid #ddd';
            searchInput.style.zIndex = '1000';
            
            // Focus on it
            searchInput.focus();
            
            // Setup debouncing for search
            let searchTimeout;
            
            // Search as user types
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                
                // Show skeleton loader for immediate feedback
                showSkeletonLoader();
                
                searchTimeout = setTimeout(async () => {
                    const searchTerm = e.target.value.toLowerCase().trim();
                    isSearchActive = searchTerm.length > 0;
                    
                    try {
                        await loadProducts(selectedCategorySlug, searchTerm);
                        
                        if (searchTerm) {
                            showNotification(`Showing results for "${searchTerm}"`);
                        }
                    } catch (error) {
                        console.error('Search error:', error);
                        showNotification(`Search error: ${error.message}`, 'error');
                    }
                }, 500); // Debounce delay of 500ms
            });
            
            // Setup close button
            const closeBtn = document.createElement('span');
            closeBtn.innerHTML = '×';
            closeBtn.className = 'search-close';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '50px';
            closeBtn.style.right = '30px';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.zIndex = '1001';
            closeBtn.style.color = '#888';
            
            closeBtn.addEventListener('click', () => {
                removeSearchInput();
                loadProducts(selectedCategorySlug); // Reset to current category
            });
            
            header.appendChild(closeBtn);
            
            // Hide search when clicked outside
            document.addEventListener('click', (e) => {
                if (searchInput && !e.target.closest('.search-input') && 
                    !e.target.closest('.bx-search') && 
                    !e.target.closest('.search-close')) {
                    removeSearchInput();
                }
            });
            
            function removeSearchInput() {
                if (searchInput) {
                    searchInput.remove();
                    searchInput = null;
                    isSearchActive = false;
                }
                if (closeBtn) {
                    closeBtn.remove();
                }
            }
        } else {
            // Remove search input if it already exists
            searchInput.remove();
            searchInput = null;
            isSearchActive = false;
            document.querySelector('.search-close')?.remove();
            
            // Reset to current category
            loadProducts(selectedCategorySlug);
        }
    });
}

// Load user's favorites from localStorage
function loadFavorites() {
    const favoritesKey = 'user_favorites';
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    
    // Mark favorite products in the UI
    favorites.forEach(favorite => {
        const heartIcon = document.querySelector(`.bx-heart[data-id="${favorite.id}"][data-category-slug="${favorite.categorySlug}"]`);
        if (heartIcon) {
            heartIcon.classList.remove('bx-heart');
            heartIcon.classList.add('bxs-heart');
        }
    });
}

// Handle infinite scroll (if needed)
let isLoading = false;
let currentPage = 1;
const productsPerPage = 12;

// Add event listener for scroll
window.addEventListener('scroll', handleInfiniteScroll);

// Handle infinite scroll
function handleInfiniteScroll() {
    // Only implement if needed
    if (isLoading) return;
    
    // Check if we've scrolled to the bottom
    const endOfPage = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 500;
    
    if (endOfPage) {
        loadMoreProducts();
    }
}

// Load more products function
async function loadMoreProducts() {
    // This is a placeholder - implement this if you want pagination
    // For now it does nothing
    return;
    
    // Implementation would look something like this:
    /*
    isLoading = true;
    currentPage++;
    
    try {
        // Show a loading indicator at the bottom
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-more';
        loadingIndicator.innerHTML = '<div class="skeleton-pulse"></div>';
        productsContainer.appendChild(loadingIndicator);
        
        // Load next page of products
        // ... fetch from Supabase with offset
        
        // Remove loading indicator
        document.querySelector('.loading-more').remove();
        
        // Render new products
        // ... render new products
        
        isLoading = false;
    } catch (error) {
        console.error('Error loading more products:', error);
        isLoading = false;
    }
    */
}

function updateCartCount() {
    // Find cart icon
    const cartIcon = document.querySelector('.bx-cart');
    if (!cartIcon) return;

    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');

    // Get current badge or create new one
    let badge = document.querySelector('.cart-badge');

    if (!badge && cart.length > 0) {
        // Create badge if it doesn't exist
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        badge.style.position = 'absolute';
        badge.style.top = '-8px';
        badge.style.right = '-8px';
        badge.style.backgroundColor = '#ff5555';
        badge.style.color = 'white';
        badge.style.borderRadius = '50%';
        badge.style.fontSize = '12px';
        badge.style.padding = '2px 6px';
        badge.style.fontWeight = 'bold';
        
        // Make the cart icon container position relative
        cartIcon.parentElement.style.position = 'relative';
        
        // Add badge to cart icon
        cartIcon.parentElement.appendChild(badge);
    }

    if (badge) {
        if (cart.length > 0) {
            // Calculate total items in cart
            const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
            badge.textContent = totalItems;
        } else {
            // Remove badge if cart is empty
            badge.remove();
        }
    }
}

// document.addEventListener('DOMContentLoaded', function() {
//   const userButton = document.querySelector('.user-button');
//   const userTrigger = document.querySelector('#user-icon');

//   // Toggle menu on trigger click
//   userTrigger.addEventListener('click', function(e) {
//     e.preventDefault();
//     userButton.classList.toggle('show');
//   });

//   // Close menu when clicking outside
//   document.addEventListener('click', function(e) {
//     if (!userTrigger.contains(e.target) && !userButton.contains(e.target)) {
//       userButton.classList.remove('show');
//     }
//   });

//   // Optional: Close menu after clicking a button
//   document.querySelectorAll('.auth-btn').forEach(btn => {
//     btn.addEventListener('click', () => {
//       userButton.classList.remove('show');
//     });
//   });
// });

async function isUserAuthenticated() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking authentication status:', error.message);
      return false;
    }
    return !!session;
  } catch (err) {
    console.error('Unexpected error checking authentication:', err);
    return false;
  }
}

// ————————————————————————————————
// 2) Swap icon + attach exactly one “click” listener per state
// ————————————————————————————————
async function updateUIBasedOnAuthStatus() {
  const isAuthenticated = await isUserAuthenticated();
  const userIconOld = document.getElementById('user-icon');
  const userButton = document.querySelector('.user-button');

  // If either element is missing, nothing to do
  if (!userIconOld || !userButton) return;

  // (A) Clone + replace the old <i>, so that any previous listeners are removed
  const userIconNew = userIconOld.cloneNode(true);
  userIconOld.parentNode.replaceChild(userIconNew, userIconOld);

  // (B) Now decide which icon + handler to attach
  if (isAuthenticated) {
    // ───────────── LOGGED IN ─────────────
    // Remove any Boxicons classes (base + outline)
    userIconNew.classList.remove('bx', 'bx-user', 'bxs', 'bxs-user');

    // Add Font Awesome 6 Free (“solid circle‑user”)
    userIconNew.classList.add('fa-solid', 'fa-circle-user');

    // Make the <a> wrapper navigate to profile.html
    userIconNew.parentElement.setAttribute('href', 'profile.html');

    // NO click‐listener here (click will simply follow the <a> link)

  } else {
    // ───────────── NOT LOGGED IN ─────────────
    // Remove any FA classes
    userIconNew.classList.remove('fa-solid', 'fa-circle-user', 'fas');

    // Restore Boxicons “bx bx-user”
    userIconNew.classList.add('bx', 'bx-user');

    // Make the <a> wrapper a no‐op href (or you could point to login.html if you prefer)
    userIconNew.parentElement.setAttribute('href', '#');

    // Attach one “click” listener to toggle the dropdown
    userIconNew.addEventListener('click', function(e) {
      e.preventDefault();
      userButton.classList.toggle('show');
    });
  }
}

// ————————————————————————————————
// 3) Single DOMContentLoaded: call updateUIBasedOnAuthStatus
//    and also wire up “click outside to close” + “auth-btn click closes”
// ————————————————————————————————
document.addEventListener('DOMContentLoaded', async function() {
  // 3A) Immediately update icon & handler based on auth
  await updateUIBasedOnAuthStatus();

  // 3B) Attach “click outside” logic that works regardless of which icon is present
  const userButton = document.querySelector('.user-button');
  document.addEventListener('click', function(e) {
    // Re‐select #user-icon each time, because it might have been replaced
    const userTrigger = document.getElementById('user-icon');
    // If the click was neither on the icon nor inside the dropdown, close the dropdown
    if (
      userButton.classList.contains('show') &&
      userTrigger && !userTrigger.contains(e.target) &&
      !userButton.contains(e.target)
    ) {
      userButton.classList.remove('show');
    }
  });

  // 3C) If any “.auth-btn” inside the dropdown is clicked, close the dropdown
  document.querySelectorAll('.auth-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.user-button')?.classList.remove('show');
    });
  });
});





// Call this function on page load
document.addEventListener('DOMContentLoaded', async function() {
    // ... existing initialization code
    
    // Check authentication status and update UI
    await updateUIBasedOnAuthStatus();
});