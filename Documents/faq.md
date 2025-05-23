# FAQ Dashboard Documentation

## Overview
The FAQ Dashboard is a sophisticated help center interface built with React, TypeScript, and Framer Motion. It features a sidebar navigation, searchable content, collapsible FAQ items, and category/tag-based filtering.

## Architecture

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
```

### State Flow
1. **Search**: Updates `searchTerm`, filters FAQs in real-time
2. **Category Selection**: Sets `activeCategory`, clears `activeTag`
3. **Tag Selection**: Sets both `activeCategory` and `activeTag`
4. **FAQ Toggle**: Adds/removes from `openItems` array
5. **Category Expand**: Adds/removes from `expandedCategories`

## Component Details

### FAQDashboard (index.tsx)
**Purpose**: Main orchestrator that manages all state and data flow

**Key Functions**:
- `filteredFAQs`: Computed array based on search/category/tag
- `toggleItem()`: Opens/closes FAQ items
- `toggleAndScrollToItem()`: Opens and scrolls to specific FAQ
- `selectCategory()`: Updates category and auto-expands if needed
- `selectTag()`: Updates both category and tag
- `getActiveTitle()`: Generates dynamic page title

### Sidebar (Sidebar.tsx)
**Purpose**: Navigation interface with search and category/tag selection

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
- Search input at top
- Collapsible categories with icons
- Nested tag navigation
- Visual feedback for active states
- Quick access section (placeholder)

### FAQContent (FAQContent.tsx)
**Purpose**: Displays filtered FAQ items with animations

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

### SearchInput (components.tsx)
**Purpose**: Reusable search input with icon

**Features**:
- Search icon positioning
- Custom styling with hover/focus states
- Fully controlled component

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

### Responsive Design
- Sidebar: Fixed width `w-80`
- Main content: `max-w-5xl mx-auto`
- Grid layouts: `grid md:grid-cols-3`

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
3. Add UI controls in `Sidebar.tsx`
4. Pass props through component chain

### To Add Analytics
1. Add click handlers in `FAQContent.tsx` feedback buttons
2. Track in `toggleItem()` for FAQ opens
3. Monitor search terms in `setSearchTerm`

## Common Modifications

### Change Popular Questions Count
In `Sidebar.tsx`, modify the slice:
```typescript
.slice(0, 3) // Change 3 to desired count
```

### Modify Animation Speed
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

### Change Sidebar Width
In `Sidebar.tsx`, modify:
```typescript
className="w-80" // Change to w-64, w-96, etc.
```

## Performance Considerations

1. **Memoization**: Consider `useMemo` for `filteredFAQs` if FAQ count grows large
2. **Lazy Loading**: FAQs are all loaded at once; consider pagination for 100+ items
3. **Search Debouncing**: Currently instant; add debounce for large datasets
4. **Animation Performance**: Staggered animations may lag with many items

## Debugging Guide

### Common Issues

1. **FAQ not showing**: Check category ID matches
2. **Search not working**: Verify lowercase comparison
3. **Animations jerky**: Reduce stagger delay or disable for many items
4. **Tag filter not working**: Ensure exact tag ID match

### State Inspection Points
- Log `filteredFAQs` length to debug filtering
- Check `activeCategory` and `activeTag` for navigation issues
- Verify `openItems` array for expand/collapse problems

## Future Enhancement Ideas

1. **Internationalization**: Add language support to FAQ content
2. **Rich Content**: Support markdown in answers
3. **Search Highlighting**: Highlight matched terms
4. **Usage Analytics**: Track popular questions
5. **AI Search**: Semantic search capabilities
6. **Export/Import**: Admin interface for FAQ management
7. **Voting System**: Track helpfulness metrics
8. **Related Questions**: Show similar FAQs
9. **Quick Actions**: Add copy link, share buttons
10. **Keyboard Navigation**: Arrow keys for navigation 