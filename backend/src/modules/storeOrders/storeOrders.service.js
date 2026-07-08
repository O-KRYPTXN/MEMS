import prisma from '../../../prisma/prisma.js';
import { AppError } from '../../utils/AppError.js';

const generateOrderNumber = () => {
  return `PO-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

export const createStoreOrder = async (userId, data) => {
  const { supplierName, supplierEmail, notes, items } = data;

  // Validate all referenced parts exist
  const partIds = items.map(item => item.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } }
  });

  if (parts.length !== partIds.length) {
    const foundPartIds = parts.map(p => p.id);
    const missingParts = partIds.filter(id => !foundPartIds.includes(id));
    throw new AppError(`One or more parts not found: ${missingParts.join(', ')}`, 400);
  }

  // Create store order with items
  return await prisma.storeOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      supplierName,
      supplierEmail,
      notes,
      createdById: userId,
      items: {
        create: items.map(item => ({
          partId: item.partId,
          qty: item.qty,
          unitPrice: item.unitPrice
        }))
      }
    },
    include: {
      items: {
        include: { part: true }
      },
      createdBy: true
    }
  });
};

export const getStoreOrders = async ({ page = 1, limit = 10, status, search }) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { supplierName: { contains: search, mode: 'insensitive' } },
      { createdBy: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.storeOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { part: true } },
        createdBy: true,
        reviewedBy: true
      }
    }),
    prisma.storeOrder.count({ where })
  ]);

  return {
    items: orders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getStoreOrderById = async (id) => {
  const order = await prisma.storeOrder.findUnique({
    where: { id },
    include: {
      items: { include: { part: true } },
      createdBy: true,
      reviewedBy: true
    }
  });

  if (!order) {
    throw new AppError('Store order not found', 404);
  }

  return order;
};

export const updateStoreOrderStatus = async (id, { status, rejectionReason }, userId, userRole) => {
  const order = await prisma.storeOrder.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    throw new AppError('Store order not found', 404);
  }

  // State Machine Validation
  if (order.status === 'DELIVERED') {
    throw new AppError('Cannot update order that has already been delivered', 400);
  }
  
  if (order.status === 'REJECTED') {
    throw new AppError('Cannot update order that has already been rejected', 400);
  }

  let updateData = { status };

  // Handle specific transitions
  if (status === 'ORDERED' || status === 'REJECTED') {
    if (userRole !== 'ADMIN') {
      throw new AppError('Only administrators can approve or reject store orders', 403);
    }
    
    if (order.status !== 'PENDING') {
      throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
    }

    if (status === 'REJECTED' && !rejectionReason) {
      throw new AppError('Rejection reason is required when rejecting an order', 400);
    }

    updateData.reviewedBy = { connect: { id: userId } };
    updateData.reviewedAt = new Date();
    if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason;
    }
  } else if (status === 'DELIVERED') {
    if (order.status !== 'ORDERED') {
      throw new AppError(`Cannot transition from ${order.status} to DELIVERED. Order must be ORDERED first.`, 400);
    }
  }

  // Transaction execution
  return await prisma.$transaction(async (tx) => {
    // If delivering, update inventory parts
    if (status === 'DELIVERED') {
      for (const item of order.items) {
        await tx.part.update({
          where: { id: item.partId },
          data: {
            qty: { increment: item.qty }
          }
        });
      }
    }

    // Update order status
    return await tx.storeOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { part: true } },
        createdBy: true,
        reviewedBy: true
      }
    });
  });
};
