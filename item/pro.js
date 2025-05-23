// Supabase Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://fpvuwegibnwucgxieirp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const productImageMain = document.querySelector('.right-side img');
const thumbnailContainer = document.querySelector('.left-side');
const productNameElement = document.querySelector('.name h2');
const productDescriptionElement = document.querySelector('.description p');
const productPriceElement = document.querySelector('.price p:first-child');
const productOldPriceElement = document.querySelector('.price .old-price');
const addToCartButton = document.querySelector('.cart');
const buyNowButton = document.querySelector('.buy');
const quantityInput = document.querySelector('.quantity input');

// Add skeleton loader styles
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
            
            @keyframes pulse {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(skeletonStyles);
    }
}

// Show product skeleton loader
function showProductSkeletonLoader() {
    // Add skeleton loading effect to product elements
    if (productImageMain) {
        productImageMain.src = '';
        productImageMain.style.height = '300px';
        productImageMain.classList.add('skeleton-pulse');
    }

    if (productNameElement) {
        productNameElement.innerHTML = '<div class="skeleton-pulse" style="height: 24px;"></div>';
    }

    if (productPriceElement) {
        productPriceElement.innerHTML = '<div class="skeleton-pulse" style="height: 20px; width: 80px;"></div>';
    }

    if (productOldPriceElement) {
        productOldPriceElement.innerHTML = '<div class="skeleton-pulse" style="height: 16px; width: 60px;"></div>';
    }

    if (productDescriptionElement) {
        productDescriptionElement.innerHTML = `
            <div class="skeleton-pulse" style="height: 16px; margin-bottom: 8px;"></div>
            <div class="skeleton-pulse" style="height: 16px; margin-bottom: 8px;"></div>
            <div class="skeleton-pulse" style="height: 16px; width: 80%;"></div>
        `;
    }

    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = `
            <div class="side skeleton-pulse" style="height: 80px; margin: 5px;"></div>
            <div class="side skeleton-pulse" style="height: 80px; margin: 5px;"></div>
            <div class="side skeleton-pulse" style="height: 80px; margin: 5px;"></div>
        `;
    }

    if (addToCartButton) {
        addToCartButton.disabled = true;
        addToCartButton.style.opacity = '0.6';
    }
    
    if (buyNowButton) {
        buyNowButton.disabled = true;
        buyNowButton.style.opacity = '0.6';
    }
}

// Remove skeleton loader
function removeSkeletonLoader() {
    if (productImageMain) {
        productImageMain.classList.remove('skeleton-pulse');
        productImageMain.style.height = '';
    }

    if (addToCartButton) {
        addToCartButton.disabled = false;
        addToCartButton.style.opacity = '1';
    }
    
    if (buyNowButton) {
        buyNowButton.disabled = false;
        buyNowButton.style.opacity = '1';
    }
}

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

// Parse URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get('id'),
        category: params.get('category')
    };
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Add skeleton styles
        addSkeletonStyles();
        
        // Show skeleton loader
        showProductSkeletonLoader();
        
        // Get URL parameters
        const { id, category } = getUrlParams();

        if (!id || !category) {
            showNotification('Product ID or category missing', 'error');
            return;
        }
        
        // Load product details
        await loadProductDetails(id, category);
        
        // Setup buttons
        setupButtons();
        
        // Update cart count display
        updateCartCount();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification(`Error loading product: ${error.message}`, 'error');
    }
});

