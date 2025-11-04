// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface ForgotPasswordRequest {
  email: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const { email }: ForgotPasswordRequest = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    // For security, don't reveal whether email exists or not
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json(
        { 
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In production, you would send an email here
    // For now, we'll log the reset token (remove this in production)
    console.log('Password reset token for', email, ':', resetToken);
    console.log('Reset link:', `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`);

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json(
      { 
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to process password reset request',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}