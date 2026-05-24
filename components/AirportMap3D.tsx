'use client'
// components/AirportMap3D.tsx
// First-person 3D airport view.
// All wall geometry is derived from lib/walls.ts — same data used by pathfinding,
// so the navigable paths are guaranteed to pass through the doorway gaps.

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Billboard, ContactShadows } from '@react-three/drei'
import { useRef, useMemo, Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { useMapStore } from '@/lib/store'
import { FLOOR_PLANS } from '@/lib/jkia-data'
import { EXTERIOR_WALLS, INTERIOR_WALLS_FLOOR1 } from '@/lib/walls'
import type { POI, WallRect } from '@/lib/types'

// ── Coordinate helpers ────────────────────────────────────────────────────────
const S  = 0.1          // 1 canvas px = 0.1 Three.js unit ≈ 0.1 m
const CX = 400 * S      // canvas centre-X → 3D origin
const CZ = 290 * S      // canvas centre-Y → 3D origin

function cx(canvasX: number) { return canvasX * S - CX }
function cz(canvasY: number) { return canvasY * S - CZ }
function c2w(canvasX: number, canvasY: number, y = 0): [number, number, number] {
  return [cx(canvasX), y, cz(canvasY)]
}

// ── POI colours & icons ───────────────────────────────────────────────────────
const POI_COLOR: Record<string, string> = {
  GATE:'#185FA5', SHOP:'#3B6D11', DINING:'#3B6D11', LOUNGE:'#993556',
  RESTROOM:'#854F0B', SERVICE:'#854F0B', SECURITY:'#A32D2D', CHECKIN:'#534AB7',
  PHARMACY:'#854F0B', PRAYER:'#534AB7', BAGGAGE:'#5F5E5A', IMMIGRATION:'#A32D2D',
  ESCALATOR:'#185FA5', ELEVATOR:'#185FA5', ATM:'#3B6D11', INFORMATION:'#185FA5',
}
const POI_ICON: Record<string, string> = {
  GATE:'✈', SHOP:'🛍', DINING:'☕', LOUNGE:'🛋', RESTROOM:'🚻',
  SERVICE:'🏥', SECURITY:'🔒', CHECKIN:'🎫', PHARMACY:'💊',
  PRAYER:'✦', BAGGAGE:'🧳', IMMIGRATION:'🛂', ESCALATOR:'▲',
  ELEVATOR:'🔲', ATM:'💳', INFORMATION:'ℹ',
}

// ── Wall mesh ─────────────────────────────────────────────────────────────────
// Converts a WallRect (canvas coords) into a single BoxGeometry.
// Using inline meshStandardMaterial on every instance avoids the shared-material bug.
function WallMesh({ wall }: { wall: WallRect }) {
  const isExterior = wall.kind === 'exterior'
  const WALL_H = isExterior ? 4.8 : 3.8   // exterior taller
  const WALL_Y = WALL_H / 2               // pivot at floor level

  // Convert canvas rect → Three.js centre + size
  const wx = cx(wall.x + wall.w / 2)
  const wz = cz(wall.y + wall.h / 2)
  const ww = wall.w * S                   // Three.js width  (canvas X axis)
  const wd = wall.h * S                   // Three.js depth  (canvas Y axis)

  return (
    <mesh castShadow receiveShadow position={[wx, WALL_Y, wz]}>
      <boxGeometry args={[ww, WALL_H, wd]} />
      <meshStandardMaterial
        color={isExterior ? '#EAE7E0' : '#F2EFE9'}
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  )
}

// ── Floor & ceiling ────────────────────────────────────────────────────────────
function TerminalBase({ floorPlan }: { floorPlan: { walls: any[]; corridors: any[] } }) {
  return (
    <group>
      {floorPlan.walls.map((w, i) => {
        const wx = cx(w.x + w.w / 2)
        const wz = cz(w.y + w.h / 2)
        const ww = w.w * S
        const wd = w.h * S
        return (
          <group key={i}>
            {/* Main floor tile */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[wx, 0, wz]}>
              <planeGeometry args={[ww, wd, 1, 1]} />
              <meshStandardMaterial color='#D8D4CC' roughness={0.6} metalness={0.05} />
            </mesh>

            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[wx, 4.8, wz]}>
              <planeGeometry args={[ww, wd]} />
              <meshStandardMaterial color='#F8F7F4' roughness={0.9} metalness={0} side={THREE.BackSide} />
            </mesh>
          </group>
        )
      })}

      {/* Corridor floors — slightly lighter tile to match the 2D map */}
      {floorPlan.corridors.map((c, i) => {
        const wx = cx(c.x + c.w / 2)
        const wz = cz(c.y + c.h / 2)
        return (
          <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[wx, 0.005, wz]}>
            <planeGeometry args={[c.w * S, c.h * S]} />
            <meshStandardMaterial color='#E8E5DF' roughness={0.55} metalness={0.06} />
          </mesh>
        )
      })}

      {/* Subtle floor grid lines */}
      <gridHelper args={[80, 80, '#C2BFBA', '#C2BFBA']} position={[0, 0.008, 0]} />
    </group>
  )
}

