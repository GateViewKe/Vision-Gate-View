'use client'
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useMapStore } from '@/lib/store'
import { congestionColor, type CongestionSnapshot } from '@/lib/congestion'

const SC = 0.11, S = (v: number) => v * SC, FH = S(24), OX = -S(400), OZ = -S(250)
const wx = (x: number) => S(x) + OX, wz = (y: number) => S(y) + OZ

const mm = (color: number, rough = 0.75, metal = 0, emit = 0, emitI = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive: emit, emissiveIntensity: emitI })
const GLASS = new THREE.MeshStandardMaterial({ color: 0x88BBEE, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.35 })

const TC: Record<string, number> = {
  GATE: 0x2563EB, SHOP: 0x059669, DINING: 0x059669, LOUNGE: 0x9333EA,
  SERVICE: 0xD97706, RESTROOM: 0xD97706, SECURITY: 0xDC2626,
  CHECKIN: 0x7C3AED, IMMIGRATION: 0xC2410C, BAGGAGE: 0x0891B2, RESTAURANT: 0x059669,
}

function addBox(p: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, cast = true, recv = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; p.add(m); return m
}

function buildFloorGeometry(pois: any[], fi: number, targets: THREE.Mesh[]): THREE.Group {
  const g = new THREE.Group(), fy = fi * FH, TW = S(700), TD = S(480), mx = OX + TW / 2, mz = OZ + TD / 2
  const FC = [0x0D1F35, 0x0F2340, 0x0A1828]
  addBox(g, TW, S(3), TD, mx, fy, mz, mm(FC[fi], 0.9), false)
  if (fi === 1) {
    addBox(g, TW, S(2.5), S(92), mx, fy + S(1.8), OZ + S(46), mm(0x0F3060, 0.85), false)
    addBox(g, TW, S(2.5), S(92), mx, fy + S(1.8), OZ + TD - S(46), mm(0x0F3060, 0.85), false)
    addBox(g, S(520), S(1.5), S(58), wx(370), fy + S(2.2), wz(200), mm(0x142840, 0.9), false)
    addBox(g, S(520), S(1.5), S(58), wx(370), fy + S(2.2), wz(350), mm(0x142840, 0.9), false)
    addBox(g, S(115), S(1.5), S(250), wx(370), fy + S(2.2), wz(280), mm(0x142840, 0.9), false)
  }
  if (fi === 0) {
    addBox(g, TW, S(2), S(85), mx, fy + S(1.6), OZ + S(105), mm(0x0D2035, 0.9), false)
    addBox(g, TW, S(2), S(105), mx, fy + S(1.6), OZ + TD - S(113), mm(0x111E35, 0.9), false)
  }
  const WH = S(22)
  ;[
    [mx, fy + WH / 2, OZ + S(2), TW, WH, S(4)],
    [mx, fy + WH / 2, OZ + TD - S(2), TW, WH, S(4)],
    [OX + S(2), fy + WH / 2, mz, S(4), WH, TD],
    [OX + TW - S(2), fy + WH / 2, mz, S(4), WH, TD],
  ].forEach(([x, y, z, w, h, d]) => addBox(g, w, h, d, x, y, z, mm(0x142030, 0.85)))
  addBox(g, TW, S(2), TD, mx, fy + WH + S(2), mz, mm(0x0C1A2A, 0.9), false, false)
  if (fi === 2) {
    const gm = new THREE.MeshStandardMaterial({ color: 0x6fa8d8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28 })
    addBox(g, TW - S(10), S(14), S(2.5), mx, fy + S(14), OZ + S(2.5), gm, false, false)
    addBox(g, TW - S(10), S(14), S(2.5), mx, fy + S(14), OZ + TD - S(2.5), gm, false, false)
  }
  for (let i = 0; i < 6; i++) {
    const lx = wx(100 + i * 100)
    addBox(g, S(60), S(0.8), S(5), lx, fy + WH + S(1.6), mz, mm(0xCCDDFF, 1, 0, 0xCCDDFF, 0.75), false, false)
    const pl = new THREE.PointLight(0x6088CC, 0.28, S(60)); pl.position.set(lx, fy + WH + S(5), mz); g.add(pl)
  }
  const colM = mm(0x1A3050, 0.7, 0.15)
  for (let i = 0; i < 7; i++) {
    const cx = wx(100 + i * 90)
    addBox(g, S(5), WH, S(5), cx, fy + WH / 2, wz(220), colM)
    addBox(g, S(5), WH, S(5), cx, fy + WH / 2, wz(360), colM)
  }
  ;[wx(200), wx(560)].forEach(ex => {
    addBox(g, S(20), FH, S(12), ex, fy + FH / 2, wz(260), mm(0x1E3A5A, 0.55, 0.3))
    const el = new THREE.PointLight(0x4488FF, 0.45, S(40)); el.position.set(ex, fy + FH + S(6), wz(260)); g.add(el)
  })
  for (const p of pois) {
    const color = TC[p.type] ?? 0x888888
    const bmat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.12, emissive: color, emissiveIntensity: 0.1 })
    const isGate = p.type === 'GATE', isBag = p.type === 'BAGGAGE', isCheckin = p.type === 'CHECKIN'
    const bh = isGate ? S(12) : isCheckin ? S(5.5) : isBag ? S(3.5) : S(8)
    const bw = isGate ? S(15) : S(13)
    const bx = wx(p.x), bz = wz(p.y)
    const bld = addBox(g, bw, bh, S(7.5), bx, fy + bh / 2 + S(3.5), bz, bmat)
    bld.userData = { poi: p, fi }; targets.push(bld)
    addBox(g, bw - S(1), S(0.8), S(5.5), bx, fy + bh + S(4), bz, mm(color, 1, 0, color, 0.65), false, false)
    const pl2 = new THREE.PointLight(color, isGate ? 0.65 : 0.38, S(isGate ? 70 : 50)); pl2.position.set(bx, fy + bh + S(10), bz); g.add(pl2)
    if (isGate) {
      addBox(g, S(3.5), S(5.5), S(24), bx, fy + S(6.5), bz - S(18), GLASS, false, false)
      addBox(g, S(13), S(5), S(6.5), bx, fy + S(6.5), bz + S(10), mm(0x0D2238, 0.6, 0.3))
    }
    if (isBag) {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(S(11), S(2.5), 6, 28), mm(0x0D2238, 0.6, 0.3))
      tor.rotation.x = Math.PI / 2; tor.position.set(bx, fy + S(3), bz); g.add(tor)
    }
    if (['SHOP', 'DINING', 'RESTAURANT', 'LOUNGE'].includes(p.type))
      addBox(g, bw + S(3), S(1), S(10), bx, fy + bh + S(4.8), bz + S(8), mm(color, 0.9, 0, color, 0.06), false, false)
  }
  return g
}

