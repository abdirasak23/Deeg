// checkout.js - Complete checkout functionality
document.addEventListener('DOMContentLoaded', function() {
    // API key for country/state/city data
    const API_KEY = 'NXh3U2U2OUJmbURTOUdhbXlxZGNwUnRDc1lYVmp6a0o3WnZqa1pWaA==';
    
    // DOM Elements
    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentController = document.querySelector('.payment-controller');
    const cartDetailsContainer = document.querySelector('.cart-details .details').parentElement;
    const subtotalElement = document.querySelector('.total .so-total');
    const deliveryElement = document.querySelectorAll('.total .so-total')[1];
    const totalElement = document.querySelectorAll('.total .so-total')[2];
    const amountDisplay = document.querySelector('.amount p');
    const phoneNumberInput = document.querySelector('input[placeholder="+25261*******"]');
    const emailInput = document.querySelector('input[placeholder="email"]');
    const firstNameInput = document.querySelector('input[placeholder="first name"]');
    const lastNameInput = document.querySelector('input[placeholder="last name"]');
    const address1Input = document.querySelector('input[placeholder="Write your address"]');
    const address2Input = document.querySelector('input[placeholder="Write your near address"]');
    const countrySelect = document.getElementById('country');
    const stateInput = document.querySelector('input[placeholder="Write your State"]');
    const cityInput = document.querySelector('input[placeholder="Write your City"]');
    const textMeCheckbox = document.getElementById('text-me');
    const termsCheckbox = document.querySelector('input[type="checkbox"]:not(#text-me)');
    const payAndConfirmBtn = document.querySelector('.btn.btn-primary:not(.Proceed)');
    const payNowBtn = document.querySelector('.btn.btn-primary.Proceed');
    const chatBtn = document.querySelector('.chat');
    
    // Initialize checkout
    init();
    
    function init() {
        loadCartData();
        setupPaymentOptions();
        loadCountries();
        setupEventListeners();
        setupNotificationSystem();
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="bx bx-info-circle notification-icon"></i>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: ${type === 'error' ? '#ff5555' : type === 'success' ? '#4CAF50' : '#55aaff'};
            color: white;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            font-size: 14px;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    function setupNotificationSystem() {
        // This function sets up the notification system
        console.log('Notification system initialized');
    }
    
    // Load cart data from localStorage
    function loadCartData() {
        try {
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
            
            if (cart.length === 0) {
                showEmptyCartMessage();
                return;
            }
            
            displayCartItems(cart);
            calculateTotals(cart);
            
        } catch (error) {
            console.error('Error loading cart data:', error);
            showNotification('Error loading cart data', 'error');
        }
    }
    
    // Show empty cart message
    function showEmptyCartMessage() {
        const cartContainer = document.querySelector('.cart-details');
        if (cartContainer) {
            cartContainer.innerHTML = `
                <div class="empty-cart-checkout">
                    <i class='bx bx-cart-alt' style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Your cart is empty</p>
                    <a href="products.html" style="
                        background-color: #55aaff;
                        color: white;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                    ">Continue Shopping</a>
                </div>
            `;
            
            const emptyCartDiv = cartContainer.querySelector('.empty-cart-checkout');
            if (emptyCartDiv) {
                emptyCartDiv.style.textAlign = 'center';
                emptyCartDiv.style.padding = '40px 20px';
            }
        }
        
        // Disable payment buttons
        if (payAndConfirmBtn) payAndConfirmBtn.disabled = true;
        if (payNowBtn) payNowBtn.disabled = true;
    }
    
    // Display cart items in checkout summary
    function displayCartItems(cart) {
        const detailsContainer = document.querySelector('.cart-details');
        
        if (!detailsContainer) return;
        
        // Clear existing items except summary title
        const existingDetails = detailsContainer.querySelectorAll('.details');
        existingDetails.forEach(detail => detail.remove());
        
        // Add each cart item
        cart.forEach(item => {
            const itemElement = createCheckoutItemElement(item);
            
            // Insert before total prices section
            const totalPricesSection = detailsContainer.querySelector('.total-prices');
            if (totalPricesSection) {
                detailsContainer.insertBefore(itemElement, totalPricesSection);
            } else {
                detailsContainer.appendChild(itemElement);
            }
        });
    }
    
    // Create checkout item element
    function createCheckoutItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'details';
        
        const price = parseFloat(item.price).toFixed(2);
        const totalPrice = (parseFloat(item.price) * item.quantity).toFixed(2);
        
        itemDiv.innerHTML = `
            <div class="product-details">
                <div class="pro-name">
                    <p>${item.name}</p>
                </div>
                <div class="pro-price">
                    <div class="quantity">
                        <div class="qua">
                            <p>${item.quantity}</p>
                        </div>
                    </div>
                    <p>$${totalPrice}</p>
                </div>
            </div>
        `;
        
        return itemDiv;
    }
    
    // Calculate and display totals
    function calculateTotals(cart) {
        const subtotal = cart.reduce((total, item) => 
            total + (parseFloat(item.price) * item.quantity), 0);
        
        const deliveryFee = subtotal * 0.05; // 5% delivery fee
        const total = subtotal + deliveryFee;
        
        // Update display elements
        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (deliveryElement) deliveryElement.textContent = `$${deliveryFee.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
        if (amountDisplay) amountDisplay.textContent = `$${total.toFixed(2)}`;
        
        // Update instructions with correct amount
        const instructionsP = document.querySelector('.instaructions p');
        if (instructionsP) {
            instructionsP.textContent = `Please enter a correct number and pay the amount of $${total.toFixed(2)} and proceed and confirm the payment.`;
        }
    }
    
    // Setup payment options
    function setupPaymentOptions() {
        paymentOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                paymentOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.setAttribute('aria-checked', 'false');
                });
                
                // Add selected class to clicked option
                this.classList.add('selected');
                this.setAttribute('aria-checked', 'true');
                
                // Show payment controller
                if (paymentController) {
                    paymentController.classList.add('show');
                    paymentController.style.display = 'block';
                }
                
                // Get payment method name
                const img = this.querySelector('img');
                const paymentMethod = img ? img.alt || img.src.split('/').pop().split('.')[0] : 'payment method';
                
                showNotification(`Selected ${paymentMethod} as payment method`);
            });
            
            // Add hover effects
            option.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'transform 0.2s ease';
            });
            
            option.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }
    
    // Load countries from API
    function loadCountries() {
        if (!countrySelect) return;
        
        countrySelect.innerHTML = '<option value="" disabled selected>Loading countries...</option>';
        
        fetch('https://api.countrystatecity.in/v1/countries', {
            headers: { 'X-CSCAPI-KEY': API_KEY }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(countries => {
            countrySelect.innerHTML = '<option value="" disabled selected>Select a country</option>';
            
            countries.sort((a, b) => a.name.localeCompare(b.name)).forEach(country => {
                const option = document.createElement('option');
                option.value = country.iso2;
                option.textContent = country.name;
                countrySelect.appendChild(option);
            });
            
            showNotification('Countries loaded successfully');
        })
        .catch(error => {
            console.error('Error fetching countries:', error);
            countrySelect.innerHTML = '<option value="" disabled selected>Error loading countries</option>';
            showNotification('Failed to load countries. Please refresh the page.', 'error');
        });
    }
    
    // Handle country selection change
    function handleCountryChange() {
        const countryCode = countrySelect.value;
        
        if (!countryCode) return;
        
        // For this implementation, we'll just show a notification
        // You can extend this to load states if needed
        const selectedCountry = countrySelect.options[countrySelect.selectedIndex].textContent;
        showNotification(`Selected country: ${selectedCountry}`);
    }
    
    // Setup all event listeners
    function setupEventListeners() {
        // Country selection
        if (countrySelect) {
            countrySelect.addEventListener('change', handleCountryChange);
        }
        
        // Pay and Confirm button
        if (payAndConfirmBtn) {
            payAndConfirmBtn.addEventListener('click', handlePayAndConfirm);
        }
        
        // Pay Now button
        if (payNowBtn) {
            payNowBtn.addEventListener('click', handlePayNow);
        }
        
        // Chat button
        if (chatBtn) {
            chatBtn.addEventListener('click', function() {
                showNotification('Opening chat support...', 'info');
                // Here you could integrate with a chat system
            });
        }
        
        // Form validation on input
        setupFormValidation();
        
        // Phone number formatting
        if (phoneNumberInput) {
            phoneNumberInput.addEventListener('input', function() {
                // Basic phone number formatting
                let value = this.value.replace(/\D/g, '');
                if (value.length > 0 && !value.startsWith('252')) {
                    if (value.startsWith('61')) {
                        value = '252' + value;
                    }
                }
                this.value = value.length > 3 ? '+' + value : value;
            });
        }
        
        // Email validation
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (this.value && !emailRegex.test(this.value)) {
                    this.style.borderColor = '#ff5555';
                    showNotification('Please enter a valid email address', 'error');
                } else {
                    this.style.borderColor = '';
                }
            });
        }
    }
    
    // Setup form validation
    function setupFormValidation() {
        const requiredFields = [
            phoneNumberInput,
            emailInput,
            firstNameInput,
            lastNameInput,
            address1Input,
            countrySelect,
            stateInput,
            cityInput
        ];
        
        requiredFields.forEach(field => {
            if (field) {
                field.addEventListener('blur', function() {
                    if (this.hasAttribute('required') && !this.value.trim()) {
                        this.style.borderColor = '#ff5555';
                    } else {
                        this.style.borderColor = '';
                    }
                });
            }
        });
    }
    
    // Handle Pay and Confirm button click
    function handlePayAndConfirm(e) {
        e.preventDefault();
        
        if (!validatePaymentForm()) {
            return;
        }
        
        const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }
        
        // Show processing
        const originalText = payAndConfirmBtn.textContent;
        payAndConfirmBtn.textContent = 'Processing...';
        payAndConfirmBtn.disabled = true;
        
        // Simulate payment processing
        setTimeout(() => {
            const paymentData = collectPaymentData();
            processPayment(paymentData);
            
            payAndConfirmBtn.textContent = originalText;
            payAndConfirmBtn.disabled = false;
        }, 2000);
    }
    
    // Handle Pay Now button click
    function handlePayNow(e) {
        e.preventDefault();
        
        if (!validateDeliveryForm()) {
            return;
        }
        
        const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }
        
        // Show processing
        const originalText = payNowBtn.textContent;
        payNowBtn.textContent = 'Processing...';
        payNowBtn.disabled = true;
        
        // Simulate payment processing
        setTimeout(() => {
            const orderData = collectOrderData();
            processOrder(orderData);
            
            payNowBtn.textContent = originalText;
            payNowBtn.disabled = false;
        }, 2000);
    }
    
    // Validate payment form
    function validatePaymentForm() {
        const errors = [];
        
        // Check if payment method is selected
        const selectedPayment = document.querySelector('.payment-option.selected');
        if (!selectedPayment) {
            errors.push('Please select a payment method');
        }
        
        // Check phone number
        if (!phoneNumberInput || !phoneNumberInput.value.trim()) {
            errors.push('Phone number is required');
        } else {
            const phoneRegex = /^\+?[0-9]{10,15}$/;
            if (!phoneRegex.test(phoneNumberInput.value.replace(/\s/g, ''))) {
                errors.push('Please enter a valid phone number');
            }
        }
        
        if (errors.length > 0) {
            showNotification(errors.join('. '), 'error');
            return false;
        }
        
        return true;
    }
    
    // Validate delivery form
    function validateDeliveryForm() {
        const errors = [];
        
        // Required fields validation
        const requiredFields = [
            { field: emailInput, name: 'Email' },
            { field: firstNameInput, name: 'First name' },
            { field: lastNameInput, name: 'Last name' },
            { field: address1Input, name: 'Address line 1' },
            { field: countrySelect, name: 'Country' },
            { field: stateInput, name: 'State' },
            { field: cityInput, name: 'City' }
        ];
        
        requiredFields.forEach(({ field, name }) => {
            if (!field || !field.value.trim()) {
                errors.push(`${name} is required`);
            }
        });
        
        // Email validation
        if (emailInput && emailInput.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                errors.push('Please enter a valid email address');
            }
        }
        
        // Terms and conditions
        if (termsCheckbox && !termsCheckbox.checked) {
            errors.push('Please accept the terms and conditions');
        }
        
        if (errors.length > 0) {
            showNotification(errors.join('. '), 'error');
            return false;
        }
        
        return true;
    }
    
    // Collect payment data
    function collectPaymentData() {
        const selectedPayment = document.querySelector('.payment-option.selected img');
        const paymentMethod = selectedPayment ? 
            selectedPayment.alt || selectedPayment.src.split('/').pop().split('.')[0] : 'unknown';
        
        return {
            paymentMethod: paymentMethod,
            phoneNumber: phoneNumberInput ? phoneNumberInput.value : '',
            amount: totalElement ? totalElement.textContent : '$0.00',
            timestamp: new Date().toISOString()
        };
    }
    
    // Collect order data
    function collectOrderData() {
        const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
        
        return {
            items: cart,
            customer: {
                email: emailInput ? emailInput.value : '',
                firstName: firstNameInput ? firstNameInput.value : '',
                lastName: lastNameInput ? lastNameInput.value : '',
                phone: phoneNumberInput ? phoneNumberInput.value : ''
            },
            delivery: {
                address1: address1Input ? address1Input.value : '',
                address2: address2Input ? address2Input.value : '',
                country: countrySelect ? countrySelect.options[countrySelect.selectedIndex]?.textContent : '',
                state: stateInput ? stateInput.value : '',
                city: cityInput ? cityInput.value : ''
            },
            preferences: {
                textMe: textMeCheckbox ? textMeCheckbox.checked : false,
                termsAccepted: termsCheckbox ? termsCheckbox.checked : false
            },
            totals: {
                subtotal: subtotalElement ? subtotalElement.textContent : '$0.00',
                delivery: deliveryElement ? deliveryElement.textContent : '$0.00',
                total: totalElement ? totalElement.textContent : '$0.00'
            },
            timestamp: new Date().toISOString(),
            orderId: generateOrderId()
        };
    }
    
    // Generate order ID
    function generateOrderId() {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    // Process payment
    function processPayment(paymentData) {
        console.log('Processing payment:', paymentData);
        
        // Save payment data to localStorage for demo purposes
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        payments.push(paymentData);
        localStorage.setItem('payments', JSON.stringify(payments));
        
        showNotification('Payment submitted successfully! Please confirm the payment on your mobile device.', 'success');
        
        // You could integrate with actual payment APIs here
        // For now, we'll just show a success message
    }
    
    // Process order
    function processOrder(orderData) {
        console.log('Processing order:', orderData);
        
        // Save order data to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Clear cart after successful order
        localStorage.removeItem('shopping_cart');
        
        showNotification(`Order ${orderData.orderId} placed successfully!`, 'success');
        
        // Redirect to success page or show order confirmation
        setTimeout(() => {
            showOrderConfirmation(orderData);
        }, 2000);
    }
    
    // Show order confirmation
    function showOrderConfirmation(orderData) {
        const confirmationModal = document.createElement('div');
        confirmationModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        confirmationModal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <i class='bx bx-check-circle' style="font-size: 60px; color: #4CAF50; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 15px;">Order Confirmed!</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    Your order <strong>${orderData.orderId}</strong> has been placed successfully.
                </p>
                <p style="color: #666; margin-bottom: 25px;">
                    Total: <strong>${orderData.totals.total}</strong>
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.location.href='products.html'" style="
                        background-color: #55aaff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Continue Shopping</button>
                    <button onclick="this.closest('div').parentElement.remove()" style="
                        background-color: #ccc;
                        color: #333;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmationModal);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (confirmationModal.parentElement) {
                confirmationModal.remove();
            }
        }, 10000);
    }
    
    // Update cart count in header
    function updateCartCount() {
        try {
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            
            const cartCountElements = document.querySelectorAll('.cart-count, #cart-count, [data-cart-count]');
            cartCountElements.forEach(element => {
                element.textContent = totalItems;
                element.style.display = totalItems > 0 ? 'inline' : 'none';
            });
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }
    
    // Initialize cart count
    updateCartCount();
    
    // Add CSS for payment options selection
    const style = document.createElement('style');
    style.textContent = `
        .payment-option {
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            border-radius: 8px;
            padding: 10px;
        }
        
        .payment-option:hover {
            border-color: #ddd;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .payment-option.selected {
            border-color: #55aaff;
            background-color: #f0f8ff;
            box-shadow: 0 2px 12px rgba(85,170,255,0.2);
        }
        
        .payment-controller {
            display: none;
            transition: all 0.3s ease;
        }
        
        .payment-controller.show {
            display: block;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .notification {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        input:invalid,
        select:invalid {
            border-color: #ff5555;
        }
        
        input:valid,
        select:valid {
            border-color: #4CAF50;
        }
    `;
    
    document.head.appendChild(style);
    
    // Add loading indicator function
    function showLoadingIndicator(element, text = 'Loading...') {
        if (element) {
            element.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class='bx bx-loader-alt' style="animation: spin 1s linear infinite;"></i>
                    ${text}
                </span>
            `;
        }
    }
    
    // Add CSS for loading animation
    const loadingStyle = document.createElement('style');
    loadingStyle.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(loadingStyle);
    
    console.log('Checkout system initialized successfully');
});





