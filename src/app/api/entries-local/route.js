// src/app/api/entries-local/route.js (For local development)
import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Use Node.js runtime for file system access

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Read entries from local file system
    let entries = await getEntriesFromFileSystem();
    
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
      },
      source: "local-filesystem"
    });
    
  } catch (error) {
    console.error("Error fetching local entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch local entries" }, 
      { status: 500 }
    );
  }
}

// Read entries from local file system
async function getEntriesFromFileSystem() {
  const entries = [];
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  
  if (!existsSync(uploadsDir)) {
    console.log("No uploads directory found, returning empty entries");
    return entries;
  }
  
  try {
    const files = await readdir(uploadsDir);
    const videoFiles = files.filter(file => 
      /\.(mp4|mov|avi|webm|mkv)$/i.test(file)
    );
    
    console.log(`Found ${videoFiles.length} video files in uploads directory`);
    
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
          // Format: name-email-timestamp-title.ext
          name = parts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          email = parts[1] + '@' + (parts[2] || 'example.com');
          
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