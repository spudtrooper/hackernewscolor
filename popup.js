// Load current debug mode setting
chrome.storage.sync.get(['debugMode'], (result) => {
  const debugToggle = document.getElementById('debugToggle');
  debugToggle.checked = result.debugMode || false;
});

// Save debug mode setting when toggled
document.getElementById('debugToggle').addEventListener('change', (event) => {
  const debugMode = event.target.checked;
  chrome.storage.sync.set({ debugMode }, () => {
    console.log('Debug mode set to:', debugMode);
  });
});
