# Changelog Update Guide

## Overview
The changelog is maintained in `./changelog/changelog.ts` and displays on the `/changelog` page of the UniDex app.

## How to Add a New Release

1. Open `./changelog/changelog.ts`
2. Add a new entry at the **top** of the `changelogData` array (newest releases should be first)
3. Follow this structure:

```typescript
{
  id: "v2.2.0",           // Unique ID, typically the version number
  version: "2.2.0",       // Version number (semantic versioning)
  date: "2024-02-01",     // Release date in YYYY-MM-DD format
  title: "Feature Name",   // Short, descriptive title
  description: "Optional longer description", // Optional
  type: "minor",          // Version type: 'major' | 'minor' | 'patch' | 'hotfix'
  categories: [           // Group changes by category
    {
      name: "New Features",
      icon: "🚀",         // Optional emoji icon
      color: "purple",    // Optional color hint
      changes: [
        { 
          text: "Added new trading pairs", 
          badge: "new"    // Optional badge type
        },
        // More changes...
      ]
    },
    // More categories...
  ]
}
```

## Version Types

- **major**: Breaking changes or significant new features (1.0.0 → 2.0.0)
- **minor**: New features, backwards compatible (1.0.0 → 1.1.0)
- **patch**: Bug fixes and minor improvements (1.0.0 → 1.0.1)
- **hotfix**: Critical fixes that need immediate release

## Badge Types

Use badges to highlight the nature of each change:

- `new`: New features or additions
- `improved`: Enhancements to existing features
- `fixed`: Bug fixes
- `breaking`: Changes that break compatibility
- `deprecated`: Features being phased out
- `security`: Security-related updates

## Category Suggestions

Common categories and their icons:

- 🚀 **New Features**: Major additions
- ✨ **Improvements**: Enhancements to existing features
- 🐛 **Bug Fixes**: Resolved issues
- ⚡ **Performance**: Speed and optimization updates
- 🎨 **UI/UX Updates**: Visual and interaction changes
- 🔒 **Security**: Security patches and improvements
- ⚠️ **Breaking Changes**: Non-backward compatible changes
- 📈 **Trading Features**: Trading-specific updates
- 💰 **DeFi Features**: Lending, staking, etc.
- 📊 **Analytics**: Data and reporting features

## Example Entry

```typescript
{
  id: "v2.2.0",
  version: "2.2.0",
  date: "2024-02-01",
  title: "Advanced Trading Tools",
  description: "New professional trading features and performance improvements",
  type: "minor",
  categories: [
    {
      name: "Trading Features",
      icon: "📈",
      changes: [
        { text: "Added limit order functionality", badge: "new" },
        { text: "Implemented stop-loss orders", badge: "new" },
        { text: "Enhanced order book depth visualization", badge: "improved" }
      ]
    },
    {
      name: "Performance",
      icon: "⚡",
      changes: [
        { text: "Reduced latency by 40% for order execution", badge: "improved" },
        { text: "Optimized WebSocket connections", badge: "improved" }
      ]
    },
    {
      name: "Bug Fixes",
      icon: "🐛",
      changes: [
        { text: "Fixed decimal precision in small trades", badge: "fixed" },
        { text: "Resolved wallet disconnection issues", badge: "fixed" }
      ]
    }
  ]
}
```

## Best Practices

1. **Be Specific**: Write clear, concise descriptions that users can understand
2. **Group Logically**: Organize changes into meaningful categories
3. **Use Badges**: Help users quickly identify the type of change
4. **Date Accurately**: Use the actual release date
5. **Version Correctly**: Follow semantic versioning principles
6. **User-Focused**: Write from the user's perspective, not technical jargon

## Testing Your Changes

1. Save your changes to `changelog.ts`
2. Run the development server: `npm run dev`
3. Navigate to `/changelog` to see your updates
4. Verify the formatting and ensure all information displays correctly

## Tips

- The latest version automatically appears highlighted at the top
- Users can filter by version type and search through all entries
- Categories are collapsible for better organization
- Consider adding a description for major releases to provide context 