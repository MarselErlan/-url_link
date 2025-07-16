# Job Application Tracker Chrome Extension

A Chrome extension that helps you track job applications in real-time with PostgreSQL backend integration. Never forget which jobs you've applied to!

## Features

- **Real-time URL tracking**: Automatically detects when you visit job application pages
- **Visual indicators**: Shows badges and indicators for applied/not applied jobs
- **Statistics dashboard**: View total URLs, applied count, and not applied count
- **Notes support**: Add notes to each job application
- **PostgreSQL backend**: Persistent storage with Railway deployment
- **Modern UI**: Clean, non-intrusive popup interface
- **Auto-sync**: Updates status across all tabs in real-time

## Project Structure

```
url_link/
├── backend/              # Node.js API server
│   ├── server.js        # Main server file
│   ├── package.json     # Dependencies
│   └── railway.json     # Railway deployment config
├── chrome-extension/     # Chrome extension files
│   ├── manifest.json    # Extension manifest
│   ├── popup.html       # Popup interface
│   ├── popup.js         # Popup logic
│   ├── background.js    # Background service worker
│   ├── content.js       # Content script
│   └── create-icons.js  # Icon generation script
└── README.md
```

## Setup Instructions

### 1. Backend Deployment (Railway)

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Deploy to Railway**:

   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory
   - Railway will automatically detect and deploy your Node.js app
   - The PostgreSQL database is already configured in the connection string

4. **Set environment variables** (optional):

   ```
   DATABASE_URL=postgresql://postgres:OZNHVfQlRwGhcUBFmkVluOzTonqTpIKa@interchange.proxy.rlwy.net:30153/railway
   PORT=3000
   ```

5. **Get your Railway URL**:
   - After deployment, you'll get a URL like: `https://your-app-name.up.railway.app`

### 2. Chrome Extension Setup

1. **Update API URL**:

   - Open `chrome-extension/popup.js`
   - Replace `https://your-railway-app.up.railway.app` with your actual Railway URL
   - Open `chrome-extension/background.js`
   - Replace the same URL there

2. **Create icon files**:

   ```bash
   cd chrome-extension
   node create-icons.js
   ```

   Then convert the generated SVG files to PNG format (16x16, 48x48, 128x128)

3. **Install Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

## Usage

### Extension Features

1. **Automatic Detection**: The extension automatically detects job sites and tracks URLs
2. **Visual Badges**:

   - ✓ Green badge = Applied
   - ! Orange badge = Not Applied
   - No badge = Not tracked

3. **Popup Interface**:

   - Click the extension icon to open the popup
   - View current page status
   - Mark as applied/not applied
   - Add notes
   - View statistics

4. **Keyboard Shortcut**: Press `Ctrl+Shift+J` to open the popup quickly

### API Endpoints

- `GET /api/status/:url` - Get application status for a URL
- `POST /api/applications` - Save/update application status
- `GET /api/stats` - Get overall statistics
- `GET /api/recent` - Get recent applications
- `DELETE /api/applications/:id` - Delete application
- `GET /health` - Health check

### Database Schema

```sql
CREATE TABLE job_applications (
  id SERIAL PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  applied BOOLEAN DEFAULT false,
  applied_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
```

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev  # Starts nodemon for development
```

### Extension Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click reload button on your extension
4. Test changes

## Supported Job Sites

The extension automatically detects these job sites:

- LinkedIn
- Indeed
- Glassdoor
- Monster
- CareerBuilder
- ZipRecruiter
- Dice
- Stack Overflow Jobs
- AngelList/Wellfound
- Lever
- Greenhouse
- Workday
- And many more...

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)

### Extension Configuration

Update the `API_BASE_URL` in both `popup.js` and `background.js` to match your Railway deployment URL.

## Troubleshooting

1. **Extension not loading**: Check console for errors, ensure all files are present
2. **API connection issues**: Verify Railway URL is correct and server is running
3. **Database connection**: Ensure PostgreSQL connection string is valid
4. **CORS issues**: Backend already configured with CORS, check if API URL is correct

## Security Notes

- The extension only tracks HTTP/HTTPS URLs
- All data is stored in your private PostgreSQL database
- No data is shared with third parties
- Extension requests minimal permissions

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Verify all setup steps are completed
3. Check browser console for errors
4. Ensure Railway deployment is successful

---

**Happy job hunting!** 🎯
# -url_link
