'use client'
// components/AirportMap3D.tsx
// More building-like JKIA terminal interior: coloured zones, ceiling, storefronts,
// glass partitions, pillars, and keyboard walk controls that cannot go under the floor.

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Billboard, ContactShadows } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useMapStore } from '@/lib/store'
import { FLOOR_PLANS, FLOOR_META } from '@/lib/jkia-data'
import { EXTERIOR_WALLS, INTERIOR_WALLS_FLOOR1 } from '@/lib/walls'
import type { POI } from '@/lib/types'

const S = 0.1
const CX = 400 * S
const CZ = 290 * S
const EYE_HEIGHT = 1.65
const PASSED_DIST_3D = 2.5
const CONNECTOR_RADIUS = 55

function cx(v: number) { return v * S - CX }
function cz(v: number) { return v * S - CZ }
function wx(v: number) { return (v + CX) / S }
function wz(v: number) { return (v + CZ) / S }
function c2w(canvasX: number, canvasY: number, y = 0): [number, number, number] {
  return [cx(canvasX), y, cz(canvasY)]
}

const POI_COLOR: Record<string, string> = {
  GATE: '#1769AA', SHOP: '#2E7D32', DINING: '#B85C1F', LOUNGE: '#7B2E5F',
  RESTROOM: '#6B7280', SERVICE: '#87612A', SECURITY: '#B3261E', CHECKIN: '#534AB7',
  BAGGAGE: '#5F5E5A', IMMIGRATION: '#A32D2D', PRAYER: '#534AB7', PHARMACY: '#0F766E',
  ESCALATOR: '#1769AA', ELEVATOR: '#1769AA', ATM: '#2E7D32', INFORMATION: '#1769AA',
}
const POI_ICON: Record<string, string> = {
  GATE: '✈', SHOP: '🛍', DINING: '☕', LOUNGE: '🛋', RESTROOM: '🚻', SERVICE: '🏥',
  SECURITY: '🔒', CHECKIN: '🎫', BAGGAGE: '🧳', IMMIGRATION: '🛂', PRAYER: '✦',
  PHARMACY: '💊', ESCALATOR: '↕', ELEVATOR: '▣', ATM: '💳', INFORMATION: 'ℹ',
}

type Rect = { x: number; y: number; w: number; h: number }
type Storefront = { x: number; y: number; w: number; d: number; label: string; sub: string; color: string; type: 'shop' | 'dining' | 'lounge'; facing: 'north' | 'south' | 'east' | 'west' }
type Glass = { x: number; y: number; w: number; h: number; height?: number }

const PILLARS: Record<number, Array<[number, number]>> = {
  0: [[180, 190], [320, 190], [480, 190], [620, 190], [250, 370], [400, 370], [550, 370]],
  1: [[210, 205], [330, 205], [470, 205], [610, 205], [210, 375], [330, 375], [470, 375], [610, 375], [690, 295]],
  2: [[160, 245], [280, 245], [400, 245], [520, 245], [640, 245], [280, 360], [520, 360]],
}

const GLASS_PARTITIONS: Record<number, Glass[]> = {
  0: [
    { x: 135, y: 140, w: 530, h: 7 },
    { x: 135, y: 332, w: 530, h: 7 },
  ],
  1: [
    { x: 105, y: 222, w: 95, h: 8 },
    { x: 105, y: 350, w: 95, h: 8 },
    { x: 535, y: 222, w: 168, h: 8 },
    { x: 535, y: 350, w: 168, h: 8 },
    { x: 315, y: 222, w: 145, h: 8 },
  ],
  2: [
    { x: 100, y: 305, w: 620, h: 8 },
    { x: 320, y: 150, w: 160, h: 8 },
  ],
}