function buildHeatmesh(snap: CongestionSnapshot, fi: number): THREE.Mesh {
  const fy = fi * FH + S(3.8), TW = S(700), TD = S(480), res = snap.resolution
  const geo = new THREE.PlaneGeometry(TW, TD, res - 1, res - 1); geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute, colors: number[] = []
  for (let i = 0; i < pos.count; i++) {
    const nx = (pos.getX(i) - OX) / TW, nz = (pos.getZ(i) - OZ) / TD
    const ci = Math.round(nx * (res - 1)), cj = Math.round(nz * (res - 1))
    const cell = snap.cells[Math.max(0, Math.min(snap.cells.length - 1, cj * res + ci))]
    const [r, gg, b] = congestionColor(cell?.intensity ?? 0); colors.push(r, gg, b)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.52, depthWrite: false }))
  m.position.set(OX + TW / 2, fy, OZ + TD / 2); m.visible = false; return m
}

function buildRoute(path: Array<{ x: number; y: number }>, fi: number): THREE.Group {
  const grp = new THREE.Group(), fy = fi * FH + S(5.5)
  const pts = path.map(p => new THREE.Vector3(wx(p.x), fy, wz(p.y)))
  const curve = new THREE.CatmullRomCurve3(pts), cpts = curve.getPoints(100)
  grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cpts), new THREE.LineBasicMaterial({ color: 0x3B82F6 })))
  const dm = mm(0x3B82F6, 1, 0, 0x3B82F6, 0.6)
  for (let i = 0; i < cpts.length; i += 9) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(S(1.8), 8, 8), dm); d.position.copy(cpts[i]); grp.add(d)
  }
  return grp
}

export interface AirportMap3DHandle { updateHeatmap: (snap: CongestionSnapshot, fi: number) => void }

interface Props {
  playerX: number; playerY: number; currentFloor: number; heatmapOn: boolean
  onSelectPOI: (poi: any) => void
  onFloorTransitionEnd?: (f: number) => void
  mapRef?: React.MutableRefObject<AirportMap3DHandle | null>
}

