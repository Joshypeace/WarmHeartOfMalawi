// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

interface ResetPasswordRequest {
  token: string;
  password: string;
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
    const { token, password }: ResetPasswordRequest = await request.json();

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // Clear the reset token
        resetTokenExpiry: null, // Clear the expiry
        updatedAt: new Date(),
      },
    });

    // Invalidate all existing sessions (optional but recommended for security)
    // This would require additional session management logic

    console.log(`Password reset successful for user: ${user.email}`);

    return NextResponse.json(
      { 
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Reset password error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}