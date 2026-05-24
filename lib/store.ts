// lib/store.ts
import { create } from 'zustand'
import type { POI, RouteResult, PositionResult, ViewMode, TicketInfo } from './types'
import { ALL_POIS, poisForFloor, FLOOR_PLANS } from './jkia-data'

interface MapState {
  // ── POI / map data ─────────────────────────────────────────────────────────
  pois: POI[]                          // POIs for the current floor only
  setPOIs: (pois: POI[]) => void

  // ── Floor ──────────────────────────────────────────────────────────────────
  currentFloor: number
  setFloor: (floor: number) => void

  // ── View mode ──────────────────────────────────────────────────────────────
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // ── Selection & navigation ─────────────────────────────────────────────────
  selectedPOI: POI | null
  setSelectedPOI: (poi: POI | null) => void
  route: RouteResult | null
  setRoute: (route: RouteResult | null) => void

  // ── Player position ────────────────────────────────────────────────────────
  position: PositionResult | null
  setPosition: (pos: PositionResult) => void

  // ── Canvas viewport ────────────────────────────────────────────────────────
  scale: number
  setScale: (scale: number) => void
  offsetX: number
  offsetY: number
  setOffset: (x: number, y: number) => void

  // ── Search ─────────────────────────────────────────────────────────────────
  searchQuery: string
  setSearchQuery: (q: string) => void

  // ── Ticket / boarding pass ─────────────────────────────────────────────────
  ticketInfo: TicketInfo | null
  setTicketInfo: (info: TicketInfo | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  pois: poisForFloor(1),               // default: Level 1 — Departures
  setPOIs: (pois) => set({ pois }),

  currentFloor: 1,
  setFloor: (floor) =>
    set({
      currentFloor: floor,
      pois: poisForFloor(floor),
      selectedPOI: null,
      route: null,
    }),

  viewMode: '2d',
  setViewMode: (viewMode) => set({ viewMode }),

  selectedPOI: null,
  setSelectedPOI: (selectedPOI) => set({ selectedPOI, route: null }),
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

  ticketInfo: null,
  setTicketInfo: (ticketInfo) => set({ ticketInfo }),
}))