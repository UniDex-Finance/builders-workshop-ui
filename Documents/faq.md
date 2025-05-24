# FAQ Dashboard Documentation

## Overview
The FAQ Dashboard is a sophisticated help center interface built with React, TypeScript, and Framer Motion. It features responsive navigation with desktop sidebar and mobile bottom sheet, searchable content, collapsible FAQ items, and category/tag-based filtering.

## Architecture

### Responsive Design Philosophy
The dashboard uses a **mobile-first, platform-native** approach:
- **Desktop**: Traditional sidebar navigation with search at top
- **Mobile**: Bottom sheet overlay with search in mobile header
- **Breakpoint**: Uses Tailwind's `md:` prefix (768px+) for desktop styles

### File Structure 

## Data Structure

### Types (types.ts)

#### FAQItem Interface
```typescript
interface FAQItem {
  id: string;              // Unique identifier (kebab-case)
  question: string;        // The FAQ question
  answer: string;          // Multi-line answer with \n for breaks
  category: string;        // Must match a category.id
  tags: string[];          // Array of searchable tags
  hasVisual?: boolean;     // Shows visual guide badge
  isPopular?: boolean;     // Appears in popular questions
}
```

#### Category Interface
```typescript
interface Category {
  id: string;              // Unique identifier
  label: string;           // Display name
  icon: React.ComponentType; // Lucide icon component
  tags: Tag[];             // Subcategory tags
}
```

#### Tag Interface
```typescript
interface Tag {
  id: string;              // Unique identifier
  label: string;           // Display name
}
```

### Data Organization (data.ts)

#### Adding New FAQ Items
To add a new FAQ:
1. Add to `faqData` array in `data.ts`
2. Ensure `category` matches an existing category ID
3. Use `\n` for line breaks in answers
4. Use bullet points: `• Item text`

Example:
```typescript
{
  id: "unique-kebab-case-id",
  question: "Your question here?",
  answer: "First paragraph\n\nSecond paragraph\n• Bullet point",
  category: "getting-started", // Must exist in categories
  tags: ["tag1", "tag2"],      // For search
  hasVisual: true,             // Optional
  isPopular: true              // Optional
}
```

#### Adding New Categories
To add a new category:
1. Import the icon from `lucide-react`
2. Add to `categories` array
3. Include any subcategory tags

Example:
```typescript
{
  id: "new-category",
  label: "New Category",
  icon: IconName,
  tags: [
    { id: "subtag1", label: "Subtag 1" },
    { id: "subtag2", label: "Subtag 2" }
  ]
}
```

## State Management (index.tsx)

### Core States
```typescript
searchTerm: string                    // Search input value
activeCategory: string                // Selected category ID
activeTag: string | null             // Selected tag ID
openItems: string[]                  // Array of expanded FAQ IDs
expandedCategories: string[]         // Array of expanded category IDs
isMobileMenuOpen: boolean            // Mobile bottom sheet visibility
```

### State Flow
1. **Search**: Updates `searchTerm`, filters FAQs in real-time
2. **Category Selection**: Sets `activeCategory`, clears `activeTag`
3. **Tag Selection**: Sets both `activeCategory` and `activeTag`
4. **FAQ Toggle**: Adds/removes from `openItems` array
5. **Category Expand**: Adds/removes from `expandedCategories`
6. **Mobile Navigation**: `toggleMobileMenu()` controls bottom sheet visibility

### Mobile-Specific Behavior
- **Auto-close**: Bottom sheet closes when category/tag selected
- **Backdrop**: Dark overlay prevents interaction with main content
- **Search Duplication**: Search appears in mobile header AND desktop sidebar

## Component Details

### FAQDashboard (index.tsx)
**Purpose**: Main orchestrator that manages all state and responsive layout

**Key Functions**:
- `filteredFAQs`: Computed array based on search/category/tag
- `toggleItem()`: Opens/closes FAQ items
- `toggleAndScrollToItem()`: Opens and scrolls to specific FAQ
- `selectCategory()`: Updates category and auto-expands if needed
- `selectTag()`: Updates both category and tag
- `getActiveTitle()`: Generates dynamic page title
- `toggleMobileMenu()`: Controls mobile bottom sheet visibility

**Responsive Layout Structure**:
```typescript
// Mobile header (md:hidden)
<div className="md:hidden">
  // Hamburger menu + search input
</div>

// Desktop sidebar wrapper (hidden md:block)
<div className="hidden md:block">
  <Sidebar />
</div>

// Mobile bottom sheet (conditional render + animations)
{isMobileMenuOpen && (
  // Backdrop + animated bottom sheet
)}
```

