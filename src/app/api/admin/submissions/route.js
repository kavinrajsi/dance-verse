// src/app/api/admin/submissions/route.js
import { NextResponse } from "next/server";
import { danceSubmissions } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Simple authentication check (in production, use proper auth)
function isAuthorized(req) {
  const authHeader = req.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (!adminKey) {
    console.warn('ADMIN_API_KEY not set - admin routes will be disabled');
    return false;
  }
  
  return authHeader === `Bearer ${adminKey}`;
}

export async function GET(req) {
  try {
    // Check authorization
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Fetch full submission data (including sensitive info)
    const result = await danceSubmissions.getAll({
      page,
      limit,
      search,
      filter
    });

    return NextResponse.json({
      submissions: result.data,
      pagination: {
        total: result.count,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore
      },
      filters: {
        applied: filter,
        search: search || null
      }
    });
    
  } catch (error) {
    console.error("Error fetching admin submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    // Check authorization
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Submission ID required" }, 
        { status: 400 }
      );
    }

    await danceSubmissions.delete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: "Submission deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" }, 
      { status: 500 }
    );
  }
}