const STOREFRONTS: Record<number, Storefront[]> = {
  0: [
    { x: 176, y: 198, w: 75, d: 34, label: 'Kenya Airways', sub: 'Check-in A', color: '#1769AA', type: 'shop', facing: 'south' },
    { x: 370, y: 198, w: 95, d: 34, label: 'International Check-in', sub: 'Counters B', color: '#534AB7', type: 'shop', facing: 'south' },
    { x: 548, y: 198, w: 88, d: 34, label: 'Immigration', sub: 'Arrivals', color: '#A32D2D', type: 'shop', facing: 'south' },
    { x: 370, y: 450, w: 120, d: 44, label: 'Baggage Hall', sub: 'Carousels 1–5', color: '#5F5E5A', type: 'shop', facing: 'north' },
  ],
  1: [
    { x: 155, y: 185, w: 70, d: 46, label: 'African Craft', sub: 'Souvenirs', color: '#8C4B23', type: 'shop', facing: 'east' },
    { x: 155, y: 260, w: 70, d: 52, label: 'Pride Lounge', sub: 'Kenya Airways', color: '#7B2E5F', type: 'lounge', facing: 'east' },
    { x: 155, y: 310, w: 70, d: 50, label: 'Amaica', sub: 'Kenyan cuisine', color: '#B85C1F', type: 'dining', facing: 'east' },
    { x: 155, y: 395, w: 70, d: 52, label: 'Simba Lounge', sub: 'Premium lounge', color: '#5E315B', type: 'lounge', facing: 'east' },
    { x: 370, y: 260, w: 82, d: 54, label: 'Tusbooks', sub: 'Books & travel', color: '#275D90', type: 'shop', facing: 'south' },
    { x: 370, y: 395, w: 82, d: 54, label: 'Pharmacy Plus', sub: 'Travel health', color: '#0F766E', type: 'shop', facing: 'north' },
    { x: 580, y: 185, w: 76, d: 46, label: 'Burger Hut', sub: 'Fast food', color: '#B3261E', type: 'dining', facing: 'west' },
    { x: 580, y: 260, w: 82, d: 54, label: 'Nairobi Duty Free', sub: 'Perfume · spirits', color: '#2F4B8F', type: 'shop', facing: 'west' },
    { x: 580, y: 395, w: 82, d: 54, label: 'Java House', sub: 'Coffee & meals', color: '#6E4228', type: 'dining', facing: 'west' },
    { x: 675, y: 260, w: 66, d: 54, label: 'World of Whiskies', sub: 'Premium spirits', color: '#6F4C20', type: 'shop', facing: 'west' },
    { x: 675, y: 310, w: 66, d: 50, label: 'Artcaffe', sub: 'Café & bakery', color: '#82614F', type: 'dining', facing: 'west' },
    { x: 675, y: 395, w: 66, d: 54, label: 'Electronics', sub: 'Travel tech', color: '#256173', type: 'shop', facing: 'west' },
  ],
  2: [
    { x: 230, y: 270, w: 86, d: 56, label: 'Skyline Lounge', sub: 'Business lounge', color: '#274C7A', type: 'lounge', facing: 'south' },
    { x: 345, y: 270, w: 86, d: 56, label: 'Pier Duty Free', sub: 'Designer brands', color: '#2F4B8F', type: 'shop', facing: 'south' },
    { x: 460, y: 270, w: 86, d: 56, label: 'VIP Suite', sub: 'Private lounge', color: '#6C395E', type: 'lounge', facing: 'south' },
    { x: 575, y: 270, w: 86, d: 56, label: 'Java House Pier', sub: 'Coffee & snacks', color: '#6E4228', type: 'dining', facing: 'south' },
  ],
}

const SEATS: Record<number, Array<[number, number, number]>> = {
  0: [[265, 270, 0], [535, 270, 0], [260, 392, 0], [540, 392, 0]],
  1: [[255, 235, 0], [500, 235, 0], [255, 350, Math.PI], [500, 350, Math.PI], [615, 315, Math.PI / 2]],
  2: [[180, 220, 0], [320, 220, 0], [520, 220, 0], [660, 220, 0], [245, 365, Math.PI], [560, 365, Math.PI]],
}

function yawForFacing(facing: Storefront['facing']) {
  if (facing === 'north') return Math.PI
  if (facing === 'east') return -Math.PI / 2
  if (facing === 'west') return Math.PI / 2
  return 0
}

function pointInRect(x: number, y: number, r: Rect, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad
}

function canStandAt(canvasX: number, canvasY: number, floor: number) {
  const plan = FLOOR_PLANS[floor] ?? FLOOR_PLANS[1]
  const insideFloor = plan.walls.some((r) => pointInRect(canvasX, canvasY, r, -10))
  if (!insideFloor) return false

  const blockers: Rect[] = [
    ...(floor === 1 ? INTERIOR_WALLS_FLOOR1 : []),
    ...((STOREFRONTS[floor] ?? []).map((s) => ({ x: s.x - s.w / 2, y: s.y - s.d / 2, w: s.w, h: s.d }))),
  ]

  return !blockers.some((r) => pointInRect(canvasX, canvasY, r, 8))
}

function targetPointForFloor(targetFloor: number, connectorType: POI['type']) {
  if (connectorType === 'ELEVATOR') {
    if (targetFloor === 0) return { x: 430, y: 290 }
    if (targetFloor === 1) return { x: 710, y: 395 }
    return { x: 460, y: 440 }
  }
  if (targetFloor === 2) return { x: 400, y: 440 }
  if (targetFloor === 1) return { x: 665, y: 295 }
  return { x: 380, y: 290 }
}

