// Supabase Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://fpvuwegibnwucgxieirp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);




// Initialize cart.js for the shopping cart page
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cartProductsContainer = document.querySelector('.cart-product-left');
    const subtotalEl = document.querySelector('.product-price .sub-total');
    const deliveryEl = document.querySelectorAll('.product-price .sub-total')[1];
    const taxEl = document.querySelector('.tax-total');
    const totalEl = document.querySelectorAll('.tax-total')[1];
    
    // Load cart items
    loadCartItems();
    
    // Setup notification system
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
    
    // Function to load cart items from localStorage
    function loadCartItems() {
        try {
            // Get cart from localStorage
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
            
            // Update cart count
            updateCartCount();
            
            // Clear cart container
            cartProductsContainer.innerHTML = '';
            
            if (cart.length === 0) {
                // Show empty cart message
                cartProductsContainer.innerHTML = `
                    <div class="empty-cart">
                        <i class='bx bx-cart-alt' style="font-size: 58px; color: #ccc;"></i>
                        <p>Your cart is empty</p>
                        <a href="../products"  class="continue-shopping" style="backgound-color:black;">Continue Shopping</a>
                    </div>
                `;
                
                // Style empty cart message
                const emptyCart = cartProductsContainer.querySelector('.empty-cart');
                if (emptyCart) {
                    emptyCart.style.textAlign = 'center';
                    emptyCart.style.padding = '40px 0';
                    
                    const continueBtn = emptyCart.querySelector('.continue-shopping');
                    if (continueBtn) {
                        continueBtn.style.display = 'inline-block';
                        continueBtn.style.marginTop = '20px';
                        continueBtn.style.padding = '10px 20px';
                        continueBtn.style.backgroundColor = '#55aaff';
                        continueBtn.style.color = 'white';
                        continueBtn.style.borderRadius = '5px';
                        continueBtn.style.textDecoration = 'none';
                    }
                }
                
                // Reset summary values
                resetSummary();
                
                return;
            }
            
            // Add each cart item to the UI
            cart.forEach((item, index) => {
                const cartItemElement = createCartItemElement(item, index);
                cartProductsContainer.appendChild(cartItemElement);
            });
            
            // Calculate and update summary
            updateSummary();
            
            // Add checkout button if not already there
            addCheckoutButton();
        } catch (error) {
            console.error('Error loading cart items:', error);
            showNotification(`Error loading cart: ${error.message}`, 'error');
        }
    }
    
    // Create cart item element
    function createCartItemElement(item, index) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-product';
        cartItem.dataset.index = index;
        
        // Format prices
        const price = parseFloat(item.price).toFixed(2);
        const oldPrice = item.oldPrice ? parseFloat(item.oldPrice).toFixed(2) : null;
        
        cartItem.innerHTML = `
            <div class="image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/kit.webp'">
            </div>
            <div class="details">
                <div class="name">
                    <p class="pro-name">${item.name}</p>
                </div>
                <div class="price">
                    <p class="new-price">$${price}</p>
                    ${oldPrice ? `<p class="old-price">$${oldPrice}</p>` : ''}
                </div>
            </div>
            <div class="quantity">
                <input type="number" class="product-quantity" value="${item.quantity}" step="1" min="1">
            </div>
            <div class="delete">
                <i class='bx bx-trash'></i>
            </div>
        `;
        
        // Setup event listeners for this cart item
        setupCartItemEvents(cartItem);
        
        return cartItem;
    }
    
    // Setup event listeners for cart item
    function setupCartItemEvents(cartItem) {
        // Quantity change event
        const quantityInput = cartItem.querySelector('.product-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('change', function() {
                const index = parseInt(cartItem.dataset.index);
                let quantity = parseInt(this.value);
                
                // Ensure quantity is at least 1
                if (isNaN(quantity) || quantity < 1) {
                    quantity = 1;
                    this.value = 1;
                }
                
                updateCartItemQuantity(index, quantity);
            });
        }
        
        // Delete item event
        const deleteBtn = cartItem.querySelector('.bx-trash');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const index = parseInt(cartItem.dataset.index);
                removeCartItem(index);
            });
        }
    }
    
    // Update cart item quantity
    function updateCartItemQuantity(index, quantity) {
        try {
            // Get cart from localStorage
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
            
            if (index >= 0 && index < cart.length) {
                // Update quantity
                cart[index].quantity = quantity;
                
                // Save updated cart to localStorage
                localStorage.setItem('shopping_cart', JSON.stringify(cart));
                
                // Recalculate summary
                updateSummary();
                
                // Update cart count
                updateCartCount();
                
                showNotification('Cart updated');
            }
        } catch (error) {
            console.error('Error updating cart item quantity:', error);
            showNotification(`Error updating cart: ${error.message}`, 'error');
        }
    }
    
    // Remove cart item
    function removeCartItem(index) {
        try {
            // Get cart from localStorage
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
            
            if (index >= 0 && index < cart.length) {
                // Get item name for notification
                const itemName = cart[index].name;
                
                // Remove item from cart
                cart.splice(index, 1);
                
                // Save updated cart to localStorage
                localStorage.setItem('shopping_cart', JSON.stringify(cart));
                
                // Reload cart items (redraws the UI)
                loadCartItems();
                
                showNotification(`Removed ${itemName} from cart`);
            }
        } catch (error) {
            console.error('Error removing cart item:', error);
            showNotification(`Error removing item: ${error.message}`, 'error');
        }
    }
    
    // Update cart summary
    function updateSummary() {
        try {
            // Get cart from localStorage
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
            
            // Calculate subtotal
            const subtotal = cart.reduce((total, item) => 
                total + (parseFloat(item.price) * item.quantity), 0);
            
            // Calculate delivery fee (5% of subtotal)
            const deliveryFee = subtotal * 0.05;
            
            // Calculate tax (8% of subtotal)
            const tax = subtotal * 0.08;
            
            // Calculate total
            const total = subtotal + deliveryFee + tax;
            
            // Update UI
            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            if (deliveryEl) deliveryEl.textContent = `$${deliveryFee.toFixed(2)}`;
            if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
            
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    }
    
    // Reset summary values
    function resetSummary() {
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (deliveryEl) deliveryEl.textContent = '$0.00';
        if (taxEl) taxEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00';
    }
    
    // Add checkout button
    function addCheckoutButton() {
        // Find existing checkout button
        const checkoutBtn = document.querySelector('.checkout-btn') || document.querySelector('[href*="checkout"]') || document.querySelector('button[class*="checkout"]');
        
        if (checkoutBtn) {
            // Remove existing event listeners and add new one
            checkoutBtn.replaceWith(checkoutBtn.cloneNode(true));
            const newCheckoutBtn = document.querySelector('.checkout-btn') || document.querySelector('[href*="checkout"]') || document.querySelector('button[class*="checkout"]');
            
            if (newCheckoutBtn) {
                newCheckoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Check if cart has items
                    const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
                    
                    if (cart.length === 0) {
                        showNotification('Your cart is empty. Add items before proceeding to checkout.', 'error');
                        return;
                    }
                    
                    // Navigate to checkout page
                    showNotification('Proceeding to checkout...');
                    
                    // Add a small delay for better UX
                    setTimeout(() => {
                        window.location.href = 'checkout.html';
                    }, 500);
                });
            }
        } else {
            // Create checkout button if it doesn't exist
            const cartRight = document.querySelector('.cart-checkout-right') || document.querySelector('.cart-summary') || document.querySelector('.cart-total');
            
            if (cartRight) {
                const checkoutButton = document.createElement('button');
                checkoutButton.className = 'checkout-btn';
                checkoutButton.textContent = 'Proceed to Checkout';
                
                // Style checkout button
                checkoutButton.style.width = '100%';
                checkoutButton.style.padding = '12px 0';
                checkoutButton.style.backgroundColor = '#4CAF50';
                checkoutButton.style.color = 'white';
                checkoutButton.style.border = 'none';
                checkoutButton.style.borderRadius = '4px';
                checkoutButton.style.fontSize = '16px';
                checkoutButton.style.cursor = 'pointer';
                checkoutButton.style.marginTop = '20px';
                checkoutButton.style.transition = 'background-color 0.3s ease';
                
                // Add hover effect
                checkoutButton.onmouseover = function() {
                    this.style.backgroundColor = '#45a049';
                };
                checkoutButton.onmouseout = function() {
                    this.style.backgroundColor = '#4CAF50';
                };
                
                // Add click event for navigation to checkout
                checkoutButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Check if cart has items
                    const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
                    
                    if (cart.length === 0) {
                        showNotification('Your cart is empty. Add items before proceeding to checkout.', 'error');
                        return;
                    }
                    
                    // Navigate to checkout page
                    showNotification('Proceeding to checkout...');
                    
                    // Add a small delay for better UX
                    setTimeout(() => {
                        window.location.href = 'checkout.html';
                    }, 500);
                });
                
                cartRight.appendChild(checkoutButton);
            }
        }
    }
    
    // Update cart count display
    function updateCartCount() {
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
                const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
                badge.textContent = totalItems;
            } else {
                // Remove badge if cart is empty
                badge.remove();
            }
        }
    }
});


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


// 1) Define an async handler that checks auth and redirects accordingly
async function handleProceedClick(event) {
  event.preventDefault();

  try {
    const authenticated = await isUserAuthenticated();
    if (authenticated) {
      // If logged in, send them to proceed.html (or whatever your proceed page is)
      window.location.href = '../checkout';
    } else {
      // If not logged in, send them to 
      window.location.href = '../register';
    }
  } catch (err) {
    console.error('Error during auth check:', err);
    // Fallback: send them to register page if something goes wrong
    window.location.href = '../register';
  }
}

// 2) Attach that handler to your “Proceed” button once the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const proceedBtn = document.getElementById('proceed-btn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', handleProceedClick);
  }
});
