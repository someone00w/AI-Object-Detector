import { NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

// GET - Fetch user settings
export async function GET(request) {
  try {
    const authResult = requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const user = authResult.user

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { user_id: user.id }
    })

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          user_id: user.id,
          no_person_stop_time: 5
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        noPersonStopTime: settings.no_person_stop_time
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Update user settings
export async function POST(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  try {
    const authResult = requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const user = authResult.user

    const body = await request.json()
    const { noPersonStopTime } = body

    // Validate input
    if (typeof noPersonStopTime !== 'number') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    if (noPersonStopTime < 1 || noPersonStopTime > 20) {
      return NextResponse.json(
        { error: 'noPersonStopTime must be between 1 and 20 seconds' },
        { status: 400 }
      )
    }

    // Upsert user settings
    const settings = await prisma.userSettings.upsert({
      where: { user_id: user.id },
      update: {
        no_person_stop_time: noPersonStopTime,
        updated_at: new Date()
      },
      create: {
        user_id: user.id,
        no_person_stop_time: noPersonStopTime
      }
    })

    return NextResponse.json({
      success: true,
      settings: {
        noPersonStopTime: settings.no_person_stop_time
      }
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
