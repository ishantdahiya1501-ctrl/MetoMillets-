document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Initialize all interactive components
    initStartupNotice();
    initGlobalAlerts();
    initHeroCarousel();
    initFeaturedProducts();
    initFlavorQuiz();
    initTreatYourself();
    initFlavorWheel();
    initHeroScrollEffect();
});

/**
 * Shows a simple startup notice on first visit.
 */
function initStartupNotice() {
    const storageKey = 'mtm_startup_notice_seen';
    if (localStorage.getItem(storageKey) === 'true') return;

    const overlay = document.createElement('div');
    overlay.className = 'startup-notice-overlay';
    overlay.id = 'startupNoticeOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Startup Notice');

    overlay.innerHTML = `
        <div class="startup-notice-modal" role="document">
            <button class="startup-notice-close" type="button" aria-label="Close notice">&times;</button>
            <h3 class="startup-notice-title">Quick Note</h3>
            <p class="startup-notice-text">
                This is a startup and we have not started selling yet, but we will start soon.
                For more details, email us at <a href="mailto:metomillets@gmail.com">metomillets@gmail.com</a> — we’ll try to reply as fast as we can.
            </p>
            <button class="btn btn-primary startup-notice-cta" type="button">OK</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.startup-notice-close');
    const okBtn = overlay.querySelector('.startup-notice-cta');

    const close = () => {
        localStorage.setItem(storageKey, 'true');
        overlay.remove();
    };

    closeBtn?.addEventListener('click', close);
    okBtn?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
}

function mtmInitHeaderUi() {
    if (window.__mtmHeaderUiInit) return;

    const headerReady = !!(
        document.getElementById('cartBtn') ||
        document.getElementById('wishlistBtn') ||
        document.getElementById('mobileCartBtn') ||
        document.getElementById('mobileCartBtnPrimary') ||
        document.getElementById('mobileWishlistBtn') ||
        document.getElementById('mobileWishlistBtnTop') ||
        document.getElementById('mobileMenuBtn')
    );

    if (!headerReady) return;

    window.__mtmHeaderUiInit = true;
    initMobileNav();
    initMobileBottomNav();
    initOverlaysAndSidebars();
    setMobileBottomNavActiveTab();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(mtmInitHeaderUi, 250);
});

// Wait for header to be loaded before initializing header-dependent features
window.addEventListener('headerLoaded', () => {
    console.log('Header loaded event received');
    // Small delay to ensure DOM is fully ready
    setTimeout(mtmInitHeaderUi, 100);
});

/**
 * Initializes the mobile navigation menu.
 */
function initMobileNav() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMobileNav = document.getElementById('closeMobileNav');
    const mobileNav = document.getElementById('mobileNav');

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeMobileNav && mobileNav) {
        closeMobileNav.addEventListener('click', () => {
            mobileNav.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
}

/**
 * Initializes global alert banners like the temperature alert.
 */
function initGlobalAlerts() {
    if (!window.utils) return;
    const tempAlert = document.getElementById('temperatureAlert');
    const closeTempAlert = document.getElementById('closeTempAlert');

    // Simulate temperature check
    if (window.utils.checkTemperature() && tempAlert) {
        tempAlert.style.display = 'block';
    }

    if (closeTempAlert) {
        closeTempAlert.addEventListener('click', () => {
            tempAlert.style.display = 'none';
        });
    }
}

/**
 * Initializes the Hero Carousel functionality.
 */
function initHeroCarousel() {
    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.carousel-dot');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');

        let currentSlide = 0;
        let slideInterval;

        const goToSlide = (slideIndex) => {
            // Remove active class from all slides and dots
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));

            // Add active class to the new slide and dot
            slides[slideIndex].classList.add('active');
            dots[slideIndex].classList.add('active');

            currentSlide = slideIndex;
        };

        const nextSlide = () => {
            const nextSlideIndex = (currentSlide + 1) % slides.length;
            goToSlide(nextSlideIndex);
        };

        const prevSlide = () => {
            const prevSlideIndex = (currentSlide - 1 + slides.length) % slides.length;
            goToSlide(prevSlideIndex);
        };

        const startAutoplay = () => {
            stopAutoplay(); // Ensure no multiple intervals are running
            slideInterval = setInterval(nextSlide, 6000); // Change slide every 6 seconds
        };

        const stopAutoplay = () => {
            clearInterval(slideInterval);
        };

        // Event Listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                stopAutoplay();
                startAutoplay(); // Restart autoplay timer on manual navigation
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                stopAutoplay();
                startAutoplay();
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
                stopAutoplay();
                startAutoplay();
            });
        });

        // Pause autoplay on hover
        heroCarousel.addEventListener('mouseenter', stopAutoplay);
        heroCarousel.addEventListener('mouseleave', startAutoplay);

        // Initialize
        goToSlide(0);
        startAutoplay();
    }
}

/**
 * Adds a scroll effect to the hero carousel, making it fade on scroll.
 */
function initHeroScrollEffect() {
    const heroContainer = document.querySelector('.hero-carousel-container');
    if (!heroContainer) return;

    window.addEventListener('scroll', () => {
        // Add a class when the user scrolls more than 50px
        if (window.scrollY > 50) {
            heroContainer.classList.add('is-scrolled');
        } else {
            heroContainer.classList.remove('is-scrolled');
        }
    }, { passive: true }); // Use passive listener for better scroll performance
}


/**
 * Loads and displays featured products on the homepage.
 */
function initFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    if (!window.productData || !Array.isArray(window.productData.products)) return;

    const bestsellers = window.productData.products.filter(p => p.subcategory === 'bestseller').slice(0, 4); // Get top 4

    if (bestsellers.length === 0) {
        container.innerHTML = '<p>No bestsellers to display at the moment.</p>';
        return;
    }

    let productsHTML = '';
    bestsellers.forEach(product => {
        productsHTML += createProductCardHTML(product);
    });

    container.innerHTML = productsHTML;

    // Add event listeners for the new product cards
    container.addEventListener('click', (e) => {
        const target = e.target;
        const productCard = target.closest('.product-card');
        if (!productCard) return;

        const productId = parseInt(productCard.dataset.productId);
        const product = bestsellers.find(p => p.id === productId);
        if (!product) return;

        const detailUrl = product.id === 27
            ? 'pages/assorted-mini-box.html'
            : `pages/product-detail.html?id=${product.id}`;

        if (target.matches('.buy-now-btn') || target.closest('.buy-now-btn')) {
            window.location.href = detailUrl;
        } else if (target.matches('.add-to-cart-btn') || target.closest('.add-to-cart-btn')) {
            window.cartManager.addToCart({
                ...product,
                image: product.image || '/images/icons/logo.png'
            });
            // Optionally, show the cart sidebar
            document.getElementById('cartSidebar').classList.add('show');
        }

        if (target.closest('.quick-view-btn')) {
            renderQuickView(product);
            document.getElementById('quickViewModal').classList.add('show');
        }

        // Handle click on the card itself to navigate to the product detail page
        // This should be the last check to avoid overriding button clicks
        if (!target.closest('button') && !target.closest('a[href]')) {
            window.location.href = detailUrl;
        } else if (target.closest('a[href]')) {
            // Prevent the default link behavior to let the card click handler manage navigation
            e.preventDefault();
            window.location.href = detailUrl;
        }
    });
}

/**
 * Initializes the interactive Flavor Wheel.
 */
function initFlavorWheel() {
    const flavorChart = document.getElementById('flavorChart');
    if (!flavorChart) return;
    if (!window.productData || !window.productData.flavorProfiles) return;

    const flavorPoints = flavorChart.querySelectorAll('.flavor-point');
    const descriptionContainer = document.getElementById('flavorDescription');
    const recommendedList = document.getElementById('recommendedProducts');
    const flavorProfiles = window.productData.flavorProfiles;

    flavorPoints.forEach(point => {
        point.addEventListener('click', () => {
            const flavorKey = point.dataset.flavor;
            const profile = flavorProfiles[flavorKey];

            if (!profile) return;

            // Update active state
            flavorPoints.forEach(p => p.classList.remove('active'));
            point.classList.add('active');

            // Update description
            descriptionContainer.querySelector('h3').textContent = profile.title;
            descriptionContainer.querySelector('p').textContent = profile.description;

            // Update recommended products
            recommendedList.innerHTML = '';
            if (profile.products && profile.products.length > 0) {
                profile.products.forEach(productName => {
                    const product = window.productData.products.find(p => p.name === productName);
                    if (product) {
                        const li = document.createElement('li');
                        li.innerHTML = `<a href="pages/products.html?product=${product.id}">${product.name}</a>`;
                        recommendedList.appendChild(li);
                    }
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No specific products match this profile yet.';
                recommendedList.appendChild(li);
            }
        });
    });

    // Set an initial active state
    if (flavorPoints.length > 0) {
        flavorPoints[0].click();
    }
}

/**
 * Initializes all sidebars, modals, and pop-up overlays.
 */
function initOverlaysAndSidebars() {
    // Ensure backdrop and sidebars exist on pages that don't include them
    if (!document.getElementById('sidebarBackdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.id = 'sidebarBackdrop';
        document.body.appendChild(backdrop);
    }

    if (!document.getElementById('cartSidebar')) {
        const cartHTML = `
        <div class="cart-sidebar" id="cartSidebar">
            <div class="sidebar-header">
                <h3><i class="fas fa-shopping-cart"></i> Your Cart</h3>
                <button class="close-sidebar" id="closeCart"><i class="fas fa-times"></i></button>
            </div>
            <div id="cartItems" class="sidebar-content"></div>
            <div class="sidebar-footer">
                <div class="cart-total">Total: <span id="cartTotal">₹0.00</span></div>
                <a href="/pages/checkout.html" class="btn btn-primary btn-block" id="checkoutBtn">Proceed to Checkout</a>
            </div>
        </div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = cartHTML;
        document.body.appendChild(wrapper.firstElementChild);
    }

    if (!document.getElementById('wishlistSidebar')) {
        const wishHTML = `
        <div class="wishlist-sidebar" id="wishlistSidebar">
            <div class="wishlist-header">
                <h3><i class="far fa-heart"></i> Wishlist</h3>
                <button class="close-sidebar" id="closeWishlist"><i class="fas fa-times"></i></button>
            </div>
            <div id="wishlistItems" class="sidebar-content"></div>
        </div>`;
        const wwrap = document.createElement('div');
        wwrap.innerHTML = wishHTML;
        document.body.appendChild(wwrap.firstElementChild);
    }

    // --- Elements ---
    const cartBtn = document.getElementById('cartBtn');
    const mobileCartBtn = document.getElementById('mobileCartBtn');
    const mobileCartBtnPrimary = document.getElementById('mobileCartBtnPrimary');
    const mobileHomeCartBtn = document.getElementById('mobileHomeCartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCartBtn = document.getElementById('closeCart');

    const wishlistBtn = document.getElementById('wishlistBtn');
    const mobileWishlistBtn = document.getElementById('mobileWishlistBtn');
    const mobileWishlistBtnTop = document.getElementById('mobileWishlistBtnTop');
    const wishlistSidebar = document.getElementById('wishlistSidebar');
    const closeWishlistBtn = document.getElementById('closeWishlist');
    
    console.log('Cart initialization:', { cartBtn, mobileCartBtn, mobileCartBtnPrimary, mobileHomeCartBtn, cartSidebar, closeCartBtn });

    const quickViewModal = document.getElementById('quickViewModal');
    const quickViewContent = document.getElementById('quickViewContent');

    const body = document.body;

    // --- Generic Open/Close Logic ---
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    
    function openOverlay(overlay) {
        overlay.classList.add('show');
        if (sidebarBackdrop && (overlay === cartSidebar || overlay === wishlistSidebar)) {
            sidebarBackdrop.classList.add('show');
        }
        body.style.overflow = 'hidden';
    }

    function closeOverlay(overlay) {
        overlay.classList.remove('show');
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove('show');
        }
        body.style.overflow = '';
    }
    
    // Close sidebars when clicking on backdrop
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            if (cartSidebar && cartSidebar.classList.contains('show')) {
                closeOverlay(cartSidebar);
            }
            if (wishlistSidebar && wishlistSidebar.classList.contains('show')) {
                closeOverlay(wishlistSidebar);
            }
        });
    }

    // --- Cart Sidebar ---
    if (cartBtn && cartSidebar) {
        console.log('Attaching cart button listener');
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Cart button clicked!');
            if (window.cartManager) {
                window.cartManager.renderCartItems();
            }
            openOverlay(cartSidebar);
        });
    } else {
        console.error('Cart button or sidebar not found!', { cartBtn, cartSidebar });
    }

    const openCartHandler = (e) => {
        e.preventDefault();
        if (window.cartManager) {
            window.cartManager.renderCartItems();
        }
        openOverlay(cartSidebar);
    };

    if (mobileCartBtn && cartSidebar) {
        mobileCartBtn.addEventListener('click', openCartHandler);
    }
    if (mobileCartBtnPrimary && cartSidebar) {
        mobileCartBtnPrimary.addEventListener('click', openCartHandler);
    }
    if (mobileHomeCartBtn && cartSidebar) {
        mobileHomeCartBtn.addEventListener('click', openCartHandler);
    }
    if (closeCartBtn && cartSidebar) {
        closeCartBtn.addEventListener('click', () => closeOverlay(cartSidebar));
    }

    // --- Wishlist Sidebar ---
    const openWishlistHandler = (e) => {
        e.preventDefault();
        if (window.cartManager) {
            window.cartManager.renderWishlistItems();
        }
        openOverlay(wishlistSidebar);
    };
    if (wishlistBtn && wishlistSidebar) {
        wishlistBtn.addEventListener('click', openWishlistHandler);
    }
    if (mobileWishlistBtn && wishlistSidebar) {
        mobileWishlistBtn.addEventListener('click', openWishlistHandler);
    }
    if (mobileWishlistBtnTop && wishlistSidebar) {
        mobileWishlistBtnTop.addEventListener('click', openWishlistHandler);
    }
    if (closeWishlistBtn) {
        closeWishlistBtn.addEventListener('click', () => closeOverlay(wishlistSidebar));
    }

    // --- Quick View Modal ---
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.quick-view-btn')) {
            const productCard = e.target.closest('.product-card');
            const productId = parseInt(productCard.dataset.productId);
            const products = window.productData && window.productData.products;
            if (!Array.isArray(products)) return;
            const product = products.find(p => p.id === productId);
            if (product) {
                renderQuickView(product);
                openOverlay(quickViewModal);
            }
        }
    });

    if (quickViewModal) {
        quickViewModal.addEventListener('click', (e) => {
            // Close if clicking on the modal background itself
            if (e.target === quickViewModal) {
                closeOverlay(quickViewModal);
            }
        });
    }

    function renderQuickView(product) {
        if (!quickViewContent) return;
        quickViewContent.innerHTML = `
            <button class="close-modal" onclick="document.getElementById('quickViewModal').classList.remove('show'); document.body.style.overflow = '';">&times;</button>
            <div class="quick-view-layout">
                <div class="quick-view-image">
                    <img src="${product.image || '/images/icons/logo.png'}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <h2>${product.name}</h2>
                    <div class="product-rating">${window.utils.generateStarRating(product.rating)} (${product.reviews} reviews)</div>
                    <div class="product-price">${window.utils.formatPrice(product.price)}</div>
                    <p>${product.description}</p>
                    <div class="quick-view-actions">
                        <button class="btn btn-primary" onclick="window.location.href='${product.id === 27 ? 'pages/assorted-mini-box.html' : 'pages/product-detail.html?id=' + product.id}'">🛍️ Buy Now</button>
                        <a href="pages/products.html?product=${product.id}" class="btn btn-secondary">View Full Details</a>
                    </div>
                </div>
            </div>
        `;
    }

    // --- General Overlay Close ---
    // Close any open sidebar/modal with the Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openOverlay = document.querySelector('.cart-sidebar.show, .wishlist-sidebar.show, .modal.show');
            if (openOverlay) {
                closeOverlay(openOverlay);
            }
        }
    });
}