function ConnectorButtons({ playerX, playerY, onPlayerMove }: { playerX: number; playerY: number; onPlayerMove?: (x: number, y: number) => void }) {
  const { pois, currentFloor, setFloor } = useMapStore()
  const connector = useMemo(() => {
    const connectors = pois.filter((p) => p.type === 'ESCALATOR' || p.type === 'ELEVATOR')
    return connectors
      .map((p) => ({ poi: p, dist: Math.hypot(playerX - p.x, playerY - p.y) }))
      .sort((a, b) => a.dist - b.dist)[0]
  }, [pois, playerX, playerY])

  if (!connector || connector.dist > CONNECTOR_RADIUS) return null

  let targets: number[] = []
  if (connector.poi.type === 'ELEVATOR') targets = [0, 1, 2].filter((f) => f !== currentFloor)
  else if (currentFloor === 0) targets = [1]
  else if (currentFloor === 1) targets = [2]
  else if (currentFloor === 2) targets = [1]

  const go = (floor: number) => {
    const p = targetPointForFloor(floor, connector.poi.type)
    onPlayerMove?.(p.x, p.y)
    setFloor(floor)
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 74, transform: 'translateX(-50%)', zIndex: 20,
      background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(24,95,165,0.2)', borderRadius: 16,
      padding: 10, display: 'flex', gap: 8, alignItems: 'center', boxShadow: '0 16px 36px rgba(15,23,42,0.18)',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <strong style={{ fontSize: 12, color: '#111827', whiteSpace: 'nowrap' }}>{connector.poi.type === 'ELEVATOR' ? 'Lift nearby' : 'Escalator nearby'}</strong>
      {targets.map((floor) => (
        <button key={floor} onClick={() => go(floor)} style={{
          border: 0, background: '#185FA5', color: '#fff', borderRadius: 999,
          padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
        }}>
          Go to {FLOOR_META.find((m) => m.id === floor)?.shortLabel ?? floor}
        </button>
      ))}
    </div>
  )
}

function TileGrid({ floor }: { floor: number }) {
  const object = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const verts: number[] = []
    const plan = FLOOR_PLANS[floor] ?? FLOOR_PLANS[1]
    for (const r of plan.walls) {
      const left = cx(r.x), right = cx(r.x + r.w), top = cz(r.y), bottom = cz(r.y + r.h)
      for (let x = Math.ceil(r.x / 25) * 25; x <= r.x + r.w; x += 25) {
        verts.push(cx(x), 0.018, top, cx(x), 0.018, bottom)
      }
      for (let y = Math.ceil(r.y / 25) * 25; y <= r.y + r.h; y += 25) {
        verts.push(left, 0.019, cz(y), right, 0.019, cz(y))
      }
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    const mat = new THREE.LineBasicMaterial({ color: '#D8D2C7', transparent: true, opacity: 0.68 })
    return new THREE.LineSegments(geom, mat)
  }, [floor])
  return <primitive object={object} />
}

