'use client'
// components/AirportMap3D.tsx
// Three.js first-person terminal view with waving corner flags on the route.

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Billboard, ContactShadows } from '@react-three/drei'
import { useRef, useMemo, Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { useMapStore } from '@/lib/store'
import { FLOOR_PLANS } from '@/lib/jkia-data'
import { EXTERIOR_WALLS, INTERIOR_WALLS_FLOOR1 } from '@/lib/walls'
import type { POI } from '@/lib/types'

const S  = 0.1, CX = 400 * S, CZ = 290 * S
function cx(v: number) { return v * S - CX }
function cz(v: number) { return v * S - CZ }
function c2w(canvasX: number, canvasY: number, y = 0): [number, number, number] {
  return [cx(canvasX), y, cz(canvasY)]
}
const PASSED_DIST_3D = 2.5

const POI_COLOR: Record<string, string> = {
  GATE:'#185FA5',SHOP:'#3B6D11',DINING:'#3B6D11',LOUNGE:'#993556',
  RESTROOM:'#854F0B',SERVICE:'#854F0B',SECURITY:'#A32D2D',CHECKIN:'#534AB7',
  PHARMACY:'#854F0B',PRAYER:'#534AB7',BAGGAGE:'#5F5E5A',IMMIGRATION:'#A32D2D',
  ESCALATOR:'#185FA5',ELEVATOR:'#185FA5',ATM:'#3B6D11',INFORMATION:'#185FA5',
}
const POI_ICON: Record<string, string> = {
  GATE:'✈',SHOP:'🛍',DINING:'☕',LOUNGE:'🛋',RESTROOM:'🚻',
  SERVICE:'🏥',SECURITY:'🔒',CHECKIN:'🎫',PHARMACY:'💊',
  PRAYER:'✦',BAGGAGE:'🧳',IMMIGRATION:'🛂',ESCALATOR:'▲',
  ELEVATOR:'🔲',ATM:'💳',INFORMATION:'ℹ',
}

function WallMesh({ wall }: { wall: {x:number;y:number;w:number;h:number;kind:string} }) {
  const H = wall.kind === 'exterior' ? 4.8 : 3.8
  return (
    <mesh castShadow receiveShadow position={[cx(wall.x+wall.w/2), H/2, cz(wall.y+wall.h/2)]}>
      <boxGeometry args={[wall.w*S, H, wall.h*S]} />
      <meshStandardMaterial color={wall.kind==='exterior'?'#EAE7E0':'#F2EFE9'} roughness={0.85} metalness={0}/>
    </mesh>
  )
}

function TerminalBase({ floorPlan }: { floorPlan: {walls:any[];corridors:any[]} }) {
  return (
    <group>
      {floorPlan.walls.map((w,i) => {
        const wx=cx(w.x+w.w/2), wz=cz(w.y+w.h/2)
        return (
          <group key={i}>
            <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[wx,0,wz]}>
              <planeGeometry args={[w.w*S,w.h*S]}/>
              <meshStandardMaterial color='#D8D4CC' roughness={0.6} metalness={0.05}/>
            </mesh>
            <mesh rotation={[Math.PI/2,0,0]} position={[wx,4.8,wz]}>
              <planeGeometry args={[w.w*S,w.h*S]}/>
              <meshStandardMaterial color='#F8F7F4' roughness={0.9} side={THREE.BackSide}/>
            </mesh>
          </group>
        )
      })}
      {floorPlan.corridors.map((c,i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI/2,0,0]}
          position={[cx(c.x+c.w/2),0.005,cz(c.y+c.h/2)]}>
          <planeGeometry args={[c.w*S,c.h*S]}/>
          <meshStandardMaterial color='#E8E5DF' roughness={0.55} metalness={0.06}/>
        </mesh>
      ))}
      <gridHelper args={[80,80,'#C2BFBA','#C2BFBA']} position={[0,0.008,0]}/>
    </group>
  )
}

function CeilingLights() {
  const pos: [number,number,number][] = [
    [-20,4.2,-12],[0,4.2,-12],[20,4.2,-12],
    [-20,4.2,0],[0,4.2,0],[20,4.2,0],
    [-20,4.2,12],[0,4.2,12],[20,4.2,12],
  ]
  return (
    <>
      {pos.map(([lx,ly,lz],i) => (
        <group key={i} position={[lx,ly,lz]}>
          <mesh><boxGeometry args={[2,0.06,0.3]}/><meshBasicMaterial color='#FFFEF0'/></mesh>
          <pointLight intensity={1.1} distance={18} color='#FFF8EE'/>
        </group>
      ))}
    </>
  )
}

