// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

// Define UserRole enum locally
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  REGIONAL_ADMIN = 'REGIONAL_ADMIN'
}

interface RegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  district?: string;
  role?: string;
  businessName?: string;
  businessDescription?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    district?: string | null;
    vendorShop?: any; // This would need proper typing based on your Prisma schema
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const requestData: RegistrationRequest = await request.json();
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      district, 
      role,
      businessName,
      businessDescription 
    } = requestData;

    console.log('Registration request:', { 
      email, 
      firstName, 
      lastName, 
      role,
      district 
    });

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, and lastName are required' },
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

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate and normalize role
    let userRole: UserRole = UserRole.CUSTOMER;
    if (role) {
      const upperRole = role.toUpperCase();
      if (Object.values(UserRole).includes(upperRole as UserRole)) {
        userRole = upperRole as UserRole;
      } else {
        return NextResponse.json(
          { error: 'Invalid role. Must be one of: customer, vendor, admin, regional_admin' },
          { status: 400 }
        );
      }
    }

    // Validate district for roles that require it
    if ((userRole === UserRole.VENDOR || userRole === UserRole.REGIONAL_ADMIN) && !district) {
      return NextResponse.json(
        { error: `${userRole.toLowerCase()} accounts require a district` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase().trim() 
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email address' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user without transaction for simplicity
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim(),
        district: district?.trim(),
        role: userRole,
        profile: {
          create: {}
        }
      },
      include: {
        profile: true
      }
    });

    // Create vendor shop if user is a vendor
    if (userRole === UserRole.VENDOR) {
      const shopName = businessName?.trim() || `${firstName}'s Shop`;
      const shopDescription = businessDescription?.trim() || 'Welcome to my shop!';
      
      await prisma.vendorShop.create({
        data: {
          name: shopName,
          description: shopDescription,
          district: district!.trim(), // We validated district exists for vendors
          vendorId: user.id
        }
      });
    }

    // Fetch the complete user with relations
    const completeUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        vendorShop: userRole === UserRole.VENDOR,
        profile: true
      }
    });

    if (!completeUser) {
      throw new Error('Failed to retrieve created user');
    }

    console.log('User created successfully:', { 
      id: completeUser.id, 
      email: completeUser.email, 
      role: completeUser.role 
    });

    const responseData: SuccessResponse = {
      success: true,
      message: 'User created successfully', 
      user: {
        id: completeUser.id,
        email: completeUser.email,
        firstName: completeUser.firstName,
        lastName: completeUser.lastName,
        role: completeUser.role,
        district: completeUser.district,
        vendorShop: completeUser.vendorShop
      }
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    // Handle Prisma errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}