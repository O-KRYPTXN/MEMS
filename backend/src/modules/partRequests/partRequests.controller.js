import * as partRequestsService from './partRequests.service.js';

/**
 * @desc    Create a new part request
 * @route   POST /api/part-requests
 * @access  Private (Technician, Supervisor)
 */
export const createPartRequest = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      userId: req.user.id
    };
    const partRequest = await partRequestsService.createPartRequest(data);
    res.status(201).json({
      success: true,
      message: 'Part request created successfully',
      data: partRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all part requests
 * @route   GET /api/part-requests
 * @access  Private (Admin, Supervisor, Store, Technician)
 */
export const getPartRequests = async (req, res, next) => {
  try {
    // Determine filters based on role
    const filters = {};
    if (req.user.role === 'TECHNICIAN') {
      filters.userId = req.user.id;
    }
    
    // Add optional query filters
    if (req.query.status) filters.status = req.query.status;
    if (req.query.partId) filters.partId = req.query.partId;
    if (req.query.workOrderId) filters.workOrderId = req.query.workOrderId;

    const result = await partRequestsService.getPartRequests(filters, req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single part request by ID
 * @route   GET /api/part-requests/:id
 * @access  Private
 */
export const getPartRequestById = async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role === 'TECHNICIAN') {
      filters.userId = req.user.id;
    }
    
    const partRequest = await partRequestsService.getPartRequestById(req.params.id, filters);
    res.status(200).json({
      success: true,
      data: partRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update part request status
 * @route   PATCH /api/part-requests/:id/status
 * @access  Private (Admin, Supervisor, Store)
 */
export const updateRequestStatus = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      reviewedById: req.user.id,
      userRole: req.user.role
    };
    const updatedRequest = await partRequestsService.updateRequestStatus(req.params.id, data);
    res.status(200).json({
      success: true,
      message: 'Part request status updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};
