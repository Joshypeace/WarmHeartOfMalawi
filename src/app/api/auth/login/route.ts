// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt to sign in using NextAuth credentials provider
    const result = await signIn('credentials', {
      email,
      password,
      role,
      redirect: false,
    });

    if (result?.error) {
      // Handle specific error cases
      if (result.error.includes('Access denied')) {
        return NextResponse.json(
          { error: result.error },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Successful login
    return NextResponse.json(
      { 
        message: 'Login successful',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}