# Overview

Zombie Road is a turn-based zombie survival game built as a React web application with Express.js backend. The project is currently in Phase 1, focusing on creating the main game screen layout with proper responsive design. The application features a tile-based map system and grid-based inventory management, designed to be deployed via Electron for Windows.

The current implementation provides a complete UI framework with a 50/50 split layout between map interface and inventory management, along with game controls and player statistics. No game logic is implemented yet - this phase focuses purely on visual structure and responsive design.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development experience
- **Styling**: Tailwind CSS with custom CSS variables for theming, providing a dark-themed gaming interface
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for consistent, accessible components
- **State Management**: React hooks (useState) for local component state, with TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Framework**: Express.js with TypeScript for API endpoints
- **Module System**: ES modules throughout the application
- **Development**: TSX for running TypeScript directly in development
- **Production**: ESBuild for server-side bundling

## Data Storage Solutions
- **Database**: PostgreSQL with Neon Database as the serverless provider
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: @neondatabase/serverless for optimized serverless database connections

## Layout and Responsive Design
- **Main Layout**: Fixed 50/50 split between map interface (left) and inventory panel (right)
- **Inventory Subdivision**: Equipment slots at top, with backpack and ground items grids below
- **Control Strip**: 60-80px height area with End Turn button and player statistics
- **Target Resolutions**: Optimized for 1920x1080, 1366x768, 1440x900, 1600x900
- **Responsive Strategy**: CSS Grid and Flexbox with custom properties for scaling

## Component Structure
- **Game Components**: Modular game-specific components (GameScreen, MapInterface, InventoryPanel, GameControls)
- **Inventory System**: Separate components for equipment slots, backpack grid, and ground items
- **UI System**: Comprehensive shadcn/ui component library with consistent theming

## Authentication and Session Management
- **Session Storage**: Connect-pg-simple for PostgreSQL-backed session storage
- **User Schema**: Basic user table with username/password authentication ready for implementation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL provider for scalable database hosting
- **Drizzle ORM**: Type-safe ORM with PostgreSQL dialect for database operations

## UI and Component Libraries
- **Radix UI**: Comprehensive set of low-level UI primitives for accessibility and customization
- **Shadcn/ui**: Pre-built component library built on Radix UI with consistent design system
- **Lucide React**: Icon library for consistent iconography throughout the application

## Development and Build Tools
- **Vite**: Build tool with React plugin and runtime error overlay for development
- **TanStack Query**: Server state management for API calls and data fetching
- **React Hook Form**: Form handling with Zod validation for type-safe form management
- **Class Variance Authority**: Utility for creating consistent component variants

## Styling and Theming
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins
- **Custom CSS Variables**: Dark theme implementation with comprehensive color system

## Utility Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **Clsx**: Conditional CSS class composition
- **Wouter**: Lightweight routing solution for single-page application navigation
- **Embla Carousel**: Carousel component for potential future UI enhancements

## Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **TypeScript**: Full TypeScript support across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds