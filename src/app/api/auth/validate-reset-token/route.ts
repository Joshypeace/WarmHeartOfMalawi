// src/app/api/auth/validate-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  valid: boolean;
  message?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Reset token is required' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token hasn't expired
        },
      },
      select: {
        id: true,
        email: true,
        resetTokenExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Validate reset token error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to validate reset token',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}