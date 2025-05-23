// registration.js - User registration script for StreamWave

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase with your project's URL and public anon key
const supabaseUrl = "https://fpvuwegibnwucgxieirp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnV3ZWdpYm53dWNneGllaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzU2NzEsImV4cCI6MjA1ODMxMTY3MX0.sOmvlv4vjV_EcXze0zYGZSolDst8rg5UqGkc1146Qxw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DOM Elements
document.addEventListener('DOMContentLoaded', function () {
    const registrationForm = document.querySelector('form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const googleButton = document.querySelector('.btn-google');

    // Add elements for feedback
    const formContainer = document.querySelector('.form-container');

    // Create elements for messages
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.color = '#F43F5E';
    errorMessage.style.marginBottom = '1rem';
    errorMessage.style.display = 'none';

    const successMessage = document.createElement('div');
    successMessage.id = 'success-message';
    successMessage.style.color = '#10B981';
    successMessage.style.marginBottom = '1rem';
    successMessage.style.display = 'none';

    const registrationLoader = document.createElement('div');
    registrationLoader.id = 'registration-loader';
    registrationLoader.style.display = 'none';
    registrationLoader.innerHTML = '<div style="text-align: center; margin: 1rem 0;"><i class="fas fa-spinner fa-spin"></i> Processing...</div>';

    // Insert messages before the form
    formContainer.insertBefore(errorMessage, registrationForm);
    formContainer.insertBefore(successMessage, registrationForm);
    formContainer.insertBefore(registrationLoader, registrationForm);

    // Check if user is already logged in
    checkAuthAndRedirect();

    // Registration form submission
    registrationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await handleRegistration();
    });

    // Google sign-up handler
    if (googleButton) {
        googleButton.addEventListener('click', async () => {
            await handleGoogleSignUp();
        });
    }

    // Registration Functionality (Email/Password)
    async function handleRegistration() {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validate inputs
        if (!name || !email || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        try {
            // Show loading indicator
            showLoader(true);
            hideError();
            hideSuccess();

            // Sign up with Supabase Auth
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (authError) throw authError;

            // Log the entire response to see what we're getting
            console.log('Auth signup complete response:', data);
            
            // Check if user was created
            if (!data || !data.user || !data.user.id) {
                throw new Error('User creation failed. Please try again.');
            }
            
            // IMPORTANT: Insert into users table IMMEDIATELY after auth signup
            console.log('Attempting to create user profile with ID:', data.user.id);
            
            // Try a direct insert with explicit values
            const { error: userError } = await supabase
                .from('people')
                .insert({
                    id: data.user.id,
                    name: name,
                    email: email,
                    created_at: new Date().toISOString()
                });

            if (userError) {
                console.error('Failed to insert user profile:', userError);
                // Log the specific error details to help with debugging
                console.error('Error code:', userError.code);
                console.error('Error message:', userError.message);
                console.error('Error details:', userError.details);
                
                throw new Error(`Failed to save user data: ${userError.message}`);
            }

            console.log('User profile created successfully!');
            
            // Show success message
            showSuccess('Registration successful! Redirecting to login...');

            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'Registration failed. Please try again.');
        } finally {
            showLoader(false);
        }
    }

    // Google Sign Up Functionality
    async function handleGoogleSignUp() {
        try {
            showLoader(true);
            hideError();
            hideSuccess();

            // 1) Save the current page (so we can return here after OAuth)
            const lastPage = window.location.pathname + window.location.search;
            localStorage.setItem('redirectAfterLogin', lastPage);

            // 2) Kick off Supabase Google OAuth
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Supabase will redirect to auth-callback.html
                    redirectTo: window.location.origin + '/auth-callback.html'
                }
            });

            if (error) throw error;
            // The redirect happens automatically; no more code needed here.
        } catch (error) {
            showError(error.message || 'Google sign-up failed. Please try again.');
            showLoader(false);
        }
    }

    // Auth Check and Redirect
    async function checkAuthAndRedirect() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                // If already logged in, send to index.html
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Auth check error:', error.message);
        }
    }

    // UI Helpers
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    function hideSuccess() {
        successMessage.style.display = 'none';
    }

    function showLoader(show) {
        registrationLoader.style.display = show ? 'block' : 'none';
    }
});

// Save the original page URL before starting OAuth flow
localStorage.setItem('redirectAfterLogin', window.location.href);

// This part ensures that after any sign-in (email/password or OAuth), 
// we create a profile if needed and then redirect back to the last page.
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN' && session && session.user) {
        console.log('User signed in:', session.user.email);
        
        try {
            // 1) Check if this user already has a profile
            const { data: existingUser, error: checkError } = await supabase
                .from('people')
                .select('id')
                .eq('id', session.user.id)
                .single();
                
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking if user exists:', checkError);
            }
            
            // 2) Only insert a profile if none exists
            if (!existingUser) {
                console.log('Creating profile for user:', session.user.id);
                
                const userName = session.user.user_metadata?.full_name || 
                                 session.user.user_metadata?.name || 
                                 session.user.email.split('@')[0];
                
                const { error: insertError } = await supabase
                    .from('people')
                    .insert({
                        id: session.user.id,
                        name: userName,
                        email: session.user.email,
                        created_at: new Date().toISOString()
                    });
                
                if (insertError) {
                    console.error('Failed to create user profile on auth state change:', insertError);
                    throw insertError;
                }
                
                console.log('User profile created successfully on auth state change!');
            } else {
                console.log('User profile already exists, skipping creation');
            }
            
            // 3) Redirect back to the page we stored, or fallback to '/dashboard'
            const storedRedirect = localStorage.getItem('redirectAfterLogin');
            const target = storedRedirect || '/dashboard';
            localStorage.removeItem('redirectAfterLogin');

            // Only redirect if we're currently on auth-callback.html or login/register pages
            const currentPath = window.location.pathname;
            if (
                currentPath.includes('auth-callback.html') ||
                currentPath.includes('login.html') ||
                currentPath.includes('register.html')
            ) {
                window.location.href = target;
            }
            // If user is already on some other page, do nothing
        } catch (error) {
            console.error('Error handling auth state change:', error);
        }
    }
});
