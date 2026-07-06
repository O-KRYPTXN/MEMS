import { catchAsync } from '../../utils/catchAsync.js';
import * as partsService from './parts.service.js';

export const getParts = catchAsync(async (req, res) => {
  const result = await partsService.getParts(req.query);
  res.status(200).json({
    status: 'success',
    ...result
  });
});

export const getPart = catchAsync(async (req, res) => {
  const part = await partsService.getPartById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: part
  });
});

export const createPart = catchAsync(async (req, res) => {
  const part = await partsService.createPart(req.body);
  res.status(201).json({
    status: 'success',
    data: part
  });
});

export const updatePart = catchAsync(async (req, res) => {
  const part = await partsService.updatePart(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: part
  });
});

export const deletePart = catchAsync(async (req, res) => {
  await partsService.deletePart(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});
