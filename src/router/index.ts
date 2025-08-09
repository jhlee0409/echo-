/**
 * 🚀 Router Index - Central Router Exports
 * 
 * Centralized exports for the routing system
 */

// Main router components
export { default as AppRouter, ROUTES, useAppNavigation } from './AppRouter'
export { default as GameRouter, useGameNavigation, GAME_ROUTES, MODE_TO_ROUTE, ROUTE_TO_MODE } from './GameRouter'

// Route protection
export { 
  default as RouteGuard,
  AuthGuard,
  AdminGuard, 
  PremiumGuard,
  FeatureGuard,
  LevelGuard
} from './RouteGuard'

// Navigation component
export { default as GameNavigation } from '@/components/ui/navigation/GameNavigation'

// Route utilities
export const createGameRoute = (mode: string) => `/game/${mode}`
export const createAdminRoute = (section: string) => `/admin/${section}`
export const createAuthRoute = (action: string) => `/auth/${action}`

// Route type definitions
export type AppRoute = keyof typeof ROUTES
export type GameRoute = keyof typeof GAME_ROUTES

// Navigation helpers
export const isGameRoute = (path: string): boolean => path.startsWith('/game')
export const isAuthRoute = (path: string): boolean => path.startsWith('/auth')
export const isAdminRoute = (path: string): boolean => path.startsWith('/admin')
export const isPublicRoute = (path: string): boolean => 
  path === '/' || path.startsWith('/landing') || path.startsWith('/auth')

// Route validation
export const validateGameRoute = (route: string): boolean => 
  Object.values(GAME_ROUTES).includes(route as any)

export const validateAppRoute = (route: string): boolean => 
  Object.values(ROUTES).includes(route as any)