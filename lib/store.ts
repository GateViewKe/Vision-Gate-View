// lib/store.ts
import { create } from 'zustand'
import type { POI, RouteResult, PositionResult } from './types'

interface MapState {
  // Map data
  pois: POI[]
  setPOIs: (pois: POI[]) => void

  // Selection & navigation
  selectedPOI: POI | null
  setSelectedPOI: (poi: POI | null) => void
  route: RouteResult | null
  setRoute: (route: RouteResult | null) => void

  // Player position
  position: PositionResult | null
  setPosition: (pos: PositionResult) => void

  // View state
  scale: number
  setScale: (scale: number) => void
  offsetX: number
  offsetY: number
  setOffset: (x: number, y: number) => void

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useMapStore = create<MapState>((set) => ({
  pois: [],
  setPOIs: (pois) => set({ pois }),

  selectedPOI: null,
  setSelectedPOI: (poi) => set({ selectedPOI: poi, route: null }),
  route: null,
  setRoute: (route) => set({ route }),

  position: null,
  setPosition: (position) => set({ position }),

  scale: 1,
  setScale: (scale) => set({ scale }),
  offsetX: 0,
  offsetY: 0,
  setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
