// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

// Define UserRole enum locally if Prisma client isn't generated yet
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  REGIONAL_ADMIN = 'REGIONAL_ADMIN'
}

export async function POST(request: NextRequest) {
  try {
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
    } = await request.json();

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

    // Create user transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
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
        
        await tx.vendorShop.create({
          data: {
            name: shopName,
            description: shopDescription,
            district: district!.trim(), // We validated district exists for vendors
            vendorId: user.id
          }
        });
      }

      return user;
    });

    // Fetch the complete user with relations
    const completeUser = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        vendorShop: userRole === UserRole.VENDOR,
        profile: true
      }
    });

    console.log('User created successfully:', { 
      id: completeUser?.id, 
      email: completeUser?.email, 
      role: completeUser?.role 
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'User created successfully', 
        user: {
          id: completeUser?.id,
          email: completeUser?.email,
          firstName: completeUser?.firstName,
          lastName: completeUser?.lastName,
          role: completeUser?.role,
          district: completeUser?.district,
          vendorShop: completeUser?.vendorShop
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}