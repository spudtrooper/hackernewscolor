// Debugging configuration
let DEBUG = false;
let isProcessing = false;
let SORT_BY = 'points'; // points, comments, or time
let SORT_ORDER = 'desc'; // desc or asc
let SHOW_PROGRESS_BAR = false;
let LOAD_MORE_PAGES = 0;

// LocalStorage keys for accumulating pages
const LS_KEY_STATE = 'hn_sorter_state';
const LS_KEY_ARTICLES = 'hn_sorter_articles';

// Listen for setting changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.debugMode) {
    DEBUG = changes.debugMode.newValue;
    log('Debug mode changed to:', DEBUG);
  }
  if (changes.sortBy || changes.sortOrder || changes.showProgressBar || changes.loadMorePages) {
    log('Settings changed, clearing state and reloading page');
    localStorage.removeItem(LS_KEY_STATE);
    localStorage.removeItem(LS_KEY_ARTICLES);
    window.location.reload();
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

  const bigbox = document.querySelector('#bigbox');
  if (!bigbox) {
    log('No bigbox found');
    isProcessing = false;
    return;
  }

  // Get all article rows (athing elements with class 'submission')
  const articles = Array.from(document.querySelectorAll('tr.athing'));
  log(`Found ${articles.length} articles`);
  
  // Create array of article data with their associated subtext rows
  const articleData = articles.map(article => {
    // The next row contains the subtext with score
    const subtextRow = article.nextElementSibling;
    const scoreElement = subtextRow?.querySelector('.score');
    
    // Extract points - format is "X points" or might not exist
    let points = 0;
    if (scoreElement) {
      const scoreText = scoreElement.textContent.trim();
      const match = scoreText.match(/(\d+)\s*points?/);
      if (match) {
        points = parseInt(match[1]);
      }
    }
    
    // Extract comments count - format is "X comments" or "discuss"
    let comments = 0;
    const commentsLink = subtextRow?.querySelectorAll('a');
    if (commentsLink) {
      for (const link of commentsLink) {
        const text = link.textContent.trim();
        if (text.includes('comment')) {
          const match = text.match(/(\d+)/);
          if (match) {
            comments = parseInt(match[1]);
          }
          break;
        } else if (text === 'discuss') {
          comments = 0;
          break;
        }
      }
    }
    
    // Extract time - get the age element
    const ageElement = subtextRow?.querySelector('.age');
    let timeValue = 0;
    if (ageElement) {
      const ageText = ageElement.textContent.trim();
      // Parse relative time into minutes for sorting
      // Format: "X minutes ago", "X hours ago", "X days ago"
      const minutesMatch = ageText.match(/(\d+)\s*minute/);
      const hoursMatch = ageText.match(/(\d+)\s*hour/);
      const daysMatch = ageText.match(/(\d+)\s*day/);
      
      if (minutesMatch) {
        timeValue = parseInt(minutesMatch[1]);
      } else if (hoursMatch) {
        timeValue = parseInt(hoursMatch[1]) * 60;
      } else if (daysMatch) {
        timeValue = parseInt(daysMatch[1]) * 60 * 24;
      }
    }
    
    // The spacer row follows the subtext
    const spacerRow = subtextRow?.nextElementSibling;
    
    return {
      article,
      subtextRow,
      spacerRow,
      points,
      comments,
      timeValue,
      scoreElement
    };
  });

  // Sort by selected criteria and order
  articleData.sort((a, b) => {
    let aValue, bValue;
    
    switch (SORT_BY) {
      case 'comments':
        aValue = a.comments;
        bValue = b.comments;
        break;
      case 'time':
        aValue = a.timeValue;
        bValue = b.timeValue;
        break;
      case 'points':
      default:
        aValue = a.points;
        bValue = b.points;
        break;
    }
    
    // Apply sort order
    if (SORT_ORDER === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
  
  log(`Articles sorted by ${SORT_BY} (${SORT_ORDER}). Range:`,
    Math.min(...articleData.map(item => {
      switch (SORT_BY) {
        case 'comments': return item.comments;
        case 'time': return item.timeValue;
        default: return item.points;
      }
    })),
    'to',
    Math.max(...articleData.map(item => {
      switch (SORT_BY) {
        case 'comments': return item.comments;
        case 'time': return item.timeValue;
        default: return item.points;
      }
    }))
  );

  // Find max points for color scaling
  const maxPoints = Math.max(...articleData.map(item => item.points), 1);
  log('Max points:', maxPoints);

  // Reorder in DOM and apply colorization
  articleData.forEach((item, index) => {
    // Append back in sorted order
    bigbox.appendChild(item.article);
    if (item.subtextRow) {
      bigbox.appendChild(item.subtextRow);
    }
    if (item.spacerRow) {
      bigbox.appendChild(item.spacerRow);
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

      // Add progress bar before the score if enabled
      if (SHOW_PROGRESS_BAR) {
        // Remove existing progress bar if any
        const existingBar = item.scoreElement.parentElement.querySelector('.hn-progress-bar');
        if (existingBar) {
          existingBar.remove();
        }
        
        // Create progress bar container
        const progressBar = document.createElement('span');
        progressBar.className = 'hn-progress-bar';
        progressBar.style.cssText = `
          display: inline-block;
          width: 50px;
          height: 8px;
          background-color: #e0e0e0;
          border-radius: 4px;
          margin-right: 6px;
          vertical-align: middle;
          overflow: hidden;
        `;
        
        // Create the filled portion
        const progressFill = document.createElement('span');
        progressFill.style.cssText = `
          display: block;
          width: ${ratio * 100}%;
          height: 100%;
          background-color: rgb(${red}, ${green}, ${blue});
          border-radius: 4px;
          transition: width 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        item.scoreElement.parentElement.insertBefore(progressBar, item.scoreElement);
      }

      if (index < 3) { // Log first 3 for debugging
        log(`Article #${index + 1}: ${item.points} points, ratio: ${ratio.toFixed(2)}, color: rgb(${red}, ${green}, ${blue}), weight: ${fontWeight}`);
      }
    }
  });

  // Move the first element, which is a td to the end and wrap
  // in a tr
  const firstTd = bigbox.querySelector('td');
  if (firstTd) {
    const newTr = document.createElement('tr');
    newTr.appendChild(firstTd);
    bigbox.appendChild(newTr);
  }

  log('Sort and colorize complete');
  isProcessing = false;
}

// Extract article HTML for storage
function extractArticleHTML() {
  const articles = Array.from(document.querySelectorAll('tr.athing'));
  const articlesHTML = [];
  
  articles.forEach(article => {
    const subtextRow = article.nextElementSibling;
    const spacerRow = subtextRow?.nextElementSibling;
    
    articlesHTML.push({
      id: article.id, // Store article ID for deduplication
      articleHTML: article.outerHTML,
      subtextHTML: subtextRow ? subtextRow.outerHTML : '',
      spacerHTML: spacerRow ? spacerRow.outerHTML : ''
    });
  });
  
  return articlesHTML;
}

// Remove duplicate articles by ID
function deduplicateArticles(articlesHTML) {
  const seen = new Set();
  return articlesHTML.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

// Inject accumulated articles into the DOM
function injectArticles(articlesHTML) {
  const bigbox = document.querySelector('#bigbox');
  if (!bigbox) return;
  
  articlesHTML.forEach(item => {
    // Create temporary container to parse HTML
    const temp = document.createElement('tbody');
    temp.innerHTML = item.articleHTML + item.subtextHTML + item.spacerHTML;
    
    // Append each row to bigbox
    Array.from(temp.children).forEach(row => {
      bigbox.appendChild(row);
    });
  });
}

// Show loading indicator
function showLoadingIndicator(currentPage, totalPages) {
  let indicator = document.getElementById('hn-loading-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'hn-loading-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff6600;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 9999;
    `;
    document.body.appendChild(indicator);
  }
  indicator.textContent = `Loading page ${currentPage} of ${totalPages}...`;
}

// Remove loading indicator
function hideLoadingIndicator() {
  const indicator = document.getElementById('hn-loading-indicator');
  if (indicator) indicator.remove();
}

const run = () => {
  log('Extension loaded');
  
  // Check for accumulation state in localStorage
  const stateJSON = localStorage.getItem(LS_KEY_STATE);
  let state = stateJSON ? JSON.parse(stateJSON) : null;
  
  // If we have LOAD_MORE_PAGES > 0 and no active state, start accumulation
  if (LOAD_MORE_PAGES > 0 && !state) {
    log(`Starting accumulation for ${LOAD_MORE_PAGES + 1} pages`);
    
    // Initialize state
    state = {
      targetPages: LOAD_MORE_PAGES + 1, // +1 because we count the first page
      currentPage: 1
    };
    localStorage.setItem(LS_KEY_STATE, JSON.stringify(state));
    localStorage.setItem(LS_KEY_ARTICLES, JSON.stringify([]));
  }
  
  // If we're in accumulation mode
  if (state) {
    log(`Accumulation mode: page ${state.currentPage} of ${state.targetPages}`);
    showLoadingIndicator(state.currentPage, state.targetPages);
    
    // Extract current page's articles
    const currentArticles = extractArticleHTML();
    
    // Load previously accumulated articles
    const accumulatedJSON = localStorage.getItem(LS_KEY_ARTICLES);
    const accumulated = accumulatedJSON ? JSON.parse(accumulatedJSON) : [];
    
    // Add current page's articles
    accumulated.push(...currentArticles);
    localStorage.setItem(LS_KEY_ARTICLES, JSON.stringify(accumulated));
    
    log(`Accumulated ${currentArticles.length} articles from page ${state.currentPage}, total: ${accumulated.length}`);
    
    // Check if we need more pages
    if (state.currentPage < state.targetPages) {
      // Find and click the "More" link
      const moreLink = document.querySelector('a.morelink');
      if (moreLink) {
        // Update state for next page
        state.currentPage++;
        localStorage.setItem(LS_KEY_STATE, JSON.stringify(state));
        
        log(`Clicking "More" to load page ${state.currentPage}`);
        // Small delay to ensure state is saved
        setTimeout(() => {
          moreLink.click();
        }, 100);
        return; // Don't run sort/colorize yet
      } else {
        log('No "More" link found, finishing accumulation early');
      }
    }
    
    // Done accumulating - deduplicate and inject all articles
    const deduplicated = deduplicateArticles(accumulated);
    log(`Finished accumulating ${accumulated.length} articles across ${state.currentPage} pages (${deduplicated.length} unique)`);
    hideLoadingIndicator();
    
    // Clear current articles from DOM (we'll re-add them sorted)
    const existingArticles = document.querySelectorAll('tr.athing');
    existingArticles.forEach(article => {
      const subtextRow = article.nextElementSibling;
      const spacerRow = subtextRow?.nextElementSibling;
      article.remove();
      subtextRow?.remove();
      spacerRow?.remove();
    });
    
    // Inject all deduplicated articles
    injectArticles(deduplicated);
    
    // Clear localStorage state
    localStorage.removeItem(LS_KEY_STATE);
    localStorage.removeItem(LS_KEY_ARTICLES);
  }
  
  // Run sort and colorize
  sortAndColorizeHN();

  // Re-run when DOM changes (for manual "More" link clicks)
  let mutationTimeout;
  const observer = new MutationObserver(() => {
    // Debounce mutations to avoid infinite loop
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
      // Don't re-run if we're in accumulation mode
      if (!localStorage.getItem(LS_KEY_STATE)) {
        log('DOM mutation detected (debounced)');
        sortAndColorizeHN();
      }
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}


// Listen for one-time quick-load messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'quickLoad' && message.pages > 0) {
    log(`Quick-load requested for ${message.pages} extra pages`);
    const state = {
      targetPages: message.pages + 1,
      currentPage: 1
    };
    localStorage.setItem(LS_KEY_STATE, JSON.stringify(state));
    localStorage.setItem(LS_KEY_ARTICLES, JSON.stringify([]));
    window.location.reload();
  }
});

// Load settings from storage
chrome.storage.sync.get(['debugMode', 'sortBy', 'sortOrder', 'showProgressBar', 'loadMorePages'], (result) => {
  DEBUG = result.debugMode || false;
  SORT_BY = result.sortBy || 'points';
  SORT_ORDER = result.sortOrder || 'desc';
  SHOW_PROGRESS_BAR = result.showProgressBar || false;
  LOAD_MORE_PAGES = result.loadMorePages || 0;
  log('Settings loaded - Debug:', DEBUG, 'Sort by:', SORT_BY, 'Sort order:', SORT_ORDER, 'Progress bar:', SHOW_PROGRESS_BAR, 'Load more pages:', LOAD_MORE_PAGES);

  run();
});