// Load product details from Supabase
async function loadProductDetails(productId, categorySlug) {
    try {
        console.log(`Fetching product ID ${productId} from ${categorySlug} table`);
        
        // Fetch product from the specific category table
        const { data: product, error } = await supabase
            .from(categorySlug)
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) {
            console.error('Error loading product:', error);
            showNotification(`Error: ${error.message}`, 'error');
            return;
        }
        
        if (!product) {
            console.error('Product not found');
            showNotification('Product not found', 'error');
            return;
        }
        
        console.log('Product data loaded:', product);
        
        // Display product details
        displayProductDetails(product, categorySlug);
        
        // Remove skeleton loader
        removeSkeletonLoader();
        
        return product;
    } catch (error) {
        console.error('Error in loadProductDetails:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Display product details on the page
function displayProductDetails(product, categorySlug) {
    // Set product name
    productNameElement.textContent = product.name || 'Unnamed Product';

    // Set product description
    productDescriptionElement.textContent = product.description || 'No description available.';

    // Format price
    const price = product.price ? parseFloat(product.price).toFixed(2) : '0.00';
    productPriceElement.textContent = `$${price}`;

    // Set old price if available
    if (product.old_price) {
        const oldPrice = parseFloat(product.old_price).toFixed(2);
        productOldPriceElement.textContent = `$${oldPrice}`;
        productOldPriceElement.style.display = 'block';
    } else {
        productOldPriceElement.style.display = 'none';
    }

    // Set main image
    const mainImageUrl = product.im1 || '../assets/images/placeholder.png';
    productImageMain.src = mainImageUrl;
    productImageMain.alt = product.name;
    productImageMain.onerror = function() {
        this.src = '../assets/images/placeholder.png';
    };

    // Clear existing thumbnails
    thumbnailContainer.innerHTML = '';

    // Add thumbnail images if available
    const images = [
        { url: product.im1, index: 1 },
        { url: product.im2, index: 2 },
        { url: product.im3, index: 3 },
        { url: product.im4, index: 4 }
    ].filter(img => img.url);

    // If no images, add placeholder
    if (images.length === 0) {
        addThumbnail('../assets/images/placeholder.png', 'No image available');
    } else {
        // Add thumbnails
        images.forEach(img => {
            addThumbnail(img.url, `${product.name} - Image ${img.index}`);
        });
        
        // Set first thumbnail as active
        const firstThumbnail = thumbnailContainer.querySelector('.side');
        if (firstThumbnail) {
            firstThumbnail.classList.add('active');
        }
    }

    // Store product data for cart functionality
    addToCartButton.dataset.productId = product.id;
    addToCartButton.dataset.categorySlug = categorySlug;
    addToCartButton.dataset.productName = product.name;
    addToCartButton.dataset.productPrice = product.price;
    addToCartButton.dataset.productImage = product.im1;
    
    buyNowButton.dataset.productId = product.id;
    buyNowButton.dataset.categorySlug = categorySlug;
    buyNowButton.dataset.productName = product.name;
    buyNowButton.dataset.productPrice = product.price;
    buyNowButton.dataset.productImage = product.im1;

    // Update page title
    document.title = `${product.name} - Product Details`;
    
    // Check if product is in favorites
    checkIfFavorite(product.id, categorySlug);
}

// Add thumbnail image
function addThumbnail(imageUrl, alt) {
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'side';

    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = imageUrl;
    thumbnailImg.alt = alt;
    thumbnailImg.loading = 'lazy';
    thumbnailImg.onerror = function() {
        this.src = '../assets/images/placeholder.png';
    };

    // Click on the container (or image) to select
    thumbnailDiv.addEventListener('click', () => {
        // Remove active class from all
        document
            .querySelectorAll('.left-side .side')
            .forEach(div => div.classList.remove('active'));

        // Add active class to the one we clicked
        thumbnailDiv.classList.add('active');

        // Also swap the main image
        productImageMain.src = imageUrl;
    });

    thumbnailDiv.appendChild(thumbnailImg);
    thumbnailContainer.appendChild(thumbnailDiv);
}

// Setup button functionality
function setupButtons() {
    // Add to cart button
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const productId = addToCartButton.dataset.productId;
            const categorySlug = addToCartButton.dataset.categorySlug;
            const productName = addToCartButton.dataset.productName;
            const productPrice = addToCartButton.dataset.productPrice;
            const productImage = addToCartButton.dataset.productImage;
            const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
            
            // Add to cart
            addToCart({
                id: productId,
                categorySlug: categorySlug,
                name: productName,
                price: productPrice,
                image: productImage
            }, quantity);
        });
    }

    // Buy now button
    if (buyNowButton) {
        buyNowButton.addEventListener('click', () => {
            const productId = buyNowButton.dataset.productId;
            const categorySlug = buyNowButton.dataset.categorySlug;
            const productName = buyNowButton.dataset.productName;
            const productPrice = buyNowButton.dataset.productPrice;
            const productImage = buyNowButton.dataset.productImage;
            const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
            
            // Add to cart
            addToCart({
                id: productId,
                categorySlug: categorySlug,
                name: productName,
                price: productPrice,
                image: productImage
            }, quantity);
            
            // Redirect to checkout page
            showNotification('Proceeding to checkout...');
            
            // Wait a moment before redirecting to ensure cart is updated
            setTimeout(() => {
                window.location.href = 'check-out.html';
            }, 1000);
        });
    }
    
    // Quantity input validation (if exists)
    if (quantityInput) {
        quantityInput.addEventListener('change', () => {
            let quantity = parseInt(quantityInput.value);
            
            // Ensure quantity is at least 1
            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
                quantityInput.value = 1;
            }
        });
    }
}

