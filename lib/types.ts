// lib/types.ts
export type { WallRect } from './walls'
export type POIType =
  | 'GATE' | 'SHOP' | 'DINING' | 'LOUNGE'
  | 'RESTROOM' | 'SERVICE' | 'SECURITY' | 'CHECKIN'
  | 'BAGGAGE' | 'IMMIGRATION' | 'PRAYER' | 'PHARMACY'
  | 'ESCALATOR' | 'ELEVATOR' | 'ATM' | 'INFORMATION'

export interface POI {
  id: string
  name: string
  type: POIType
  x: number
  y: number
  floor: number          // which floor this POI lives on
  description?: string
  gateCode?: string
  openHours?: string
}

export interface FloorMeta {
  id: number
  name: string
  shortLabel: string     // 'G', '1', '2'
  description: string
}

export interface FloorPlan {
  walls:     Array<{ x: number; y: number; w: number; h: number }>
  corridors: Array<{ x: number; y: number; w: number; h: number }>
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
  status: FlightStatus
  scheduledDeparture: string
  estimatedDeparture?: string
  gate?: string
  delayMinutes?: number
}

export type FlightStatus = 'ON_TIME' | 'BOARDING' | 'DELAYED' | 'DEPARTED' | 'CANCELLED'

export interface TicketInfo {
  ticketNumber: string
  passengerName: string
  flightNumber: string
  airline: string
  airlineLogo?: string
  origin: string
  destination: string
  gate: string
  floor: number
  seat: string
  seatClass: 'Economy' | 'Business' | 'First'
  scheduledDeparture: string   // "HH:MM" local time
  boardingTime: string         // "HH:MM"
  status: FlightStatus
  delayMinutes?: number
  terminalId: string
}

export type ViewMode = '2d' | '3d'