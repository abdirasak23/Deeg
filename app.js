// Supabase Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://fpvuwegibnwucgxieirp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const categoriesContainer = document.querySelector('.categories');
const productsContainer = document.querySelector('.products');
const productCounterEl = document.querySelector('.see-all .data p');
const popularCategoriesEl = document.querySelector('.popular-products .categories');
const leftContainer = document.querySelector('.main .left');

// Global state
let allProducts = [];
let totalProductCount = 0;
let totalCategoryCount = 0;
let selectedCategory = 'all';
let featuredProducts = [];
let currentFeaturedProductIndex = 0;

let currentAppAddTextIndex = 0;

const rightContainer = document.querySelector('.main .right');
let homeProducts = [];
let currentHomeProductIndex = 0;
let homeProductsInterval = null;

// Featured categories for left container
const featuredCategories = ['home', 'clothing', 'beauty'];

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
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}




// Create skeleton loader for products
function showSkeletonLoader() {
    productsContainer.innerHTML = '';
    
    // Create 4 skeleton loaders (one for each product)
    for (let i = 0; i < 4; i++) {
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
    
    // Add the skeleton CSS if not already added
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
            
            .skeleton-image {
                position: relative;
                height: 200px;
                overflow: hidden;
                border-radius: 8px;
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Show skeleton loader immediately
        showSkeletonLoader();
        
        // Load categories and display top 4
        await loadAndDisplayCategories();
        
        // Load products for those categories
        await loadAndDisplayProducts();
        
        // Update product counter
        updateProductCounter();
        
        // Set up event handlers for filtering by category
        setupCategoryFiltering();
        
        // Setup like/heart functionality
        setupLikeButtons();
        
        // Load user favorites from localStorage
        loadFavorites();
        
        // Load and display featured products in left container
        await loadFeaturedProducts();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification(`Error loading data: ${error.message}`, 'error');
    }
}); 

// Load categories from Supabase and display top 4
async function loadAndDisplayCategories() {
    try {
        // Get all categories from categories table
        const { data: categories, error } = await supabase
            .from('categories')
            .select('name, slug')
            .limit(4); // Get only 4 categories

        if (error) {
            console.error('Error loading categories:', error);
            throw new Error(error.message);
        }

        if (!categories || categories.length === 0) {
            console.log('No categories found');
            return;
        }

        console.log('Categories loaded:', categories);
        
        // Store total category count
        const { count, error: countError } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true });
            
        if (!countError) {
            totalCategoryCount = count || 0;
        }
        
        // Clear existing categories
        popularCategoriesEl.innerHTML = '';
        
        // Add categories to the UI
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'cat';
            categoryElement.dataset.slug = category.slug;
            categoryElement.innerHTML = `<p>${category.name}</p>`;
            
            // Add click event to filter products
            categoryElement.addEventListener('click', () => {
                selectCategory(category.slug);
            });
            
            popularCategoriesEl.appendChild(categoryElement);
        });
    } catch (error) {
        console.error('Error in loadAndDisplayCategories:', error);
        throw error;
    }
}

// Load products from all categories and display them
async function loadAndDisplayProducts() {
    try {
        // Show skeleton loader instead of just text
        showSkeletonLoader();
        
        // Get all categories with their slugs
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name, slug')
            .limit(4); // Get only 4 categories for display

        if (catError) {
            console.error('Error loading categories:', catError);
            throw new Error(catError.message);
        }

        if (!categories || categories.length === 0) {
            console.log('No categories found');
            productsContainer.innerHTML = '<div class="no-products">No categories found</div>';
            return;
        }

        // Reset all products array
        allProducts = [];
        
        // Get products from each category
        for (const cat of categories) {
            try {
                console.log(`Fetching products from table: ${cat.slug}`);
                const { data: products, error: prodError } = await supabase
                    .from(cat.slug)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4); // Get only 4 products per category

                if (prodError) {
                    console.error(`Error loading products from ${cat.slug}:`, prodError);
                    continue;
                }

                if (products && products.length > 0) {
                    console.log(`Found ${products.length} products in ${cat.slug}`);
                    // Add category name for display purposes
                    const productsWithCategory = products.map(p => ({ 
                        ...p, 
                        categorySlug: cat.slug,
                        categoryName: cat.name
                    }));
                    
                    allProducts.push(...productsWithCategory);
                    
                    // Get total product count for this category
                    const { count, error: countError } = await supabase
                        .from(cat.slug)
                        .select('*', { count: 'exact', head: true });
                        
                    if (!countError) {
                        totalProductCount += count || 0;
                    }
                }
            } catch (err) {
                console.error(`Error with ${cat.slug} table:`, err);
            }
        }

        console.log(`Total products loaded: ${allProducts.length}`);
        displayProducts(selectedCategory === 'all' ? allProducts : filterProductsByCategory(selectedCategory));
    } catch (error) {
        console.error('Error in loadAndDisplayProducts:', error);
        productsContainer.innerHTML = `<div class="error">Error loading products: ${error.message}</div>`;
        throw error;
    }
}

