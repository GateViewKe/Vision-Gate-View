// lib/types.ts

export type POIType = 'GATE' | 'SHOP' | 'DINING' | 'LOUNGE' | 'RESTROOM' | 'SERVICE' | 'SECURITY' | 'CHECKIN'

export interface POI {
  id: string
  name: string
  type: POIType
  x: number
  y: number
  description?: string
  gateCode?: string
  openHours?: string
}

export interface FloorPlan {
  walls: Array<{ x: number; y: number; w: number; h: number }>
  corridors: Array<{ x: number; y: number; w: number; h: number }>
}

export interface Terminal {
  id: string
  name: string
  floor: number
  floorPlan: FloorPlan
  pois: POI[]
}

export interface RouteResult {
  path: Array<{ x: number; y: number }>
  distanceMeters: number
  walkTimeSeconds: number
}

export interface PositionResult {
  x: number
  y: number
  accuracy: number
  method: string
  timestamp: number
}

export interface FlightInfo {
  flightNumber: string
  airline: string
  destination: string
  status: 'ON_TIME' | 'BOARDING' | 'DELAYED' | 'DEPARTED' | 'CANCELLED'
  scheduledDeparture: string
  estimatedDeparture?: string
  gate?: string
  delayMinutes?: number
}
