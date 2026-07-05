import crypto from 'crypto';
import prisma from '../../../prisma/prisma.js';
import { sendActivationEmail } from '../../services/email.service.js';
import { formatPaginatedResponse } from '../../utils/pagination.util.js';

class UserServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (page, limit, filters) => {
  const { role, departmentId, search, isSuspended, isActive } = filters;

  const where = {};

  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;
  
  if (isSuspended !== undefined) {
    where.isSuspended = isSuspended === 'true';
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, totalItems] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        isActivated: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return formatPaginatedResponse(data, totalItems, page, limit);
};

/**
 * Get a single user by ID
 */
export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isSuspended: true,
      isActivated: true,
      createdAt: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  return user;
};

/**
 * Create a new user (Admin bypasses registration requests)
 */
export const createUser = async (data) => {
  let { name, email, role, departmentId } = data;

  if (role === 'ADMIN') {
    departmentId = null;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new UserServiceError('A user with this email already exists', 400);
  }

  // Generate activation token
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      role,
      departmentId,
      initials,
      isActivated: false,
      activationToken: hashedToken,
      activationExpires: tokenExpires,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });

  await sendActivationEmail(email, token);

  return newUser;
};

/**
 * Update user details
 */
export const updateUser = async (id, data, executorId) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new UserServiceError('Email is already in use by another account', 400);
    }
  }

  const updateData = { ...data };
  
  // Force departmentId to null if role is changing to ADMIN, or if they are already an ADMIN and we are not changing the role.
  if (updateData.role === 'ADMIN' || (user.role === 'ADMIN' && !updateData.role)) {
    updateData.departmentId = null;
  }

  if (data.name) {
    updateData.initials = data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // Self-demotion block
  if (id === executorId && updateData.role && updateData.role !== 'ADMIN') {
    throw new UserServiceError('You cannot demote yourself from Administrator', 400);
  }

  // Last Admin Standing Check
  if (user.role === 'ADMIN' && updateData.role && updateData.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true, isSuspended: false }
    });
    if (adminCount <= 1) {
      throw new UserServiceError('Cannot demote the final active administrator', 400);
    }
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isSuspended: true,
    }
  });
};

/**
 * Update user status (isActive, isSuspended)
 */
export const updateUserStatus = async (id, statusData, executorId) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  // Prevent admin from suspending themselves
  if (id === executorId && statusData.isSuspended) {
    throw new UserServiceError('You cannot suspend your own account', 403);
  }

  // Last Admin Standing Check
  if (user.role === 'ADMIN' && statusData.isSuspended) {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true, isSuspended: false }
    });
    if (adminCount <= 1) {
      throw new UserServiceError('Cannot suspend the final active administrator', 400);
    }
  }

  return prisma.user.update({
    where: { id },
    data: statusData,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      isSuspended: true,
    }
  });
};
