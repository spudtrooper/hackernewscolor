// Debugging configuration
let DEBUG = false;
let isProcessing = false;

// Load debug setting from storage
chrome.storage.sync.get(['debugMode'], (result) => {
  DEBUG = result.debugMode || false;
  log('Debug mode loaded:', DEBUG);
});

// Listen for debug setting changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.debugMode) {
    DEBUG = changes.debugMode.newValue;
    log('Debug mode changed to:', DEBUG);
  }
});

// Debug logger
function log(...args) {
  if (DEBUG) {
    console.log('[HN Sorter]', ...args);
  }
}

// Sort and colorize Hacker News articles by points
function sortAndColorizeHN() {
  if (isProcessing) {
    log('Already processing, skipping');
    return;
  }
  
  isProcessing = true;
  log('Starting sort and colorize');
  
  const itemlist = document.querySelector('.itemlist');
  if (!itemlist) {
    log('No itemlist found');
    isProcessing = false;
    return;
  }

  // Get all article rows (athing elements)
  const articles = Array.from(document.querySelectorAll('.athing'));
  log(`Found ${articles.length} articles`);
  
  // Create array of article data with their associated subtext rows
  const articleData = articles.map(article => {
    const subtextRow = article.nextElementSibling;
    const scoreElement = subtextRow?.querySelector('.score');
    const points = scoreElement ? parseInt(scoreElement.textContent) : 0;
    
    return {
      article,
      subtextRow,
      spacerRow: subtextRow?.nextElementSibling, // The spacer <tr> after subtext
      points,
      scoreElement
    };
  });

  // Sort by points (descending)
  articleData.sort((a, b) => b.points - a.points);
  log('Articles sorted. Point range:', 
    Math.min(...articleData.map(item => item.points)),
    'to',
    Math.max(...articleData.map(item => item.points))
  );

  // Find max points for color scaling
  const maxPoints = Math.max(...articleData.map(item => item.points), 1);
  log('Max points:', maxPoints);

  // Reorder in DOM and apply colorization
  articleData.forEach((item, index) => {
    // Append back in sorted order
    itemlist.appendChild(item.article);
    if (item.subtextRow) {
      itemlist.appendChild(item.subtextRow);
    }
    if (item.spacerRow) {
      itemlist.appendChild(item.spacerRow);
    }

    // Colorize the score element
    if (item.scoreElement && item.points > 0) {
      const ratio = item.points / maxPoints;
      
      // Color: interpolate from gray (low) to red (high)
      const red = Math.floor(128 + (127 * ratio)); // 128-255
      const green = Math.floor(128 * (1 - ratio)); // 128-0
      const blue = Math.floor(128 * (1 - ratio)); // 128-0
      
      // Font weight: interpolate from normal (400) to bold (900)
      const fontWeight = Math.floor(400 + (500 * ratio));
      
      item.scoreElement.style.color = `rgb(${red}, ${green}, ${blue})`;
      item.scoreElement.style.fontWeight = fontWeight;
      item.scoreElement.style.transition = 'all 0.3s ease';
      
      if (index < 3) { // Log first 3 for debugging
        log(`Article #${index + 1}: ${item.points} points, ratio: ${ratio.toFixed(2)}, color: rgb(${red}, ${green}, ${blue}), weight: ${fontWeight}`);
      }
    }
  });
  
  log('Sort and colorize complete');
  isProcessing = false;
}

// Run on page load
log('Extension loaded');
sortAndColorizeHN();

// Re-run when DOM changes (for "More" link loads)
let mutationTimeout;
const observer = new MutationObserver(() => {
  // Debounce mutations to avoid infinite loop
  clearTimeout(mutationTimeout);
  mutationTimeout = setTimeout(() => {
    log('DOM mutation detected (debounced)');
    sortAndColorizeHN();
  }, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
