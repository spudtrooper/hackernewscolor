// Load current settings
chrome.storage.sync.get(['debugMode', 'sortBy', 'sortOrder'], (result) => {
  const debugToggle = document.getElementById('debugToggle');
  debugToggle.checked = result.debugMode || false;
  
  const sortBy = document.getElementById('sortBy');
  sortBy.value = result.sortBy || 'points';
  
  const sortOrder = document.getElementById('sortOrder');
  sortOrder.value = result.sortOrder || 'desc';
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
