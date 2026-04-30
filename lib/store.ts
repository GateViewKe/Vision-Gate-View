import { create } from 'zustand'

interface POI { id: string; name: string; type: string; x: number; y: number; description?: string; gateCode?: string; openHours?: string }
interface RouteResult { path: Array<{ x: number; y: number }>; distanceMeters: number; walkTimeSeconds: number }
interface PositionResult { x: number; y: number; accuracy: number; method: string; timestamp: number }

interface MapState {
  pois: POI[]
  setPOIs: (pois: POI[]) => void
  selectedPOI: POI | null
  setSelectedPOI: (poi: POI | null) => void
  route: RouteResult | null
  setRoute: (route: RouteResult | null) => void
  position: PositionResult | null
  setPosition: (pos: PositionResult) => void
  scale: number
  setScale: (scale: number) => void
  offsetX: number
  offsetY: number
  setOffset: (x: number, y: number) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useMapStore = create<MapState>(set => ({
  pois: [], setPOIs: pois => set({ pois }),
  selectedPOI: null, setSelectedPOI: poi => set({ selectedPOI: poi, route: null }),
  route: null, setRoute: route => set({ route }),
  position: null, setPosition: position => set({ position }),
  scale: 1, setScale: scale => set({ scale }),
  offsetX: 0, offsetY: 0, setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),
  searchQuery: '', setSearchQuery: searchQuery => set({ searchQuery }),
}))