function TerminalShell({ floor }: { floor: number }) {
  const floorPlan = FLOOR_PLANS[floor] ?? FLOOR_PLANS[1]
  return (
    <group>
      {floorPlan.walls.map((w, i) => {
        const [x, , z] = c2w(w.x + w.w / 2, w.y + w.h / 2)
        return (
          <group key={`slab-${i}`}>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, z]}>
              <planeGeometry args={[w.w * S, w.h * S]} />
              <meshStandardMaterial color={floor === 2 ? '#E5DED0' : '#ECE4D7'} roughness={0.62} metalness={0.02} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[x, 4.45, z]}>
              <planeGeometry args={[w.w * S, w.h * S]} />
              <meshStandardMaterial color="#F2EFE7" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}

      {floorPlan.corridors.map((c, i) => {
        const [x, , z] = c2w(c.x + c.w / 2, c.y + c.h / 2)
        return (
          <mesh key={`corridor-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.024, z]}>
            <planeGeometry args={[c.w * S, c.h * S]} />
            <meshStandardMaterial color={floor === 1 ? '#F5F0E5' : '#F1EDE4'} roughness={0.45} metalness={0.05} />
          </mesh>
        )
      })}
      <TileGrid floor={floor} />
    </group>
  )
}

function WallMesh({ wall }: { wall: Rect & { kind?: string } }) {
  const width = Math.max(wall.w * S, 0.18)
  const depth = Math.max(wall.h * S, 0.18)
  const height = wall.kind === 'exterior' ? 4.6 : 3.4
  const [x, , z] = c2w(wall.x + wall.w / 2, wall.y + wall.h / 2)
  const longX = width >= depth
  const panelCount = Math.max(2, Math.floor((longX ? width : depth) / 1.4))
  return (
    <group position={[x, height / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wall.kind === 'exterior' ? '#DCD6CC' : '#E8E2D8'} roughness={0.88} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.16, 0]}>
        <boxGeometry args={[width + 0.025, 0.18, depth + 0.025]} />
        <meshStandardMaterial color="#B9AA98" roughness={0.75} />
      </mesh>
      {Array.from({ length: panelCount }).map((_, i) => {
        const total = longX ? width : depth
        const offset = -total / 2 + (total / panelCount) * i
        return (
          <mesh key={i} position={longX ? [offset, 0.2, depth / 2 + 0.012] : [width / 2 + 0.012, 0.2, offset]}>
            <boxGeometry args={longX ? [0.035, height - 0.4, 0.02] : [0.02, height - 0.4, 0.035]} />
            <meshStandardMaterial color="#CFC5B8" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

function CeilingLights() {
  const lights: Array<[number, number, number]> = []
  for (let x = 120; x <= 680; x += 110) {
    lights.push([x, 170, 0], [x, 290, 0], [x, 410, 0])
  }
  return (
    <group>
      {lights.map(([x, y], i) => {
        const [wxp, , wzp] = c2w(x, y)
        return (
          <group key={i} position={[wxp, 4.18, wzp]}>
            <mesh>
              <boxGeometry args={[3.2, 0.05, 0.34]} />
              <meshBasicMaterial color="#FFF8DC" />
            </mesh>
            <pointLight intensity={0.48} distance={14} color="#FFF3D5" />
          </group>
        )
      })}
    </group>
  )
}

function Pillars({ floor }: { floor: number }) {
  return (
    <group>
      {(PILLARS[floor] ?? []).map(([x, y], i) => {
        const [wxp, , wzp] = c2w(x, y)
        return (
          <group key={i} position={[wxp, 0, wzp]}>
            <mesh castShadow receiveShadow position={[0, 1.85, 0]}>
              <cylinderGeometry args={[0.36, 0.42, 3.7, 24]} />
              <meshStandardMaterial color="#D2C6B7" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.65, 32]} />
              <meshStandardMaterial color="#AFA294" roughness={0.8} />
            </mesh>
            <mesh position={[0, 3.76, 0]}>
              <cylinderGeometry args={[0.52, 0.52, 0.18, 24]} />
              <meshStandardMaterial color="#E8DDCF" roughness={0.7} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function GlassWall({ seg }: { seg: Glass }) {
  const height = seg.height ?? 2.75
  const width = seg.w * S
  const depth = seg.h * S
  const [x, , z] = c2w(seg.x + seg.w / 2, seg.y + seg.h / 2)
  const longX = width >= depth
  const mullions = Math.max(2, Math.floor((longX ? width : depth) / 1.8))
  return (
    <group position={[x, height / 2 + 0.28, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#C8E3F3" roughness={0.08} transparent opacity={0.32} metalness={0.05} />
      </mesh>
      {Array.from({ length: mullions }).map((_, i) => {
        const total = longX ? width : depth
        const offset = -total / 2 + (total / (mullions + 1)) * (i + 1)
        return (
          <mesh key={i} position={longX ? [offset, 0, 0] : [0, 0, offset]}>
            <boxGeometry args={longX ? [0.05, height, depth + 0.04] : [width + 0.04, height, 0.05]} />
            <meshStandardMaterial color="#7C8E9E" roughness={0.35} metalness={0.55} />
          </mesh>
        )
      })}
    </group>
  )
}

function GlassPartitions({ floor }: { floor: number }) {
  return <group>{(GLASS_PARTITIONS[floor] ?? []).map((g, i) => <GlassWall key={i} seg={g} />)}</group>
}

function InteriorFurniture({ type, color }: { type: Storefront['type']; color: string }) {
  if (type === 'lounge') {
    return (
      <group>
        {[-0.9, 0.9].map((x) => (
          <group key={x} position={[x, 0, -0.65]}>
            <mesh castShadow position={[0, 0.38, 0]}><boxGeometry args={[1.15, 0.45, 0.55]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>
            <mesh castShadow position={[0, 0.74, -0.22]}><boxGeometry args={[1.15, 0.62, 0.18]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>
          </group>
        ))}
        <mesh castShadow position={[0, 0.42, 0.7]}><cylinderGeometry args={[0.42, 0.42, 0.08, 20]} /><meshStandardMaterial color="#F3E7D7" roughness={0.42} /></mesh>
      </group>
    )
  }
  if (type === 'dining') {
    return (
      <group>
        {[-0.8, 0.8].map((x) => (
          <group key={x} position={[x, 0, -0.2]}>
            <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[0.42, 0.42, 0.08, 18]} /><meshStandardMaterial color="#FFF7EA" roughness={0.45} /></mesh>
            <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.07, 0.07, 0.52, 12]} /><meshStandardMaterial color="#9B8772" roughness={0.5} metalness={0.2} /></mesh>
          </group>
        ))}
        <mesh castShadow position={[0, 0.56, -1.3]}><boxGeometry args={[2.2, 0.9, 0.45]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
      </group>
    )
  }
  return (
    <group>
      <mesh castShadow position={[0, 0.58, -1.2]}><boxGeometry args={[2.6, 1.0, 0.48]} /><meshStandardMaterial color={color} roughness={0.78} /></mesh>
      {[-1.2, 0, 1.2].map((x) => (
        <mesh key={x} castShadow position={[x, 1.35, -1.72]}><boxGeometry args={[0.7, 1.15, 0.35]} /><meshStandardMaterial color="#D9C8A6" roughness={0.75} /></mesh>
      ))}
    </group>
  )
}

function StorefrontUnit({ item }: { item: Storefront }) {
  const [x, , z] = c2w(item.x, item.y)
  const width = item.w * S
  const depth = item.d * S
  const yaw = yawForFacing(item.facing)
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh receiveShadow position={[0, 0.035, 0]}><boxGeometry args={[width, 0.07, depth]} /><meshStandardMaterial color="#D5CABD" roughness={0.8} /></mesh>
      <mesh castShadow receiveShadow position={[-width / 2 + 0.08, 1.45, 0]}><boxGeometry args={[0.16, 2.9, depth]} /><meshStandardMaterial color="#EFE7DA" roughness={0.86} /></mesh>
      <mesh castShadow receiveShadow position={[width / 2 - 0.08, 1.45, 0]}><boxGeometry args={[0.16, 2.9, depth]} /><meshStandardMaterial color="#EFE7DA" roughness={0.86} /></mesh>
      <mesh castShadow receiveShadow position={[0, 1.45, -depth / 2 + 0.08]}><boxGeometry args={[width, 2.9, 0.16]} /><meshStandardMaterial color="#EFE7DA" roughness={0.86} /></mesh>
      <mesh castShadow receiveShadow position={[0, 0.38, depth / 2 - 0.08]}><boxGeometry args={[width, 0.74, 0.16]} /><meshStandardMaterial color="#AA8C70" roughness={0.74} /></mesh>
      <mesh position={[0, 1.68, depth / 2 - 0.08]}><boxGeometry args={[width, 1.55, 0.08]} /><meshStandardMaterial color="#BFE1F1" roughness={0.08} transparent opacity={0.34} /></mesh>
      <mesh castShadow position={[0, 2.82, depth / 2 - 0.09]}><boxGeometry args={[width, 0.62, 0.22]} /><meshStandardMaterial color={item.color} roughness={0.58} /></mesh>
      <InteriorFurniture type={item.type} color={item.color} />
      <Billboard position={[0, 2.88, depth / 2 + 0.1]}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            minWidth: 150, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.96)',
            border: `2px solid ${item.color}`, color: '#1F2937', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'center', boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontWeight: 900, fontSize: 12 }}>{item.label}</div>
            <div style={{ fontSize: 10, opacity: 0.78 }}>{item.sub}</div>
          </div>
        </Html>
      </Billboard>
    </group>
  )
}

function Storefronts({ floor }: { floor: number }) {
  return <group>{(STOREFRONTS[floor] ?? []).map((s, i) => <StorefrontUnit key={`${s.label}-${i}`} item={s} />)}</group>
}

function Seating({ floor }: { floor: number }) {
  return (
    <group>
      {(SEATS[floor] ?? []).map(([x, y, yaw], i) => {
        const [wxp, , wzp] = c2w(x, y)
        return (
          <group key={i} position={[wxp, 0, wzp]} rotation={[0, yaw, 0]}>
            {[-0.9, 0, 0.9].map((dx) => (
              <mesh key={dx} castShadow receiveShadow position={[dx, 0.36, 0]}>
                <boxGeometry args={[0.75, 0.45, 0.52]} />
                <meshStandardMaterial color="#427C9B" roughness={0.82} />
              </mesh>
            ))}
            <mesh position={[0, 0.78, -0.28]}><boxGeometry args={[2.6, 0.6, 0.16]} /><meshStandardMaterial color="#315C73" roughness={0.85} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

function Plants({ floor }: { floor: number }) {
  const pts = floor === 1 ? [[255, 180], [525, 180], [255, 410], [525, 410]] : [[185, 305], [615, 305]]
  return (
    <group>
      {pts.map(([x, y], i) => {
        const [wxp, , wzp] = c2w(x, y)
        return (
          <group key={i} position={[wxp, 0, wzp]}>
            <mesh castShadow position={[0, 0.28, 0]}><cylinderGeometry args={[0.22, 0.25, 0.55, 18]} /><meshStandardMaterial color="#8A5A33" roughness={0.75} /></mesh>
            <mesh castShadow position={[0, 0.9, 0]}><sphereGeometry args={[0.43, 18, 18]} /><meshStandardMaterial color="#2E7D32" roughness={0.85} /></mesh>
          </group>
        )
      })}
    </group>
  )
}

function OverheadSigns({ floor }: { floor: number }) {
  const labels = floor === 1
    ? [
        [310, 132, 'Gates B10–B16', 'Security · Duty Free', '#1769AA'],
        [585, 132, 'Gates B17–B23', 'Lounges · Dining', '#8B6B1E'],
        [420, 455, 'JKIA Terminal 1A', 'International Departures', '#1769AA'],
      ]
    : floor === 2
      ? [[300, 128, 'International Pier', 'Gates C1–C6', '#1769AA'], [575, 128, 'Gates C7–C10', 'Lounges', '#8B6B1E']]
      : [[250, 120, 'Arrivals Hall', 'Immigration · Baggage', '#1769AA'], [520, 120, 'Check-in', 'Escalator · Lifts', '#8B6B1E']]
  return (
    <group>
      {labels.map(([x, y, title, sub, color], i) => {
        const [wxp, , wzp] = c2w(Number(x), Number(y))
        return (
          <group key={i} position={[wxp, 0, wzp]}>
            <mesh castShadow position={[0, 2.85, 0]}><boxGeometry args={[5.2, 0.85, 0.18]} /><meshStandardMaterial color={String(color)} roughness={0.6} /></mesh>
            <mesh position={[0, 3.55, 0]}><boxGeometry args={[0.08, 1.0, 0.08]} /><meshStandardMaterial color="#777" metalness={0.5} roughness={0.35} /></mesh>
            <Billboard position={[0, 2.85, 0.12]}>
              <Html center distanceFactor={13} style={{ pointerEvents: 'none' }}>
                <div style={{ color: '#fff', minWidth: 180, textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{title}</div>
                  <div style={{ fontSize: 10, opacity: 0.9 }}>{sub}</div>
                </div>
              </Html>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}

function RouteLine({ path }: { path: Array<{ x: number; y: number }> }) {
  const object = useMemo(() => {
    const pts = path.map((p) => new THREE.Vector3(...c2w(p.x, p.y, 0.08)))
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineDashedMaterial({ color: '#E24B4A', dashSize: 0.48, gapSize: 0.22 })
    const line = new THREE.Line(geom, mat)
    line.computeLineDistances()
    return line
  }, [path])
  const mat = object.material as THREE.LineDashedMaterial
  useFrame(({ clock }) => { (mat as any).dashOffset = -clock.getElapsedTime() * 0.55 })
  return <primitive object={object} />
}

function RouteArrows({ path }: { path: Array<{ x: number; y: number }> }) {
  return (
    <group>
      {path.slice(0, -1).map((p, i) => {
        const next = path[i + 1]
        const a = new THREE.Vector3(...c2w(p.x, p.y, 0.09))
        const b = new THREE.Vector3(...c2w(next.x, next.y, 0.09))
        const seg = a.distanceTo(b)
        if (seg < 1.2) return null
        const mid = a.clone().lerp(b, 0.5)
        const dir = b.clone().sub(a).normalize()
        const ang = Math.atan2(dir.x, dir.z)
        return (
          <mesh key={i} position={mid} rotation={[Math.PI / 2, 0, -ang]}>
            <coneGeometry args={[0.16, 0.38, 6]} />
            <meshBasicMaterial color="#E24B4A" transparent opacity={0.78} />
          </mesh>
        )
      })}
    </group>
  )
}

function DestPin({ point }: { point: { x: number; y: number } }) {
  const [px, , pz] = c2w(point.x, point.y)
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.14 })
  return (
    <group position={[px, 0, pz]}>
      <group ref={ref}><mesh><sphereGeometry args={[0.25, 20, 20]} /><meshStandardMaterial color="#E24B4A" roughness={0.25} /></mesh></group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[0.32, 0.5, 36]} /><meshBasicMaterial color="#E24B4A" transparent opacity={0.45} /></mesh>
    </group>
  )
}

function CornerFlag({ point, number, passed }: { point: { x: number; y: number }; number: number; passed: boolean }) {
  const [x, , z] = c2w(point.x, point.y)
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.75, 0]}><cylinderGeometry args={[0.035, 0.04, 1.5, 8]} /><meshStandardMaterial color={passed ? '#9CA3AF' : '#B45309'} /></mesh>
      <mesh castShadow position={[0.28, 1.45, 0]}><boxGeometry args={[0.56, 0.32, 0.04]} /><meshStandardMaterial color={passed ? '#9CA3AF' : '#F59E0B'} transparent opacity={passed ? 0.4 : 1} /></mesh>
      <Billboard position={[0.28, 1.45, 0.05]}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{ background: passed ? '#9CA3AF' : '#F59E0B', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{number}</div>
        </Html>
      </Billboard>
    </group>
  )
}

function POISign({ poi, selected, onClick }: { poi: POI; selected: boolean; onClick: () => void }) {
  const [x, , z] = c2w(poi.x, poi.y)
  const color = POI_COLOR[poi.type] ?? '#6B7280'
  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <circleGeometry args={[selected ? 0.55 : 0.36, 28]} />
        <meshStandardMaterial color={selected ? color : '#C6BFB4'} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}><cylinderGeometry args={[0.035, 0.05, 1.85, 8]} /><meshStandardMaterial color="#6B6259" roughness={0.45} metalness={0.25} /></mesh>
      <Billboard position={[0, 1.95, 0]}>
        <Html center distanceFactor={11} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: selected ? color : 'rgba(24,24,24,0.84)', color: '#fff', borderRadius: 999,
            padding: '4px 9px', fontWeight: 900, fontSize: 11, fontFamily: '-apple-system,sans-serif', whiteSpace: 'nowrap',
            boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 5px ${color}` : '0 4px 12px rgba(0,0,0,0.28)',
          }}>
            {POI_ICON[poi.type] ?? '•'} {poi.type === 'GATE' ? poi.gateCode : poi.name}
          </div>
        </Html>
      </Billboard>
    </group>
  )
}

function PlayerMarker({ x, z }: { x: number; z: number }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ring.current) return
    const s = 1 + Math.sin(clock.getElapsedTime() * 2.5) * 0.2
    ring.current.scale.setScalar(s)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.32 - Math.sin(clock.getElapsedTime() * 2.5) * 0.12
  })
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[0.28, 0.47, 32]} /><meshBasicMaterial color="#1769AA" transparent opacity={0.32} /></mesh>
      <mesh castShadow position={[0, 0.32, 0]}><sphereGeometry args={[0.28, 24, 24]} /><meshStandardMaterial color="#1769AA" roughness={0.2} metalness={0.25} /></mesh>
    </group>
  )
}

