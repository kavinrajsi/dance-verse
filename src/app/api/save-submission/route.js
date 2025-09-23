// src/app/api/save-submission/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'title', 'filename', 'blob_url'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }
    
    // Validate phone format
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number format' 
        },
        { status: 400 }
      );
    }
    
    // Save to database if Supabase is configured
    if (supabase) {
      const submissionData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        title: data.title.trim(),
        filename: data.filename,
        blob_url: data.blob_url,
        download_url: data.download_url || data.blob_url,
        file_size: data.file_size || null,
        file_type: data.file_type || 'video/mp4',
        storage_location: data.storage_location || 'vercel',
        created_at: new Date().toISOString()
      };
      
      const { data: savedData, error } = await supabase
        .from('dance_submissions')
        .insert([submissionData])
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        
        // If it's a duplicate entry error
        if (error.code === '23505') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'A submission with this email already exists' 
            },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save submission to database' 
          },
          { status: 500 }
        );
      }
      
      console.log('Submission saved:', savedData.id);
      
      return NextResponse.json({
        success: true,
        id: savedData.id,
        message: 'Submission saved successfully',
        data: {
          id: savedData.id,
          name: savedData.name,
          title: savedData.title,
          created_at: savedData.created_at
        }
      });
    } else {
      // If Supabase is not configured, just log and return success
      console.log('Supabase not configured - submission data:', {
        name: data.name,
        email: data.email,
        title: data.title,
        filename: data.filename
      });
      
      return NextResponse.json({
        success: true,
        message: 'Submission received (database not configured)',
        data: {
          name: data.name,
          title: data.title,
          filename: data.filename
        }
      });
    }
    
  } catch (error) {
    console.error('Error in save-submission:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to check if the route is working
export async function GET() {
  return NextResponse.json({
    message: 'Save submission endpoint is running',
    timestamp: new Date().toISOString()
  });
}