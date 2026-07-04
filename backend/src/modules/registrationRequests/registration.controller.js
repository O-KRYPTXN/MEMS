import crypto from 'crypto';
import prisma from '../../../../prisma/prisma.js';
import { sendActivationEmail, sendRejectionEmail } from '../../../services/email.service.js';

/**
 * @desc    Approve a pending registration request
 * @route   POST /api/registrations/:id/approve
 * @access  Private/Admin
 */
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: request.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // 1. Generate activation token (raw token sent via email, hash saved to DB)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // Token valid for 48 hours
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 2. Create the User
    // Note: passwordHash is left as null. isActivated defaults to false.
    const newUser = await prisma.user.create({
      data: {
        name: request.name,
        email: request.email,
        role: request.role,
        departmentId: request.departmentId,
        isActivated: false,
        activationToken: hashedToken,
        activationExpires: expires,
      },
    });

    // 3. Update the RegistrationRequest
    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        userId: newUser.id,
        reviewedAt: new Date(),
      },
    });

    // 4. Send activation email
    await sendActivationEmail(newUser.email, rawToken);

    res.status(200).json({ 
      message: 'Registration approved and activation email sent',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Approve Registration Error:', error);
    res.status(500).json({ message: 'Server error during approval' });
  }
};

/**
 * @desc    Reject a pending registration request
 * @route   POST /api/registrations/:id/reject
 * @access  Private/Admin
 */
export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason provided by admin

    const request = await prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    // Update the RegistrationRequest status to DENIED
    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'DENIED',
        reviewedAt: new Date(),
      },
    });

    // Send rejection email (so they aren't left waiting forever)
    await sendRejectionEmail(request.email, reason);

    res.status(200).json({ 
      message: 'Registration request denied and notification email sent'
    });

  } catch (error) {
    console.error('Reject Registration Error:', error);
    res.status(500).json({ message: 'Server error during rejection' });
  }
};
