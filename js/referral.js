// Referral code generator + share
(function(){
    const STORAGE_KEY = 'referralPromos';

    function loadPromos(){
        try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(e){return{}}
    }
    function savePromos(p){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    }

    function generateCode(){
        const suffix = Math.random().toString(36).substring(2,8).toUpperCase();
        return `MTM20-${suffix}`;
    }

    function getDeviceId(){
        let id = localStorage.getItem('deviceToken');
        if(!id){ id = 'dev-' + Math.random().toString(36).substring(2,12); localStorage.setItem('deviceToken', id); }
        return id;
    }

    async function createReferral(discount=0.20){
        // prefer server-side creation (one code per device)
        try{
            const deviceId = getDeviceId();
            const res = await fetch('/api/referrals/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId })
            });
            if(res.ok){
                const data = await res.json();
                const code = data.code;
                const promos = loadPromos();
                promos[code] = data.discount || discount;
                savePromos(promos);
                return code; 
            }
        }catch(err){
            console.warn('Server referral create failed, falling back to local generation', err);
        }
        // fallback to local generation
        const code = generateCode();
        const promos = loadPromos();
        promos[code] = discount;
        savePromos(promos);
        return code; 
    }

    // UI helpers
    function showMessage(msg, type='info'){
        const root = document.getElementById('referralMsg');
        if(!root) return;
        root.textContent = msg;
        root.style.display = 'block';
        root.style.background = type==='success' ? '#e6f7ee' : type==='error' ? '#fff0f0' : 'transparent';
        root.style.color = type==='success' ? '#167a2b' : '#333';
    }

    document.addEventListener('DOMContentLoaded', function(){
        const shareBtn = document.getElementById('referralShareBtn');
        const copyBtn = document.getElementById('referralCopyBtn');
        const codeEl = document.getElementById('referralCode');
        const linkEl = document.getElementById('referralLink');

        // If URL contains ?ref=CODE, save it locally so recipient can redeem
        const urlParams = new URLSearchParams(location.search);
        const incoming = urlParams.get('ref');
        if(incoming){
            const promos = loadPromos();
            if(!promos[incoming]){
                promos[incoming] = 0.20; // default referral discount
                savePromos(promos);
            }
            // update UI
            if(codeEl) codeEl.value = incoming;
            if(linkEl){ linkEl.href = `${location.origin}${location.pathname}?ref=${incoming}`; linkEl.textContent = `https://${location.hostname}/?ref=${incoming}`; }
            showMessage('Referral code detected and saved. It will be applied at checkout.','success');
        }


        // Ensure device has a server-backed referral code (will return existing if present)
        if(!incoming){
            createReferral(0.20).then(code=>{
                if(code){
                    if(codeEl && !codeEl.value) codeEl.value = code;
                    if(linkEl && !linkEl.href){ linkEl.href = `${location.origin}${location.pathname}?ref=${code}`; linkEl.textContent = `https://${location.hostname}/?ref=${code}`; }
                }
            }).catch(()=>{});
        }

        if(shareBtn){
            shareBtn.addEventListener('click', async function(){
                const code = await createReferral(0.20);
                const url = `${location.origin}${location.pathname}?ref=${code}`;
                if(codeEl) codeEl.value = code;
                if(linkEl){ linkEl.href = url; linkEl.textContent = url; }

                const shareData = {title: 'Me To Millets — Referral', text: `Use my code ${code} to get 20% off at Me To Millets!`, url};
                try{
                    if(navigator.share){
                        await navigator.share(shareData);
                        showMessage('Shared! Your code was generated and saved.', 'success');
                    } else {
                        await navigator.clipboard.writeText(`${shareData.text} ${url}`);
                        showMessage('No native share available — link copied to clipboard. Code generated and saved.', 'success');
                    }
                }catch(err){
                    console.error('Share failed', err);
                    showMessage('Unable to share — the code was still generated.', 'error');
                }
            });
        }

        if(copyBtn){
            copyBtn.addEventListener('click', async function(){
                let code = codeEl && codeEl.value ? codeEl.value : null;
                if(!code) code = await createReferral(0.20);
                const url = `${location.origin}${location.pathname}?ref=${code}`;
                if(codeEl) codeEl.value = code;
                if(linkEl){ linkEl.href = url; linkEl.textContent = url; }
                try{
                    await navigator.clipboard.writeText(`${code} | ${url}`);
                    showMessage('Referral code and link copied to clipboard.', 'success');
                }catch(e){
                    showMessage('Copy failed — your code was still generated.', 'error');
                }
            });
        }

    });
})();