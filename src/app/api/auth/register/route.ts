// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

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

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['CUSTOMER', 'VENDOR', 'ADMIN', 'REGIONAL_ADMIN'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        district,
        role: role ? role.toUpperCase() as any : 'CUSTOMER',
        profile: {
          create: {}
        }
      },
      include: {
        profile: true
      }
    });

    // If vendor, create vendor shop
    if (role?.toUpperCase() === 'VENDOR') {
      await prisma.vendorShop.create({
        data: {
          name: businessName || `${firstName}'s Shop`,
          description: businessDescription || 'Welcome to my shop!',
          district: district || '',
          vendorId: user.id
        }
      });
    }

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        userId: user.id,
        role: user.role
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}