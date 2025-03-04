# Twinkle-Vite Development Guide

## Commands
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint on src/

## Code Style
- Use functional components with TypeScript interfaces for props
- Single quotes for strings, double quotes for JSX attributes
- Use destructured imports for specific library parts
- Import order: external libraries first, then internal components/utilities
- Naming: PascalCase for components, camelCase for functions/variables
- Use the `~` alias for imports from src/ directory
- Error handling: Use ErrorBoundary component for React errors, consistent error state in reducers
- Strictly type props, avoid using `any` type when possible

## Component Structure
- Place related components in a directory with index.tsx for exports
- Use React Context for state management across component hierarchies
- Extract reusable UI elements to dedicated components
- Use hooks appropriately, particularly useMemo for performance optimization

## Formatting
- Prettier config: single quotes, no trailing commas, bracket spacing
- ESLint enforces TypeScript best practices and React patterns