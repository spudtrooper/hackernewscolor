// Load current settings
chrome.storage.sync.get(['debugMode', 'sortBy', 'sortOrder', 'showProgressBar', 'loadMorePages'], (result) => {
  const debugToggle = document.getElementById('debugToggle');
  debugToggle.checked = result.debugMode || false;
  
  const sortBy = document.getElementById('sortBy');
  sortBy.value = result.sortBy || 'points';
  
  const sortOrder = document.getElementById('sortOrder');
  sortOrder.value = result.sortOrder || 'desc';
  
  const showProgressBar = document.getElementById('showProgressBar');
  showProgressBar.checked = result.showProgressBar || false;
  
  const loadMorePages = document.getElementById('loadMorePages');
  const loadMorePagesValue = document.getElementById('loadMorePagesValue');
  loadMorePages.value = result.loadMorePages || 0;
  loadMorePagesValue.textContent = result.loadMorePages || 0;
});

// Save debug mode setting when toggled
document.getElementById('debugToggle').addEventListener('change', (event) => {
  const debugMode = event.target.checked;
  chrome.storage.sync.set({ debugMode }, () => {
    console.log('Debug mode set to:', debugMode);
  });
});

// Save sort by setting when changed
document.getElementById('sortBy').addEventListener('change', (event) => {
  const sortBy = event.target.value;
  chrome.storage.sync.set({ sortBy }, () => {
    console.log('Sort by set to:', sortBy);
  });
});

// Save sort order setting when changed
document.getElementById('sortOrder').addEventListener('change', (event) => {
  const sortOrder = event.target.value;
  chrome.storage.sync.set({ sortOrder }, () => {
    console.log('Sort order set to:', sortOrder);
  });
});

// Save show progress bar setting when toggled
document.getElementById('showProgressBar').addEventListener('change', (event) => {
  const showProgressBar = event.target.checked;
  chrome.storage.sync.set({ showProgressBar }, () => {
    console.log('Show progress bar set to:', showProgressBar);
  });
});

// Update display and save load more pages setting when slider moves
document.getElementById('loadMorePages').addEventListener('input', (event) => {
  const loadMorePages = parseInt(event.target.value) || 0;
  document.getElementById('loadMorePagesValue').textContent = loadMorePages;
  chrome.storage.sync.set({ loadMorePages }, () => {
    console.log('Load more pages set to:', loadMorePages);
  });
});

// Quick-load buttons: one-time page load without changing the setting
document.querySelectorAll('.quick-load-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pages = parseInt(btn.dataset.pages);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'quickLoad', pages });
      }
    });
  });
});

// Reset all settings to defaults
document.getElementById('resetDefaults').addEventListener('click', () => {
  const defaults = {
    debugMode: false,
    sortBy: 'points',
    sortOrder: 'desc',
    showProgressBar: false,
    loadMorePages: 0
  };
  
  chrome.storage.sync.set(defaults, () => {
    // Update UI to reflect defaults
    document.getElementById('debugToggle').checked = defaults.debugMode;
    document.getElementById('sortBy').value = defaults.sortBy;
    document.getElementById('sortOrder').value = defaults.sortOrder;
    document.getElementById('showProgressBar').checked = defaults.showProgressBar;
    document.getElementById('loadMorePages').value = defaults.loadMorePages;
    document.getElementById('loadMorePagesValue').textContent = defaults.loadMorePages;
    
    console.log('Settings reset to defaults');
  });
});
