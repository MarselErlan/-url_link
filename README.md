# Job Application Tracker Chrome Extension

A Chrome extension that helps you track your job applications across various job sites. The extension now uses **link click tracking** instead of page reload tracking, making it more effective for modern web applications that use client-side routing.

## Features

### 🔗 Link Click Tracking

- **Real-time link status**: When you click on job-related links, the extension immediately checks if you've already applied to that position
- **Visual indicators**: Links show status badges (✓ Applied / ! Not Applied) when clicked
- **Pre-check functionality**: Links are automatically checked when they become visible on the page
- **Batch processing**: Efficiently checks multiple links at once using the batch API

### 🎯 Smart Detection

- Automatically detects job sites (LinkedIn, Indeed, Glassdoor, etc.)
- Works with modern SPAs (Single Page Applications) that don't reload pages
- Supports dynamic content loading and AJAX navigation

### 📊 Application Management

- Mark applications as "Applied" or "Not Applied"
- Add notes to each application
- View statistics and tracking history
- Real-time badge updates in the extension icon

### 🔄 Manual Refresh

- "Refresh Links" button to manually check all visible links on the current page
- Useful when new content loads dynamically

## How It Works

### Old Logic (Page Reload Tracking)

- ❌ Only worked when pages were reloaded
- ❌ Missed navigation in SPAs like LinkedIn
- ❌ Required full page refresh to detect status

### New Logic (Link Click Tracking)

- ✅ Detects clicks on any job-related links
- ✅ Works with client-side routing and SPAs
- ✅ Shows status immediately when clicking links
- ✅ Pre-checks visible links automatically
- ✅ Supports manual refresh of link statuses

## Supported Job Sites

- LinkedIn
- Indeed
- Glassdoor
- Monster
- CareerBuilder
- ZipRecruiter
- Dice
- Stack Overflow
- Angel.co / Wellfound
- Lever
- Greenhouse
- Workday
- SmartRecruiters
- BambooHR
- Jobvite
- Taleo
- iCIMS
- SuccessFactors
- Recruitee
- Breezy.hr
- Personio
- Teamtailor
- Workable
- Google Careers
- Apple Jobs
- Amazon Jobs
- Microsoft Careers
- Netflix Jobs
- Uber Careers
- Airbnb Careers

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension will appear in your toolbar

## Usage

1. **Browse job sites**: Visit any supported job site
2. **Click links**: When you click on job posting links, status indicators will appear
3. **Mark applications**: Use the extension popup to mark applications as applied/not applied
4. **Add notes**: Include notes about your applications
5. **Refresh links**: Use the "Refresh Links" button to check all visible links

## API Endpoints

### Check Single URL Status

```
GET /api/status/:url
Headers: x-user-id: <user_id>
```

### Check Multiple URLs (Batch)

```
POST /api/status/batch
Headers: x-user-id: <user_id>
Body: { "urls": ["url1", "url2", ...] }
```

### Save Application

```
POST /api/applications
Headers: x-user-id: <user_id>
Body: {
  "url": "job_url",
  "title": "Job Title",
  "applied": true/false,
  "notes": "Optional notes"
}
```

### Get Statistics

```
GET /api/stats
Headers: x-user-id: <user_id>
```

## Technical Details

### Content Script Features

- **Event delegation**: Handles dynamically added links
- **MutationObserver**: Watches for DOM changes
- **Batch API**: Efficiently checks multiple URLs
- **Visual feedback**: Animated status indicators
- **Error handling**: Graceful fallbacks for failed requests

### Background Script

- **Minimal tracking**: Only updates badges for current page
- **Reduced frequency**: Less frequent polling (10 minutes vs 5 minutes)
- **Message handling**: Supports communication with content script

### Backend Enhancements

- **Batch endpoint**: New `/api/status/batch` for efficient multiple URL checking
- **Rate limiting**: Maximum 50 URLs per batch request
- **Error handling**: Individual URL failures don't break batch requests

## Development

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Extension Development

1. Make changes to files in `chrome-extension/`
2. Reload the extension in `chrome://extensions/`
3. Test on supported job sites

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