/**
 * Renders the content for the Quick View modal.
 * @param {object} product The product to display.
 */
function renderQuickView(product) {
    if (!window.utils) return;
    const quickViewContent = document.getElementById('quickViewContent');
    if (!quickViewContent) return;

    quickViewContent.innerHTML = `
        <button class="close-modal" aria-label="Close quick view">&times;</button>
        <div class="quick-view-layout">
            <div class="quick-view-image">
                <img src="${product.image || '/images/icons/logo.png'}" alt="${product.name}">
            </div>
            <div class="quick-view-details">
                <h2>${product.name}</h2>
                <div class="product-rating">${window.utils.generateStarRating(product.rating)} (${product.reviews} reviews)</div>
                <div class="product-price">${window.utils.formatPrice(product.price)}</div>
                <p>${product.description}</p>
                <div class="quick-view-actions">
                    <button class="btn btn-primary" onclick="window.location.href='${product.id === 27 ? 'pages/assorted-mini-box.html' : 'pages/product-detail.html?id=' + product.id}'">🛍️ Buy Now</button>
                    <a href="pages/products.html?product=${product.id}" class="btn btn-secondary">View Full Details</a>
                </div>
            </div>
        </div>
    `;

    // Add event listener for the new "Add to Cart" button inside the modal
    const addToCartBtn = quickViewContent.querySelector('.add-to-cart-quick-view');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            window.cartManager.addToCart({
                ...product,
                image: product.image || '/images/icons/logo.png'
            });
            window.utils.showNotification(`${product.name} added to cart!`, 'success');
        });
    }
}