// ── Corner flag — waving navigation marker ─────────────────────────────────────
function CornerFlag({ position, number, passed }: {
  position: [number,number,number]; number: number; passed: boolean
}) {
  const flagRef  = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const phase    = number * 0.85

  useFrame(({ clock }) => {
    if (!flagRef.current || !groupRef.current) return
    const t = clock.getElapsedTime()
    flagRef.current.rotation.y  = passed ? 0 : Math.sin(t*2.3+phase) * 0.28
    groupRef.current.position.y = passed ? 0 : Math.sin(t*1.7+phase) * 0.04
  })

  const flagColor = passed ? '#9CA3AF' : '#F59E0B'
  const poleColor = passed ? '#9CA3AF' : '#B45309'
  const alpha     = passed ? 0.28 : 1.0

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Floor disc */}
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}>
          <circleGeometry args={[0.3,24]}/>
          <meshBasicMaterial color={flagColor} transparent opacity={alpha}/>
        </mesh>
        {/* Pole */}
        <mesh castShadow position={[0,0.85,0]}>
          <cylinderGeometry args={[0.035,0.04,1.7,8]}/>
          <meshStandardMaterial color={poleColor} roughness={0.5} metalness={0.2} transparent opacity={alpha}/>
        </mesh>
        {/* Waving flag panel */}
        <mesh ref={flagRef} castShadow position={[0.28,1.6,0]}>
          <boxGeometry args={[0.56,0.36,0.04]}/>
          <meshStandardMaterial color={flagColor} roughness={0.6} transparent opacity={alpha}/>
        </mesh>
        {/* Number badge */}
        <Billboard position={[0.28,1.6,0.05]}>
          <Html center distanceFactor={9} style={{pointerEvents:'none',userSelect:'none'}}>
            <div style={{
              background: passed ? '#9CA3AF' : '#F59E0B',
              color:'#fff', borderRadius:'50%',
              width:22, height:22,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800,
              fontFamily:'-apple-system,sans-serif',
              boxShadow: passed ? 'none' : '0 2px 6px rgba(0,0,0,0.4)',
              opacity: passed ? 0.35 : 1,
            }}>{number}</div>
          </Html>
        </Billboard>
        {/* "Turn N" label at base */}
        {!passed && (
          <Billboard position={[0,0.08,0]}>
            <Html center distanceFactor={14} style={{pointerEvents:'none',userSelect:'none'}}>
              <div style={{
                background:'rgba(245,158,11,0.9)', color:'#fff',
                borderRadius:4, padding:'2px 6px', fontSize:9, fontWeight:700,
                fontFamily:'-apple-system,sans-serif', whiteSpace:'nowrap',
              }}>Turn {number}</div>
            </Html>
          </Billboard>
        )}
      </group>
    </group>
  )
}

// ── Route line with animated dashes + direction cone arrows ────────────────────
function RouteLine({ path }: { path: Array<{x:number;y:number}> }) {
  const matRef = useRef<THREE.LineDashedMaterial|null>(null)

  const { line, arrows } = useMemo(() => {
    const pts  = path.map(p => new THREE.Vector3(...c2w(p.x,p.y,0.07)))
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    const mat  = new THREE.LineDashedMaterial({ color:'#E24B4A', dashSize:0.5, gapSize:0.25 })
    const l    = new THREE.Line(geom, mat)
    l.computeLineDistances()
    matRef.current = mat

    const ag = new THREE.Group()
    for (let i = 0; i < path.length - 1; i++) {
      const a = new THREE.Vector3(...c2w(path[i].x,path[i].y,0.08))
      const b = new THREE.Vector3(...c2w(path[i+1].x,path[i+1].y,0.08))
      const seg = a.distanceTo(b)
      if (seg < 1.2) continue   // skip micro-segments
      const mid = a.clone().lerp(b, 0.5)
      const dir = b.clone().sub(a).normalize()
      const ang = Math.atan2(dir.x, dir.z)
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.32, 6),
        new THREE.MeshBasicMaterial({ color:'#E24B4A', transparent:true, opacity:0.72 })
      )
      cone.geometry.rotateX(Math.PI/2)
      cone.position.copy(mid)
      cone.rotation.y = -ang
      ag.add(cone)
    }
    return { line: l, arrows: ag }
  }, [path])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.dashOffset = -clock.getElapsedTime() * 0.55
  })

  return (
    <>
      <primitive object={line}/>
      <primitive object={arrows}/>
    </>
  )
}

