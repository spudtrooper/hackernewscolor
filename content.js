// Debugging configuration
let DEBUG = false;
let isProcessing = false;
let SORT_BY = 'points'; // points, comments, or time
let SORT_ORDER = 'desc'; // desc or asc

// Listen for setting changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.debugMode) {
    DEBUG = changes.debugMode.newValue;
    log('Debug mode changed to:', DEBUG);
  }
  if (changes.sortBy) {
    SORT_BY = changes.sortBy.newValue;
    log('Sort by changed to:', SORT_BY);
    sortAndColorizeHN();
  }
  if (changes.sortOrder) {
    SORT_ORDER = changes.sortOrder.newValue;
    log('Sort order changed to:', SORT_ORDER);
    sortAndColorizeHN();
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

const run = () => {

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
}


// Load settings from storage
chrome.storage.sync.get(['debugMode', 'sortBy', 'sortOrder'], (result) => {
  DEBUG = result.debugMode || false;
  SORT_BY = result.sortBy || 'points';
  SORT_ORDER = result.sortOrder || 'desc';
  log('Settings loaded - Debug:', DEBUG, 'Sort by:', SORT_BY, 'Sort order:', SORT_ORDER);

  run();
});
