// Sort and colorize Hacker News articles by points
function sortAndColorizeHN() {
  const itemlist = document.querySelector('.itemlist');
  if (!itemlist) return;

  // Get all article rows (athing elements)
  const articles = Array.from(document.querySelectorAll('.athing'));
  
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

  // Find max points for color scaling
  const maxPoints = Math.max(...articleData.map(item => item.points), 1);

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
    }
  });
}

// Run on page load
sortAndColorizeHN();

// Re-run when DOM changes (for "More" link loads)
const observer = new MutationObserver(() => {
  sortAndColorizeHN();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
