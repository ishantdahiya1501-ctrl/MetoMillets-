// Product Detail Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const productDetail = document.getElementById('productDetail');
    const descriptionContent = document.getElementById('descriptionContent');
    const nutritionContent = document.getElementById('nutritionContent');
    const reviewsContent = document.getElementById('reviewsContent');
    const similarProducts = document.getElementById('similarProducts');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Get product ID from URL query parameter
    function init() {
        addDetailStyles(); // Add custom styles for this page

        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));

        // Assorted Mini Box uses a dedicated special page
        if (productId === 27) {
            window.location.replace('assorted-mini-box.html');
            return;
        }

        if (!productId || !window.productData || !window.productData.products) {
            productDetail.innerHTML = '<p class="error-message">Could not load product data. Please try again later.</p>';
            return;
        }

        const product = window.productData.products.find(p => p.id === productId);
        if (!product) {
            productDetail.innerHTML = `<p class="error-message">Product with ID ${productId} not found.</p>`;
            return;
        }

        // Render all sections now that we have the product
        renderProductDetail(product);
        renderDescription(product);
        renderNutrition(product);
        renderReviews(product.id);
        renderSimilarProducts(product);
        setupEventListeners(product);
        setupSidebarHandlers();
    }

    // Setup sidebar handlers for cart and wishlist
    function setupSidebarHandlers() {
        const cartBtn = document.getElementById('cartBtn');
        const closeCart = document.getElementById('closeCart');
        const cartSidebar = document.getElementById('cartSidebar');
        const wishlistBtn = document.getElementById('wishlistBtn');
        const closeWishlist = document.getElementById('closeWishlist');
        const wishlistSidebar = document.getElementById('wishlistSidebar');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');

        if (cartBtn && cartSidebar) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                cartSidebar.classList.add('show');
                if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
                document.body.style.overflow = 'hidden';
                if (window.cartManager) window.cartManager.renderCartItems();
            });
        }

        if (closeCart && cartSidebar) {
            closeCart.addEventListener('click', () => {
                cartSidebar.classList.remove('show');
                if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
                document.body.style.overflow = '';
            });
        }

        if (wishlistBtn && wishlistSidebar) {
            wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                wishlistSidebar.classList.add('show');
                if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
                document.body.style.overflow = 'hidden';
                if (window.cartManager) window.cartManager.renderWishlistItems();
            });
        }

        if (closeWishlist && wishlistSidebar) {
            closeWishlist.addEventListener('click', () => {
                wishlistSidebar.classList.remove('show');
                if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
                document.body.style.overflow = '';
            });
        }

        // Close sidebars when clicking backdrop
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                if (cartSidebar && cartSidebar.classList.contains('show')) {
                    cartSidebar.classList.remove('show');
                }
                if (wishlistSidebar && wishlistSidebar.classList.contains('show')) {
                    wishlistSidebar.classList.remove('show');
                }
                sidebarBackdrop.classList.remove('show');
                document.body.style.overflow = '';
            });
        }
    }

    // Render main product details
    function renderProductDetail(product) {
        const starsHtml = '⭐'.repeat(Math.floor(product.rating));
        const partialStar = product.rating % 1 >= 0.5 ? '✨' : '';

        const displayName = String(product.name || '')
            .replace(/\b\d{1,3}%\b/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

        const isFixedPriceProduct = product && (
            product.priceFixed === true ||
            String(product.priceTier || '').toLowerCase() === 'fixed' ||
            String(product.category || '').toLowerCase() === 'gifts'
        );

        const priceTiers = {
            classic: { '15g': 30, '30g': 60, '80g': 160, '150g': 250 },
            flavoured: { '15g': 35, '30g': 75, '80g': 200, '150g': 375 }
        };

        const weightOptions = isFixedPriceProduct
            ? [{ weight: 'Box', price: Number(product.price) || 0 }]
            : (() => {
                const tierKey = String(product.priceTier || 'flavoured').toLowerCase();
                const tierPrices = priceTiers[tierKey] || priceTiers.flavoured;
                return Object.entries(tierPrices).map(([weight, price]) => ({ weight, price }));
            })();

        const imagesByWeight = (!isFixedPriceProduct && product && product.imagesByWeight && typeof product.imagesByWeight === 'object')
            ? product.imagesByWeight
            : null;

        const galleryItems = imagesByWeight
            ? weightOptions
                .map(o => ({ weight: o.weight, src: imagesByWeight[o.weight] }))
                .filter(i => !!i.src)
            : [];

        const fallbackImageSrc = '/images/icons/logo.png';

        let imageList = galleryItems.length
            ? galleryItems.map(i => encodeURI(i.src))
            : [product.image].filter(Boolean);

        if (!imageList.length) {
            imageList = [fallbackImageSrc];
        }

        const initialWeight = weightOptions[0]?.weight || '15g';
        const mainImageSrc = (imagesByWeight && imagesByWeight[initialWeight])
            ? encodeURI(imagesByWeight[initialWeight])
            : (imageList[0] || fallbackImageSrc);

        const thumbnailButtonsHtml = imageList.map((src, index) => {
            const weight = galleryItems[index]?.weight;
            return `
            <button
                type="button"
                class="thumb-btn ${index === 0 ? 'active' : ''}"
                data-src="${src}"
                ${weight ? `data-weight="${weight}"` : ''}
                aria-label="View image ${index + 1}">
                <img src="${src}" alt="${product.name} image ${index + 1}" loading="lazy">
            </button>`;
        }).join('');

        const weightButtonsHtml = isFixedPriceProduct
            ? ''
            : weightOptions.map((option, index) => `
                <button 
                    class="btn weight-btn ${index === 0 ? 'active' : ''}" 
                    data-weight="${option.weight}" 
                    data-price="${option.price}">
                    ${option.weight}
                </button>
            `).join('');

        productDetail.innerHTML = `
            <div class="product-header">
                <div class="product-image">
                    <div class="product-gallery">
                        <div class="product-main-image">
                            <img id="mainProductImage" src="${mainImageSrc}" alt="${product.name}">
                            <button
                                type="button"
                                class="gallery-next"
                                id="nextProductImageBtn"
                                aria-label="Next image"
                                ${imageList.length > 1 ? '' : 'disabled'}>
                                Next
                            </button>
                        </div>
                        ${imageList.length ? `<div class="product-thumbnails">${thumbnailButtonsHtml}</div>` : ''}
                    </div>
                </div>
                <div class="product-info-wrapper">
                    <div class="product-info">
                        <h1>${displayName}</h1>
                        <div class="product-rating">
                            <span class="stars">${starsHtml}${partialStar}</span>
                            <span class="review-count">${product.reviews} reviews</span> | 
                            <a href="reviews.html?product_id=${product.id}" class="write-review-link">Write a review</a>
                        </div>
    
                        <div class="product-meta-details">
                            ${product.temperatureWarning ? '<div class="meta-item temp-warning"><strong>⚠️ Temp Warning:</strong> Store in a cool place.</div>' : ''}
                        </div>
                    </div>
    
                    <div class="product-purchase-options">
                        <div class="product-price" id="productPrice">${window.utils.formatPrice(weightOptions[0]?.price || 0)}</div>
                        ${isFixedPriceProduct ? '' : `
                        <div class="option-group">
                            <label class="option-label">Select Weight:</label>
                            <div class="weight-selector">
                                ${weightButtonsHtml}
                            </div>
                        </div>
                        `}
    
                        <div class="product-actions">
                            <div class="qty-selector">
                                <button id="qtyMinus" aria-label="Decrease quantity">−</button>
                                <input id="qtyInput" type="number" value="1" min="1" max="100" aria-label="Quantity">
                                <button id="qtyPlus" aria-label="Increase quantity">+</button>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" id="addToCartBtn">
                            �️ Buy Now
                        </button>
                        <button class="btn btn-secondary btn-block" id="addToWishlistBtn">
                            <i class="far fa-heart"></i> Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function setupEventListeners(product) {
        // Image gallery
        const mainImg = document.getElementById('mainProductImage');
        const nextBtn = document.getElementById('nextProductImageBtn');
        const mainImageWrapper = mainImg ? mainImg.closest('.product-main-image') : null;

        const imagesByWeight = (product && product.imagesByWeight && typeof product.imagesByWeight === 'object')
            ? product.imagesByWeight
            : null;

        const imageList = imagesByWeight
            ? Object.values(imagesByWeight).map(src => encodeURI(src))
            : [product.image].filter(Boolean);

        const normalizeSrc = (src) => {
            try {
                return new URL(src, window.location.href).pathname;
            } catch {
                return String(src || '');
            }
        };

        const setActiveThumbnail = (src) => {
            const normalized = normalizeSrc(src);
            document.querySelectorAll('.thumb-btn').forEach(b => {
                const btnSrc = normalizeSrc(b.dataset.src);
                b.classList.toggle('active', btnSrc === normalized);
            });
        };

        if (mainImg) {
            document.querySelectorAll('.thumb-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const weight = btn.dataset.weight;
                    const newSrc = btn.dataset.src;
                    if (!newSrc) return;

                    // If thumbnail is tied to a weight, keep weight + price consistent.
                    if (weight) {
                        const weightBtn = document.querySelector(`.weight-btn[data-weight="${weight}"]`);
                        if (weightBtn) weightBtn.click();
                        return;
                    }

                    mainImg.src = newSrc;
                    setActiveThumbnail(newSrc);
                });
            });
        }

        // Lightbox zoom (Amazon-style): click main image to open overlay with hover zoom and next/prev controls
        const openLightbox = (startSrc) => {
            const normalizedList = imageList.map(normalizeSrc);
            let currentIndex = Math.max(0, normalizedList.indexOf(normalizeSrc(startSrc)));
            if (currentIndex === -1) currentIndex = 0;

            const existing = document.getElementById('imageLightbox');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'imageLightbox';
            overlay.innerHTML = `
                <div class="img-lightbox-backdrop"></div>
                <div class="img-lightbox-content">
                    <button class="img-lightbox-close" aria-label="Close">✕</button>
                    <div class="img-lightbox-main">
                        <img alt="Zoomed product image">
                    </div>
                    <div class="img-lightbox-controls">
                        <button class="img-lightbox-prev" aria-label="Previous">‹</button>
                        <span class="img-lightbox-count"></span>
                        <button class="img-lightbox-next" aria-label="Next">›</button>
                    </div>
                </div>
            `;

            const imgEl = overlay.querySelector('img');
            const countEl = overlay.querySelector('.img-lightbox-count');
            const closeEl = overlay.querySelector('.img-lightbox-close');
            const prevEl = overlay.querySelector('.img-lightbox-prev');
            const nextEl = overlay.querySelector('.img-lightbox-next');
            const backdrop = overlay.querySelector('.img-lightbox-backdrop');

            const setImage = (idx) => {
                const safeIdx = (idx + imageList.length) % imageList.length;
                currentIndex = safeIdx;
                imgEl.src = imageList[safeIdx];
                countEl.textContent = `${safeIdx + 1} / ${imageList.length}`;
            };

            const close = () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', onKeyDown);
                overlay.remove();
            };

            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    close();
                } else if (e.key === 'ArrowLeft') {
                    setImage(currentIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    setImage(currentIndex + 1);
                }
            };

            backdrop.addEventListener('click', close);
            closeEl.addEventListener('click', close);
            prevEl.addEventListener('click', (e) => { e.stopPropagation(); setImage(currentIndex - 1); });
            nextEl.addEventListener('click', (e) => { e.stopPropagation(); setImage(currentIndex + 1); });

            // Hover / move zoom effect
            let zoomed = true;
            const maxScale = 1.8;
            const updateZoomOrigin = (e) => {
                if (!zoomed) return;
                const rect = imgEl.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                imgEl.style.transformOrigin = `${x}% ${y}%`;
                imgEl.style.transform = `scale(${maxScale})`;
            };

            imgEl.addEventListener('mousemove', updateZoomOrigin);
            imgEl.addEventListener('mouseleave', () => {
                imgEl.style.transform = 'none';
            });
            imgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                zoomed = !zoomed;
                if (!zoomed) {
                    imgEl.style.transform = 'none';
                }
            });

            // Prevent backdrop scroll while open
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', onKeyDown);
            document.body.appendChild(overlay);
            setImage(currentIndex);
        };

        if (mainImg && mainImageWrapper) {
            mainImageWrapper.addEventListener('click', () => openLightbox(mainImg.src));
        }

        if (mainImg && nextBtn && imageList.length > 1) {
            nextBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                // If weight-based images exist, cycle weight options so price and image match.
                if (imagesByWeight) {
                    const weightBtns = Array.from(document.querySelectorAll('.weight-btn'));
                    const availableWeights = weightBtns
                        .map(b => b.dataset.weight)
                        .filter(w => !!imagesByWeight[w]);

                    if (availableWeights.length <= 1) return;

                    const active = document.querySelector('.weight-btn.active');
                    const currentWeight = active ? active.dataset.weight : availableWeights[0];
                    const currentIndex = Math.max(0, availableWeights.indexOf(currentWeight));
                    const nextIndex = (currentIndex + 1) % availableWeights.length;
                    const nextWeight = availableWeights[nextIndex];
                    const nextWeightBtn = document.querySelector(`.weight-btn[data-weight="${nextWeight}"]`);
                    if (nextWeightBtn) nextWeightBtn.click();
                    return;
                }

                const current = normalizeSrc(mainImg.src);
                const normalizedList = imageList.map(normalizeSrc);
                const currentIndex = Math.max(0, normalizedList.indexOf(current));
                const nextIndex = (currentIndex + 1) % normalizedList.length;
                const nextSrc = imageList[nextIndex];
                mainImg.src = nextSrc;
                setActiveThumbnail(nextSrc);
            });
        }

        // Weight selection logic
        const priceEl = document.getElementById('productPrice');
        document.querySelectorAll('.weight-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update price display
                const newPrice = parseFloat(btn.dataset.price);
                priceEl.textContent = window.utils.formatPrice(newPrice);

                // Update product image for selected weight
                if (imagesByWeight && mainImg) {
                    const weight = btn.dataset.weight;
                    const src = imagesByWeight[weight];
                    if (src) {
                        const encoded = encodeURI(src);
                        mainImg.src = encoded;
                        setActiveThumbnail(encoded);
                    }
                }
            });
        });

        // Quantity buttons
        const qtyInput = document.getElementById('qtyInput');
        document.getElementById('qtyMinus').addEventListener('click', () => {
            qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
        });
        document.getElementById('qtyPlus').addEventListener('click', () => {
            qtyInput.value = parseInt(qtyInput.value) + 1;
        });

        // Add to cart
        document.getElementById('addToCartBtn').addEventListener('click', () => {
            const activeWeightBtn = document.querySelector('.weight-btn.active');
            const selectedWeight = activeWeightBtn ? activeWeightBtn.dataset.weight : 'Box';
            const selectedPrice = activeWeightBtn ? parseFloat(activeWeightBtn.dataset.price) : (Number(product.price) || 0);
            const qty = parseInt(qtyInput.value) || 1;

            // Create a temporary product object with the selected variant details
            const productVariant = {
                ...product,
                id: `${product.id}-${selectedWeight}`, // Unique ID for the variant
                name: `${product.name} (${selectedWeight})`,
                price: selectedPrice,
                weight: selectedWeight,
                image: product.image || '/images/icons/logo.png'
            };

            if (window.cartManager) {
                window.cartManager.addToCart(productVariant, qty);
            }
        });

        // Add to wishlist
        document.getElementById('addToWishlistBtn').addEventListener('click', () => {
            if (window.cartManager) {
                window.cartManager.addToWishlist({
                    ...product,
                    image: product.image || '/images/icons/logo.png'
                });
            }
        });
    }

    // Render description tab
    function renderDescription(product) {
        const sanitizedDescription = String(product.description || '')
            .replace(/\b\d{1,3}%\s*(dark\s*)?chocolate\b/gi, 'dark chocolate')
            .replace(/\b\d{1,3}%\s*dark\b/gi, 'dark')
            .replace(/\b\d{1,3}%\b/g, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+([,.;:!?])/g, '$1')
            .trim();

        const pairingList = product.pairing ? product.pairing.map(p => `<li>${p}</li>`).join('') : '';
        const ingredientsList = product.ingredients
            ? product.ingredients
                .filter(i => !/%/.test(String(i)))
                .map(i => `<span style="display:inline-block;background:#e9e0da;padding:0.4rem 0.8rem;border-radius:20px;margin-right:0.5rem;margin-bottom:0.5rem">${i}</span>`)
                .join('')
            : '';

        descriptionContent.innerHTML = `
            <div>
                <h3 style="color: #3d2b2b; margin-bottom: 1rem;">About This Product</h3>
                <p>${sanitizedDescription}</p>

                <h3 style="color: #3d2b2b; margin-top: 2rem; margin-bottom: 1rem;">Ingredients</h3>
                <div>${ingredientsList}</div>

                <h3 style="color: #3d2b2b; margin-top: 2rem; margin-bottom: 1rem;">Perfect Pairings</h3>
                <ul style="list-style: none; padding: 0;">
                    ${pairingList}
                </ul>
            </div>
        `;
    }

    // Render nutrition tab
    function renderNutrition(product) {
        nutritionContent.innerHTML = `
            <h3 style="color: #3d2b2b; margin-bottom: 1rem;">Nutrition Information (Per 100g)</h3>
            <table class="nutrition-table">
                <tr>
                    <td>Energy</td>
                    <td>~540 kcal</td>
                </tr>
                <tr>
                    <td>Fat</td>
                    <td>~31g</td>
                </tr>
                <tr>
                    <td>Carbohydrates</td>
                    <td>~57g</td>
                </tr>
                <tr>
                    <td>Protein</td>
                    <td>~7g</td>
                </tr>
                <tr>
                    <td>Fiber</td>
                    <td>~9g</td>
                </tr>
                <tr>
                    <td>Ingredients</td>
                    <td>${product.ingredients.join(', ')}</td>
                </tr>
            </table>
        `;
    }


    // Render reviews tab
    function renderReviews(productId) {
        const container = document.getElementById('reviewsContent');
        if (!container) return;

        const allReviews = window.utils.loadFromLocalStorage('productReviews') || {};
        const productReviews = allReviews[productId] || [];

        let html = '';
        if (productReviews.length === 0) {
            html = `
                <div class="empty-state" style="text-align:center; padding: 2rem;">
                    <h3>Be the first to review this product!</h3>
                    <p>We'd love to hear your thoughts. Your feedback helps other chocolate lovers.</p>
                    <a href="reviews.html?product_id=${productId}" class="btn btn-primary" style="margin-top: 1rem;">Write a Review</a>
                </div>
            `;
        } else {
            html += '<h3 style="color: #3d2b2b; margin-bottom: 1rem;">Customer Reviews</h3>';
            productReviews.forEach(review => {
                html += `
                    <div class="review">
                        <div class="review-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 class="review-title" style="margin:0;">${review.title}</h4>
                            <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                        </div>
                        <small class="review-date" style="color: #666; margin-bottom: 0.5rem; display: block;">${review.date}</small>
                        <p class="review-text">${review.text}</p>
                    </div>
                `;
            });
            html += `<a href="reviews.html?product_id=${productId}" class="btn btn-secondary" style="margin-top: 1.5rem;">Write Your Own Review</a>`;
        }
        container.innerHTML = html;
    }

    // Render similar products
    function renderSimilarProducts(product) {
        const similar = window.productData.products
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 4);

        const html = similar.map(p => `
            <div class="similar-card" data-product-id="${p.id}">
                <img src="${p.image}" alt="${p.name}" class="similar-img">
                <div class="similar-info">
                    <div class="similar-name">${p.name}</div>
                    <button class="btn btn-primary btn-sm">View Details</button>
                </div>
            </div>
        `).join('');

        similarProducts.innerHTML = html || '<p>No similar products found.</p>';

        // Add event listeners to the new similar product cards
        document.querySelectorAll('.similar-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `product-detail.html?id=${card.dataset.productId}`;
            });
        });
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Initialize cart/wishlist handlers (same as main.js)
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const wishlistBtn = document.getElementById('wishlistBtn');
    const wishlistSidebar = document.getElementById('wishlistSidebar');
    const closeWishlist = document.getElementById('closeWishlist');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebar.classList.add('show');
            document.body.style.overflow = 'hidden';
            if (window.cartManager) window.cartManager.renderCartItems();
        });
    }

    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('show');
            document.body.style.overflow = 'auto';
        });
    }

    if (wishlistBtn && wishlistSidebar) {
        wishlistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            wishlistSidebar.classList.add('show');
            document.body.style.overflow = 'hidden';
            if (window.cartManager) window.cartManager.renderWishlistItems();
        });
    }

    if (closeWishlist && wishlistSidebar) {
        closeWishlist.addEventListener('click', () => {
            wishlistSidebar.classList.remove('show');
            document.body.style.overflow = 'auto';
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const cartCount = window.cartManager ? window.cartManager.getCartCount() : 0;
            if (cartCount > 0) {
                window.utils.showNotification('Proceeding to checkout!', 'info');
                if (cartSidebar) {
                    cartSidebar.classList.remove('show');
                    document.body.style.overflow = 'auto';
                }
                setTimeout(() => {
                    window.location.href = 'checkout.html';
                }, 400);
            } else {
                window.utils.showNotification('Your cart is empty!', 'warning');
            }
        });
    }

    // Set year
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    init(); // Start the page rendering process

    function addDetailStyles() {
        const styleId = 'product-detail-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Professional Layout & Styling for Product Detail Page */

            .product-header {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2rem;
            }

            @media (min-width: 768px) {
                .product-header {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 3rem;
                    align-items: flex-start;
                }
            }

            .product-info-wrapper {
                display: flex;
                flex-direction: column;
            }

            .product-gallery {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                align-items: center;
            }

            .product-image {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            /* Override generic product-card image rules so detail images are not cropped */
            .product-detail-container .product-header .product-image {
                height: auto !important;
                overflow: visible !important;
            }

            .product-detail-container .product-header .product-image img {
                width: auto !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: 620px !important;
                object-fit: contain !important;
                margin: 0 auto !important;
                display: block;
            }

            .product-main-image img {
                width: auto;
                max-width: 100%;
                height: auto;
                max-height: 620px;
                display: block;
                margin: 0 auto;
                border-radius: 12px;
                border: 1px solid #f0e9e2;
                background: var(--white);
                object-fit: contain;
                transition: transform 0.25s ease;
                cursor: zoom-in;
            }

            .product-main-image {
                position: relative;
                width: 100%;
                min-height: 260px;
                max-height: 540px;
                padding: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .gallery-next {
                position: absolute;
                right: 12px;
                bottom: 12px;
                padding: 0.5rem 0.9rem;
                border-radius: 999px;
                border: 1px solid #f0e9e2;
                background: var(--gold);
                color: var(--white);
                font-weight: 700;
                cursor: pointer;
                z-index: 2;
            }

            .gallery-next:hover {
                border-color: var(--gold);
            }

            .gallery-next:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }


            .product-thumbnails {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .thumb-btn {
                width: 64px;
                height: 64px;
                padding: 4px;
                border-radius: 10px;
                border: 2px solid var(--medium-gray);
                background: var(--white);
                cursor: pointer;
                overflow: hidden;
            }

            .thumb-btn.active {
                border-color: var(--gold);
            }

            .thumb-btn img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
            }

            @media (min-width: 992px) {
                .product-info-wrapper {
                    flex-direction: row;
                    gap: 2rem;
                }
            }

            /* Fix for overlapping content and better spacing */
            .product-info {
                display: flex;
                flex-direction: column;
            }

            .product-description {
                font-size: 1.1rem; /* Bigger text */
                color: #3d2b2b; /* Darker text color */
                font-size: 1.15rem; /* Bigger text */
                color: #332424; /* Darker text color */
                line-height: 1.7;
                margin-bottom: 1.5rem;
            }

            .product-purchase-options {
                margin-top: 1rem;
                padding: 1rem;
                background-color: #fdf9f6; /* A very light background */
                border-radius: 12px;
                border: 1px solid #f0e9e2;
                flex-shrink: 0; /* Prevent shrinking */
            }

            @media (min-width: 992px) {
                .product-purchase-options {
                    width: 300px; /* Fixed width for the purchase column */
                    padding: 1.5rem;
                    height: fit-content; /* Make it only as tall as its content */
                }
            }

            .option-group {
                margin-bottom: 1.5rem;
            }

            .option-label {
                display: block;
                font-weight: 600;
                color: var(--dark-chocolate);
                margin-bottom: 0.75rem;
            }

            .weight-selector {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
            }

            .weight-btn {
                background-color: var(--white);
                border: 2px solid var(--medium-gray);
                transition: all 0.3s ease;
            }

            .weight-btn.active {
                background-color: var(--gold);
                color: var(--white);
                border-color: var(--gold);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }

            .product-meta-details {
                margin-top: 2rem; /* Ensure it's below the purchase box */
            }

            .write-review-link {
                margin-left: 0.5rem;
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--gold);
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: all 0.3s ease;
            }

            .write-review-link:hover {
                color: var(--dark-chocolate);
                border-bottom-color: var(--dark-chocolate);
            }

            /* Lightbox overlay */
            #imageLightbox {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: grid;
                place-items: center;
                pointer-events: none;
            }

            .img-lightbox-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(2px);
                pointer-events: auto;
            }

            .img-lightbox-content {
                position: relative;
                background: #0b0b0b;
                border-radius: 16px;
                padding: 1.25rem;
                width: min(90vw, 1200px);
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                box-shadow: 0 16px 40px rgba(0,0,0,0.35);
                pointer-events: auto;
            }

            .img-lightbox-main {
                position: relative;
                flex: 1;
                display: grid;
                place-items: center;
                overflow: hidden;
                border-radius: 12px;
                background: #111;
            }

            .img-lightbox-main img {
                position: relative;
                z-index: 1;
                max-width: 100%;
                max-height: 80vh;
                object-fit: contain;
                transition: transform 0.2s ease, transform-origin 0.1s ease;
                cursor: zoom-in;
            }

            .img-lightbox-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255,255,255,0.12);
                color: #fff;
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                transition: background 0.2s ease;
                z-index: 3;
            }

            .img-lightbox-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .img-lightbox-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                color: #f7f2ec;
                font-weight: 600;
            }

            .img-lightbox-prev,
            .img-lightbox-next {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                border: none;
                background: #f7c873;
                color: #3d2b2b;
                font-size: 22px;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .img-lightbox-prev:hover,
            .img-lightbox-next:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 18px rgba(0,0,0,0.25);
            }

            .img-lightbox-count {
                min-width: 80px;
                text-align: center;
                color: #f7f2ec;
            }

            @media (max-width: 640px) {
                .img-lightbox-content {
                    width: 95vw;
                    padding: 1rem;
                }

                .img-lightbox-prev,
                .img-lightbox-next {
                    width: 38px;
                    height: 38px;
                }
            }
        `;
        document.head.appendChild(style);
    }
});
