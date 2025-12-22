# HN Points Sorter & Colorizer

A Chrome extension that sorts Hacker News articles by points and colorizes the point scores based on their value.

## Features

- **Automatic Sorting**: Articles are sorted by points in descending order (highest first)
- **Color Coding**: Point scores are colorized from gray (low points) to red (high points)
- **Bold Text**: Higher point scores are displayed in bolder text (400-900 font weight)
- **Dynamic Updates**: Works with "More" link pagination

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/Users/jeff/Projects/hackernewscolor` directory
5. Visit [Hacker News](https://news.ycombinator.com/) to see it in action

## How It Works

The extension uses a content script that:
- Detects all articles on the page
- Extracts point values from each article
- Sorts them by points (descending)
- Reorders the DOM elements
- Applies color and font-weight styling based on point ratio to maximum points
