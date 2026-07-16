'use client'

import { useEffect, useRef, useState } from 'react'

interface BubbleData {
  id: string
  name: string
  comment: string
  score: number
}

interface FloatingBubble extends BubbleData {
  x: number
  y: number
  angle: number
  orbitSpeed: number
  orbitRadius: number
  centerX: number
  centerY: number
  rotation: number
  vr: number
  scale: number
  targetScale: number
  opacity: number
  targetOpacity: number
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  depth: number
}

const CLOUD_COLORS = [
  { bg: 'rgba(46,125,50,0.85)', border: 'rgba(76,175,80,0.4)' },
  { bg: 'rgba(27,94,32,0.9)', border: 'rgba(56,142,60,0.4)' },
  { bg: 'rgba(51,105,30,0.85)', border: 'rgba(85,139,47,0.4)' },
  { bg: 'rgba(46,125,50,0.8)', border: 'rgba(102,187,106,0.4)' },
  { bg: 'rgba(67,160,71,0.85)', border: 'rgba(129,199,132,0.4)' },
]

const SIZE_MAP = {
  xs: { px: 'px-3 py-1.5', name: 'text-[10px]', comment: 'text-[9px]', minW: 70, maxW: 100 },
  sm: { px: 'px-4 py-2', name: 'text-xs', comment: 'text-[10px]', minW: 90, maxW: 130 },
  md: { px: 'px-5 py-2.5', name: 'text-sm', comment: 'text-xs', minW: 110, maxW: 160 },
  lg: { px: 'px-6 py-3', name: 'text-base', comment: 'text-xs', minW: 140, maxW: 200 },
  xl: { px: 'px-7 py-3.5', name: 'text-lg', comment: 'text-sm', minW: 170, maxW: 240 },
}

function CloudBubble({ name, comment, size }: { name: string; comment: string; size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const s = SIZE_MAP[size]
  const colorIdx = (name.charCodeAt(0) * 7 + (comment.charCodeAt(0) || 42)) % CLOUD_COLORS.length
  const { bg, border } = CLOUD_COLORS[colorIdx]

  return (
    <div
      className={`relative rounded-full text-center ${s.px} whitespace-nowrap`}
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <div className={`font-display font-bold text-white leading-tight ${s.name}`}>{name}</div>
      <div className={`text-white/70 mt-0.5 leading-tight ${s.comment}`}>{comment}</div>
    </div>
  )
}

export default function FloatingWall() {
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([])
  const [loaded, setLoaded] = useState(false)
  const timeRef = useRef(0)
  const animRef = useRef<number>(0)

  useEffect(() => {
    async function fetchBubbles() {
      try {
        const res = await fetch('/api/bubbles')
        if (!res.ok) return
        const data: BubbleData[] = await res.json()

        const w = window.innerWidth
        const h = window.innerHeight
        const cx = w / 2
        const cy = h / 2

        const sizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xs', 'sm', 'sm', 'md', 'md', 'lg', 'xl']
        const newBubbles: FloatingBubble[] = data.map((b, i) => {
          const size = sizes[i % sizes.length]
          const angle = Math.random() * Math.PI * 2
          const spreadX = w * 0.38
          const spreadY = h * 0.35

          return {
            ...b,
            x: cx + (Math.random() - 0.5) * spreadX * 2,
            y: cy + (Math.random() - 0.5) * spreadY * 2,
            angle,
            orbitSpeed: (0.0003 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
            orbitRadius: 15 + Math.random() * 40,
            centerX: cx + (Math.random() - 0.5) * spreadX * 2,
            centerY: cy + (Math.random() - 0.5) * spreadY * 2,
            rotation: (Math.random() - 0.5) * 8,
            vr: (Math.random() - 0.5) * 0.15,
            scale: 0,
            targetScale: 1,
            opacity: 0,
            targetOpacity: 0.85 + Math.random() * 0.15,
            size,
            depth: Math.random(),
          }
        })

        newBubbles.sort((a, b) => a.depth - b.depth)
        setBubbles(newBubbles.slice(0, 80))
        setLoaded(true)
      } catch {
        setLoaded(true)
      }
    }

    fetchBubbles()
    const interval = setInterval(fetchBubbles, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!loaded) return

    let lastTime = performance.now()
    function animate(now: number) {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      timeRef.current += dt

      setBubbles((prev) => {
        const w = window.innerWidth
        const h = window.innerHeight

        return prev.map((b) => {
          const newAngle = b.angle + b.orbitSpeed * dt
          const x = b.centerX + Math.cos(newAngle) * b.orbitRadius
          const y = b.centerY + Math.sin(newAngle) * b.orbitRadius * 0.6

          const newScale = b.scale + (b.targetScale - b.scale) * 0.04
          const newOpacity = b.opacity + (b.targetOpacity - b.opacity) * 0.04

          let newRotation = b.rotation + b.vr * (dt / 16)
          if (Math.abs(newRotation) > 10) b.vr *= -1

          let newCenterX = b.centerX
          let newCenterY = b.centerY
          if (newCenterX < w * 0.1 || newCenterX > w * 0.9) newCenterX = w * 0.5
          if (newCenterY < h * 0.1 || newCenterY > h * 0.9) newCenterY = h * 0.5

          return {
            ...b,
            x, y,
            angle: newAngle,
            rotation: newRotation,
            vr: b.vr,
            scale: newScale,
            opacity: newOpacity,
            centerX: newCenterX,
            centerY: newCenterY,
          }
        })
      })

      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [loaded])

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute pointer-events-none"
          style={{
            left: b.x,
            top: b.y,
            transform: `translate(-50%, -50%) scale(${b.scale}) rotate(${b.rotation}deg)`,
            opacity: b.opacity,
            willChange: 'transform, opacity',
          }}
        >
          <CloudBubble name={b.name} comment={b.comment} size={b.size} />
        </div>
      ))}

      {bubbles.length === 0 && loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-white/70 font-display text-lg">No consultants yet!</p>
            <p className="text-white/50 text-sm mt-2">Play the game to add your bubble</p>
          </div>
        </div>
      )}
    </div>
  )
}