/**
 * Generates the HTML for a single product card.
 * @param {object} product - The product data object.
 * @returns {string} - The HTML string for the product card.
 */
function createProductCardHTML(product) {
    if (!product) {
        console.error("createProductCardHTML called with invalid product");
        return '';
    }

    const price = window.utils.formatPrice(product.price);
    const ratingStars = window.utils.generateStarRating(product.rating);

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image || '/images/icons/logo.png'}" alt="${product.name}">
                <div class="product-actions overlay-left">
                    <button class="btn btn-primary buy-now-btn" data-id="${product.id}">
                        Buy Now
                    </button>
                </div>
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="product-rating">${ratingStars}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initializes the interactive Flavor Preference Quiz.
 */
function initFlavorQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;
    if (!window.productData || !Array.isArray(window.productData.products)) return;

    const steps = quizContainer.querySelectorAll('.quiz-step');
    const nextButtons = quizContainer.querySelectorAll('.quiz-next');
    const prevButtons = quizContainer.querySelectorAll('.quiz-prev');
    const getResultsBtn = document.getElementById('getResults');
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    const quizResultsContainer = document.getElementById('quizResults');
    const retakeQuizBtn = document.getElementById('retakeQuiz');
    const quizProgressText = document.getElementById('quizProgressText');
    const quizProgressFill = document.getElementById('quizProgressFill');
    const allProducts = window.productData.products;

    let currentStep = 1;
    const answers = {};

    const totalSteps = steps.length;

    function setEnabled(el, enabled) {
        if (!el) return;
        if ('disabled' in el) {
            el.disabled = !enabled;
        }
        el.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    function updateProgress() {
        if (quizProgressText) {
            quizProgressText.textContent = `Step ${currentStep} of ${totalSteps}`;
        }
        if (quizProgressFill) {
            const pct = Math.round((currentStep / totalSteps) * 100);
            quizProgressFill.style.width = `${pct}%`;
        }
    }

    function updateControlsForStep(stepNumber) {
        const stepEl = document.getElementById(`step${stepNumber}`);
        if (!stepEl) return;

        const nextBtn = stepEl.querySelector('.quiz-next');
        const hasRadioSelection = !!stepEl.querySelector('input[type="radio"]:checked');

        if (nextBtn) {
            setEnabled(nextBtn, hasRadioSelection);
        }

        if (stepNumber === 3 && getResultsBtn) {
            const hasOccasion = !!stepEl.querySelector('.quiz-option.selected');
            setEnabled(getResultsBtn, hasOccasion);
        }
    }

    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        const nextStepEl = document.getElementById(`step${stepNumber}`);
        if (nextStepEl) {
            nextStepEl.classList.add('active');
            currentStep = stepNumber;
            updateProgress();
            updateControlsForStep(stepNumber);
        }
    }

    // Make radio options show selected state and enable Next
    quizContainer.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
            const name = input.name;
            quizContainer.querySelectorAll(`input[name="${name}"]`).forEach(other => {
                const label = other.closest('label.quiz-option');
                if (label) label.classList.toggle('selected', other.checked);
            });
            updateControlsForStep(currentStep);
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const stepEl = e.target.closest('.quiz-step');
            const input = stepEl.querySelector('input[type="radio"]:checked');
            if (input) {
                answers[input.name] = input.value;
                const nextStep = parseInt(e.target.dataset.next);
                showStep(nextStep);
            } else {
                window.utils.showNotification('Please make a selection!', 'warning');
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const prevStep = parseInt(e.target.dataset.prev);
            showStep(prevStep);
        });
    });

    if (getResultsBtn) {
        getResultsBtn.addEventListener('click', () => {
        // For step 3, since it doesn't use radio buttons in the provided HTML
        const occasionOption = steps[2].querySelector('.quiz-option.selected'); // Assuming a 'selected' class is added on click
        if (occasionOption) {
             answers['occasion'] = occasionOption.dataset.value;
        } else {
            window.utils.showNotification('Please make a selection!', 'warning');
            return;
        }

        // Hide all steps and show results
        steps.forEach(step => step.classList.remove('active'));
        quizResultsContainer.style.display = 'block';

        generateRecommendations();
        });
    }

    // Add click handler for non-radio options like in step 3
    if (steps[2]) {
        steps[2].querySelectorAll('.quiz-option').forEach(option => {
            const select = () => {
                steps[2].querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                updateControlsForStep(3);
            };

            option.addEventListener('click', select);
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select();
                }
            });
        });
    }

    retakeQuizBtn.addEventListener('click', () => {
        quizResultsContainer.style.display = 'none';
        recommendationsGrid.innerHTML = '';
        Object.keys(answers).forEach(key => delete answers[key]);
        quizContainer.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
        quizContainer.querySelectorAll('label.quiz-option.selected').forEach(opt => opt.classList.remove('selected'));
        quizContainer.querySelectorAll('.quiz-option.selected').forEach(opt => opt.classList.remove('selected'));
        showStep(1);
    });

    // Initialize UI state
    updateProgress();
    updateControlsForStep(1);
    updateControlsForStep(2);
    updateControlsForStep(3);

    function generateRecommendations() {
        let recommended = allProducts.filter(p => p.category === 'dark');

        // 1. Filter by sweetness
        if (answers.sweetness === 'less-sweet') {
            recommended = recommended.filter(p => p.cocoaPercentage >= 75);
        } else if (answers.sweetness === 'moderate') {
            recommended = recommended.filter(p => p.cocoaPercentage >= 68 && p.cocoaPercentage < 75);
        } else if (answers.sweetness === 'sweet') {
            recommended = recommended.filter(p => p.cocoaPercentage < 68);
        }

        // 2. Filter by texture
        if (answers.texture === 'crunchy') {
            recommended = recommended.filter(p => p.ingredients.some(i => i.includes('nut') || i.includes('almond')));
        } else if (answers.texture === 'chewy') {
            recommended = recommended.filter(p => p.ingredients.some(i => i.includes('berry') || i.includes('cranberry')));
        } else { // smooth
            recommended = recommended.filter(p => !p.ingredients.some(i => i.includes('nut') || i.includes('berry')));
        }

        // Take top 3 or fill with bestsellers if results are too few
        if (recommended.length < 3) {
            const bestsellers = allProducts.filter(p => p.subcategory === 'bestseller');
            recommended = [...new Set([...recommended, ...bestsellers])]; // Combine and remove duplicates
        }

        const finalRecommendations = recommended.slice(0, 3);

        if (finalRecommendations.length > 0) {
            recommendationsGrid.innerHTML = finalRecommendations.map(p => createProductCardHTML(p)).join('');
        } else {
            recommendationsGrid.innerHTML = `<p>We couldn't find a perfect match, but we think you'll love our bestsellers!</p>` + allProducts.filter(p => p.subcategory === 'bestseller').slice(0,3).map(p => createProductCardHTML(p)).join('');
        }
    }
}

