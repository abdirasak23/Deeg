// Supabase Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://fpvuwegibnwucgxieirp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Notification System
const notificationContainer = document.getElementById('notification-container');
let notificationCount = 0;
const maxNotifications = 5;

/**
 * Shows a notification
 * @param {string} message - The notification message
 * @param {string} type - Type of notification: 'success', 'error', 'warning', or 'info'
 * @param {number} duration - Duration in milliseconds before auto-dismissal (default: 5000ms)
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Limit the number of notifications
    if (notificationContainer.children.length >= maxNotifications) {
        notificationContainer.removeChild(notificationContainer.firstChild);
    }
    
    // Create unique ID for this notification
    const notificationId = `notification-${Date.now()}-${notificationCount++}`;
    
    // Create the notification element
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `notification ${type}`;
    
    // Get the appropriate icon based on notification type
    let icon;
    switch (type) {
        case 'success':
            icon = 'bx-check-circle';
            break;
        case 'error':
            icon = 'bx-x-circle';
            break;
        case 'warning':
            icon = 'bx-error';
            break;
        case 'info':
        default:
            icon = 'bx-info-circle';
            break;
    }
    
    // Set up the notification content
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bx ${icon} notification-icon"></i>
            <div class="notification-message">${message}</div>
        </div>
        <div class="notification-close"><i class='bx bx-x'></i></div>
        <div class="notification-progress">
            <div class="notification-progress-bar" style="--duration: ${duration}ms"></div>
        </div>
    `;
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Add event listener for close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        dismissNotification(notificationId);
    });
    
    // Auto-dismiss after duration
    setTimeout(() => {
        if (document.getElementById(notificationId)) {
            dismissNotification(notificationId);
        }
    }, duration);
}

/**
 * Dismisses a notification with animation
 * @param {string} notificationId - The ID of the notification to dismiss
 */
function dismissNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;
    
    notification.style.animation = 'slide-out 0.3s ease-out forwards';
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Shorthand functions for different notification types
function notifySuccess(message, duration = 5000) {
    showNotification(message, 'success', duration);
}

function notifyError(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

function notifyWarning(message, duration = 5000) {
    showNotification(message, 'warning', duration);
}

function notifyInfo(message, duration = 5000) {
    showNotification(message, 'info', duration);
}

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const slideButton = document.querySelector('.slide');
const leftSidebar = document.querySelector('.left');
const productForm = document.getElementById('new-product-form');
let sidebarOpen = true;

// Navigation Handling
navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        const pageId = this.getAttribute('data-page');
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    });
});

// Sidebar Toggle
slideButton.addEventListener('click', function() {
    sidebarOpen = !sidebarOpen;
    leftSidebar.style.width = sidebarOpen ? '250px' : '80px';
    document.querySelectorAll('.nav-item p').forEach(text => {
        text.style.opacity = sidebarOpen ? '1' : '0';
    });
});

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Image Upload Previews
    document.querySelectorAll('.image-input').forEach(input => {
        input.addEventListener('change', function(e) {
            if (this.files?.[0]) {
                const reader = new FileReader();
                const previewId = this.id === 'ad-image' ? 'ad-preview' : 
                    `preview-${this.id.split('-').pop()}`;
                const preview = document.getElementById(previewId);

                reader.onload = e => {
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    });

    // Form Submission
    if (productForm) {
        productForm.addEventListener('submit', handleFormSubmit);
    }

    // Initial Products Load
    loadProducts();

    // Delete Handlers
    const productsList = document.getElementById('products-list');
    if (productsList) {
        productsList.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-btn')) {
                const row = e.target.closest('tr');
                const productId = row.dataset.id;
                const category = row.dataset.category;
                
                if (confirm('Delete this product permanently?')) {
                    try {
                        await deleteProduct(category, productId);
                        row.remove();
                    } catch (error) {
                        5(`Delete failed: ${error.message}`);
                        console.error('Delete error:', error);
                    }
                }
            }
        });
    }
});

