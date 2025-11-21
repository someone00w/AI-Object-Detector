import { NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'
import { sanitizeEmail } from '@/app/lib/sanitize'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

// GET - Fetch user's email recipients
export async function GET(request) {
  try {
    const authResult = requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const user = authResult.user

    const recipients = await prisma.emailRecipient.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      success: true,
      recipients: recipients.map(r => ({
        id: r.id,
        email: r.email,
        enabled: r.enabled,
        createdAt: r.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching email recipients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email recipients' },
      { status: 500 }
    )
  }
}

// POST - Add new email recipient
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
    const { email, enabled = true } = body

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(email)
    
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existing = await prisma.emailRecipient.findFirst({
      where: {
        user_id: user.id,
        email: sanitizedEmail.toLowerCase()
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Create recipient
    const recipient = await prisma.emailRecipient.create({
      data: {
        user_id: user.id,
        email: sanitizedEmail.toLowerCase(),
        enabled: Boolean(enabled)
      }
    })

    return NextResponse.json({
      success: true,
      recipient: {
        id: recipient.id,
        email: recipient.email,
        enabled: recipient.enabled,
        createdAt: recipient.created_at
      }
    })
  } catch (error) {
    console.error('Error adding email recipient:', error)
    return NextResponse.json(
      { error: 'Failed to add email recipient' },
      { status: 500 }
    )
  }
}

// PUT - Update email recipient
export async function PUT(request) {
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
    const { id, email, enabled } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const recipient = await prisma.emailRecipient.findFirst({
      where: {
        id: id,
        user_id: user.id
      }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {}
    
    if (email !== undefined) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check for duplicates
      const existing = await prisma.emailRecipient.findFirst({
        where: {
          user_id: user.id,
          email: email.toLowerCase(),
          NOT: { id: id }
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'This email is already in your recipient list' },
          { status: 400 }
        )
      }

      updateData.email = email.toLowerCase()
    }

    if (enabled !== undefined) {
      updateData.enabled = enabled
    }

    updateData.updated_at = new Date()

    // Update recipient
    const updatedRecipient = await prisma.emailRecipient.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      recipient: {
        id: updatedRecipient.id,
        email: updatedRecipient.email,
        enabled: updatedRecipient.enabled
      }
    })
  } catch (error) {
    console.error('Error updating email recipient:', error)
    return NextResponse.json(
      { error: 'Failed to update email recipient' },
      { status: 500 }
    )
  }
}

// DELETE - Remove email recipient
export async function DELETE(request) {
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
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership and delete
    const recipient = await prisma.emailRecipient.findFirst({
      where: {
        id: id,
        user_id: user.id
      }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    await prisma.emailRecipient.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Email recipient removed'
    })
  } catch (error) {
    console.error('Error deleting email recipient:', error)
    return NextResponse.json(
      { error: 'Failed to delete email recipient' },
      { status: 500 }
    )
  }
}
