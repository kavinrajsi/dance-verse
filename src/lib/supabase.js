// src/lib/supabase.js (Simplified for upload-only)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not found - database features disabled')
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Simple function to save submission data
export async function saveSubmission(submissionData) {
  if (!supabase) {
    console.warn('Supabase not configured - data not saved to database')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('dance_submissions')
      .insert([submissionData])
      .select()
      .single()
    
    if (error) {
      console.error('Error saving submission:', error)
      throw error
    }
    
    console.log('Submission saved to database:', data.id)
    return data
  } catch (error) {
    console.error('Database save failed:', error)
    throw error
  }
}

// Admin functions (for admin dashboard)
export const danceSubmissions = {
  // Get all submissions with pagination and filters
  async getAll({ 
    page = 1, 
    limit = 50, 
    search = '', 
    filter = 'all' 
  } = {}) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    let query = supabase
      .from('dance_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,title.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply time filter
    if (filter === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', oneDayAgo)
    } else if (filter === 'week') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', oneWeekAgo)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching submissions:', error)
      throw error
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      hasMore: count > page * limit
    }
  },

  // Delete submission (admin only)
  async delete(id) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { error } = await supabase
      .from('dance_submissions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting submission:', error)
      throw error
    }

    return true
  }
}