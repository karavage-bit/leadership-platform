import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { studentId, itemType, earnedFrom, earnedDescription } = await req.json()
    
    if (!studentId || !itemType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if item exists in inventory
    const { data: existing } = await supabase
      .from('placement_inventory')
      .select('id, quantity')
      .eq('student_id', studentId)
      .eq('item_type', itemType)
      .single()

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from('placement_inventory')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Insert new item
      const { error } = await supabase
        .from('placement_inventory')
        .insert({
          student_id: studentId,
          item_type: itemType,
          quantity: 1,
          earned_from: earnedFrom || 'activity',
          earned_description: earnedDescription || 'Earned from activity'
        })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory API error:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('placement_inventory')
      .select('*')
      .eq('student_id', studentId)
      .gt('quantity', 0)

    if (error) throw error

    return NextResponse.json({ inventory: data || [] })
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Failed to get inventory' }, { status: 500 })
  }
}