export default function AirportMap3D({ playerX, playerY, currentFloor, heatmapOn, onSelectPOI, onFloorTransitionEnd, mapRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendRef = useRef<THREE.WebGLRenderer | null>(null)
  const camRef = useRef<THREE.PerspectiveCamera | null>(null)
  const st = useRef<any>(null)
  const { route } = useMapStore()

  const updateCam = (orbit: any, floor: number) => {
    const cam = camRef.current; if (!cam) return
    const fx = OX + S(350), fz = OZ + S(240), fy = floor * FH
    cam.position.set(orbit.r * Math.sin(orbit.phi) * Math.sin(orbit.theta) + fx, orbit.r * Math.cos(orbit.phi) + fy + 3, orbit.r * Math.sin(orbit.phi) * Math.cos(orbit.theta) + fz)
    cam.lookAt(fx, fy + 3, fz)
  }

  const setVisible = useCallback((fi: number) => {
    const s = st.current; if (!s) return
    s.fgs.forEach((g: THREE.Group, i: number) => g.visible = i === fi)
    s.hms.forEach((m: THREE.Mesh, i: number) => { m.visible = i === fi && heatmapOn })
    s.pg.position.y = fi * FH
  }, [heatmapOn])

  const animFloor = useCallback((target: number) => {
    const s = st.current; if (!s || s.transitioning || target === s.cf) return
    s.transitioning = true
    const fromY = s.cf * FH, toY = target * FH; let t2 = 0
    const step = () => {
      t2 = Math.min(1, t2 + 0.035)
      const e = t2 < 0.5 ? 2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 2) / 2
      const midY = fromY + (toY - fromY) * e, cam = camRef.current!
      const { orbit } = s, fx = OX + S(350), fz = OZ + S(240)
      cam.position.set(orbit.r * Math.sin(orbit.phi) * Math.sin(orbit.theta) + fx, orbit.r * Math.cos(orbit.phi) + midY + 3, orbit.r * Math.sin(orbit.phi) * Math.cos(orbit.theta) + fz)
      cam.lookAt(fx, midY + 3, fz)
      if (t2 >= 1) { s.cf = target; s.transitioning = false; setVisible(target); updateCam(orbit, target); onFloorTransitionEnd?.(target) }
      else requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [setVisible, onFloorTransitionEnd])

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current, W = el.clientWidth, H = el.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x060D1A); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1
    el.appendChild(renderer.domElement); rendRef.current = renderer
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x060D1A, 0.008)
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 600); camRef.current = camera
    scene.add(new THREE.AmbientLight(0x0A1628, 1.8))
    const sun = new THREE.DirectionalLight(0xC8DCFF, 1.4); sun.position.set(40, 80, 30); sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -100; sun.shadow.camera.right = 100
    sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100; sun.shadow.camera.far = 300; sun.shadow.bias = -0.0002
    scene.add(sun)
    scene.add(Object.assign(new THREE.DirectionalLight(0x2040A0, 0.5), { position: new THREE.Vector3(-30, 30, -20) }))
    const fgs: THREE.Group[] = [], hms: THREE.Mesh[] = [], targets: THREE.Mesh[] = []
    for (let i = 0; i < 3; i++) {
      const g = buildFloorGeometry([], i, targets); fgs.push(g); scene.add(g)
      const hm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }))
      hm.visible = false; scene.add(hm); hms.push(hm)
    }
    const pg = new THREE.Group()
    const pBodyM = mm(0x3B82F6, 0.35, 0.2, 0x1D4ED8, 0.65)
    const pCyl = new THREE.Mesh(new THREE.CylinderGeometry(S(4.5), S(4.5), S(10), 16), pBodyM); pCyl.position.y = S(8); pg.add(pCyl)
    const ringM = mm(0x3B82F6, 1, 0, 0x3B82F6, 0.4)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(S(11), S(1.8), 8, 32), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = S(4); pg.add(ring)
    const glowM = mm(0x60A5FA, 1, 0, 0x60A5FA, 1.0)
    const glow = new THREE.Mesh(new THREE.CircleGeometry(S(14), 32), glowM); glow.rotation.x = -Math.PI / 2; glow.position.y = S(2); pg.add(glow)
    const pLight = new THREE.PointLight(0x3B82F6, 1.2, S(55)); pLight.position.set(0, S(15), 0); pg.add(pLight)
    pg.position.set(wx(playerX), currentFloor * FH, wz(playerY)); scene.add(pg)
    st.current = { fgs, hms, targets, pg, pCyl, ringM, ring, glow, pLight, routeGroup: null, raycaster: new THREE.Raycaster(), raf: 0, drag: { on: false, sx: 0, sy: 0 }, orbit: { theta: 0.32, phi: 0.82, r: 90 }, cf: currentFloor, transitioning: false, scene }
    setVisible(currentFloor); updateCam(st.current.orbit, currentFloor)
    if (mapRef) mapRef.current = {
      updateHeatmap: (snap, fi) => {
        const s = st.current; if (!s) return
        s.scene.remove(s.hms[fi])
        const nm = buildHeatmesh(snap, fi); nm.visible = fi === s.cf && heatmapOn; s.scene.add(nm); s.hms[fi] = nm
      }
    }
    let t3 = 0
    const animate = () => {
      const s = st.current!; s.raf = requestAnimationFrame(animate); t3 += 0.016
      s.pCyl.position.y = S(8) + Math.sin(t3 * 1.5) * S(0.8)
      ring.scale.setScalar(1 + 0.18 * Math.sin(t3 * 2.2)); s.ringM.emissiveIntensity = 0.35 + 0.25 * Math.sin(t3 * 2.2)
      glow.scale.setScalar(1 + 0.12 * Math.sin(t3 * 1.8)); pLight.intensity = 1 + 0.4 * Math.sin(t3 * 2)
      renderer.render(scene, camera)
    }
    animate()
    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight
      renderer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix()
    }); ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(st.current?.raf ?? 0); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); st.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild floor geometry when floor changes
  useEffect(() => {
    const s = st.current; if (!s) return
    const floorIds = ['jkia-l0', 'jkia-l1', 'jkia-l2']
    fetch(`/api/map?terminalId=${floorIds[currentFloor]}`)
      .then(r => r.json()).then(data => {
        const ss = st.current; if (!ss) return
        ss.scene.remove(ss.fgs[currentFloor])
        // Remove old targets for this floor
        const newTargets = ss.targets.filter((m: THREE.Mesh) => m.userData.fi !== currentFloor)
        const newGrp = buildFloorGeometry(data.pois ?? [], currentFloor, newTargets)
        ss.fgs[currentFloor] = newGrp; ss.targets = newTargets; ss.scene.add(newGrp); setVisible(currentFloor)
      }).catch(() => {})
  }, [currentFloor, setVisible])

  useEffect(() => { st.current?.pg.position.set(wx(playerX), currentFloor * FH, wz(playerY)) }, [playerX, playerY, currentFloor])
  useEffect(() => { animFloor(currentFloor) }, [currentFloor, animFloor])
  useEffect(() => { const s = st.current; if (!s) return; s.hms.forEach((m: THREE.Mesh, i: number) => { m.visible = i === s.cf && heatmapOn }) }, [heatmapOn])
  useEffect(() => {
    const s = st.current; if (!s?.scene) return
    if (s.routeGroup) { s.scene.remove(s.routeGroup); s.routeGroup = null }
    if (route?.path && route.path.length > 1) { const grp = buildRoute(route.path, currentFloor); s.scene.add(grp); s.routeGroup = grp }
  }, [route, currentFloor])

  const onMouseDown = useCallback((e: React.MouseEvent) => { if (st.current) st.current.drag = { on: true, sx: e.clientX, sy: e.clientY } }, [])
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const s = st.current; if (!s || !s.drag.on) return
    s.orbit.theta -= (e.clientX - s.drag.sx) * 0.007
    s.orbit.phi = Math.max(0.18, Math.min(1.45, s.orbit.phi + (e.clientY - s.drag.sy) * 0.006))
    s.drag.sx = e.clientX; s.drag.sy = e.clientY; updateCam(s.orbit, s.cf)
  }, [])
  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const s = st.current; if (!s) return
    const wasDrag = Math.abs(e.clientX - s.drag.sx) > 4 || Math.abs(e.clientY - s.drag.sy) > 4
    s.drag.on = false; if (wasDrag) return
    const canvas = (e.target as HTMLElement).closest('canvas') as HTMLCanvasElement; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    s.raycaster.setFromCamera(mouse, camRef.current!)
    const hits = s.raycaster.intersectObjects(s.targets.filter((m: THREE.Mesh) => m.userData.fi === s.cf))
    if (hits.length > 0) { const poi = hits[0].object.userData.poi; if (poi) onSelectPOI(poi) }
  }, [onSelectPOI])
  const onWheel = useCallback((e: React.WheelEvent) => {
    const s = st.current; if (!s) return; e.preventDefault()
    s.orbit.r = Math.max(22, Math.min(150, s.orbit.r + e.deltaY * 0.08)); updateCam(s.orbit, s.cf)
  }, [])

  return (
    <div ref={mountRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab', background: '#060D1A' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onWheel={onWheel} />
  )
}
