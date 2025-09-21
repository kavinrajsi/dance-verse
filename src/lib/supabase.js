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