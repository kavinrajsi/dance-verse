// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not found - database features disabled')
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Upload file to Vercel Blob Storage
export async function uploadToVercelBlob(file, filename) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Vercel Blob token not configured')
  }

  try {
    console.log(`Uploading ${filename} to Vercel Blob Storage...`)
    
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('Vercel Blob upload successful:', blob.url)

    return {
      path: filename,
      fullPath: filename,
      url: blob.url,
      downloadUrl: blob.downloadUrl || blob.url
    }
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    throw error
  }
}

// Delete file from Vercel Blob Storage
export async function deleteFromVercelBlob(url) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Vercel Blob token not configured')
  }

  try {
    const { del } = await import('@vercel/blob')
    
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('File deleted from Vercel Blob:', url)
    return true
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error)
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
        storage_location: 'vercel'
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
      // First, get the submission to find the blob URL
      const { data: submission, error: fetchError } = await supabase
        .from('dance_submissions')
        .select('blob_url, storage_location')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching submission for deletion:', fetchError)
        throw fetchError
      }

      // Delete from storage if blob_url exists and it's stored in Vercel
      if (submission?.blob_url && submission?.storage_location === 'vercel') {
        try {
          await deleteFromVercelBlob(submission.blob_url)
          console.log('File deleted from Vercel Blob:', submission.blob_url)
        } catch (storageError) {
          console.warn('Could not delete file from Vercel Blob:', storageError.message)
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

// Legacy Supabase Storage functions (keep for backward compatibility)
export async function uploadToSupabaseStorage(file, filename) {
  console.warn('uploadToSupabaseStorage is deprecated, using Vercel Blob instead')
  return uploadToVercelBlob(file, filename)
}

export async function deleteFromSupabaseStorage(filename) {
  console.warn('deleteFromSupabaseStorage is deprecated')
  return true
}