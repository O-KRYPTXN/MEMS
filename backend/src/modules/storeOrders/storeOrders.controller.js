import * as storeOrdersService from './storeOrders.service.js';

export const createStoreOrderHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const order = await storeOrdersService.createStoreOrder(userId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Store order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreOrdersHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, search } = req.query;

    const result = await storeOrdersService.getStoreOrders({
      page,
      limit,
      status,
      search
    });

    res.status(200).json({
      success: true,
      message: 'Store orders fetched successfully',
      data: result.items,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreOrderByIdHandler = async (req, res, next) => {
  try {
    const order = await storeOrdersService.getStoreOrderById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Store order fetched successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const updateStoreOrderStatusHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const updatedOrder = await storeOrdersService.updateStoreOrderStatus(
      req.params.id, 
      { ...req.body }, 
      userId, 
      userRole
    );
    
    res.status(200).json({
      success: true,
      message: `Store order marked as ${updatedOrder.status} successfully`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplierResponseHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const updatedOrder = await storeOrdersService.updateSupplierResponse(
      req.params.id, 
      req.body.supplierResponse, 
      userId, 
      userRole
    );
    
    res.status(200).json({
      success: true,
      message: 'Supplier response updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};
