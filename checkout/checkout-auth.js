// Supabase Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://fpvuwegibnwucgxieirp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);




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
    updateCartCount();
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