// Add to cart function
function addToCart(product, quantity = 1) {
    try {
        // Get cart from localStorage
        const cartKey = 'shopping_cart';
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        // Check if product is already in cart
        const productInCart = cart.find(item => 
            item.id === product.id && item.categorySlug === product.categorySlug);
        
        if (productInCart) {
            // Increase quantity
            productInCart.quantity = (productInCart.quantity || 1) + quantity;
            showNotification(`Updated quantity in cart (${productInCart.quantity} total)`);
        } else {
            // Add new product to cart
            cart.push({
                id: product.id,
                categorySlug: product.categorySlug,
                name: product.name,
                price: product.price,
                image: product.image || '../assets/images/placeholder.png',
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
            showNotification('Added to cart successfully!');
        }
        
        // Save cart to localStorage
        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        // Update cart count display
        updateCartCount();
        
        console.log('Cart updated:', cart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification(`Error adding to cart: ${error.message}`, 'error');
    }
}

// Check if product is in favorites
function checkIfFavorite(productId, categorySlug) {
    // Find like button if it exists
    const likeButton = document.querySelector('.product-like') || document.querySelector('.like-btn');
    if (!likeButton) return;
    
    const favoritesKey = 'user_favorites';
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    // Check if product is in favorites
    const isFavorite = favorites.some(f => f.id === productId && f.categorySlug === categorySlug);

    // Update heart icon
    if (isFavorite) {
        likeButton.classList.remove('bx-heart');
        likeButton.classList.add('bxs-heart');
    } else {
        likeButton.classList.remove('bxs-heart');
        likeButton.classList.add('bx-heart');
    }
    
    // Add click handler if not already added
    if (!likeButton.hasClickListener) {
        likeButton.hasClickListener = true;
        likeButton.addEventListener('click', () => {
            toggleFavorite(productId, categorySlug);
        });
    }
}

// Toggle favorite status
function toggleFavorite(productId, categorySlug) {
    // Find like button if it exists
    const likeButton = document.querySelector('.product-like') || document.querySelector('.like-btn');
    if (!likeButton) return;
    
    const favoritesKey = 'user_favorites';
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    // Toggle heart icon
    likeButton.classList.toggle('bx-heart');
    likeButton.classList.toggle('bxs-heart');

    // Check if filled (liked)
    const isLiked = likeButton.classList.contains('bxs-heart');

    if (isLiked) {
        // Add to favorites if not already there
        if (!favorites.some(f => f.id === productId && f.categorySlug === categorySlug)) {
            favorites.push({ id: productId, categorySlug: categorySlug });
            showNotification('Added to favorites');
        }
    } else {
        // Remove from favorites
        favorites = favorites.filter(f => !(f.id === productId && f.categorySlug === categorySlug));
        showNotification('Removed from favorites');
    }

    // Save to localStorage
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
}

// Update cart count display
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