function CameraSetup({ playerX, playerY, walkMode }: { playerX: number; playerY: number; walkMode: boolean }) {
  const { camera } = useThree()
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const [x, , z] = c2w(playerX, playerY)
    camera.position.set(x, EYE_HEIGHT + 2.4, z + 7.5)
    camera.lookAt(x, 1.1, z)
  }, [camera, playerX, playerY])

  useFrame(() => {
    if (!walkMode) return
    const [x, , z] = c2w(playerX, playerY)
    camera.position.y = EYE_HEIGHT
    if (camera.position.distanceTo(new THREE.Vector3(x, EYE_HEIGHT, z)) > 0.1) {
      camera.position.lerp(new THREE.Vector3(x, EYE_HEIGHT, z), 0.28)
    }
  })
  return null
}

function ManualWalkController({ playerX, playerY, floor, walkMode, onPlayerMove }: { playerX: number; playerY: number; floor: number; walkMode: boolean; onPlayerMove?: (x: number, y: number) => void }) {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: PointerEvent) => { if (!walkMode) return; dragging.current = true; lastX.current = e.clientX; el.setPointerCapture?.(e.pointerId) }
    const onMove = (e: PointerEvent) => {
      if (!walkMode || !dragging.current) return
      const dx = e.clientX - lastX.current
      yaw.current -= dx * 0.004
      lastX.current = e.clientX
    }
    const onUp = () => { dragging.current = false }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [gl.domElement, walkMode])

  useFrame((_, delta) => {
    if (!walkMode) return
    const k = keys.current
    const rotate = ((k.arrowleft ? 1 : 0) - (k.arrowright ? 1 : 0)) * 1.9 * delta
    yaw.current += rotate
    const fwd = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0)
    const strafe = (k.d ? 1 : 0) - (k.a ? 1 : 0)
    const speed = (k.shift ? 95 : 58) * delta
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    let nx = playerX + (sin * fwd + cos * strafe) * speed
    let ny = playerY + (-cos * fwd + sin * strafe) * speed
    if ((fwd || strafe) && canStandAt(nx, ny, floor)) onPlayerMove?.(nx, ny)

    const [x, , z] = c2w(playerX, playerY)
    camera.position.set(x, EYE_HEIGHT, z)
    camera.lookAt(x + Math.sin(yaw.current) * 8, EYE_HEIGHT - 0.08, z - Math.cos(yaw.current) * 8)
  })
  return null
}