// ── Overhead lighting rigs ─────────────────────────────────────────────────────
function CeilingLights() {
  const positions: [number, number, number][] = [
    [-20, 4.2, -12], [0, 4.2, -12], [20, 4.2, -12],
    [-20, 4.2,  0 ], [0, 4.2,  0 ], [20, 4.2,  0 ],
    [-20, 4.2,  12], [0, 4.2,  12], [20, 4.2,  12],
  ]
  return (
    <>
      {positions.map(([lx, ly, lz], i) => (
        <group key={i} position={[lx, ly, lz]}>
          {/* Visible fixture */}
          <mesh>
            <boxGeometry args={[2.0, 0.06, 0.3]} />
            <meshBasicMaterial color='#FFFEF0' />
          </mesh>
          {/* Light */}
          <pointLight intensity={1.2} distance={18} color='#FFF8EE' castShadow={false} />
        </group>
      ))}
    </>
  )
}

// ── POI sign post ─────────────────────────────────────────────────────────────
function POISign({ poi, selected, onClick }: {
  poi: POI; selected: boolean; onClick: () => void
}) {
  const [wx, , wz] = c2w(poi.x, poi.y)
  const color = POI_COLOR[poi.type] ?? '#888780'
  const icon  = POI_ICON[poi.type]  ?? 'i'
  const label = poi.type === 'GATE' ? (poi.gateCode ?? '') : poi.name

  const postRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (postRef.current && selected) {
      postRef.current.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.08
    } else if (postRef.current) {
      postRef.current.position.y = 0.5
    }
  })

  return (
    <group position={[wx, 0, wz]} onClick={onClick}>
      {/* Floor disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial color={selected ? color : '#B8B4AE'} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Pole */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.0, 8]} />
        <meshStandardMaterial color='#9A9690' roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Sign board */}
      <mesh ref={postRef} castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.1, 0.55, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* HTML label — always faces camera regardless of orbit angle */}
      <Billboard position={[0, 2.35, 0]}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: selected ? color : 'rgba(30,30,30,0.82)',
            color: '#fff',
            borderRadius: 7,
            padding: '4px 10px',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '-apple-system,sans-serif',
            textAlign: 'center',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            boxShadow: selected ? `0 0 0 2.5px white, 0 0 0 5px ${color}` : '0 2px 8px rgba(0,0,0,0.5)',
            transform: 'translateZ(0)',
          }}>
            <div>{icon} {label}</div>
            {selected && poi.description && (
              <div style={{
                fontWeight: 400, fontSize: 10, opacity: 0.9,
                maxWidth: 170, whiteSpace: 'normal', marginTop: 2,
              }}>
                {poi.description.split('·')[0].trim()}
              </div>
            )}
          </div>
        </Html>
      </Billboard>

      {/* Selection ring on floor */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.45, 0.6, 36]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

// ── Route line on the floor ───────────────────────────────────────────────────
function RouteLine({ path }: { path: Array<{ x: number; y: number }> }) {
  const matRef = useRef<THREE.LineDashedMaterial>(null)

  const { line } = useMemo(() => {
    const pts  = path.map(p => new THREE.Vector3(...c2w(p.x, p.y, 0.06)))
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    const mat  = new THREE.LineDashedMaterial({ color: '#E24B4A', dashSize: 0.5, gapSize: 0.25 })
    const obj  = new THREE.Line(geom, mat)
    obj.computeLineDistances()
    return { line: obj }
  }, [path])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.dashOffset = -clock.getElapsedTime() * 0.5
  })

  // Sync matRef to the line's material
  useEffect(() => {
    matRef.current = line.material as THREE.LineDashedMaterial
  }, [line])

  return <primitive object={line} />
}

