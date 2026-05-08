# Setup & Installation Guide

## Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No build tools or server required
- Internet connection (for CDN libraries)

## Installation Methods

### Method 1: Direct File Download (Easiest)

1. Download all files from GitHub
2. Keep folder structure intact:
   ```
   simplified/
   ├── Core/
   │   ├── E-Engine.js
   │   └── StorageManager.js
   ├── Modules/
   │   ├── Home.html
   │   ├── Notebook.html
   │   ├── Editor.html
   │   ├── Jevis.html
   │   ├── Page.html
   │   └── Setting.html
   ├── index.html
   └── README.md
   ```
3. Open `index.html` in your browser
4. That's it! Start using the app

### Method 2: Git Clone

```bash
# Clone repository
git clone https://github.com/yiasersk-design/simplified.git

# Navigate to directory
cd simplified

# Open in browser (MacOS)
open index.html

# Open in browser (Windows)
start index.html

# Open in browser (Linux)
xdg-open index.html
```

### Method 3: Local Server (Recommended)

**Using Python 3:**
```bash
cd simplified
python -m http.server 8000
# Visit: http://localhost:8000
```

**Using Node.js:**
```bash
cd simplified
npx http-server
# Visit: http://localhost:8080
```

**Using PHP:**
```bash
cd simplified
php -S localhost:8000
# Visit: http://localhost:8000
```

## First Time Setup

1. **Initialize Storage:**
   - Open `index.html`
   - App automatically initializes LocalStorage
   - Browser may ask for permission (allow it)

2. **Create First Note:**
   - Click "+" button on Home page
   - Enter note name
   - Click "Create"

3. **Add Q&A Entries:**
   - Go to Notebook tab
   - Type question in input field
   - Press Enter or click Send
   - Add answer in same way

4. **Customize Note:**
   - Go to Editor
   - Use templates on bottom
   - Apply formatting from toolbar
   - Adjust colors, fonts, spacing

## Troubleshooting

### Issue: Page doesn't load
- **Solution:** Ensure all files are in correct folders
- Check browser console (F12) for errors
- Try a different browser
- Clear cache and reload

### Issue: Data not saving
- **Solution:** Check browser's LocalStorage is enabled
- Settings → Privacy → Allow LocalStorage
- Try clearing browser cache
- Use private/incognito mode (temporary)

### Issue: UI looks broken
- **Solution:** Zoom out browser (Ctrl+Minus or Cmd+Minus)
- Check screen size (responsive design requires 320px+ width)
- Disable browser extensions
- Use latest browser version

### Issue: Stuck on loading page
- **Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Close and reopen browser
- Try different browser

### Issue: Can't import files
- **Solution:** Ensure JSON format is correct
- File size must be under browser limit (~5-10MB)
- Try exporting and re-importing test data
- Use Firefox if Chrome fails

## Performance Optimization

### Browser Settings
- Enable hardware acceleration
- Disable unnecessary extensions
- Use latest browser version
- Allocate enough RAM

### Storage Management
- Periodically export and backup data
- Delete old notes to save storage
- Clear browser cache monthly
- Monitor app data size in storage

### Network
- Use 5G or strong Wi-Fi for AI features
- Disable VPN if experiencing slowness
- Check internet speed (speedtest.net)

## Security Notes

⚠️ **Important:**
- All data is stored locally on your device
- Never share browser storage or exported files
- Use strong passwords if sharing device
- Export and backup important notes regularly

## Advanced Configuration

### Enable Debug Mode
```javascript
// Open browser console (F12)
// Paste this:
console.log(StorageManager.debug());
```

### Export All Data
```javascript
// In browser console:
const data = StorageManager.exportData();
console.log(data);
// Copy and save to file
```

### Reset App to Default
```javascript
// In browser console:
StorageManager.clearAll();
window.location.reload();
```

## Tips & Tricks

1. **Keyboard Shortcuts:**
   - `Enter` - Save Q&A entry
   - `Ctrl+S` - Manual save (if supported)
   - `Ctrl+Z` - Undo in Editor
   - `Ctrl+Shift+Z` - Redo in Editor

2. **Productivity:**
   - Create templates for common note types
   - Use Q&A format for better organization
   - Export important notes as PDF
   - Regular backups prevent data loss

3. **Customization:**
   - Change fonts in Settings
   - Create custom Q/A labels
   - Configure API keys for AI
   - Adjust color scheme (coming soon)

## Browser LocalStorage Limits

| Browser | Limit | Status |
|---------|-------|--------|
| Chrome | ~10MB | ✅ Sufficient |
| Firefox | ~10MB | ✅ Sufficient |
| Safari | ~5MB | ⚠️ May limit |
| Edge | ~10MB | ✅ Sufficient |
| Mobile Safari | ~5MB | ⚠️ May limit |

## Support & Help

### Common Questions

**Q: Is my data safe?**
A: Yes, all data is stored locally on your device and never sent to servers.

**Q: Can I access my notes on another device?**
A: Yes, export from one device and import on another using Settings page.

**Q: How do I backup my data?**
A: Go to Settings → Click export button to download JSON backup.

**Q: Can I share notes with others?**
A: Export note as image/PDF and share the file.

**Q: What happens if I clear browser data?**
A: All app data will be lost. Always export backups first.

### Getting Help

1. Check [README.md](README.md) for documentation
2. Review browser console for error messages
3. Try troubleshooting steps above
4. Search GitHub issues
5. Create new issue with details

## Updates & Maintenance

### Checking for Updates
- Visit GitHub repo for latest version
- Compare version numbers
- Download new files
- Keep backup of old version

### Updating to New Version
1. Backup current data (export)
2. Download new files
3. Replace old files
4. Clear browser cache
5. Reload page
6. Import backup if needed

## Development

### For Developers

The app is built with vanilla JavaScript - no build process needed!

```javascript
// Import core engine
<script src="../Core/StorageManager.js"></script>
<script src="../Core/E-Engine.js"></script>

// Usage
StorageManager.set(StorageManager.KEYS.PROFILE_DATA, {...});
window.EEngine.init();
```

### File Structure for Development
```
Core/
├── E-Engine.js - Main application engine
└── StorageManager.js - Data management

Modules/
├── Home.html - Dashboard
├── Notebook.html - Q&A editor
├── Editor.html - Canvas editor
├── Jevis.html - AI interface
├── Page.html - Templates
└── Setting.html - Settings

Styles/ (if separated)
└── Global styles and utilities

Utils/ (if separated)
└── Helper functions and utilities
```

---

**Need help?** Check the troubleshooting section above or open an issue on GitHub.

**Last Updated:** May 8, 2026
