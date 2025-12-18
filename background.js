// Background service worker for Focus Flow
console.log('[Focus Flow BG] Background service worker starting...');

// Store blocked sites in memory for fast access
let blockedSites = [];

// Load blocked sites from storage
function loadBlockedSites() {
    chrome.storage.local.get(['blockedSites'], (result) => {
        blockedSites = result.blockedSites || [];
        console.log('[Focus Flow BG] Loaded blocked sites:', blockedSites);
        updateRedirectRules();
    });
}

// Update declarativeNetRequest rules based on blocked sites
async function updateRedirectRules() {
    console.log('[Focus Flow BG] Updating redirect rules for sites:', blockedSites);

    // Get existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    console.log('[Focus Flow BG] Removing existing rules:', existingRuleIds);

    // Remove all existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
    });

    if (blockedSites.length === 0) {
        console.log('[Focus Flow BG] No sites to block');
        return;
    }

    // Create new rules for each blocked site
    const newRules = [];
    let ruleId = 1;

    blockedSites.forEach((site) => {
        // Rule for www.site.com and subdomains
        newRules.push({
            id: ruleId++,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    extensionPath: '/blocked.html?site=' + encodeURIComponent(site)
                }
            },
            condition: {
                urlFilter: '||' + site,
                resourceTypes: ['main_frame']
            }
        });
    });

    console.log('[Focus Flow BG] Adding new rules:', newRules);

    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: newRules
        });
        console.log('[Focus Flow BG] Rules updated successfully');
    } catch (err) {
        console.error('[Focus Flow BG] Error adding rules:', err);
    }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Focus Flow BG] Extension installed');
    chrome.storage.local.get(['blockedSites'], (result) => {
        if (!result.blockedSites) {
            chrome.storage.local.set({ blockedSites: [] });
        }
        loadBlockedSites();
    });
});

// Load on startup
chrome.runtime.onStartup.addListener(() => {
    console.log('[Focus Flow BG] Extension started');
    loadBlockedSites();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('[Focus Flow BG] Storage changed:', changes);
    if (namespace === 'local' && changes.blockedSites) {
        blockedSites = changes.blockedSites.newValue || [];
        console.log('[Focus Flow BG] Blocked sites updated:', blockedSites);
        updateRedirectRules();
    }
});

console.log('[Focus Flow BG] Background service worker ready');