/**
 * Initializes the "Treat Yourself" card drawing generator.
 */
function initTreatYourself() {
    const spinBtn = document.getElementById('spinWheel');
    const drawContainer = document.getElementById('surpriseWheel');
    const resultContainer = document.getElementById('surpriseResult');
    const resultChocolateEl = document.getElementById('resultChocolate');
    const addSurpriseBtn = document.getElementById('addSurpriseToCart');

    if (!spinBtn || !drawContainer) return;
    if (!window.productData || !Array.isArray(window.productData.surpriseChocolates) || !Array.isArray(window.productData.products)) return;

    const chocolates = window.productData.surpriseChocolates;
    let selectedChocolate = null;
    let isSpinning = false;

    if (addSurpriseBtn) {
        addSurpriseBtn.disabled = true;
        addSurpriseBtn.setAttribute('aria-disabled', 'true');
    }

    // 1. Populate the cards (match CSS 3D structure)
    drawContainer.innerHTML = chocolates.map((_, index) => `
        <div class="draw-card" data-index="${index}" role="button" tabindex="0" aria-label="Mystery card ${index + 1}">
            <div class="card-inner">
                <div class="card-front"><i class="fas fa-question"></i></div>
                <div class="card-back"></div>
            </div>
        </div>
    `).join('');

    const cards = drawContainer.querySelectorAll('.draw-card');

    // 2. Spin button event listener
    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        resultContainer.hidden = true;
        spinBtn.setAttribute('aria-expanded', 'false');
        if (addSurpriseBtn) {
            addSurpriseBtn.disabled = true;
            addSurpriseBtn.setAttribute('aria-disabled', 'true');
        }

        // Reset cards
        cards.forEach(card => card.classList.remove('flipped'));

        isSpinning = true;
        // Animate card shuffle
        let shuffleCount = 0;
        const shuffleInterval = setInterval(() => {
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            randomCard.style.transform = 'scale(1.1)';
            setTimeout(() => {
                randomCard.style.transform = '';
            }, 100);
            shuffleCount++;
            if (shuffleCount >= 15) {
                clearInterval(shuffleInterval);
                pickWinner();
            }
        }, 150);
    });

    // 3. Pick a winner
    function pickWinner() {
        const winnerIndex = Math.floor(Math.random() * chocolates.length);
        selectedChocolate = chocolates[winnerIndex];
        const winnerCard = cards[winnerIndex];

        // Update the back of the winning card
        const cardBack = winnerCard.querySelector('.card-back');
        cardBack.innerHTML = `
            <div class="card-name">${selectedChocolate.name}</div>
        `;

        // Flip the winning card
        setTimeout(() => {
            winnerCard.classList.add('flipped');
            showResult();
        }, 500);
    }

    // 4. Show the result
    function showResult() {
        // Show the chosen chocolate with a simple detail link (no extra CTA stack)
        resultChocolateEl.innerHTML = `
            <div class="product-card" data-product-id="${selectedChocolate.id}">
                <div class="product-image">
                    <img src="${selectedChocolate.image || '/images/icons/logo.png'}" alt="${selectedChocolate.name}">
                </div>
                <div class="product-content">
                    <h3 class="product-title">${selectedChocolate.name}</h3>
                    <div class="product-actions">
                        <a class="btn btn-secondary" href="${selectedChocolate.id === 27 ? 'pages/assorted-mini-box.html' : 'pages/product-detail.html?id=' + selectedChocolate.id}">View Details</a>
                    </div>
                </div>
            </div>
        `;
        resultContainer.hidden = false;
        spinBtn.setAttribute('aria-expanded', 'true');
        if (addSurpriseBtn) {
            addSurpriseBtn.disabled = false;
            addSurpriseBtn.setAttribute('aria-disabled', 'false');
            addSurpriseBtn.focus();
        }
        isSpinning = false;
    }

    // 5. Add to cart from result
    if (addSurpriseBtn) {
        addSurpriseBtn.addEventListener('click', () => {
        if (selectedChocolate) {
            window.location.href = selectedChocolate.id === 27
                ? 'pages/assorted-mini-box.html'
                : `pages/product-detail.html?id=${selectedChocolate.id}`;
        }
        });
    }
}

