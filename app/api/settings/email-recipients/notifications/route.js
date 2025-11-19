import { NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'

// GET - Fetch enabled email recipients for notifications
export async function GET(request) {
  try {
    const authResult = requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const user = authResult.user

    const recipients = await prisma.emailRecipient.findMany({
      where: { 
        user_id: user.id,
        enabled: true
      },
      select: {
        id: true,
        email: true,
        enabled: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      recipients
    })
  } catch (error) {
    console.error('Error fetching recipients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    )
  }
}
