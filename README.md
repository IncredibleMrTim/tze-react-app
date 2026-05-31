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

Visit http://localhost:5173

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

- React 18 + TypeScript
- Tailwind CSS
- Vite
- Claude AI (Haiku 4.5)
- LocalStorage

---

**Version**: 0.5.97 React  
**Dev Server**: http://localhost:5173