function DestPin({ point }: { point: {x:number;y:number} }) {
  const [px,,pz] = c2w(point.x, point.y)
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 0.4 + Math.sin(clock.getElapsedTime()*3)*0.18
  })
  return (
    <group position={[px,0,pz]}>
      <group ref={ref}>
        <mesh><sphereGeometry args={[0.24,16,16]}/><meshStandardMaterial color='#E24B4A' roughness={0.25}/></mesh>
      </group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}>
        <ringGeometry args={[0.3,0.44,32]}/>
        <meshBasicMaterial color='#E24B4A' transparent opacity={0.5}/>
      </mesh>
    </group>
  )
}

function POISign({ poi, selected, onClick }: { poi:POI; selected:boolean; onClick:()=>void }) {
  const [wx,,wz] = c2w(poi.x, poi.y)
  const color = POI_COLOR[poi.type] ?? '#888780'
  const ref   = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current && selected) ref.current.position.y = 0.5 + Math.sin(clock.getElapsedTime()*2.2)*0.07
    else if (ref.current) ref.current.position.y = 0.5
  })
  return (
    <group position={[wx,0,wz]} onClick={onClick}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}>
        <circleGeometry args={[0.38,32]}/>
        <meshStandardMaterial color={selected?color:'#B8B4AE'} roughness={0.4} metalness={0.3}/>
      </mesh>
      <mesh castShadow position={[0,1.0,0]}>
        <cylinderGeometry args={[0.04,0.05,2.0,8]}/>
        <meshStandardMaterial color='#9A9690' roughness={0.3} metalness={0.6}/>
      </mesh>
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[1.1,0.55,0.12]}/>
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1}/>
        </mesh>
        <Billboard position={[0,0.4,0]}>
          <Html center distanceFactor={10} style={{pointerEvents:'none',userSelect:'none'}}>
            <div style={{
              background: selected?color:'rgba(20,20,20,0.82)',
              color:'#fff', borderRadius:7, padding:'4px 10px',
              fontSize:13, fontWeight:700, fontFamily:'-apple-system,sans-serif',
              textAlign:'center', lineHeight:1.3, whiteSpace:'nowrap',
              boxShadow: selected?`0 0 0 2.5px white,0 0 0 5px ${color}`:'0 2px 8px rgba(0,0,0,0.5)',
            }}>
              <div>{POI_ICON[poi.type]??'i'} {poi.type==='GATE'?(poi.gateCode??''):poi.name}</div>
              {selected&&poi.description&&(
                <div style={{fontWeight:400,fontSize:10,opacity:0.9,maxWidth:170,whiteSpace:'normal',marginTop:2}}>
                  {poi.description.split('·')[0].trim()}
                </div>
              )}
            </div>
          </Html>
        </Billboard>
      </group>
      {selected&&(
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}>
          <ringGeometry args={[0.45,0.6,36]}/>
          <meshBasicMaterial color={color} transparent opacity={0.6}/>
        </mesh>
      )}
    </group>
  )
}

function PlayerBall({ x, z }: { x:number; z:number }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const s = 1 + Math.sin(clock.getElapsedTime()*2.8)*0.22
    ringRef.current.scale.setScalar(s)
    ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.35 - Math.sin(clock.getElapsedTime()*2.8)*0.18
  })
  return (
    <group position={[x,0,z]}>
      <mesh ref={ringRef} rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}>
        <ringGeometry args={[0.28,0.45,32]}/>
        <meshBasicMaterial color='#185FA5' transparent opacity={0.35}/>
      </mesh>
      <mesh castShadow position={[0,0.28,0]}>
        <sphereGeometry args={[0.28,24,24]}/>
        <meshStandardMaterial color='#185FA5' roughness={0.2} metalness={0.3}/>
      </mesh>
      <mesh position={[0,0.28,0]}>
        <sphereGeometry args={[0.33,24,24]}/>
        <meshStandardMaterial color='white' transparent opacity={0.45} side={THREE.BackSide} roughness={0.1}/>
      </mesh>
    </group>
  )
}

function CameraInit({ px, pz }: { px:number; pz:number }) {
  const { camera } = useThree()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    camera.position.set(px, 1.7, pz+5)
    camera.lookAt(px, 1.5, pz)
  }, [camera, px, pz])
  return null
}

interface Props { playerX:number; playerY:number; onSelectPOI:(poi:POI)=>void }

