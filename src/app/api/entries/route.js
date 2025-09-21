// src/app/api/entries/route.js (Enhanced version with Vercel Blob support)
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { readdir, stat } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Use edge runtime for Vercel Blob

// In production, you would use a database like this:
// import { sql } from '@vercel/postgres';
// const { rows } = await sql`SELECT * FROM submissions ORDER BY created_at DESC`;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let entries = [];
    
    // Check if we're on Vercel (production)
    const isVercel = process.env.VERCEL === "1";
    
    if (isVercel) {
      // Production: Get videos from Vercel Blob storage
      entries = await getEntriesFromVercelBlob();
    } else {
      // Development: Read from local uploads directory
      entries = await getEntriesFromFileSystem();
    }
    
    // Apply filters
    let filteredEntries = entries;
    
    // Search filter
    if (search) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.name.toLowerCase().includes(search.toLowerCase()) ||
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Time filter
    if (filter === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filteredEntries = filteredEntries.filter(entry => 
        new Date(entry.timestamp) > oneDayAgo
      );
    } else if (filter === 'week') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filteredEntries = filteredEntries.filter(entry => 
        new Date(entry.timestamp) > oneWeekAgo
      );
    }
    
    // Sort by timestamp (newest first)
    filteredEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const total = filteredEntries.length;
    const paginatedEntries = filteredEntries.slice(offset, offset + limit);
    
    return NextResponse.json({
      entries: paginatedEntries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        applied: filter,
        search: search || null
      }
    });
    
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" }, 
      { status: 500 }
    );
  }
}

// Get entries from Vercel Blob storage
async function getEntriesFromVercelBlob() {
  try {
    // List all blobs from Vercel Blob storage
    const { blobs } = await list();
    
    // Filter for video files only
    const videoBlobs = blobs.filter(blob => 
      blob.pathname.match(/\.(mp4|mov|avi|webm|mkv)$/i)
    );
    
    // Parse each blob to extract entry information
    const entries = videoBlobs.map(blob => {
      // Parse filename to extract info (name-email-timestamp.ext)
      const filename = blob.pathname;
      const parts = filename.split('-');
      const ext = path.extname(filename);
      
      let name = "Unknown Dancer";
      let email = "unknown@example.com";
      let title = "Untitled Dance";
      let timestamp = blob.uploadedAt;
      
      if (parts.length >= 4) {
        // Format: name-email-timestamp-title.ext
        name = parts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        email = parts[1] + '@' + (parts[2]?.split('T')[0] || 'example.com'); // Remove timestamp part if in email
        
        // Title is everything after the timestamp
        const titleParts = parts.slice(3);
        title = titleParts.join('-')
          .replace(ext, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      } else if (parts.length >= 2) {
        // Fallback format
        name = parts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        title = parts.slice(1).join('-')
          .replace(ext, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return {
        name: decodeURIComponent(name),
        email: decodeURIComponent(email),
        title: decodeURIComponent(title),
        filename: blob.pathname,
        url: blob.url, // This is the actual Vercel Blob URL
        downloadUrl: blob.downloadUrl,
        timestamp: blob.uploadedAt,
        size: blob.size,
        type: getVideoMimeType(ext)
      };
    });
    
    return entries;
    
  } catch (error) {
    console.error("Error fetching from Vercel Blob:", error);
    
    // Fallback to demo data if Blob access fails
    return getDemoEntries();
  }
}

// Demo data fallback
function getDemoEntries() {
  return [
    {
      name: "Sarah Chen",
      email: "sarah@example.com",
      title: "Contemporary Dance Fusion",
      filename: "sarah-chen-contemporary.mp4",
      url: "https://example.com/demo-video-1.mp4",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      size: 25165824,
      type: "video/mp4"
    },
    {
      name: "Mumbai Dance Crew",
      email: "crew@mumbaidance.com", 
      title: "Bollywood Hip-Hop Mashup",
      filename: "mumbai-crew-bollywood.mp4",
      url: "https://example.com/demo-video-2.mp4",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      size: 31457280,
      type: "video/mp4"
    }
  ];
}

// Read entries from local file system (development)
async function getEntriesFromFileSystem() {
  const entries = [];
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  
  if (!existsSync(uploadsDir)) {
    return entries;
  }
  
  try {
    const files = await readdir(uploadsDir);
    const videoFiles = files.filter(file => 
      /\.(mp4|mov|avi|webm|mkv)$/i.test(file)
    );
    
    for (const filename of videoFiles) {
      try {
        const filePath = path.join(uploadsDir, filename);
        const stats = await stat(filePath);
        
        // Parse filename to extract info (name-email-timestamp-title.ext)
        const parts = filename.split('-');
        const ext = path.extname(filename);
        
        let name = "Unknown Dancer";
        let email = "unknown@example.com";
        let title = "Untitled Dance";
        let timestamp = stats.birthtime.toISOString();
        
        if (parts.length >= 4) {
          name = parts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          email = parts[1] + '@' + (parts[2] || 'example.com');
          
          // Title is everything after the timestamp
          const titleParts = parts.slice(3);
          title = titleParts.join('-')
            .replace(ext, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }
        
        entries.push({
          name: decodeURIComponent(name),
          email: decodeURIComponent(email),
          title: decodeURIComponent(title),
          filename,
          url: `/uploads/${filename}`,
          timestamp,
          size: stats.size,
          type: getVideoMimeType(ext)
        });
      } catch (err) {
        console.error(`Error processing file ${filename}:`, err);
        // Continue with other files
      }
    }
  } catch (error) {
    console.error("Error reading uploads directory:", error);
  }
  
  return entries;
}

function getVideoMimeType(ext) {
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska'
  };
  
  return mimeTypes[ext.toLowerCase()] || 'video/mp4';
}