# Creating New Pages in UniDex App

This guide explains the standard process for creating new pages in the UniDex Next.js application. Following this pattern ensures consistency and maintainability across the codebase.

## Overview

Creating a new page involves:
1. Creating a feature component in the components directory
2. Creating a page file in the pages directory  
3. Adding navigation links to the header (if needed)
4. Following naming conventions and file structure

## Step-by-Step Process

### 1. Create the Feature Component

**Location**: `src/components/features/{page-name}/index.tsx`

Create a new folder under `src/components/features/` with your page name (use kebab-case). Inside this folder, create an `index.tsx` file.

**Template Structure:**
```tsx
'use client'

import { Header } from "../../shared/Header"
import { Card } from "../../ui/card"
// Add other imports as needed

export function YourPageDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Page Title</h1>
            <p className="text-gray-400">
              Your page description here.
            </p>
          </div>

          {/* Your page content here */}
          <Card className="p-8 bg-[#1e1e20] border border-[#1b1b22]">
            {/* Content */}
          </Card>
        </div>
      </div>
    </div>
  )
}
```

**Key Points:**
- Always include `'use client'` directive at the top
- Import and include the `Header` component
- Use consistent styling classes that match the app's design system
- Follow the naming convention: `{PageName}Dashboard` for the component function
- Use the standard layout structure with proper spacing and max-width containers

### 2. Create the Page File

**Location**: `src/pages/{page-name}.tsx`

Create a simple page file that imports and renders your component.

**Template:**
```tsx
import { YourPageDashboard } from "../components/features/{page-name}";

export default function YourPagePage() {
  return <YourPageDashboard />;
}
```

**Key Points:**
- Use PascalCase for the default export function name
- Follow the pattern: `{PageName}Page`
- Keep it simple - just import and render the main component

### 3. Add Navigation Links (Optional)

If your page needs to be accessible through navigation, add it to the Header component.

**Location**: `src/components/shared/Header.tsx`

#### For Desktop Navigation:
Find the appropriate dropdown section and add a new `DropdownItem`:

```tsx
<DropdownItem
  key="your-page"
  description="Description of your page"
  startContent={<YourIcon className="w-4 h-4" />}
  onClick={() => (window.location.href = "/your-page")}
>
  Your Page Name
</DropdownItem>
```

#### For Mobile Navigation:
Find the corresponding mobile section and add a `Button`:

```tsx
<Button
  variant="ghost"
  className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
  onClick={() => (window.location.href = "/your-page")}
>
  <YourIcon className="w-4 h-4" />
  Your Page Name
</Button>
```

**Navigation Placement Guidelines:**
- **Perps**: Trading-related functionality
- **Lending**: Lending and borrowing features
- **Earn**: Staking, rewards, referrals
- **Data**: Analytics, markets, statistics
- **More**: Help, documentation, utility pages

### 4. File Naming Conventions

- **Folders**: Use kebab-case (e.g., `referral-dashboard`, `user-settings`)
- **Component files**: Use `index.tsx` in the feature folder
- **Page files**: Use kebab-case matching the URL (e.g., `faq.tsx`, `user-profile.tsx`)
- **Component names**: Use PascalCase with descriptive suffixes (e.g., `FAQDashboard`, `UserProfileSettings`)

### 5. Styling Guidelines

**Consistent Classes to Use:**
- Background: `bg-background text-foreground`
- Cards: `bg-[#1e1e20] border border-[#1b1b22]`
- Text colors: `text-foreground`, `text-gray-400` for descriptions
- Layout: `max-w-6xl mx-auto space-y-6`
- Spacing: `p-6` for main container, `p-8` for cards

**Layout Structure:**
```tsx
<div className="flex flex-col min-h-screen bg-background text-foreground">
  <Header />
  <div className="min-h-screen bg-background text-foreground p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Content */}
    </div>
  </div>
</div>
```

## Examples

### Simple Static Page
```
src/components/features/about/index.tsx
src/pages/about.tsx
```

### Complex Interactive Page
```
src/components/features/trading-dashboard/
├── index.tsx
├── components/
│   ├── OrderBook.tsx
│   ├── TradingChart.tsx
│   └── PositionTable.tsx
└── hooks/
    └── useTradingData.ts
```

### Page with Sub-components
For more complex pages, you can create additional files within the feature folder:
- `components/` - Reusable sub-components specific to this page
- `hooks/` - Custom hooks for this page's functionality
- `types.ts` - TypeScript types specific to this page
- `utils.ts` - Utility functions

## Best Practices

1. **Consistency**: Follow the established patterns shown in existing pages like `referrals`, `markets`, etc.

2. **Responsive Design**: Ensure your page works on both desktop and mobile by testing different screen sizes.

3. **Accessibility**: Include proper semantic HTML and ARIA labels where appropriate.

4. **Performance**: Use `'use client'` only when necessary for client-side interactivity.

5. **Error Handling**: Include loading states and error boundaries for data-driven pages.

6. **SEO**: Add appropriate page titles and meta descriptions in `_app.tsx` or `_document.tsx` if needed.

## Testing Your New Page

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/your-page-name`
3. Test navigation links from the header
4. Verify responsive behavior on different screen sizes
5. Check that the page follows the app's visual design system

## Common Issues and Solutions

### Page Not Found (404)
- Ensure the page file is in `src/pages/` directory
- Check that the filename matches the URL
- Verify the default export is properly named

### Navigation Not Working
- Check that both desktop and mobile navigation sections are updated
- Ensure the `onClick` handlers use the correct path
- Verify that the path matches your page filename

### Styling Issues
- Make sure you're using the established CSS classes
- Check that Tailwind classes are properly applied
- Verify the layout structure follows the pattern

### Import Errors
- Ensure all imports use the correct relative paths
- Check that component names match their exports
- Verify that shared components are imported correctly

## Additional Resources

- See existing pages like `referrals`, `markets`, and `lending` for reference
- Check `src/components/ui/` for available UI components
- Review `src/components/shared/Header.tsx` for navigation patterns
- Refer to the app's design system documentation for styling guidelines 