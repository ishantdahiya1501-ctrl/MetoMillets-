const serviceId="service_d9vke5o",templateId="template_i17u7ck",userId="Tvwaw5vFMMXDUl7-Z",myEmail="metomillets@gmail.com";const DEBUG_EMAILJS = (typeof localStorage !== 'undefined' && localStorage.getItem && localStorage.getItem('mtm_emailjs_debug') === '1');document.addEventListener("DOMContentLoaded",()=>{if(window.emailjs&&"function"==typeof window.emailjs.init)try{emailjs.init(userId)}catch(t){console.warn("EmailJS init failed:",t)}

  // Global error UI helpers
  const showErrorBanner = (msg) => {
    try {
      const el = document.getElementById('globalError');
      const msgEl = document.getElementById('globalErrorMsg');
      if (!el || !msgEl) return;
      msgEl.textContent = String(msg || 'An error occurred');
      el.style.display = 'block';
      el.setAttribute('aria-hidden', 'false');
      // auto-hide after 10s
      clearTimeout(window._globalErrorTimeout);
      window._globalErrorTimeout = setTimeout(() => {
        el.style.display = 'none'; el.setAttribute('aria-hidden', 'true');
      }, 10000);
    } catch (err) { console.error('showErrorBanner failed', err); }
  };
  const clearErrorBanner = () => {
    try { const el = document.getElementById('globalError'); if (!el) return; el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); } catch (err) { }
  };
  window.showError = showErrorBanner;
  window.clearError = clearErrorBanner;
  document.getElementById('globalErrorClose')?.addEventListener('click', () => clearErrorBanner());
  window.addEventListener('error', (ev) => { console.error('Global error', ev.error || ev.message); showErrorBanner(ev.error?.message || ev.message || 'Unexpected error'); });
  window.addEventListener('unhandledrejection', (ev) => { console.error('Unhandled promise rejection', ev.reason); showErrorBanner(ev.reason && (ev.reason.message || String(ev.reason)) || 'Unexpected async error'); });

  // Prevent accidental form submits that cause page reloads
  try {
    const checkoutFormEl = document.getElementById('checkoutForm');
    if (checkoutFormEl) {
      checkoutFormEl.addEventListener('submit', (ev) => {
        ev.preventDefault();
        console.warn('Prevented unexpected checkout form submit');
        window.showError && window.showError('Unexpected form submission prevented');
      });
    }
  } catch (err) { console.error('Failed to bind submit prevention', err); }

  // Track beforeunload / visibilitychange to help diagnose unexpected reloads
  window.addEventListener('beforeunload', () => {
    try {
      const note = {
        ts: Date.now(),
        razorpayOpenAt: window._razorpayOpenedAt || null,
        razorpayDismissedAt: window._razorpayDismissedAt || null,
        activeElement: (document.activeElement && document.activeElement.id) || (document.activeElement && document.activeElement.tagName) || null,
        stack: (new Error()).stack || null
      };
      localStorage.setItem('mtm_last_unload', JSON.stringify(note));
      localStorage.setItem('mtm_last_unload_stack', (note.stack || '').substring(0, 3000));
    } catch (e) {}
  });

  window.addEventListener('visibilitychange', () => {
    try {
      if (document.visibilityState === 'hidden') {
        const vnote = { ts: Date.now(), state: 'hidden', razorpayOpenAt: window._razorpayOpenedAt || null };
        localStorage.setItem('mtm_visibility_last', JSON.stringify(vnote));
      } else {
        const vnote = { ts: Date.now(), state: 'visible' };
        localStorage.setItem('mtm_visibility_last_visible', JSON.stringify(vnote));
      }
    } catch (e) {}
  });

  const t=t=>document.getElementById(t),e=window.utils.formatPrice,n=t("checkoutForm"),i=t("previewPanel"),o=t("previewContent"),r=t("previewOrderBtn"),a=t("editOrderBtn"),d=t("sendOrderBtn"),s=t("resultPanel"),l=t("resultMessage"),c=t("retryActions"),p=t("retryBtn"),u=t("cancelBtn"),m=t("spinner"),g=t("orderSummary"),h=t("subtotal"),b=t("shipping"),y=t("tax"),f=t("grandTotal");let v=0;const x={WELCOME10:.1,CHOCO15:.15,SUMMER20:.2};
    // Allow overriding backend during HTTPS tunnel testing (set in browser):
    // localStorage.setItem('BACKEND_API_BASE', 'https://<your-backend-tunnel>.ngrok.io')
    const _overrideApi = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('BACKEND_API_BASE') : null;
    const API_BASE = _overrideApi || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? `${location.protocol}//${location.hostname}:8080` : '');
    // Merge local referral promos if present
    try{
        const localPromos = window.utils.loadFromLocalStorage('referralPromos') || {};
        Object.keys(localPromos).forEach(k=>{ if(typeof localPromos[k] === 'string') localPromos[k] = parseFloat(localPromos[k]); });
        Object.assign(x, localPromos);
        // Automatic apply of stored referral codes removed to avoid unexpected behavior
    }catch(e){console.warn('Failed to load local promos', e);}    

    // Remove legacy autoReferralCode (cleanup)
    try{ if (localStorage.getItem('autoReferralCode')) { console.info('Removing legacy autoReferralCode'); localStorage.removeItem('autoReferralCode'); } }catch(e){}

    // Payment instrumentation helper
    function pushPaymentEvent(evt){
      try{
        const raw = localStorage.getItem('mtm_payment_events') || '[]';
        const arr = JSON.parse(raw);
        arr.push(Object.assign({ ts: Date.now() }, evt));
        localStorage.setItem('mtm_payment_events', JSON.stringify(arr));
      }catch(e){ console.warn('pushPaymentEvent failed', e); }
    }

    // Capture-phase guard: intercept clicks on Pay button EARLY to prevent navigation
    try{
      let _navBlockersEnabled = false;
      let _origReload = window.location.reload.bind(window.location);
      let _origAssign = window.location.assign.bind(window.location);

      function enableNavigationBlockers(){
        if (_navBlockersEnabled) return; _navBlockersEnabled = true;
        try{
          window.location.reload = function(){ try{ pushPaymentEvent({ stage: 'reload_blocked', stack: (new Error()).stack }); }catch(e){} console.warn('Blocked location.reload during payment'); };
          window.location.assign = function(url){ try{ pushPaymentEvent({ stage: 'assign_blocked', url, stack: (new Error()).stack }); }catch(e){} console.warn('Blocked location.assign during payment'); };
          window.addEventListener('keydown', _blockReloadKey, true);
        }catch(e){console.warn('enableNavigationBlockers failed', e);}      }

      function disableNavigationBlockers(){
        if (!_navBlockersEnabled) return; _navBlockersEnabled = false;
        try{
          try{ window.location.reload = _origReload; }catch(e){}
          try{ window.location.assign = _origAssign; }catch(e){}
          window.removeEventListener('keydown', _blockReloadKey, true);
        }catch(e){console.warn('disableNavigationBlockers failed', e);}      }

      function _blockReloadKey(ev){
        try{
          const isReload = (ev.key === 'F5') || ((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase() === 'r');
          if (isReload && window._paymentInProgress){
            ev.preventDefault(); ev.stopImmediatePropagation();
            try{ pushPaymentEvent({ stage: 'key_reload_blocked', key: ev.key, stack: (new Error()).stack }); }catch(e){}
            console.warn('Blocked reload key during payment');
          }
        }catch(e){}
      }

      document.addEventListener('click', (ev) => {
        try{
          const btn = ev.target && ev.target.closest ? ev.target.closest('#sendOrderBtn') : null;
          if (btn) {
            // Only log capture — do not set navigation blockers yet to avoid showing the beforeunload dialog prematurely.
            try { pushPaymentEvent({ stage: 'send_btn_capture' }); } catch(e){}
            return; // let event continue to target handlers
          }

          // If an anchor/link was clicked while a payment is in progress, block navigation here.
          const anchor = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
          if (anchor && window._paymentInProgress) {
            ev.preventDefault();
            ev.stopPropagation && ev.stopPropagation();
            console.warn('Blocked anchor navigation while payment is in progress');
            return;
          }
        }catch(e){}
      }, true);
    }catch(e){}

    // Global beforeunload guard: block navigation while a payment is in progress
    try{
      window.addEventListener('beforeunload', (e) => {
        try{
          if (window._paymentInProgress) { e.preventDefault(); e.returnValue = ''; }
        }catch(err){}
      });
    }catch(e){}

    // Optional debug flag for additional diagnostics
    try{
      if (localStorage.getItem('mtm_debug_block_unload') === '1'){
        console.info('mtm_debug_block_unload enabled — blocking unloads while payment is in progress');
      }
    }catch(e){}
    let w=!1;function $(){return window.cartManager&&Array.isArray(window.cartManager.cart)?window.cartManager.cart:window.utils.loadFromLocalStorage("meToMilletsCart")||[]}function C(t){const e=t.reduce((t,e)=>t+(e.price||0)*(e.quantity||1),0),n=e>=299||0===e?0:80,i=e+n,o=+(i*v).toFixed(2);return{subtotal:e,shipping:n,discount:o,taxBefore:0,total:+(i-o).toFixed(2)}}function E(){
  // Ensure order summary element exists
  if (!g) { console.warn('orderSummary element not found'); return; }
  const attemptFetchCart = () => {
    let cart = $();
    // Try alternate localStorage keys if empty
    if ((!cart || cart.length === 0) && window.utils && window.utils.loadFromLocalStorage) {
      const altKeys = ['mtm_cart', 'cart', 'shoppingCart'];
      for (const k of altKeys) {
        try {
          const alt = window.utils.loadFromLocalStorage(k);
          if (Array.isArray(alt) && alt.length > 0) { cart = alt; console.info('Found cart under', k); break; }
        } catch (err) { /* ignore */ }
      }
    }
    return cart || [];
  };

  const t = attemptFetchCart();
  console.log('checkout E() cart:', t);

  g.innerHTML = "";
  const n = document.getElementById("discountRow");
  if (n && n.remove()) {/* removed old discount row */}

  if (!t || t.length === 0) {
    g.innerHTML = '<div class="empty">Your cart is empty</div>';
    h.textContent = e(0);
    b.textContent = e(0);
    if (y) y.textContent = e(0);
    (function(){const _p = document.getElementById('payAmount'); if (_p) _p.textContent = '__';})();
    f.textContent = e(0);
    return;
  }

  // Normal render
for (const item of t) {
  const row = document.createElement("div");
  row.className = "order-item";

  const img = document.createElement("img");
  img.src = item.image || "images/products/default.png";
  img.alt = item.name || "";

  const meta = document.createElement("div");
  meta.className = "meta";

  const nameDiv = document.createElement("div");
  nameDiv.className = "name";
  nameDiv.textContent = item.name;

  const qtyPrice = document.createElement("div");
  qtyPrice.className = "qtyPrice";
  qtyPrice.textContent = `${item.quantity} × ${e(item.price)}`;

  meta.appendChild(nameDiv);
  meta.appendChild(qtyPrice);

  const line = document.createElement("div");
  line.className = "line";
  line.textContent = e((item.price || 0) * (item.quantity || 1));

  row.appendChild(img);
  row.appendChild(meta);
  row.appendChild(line);

  g.appendChild(row);
}

  const i = C(t);
  h.textContent = e(i.subtotal);
  b.textContent = (0 === i.shipping) ? "Free" : e(i.shipping);
  if (y) y.textContent = e(i.taxBefore);

  if (v > 0) {
    const disc = document.createElement("div");
    disc.id = "discountRow";
    disc.style.cssText = "display:flex;justify-content:space-between;color:#d4af37;font-weight:700;margin-top:0.5rem";
    disc.innerHTML = `<span>Discount (-${(100*v).toFixed(0)}%)</span><span>-${e(i.discount)}</span>`;
    if (f && f.parentElement) f.parentElement.insertBefore(disc, f.parentElement.lastChild);
  }

  f.textContent = e(i.total);
  (function(){const _p=document.getElementById('payAmount');if(_p)_p.textContent=i.total?e(i.total):'__';})();

;(function(t){
  try {
    if (w) return;
    if (!t || typeof t !== 'object') return;
    if (!(t.subtotal > 0 && t.shipping > 0)) return;
    w = true;

    const overlay = document.createElement('div');
    overlay.className = 'startup-notice-overlay';
    overlay.id = 'deliveryChargeOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Delivery Charges Notice');

    overlay.innerHTML = '\n      <div class="startup-notice-modal" role="document">\n        <button class="startup-notice-close" type="button" aria-label="Close notice">&times;</button>\n        <h3 class="startup-notice-title">Delivery Charges</h3>\n        <p class="startup-notice-text">There are delivery charges for orders less than ₹299.</p>\n        <div class="preview-actions" style="justify-content: space-between;">\n          <button type="button" class="btn btn-secondary" id="addMoreItemsBtn">Add More Items</button>\n          <button type="button" class="btn btn-primary" id="continueCheckoutBtn">Continue</button>\n        </div>\n      </div>\n    ';

    document.body.appendChild(overlay);
    const removeOverlay = () => overlay.remove();
    overlay.querySelector('.startup-notice-close')?.addEventListener('click', removeOverlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) removeOverlay(); });
    document.getElementById('addMoreItemsBtn')?.addEventListener('click', () => { window.location.href = 'products.html'; });
    document.getElementById('continueCheckoutBtn')?.addEventListener('click', removeOverlay);
  } catch (err) {
    console.error('Delivery notice render failed', err);
  }
})(i)}function S(){return{fullName:t("fullName").value.trim(),email:t("email").value.trim(),phone:t("phone").value.trim(),shippingAddress:t("shippingAddress").value.trim(),instructions:t("instructions").value.trim()}}function M(t){return t.fullName?t.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)?t.phone?t.shippingAddress?null:"Shipping address is required.":"Phone number is required.":"A valid email is required.":"Full name is required."}function k(t){return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function I(t,n,i){const o=`ORD-${Date.now()}`,r=(new Date).toLocaleString(),a=n.map(t=>{const n=(t.price||0)*(t.quantity||1);return`\n        <tr style="border-bottom:1px solid #e9e0da">\n          <td style="padding:12px;text-align:center;color:#3d2b2b"><strong>${t.quantity}</strong></td>\n          <td style="padding:12px;color:#3d2b2b">${k(t.name)}</td>\n          <td style="padding:12px;text-align:right;color:#3d2b2b">${e(t.price||0)}</td>\n          <td style="padding:12px;text-align:right;color:#3d2b2b;font-weight:700">${e(n)}</td>\n        </tr>\n      `}).join("");return`\n      <div style="font-family:'Arial', sans-serif;color:#2b1f1f;background:#f5f0eb;padding:20px;margin:0">\n        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">\n          <div style="background:linear-gradient(135deg,#3d2b2b,#5a3a39);color:#fff;padding:24px 20px;text-align:center">\n            <h1 style="margin:0;font-size:28px;font-weight:700">Order Confirmation</h1>\n            <p style="margin:6px 0 0 0;color:#f6e7a9;font-size:14px">Me To Millets — Handcrafted Chocolates</p>\n          </div>\n\n          <div style="background:#f8f3ee;padding:14px 20px;border-bottom:2px solid #e9e0da;display:flex;justify-content:space-between;align-items:center">\n            <div><strong style="color:#3d2b2b">Order ID:</strong> <span style="color:#6b4d3a">${o}</span></div>\n            <div><strong style="color:#3d2b2b">Date:</strong> <span style="color:#6b4d3a">${r}</span></div>\n          </div>\n\n          <div style="padding:24px 20px">\n            <div style="margin-bottom:24px">\n              <h3 style="margin:0 0 12px 0;color:#3d2b2b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:8px">Delivery To</h3>\n              <div style="color:#3d2b2b;line-height:1.8">\n                <strong>${k(t.fullName)}</strong><br>\n                ${k(t.phone)}<br>\n                ${k(t.email)}<br>\n                <div style="margin-top:8px;color:#6b4d3a">${k(t.shippingAddress).replace(/\n/g,"<br>")}</div>\n              </div>\n            </div>\n\n            <div style="margin-bottom:24px">\n              <h3 style="margin:0 0 12px 0;color:#3d2b2b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:8px">Order Items</h3>\n              <table style="width:100%;border-collapse:collapse;margin-bottom:12px">\n                <thead>\n                  <tr style="background:#f8f3ee;border-bottom:2px solid #e9e0da">\n                    <th style="padding:10px;text-align:center;color:#3d2b2b;font-weight:700">Qty</th>\n                    <th style="padding:10px;text-align:left;color:#3d2b2b;font-weight:700">Product</th>\n                    <th style="padding:10px;text-align:right;color:#3d2b2b;font-weight:700">Price</th>\n                    <th style="padding:10px;text-align:right;color:#3d2b2b;font-weight:700">Total</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  ${a}\n                </tbody>\n              </table>\n            </div>\n\n            ${t.instructions?`\n              <div style="margin-bottom:24px;background:#f8f3ee;padding:12px;border-radius:6px;border-left:4px solid #d4af37">\n                <strong style="color:#3d2b2b">Special Instructions:</strong><br>\n                <span style="color:#6b4d3a">${k(t.instructions)}</span>\n              </div>\n            `:""}\n\n            <div style="background:#f8f3ee;padding:16px;border-radius:8px;margin-top:20px">\n              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e9e0da">\n                <span style="color:#3d2b2b">Subtotal</span>\n                <span style="color:#3d2b2b">${e(i.subtotal)}</span>\n              </div>\n              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e9e0da">\n                <span style="color:#3d2b2b">Shipping</span>\n                <span style="color:#3d2b2b">${0===i.shipping?"Free":e(i.shipping)}</span>\n              </div>\n              <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:8px;border-top:2px solid #d4af37;font-weight:700;font-size:18px;color:#3d2b2b">\n                <span>Grand Total</span>\n                <span style="color:#d4af37">${e(i.total)}</span>\n              </div>\n            </div>\n\n            <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e9e0da;text-align:center;color:#6b4d3a;font-size:13px">\n              <p style="margin:0 0 8px 0">Thank you for your order! We'll be in touch soon with shipping details.</p>\n              <p style="margin:0">Questions? Reply to this email or contact us anytime.</p>\n            </div>\n          </div>\n\n          <div style="background:#3d2b2b;color:#fff;padding:16px 20px;text-align:center;font-size:12px">\n            <p style="margin:0">© ${(new Date).getFullYear()} Me To Millets — Handcrafted Chocolates</p>\n            <p style="margin:6px 0 0 0;color:#f6e7a9">metomillets.me</p>\n          </div>\n        </div>\n      </div>\n    `}function D(t){m.hidden=!t,m.setAttribute("aria-hidden",(!t).toString())}function T(t,e){s.hidden=!1,l.innerHTML=t,l.style.color=e?"var(--error)":"var(--success)"}if (r) { r.addEventListener("click",t=>{ try { t.preventDefault();const n=S(),r=M(n);if(r){ window.showError && window.showError(r); return; }const a=$();if(a&&0!==a.length)try{const t=C(a);o.innerHTML = function(customer, items, totals){
      return `
        <div class="preview-card">
          <div class="preview-card-header">
            <div class="preview-card-title">Order Preview</div>
            <div class="preview-card-total">${e(totals.total)}</div>
          </div>

          <div class="preview-customer">
            <strong class="pc-name">${k(customer.fullName)}</strong>
            <div class="pc-contact">${k(customer.email)} • ${k(customer.phone)}</div>
            <div class="pc-address">${k(customer.shippingAddress).replace(/\n/g,"<br>")}</div>
            ${customer.instructions?`<div class="pc-notes">Notes: ${k(customer.instructions)}</div>`:""}
          </div>

          <div class="preview-items">
            ${items.map(it=>`
              <div class="order-item">
                <img src="${it.image || 'https://via.placeholder.com/70'}" alt="${k(it.name)}">
                <div class="meta">
                  <div class="name">${k(it.name)}</div>
                  ${it.weight?`<div class="variant">${k(it.weight)}</div>`: ''}
                  <div class="qtyPrice">${it.quantity} × ${e(it.price)}</div>
                </div>
                <div class="line">${e((it.price||0)*(it.quantity||1))}</div>
              </div>
            `).join('')}
          </div>

          <div class="summary-totals preview-summary">
            <div class="summary-row"><span>Subtotal</span><span>${e(totals.subtotal)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>${0===totals.shipping? 'Free' : e(totals.shipping)}</span></div>
            ${totals.discount>0?`<div class="summary-row"><span>Discount</span><span>- ${e(totals.discount)}</span></div>` : ''}
            <div class="summary-row total"><span>Grand Total</span><span>${e(totals.total)}</span></div>
          </div>
        </div>
      `
    }(n,a,t), i.hidden = !1;
            // Scroll to payment button (prefer center); fallback to top
            const payBtnEl = document.getElementById('sendOrderBtn');
            if (payBtnEl && typeof payBtnEl.scrollIntoView === 'function') {
              payBtnEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }


          } catch (t) { console.error("Preview error:", t); window.showError && window.showError('Error generating preview. Please try again.'); } else window.showError && window.showError('Your cart is empty. Please add items before preview.') } catch (err) { console.error('Preview handler error', err); window.showError && window.showError('Preview failed: ' + (err && err.message || String(err))); } }); } a.addEventListener("click",()=>{i.hidden=!0,s.hidden=!0});

const processSend = async (customer, cart, totals) => {
  D(!0);
  d.disabled = true;
  try {
    await (async function(t,n,i){
      const o = n.map(t=>`${t.name} - Qty: ${t.quantity} x ${e(t.price)} = ${e((t.price||0)*(t.quantity||1))}`).join("\n"),
        r = `\nNEW ORDER RECEIVED\n\nORDER ID: ORD-${Date.now()}\nORDER DATE: ${(new Date).toLocaleString()}\n\nCUSTOMER INFORMATION:\nName: ${t.fullName}\nEmail: ${t.email}\nPhone: ${t.phone}\nAddress: ${t.shippingAddress}\n${t.instructions?`Special Instructions: ${t.instructions}`:""}\n\nORDER ITEMS:\n${o}\n\nORDER SUMMARY:\nSubtotal: ${e(i.subtotal)}\nShipping: ${0===i.shipping?"Free":e(i.shipping)}\nGRAND TOTAL: ${e(i.total)}\n\n---\nThis is an automated order notification from Me To Millets.\n    `.trim(),
        a = { to_email: myEmail, from_name: t.fullName, from_email: t.email, customer_name: t.fullName, customer_email: t.email, customer_phone: t.phone, shipping_address: t.shippingAddress, order_items: o, order_total: e(i.total), message: r, html_message: I(t,n,i) };
      if (!window.emailjs || typeof window.emailjs.send !== 'function') throw new Error("EmailJS SDK not available. Check your network or include the EmailJS script.");
      return emailjs.send(serviceId, templateId, a)
        .then(res => {
          console.info('EMAILJS SEND OK', res, 'params', a);
          if (DEBUG_EMAILJS) {
            try { T(`<strong>EmailJS response:</strong><pre style="white-space:pre-wrap;max-height:160px;overflow:auto">${k(JSON.stringify(res))}</pre>`, false); } catch(e){}
          }
          try {
            emailjs.send(serviceId, templateId, Object.assign({}, a, { to_email: 'metomillets@gmail.com' }))
              .then(ownerRes => { if (DEBUG_EMAILJS) console.info('Owner copy response', ownerRes); })
              .catch(ownerErr => { console.warn('Owner copy err', ownerErr); if (DEBUG_EMAILJS) { try { T(`<strong>Owner copy error:</strong><div>${k(String(ownerErr && (ownerErr.text || ownerErr.message) || ownerErr))}</div>`, true); } catch(e){} } });
          } catch (err) { console.warn('Owner copy send failed', err); }
          return res;
        })
        .catch(err => {
          console.error('EMAILJS SEND ERROR', err, 'params', a);
          T(`<strong>EmailJS error</strong><div>${k(String(err && (err.text || err.message) || err))}</div><pre style="white-space:pre-wrap;max-height:160px;overflow:auto">${k(JSON.stringify(err && (err.response || err) || err))}</pre>`, true);
          throw err;
        });
    })(customer, cart, totals);

    await (async function(t,e,n){
      if(!window.mtmApi||typeof window.mtmApi.request!=='function') return false;
      try{ await window.mtmApi.request("GET","/api/auth/me"); }catch{return false}
      const i=(e||[]).map(t=>{const e=String((t.id ?? t.itemId ?? t.productId ?? t.name) || ""),n=e.includes("-")?e.split("-")[0]:e;return{itemId:e||String(t.name||""),productId:String(t.productId||n||e||""),name:String(t.name||""),image:String(t.image||""),quantity:Number(t.quantity||1),price:Number(t.price||0)}});
      try{
        const payload = { customer: { fullName: t.fullName, email: t.email, phone: t.phone, shippingAddress: t.shippingAddress, instructions: t.instructions || "" }, items: i, subtotal: n.subtotal, shipping: n.shipping, discount: n.discount || 0, total: n.total, status: "pending", emailSent: true };
        try { const promoInput = document.getElementById('promoCode'); const appliedCode = promoInput && promoInput.value ? promoInput.value.toUpperCase().trim() : ''; if (appliedCode) payload.referralCode = appliedCode; } catch (e) {}
        try {
        await window.mtmApi.request("POST", "/api/orders", payload);
        return true;
      } catch (err) {
        // If unauthenticated, fall back to guest order creation
        if (err && (err.status === 401 || err.status === 403)) {
          try {
            await window.mtmApi.request("POST", "/api/orders/guest", payload);
            return true;
          } catch (guestErr) {
            console.warn('Guest order save failed', guestErr);
            return false;
          }
        }
        console.warn('Order DB save failed', err);
        return false;
      }
      }catch(err){console.warn("Order DB save failed:",err);return false}
    })(customer, cart, totals);

    const oList = window.utils.loadFromLocalStorage("orders")||[];
    oList.push({ id:`ORD-${Date.now()}`, createdAt:(new Date).toISOString(), date:(new Date).toISOString(), customer, items:JSON.parse(JSON.stringify(cart)), subtotal:totals.subtotal, shipping:totals.shipping, discount:totals.discount||0, tax:0, total:totals.total, status:"pending", emailSent:true });
    window.utils.saveToLocalStorage("orders", oList);

    if (window.cartManager && typeof window.cartManager.clearCart === 'function') {
      await window.cartManager.clearCart();
      window.cartManager.renderCartItems();
      window.cartManager.updateCartCount();
    } else {
      window.utils.saveToLocalStorage("meToMilletsCart", []);
    }

    D(!1); d.disabled = false; i.hidden = true; n.hidden = true; T("<strong>Order sent!</strong><div>Check your email for confirmation. Thank you!</div>", false); window.utils.showNotification("Order sent! Check your email for confirmation","success");
  } catch (err) {
    console.error("Order send failed:", err);
    D(!1); d.disabled = false; T(`<strong>Failed to send order.</strong><div>${k(err&&err.text?err.text:err&&err.message||"Unknown error")}</div>`, true); c.hidden = false;
  }
};

// main click handler

d.addEventListener("click",async (ev)=>{try{if (ev && typeof ev.preventDefault === 'function') { ev.preventDefault(); ev.stopImmediatePropagation && ev.stopImmediatePropagation(); }}catch(e){} console.log('sendOrderBtn clicked, postPaymentSend=', !!window._postPaymentSend); try{ pushPaymentEvent({ stage: 'send_btn_clicked' }); }catch(e){} const t=S(),o=M(t);if(o){ window.utils.showNotification(o,"error"); return; }const r=$();if(!r||0===r.length){window.utils.showNotification("Your cart is empty.","error"); return;}const a=C(r);

            if(!window._postPaymentSend){try{const createUrl = `${API_BASE}/api/payment/create-order`;
    console.log('Creating order at', createUrl, 'payload amount:', a.total);
    try { pushPaymentEvent({ stage: 'create_request', amount: a.total }); } catch(e){}
    const createRes = await fetch(createUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: a.total }) });
    if (!createRes.ok) {
      const text = await createRes.text().catch(()=>"(no body)");
      try { pushPaymentEvent({ stage: 'create_response', ok: false, status: createRes.status, statusText: createRes.statusText, body: text }); } catch(e){}
      throw new Error(`Order creation failed: ${createRes.status} ${createRes.statusText} ${text}`);
    }
    const createData=await createRes.json();
    const order=createData.order||createData;
    try { pushPaymentEvent({ stage: 'create_response', ok: true, orderId: order.id, amount: order.amount }); } catch(e){};const options={
      key: "rzp_live_RxrHD9omHr9IUC",
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "MetoMillets",
      modal: {
        ondismiss: function() {
          console.log('Razorpay modal dismissed');
          try{ pushPaymentEvent({ stage: 'modal_dismiss', orderId: order.id }); }catch(e){}
          window._razorpayDismissedAt = Date.now();
          window._paymentInProgress = false;
          try{ disableNavigationBlockers(); }catch(e){}
          d.disabled = false;
          window.showError && window.showError('Payment window closed or cancelled');
        }
      },
      handler: async (response) => {
          console.log('Razorpay handler response:', response);
          try{
            try{ pushPaymentEvent({ stage: 'handler_invoked', response }); } catch(e){}
            pushPaymentEvent({ stage: 'verify_request', response });
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
            if (!verifyRes.ok) {
              try{ pushPaymentEvent({ stage: 'verify_response', ok: false, status: verifyRes.status, statusText: verifyRes.statusText }); }catch(e){}
              throw new Error("Verification request failed");
            }
            const verify = await verifyRes.json();
            try{ pushPaymentEvent({ stage: 'verify_response', ok: true, verify }); }catch(e){}
            console.log('Payment verify result:', verify);
            window._paymentInProgress = false;
            try{ disableNavigationBlockers(); }catch(e){}
            if (verify.success) {
              // Show immediate success message and then proceed to send order
              T("<strong>Payment successful</strong><div>Processing your order...</div>", false);
              try {
                await processSend(t, r, a);
              } catch (err) {
                console.error('Post-payment send failed', err);
                window.showError && window.showError('Failed to process order after payment.');
              }
            } else {
              T("<strong>Payment verification failed</strong><div>Please contact support.</div>", true);
            }
          } catch (err) {
            try{ pushPaymentEvent({ stage: 'verify_error', error: String(err && (err.message || err)) }); }catch(e){}
            try{ window._paymentInProgress = false; try{ disableNavigationBlockers(); }catch(e){} }catch(e){}
            console.error('Payment verification error:', err);
            T(`<strong>Payment verification error</strong><div>${k(err && err.message || "Unknown")}</div>`, true);
          }
        },prefill:{name:t.fullName,email:t.email,contact:t.phone}};window._razorpayOpenedAt = Date.now();
        d.disabled = true; // disable while modal is open
        try {
            // HANDOFF: persist pending payment and navigate to dedicated payment page
          try{ pushPaymentEvent({ stage: 'handoff_to_payment_page', orderId: order.id, amount: order.amount }); }catch(e){}
          try{
            // Include public key id if returned by the create-order response
            try{ if (createData && createData.key_id) order.key_id = createData.key_id; }catch(e){}
            const pending = { order: order, customer: t, cart: r, totals: a };
            localStorage.setItem('mtm_pending_payment', JSON.stringify(pending));
            // include return url so payment page can come back
            const returnUrl = window.location.href;
            const payPage = `/pages/payment.html?return=${encodeURIComponent(returnUrl)}`;
            pushPaymentEvent({ stage: 'navigate_to_payment_page', url: payPage });
            window.location.href = payPage;
            return;
          }catch(e){ console.error('Failed to handoff to payment page', e); pushPaymentEvent({ stage: 'handoff_error', error: String(e) }); }
          
          // (old inline fallback kept in case handoff fails) 
          try{ if (typeof enableNavigationBlockers === 'function') enableNavigationBlockers(); }catch(e){}
          window._paymentInProgress = true;
          pushPaymentEvent({ stage: 'modal_open', orderId: order.id });
          new Razorpay(options).open();
          // Safety: if no action after 60s, re-enable button and cleanup
          setTimeout(() => { if (window._razorpayOpenedAt && Date.now() - window._razorpayOpenedAt > 60_000) { d.disabled = false; window._razorpayOpenedAt = null; window._paymentInProgress = false; try{ disableNavigationBlockers(); }catch(e){} } }, 60000);
        } catch (openErr) {
          console.error('Failed to open Razorpay', openErr);
          pushPaymentEvent({ stage: 'modal_open_error', error: String(openErr && (openErr.message || openErr)) });
          d.disabled = false;
          window._paymentInProgress = false;
          window.showError && window.showError('Failed to open payment window');
        }
      } catch (err) { console.error('Payment create error', err); d.disabled = false; window._paymentInProgress = false; window.showError && window.showError('Payment request failed (network/backend). Check backend URL and CORS. Details: ' + (err && err.message || 'Unknown')); } return; } D(!0), d.disabled = true;try{await async function(t,n,i){const o=n.map(t=>`${t.name} - Qty: ${t.quantity} x ${e(t.price)} = ${e((t.price||0)*(t.quantity||1))}`).join("\n"),r=`\nNEW ORDER RECEIVED\n\nORDER ID: ORD-${Date.now()}\nORDER DATE: ${(new Date).toLocaleString()}\n\nCUSTOMER INFORMATION:\nName: ${t.fullName}\nEmail: ${t.email}\nPhone: ${t.phone}\nAddress: ${t.shippingAddress}\n${t.instructions?`Special Instructions: ${t.instructions}`:""}\n\nORDER ITEMS:\n${o}\n\nORDER SUMMARY:\nSubtotal: ${e(i.subtotal)}\nShipping: ${0===i.shipping?"Free":e(i.shipping)}\nGRAND TOTAL: ${e(i.total)}\n\n---\nThis is an automated order notification from Me To Millets.\n    `.trim(),a={to_email:myEmail,from_name:t.fullName,from_email:t.email,customer_name:t.fullName,customer_email:t.email,customer_phone:t.phone,shipping_address:t.shippingAddress,order_items:o,order_total:e(i.total),message:r,html_message:I(t,n,i)};if(!window.emailjs||"function"!=typeof window.emailjs.send)throw new Error("EmailJS SDK not available. Check your network or include the EmailJS script.");return emailjs.send(serviceId,templateId,a)}(t,r,a),await async function(t,e,n){if(!window.mtmApi||"function"!=typeof window.mtmApi.request)return!1;try{await window.mtmApi.request("GET","/api/auth/me")}catch{return!1}const i=(e||[]).map(t=>{const e=String((t.id ?? t.itemId ?? t.productId ?? t.name) || ""),n=e.includes("-")?e.split("-")[0]:e;return{itemId:e||String(t.name||""),productId:String(t.productId||n||e||""),name:String(t.name||""),image:String(t.image||""),quantity:Number(t.quantity||1),price:Number(t.price||0)}});try{
            const payload = { customer: { fullName: t.fullName, email: t.email, phone: t.phone, shippingAddress: t.shippingAddress, instructions: t.instructions || "" }, items: i, subtotal: n.subtotal, shipping: n.shipping, discount: n.discount || 0, total: n.total, status: "pending", emailSent: true };
            try {
              const promoInput = document.getElementById('promoCode');
              const appliedCode = promoInput && promoInput.value ? promoInput.value.toUpperCase().trim() : '';
              if (appliedCode) payload.referralCode = appliedCode;
            } catch (e) { }
            try { await window.mtmApi.request("POST", "/api/orders", payload); return true; } catch (err) { if (err && (err.status === 401 || err.status === 403)) { try { await window.mtmApi.request("POST", "/api/orders/guest", payload); return true; } catch (guestErr) { console.warn('Guest order save failed', guestErr); return false; } } console.warn("Order DB save failed:", err); return false; }
          }catch(t){return console.warn("Order DB save failed:",t),!1}}(t,r,a);const o=window.utils.loadFromLocalStorage("orders")||[];o.push({id:`ORD-${Date.now()}`,createdAt:(new Date).toISOString(),date:(new Date).toISOString(),customer:t,items:JSON.parse(JSON.stringify(r)),subtotal:a.subtotal,shipping:a.shipping,discount:a.discount||0,tax:0,total:a.total,status:"pending",emailSent:!0}),window.utils.saveToLocalStorage("orders",o),window.cartManager&&"function"==typeof window.cartManager.clearCart?(await window.cartManager.clearCart(),window.cartManager.renderCartItems(),window.cartManager.updateCartCount()):window.utils.saveToLocalStorage("meToMilletsCart",[]),D(!1),d.disabled=!1,i.hidden=!0,n.hidden=!0,T("<strong>Order sent!</strong><div>Check your email for confirmation. Thank you!</div>",!1),window.utils.showNotification("Order sent! Check your email for confirmation","success")}catch(t){console.error("Order send failed:",t),D(!1),d.disabled=!1,T(`<strong>Failed to send order.</strong><div>${k(t&&t.text?t.text:t&&t.message||"Unknown error")}</div>`,!0),c.hidden=!1}}),p.addEventListener("click",()=>{c.hidden=!0,s.hidden=!0,i.hidden=!1}),u.addEventListener("click",()=>{c.hidden=!0,s.hidden=!0,i.hidden=!0});const O=t("promoCode"),N=t("applyPromoBtn"),A=t("promoMessage");N&&N.addEventListener("click",async t=>{t.preventDefault();const e=O.value.toUpperCase().trim();if(!e)return A.textContent="Enter a promo code",A.style.background="#fee",A.style.color="#c33",A.hidden=!1,v=0,void E();if(x[e]){v=x[e];A.textContent=`✓ Promo applied! ${(100*v).toFixed(0)}% discount`;A.style.background="#efe";A.style.color="#2e8b57";A.hidden=!1;window.utils.showNotification(`Promo "${e}" applied!`,'success');E();return;}try{const resp=await fetch('/api/referrals/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:e})});if(resp.ok){const data=await resp.json();if(data.valid){v=data.discount||0;x[e]=v;try{const localPromos=window.utils.loadFromLocalStorage('referralPromos')||{};localPromos[e]=v;window.utils.saveToLocalStorage && window.utils.saveToLocalStorage('referralPromos',localPromos);}catch(err){}A.textContent=`✓ Promo applied! ${(100*v).toFixed(0)}% discount`;A.style.background="#efe";A.style.color="#2e8b57";A.hidden=!1;window.utils.showNotification(`Promo "${e}" applied!`,'success');E();return;}}}catch(err){console.warn('Referral validate failed',err);}A.textContent="Invalid promo code";A.style.background="#fee";A.style.color="#c33";A.hidden=!1;v=0;E()}),E();
    // Auto attempt to render order summary periodically in case cartManager initialises later
    let _renderAttempts = 0;
    const _renderInterval = setInterval(() => {
      try {
        const cartNow = $();
        if (Array.isArray(cartNow) && cartNow.length > 0) {
          E();
          clearInterval(_renderInterval);
        }
        _renderAttempts++;
        if (_renderAttempts > 25) { // stop after ~5s
          clearInterval(_renderInterval);
          const gEl = document.getElementById('orderSummary');
          if (gEl && !gEl.innerHTML.trim()) gEl.innerHTML = '<div class="empty">Your cart is empty</div>';
        }
      } catch (err) {
        console.error('Auto-render error', err); clearInterval(_renderInterval);
      }
    }, 200);
    window.addEventListener("storage",t=>{"meToMilletsCart"===t.key&&E()});const L=document.getElementById("currentYear");L&&(L.textContent=(new Date).getFullYear());

// Debug helper for checkout (use from console: window.mtmDebug.getCart(), window.mtmDebug.renderPreview())
window.mtmDebug = {
  getCart: () => {
    try {
      const cart = (window.cartManager && Array.isArray(window.cartManager.cart)) ? window.cartManager.cart : (window.utils && window.utils.loadFromLocalStorage ? window.utils.loadFromLocalStorage('meToMilletsCart') : []) || [];
      console.log('mtmDebug.getCart', cart);
      return cart;
    } catch (err) { console.error('mtmDebug.getCart error', err); return []; }
  },
  renderPreview: () => {
    try {
      if (typeof E === 'function') { E(); } else { console.warn('E() render function not found'); }
      const btn = document.getElementById('previewOrderBtn'); if (btn) btn.click();
    } catch (err) { console.error('mtmDebug.renderPreview error', err); }
  },
  showState: () => {
    console.log('cartManager', window.cartManager);
    console.log('localStorage meToMilletsCart', window.utils && window.utils.loadFromLocalStorage ? window.utils.loadFromLocalStorage('meToMilletsCart') : null);
    console.log('DOM orderSummary exists', !!document.getElementById('orderSummary'));
  },
  // Payment event helpers
  getPaymentEvents: () => {
    try { return JSON.parse(localStorage.getItem('mtm_payment_events') || '[]'); } catch (e) { console.warn('getPaymentEvents parse failed', e); return []; }
  },
  clearPaymentEvents: () => { try { localStorage.removeItem('mtm_payment_events'); console.info('mtm_payment_events cleared'); } catch(e){} },
  downloadPaymentEvents: () => {
    try{
      const data = JSON.stringify(window.mtmDebug.getPaymentEvents(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'mtm_payment_events.json'; a.click(); URL.revokeObjectURL(url);
    }catch(e){console.error('downloadPaymentEvents failed', e);}  
  },
  showDebugPanel: () => {
    try{
      if (document.getElementById('mtm-debug-panel')) return;
      const panel = document.createElement('div');
      panel.id = 'mtm-debug-panel';
      panel.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:10050;background:rgba(0,0,0,0.8);color:white;padding:12px;border-radius:8px;max-width:360px;max-height:360px;overflow:auto;font-family:monospace;font-size:12px';
      panel.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><strong>Payment Debug</strong><button id="mtm-debug-close" style="background:transparent;border:none;color:white;font-size:16px;cursor:pointer">✕</button></div><div id="mtm-debug-list"></div><div style="display:flex;gap:8px;margin-top:8px"><button id="mtm-debug-refresh" class="btn">Refresh</button><button id="mtm-debug-download" class="btn">Download</button></div>';
      document.body.appendChild(panel);
      document.getElementById('mtm-debug-close').addEventListener('click', () => panel.remove());
      const refresh = () => {
        const list = document.getElementById('mtm-debug-list');
        const events = window.mtmDebug.getPaymentEvents().slice(-30).reverse();
        list.innerHTML = events.map(ev => `<div style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.06)"><div style="opacity:0.7">${new Date(ev.ts).toLocaleTimeString()}</div><div>${JSON.stringify(ev).slice(0,200)}</div></div>`).join('') || '<div style="opacity:0.6">(no events)</div>';
      };
      document.getElementById('mtm-debug-refresh').addEventListener('click', refresh);
      document.getElementById('mtm-debug-download').addEventListener('click', () => window.mtmDebug.downloadPaymentEvents());
      refresh();
    }catch(e){console.error('showDebugPanel failed', e);}    
  }
};

// Process result from payment page if present
try{
  const resRaw = window.utils && window.utils.loadFromLocalStorage ? window.utils.loadFromLocalStorage('mtm_payment_result') : null;
  if (resRaw){
    try{
      const res = (typeof resRaw === 'string') ? JSON.parse(resRaw) : resRaw;
      console.info('Processing returned payment result', res);
      // If success, attempt to finalize the order if we are on checkout
      if (res && res.success && typeof processSend === 'function'){
        // restore some context if possible, then call processSend after a short delay
        setTimeout(async () => {
          try{
            // try to call processSend using current checkout state
            const customer = M();
            const cart = $();
            const totals = C(cart);
            await processSend(customer, cart, totals);
            window.utils.saveToLocalStorage('mtm_payment_result', null);
            window.utils.showNotification && window.utils.showNotification('Payment completed and order processed', 'success');
          }catch(err){ console.error('Finalizing payment failed', err); }
        }, 500);
      }
    }catch(e){console.warn('Failed to parse mtm_payment_result', e);}finally{ try{ window.utils && window.utils.saveToLocalStorage && window.utils.saveToLocalStorage('mtm_payment_result', null); }catch(e){} }
  }
}catch(e){}


});