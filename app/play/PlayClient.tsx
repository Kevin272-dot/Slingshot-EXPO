'use client'

import { useState, useCallback, useRef } from 'react'
import AnimatedBackground from '@/components/AnimatedBackground'
import { AudioManager } from '@/components/AudioManager'
import ResultScreen from '@/components/ResultScreen'
import NameModal from '@/components/NameModal'
import dynamic from 'next/dynamic'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

type GameState = 'playing' | 'name' | 'result'

function PlayContent() {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [isHit, setIsHit] = useState(false)
  const [message, setMessage] = useState('')
  const [playerName, setPlayerName] = useState('')
  const gameKey = useRef(0)

  const handleResult = useCallback((hit: boolean) => {
    setIsHit(hit)
    if (hit) {
      setGameState('name')
    } else {
      const { getRandomMissMessage } = require('@/lib/messages')
      setMessage(getRandomMissMessage())
      setGameState('result')
    }
  }, [])

  const handleNameSubmit = useCallback(async (name: string) => {
    setPlayerName(name)
    const { getRandomHitMessage } = require('@/lib/messages')
    const hitMsg = getRandomHitMessage()
    setMessage(hitMsg)
    setGameState('result')

    if (name) {
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
      } catch (e) { console.error('Failed to save session:', e) }
    }
  }, [])

  const handlePlayAgain = useCallback(() => {
    gameKey.current++
    setGameState('playing')
    setIsHit(false)
    setMessage('')
    setPlayerName('')
  }, [])

  return (
    <div className="fixed inset-0" style={{ zIndex: 10 }}>
      <AnimatedBackground />

      {gameState === 'playing' && (
        <div className="fixed inset-0">
          <GameCanvas key={gameKey.current} onResult={handleResult} />
        </div>
      )}

      {gameState === 'name' && (
        <NameModal onSubmit={handleNameSubmit} />
      )}

      {gameState === 'result' && (
        <ResultScreen
          hit={isHit}
          message={message}
          playerName={playerName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

export default function PlayClient() {
  return (
    <AudioManager>
      <PlayContent />
    </AudioManager>
  )
}
