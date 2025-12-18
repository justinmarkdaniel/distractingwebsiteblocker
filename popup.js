document.addEventListener('DOMContentLoaded', () => {
    const siteInput = document.getElementById('siteInput');
    const blockBtn = document.getElementById('blockSite');
    const statusEl = document.getElementById('status');
    const siteList = document.getElementById('siteList');

    // Load and display blocked sites
    loadBlockedSites();

    // Block site button click
    blockBtn.addEventListener('click', () => {
        const site = normalizeSite(siteInput.value.trim());

        if (!site) {
            showStatus('Please enter a valid site', 'error');
            return;
        }

        chrome.storage.local.get(['blockedSites'], (result) => {
            const sites = result.blockedSites || [];

            if (sites.includes(site)) {
                showStatus('Site already blocked', 'error');
                return;
            }

            sites.push(site);
            chrome.storage.local.set({ blockedSites: sites }, () => {
                showStatus('Site blocked!', 'success');
                siteInput.value = '';
                loadBlockedSites();
            });
        });
    });

    // Enter key to add site
    siteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            blockBtn.click();
        }
    });

    function normalizeSite(input) {
        if (!input) return '';

        // Remove protocol if present
        let site = input.replace(/^https?:\/\//, '');
        // Remove www. prefix
        site = site.replace(/^www\./, '');
        // Remove path
        site = site.split('/')[0];
        // Remove port
        site = site.split(':')[0];
        // Lowercase
        site = site.toLowerCase();

        return site;
    }

    function loadBlockedSites() {
        chrome.storage.local.get(['blockedSites'], (result) => {
            const sites = result.blockedSites || [];

            if (sites.length === 0) {
                siteList.innerHTML = '<p class="empty-state">No sites blocked yet</p>';
                return;
            }

            siteList.innerHTML = sites.map(site => `
                <div class="site-item">
                    <span class="site-name">${escapeHtml(site)}</span>
                    <button class="remove-btn" data-site="${escapeHtml(site)}" title="Unblock">&times;</button>
                </div>
            `).join('');

            // Add remove handlers
            siteList.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const siteToRemove = btn.getAttribute('data-site');
                    removeSite(siteToRemove);
                });
            });
        });
    }

    function removeSite(site) {
        chrome.storage.local.get(['blockedSites'], (result) => {
            const sites = result.blockedSites || [];
            const filtered = sites.filter(s => s !== site);

            chrome.storage.local.set({ blockedSites: filtered }, () => {
                showStatus('Site unblocked', 'success');
                loadBlockedSites();
            });
        });
    }

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = 'status-message ' + type;

        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status-message';
        }, 2500);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