### Sidebar (Sidebar.tsx)
**Purpose**: Desktop-only navigation interface with search and category/tag selection

**Props**:
```typescript
interface SidebarProps {
  categories: Category[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeCategory: string;
  activeTag: string | null;
  expandedCategories: string[];
  onSelectCategory: (categoryId: string) => void;
  onSelectTag: (categoryId: string, tagId: string) => void;
  onToggleCategory: (categoryId: string) => void;
}
```

**Features**:
- **Desktop-only**: Never renders on mobile (no responsive props needed)
- Search input at top (hidden on mobile via mobile header)
- Collapsible categories with icons
- Nested tag navigation with smooth transitions
- Visual feedback for active states
- **Full height**: Takes up entire available vertical space
- **Removed**: Quick access section for cleaner layout

### Mobile Bottom Sheet
**Purpose**: Mobile-native navigation with Apple-inspired design

**Features**:
- **Spring animation**: Natural iOS-like slide up transition
- **Backdrop blur**: Modern glass-morphism effect with `backdrop-blur-sm`
- **Drag handle**: Visual cue indicating it's a modal sheet
- **Auto-close**: Automatically closes on category/tag selection
- **Touch-friendly**: Larger tap targets (`py-3` vs desktop `py-2.5`)
- **80% height**: `max-h-[80vh]` maintains context
- **Rounded corners**: `rounded-t-2xl` for mobile platform feel

### FAQContent (FAQContent.tsx)
**Purpose**: Displays filtered FAQ items with animations (unchanged for mobile)

**Props**:
```typescript
interface FAQContentProps {
  filteredFAQs: FAQItem[];
  openItems: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAndScrollToItem: (itemId: string) => void;
  activeCategory: string;
  searchTerm: string;
  activeTag: string | null;
  popularFAQs: FAQItem[];
}
```

**Features**:
- Popular questions banner (shown on "all" category only)
- Animated FAQ cards with staggered entrance
- Collapsible content with smooth transitions
- Visual badges (Popular, Visual Guide)
- Tag display
- Feedback buttons (Yes/No)
- Empty state handling
- **Mobile responsive**: Content adjusts naturally without sidebar space

### SearchInput (components.tsx)
**Purpose**: Reusable search input with icon

**Features**:
- Search icon positioning
- Custom styling with hover/focus states
- Fully controlled component
- **Dual usage**: Same component used in desktop sidebar AND mobile header

### ContactSection (ContactSection.tsx)
**Purpose**: Support options displayed at bottom

**Features**:
- Gradient background card
- Three support channels
- Responsive grid layout
- Entry animation

## Styling Patterns

### Color Scheme
- **Primary states**: `bg-primary/20`, `text-primary`, `border-primary/30`
- **Hover states**: `hover:bg-card/50`, `hover:border-border/50`
- **Muted elements**: `text-muted-foreground`, `bg-muted/20`
- **Gradients**: `from-blue-500/10 to-purple-500/10`

### Animation Patterns
- **Entry animations**: `initial={{ opacity: 0, y: 20 }}`
- **Staggered delays**: `transition={{ delay: index * 0.05 }}`
- **Smooth transitions**: `transition-all duration-200`
- **Transform rotations**: `rotate-180` for chevrons
- **Mobile spring**: `transition={{ type: "spring", damping: 30, stiffness: 300 }}`

### Responsive Design Patterns

#### Desktop Layout
- **Sidebar**: Fixed width `w-80`, full height `h-full`
- **Main content**: `flex-1` takes remaining space
- **Search**: Inside sidebar at top

#### Mobile Layout
- **Header**: `md:hidden` mobile-only header with hamburger + search
- **Bottom sheet**: Fixed positioning with backdrop
- **Animations**: Spring-based slide up/down transitions
- **Touch targets**: Larger buttons for mobile interaction

#### Responsive Classes Used
```css
/* Hide on mobile, show on desktop */
.hidden.md:block

/* Show on mobile, hide on desktop */
.md:hidden

/* Mobile bottom sheet positioning */
.fixed.bottom-0.left-0.right-0.z-50.md:hidden

/* Mobile backdrop */
.fixed.inset-0.bg-black/50.z-40.md:hidden
```

## Search Algorithm

The search function in `filteredFAQs` checks:
1. Question text (case-insensitive)
2. Answer text (case-insensitive)
3. All tags (case-insensitive)

Combined with:
- Category filter (exact match or "all")
- Tag filter (substring match in tags array)

## Adding New Features

### To Add a New FAQ Property
1. Add to `FAQItem` interface in `types.ts`
2. Update existing FAQ items in `data.ts`
3. Handle display in `FAQContent.tsx`