// Display products on the page
function displayProducts(products) {
    // Clear existing products
    productsContainer.innerHTML = '';
    
    // Show message if no products
    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products found</div>';
        return;
    }
    
    // Get first 4 products only
    const displayProducts = products.slice(0, 4);
    
    // Add each product to the UI
    displayProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Format price
        const price = product.price ? parseFloat(product.price).toFixed(2) : '0.00';
        const oldPrice = product.old_price ? parseFloat(product.old_price).toFixed(2) : null;
        
        // Get first available image, fallback to placeholder
        const imageUrl = product.im1 || product.im2 || product.im3 || product.im4 || 'assets/images/kit.webp';
        
        productCard.innerHTML = `
            <div class="image">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='assets/images/kit.webp'">
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
}

// Filter products by category
function filterProductsByCategory(categorySlug) {
    if (categorySlug === 'all') {
        return allProducts;
    }
    return allProducts.filter(product => product.categorySlug === categorySlug);
}

// Set selected category and update displayed products
function selectCategory(categorySlug) {
    selectedCategory = categorySlug;
    
    // Update active category UI
    document.querySelectorAll('.cat').forEach(cat => {
        if (cat.dataset.slug === categorySlug) {
            cat.classList.add('active');
        } else {
            cat.classList.remove('active');
        }
    });
    
    // Show skeleton loader first
    showSkeletonLoader();
    
    // Small delay to show loader before updating products
    setTimeout(() => {
        // Update displayed products
        displayProducts(filterProductsByCategory(categorySlug));
    
        // Show notification
        const categoryName = [...document.querySelectorAll('.cat')]
            .find(cat => cat.dataset.slug === categorySlug)?.querySelector('p')?.textContent || categorySlug;
        
        showNotification(`Showing ${categoryName} products`);
    }, 300); // Small delay to show skeleton loader
}

// Update product counter
function updateProductCounter() {
    if (productCounterEl) {
        productCounterEl.textContent = `${totalProductCount} trending products in ${totalCategoryCount} categories`;
    }
}

// Setup category filtering
function setupCategoryFiltering() {
    popularCategoriesEl.addEventListener('click', (e) => {
        const categoryDiv = e.target.closest('.cat');
        if (!categoryDiv) return;
        
        const categorySlug = categoryDiv.dataset.slug;
        selectCategory(categorySlug);
    });
    
    // Add "See All" button event
    const seeAllBtn = document.querySelector('.see-all-btn');
    if (seeAllBtn) {
        seeAllBtn.addEventListener('click', () => {
            window.location.href = '../products';
        });
    }
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

// ------------------------------------------------------------------------
// Left Container Product Display functionality
// ------------------------------------------------------------------------

// Load products from featured categories for left container
async function loadFeaturedProducts() {
    try {
        // Reset featured products array
        featuredProducts = [];
        
        // Fetch products from each featured category
        for (const categorySlug of featuredCategories) {
            console.log(`Fetching products from ${categorySlug} for featured display`);
            
            // Get category name for display
            const { data: categoryData, error: catError } = await supabase
                .from('categories')
                .select('name')
                .eq('slug', categorySlug)
                .single();
                
            if (catError) {
                console.error(`Error fetching category ${categorySlug}:`, catError);
                continue;
            }
            
            const categoryName = categoryData?.name || categorySlug;
            
            // Get products from this category
            const { data: products, error: prodError } = await supabase
                .from(categorySlug)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3); // Get top 3 products from each category
                
            if (prodError) {
                console.error(`Error loading products from ${categorySlug}:`, prodError);
                continue;
            }
            
            if (products && products.length > 0) {
                // Add category name for display purposes
                const productsWithCategory = products.map(p => ({
                    ...p,
                    categorySlug,
                    categoryName
                }));
                
                featuredProducts.push(...productsWithCategory);
            }
        }
        
        console.log(`Loaded ${featuredProducts.length} featured products`);
        
        // Display first featured product
        if (featuredProducts.length > 0) {
            displayFeaturedProduct(0);
            
            // Set up auto rotation for featured products
            setupFeaturedProductRotation();
        } else {
            // Display placeholder if no products found
            displayPlaceholderInLeftContainer();
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        displayPlaceholderInLeftContainer();
    }
}

let appAddText = ["Discover thousands of products—from groceries to gadgets—all in one place.", 
    "Save up to 50% on top brands, updated every 24 hours. Hurry before they’re gone!", 
    "From farm-fresh produce to artisanal pantry staples—get it all, guaranteed fresh.", 
    "Find daily necessities plus exclusive launches you won’t see anywhere else.",
    "Personalized recommendations, secure checkout, free returns—ecommerce made easy."
    ];


// Display a product in the left container
function displayFeaturedProduct(index) {
    if (!featuredProducts.length || index >= featuredProducts.length) {
        displayPlaceholderInLeftContainer();
        return;
    }
    
    const product = featuredProducts[index];
    currentFeaturedProductIndex = index;
    
    // Get main ad image (use ad1 field or fall back to other images)
    const adImage = product.ad1 || product.im1 || product.im2 || product.im3 || product.im4 || 'assets/images/kit.webp';
    
    // Update left container structure
    leftContainer.innerHTML = `
        <img src="${adImage}" alt="${product.name}" onerror="this.src='assets/images/kit.webp'">
        <div class="top">
            <div class="start">
            <img src="assets/images/img.png" alt=""></div>
            <p>${appAddText[currentAppAddTextIndex]}</p>
        </div>
        <div class="bottom">
            <div class="item-icon">
                <img src="${product.im1}" alt="">
            </div>
            <div class="property">
                <p class="name">${product.name || 'Featured Product'}</p>
                <p class="pr">${product.categoryName || 'Category'}</p>
            </div>
            <div class="see" data-id="${product.id}" data-category="${product.categorySlug}">
                <i class='bx bx-right-arrow'></i>
            </div>
        </div>
    `;
    
    // Set up navigation when arrow is clicked
    setupLeftContainerNavigation();
}


function updateAppAddText() {
    // Move to the next text
    currentAppAddTextIndex = (currentAppAddTextIndex + 1) % appAddText.length;
    
    // Update only the text in the top section
    const topTextElement = leftContainer.querySelector('.top p');
    if (topTextElement) {
        topTextElement.textContent = appAddText[currentAppAddTextIndex];
    }
}

function setupFeaturedProductRotation() {
    // Rotate featured products every 5 seconds
    setInterval(() => {
        if (featuredProducts.length > 1) {
            // Move to next product
            let nextIndex = currentFeaturedProductIndex + 1;
            if (nextIndex >= featuredProducts.length) {
                nextIndex = 0; // Loop back to first product
            }
            displayFeaturedProduct(nextIndex);
        }
    }, 5000);
       setInterval(updateAppAddText, 5000);
}

// Display placeholder in left container if no products
function displayPlaceholderInLeftContainer() {
    leftContainer.innerHTML = `
        <img src="assets/images/kit.webp" alt="Placeholder">
        <div class="top">
            <div class="start"></div>
            <p>${appAddText[currentAppAddTextIndex]}</p>
        </div>
        <div class="bottom">
            <div class="item-icon">
                <img src="assets/images/chair.png" alt="">
            </div>
            <div class="property">
                <p class="name">Featured Products</p>
                <p class="pr">Coming Soon</p>
            </div>
            <div class="see">
                <i class='bx bx-right-arrow'></i>
            </div>
        </div>
    `;
}

// Set up automatic rotation of featured products
// function setupFeaturedProductRotation() {
//     // Rotate featured products every 5 seconds
//     setInterval(() => {
//         if (featuredProducts.length > 1) {
//             // Move to next product
//             let nextIndex = currentFeaturedProductIndex + 1;
//             if (nextIndex >= featuredProducts.length) {
//                 nextIndex = 0; // Loop back to first product
//             }
//             displayFeaturedProduct(nextIndex);
//         }
//     }, 5000); // 5 seconds
// }

// Set up navigation when arrow is clicked
function setupLeftContainerNavigation() {
    const seeButton = leftContainer.querySelector('.see');
    if (seeButton) {
        seeButton.addEventListener('click', () => {
            const productId = seeButton.dataset.id;
            const categorySlug = seeButton.dataset.category;
            
            if (productId && categorySlug) {
                // Navigate to product detail page
                window.location.href = `../item/?id=${productId}&category=${categorySlug}`;
                showNotification('Viewing product details');
            }
        });
    }
}

// Function to load home category products
async function loadHomeProducts() {
  try {
    // Show loading state
    showRightContainerLoading();

    // Fetch products from home category
    const { data: products, error } = await supabase
      .from('home')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    homeProducts = products || [];
    
    if (homeProducts.length > 0) {
      // Start rotation
      displayHomeProduct(0);
      setupHomeProductRotation();
    } else {
      displayRightContainerPlaceholder();
    }
  } catch (error) {
    console.error('Error loading home products:', error);
    displayRightContainerPlaceholder();
  }
}

// Display home product in right container
function displayHomeProduct(index) {
  if (!homeProducts.length || index >= homeProducts.length) {
    displayRightContainerPlaceholder();
    return;
  }

  const product = homeProducts[index];
  currentHomeProductIndex = index;

  const productImage = product.ad1 || product.im1 || 'assets/images/seat.jpg';
  const productName = product.name || 'Home Product';
  const productCategory = product.category || 'Home';
  const productPrice = product.price ? `$${parseFloat(product.price).toFixed(2)}` : '$0.00';

  // Create image element to preload
  const img = new Image();
  img.src = productImage;

  img.onload = () => updateRightContainer();
  img.onerror = () => updateRightContainer();

  function updateRightContainer() {
    rightContainer.innerHTML = `
      <img style="object-fit: cover;" src="${productImage}" alt="${productName}" 
           onerror="this.src='assets/images/seat.jpg'">
      <div class="bottom">
        <div class="pro-dec">
          <div class="name"><p>${productName}</p></div>
          <div class="store">${productCategory}</div>
        </div>
        <div class="cart">
          <p>Add to cart</p> 
          <span>${productPrice}</span>
        </div>
      </div>
    `;
    
    // Add click handler for product navigation
    const cartDiv = rightContainer.querySelector('.cart');
    if (cartDiv) {
      cartDiv.addEventListener('click', () => {
        window.location.href = `../item/.?id=${product.id}&category=home`;
      });
    }
  }
}

// Show loading state for right container
function showRightContainerLoading() {
  rightContainer.innerHTML = `
    <div class="skeleton-pulse" style="height: 100%; width: 100%;"></div>
    <div class="bottom" style="position: absolute;
    top: 280px;">
      <div class="pro-dec">
        <div class="name"><div class="skeleton-pulse-small" style="width: 120px; height: 20px; position: relative; top:15px;"></div></div>
        <div class="store"><div class="skeleton-pulse-small" style="width: 80px; height: 16px;position: relative; top:40px;"></div></div>
      </div>
      <div class="cart">
        <div class="skeleton-pulse-small" style="width: 80px; height: 16px; position: relative; top:15px; left:10px;"></div>
        <div class="skeleton-pulse-small" style="width: 50px; height: 16px; position: relative; top:15px;"></div>
      </div>
    </div>
  `;
}

// Display placeholder if no products found
function displayRightContainerPlaceholder() {
  rightContainer.innerHTML = `
    <img style="object-fit: cover;" src="assets/images/seat.jpg" alt="Placeholder">
    <div class="bottom">
      <div class="pro-dec">
        <div class="name"><p>Home Products</p></div>
        <div class="store">Coming Soon</div>
      </div>
      <div class="cart">
        <p>Add to cart</p> 
        <span>$0.00</span>
      </div>
    </div>
  `;
}

// Set up automatic rotation of home products
function setupHomeProductRotation() {
  if (homeProductsInterval) clearInterval(homeProductsInterval);
  
  homeProductsInterval = setInterval(() => {
    if (homeProducts.length > 1) {
      currentHomeProductIndex = (currentHomeProductIndex + 1) % homeProducts.length;
      displayHomeProduct(currentHomeProductIndex);
    }
  }, 5000); // 5 seconds rotation
}

// Update your DOMContentLoaded event listener to call loadHomeProducts
document.addEventListener('DOMContentLoaded', async function() {
  // ... existing initialization code ...
  
  // Load home products for right container
  await loadHomeProducts();
  updateCartCount();
});


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


// ————————————————————————————————
// 1) Check if user is authenticated (Supabase v2)
// ————————————————————————————————
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
