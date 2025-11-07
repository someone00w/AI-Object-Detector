import { NextResponse } from 'next/server'
import { requireAdmin } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request) {
  try {
    // Check if user is admin
    const { user, error } = requireAdmin(request)
    if (error) return error

    // Get statistics
    const totalUsers = await prisma.user.count()
    const totalAdmins = await prisma.user.count({
      where: { role: 1 }
    })
    const totalRegularUsers = await prisma.user.count({
      where: { role: 2 }
    })
    const totalVideos = await prisma.video.count()

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: sevenDaysAgo
        }
      }
    })

    const stats = {
      totalUsers,
      totalAdmins,
      totalRegularUsers,
      totalVideos,
      recentUsers
    }

    return NextResponse.json({ stats }, { status: 200 })

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}