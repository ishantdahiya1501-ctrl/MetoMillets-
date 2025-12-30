document.addEventListener("DOMContentLoaded", () => {
  const payBtn = document.getElementById("payBtn");
  if (!payBtn) return;
  // Allow overriding backend during HTTPS tunnel testing (set in browser):
  // localStorage.setItem('BACKEND_API_BASE', 'https://<your-backend-tunnel>.ngrok.io')
  const _overrideApi = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('BACKEND_API_BASE') : null;
  const API_BASE = _overrideApi || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? `${location.protocol}//${location.hostname}:8080` : ''); 

  // Clean up any legacy referral key that could interfere with checkout
  try { if (localStorage.getItem('autoReferralCode')) { console.info('Removing legacy autoReferralCode from localStorage'); localStorage.removeItem('autoReferralCode'); } } catch (e) {}

  // Simple local helper to capture payment-related events for debugging
  function pushPaymentEvent(evt){
    try{
      const raw = localStorage.getItem('mtm_payment_events') || '[]';
      const arr = JSON.parse(raw);
      arr.push(Object.assign({ ts: Date.now() }, evt));
      localStorage.setItem('mtm_payment_events', JSON.stringify(arr));
    }catch(e){ console.warn('pushPaymentEvent failed', e); }
  }

  // Capture-phase guard for Pay button to prevent other handlers from triggering navigation
  try{
    let _origReloadSimple = window.location.reload.bind(window.location);
    let _origAssignSimple = window.location.assign.bind(window.location);
    let _navSimpleEnabled = false;
    function enableNavigationBlockersSimple(){ if (_navSimpleEnabled) return; _navSimpleEnabled = true; try{ window.location.reload = function(){ try{ pushPaymentEvent({ stage: 'reload_blocked', stack: (new Error()).stack }); }catch(e){} console.warn('Blocked location.reload during payment'); }; window.location.assign = function(url){ try{ pushPaymentEvent({ stage: 'assign_blocked', url, stack: (new Error()).stack }); }catch(e){} console.warn('Blocked location.assign during payment'); }; window.addEventListener('keydown', _blockReloadKeySimple, true); }catch(e){}
    }
    function disableNavigationBlockersSimple(){ if (!_navSimpleEnabled) return; _navSimpleEnabled = false; try{ try{ window.location.reload = _origReloadSimple; }catch(e){} try{ window.location.assign = _origAssignSimple; }catch(e){} window.removeEventListener('keydown', _blockReloadKeySimple, true); }catch(e){}
    }
    function _blockReloadKeySimple(ev){ try{ const isReload = (ev.key === 'F5') || ((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase() === 'r'); if (isReload && window._paymentInProgress){ ev.preventDefault(); ev.stopImmediatePropagation(); try{ pushPaymentEvent({ stage: 'key_reload_blocked', key: ev.key, stack: (new Error()).stack }); }catch(e){} console.warn('Blocked reload key during payment'); } }catch(e){}
    }
    document.addEventListener('click', (ev) => {
      try{
        const btn = ev.target && ev.target.closest ? ev.target.closest('#payBtn') : null;
        if (btn) {
          // Only log the capture here; do NOT set _paymentInProgress yet (set when modal opens)
          try{ pushPaymentEvent({ stage: 'pay_btn_capture' }); }catch(e){}
          // safety timeout not needed here since we don't set the flag
          return;
        }

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

  // Global beforeunload guard (redundant — also set in checkout-v2)
  try{
    window.addEventListener('beforeunload', (e) => {
      try{
        if (window._paymentInProgress) { e.preventDefault(); e.returnValue = ''; }
      }catch(err){}
    });
  }catch(e){}

  payBtn.addEventListener("click", async () => {
    try {
      const amount = Number(payBtn.dataset.amount) || 10;
      pushPaymentEvent({ stage: 'create_request', amount });
      const createUrl = `${API_BASE}/api/payment/create-order`;
      console.log('Creating order at', createUrl, 'payload amount:', amount);
      let res;
      try {
        res = await fetch(createUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
      } catch (err) {
        console.error('Network error creating order', err);
        payBtn.disabled = false;
        window.showError && window.showError('Network error contacting backend. Check backend URL and your connection. Details: ' + (err && err.message || 'Unknown'));
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(()=>"(no body)");
        console.error('Order creation bad response', res.status, res.statusText, text);
        pushPaymentEvent({ stage: 'create_response', ok: false, status: res.status, statusText: res.statusText, body: text });
        payBtn.disabled = false;
        window.showError && window.showError(`Order creation failed: ${res.status} ${res.statusText} ${text}`);
        return;
      }

      const data = await res.json();
      const order = data.order || data; // support both shapes
      pushPaymentEvent({ stage: 'create_response', ok: true, orderId: order.id, amount: order.amount });

      // HANDOFF to dedicated payment page
      try{ pushPaymentEvent({ stage: 'handoff_to_payment_page', orderId: order.id, amount: order.amount }); }catch(e){}
      try{
        try{ if (data && data.key_id) order.key_id = data.key_id; }catch(e){}
        const pending = { order: order, customer: null };
        // If checkout has customer info, try to include it
        try{ const cust = { name: '', email: '', phone: '' }; pending.customer = cust; }catch(e){}
        localStorage.setItem('mtm_pending_payment', JSON.stringify(pending));
        const returnUrl = window.location.href;
        pushPaymentEvent({ stage: 'navigate_to_payment_page', url: `/pages/payment.html?return=${encodeURIComponent(returnUrl)}` });
        window.location.href = `/pages/payment.html?return=${encodeURIComponent(returnUrl)}`;
        return;
      }catch(e){ console.error('Handoff failed', e); pushPaymentEvent({ stage: 'handoff_error', error: String(e) }); }

      // Fallback: open inline modal
      const options = {
        key: "rzp_live_RxrHD9omHr9IUC", // REPLACE with your Razorpay KEY ID
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "MetoMillets",
        modal: {
          ondismiss: function() {
            console.log('Razorpay modal dismissed');
            pushPaymentEvent({ stage: 'modal_dismiss', orderId: order.id });
            window._razorpayDismissedAt = Date.now();
            window._paymentInProgress = false;
            try{ disableNavigationBlockersSimple(); }catch(e){}
            payBtn.disabled = false;
            window.showError && window.showError('Payment window closed or cancelled');
          }
        },
        handler: async (response) => {
          console.log('Razorpay handler response:', response);
          pushPaymentEvent({ stage: 'handler_invoked', response });
          try {
            pushPaymentEvent({ stage: 'verify_request', response });
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error("Verification request failed");
            const verify = await verifyRes.json();
            pushPaymentEvent({ stage: 'verify_response', verify });
            try{ window._paymentInProgress = false; try{ disableNavigationBlockersSimple(); }catch(e){} }catch(e){}
            if (verify.success) {
              window.utils && window.utils.showNotification && window.utils.showNotification('Payment Successful', 'success');
            } else {
              window.showError && window.showError('Payment verification failed');
            }
          } catch (err) {
            try{ window._paymentInProgress = false; try{ disableNavigationBlockersSimple(); }catch(e){} }catch(e){}
            console.error('Verification error', err); pushPaymentEvent({ stage: 'verify_error', error: String(err && (err.message || err)) }); window.showError && window.showError('Verification error: ' + (err && err.message || 'Unknown'));
          }
        },
        prefill: { name: "", email: "", contact: "" },
      };

      payBtn.disabled = true;
      window._razorpayOpenedAt = Date.now();
      try{ if (typeof enableNavigationBlockersSimple === 'function') enableNavigationBlockersSimple(); }catch(e){}
      window._paymentInProgress = true;
      pushPaymentEvent({ stage: 'modal_open', orderId: order.id });
      try {
        new Razorpay(options).open();
        setTimeout(() => { if (window._razorpayOpenedAt && Date.now() - window._razorpayOpenedAt > 60_000) { payBtn.disabled = false; window._razorpayOpenedAt = null; window._paymentInProgress = false; try{ disableNavigationBlockersSimple(); }catch(e){} } }, 60000);
      } catch (openErr) {
        console.error('Failed to open Razorpay', openErr);
        pushPaymentEvent({ stage: 'modal_open_error', error: String(openErr && (openErr.message || openErr)) });
        payBtn.disabled = false;
        window._paymentInProgress = false;
        try{ disableNavigationBlockersSimple(); }catch(e){}
        window.showError && window.showError('Failed to open payment window');
      }
    } catch (err) {
      console.error('Payment error', err); window.showError && window.showError('Payment error: ' + (err && err.message || 'Unknown'));
    }
  });
});