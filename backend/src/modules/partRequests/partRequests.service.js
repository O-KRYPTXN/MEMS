import prisma from '../../../prisma/prisma.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Generate a unique request number like "REQ-1001"
 */
async function generateRequestNumber() {
  const lastRequest = await prisma.partRequest.findFirst({
    orderBy: { requestNumber: 'desc' },
    select: { requestNumber: true }
  });

  if (!lastRequest) {
    return 'REQ-1001';
  }

  const lastNumber = parseInt(lastRequest.requestNumber.replace('REQ-', ''), 10);
  return `REQ-${lastNumber + 1}`;
}

/**
 * Create a new Part Request
 */
export async function createPartRequest(data) {
  const { partId, qty, workOrderId, notes, userId } = data;

  // Validate that the part exists
  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) {
    throw new AppError('Part not found', 404);
  }

  // Validate work order if provided
  if (workOrderId) {
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) {
      throw new AppError('Work Order not found', 404);
    }
  }

  const requestNumber = await generateRequestNumber();

  const partRequest = await prisma.partRequest.create({
    data: {
      requestNumber,
      qty,
      notes,
      status: 'PENDING',
      part: { connect: { id: partId } },
      user: { connect: { id: userId } },
      ...(workOrderId && { workOrder: { connect: { id: workOrderId } } })
    },
    include: {
      part: true,
      user: { select: { id: true, name: true, role: true } },
      workOrder: { select: { id: true, workOrderNumber: true } }
    }
  });

  return partRequest;
}

/**
 * Get all part requests with pagination and optional filtering
 */
export async function getPartRequests(filters, queryParams) {
  const { page = 1, limit = 100 } = queryParams;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.partRequest.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        part: true,
        user: { select: { id: true, name: true, role: true, department: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
        workOrder: { select: { id: true, workOrderNumber: true } }
      }
    }),
    prisma.partRequest.count({ where: filters })
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get a single part request by ID
 */
export async function getPartRequestById(id, filters = {}) {
  const partRequest = await prisma.partRequest.findFirst({
    where: { id, ...filters },
    include: {
      part: true,
      user: { select: { id: true, name: true, role: true, department: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      workOrder: { select: { id: true, workOrderNumber: true } }
    }
  });

  if (!partRequest) {
    throw new AppError('Part request not found', 404);
  }

  return partRequest;
}

/**
 * Update the status of a part request (Approve, Reject, Fulfill)
 */
export async function updateRequestStatus(id, data) {
  const { status, notes, reviewedById, userRole } = data;

  const request = await prisma.partRequest.findUnique({
    where: { id },
    include: { part: true }
  });

  if (!request) {
    throw new AppError('Part request not found', 404);
  }

  // 1. Validate status transitions and role permissions
  if (request.status === 'PENDING') {
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      throw new AppError(`Invalid transition from PENDING to ${status}. Allowed: APPROVED, REJECTED.`, 400);
    }
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR') {
      throw new AppError(`Role ${userRole} is not authorized to ${status.toLowerCase()} part requests.`, 403);
    }
  } else if (request.status === 'APPROVED') {
    if (status !== 'FULFILLED') {
      throw new AppError(`Invalid transition from APPROVED to ${status}. Allowed: FULFILLED.`, 400);
    }
    if (userRole !== 'STORE') {
      throw new AppError(`Role ${userRole} is not authorized to fulfill part requests. Only STORE can fulfill.`, 403);
    }
  } else {
    throw new AppError(`Cannot modify a request that is already ${request.status}.`, 400);
  }

  // If transitioning to FULFILLED, decrement stock in a transaction
  if (status === 'FULFILLED') {
    if (request.part.qty < request.qty) {
      throw new AppError(`Insufficient stock. Requested: ${request.qty}, Available: ${request.part.qty}`, 400);
    }

    // Run update in transaction
    const [updatedRequest] = await prisma.$transaction([
      prisma.partRequest.update({
        where: { id },
        data: {
          status,
          notes: notes !== undefined ? notes : request.notes,
          reviewedAt: new Date(),
          reviewedBy: { connect: { id: reviewedById } }
        },
        include: {
          part: true,
          user: { select: { id: true, name: true, role: true } },
          reviewedBy: { select: { id: true, name: true, role: true } }
        }
      }),
      prisma.part.update({
        where: { id: request.partId },
        data: {
          qty: { decrement: request.qty }
        }
      })
    ]);
    
    // TODO: Create AuditLog entry for part stock change and request fulfillment

    return updatedRequest;
  }

  // Otherwise just update the status (e.g. APPROVED or REJECTED)
  const updatedRequest = await prisma.partRequest.update({
    where: { id },
    data: {
      status,
      notes: notes !== undefined ? notes : request.notes,
      reviewedAt: new Date(),
      reviewedBy: { connect: { id: reviewedById } }
    },
    include: {
      part: true,
      user: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } }
    }
  });

  // TODO: Create AuditLog entry for request status change

  return updatedRequest;
}
