# HN Points Sorter & Colorizer

A Chrome extension that sorts Hacker News articles by points and colorizes the point scores based on their value.

## Features

- **Automatic Sorting**: Articles are sorted by points in descending order (highest first)
- **Color Coding**: Point scores are colorized from gray (low points) to red (high points)
- **Bold Text**: Higher point scores are displayed in bolder text (400-900 font weight)
- **Dynamic Updates**: Works with "More" link pagination
- **Debug Mode**: Toggle debugging logs via the extension popup

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory
5. Visit [Hacker News](https://news.ycombinator.com/) to see it in action

## Debug Mode

Click the extension icon in Chrome to toggle debug mode on/off. When enabled, you'll see detailed console logs about:
- Article detection and counting
- Point ranges and sorting
- Color/weight calculations for top articles
- DOM mutation detection

Open Chrome DevTools (F12) to view the logs prefixed with `[HN Sorter]`.

## How It Works

The extension uses a content script that:
- Detects all articles on the page
- Extracts point values from each article
- Sorts them by points (descending)
- Reorders the DOM elements
- Applies color and font-weight styling based on point ratio to maximum points

## Versions

### 1.0

- First release

### 1.1.1

- Progess bars

### 1.1.2

- Load more pages