// Form Submit Handler
async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';

    try {
        const formData = getFormData();
        const imageUrls = await uploadImages(formData);
        const product = await saveProduct(formData, imageUrls);
        addProductToUI(product);
        productForm.reset();
        clearImagePreviews();
        notifyInfo('Product saved successfully!');
    } catch (error) {
        console.error('Submit error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Helper Functions
function getFormData() {
    return {
        name: document.getElementById('product-name').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        oldPrice: document.getElementById('product-old-price').value ?
            parseFloat(document.getElementById('product-old-price').value) : null,
        category: document.getElementById('product-category').value,
        quantity: parseInt(document.getElementById('product-quantity').value),
        description: document.getElementById('product-description').value.trim(),
        specifications: document.getElementById('product-specifications').value.trim(),
        images: [
            document.getElementById('product-image-1').files[0],
            document.getElementById('product-image-2').files[0],
            document.getElementById('product-image-3').files[0],
            document.getElementById('product-image-4').files[0]
        ].filter(Boolean),
        adImage: document.getElementById('ad-image').files[0]
    };
}

async function uploadImages(formData) {
    const timestamp = Date.now();
    const safeName = formData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const imageUrls = { productImages: [], adImage: null };
    
    // Use the exact bucket name from your Supabase dashboard
    const BUCKET_NAME = 'product-image'; // Trying your original bucket name

    notifyInfo('Starting image uploads to bucket:', BUCKET_NAME);

    // Upload Product Images
    for (const [index, file] of formData.images.entries()) {
        if (!file) continue;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${safeName}-${timestamp}-${index+1}.${fileExt}`;
        const filePath = `${formData.category}/${fileName}`;

        notifyInfo(`Uploading ${index+1}/${formData.images.length}: ${filePath}`);
        
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Upload error for image', index+1, error);
                throw new Error(`Image upload failed: ${error.message}`);
            }

            notifyInfo('Upload successful:', data);

            const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            console.log('Public URL:', urlData.publicUrl);
            imageUrls.productImages.push(urlData.publicUrl);
        } catch (err) {
            console.error('Exception during upload:', err);
            throw err;
        }
    }

    // Upload Ad Image
    if (formData.adImage) {
        const fileExt = formData.adImage.name.split('.').pop();
        const fileName = `${safeName}-${timestamp}-ad.${fileExt}`;
        const filePath = `${formData.category}/${fileName}`;

        console.log('Uploading ad image:', filePath);

        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, formData.adImage, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Upload error for ad image:', error);
                // Don't throw here, just log the error - ad image is optional
            } else {
                console.log('Ad upload successful:', data);
                
                const { data: urlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);
                
                console.log('Ad public URL:', urlData.publicUrl);
                imageUrls.adImage = urlData.publicUrl;
            }
        } catch (err) {
            console.error('Exception during ad upload:', err);
            // Don't throw here, just log the error - ad image is optional
        }
    }

    return imageUrls;
}

async function saveProduct(formData, imageUrls) {
    // Create product data object
    const productData = {
        name: formData.name,
        price: formData.price,
        old_price: formData.oldPrice,
        quantity: formData.quantity,
        description: formData.description,
        specifications: formData.specifications,
        created_at: new Date().toISOString()
    };

    // Add image URLs to product data
    imageUrls.productImages.forEach((url, i) => {
        productData[`im${i+1}`] = url;
    });

    // Add ad image if available
    if (imageUrls.adImage) {
        productData.ad1 = imageUrls.adImage;
    }

    console.log('Saving product to database:', productData);

    // Save to database
    const { data, error } = await supabase
        .from(formData.category)
        .insert(productData)
        .select()
        .single();

    if (error) {
        console.error('Database save error:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    console.log('Product saved successfully:', data);
    return { ...data, category: formData.category };
}

function addProductToUI(product) {
    const productsTable = document.getElementById('products-list');
    if (!productsTable) return;

    const row = document.createElement('tr');
    row.dataset.id = product.id;
    row.dataset.category = product.category;
    row.innerHTML = `
        <td><div class="table-product-image" 
             style="background-image: url('${product.im1 || ''}')"></div></td>
        <td>${product.name}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>${product.category}</td>
        <td>${product.quantity}</td>
        <td>
            <button class="action-btn edit-btn"><i class='bx bx-edit'></i></button>
            <button class="action-btn delete-btn"><i class='bx bx-trash'></i></button>
        </td>
    `;
    productsTable.prepend(row);
}

async function loadProducts() {
    const productsTable = document.getElementById('products-list');
    if (!productsTable) return;

    try {
        console.log('Loading categories and products...');
        
        // Get all categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name');

        if (catError) {
            console.error('Error loading categories:', catError);
            return;
        }

        if (!categories || categories.length === 0) {
            console.log('No categories found');
            return;
        }

        console.log('Categories loaded:', categories);

        // Fetch products from each category
        const allProducts = [];
        for (const category of categories) {
            console.log(`Loading products from category: ${category.name}`);
            
            const { data: products, error: prodError } = await supabase
                .from(category.name)
                .select('*');

            if (prodError) {
                console.error(`Error loading products from ${category.name}:`, prodError);
                continue;
            }

            if (products && products.length > 0) {
                console.log(`Found ${products.length} products in ${category.name}`);
                allProducts.push(...products.map(p => ({ ...p, category: category.name })));
            }
        }

        console.log(`Total products loaded: ${allProducts.length}`);
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error in loadProducts:', error);
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('products-list');
    if (!tbody) return;

    console.log('Rendering products to UI:', products.length);
    
    tbody.innerHTML = products.map(product => `
        <tr data-id="${product.id}" data-category="${product.category}">
            <td><div class="table-product-image" 
                     style="background-image: url('${product.im1 || ''}')"></div></td>
            <td>${product.name || ''}</td>
            <td>${product.price ? `$${product.price.toFixed(2)}` : '$0.00'}</td>
            <td>${product.category || ''}</td>
            <td>${product.quantity || 0}</td>
            <td>
                <button class="action-btn edit-btn"><i class='bx bx-edit'></i></button>
                <button class="action-btn delete-btn"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
    `).join('');
}

async function deleteProduct(category, productId) {
    console.log(`Deleting product: ${productId} from ${category}`);
    
    try {
        // First get the product to get image paths
        const { data: product, error: getError } = await supabase
            .from(category)
            .select('*')
            .eq('id', productId)
            .single();
        
        if (getError) {
            console.error('Error fetching product for deletion:', getError);
            throw new Error(`Fetch failed: ${getError.message}`);
        }
        
        // Delete database record
        const { error: deleteError } = await supabase
            .from(category)
            .delete()
            .eq('id', productId);

        if (deleteError) {
            console.error('Error deleting product record:', deleteError);
            throw new Error(`Delete failed: ${deleteError.message}`);
        }
        
        console.log('Product record deleted successfully');
        
        // Optional: Delete associated images from storage
        // This step is optional and can be challenging to implement fully
        // because you'd need to extract paths from URLs
        
        // For now, we'll just log success
        console.log('Product deletion complete');
        return true;
    } catch (error) {
        console.error('Delete function error:', error);
        throw error;
    }
}

function clearImagePreviews() {
    document.querySelectorAll('.image-preview').forEach(preview => {
        preview.style.backgroundImage = '';
        preview.style.display = 'none';
    });
}