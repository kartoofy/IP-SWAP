// ==UserScript==
// @name        Reset WAN Button (1-click, regrab)
// @namespace   modem-resetwan-regrab
// @match       https://192.168.100.1/*
// @match       http://192.168.100.1/*
// @match       https://192.168.100.1:80/*
// @match       http://192.168.100.1:80/*
// @grant       none
// @run-at      document-idle
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        ADVANCED_MENU_ID: 'addconfig',
        ROW_ID: 'wanInstTable_record_0',
        WAN_CHECKBOX_ID: 'WanSwitch',
        WAN_APPLY_ID: 'ButtonApply',
    };

    function waitFor(checkFn, timeoutMs) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const tick = () => {
                let result;
                try { result = checkFn(); } catch (e) { result = null; }
                if (result) return resolve(result);
                if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for condition'));
                requestAnimationFrame(tick);
            };
            tick();
        });
    }

    function getIframeDoc() {
        const iframe = document.getElementById('menuIframe');
        return iframe && iframe.contentDocument;
    }

    function hasTable(doc) {
        return !!(doc && doc.getElementById(CONFIG.ROW_ID));
    }

    function isFormOpen(doc) {
        if (!doc) return false;
        const cb = doc.getElementById(CONFIG.WAN_CHECKBOX_ID);
        const btn = doc.getElementById(CONFIG.WAN_APPLY_ID);
        const panel = doc.getElementById('divTableConfigForm');
        return !!(cb && btn && panel && panel.style.display !== 'none');
    }

    // Waits for the iframe to land on a genuinely NEW document (i.e. the
    // Apply round trip has fully completed and we're back on the WAN table),
    // not just some elapsed time. This is what your original script did
    // right — it just used long fixed timeouts, making it feel slow.
    function waitForFreshTable(oldDoc, timeoutMs) {
        return waitFor(() => {
            const doc = getIframeDoc();
            return (doc && doc !== oldDoc && hasTable(doc)) ? doc : null;
        }, timeoutMs);
    }

    async function openConnection(doc) {
        const row = doc.getElementById(CONFIG.ROW_ID);
        if (!row) throw new Error('WAN connection row not found');
        row.click();
        await waitFor(() => isFormOpen(getIframeDoc()), 5000);
        return getIframeDoc();
    }

    function setEnabledAndApply(doc, targetChecked) {
        const chk = doc.getElementById(CONFIG.WAN_CHECKBOX_ID);
        const btn = doc.getElementById(CONFIG.WAN_APPLY_ID);
        if (!chk || !btn) throw new Error('WAN switch or Apply button not found');
        if (chk.checked !== targetChecked) chk.click();
        btn.click();
    }

    async function resetWan(btnEl) {
        btnEl.disabled = true;
        try {
            let doc = getIframeDoc();

            // Only needed the first time / if we're on the Home page.
            // On 2nd/3rd/4th presses this is already true, so it's skipped.
            if (!hasTable(doc)) {
                console.log('[ResetWAN] Home page -> clicking Advanced');
                const oldDoc = doc;
                const advBtn = document.getElementById(CONFIG.ADVANCED_MENU_ID);
                if (!advBtn) throw new Error('Advanced menu item not found');
                advBtn.click();
                doc = await waitForFreshTable(oldDoc, 15000);
            }

            // Always (re)open the connection fresh — this is the "regrab"
            // step that fixed the invalid-token error.
            console.log('[ResetWAN] Opening connection (disable pass)');
            doc = await openConnection(doc);

            setEnabledAndApply(doc, false); // uncheck + apply

            console.log('[ResetWAN] Waiting for round trip back to WAN table...');
            const docAfterDisable = doc;
            doc = await waitForFreshTable(docAfterDisable, 15000);

            console.log('[ResetWAN] Re-opening connection (enable pass)');
            doc = await openConnection(doc);

            setEnabledAndApply(doc, true); // re-check + apply

            console.log('[ResetWAN] Done. Press again any time to cycle again.');
        } catch (err) {
            console.error('[ResetWAN] Failed:', err);
            alert('Reset WAN failed: ' + err.message);
        } finally {
            btnEl.disabled = false;
        }
    }

    function addButton() {
        if (document.getElementById('resetWanBtn')) return;
        const guide = document.getElementById('configguide');
        if (!guide) return;

        const btn = document.createElement('span');
        btn.id = 'resetWanBtn';
        btn.setAttribute('style', [
            'display: inline-block !important',
            'position: static !important',
            'float: none !important',
            'white-space: nowrap !important',
            'width: auto !important',
            'height: auto !important',
            'margin-left: 20px !important',
            'padding: 3px 10px !important',
            'background-color: #2ecc71 !important',
            'border: 2px solid #ffffff !important',
            'border-radius: 5px !important',
            'color: white !important',
            'cursor: pointer !important',
            'font-size: 12px !important',
            'font-weight: bold !important',
            'vertical-align: middle !important',
        ].join('; '));
        btn.textContent = 'Reset WAN';
        btn.onclick = function (e) {
            e.preventDefault();
            resetWan(btn);
        };
        guide.parentNode.insertBefore(btn, guide.nextSibling);
    }

    if (window.top === window.self) {
        setInterval(addButton, 1000);
    }
})();