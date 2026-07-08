import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../../prisma/prisma.js';

import { AppError } from '../../utils/AppError.js';
import { logAction } from '../auditLogs/auditLogs.service.js';

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      department: {
        select: { name: true, code: true }
      }
    }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  if (user.isSuspended) {
    throw new AppError('Account is suspended', 403);
  }

  if (!user.isActivated) {
    throw new AppError('Account is not activated. Please check your email.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  return user;
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      initials: true,
      theme: true,
      language: true,
      departmentId: true,
      department: {
        select: { name: true, code: true }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const getUserForMiddleware = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      isActive: true,
      isSuspended: true,
    },
  });

  return user;
};

export const createRegistrationRequest = async (data) => {
  const { firstName, lastName, email, dbRole, department } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  const existingRequest = await prisma.registrationRequest.findUnique({
    where: { email },
  });

  if (existingRequest && existingRequest.status === 'PENDING') {
    throw new AppError('A registration request for this email is already pending review', 400);
  }

  const dbDepartment = await prisma.department.findUnique({
    where: { name: department },
  });

  if (!dbDepartment && dbRole !== 'ADMIN') {
    throw new AppError('Invalid department specified', 400);
  }

  const newRequest = await prisma.registrationRequest.create({
    data: {
      name: `${firstName} ${lastName}`.trim(),
      email,
      role: dbRole,
      departmentId: dbDepartment ? dbDepartment.id : null,
      status: 'PENDING',
    },
  });

  return newRequest;
};

export const activateUser = async (token, password) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      activationToken: hashedToken,
      activationExpires: {
        gt: new Date()
      }
    },
    include: {
      department: {
        select: { name: true, code: true }
      }
    }
  });

  if (!user) {
    throw new AuthError('Invalid or expired activation token', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActivated: true,
      activationToken: null,
      activationExpires: null
    }
  });

  await logAction({
    userId: user.id,
    action: 'ACCOUNT_ACTIVATED',
    entity: 'User',
    entityId: user.email,
    oldValue: { isActivated: false },
    newValue: { isActivated: true }
  });

  return { updatedUser, department: user.department };
};