export default function AirportMap3D({ playerX, playerY, onSelectPOI }: Props) {
  const { pois, selectedPOI, route, currentFloor } = useMapStore()
  const floorPlan = FLOOR_PLANS[currentFloor] ?? FLOOR_PLANS[1]
  const intWalls  = currentFloor === 1 ? INTERIOR_WALLS_FLOOR1 : []

  const threeX = cx(playerX)
  const threeZ = cz(playerY)

  const corners = useMemo(
    () => (route?.path && route.path.length > 2 ? route.path.slice(1,-1) : []),
    [route]
  )

  return (
    <div style={{width:'100%',height:'100%',position:'relative'}}>
      <Canvas shadows camera={{fov:70,near:0.1,far:300}}
        gl={{antialias:true,alpha:false}} style={{background:'#D6D2C8'}}>
        <ambientLight intensity={0.4}/>
        <directionalLight position={[20,30,15]} intensity={0.7} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-near={0.5} shadow-camera-far={120}
          shadow-camera-left={-50} shadow-camera-right={50}
          shadow-camera-top={40} shadow-camera-bottom={-40}/>
        <hemisphereLight args={['#C8DCF0','#C0B090',0.3]}/>

        <Suspense fallback={null}>
          <TerminalBase floorPlan={floorPlan}/>
          <CeilingLights/>
          {EXTERIOR_WALLS.map((w,i) => <WallMesh key={`ext-${i}`} wall={w}/>)}
          {intWalls.map((w,i) => <WallMesh key={`int-${i}`} wall={w}/>)}

          {route?.path && route.path.length > 1 && (
            <>
              <RouteLine path={route.path}/>
              <DestPin point={route.path[route.path.length-1]}/>
            </>
          )}

          {corners.map((pt, idx) => {
            const [fx,,fz] = c2w(pt.x, pt.y)
            const passed = Math.hypot(threeX-fx, threeZ-fz) < PASSED_DIST_3D
            return <CornerFlag key={idx} position={[fx,0,fz]} number={idx+1} passed={passed}/>
          })}

          {pois.map(p => (
            <POISign key={p.id} poi={p}
              selected={selectedPOI?.id===p.id}
              onClick={() => onSelectPOI(p)}/>
          ))}

          <PlayerBall x={threeX} z={threeZ}/>
          <ContactShadows position={[0,0,0]} opacity={0.25} scale={90} blur={2.5} far={0.5}/>
        </Suspense>

        <CameraInit px={threeX} pz={threeZ}/>
        <OrbitControls makeDefault target={[threeX,1.6,threeZ]}
          minDistance={0.4} maxDistance={22}
          minPolarAngle={0.04} maxPolarAngle={Math.PI*0.84}
          enableDamping dampingFactor={0.07}
          rotateSpeed={0.8} zoomSpeed={1.1}
          touches={{ONE:2 as any,TWO:512 as any}}/>
      </Canvas>

      {/* Route summary panel */}
      {corners.length > 0 && (
        <div style={{
          position:'absolute', top:12, right:12,
          background:'rgba(0,0,0,0.64)', color:'#fff',
          backdropFilter:'blur(6px)',
          borderRadius:10, padding:'8px 12px',
          fontSize:11, lineHeight:1.8, pointerEvents:'none', minWidth:130,
        }}>
          <div style={{fontWeight:700, marginBottom:4, color:'#F59E0B'}}>
            🚩 {corners.length} turn{corners.length!==1?'s':''} ahead
          </div>
          {corners.map((pt,idx) => {
            const [fx,,fz] = c2w(pt.x,pt.y)
            const passed = Math.hypot(threeX-fx, threeZ-fz) < PASSED_DIST_3D
            return (
              <div key={idx} style={{
                display:'flex', alignItems:'center', gap:6,
                opacity: passed?0.4:1,
              }}>
                <span style={{
                  background: passed?'#6B7280':'#F59E0B',
                  borderRadius:'50%', width:16, height:16,
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  fontSize:9, fontWeight:800, flexShrink:0,
                }}>{idx+1}</span>
                <span style={{textDecoration:passed?'line-through':'none'}}>
                  Turn {idx+1}{passed?' ✓':''}
                </span>
              </div>
            )
          })}
          {route && (
            <div style={{marginTop:6, paddingTop:5, borderTop:'1px solid rgba(255,255,255,0.18)', color:'#9CA3AF', fontSize:10}}>
              {Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds/60)}min
            </div>
          )}
        </div>
      )}

      <div style={{
        position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,0,0,0.58)', color:'#fff', backdropFilter:'blur(4px)',
        fontSize:11, padding:'5px 14px', borderRadius:20,
        pointerEvents:'none', whiteSpace:'nowrap',
      }}>
        Drag to look · Scroll/pinch to zoom · Tap sign to navigate
      </div>
    </div>
  )
}