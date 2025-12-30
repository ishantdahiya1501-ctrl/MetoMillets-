/* Payment page script: reads `mtm_pending_payment` from localStorage and opens Razorpay.
   After verification it writes `mtm_payment_result` and redirects back to checkout (or returnUrl).
*/
(function(){
  const infoEl = document.getElementById('info');
  const amountEl = document.getElementById('amount');
  const orderEl = document.getElementById('orderId');
  const retryBtn = document.getElementById('retry');
  const backBtn = document.getElementById('back');

  const getAPIBase = () => {
    const _overrideApi = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('BACKEND_API_BASE') : null;
    return _overrideApi || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? `${location.protocol}//${location.hostname}:8080` : '');
  };

  function readPending(){
    try{ const raw = localStorage.getItem('mtm_pending_payment'); if(!raw) return null; return JSON.parse(raw); }catch(e){ return null }
  }
  function clearPending(){ try{ localStorage.removeItem('mtm_pending_payment'); }catch(e){} }

  function writeResult(obj){ try{ localStorage.setItem('mtm_payment_result', JSON.stringify(obj)); }catch(e){} }

  function showInfo(txt, cls='info'){ infoEl.textContent = txt; infoEl.className = `status ${cls}`; }

  function openRazorpay(order, customer){
    showInfo('Opening payment window…', 'info');
    try{
      const options = {
        key: (order.key_id || 'rzp_live_RxrHD9omHr9IUC'),
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'MetoMillets',
        modal: { ondismiss(){ showInfo('Payment cancelled (modal closed). You can retry or go back.','error'); retryBtn.hidden=false; backBtn.hidden=false; writeResult({ success:false, reason:'modal_dismiss' }); } },
        handler: async (resp) => {
          showInfo('Verifying payment…', 'info');
          try{
            const res = await fetch(`${getAPIBase()}/api/payment/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resp) });
            if(!res.ok){ const txt = await res.text().catch(()=>'(no body)'); throw new Error(`Verify failed ${res.status} ${res.statusText} ${txt}`); }
            const json = await res.json();
            if(json.success){ showInfo('Payment verified — returning to checkout', 'success'); writeResult({ success:true, order, resp, verify:json }); clearPending(); setTimeout(() => { const returnUrl = new URLSearchParams(location.search).get('return') || '/pages/checkout.html'; location.href = returnUrl; }, 900); }
            else { showInfo('Payment verification failed. Contact support.', 'error'); writeResult({ success:false, order, resp, verify: json }); }
          }catch(err){ showInfo('Verification error: ' + (err && err.message || 'Unknown'), 'error'); writeResult({ success:false, order, error: String(err && (err.message||err)) }); }
        },
        prefill: { name: (customer && customer.name) || '', email: (customer && customer.email) || '', contact: (customer && customer.phone) || '' }
      };

      new Razorpay(options).open();
      showInfo('Payment window opened — complete payment to continue.', 'info');
    }catch(e){ showInfo('Failed to open payment window: ' + (e && e.message || ''), 'error'); retryBtn.hidden=false; backBtn.hidden=false; writeResult({ success:false, order, error: String(e) }); }
  }

  function start(){
    const pending = readPending();
    if(!pending || !pending.order){ showInfo('No pending payment found. Please start payment from the checkout page.', 'error'); backBtn.hidden=false; return; }
    amountEl.textContent = `Amount: ${window.utils ? window.utils.formatPrice((pending.order.amount || 0)/100) : (pending.order.amount/100) }`;
    orderEl.textContent = `Order ID: ${pending.order.id}`;
    document.getElementById('details').classList.remove('hidden');

    // Auto-open modal after short delay to ensure UI updates
    setTimeout(()=> openRazorpay(pending.order, pending.customer), 300);
  }

  retryBtn.addEventListener('click', ()=>{ retryBtn.hidden=true; backBtn.hidden=true; start(); });
  backBtn.addEventListener('click', ()=>{ clearPending(); location.href = '/pages/checkout.html'; });

  // start
  document.addEventListener('DOMContentLoaded', start);
})();