/**
 * Initializes the phone-only bottom navigation and "More" drawer.
 * Safe on desktop: elements are hidden and/or absent.
 */
function initMobileBottomNav() {
    const moreBtn = document.getElementById('mobileMoreBtn');
    const drawer = document.getElementById('mobileMoreDrawer');
    const backdrop = document.getElementById('mobileMoreBackdrop');
    const closeBtn = document.getElementById('closeMobileMoreDrawer');

    if (!moreBtn || !drawer || !backdrop) return;

    const setBodyScrollLock = (locked) => {
        const hasSidebarOpen = document.querySelector('.cart-sidebar.show, .wishlist-sidebar.show, .modal.show');
        if (locked) {
            document.body.style.overflow = 'hidden';
            return;
        }
        if (hasSidebarOpen) return;
        document.body.style.overflow = '';
    };

    const open = () => {
        drawer.classList.add('show');
        backdrop.classList.add('show');
        moreBtn.setAttribute('aria-expanded', 'true');
        setBodyScrollLock(true);
    };

    const close = () => {
        drawer.classList.remove('show');
        backdrop.classList.remove('show');
        moreBtn.setAttribute('aria-expanded', 'false');
        setBodyScrollLock(false);
    };

    moreBtn.addEventListener('click', () => {
        if (drawer.classList.contains('show')) close();
        else open();
    });

    backdrop.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('show')) {
            close();
        }
    });
}

