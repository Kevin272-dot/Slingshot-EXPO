import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRandomHitMessage } from '@/lib/messages'
import { validateName, checkRateLimit } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
    }

    const body = await request.json()
    const { name } = body

    const trimmedName = (name || '').trim()
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const validation = validateName(trimmedName)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const comment = getRandomHitMessage()

    console.log('[Session] Creating player:', trimmedName)

    const player = await prisma.player.create({
      data: {
        name: trimmedName,
      },
    })

    console.log('[Session] Player created:', player.id)

    const session = await prisma.session.create({
      data: {
        playerId: player.id,
        score: 100,
        comment,
      },
      include: { player: true },
    })

    console.log('[Session] Session created:', session.id)

    return NextResponse.json({
      id: session.id,
      name: session.player.name,
      score: session.score,
      comment: session.comment,
      createdAt: session.createdAt,
    })
  } catch (error) {
    console.error('[Session] ERROR:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
