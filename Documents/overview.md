# Platform Overview

## Technical Foundation

### Core Technology Stack
- **Frontend Framework**: Next.js 15.x (React 18.x)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom animations
- **State Management**: Combination of React Query (Tanstack) and Zustand
- **Web3 Integration**: 
  - Wagmi 2.x for blockchain interactions
  - RainbowKit for wallet connections
  - Viem for Ethereum interactions
  - ZeroDev for account abstraction

### Project Structure
```
src/
├── components/
│   ├── features/    # Feature-specific components (trading, positions, etc.)
│   ├── shared/      # Reusable components (Header, Footer, etc.)
│   └── ui/          # Base UI components
├── hooks/           # Custom React hooks
├── lib/            # Utility functions and configurations
├── pages/          # Next.js pages and routing
└── styles/         # Global styles and Tailwind configuration
```

### Core Implementation Details

#### Application Entry
The application bootstraps in `_app.tsx` with several key providers:
- WagmiProvider for Web3 functionality
- RainbowKitProvider for wallet connections
- ThemeProvider for dark/light mode (with system theme disabled by default)
- PriceProvider for real-time price updates
- QueryClientProvider for data fetching and caching

#### Trading Interface Implementation
The main trading interface (`pages/index.tsx`) is composed of:
- Real-time price chart integration with TradingView
- Order entry system with configurable leverage (up to 20x)
- Position management through PositionsTable
- Pair selection with URL-based routing
- Dynamic title updates with real-time price information
- Responsive layout with mobile-first considerations
- Referral system integration through URL parameters

#### Progressive Features
- Version control notification system for new deployments
- PWA configuration with iOS-specific meta tags
- Custom RainbowKit disclaimers for territory restrictions
- Toast notification system for user feedback

#### State Management
- Websocket price feeds managed through context (`websocket-price-context`)
- Trading state managed through React Query
- UI state handled by Zustand stores

### Application Patterns

#### Data Flow Architecture
- Hooks composition pattern for data management:
  - `usePairFromUrl`: URL-based pair selection with routing integration
  - `useMarketData`: Market data fetching and caching
  - `usePrices`: Real-time WebSocket price updates
- Centralized price updates flow through WebSocket context to all components
- Market data cached and invalidated through React Query

#### Component Communication
- Parent-child prop drilling for trading interface components
- Context-based global state for prices and theme
- URL-based state management for pair selection
- Event-based communication for order updates and positions

#### Configuration Pattern
- Environment-based configuration for API endpoints
- Feature flags managed through environment variables
- Network configuration centralized in wagmi config
- Chain-specific settings for different environments

### Key Integration Points

#### Web3 Integration
- Wallet connection handled through RainbowKit
- Trading transactions processed via Wagmi hooks
- Account abstraction implemented through ZeroDev SDK

#### Market Data Flow
1. Price feeds connect via WebSocket
2. Market data fetched through React Query
3. Real-time updates propagated through context
4. UI components subscribe to relevant state

### Development Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Architecture Overview
The platform is built as a modern decentralized trading interface with the following key architectural decisions:

1. **Server-Side Rendering (SSR)**
   - Leverages Next.js for optimal performance and SEO
   - Hybrid rendering approach for dynamic trading data

2. **Web3 Infrastructure**
   - Primary network: Arbitrum
   - Wallet connection through RainbowKit with custom disclaimers
   - Account abstraction support via ZeroDev
   - Real-time price updates through WebSocket connections

3. **UI/UX Framework**
   - Component library: Combination of NextUI and Radix UI
   - Dark/Light theme support via next-themes
   - Responsive design with mobile-first approach
   - PWA (Progressive Web App) support

### Key Features
- Real-time trading interface with TradingView charts integration
- Wallet integration with multi-chain support
- Position management system
- Real-time price feeds
- Leverage trading up to 20x
- Mobile responsive design
- PWA capabilities for mobile installation

### Performance Optimizations
- Dynamic imports for code splitting
- PWA configuration for offline capabilities
- Optimized asset loading with Next.js Image optimization
- WebSocket connection for real-time data updates
- Client-side caching with React Query

### Security Considerations
- Secure wallet connections with custom disclaimers
- Territory restrictions handling
- Protected API endpoints
- Secure WebSocket connections for price feeds

### Developer Guide

#### Component Categories
- **Feature Components** (`components/features/`): 
  - Trading-specific components (OrderCard, Chart, etc.)
  - Require understanding of trading mechanics and Web3 integration
  - Often combine multiple hooks and contexts
  - Handle complex state management and real-time updates
  - Implement responsive layouts for different screen sizes
  
- **Shared Components** (`components/shared/`):
  - App-wide components like Header, Footer
  - Handle common functionality like wallet connection
  - Focus on layout and user interaction
  - Manage global state and user preferences
  - Handle cross-cutting concerns like notifications
  
- **UI Components** (`components/ui/`):
  - Base-level UI elements
  - Theme-aware and responsive
  - Can be used across all other components
  - Follow consistent styling patterns
  - Support dark/light mode transitions

#### Hook Dependencies
- Trading hooks often require Web3 context and price data
- UI state hooks may depend on theme or responsive contexts
- Market data hooks need WebSocket connection and caching setup

#### Common Development Flows

1. **Adding Trading Features**:
   - Start with Web3 integration understanding
   - Review market data flow
   - Understand position management
   - Consider:
     - Real-time price update handling
     - Transaction state management
     - Error boundaries and fallbacks
     - Loading states and optimistic updates

2. **UI Enhancements**:
   - Begin with theme system
   - Check responsive design patterns
   - Review component composition
   - Consider:
     - Mobile-first approach
     - Touch interactions
     - Animation performance
     - Accessibility requirements

3. **State Management**:
   - Start with WebSocket price context
   - Review React Query implementation
   - Understand Zustand store patterns
   - Consider:
     - Cache invalidation strategies
     - Optimistic updates
     - Error recovery
     - State persistence

#### Testing Considerations
- Unit tests for hooks and utilities
- Component testing with user interactions
- Integration tests for Web3 functionality
- Performance testing for real-time updates
- Mobile responsive testing

#### Common Pitfalls
- Avoid direct DOM manipulation with chart libraries
- Handle WebSocket reconnection gracefully
- Manage wallet connection state properly
- Consider transaction mining delays
- Handle network switching correctly
- Prevent memory leaks in real-time updates

#### Performance Considerations
- Implement proper memoization for expensive calculations
- Use virtual scrolling for large datasets
- Optimize WebSocket message handling
- Lazy load non-critical components
- Implement proper cleanup in useEffect hooks

See the hooks and components documentation for detailed implementation details.