// ── Destination pin ────────────────────────────────────────────────────────────
function DestPin({ path }: { path: Array<{ x: number; y: number }> }) {
  const dest = path[path.length - 1]
  const [px, , pz] = c2w(dest.x, dest.y)
  const pinRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (pinRef.current) pinRef.current.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.15
  })
  return (
    <group position={[px, 0, pz]}>
      <group ref={pinRef}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color='#E24B4A' roughness={0.3} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.28, 0.4, 32]} />
        <meshBasicMaterial color='#E24B4A' transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ── Player avatar ─────────────────────────────────────────────────────────────
function PlayerBall({ x, z }: { x: number; z: number }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const s = 1 + Math.sin(clock.getElapsedTime() * 2.8) * 0.22
    ringRef.current.scale.setScalar(s)
    ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.35 - Math.sin(clock.getElapsedTime() * 2.8) * 0.18
  })
  return (
    <group position={[x, 0, z]}>
      {/* Pulse ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.28, 0.45, 32]} />
        <meshBasicMaterial color='#185FA5' transparent opacity={0.35} />
      </mesh>
      {/* Body */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color='#185FA5' roughness={0.2} metalness={0.3} />
      </mesh>
      {/* White outline shell */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.33, 24, 24]} />
        <meshStandardMaterial
          color='white' transparent opacity={0.45}
          roughness={0.1} metalness={0} side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

// ── Camera: start at eye level, allow full orbit ──────────────────────────────
function CameraInit({ px, pz }: { px: number; pz: number }) {
  const { camera } = useThree()
  const ready = useRef(false)
  useEffect(() => {
    if (ready.current) return
    ready.current = true
    camera.position.set(px, 1.7, pz + 5)
    camera.lookAt(px, 1.5, pz)
  }, [camera, px, pz])
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  playerX: number
  playerY: number
  onSelectPOI: (poi: POI) => void
}

export default function AirportMap3D({ playerX, playerY, onSelectPOI }: Props) {
  const { pois, selectedPOI, route, currentFloor } = useMapStore()
  const floorPlan = FLOOR_PLANS[currentFloor] ?? FLOOR_PLANS[1]

  const threeX = playerX * S - CX
  const threeZ = playerY * S - CZ

  // Walls: exterior always shown; interior only on floor 1
  const intWalls = currentFloor === 1 ? INTERIOR_WALLS_FLOOR1 : []

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#D6D2C8' }}
      >
        {/* Scene-level lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[20, 30, 15]}
          intensity={0.7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={120}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <hemisphereLight args={['#C8DCF0', '#C0B090', 0.3]} />

        <Suspense fallback={null}>
          {/* Floor + ceiling + corridor highlights */}
          <TerminalBase floorPlan={floorPlan} />

          {/* Overhead fixture lights */}
          <CeilingLights />

          {/* ── EXTERIOR walls (perimeter) ── */}
          {EXTERIOR_WALLS.map((w, i) => (
            <WallMesh key={`ext-${i}`} wall={w} />
          ))}

          {/* ── INTERIOR walls (doorway-segmented partitions) ── */}
          {intWalls.map((w, i) => (
            <WallMesh key={`int-${i}`} wall={w} />
          ))}

          {/* POI signs */}
          {pois.map(p => (
            <POISign
              key={p.id}
              poi={p}
              selected={selectedPOI?.id === p.id}
              onClick={() => onSelectPOI(p)}
            />
          ))}

          {/* Route path on floor */}
          {route?.path && route.path.length > 1 && (
            <>
              <RouteLine path={route.path} />
              <DestPin   path={route.path} />
            </>
          )}

          {/* Player */}
          <PlayerBall x={threeX} z={threeZ} />

          {/* Soft contact shadows */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.25}
            scale={90}
            blur={2.5}
            far={0.5}
          />
        </Suspense>

        {/* Camera: start at eye level, then freely orbit */}
        <CameraInit px={threeX} pz={threeZ} />
        <OrbitControls
          makeDefault
          target={[threeX, 1.6, threeZ]}
          minDistance={0.4}
          maxDistance={22}
          minPolarAngle={0.04}
          maxPolarAngle={Math.PI * 0.84}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.8}
          zoomSpeed={1.1}
          // Touch: ONE finger = rotate, TWO fingers = zoom
          touches={{ ONE: 2 as any, TWO: 512 as any }}
        />
      </Canvas>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.58)', color: '#fff', backdropFilter: 'blur(4px)',
        fontSize: 11, padding: '5px 14px', borderRadius: 20,
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        Drag to look · Scroll/pinch to zoom · Tap sign to navigate
      </div>
    </div>
  )
}