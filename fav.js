// Favorites functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const favouriteIcon = document.querySelector('.user .bx-like');
    const favouriteContainer = document.querySelector('.favourite');
    const closeFavouriteBtn = document.querySelector('.favourite .close');
    
    // Initialize favorites container
    initializeFavorites();
    
    // Toggle favorites container visibility
    if (favouriteIcon) {
        favouriteIcon.addEventListener('click', (e) => {
            e.preventDefault();
            favouriteContainer.classList.add('active');
            renderFavorites();
        });
    }
    
    // Close favorites container
    if (closeFavouriteBtn) {
        closeFavouriteBtn.addEventListener('click', () => {
            favouriteContainer.classList.remove('active');
        });
    }
    
    // Handle favorites container clicks (for remove button and product navigation)
    if (favouriteContainer) {
        favouriteContainer.addEventListener('click', (e) => {
            // Handle remove button click
            const removeBtn = e.target.closest('.fav-remove');
            if (removeBtn) {
                const favItem = removeBtn.closest('.fav-product');
                const productId = favItem.dataset.id;
                const categorySlug = favItem.dataset.categorySlug;
                
                if (productId && categorySlug) {
                    removeFromFavorites(productId, categorySlug);
                }
                return;
            }
            
            // Handle product click for navigation
            const favProduct = e.target.closest('.fav-product');
            if (favProduct && !e.target.closest('.fav-remove')) {
                const productId = favProduct.dataset.id;
                const categorySlug = favProduct.dataset.categorySlug;
                
                if (productId && categorySlug) {
                    window.location.href = `product.html?id=${productId}&category=${categorySlug}`;
                }
            }
        });
    }
});

// Initialize favorites - remove example item if present
function initializeFavorites() {
    const exampleFav = document.querySelector('.fav-product');
    if (exampleFav && !exampleFav.dataset.id) {
        exampleFav.remove();
    }
}

// Render all favorites from localStorage
function renderFavorites() {
    const container = document.querySelector('.favourite');
    
    // Clear existing items except close button
    const closeBtn = container.querySelector('.close');
    container.innerHTML = '';
    container.appendChild(closeBtn);
    
    // Get favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('user_favorites')) || [];
    
    // Show empty message if no favorites
    if (favorites.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-favorites';
        emptyMsg.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #888;">
                <i class='bx bx-heart' style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>No favorites yet. Start adding some!</p>
            </div>
        `;
        container.appendChild(emptyMsg);
        return;
    }

    // Add each favorite to container
    favorites.forEach(fav => {
        // Get image URL or placeholder
        const imageUrl = fav.image || 'assets/images/kit.webp';
        
        // Format price if available
        let priceText = fav.price || '$0.00';
        if (priceText && !priceText.includes('$') && !isNaN(parseFloat(priceText))) {
            priceText = `$${parseFloat(priceText).toFixed(2)}`;
        }
        
        const favItem = document.createElement('div');
        favItem.className = 'fav-product';
        favItem.dataset.id = fav.id;
        favItem.dataset.categorySlug = fav.categorySlug;
        
        favItem.innerHTML = `
            <div class="fav-image">
                <img src="${imageUrl}" alt="${fav.name}" onerror="this.src='assets/images/kit.webp'">
            </div>
            <div class="fav-details">
                <div class="fav-name">
                    <p>${fav.name || 'Product'}</p>
                </div>
                <div class="fav-price">
                    ${priceText}
                </div>
            </div>
            <div class="fav-remove">
                <i class='bx bxs-heart'></i>
            </div>
        `;
        
        container.appendChild(favItem);
    });
}

// Remove item from favorites
function removeFromFavorites(productId, categorySlug) {
    // Get current favorites
    const favorites = JSON.parse(localStorage.getItem('user_favorites')) || [];
    
    // Filter out the removed item
    const updatedFavorites = favorites.filter(item => 
        !(item.id === productId && item.categorySlug === categorySlug)
    );
    
    // Save updated favorites
    localStorage.setItem('user_favorites', JSON.stringify(updatedFavorites));
    
    // Update heart icon in products list if visible
    const productHeart = document.querySelector(
        `.bxs-heart[data-id="${productId}"][data-category-slug="${categorySlug}"]`
    );
    
    if (productHeart) {
        productHeart.classList.remove('bxs-heart');
        productHeart.classList.add('bx-heart');
    }
    
    // Re-render favorites container
    renderFavorites();
    
    // Show removal notification if function exists
    if (typeof showNotification === 'function') {
        showNotification('Removed from favorites');
    }
}

// Add to favorites function - used when clicking heart icon in product listings
function addToFavorites(product) {
    if (!product || !product.id || !product.categorySlug) return;
    
    // Get current favorites
    const favorites = JSON.parse(localStorage.getItem('user_favorites')) || [];
    
    // Check if product already exists
    const existingIndex = favorites.findIndex(item => 
        item.id === product.id && item.categorySlug === product.categorySlug
    );
    
    // If not in favorites, add it
    if (existingIndex === -1) {
        favorites.push(product);
        localStorage.setItem('user_favorites', JSON.stringify(favorites));
        
        // Show notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('Added to favorites');
        }
        
        // Update favorites container if visible
        if (document.querySelector('.favourite.active')) {
            renderFavorites();
        }
    }
}

// Load all favorites and update heart icons in product listings
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('user_favorites')) || [];
    
    // Update heart icons in product listings
    favorites.forEach(favorite => {
        const heartIcon = document.querySelector(
            `.bx-heart[data-id="${favorite.id}"][data-category-slug="${favorite.categorySlug}"]`
        );
        
        if (heartIcon) {
            heartIcon.classList.remove('bx-heart');
            heartIcon.classList.add('bxs-heart');
        }
    });
    
    return favorites;
}

// Setup like/heart functionality for product listings
function setupLikeButtons() {
    document.querySelector('.products').addEventListener('click', (e) => {
        const heart = e.target.closest('.bx-heart, .bxs-heart');
        if (!heart) return;

        e.stopPropagation(); // Prevent product card click
        const isLiked = heart.classList.toggle('bx-heart');
        heart.classList.toggle('bxs-heart', !isLiked);

        // Get product details
        const productCard = heart.closest('.product-card');
        const product = {
            id: heart.dataset.id,
            categorySlug: heart.dataset.categorySlug,
            name: productCard.querySelector('.product-name').textContent,
            price: productCard.querySelector('.actual-price').textContent,
            image: productCard.querySelector('img').src,
            company: productCard.querySelector('.company-name').textContent
        };

        // Get current favorites
        const favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        const existingIndex = favorites.findIndex(f => 
            f.id === product.id && f.categorySlug === product.categorySlug
        );

        if (isLiked) {
            // Remove from favorites
            if (existingIndex !== -1) {
                favorites.splice(existingIndex, 1);
                if (typeof showNotification === 'function') {
                    showNotification('Removed from favorites');
                }
            }
        } else {
            // Add to favorites
            if (existingIndex === -1) {
                favorites.push(product);
                if (typeof showNotification === 'function') {
                    showNotification('Added to favorites');
                }
            }
        }

        localStorage.setItem('user_favorites', JSON.stringify(favorites));
        
        // Update favorites list if visible
        if (document.querySelector('.favourite.active')) {
            renderFavorites();
        }
    });
}