interface Props {
  playerX: number
  playerY: number
  onSelectPOI: (poi: POI) => void
  onPlayerMove?: (x: number, y: number) => void
}

export default function AirportMap3D({ playerX, playerY, onSelectPOI, onPlayerMove }: Props) {
  const { pois, selectedPOI, route, currentFloor } = useMapStore()
  const [walkMode, setWalkMode] = useState(true)
  const intWalls = currentFloor === 1 ? INTERIOR_WALLS_FLOOR1 : []
  const threeX = cx(playerX)
  const threeZ = cz(playerY)
  const corners = useMemo(() => (route?.path && route.path.length > 2 ? route.path.slice(1, -1) : []), [route])
  const currentFloorMeta = FLOOR_META.find((f) => f.id === currentFloor)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#D8D1C6' }}>
      <Canvas shadows camera={{ fov: 68, near: 0.08, far: 240 }} gl={{ antialias: true, alpha: false }} style={{ background: 'linear-gradient(#EEF3F5,#D8D1C6)' }}>
        <ambientLight intensity={0.56} />
        <hemisphereLight args={['#EAF6FF', '#A88C6B', 0.62]} />
        <directionalLight position={[18, 32, 16]} intensity={0.9} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={45} shadow-camera-bottom={-45} />

        <TerminalShell floor={currentFloor} />
        <CeilingLights />
        {EXTERIOR_WALLS.map((w, i) => <WallMesh key={`ext-${i}`} wall={w} />)}
        {intWalls.map((w, i) => <WallMesh key={`int-${i}`} wall={w} />)}
        <GlassPartitions floor={currentFloor} />
        <Storefronts floor={currentFloor} />
        <Pillars floor={currentFloor} />
        <Seating floor={currentFloor} />
        <Plants floor={currentFloor} />
        <OverheadSigns floor={currentFloor} />

        {route?.path && route.path.length > 1 && (
          <>
            <RouteLine path={route.path} />
            <RouteArrows path={route.path} />
            <DestPin point={route.path[route.path.length - 1]} />
          </>
        )}

        {corners.map((pt, idx) => {
          const [fx, , fz] = c2w(pt.x, pt.y)
          const passed = Math.hypot(threeX - fx, threeZ - fz) < PASSED_DIST_3D
          return <CornerFlag key={idx} point={pt} number={idx + 1} passed={passed} />
        })}

        {pois.map((p) => <POISign key={p.id} poi={p} selected={selectedPOI?.id === p.id} onClick={() => onSelectPOI(p)} />)}
        <PlayerMarker x={threeX} z={threeZ} />
        <ContactShadows position={[0, 0, 0]} opacity={0.28} scale={90} blur={2.5} far={0.5} />

        <CameraSetup playerX={playerX} playerY={playerY} walkMode={walkMode} />
        <ManualWalkController playerX={playerX} playerY={playerY} floor={currentFloor} walkMode={walkMode} onPlayerMove={onPlayerMove} />
        {!walkMode && (
          <OrbitControls makeDefault target={[threeX, 1.2, threeZ]} minDistance={2.8} maxDistance={22} minPolarAngle={0.25} maxPolarAngle={Math.PI * 0.47} enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.72} zoomSpeed={0.9} />
        )}
      </Canvas>

      <ConnectorButtons playerX={playerX} playerY={playerY} onPlayerMove={onPlayerMove} />

      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setWalkMode((v) => !v)} style={{
          border: '1px solid rgba(255,255,255,0.45)', background: walkMode ? '#185FA5' : 'rgba(255,255,255,0.92)',
          color: walkMode ? '#fff' : '#185FA5', borderRadius: 999, padding: '8px 13px', fontSize: 12, fontWeight: 900,
          boxShadow: '0 12px 26px rgba(15,23,42,0.14)', cursor: 'pointer',
        }}>
          {walkMode ? 'Walk mode' : 'Explore mode'}
        </button>
        <div style={{ background: 'rgba(255,255,255,0.92)', color: '#374151', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 800, boxShadow: '0 12px 26px rgba(15,23,42,0.12)' }}>
          {currentFloorMeta?.name ?? `Floor ${currentFloor}`}
        </div>
      </div>

      {corners.length > 0 && (
        <div style={{
          position: 'absolute', top: 12, right: 12, background: 'rgba(17,24,39,0.78)', color: '#fff',
          backdropFilter: 'blur(8px)', borderRadius: 14, padding: '10px 12px', fontSize: 11, lineHeight: 1.75,
          pointerEvents: 'none', minWidth: 145, boxShadow: '0 18px 36px rgba(0,0,0,0.22)',
        }}>
          <div style={{ fontWeight: 900, marginBottom: 4, color: '#FBBF24' }}>🚩 {corners.length} turn{corners.length !== 1 ? 's' : ''} ahead</div>
          {corners.map((pt, idx) => {
            const [fx, , fz] = c2w(pt.x, pt.y)
            const passed = Math.hypot(threeX - fx, threeZ - fz) < PASSED_DIST_3D
            return <div key={idx} style={{ opacity: passed ? 0.42 : 1 }}>{passed ? '✓' : '•'} Turn {idx + 1}</div>
          })}
          {route && <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.18)', color: '#D1D5DB' }}>{Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds / 60)}min</div>}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 12,
        background: 'rgba(17,24,39,0.78)', color: '#fff', backdropFilter: 'blur(8px)', fontSize: 12,
        padding: '7px 14px', borderRadius: 999, pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
      }}>
        {walkMode ? 'W/S or ↑/↓ move · A/D strafe · ←/→ turn · drag to look · reach lift/escalator to change floors' : 'Explore mode: rotate/zoom only · camera cannot go below the floor'}
      </div>
    </div>
  )
}