/**
 * Highlights the active tab in the phone bottom navigation.
 * Desktop-safe: elements are hidden/absent above 768px.
 */
function setMobileBottomNavActiveTab() {
    const nav = document.querySelector('.m-bottom-nav');
    if (!nav) return;

    const navItems = nav.querySelectorAll('.m-nav-item');
    if (!navItems.length) return;

    // Normalize current path for both /index.html and /pages/*.html
    const rawPath = (window.location.pathname || '').replace(/\\/g, '/');
    const path = rawPath.toLowerCase();

    const isHome = path === '/' || path.endsWith('/index.html');
    const isProducts = path.endsWith('/pages/products.html') || path.endsWith('/pages/product-detail.html') || path.endsWith('/products.html') || path.endsWith('/product-detail.html');
    const isCart = path.endsWith('/pages/cart.html') || path.endsWith('/pages/checkout.html') || path.endsWith('/cart.html') || path.endsWith('/checkout.html');
    const isAccount = path.endsWith('/pages/account.html') || path.endsWith('/pages/login.html') || path.endsWith('/pages/login-register.html') || path.endsWith('/account.html') || path.endsWith('/login.html') || path.endsWith('/login-register.html');

    let activeKey = 'more';
    if (isHome) activeKey = 'home';
    else if (isProducts) activeKey = 'shop';
    else if (isCart) activeKey = 'cart';
    else if (isAccount) activeKey = 'account';

    navItems.forEach(el => {
        el.classList.remove('is-active');
        el.removeAttribute('aria-current');
    });

    // Match by aria-label where possible (stable), otherwise fall back to IDs.
    const match = {
        home: nav.querySelector('.m-nav-item[aria-label="Home"]'),
        shop: nav.querySelector('.m-nav-item[aria-label="Shop"]'),
        account: nav.querySelector('.m-nav-item[aria-label="Account"]'),
        cart: nav.querySelector('#mobileCartBtnPrimary'),
        more: nav.querySelector('#mobileMoreBtn')
    };

    const activeEl = match[activeKey];
    if (!activeEl) return;

    activeEl.classList.add('is-active');
    // Only anchors should receive aria-current, but it's harmless on buttons.
    activeEl.setAttribute('aria-current', 'page');
}
