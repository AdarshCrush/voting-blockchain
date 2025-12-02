import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Admin protected routes
  const isAdminPath = path.startsWith('/admin') && !path.startsWith('/admin/login');
  
  if (isAdminPath) {
    const token = request.cookies.get('admin-token')?.value;
    
    try {
      if (!token) throw new Error('No token');
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}