// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not found - database features disabled')
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Storage bucket name
export const STORAGE_BUCKET = 'dance-verse'

// Upload file to Supabase Storage
export async function uploadToSupabaseStorage(file, filename) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  try {
    console.log(`Uploading ${filename} to Supabase Storage...`)
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename)

    return {
      path: data.path,
      fullPath: data.fullPath,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error)
    throw error
  }
}

// Delete file from Supabase Storage
export async function deleteFromSupabaseStorage(filename) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filename])

    if (error) {
      console.error('Storage delete error:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error deleting from Supabase Storage:', error)
    throw error
  }
}

// Save submission data to database
export async function saveSubmission(submissionData) {
  if (!supabase) {
    console.warn('Supabase not configured - data not saved to database')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('dance_submissions')
      .insert([{
        ...submissionData,
        storage_location: 'supabase'
      }])
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

// Admin functions
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

  // Delete submission and associated file
  async delete(id) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // First, get the submission to find the filename
      const { data: submission, error: fetchError } = await supabase
        .from('dance_submissions')
        .select('filename')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching submission for deletion:', fetchError)
        throw fetchError
      }

      // Delete from storage if filename exists
      if (submission?.filename) {
        try {
          await deleteFromSupabaseStorage(submission.filename)
          console.log('File deleted from storage:', submission.filename)
        } catch (storageError) {
          console.warn('Could not delete file from storage:', storageError.message)
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('dance_submissions')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting submission from database:', deleteError)
        throw deleteError
      }

      return true
    } catch (error) {
      console.error('Error in delete operation:', error)
      throw error
    }
  }
}