### To Add a New Filter Type
1. Add state in `index.tsx`
2. Update `filteredFAQs` logic
3. Add UI controls in both desktop `Sidebar.tsx` AND mobile bottom sheet
4. Pass props through component chain

### To Add Analytics
1. Add click handlers in `FAQContent.tsx` feedback buttons
2. Track in `toggleItem()` for FAQ opens
3. Monitor search terms in `setSearchTerm`
4. Track mobile vs desktop usage via `isMobileMenuOpen` state

## Common Modifications

### Modify Mobile Bottom Sheet Height
In `index.tsx`, change the bottom sheet max height:
```typescript
className="max-h-[80vh]" // Change to max-h-[70vh], max-h-[90vh], etc.
```

### Change Mobile Animation Speed
In `index.tsx`, modify the spring animation:
```typescript
transition={{ type: "spring", damping: 30, stiffness: 300 }}
// Increase damping for slower animation
// Decrease stiffness for less bouncy effect
```

### Adjust Mobile Touch Targets
In mobile bottom sheet section, modify button padding:
```typescript
className="px-4 py-3" // Change to px-6 py-4 for larger targets
```

### Modify Animation Speed (FAQ Content)
In `FAQContent.tsx`, adjust:
```typescript
transition={{ delay: index * 0.05 }} // Change 0.05
```

### Add New Badge Types
1. Add property to `FAQItem` interface
2. Add badge in `FAQContent.tsx` similar to:
```typescript
{item.newProperty && (
  <Badge variant="outline" className="text-xs">
    New Badge
  </Badge>
)}
```

### Change Desktop Sidebar Width
In `Sidebar.tsx`, modify:
```typescript
className="w-80" // Change to w-64, w-96, etc.
```

## Performance Considerations

1. **Memoization**: Consider `useMemo` for `filteredFAQs` if FAQ count grows large
2. **Lazy Loading**: FAQs are all loaded at once; consider pagination for 100+ items
3. **Search Debouncing**: Currently instant; add debounce for large datasets
4. **Animation Performance**: Spring animations are GPU-accelerated and performant
5. **Mobile Rendering**: Bottom sheet only renders when needed (conditional)

## Debugging Guide

### Common Issues

1. **FAQ not showing**: Check category ID matches
2. **Search not working**: Verify lowercase comparison
3. **Mobile menu not opening**: Check `isMobileMenuOpen` state and conditional rendering
4. **Bottom sheet not animating**: Verify Framer Motion is installed and `AnimatePresence` wrapping
5. **Desktop sidebar not showing**: Ensure `hidden md:block` classes are applied correctly
6. **Tag filter not working**: Ensure exact tag ID match

### State Inspection Points
- Log `filteredFAQs` length to debug filtering
- Check `activeCategory` and `activeTag` for navigation issues
- Verify `openItems` array for expand/collapse problems
- Monitor `isMobileMenuOpen` for mobile navigation issues

### Mobile-Specific Debugging
- Test on actual mobile devices, not just browser resize
- Check touch targets are adequate (minimum 44px)
- Verify backdrop click closes the bottom sheet
- Test scroll behavior within bottom sheet
- Ensure animations perform well on lower-end devices

## Future Enhancement Ideas

1. **Swipe Gestures**: Add swipe-down to close mobile bottom sheet
2. **Keyboard Navigation**: Arrow keys for navigation 
3. **Search Highlighting**: Highlight matched terms
4. **Usage Analytics**: Track mobile vs desktop usage patterns
5. **Progressive Web App**: Add mobile app-like behavior
6. **Voice Search**: Integrate speech-to-text for mobile
7. **Haptic Feedback**: Add vibration on mobile interactions
8. **Internationalization**: Add language support to FAQ content
9. **Rich Content**: Support markdown in answers
10. **AI Search**: Semantic search capabilities
11. **Export/Import**: Admin interface for FAQ management
12. **Voting System**: Track helpfulness metrics
13. **Related Questions**: Show similar FAQs
14. **Quick Actions**: Add copy link, share buttons

## Mobile UX Best Practices Implemented

1. **Platform-native feel**: Bottom sheet follows iOS/Android conventions
2. **Touch-first design**: Larger tap targets, easy thumb navigation
3. **Performance optimized**: Conditional rendering, GPU-accelerated animations
4. **Accessibility**: Proper z-indexing, focus management
5. **Context preservation**: 80% height maintains background visibility
6. **Natural interactions**: Spring physics for realistic motion
7. **Visual clarity**: Backdrop blur and drag handle provide clear affordances 