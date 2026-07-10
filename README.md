# Tauranga Zinc Electroplaters - React App

✅ **COMPLETE** - Full React + TypeScript + Tailwind CSS conversion

## 🎉 All Features Implemented

- ✅ Job Management with PO scanning (Claude AI)
- ✅ Customer autocomplete (179 contacts)
- ✅ Part matching (2,763 inventory items)
- ✅ JIG capacity tracking (configurable 1-20 JIGs)
- ✅ Dispatch with FPN & CSV generation
- ✅ Settings & configuration
- ✅ LocalStorage persistence
- ✅ Toast notifications & lightbox
- ✅ Tailwind CSS styling

## 🚀 Quick Start

```bash
npm run dev
```

Visit http://localhost:3000

## 📱 Mobile USB Debugging (Android)

For debugging mobile-specific issues (like the intake carousel):

### 1. Enable Developer Mode on Android
- Go to **Settings → About Phone**
- Tap **Build Number** 7 times until it says "You are now a developer"
- Go back to **Settings → System → Developer Options**
- Enable **USB Debugging**

### 2. Connect via USB
- Plug your Android phone into your Mac via USB
- On your phone, tap **Allow USB Debugging** when prompted
- Select **File Transfer** or **PTP** mode (not just charging)

### 3. Install Android Platform Tools (one-time setup)
```bash
brew install android-platform-tools
```

### 4. Set up port forwarding
```bash
# If you get "more than one device" error, kill any emulators first:
adb kill-server && adb start-server

# List connected devices
adb devices

# Forward port 3000 to your device (replace DEVICE_ID with your device ID from above)
adb -s DEVICE_ID reverse tcp:3000 tcp:3000

# Or if only one device is connected:
adb reverse tcp:3000 tcp:3000
```

### 5. Start dev server and open on phone
```bash
npm run dev
```

On your Android phone, open Chrome and go to: `http://localhost:3000`

### 6. Access Chrome DevTools on your Mac
- Open Chrome on your Mac
- Go to: `chrome://inspect/#devices`
- You'll see your Android device listed with open tabs
- Click **"inspect"** next to the localhost:3000 tab
- Chrome DevTools will open showing Console, Network, Elements, etc.

### 7. Debug in real-time
- Keep DevTools open on your Mac
- Use the app on your phone
- All console.log, errors, and warnings appear in the Console tab
- You can inspect elements, debug with breakpoints, and monitor network requests

**Quick setup command:**
```bash
adb devices && adb reverse tcp:3000 tcp:3000 && npm run dev
```

## 📝 First Steps

1. Go to Settings (🔧)
2. Add your Anthropic API key
3. Go to New Job (📥)
4. Click "+ New Job"
5. Scan a PO or enter manually

## 📦 What's Inside

- **12 React Components** - All views complete
- **5 Utility Modules** - API, storage, helpers, exports, constants
- **Full TypeScript** - Type-safe throughout
- **179 Contacts** - Pre-loaded customer data
- **2,763 Items** - Xero inventory catalog
- **Claude AI** - PO document scanning with special rules

## 🔑 Key Features

### PO Scanning
- Automatic customer & parts extraction
- Patchell Industries G/I correction
- HDP prefix stripping (8.088. format)
- Baytex reference extraction
- Smart part matching with fallbacks

### Price Calculation
- Weight-based ($/kg configurable)
- JIG percentage pricing
- String charges
- Freight support
- Minimum charges
- Price overrides

### Export Generation
- FPN HTML with embedded logo
- Xero CSV batch export
- Professional styling

## 📱 App Structure

```
src/
├── components/      # 12 React components
├── utils/           # 5 utility modules
├── types/           # TypeScript definitions
└── data/            # Contacts, items, logo
```

## 🎨 Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Claude AI (Sonnet 3.5)
- React Query

---

**Dev Server**: http://localhost:3000
