// ==============================================================================
// HOUSE OF SHUBHANSHI — ADMIN CONTROLLER
// ==============================================================================
const analyticsService = require('../services/analytics.service');
const orderService = require('../services/order.service');
const db = require('../config/db');
const { sendSuccess } = require('../utils/response');

async function getDashboardOverview(req, res, next) {
  try {
    const overview = await analyticsService.getAdminOverview();
    return sendSuccess(res, overview);
  } catch (err) {
    next(err);
  }
}

async function getSalesAnalytics(req, res, next) {
  try {
    const range = req.query.range || '30d';
    const analytics = await analyticsService.getSalesAnalytics(range);
    return sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
}

async function getAllOrders(req, res, next) {
  try {
    const orders = await orderService.getAllOrders(req.query);
    return sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    return sendSuccess(res, order, `Order status successfully updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { paymentStatus } = req.body;
    const order = await orderService.updatePaymentStatus(req.params.id, paymentStatus);
    return sendSuccess(res, order, `Payment status updated to ${paymentStatus}`);
  } catch (err) {
    next(err);
  }
}

async function getAllCustomers(req, res, next) {
  try {
    const users = await db.user.findMany({
      where: { role: 'CUSTOMER' }
    });

    const orders = await db.order.findMany();

    // Enrich customers with order count and total spent
    const customers = users.map(u => {
      const customerOrders = orders.filter(o => o.userId === u.id && o.status !== 'CANCELLED');
      const totalSpent = customerOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        totalSpent,
        ordersCount: customerOrders.length,
        createdAt: u.createdAt
      };
    });

    return sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
}

async function uploadProductImage(req, res, next) {
  try {
    const imagePayload = req.body.imageBase64 || req.body.file || req.body.image;
    const filename = req.body.filename || req.body.name || 'product';
    if (!imagePayload) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    const path = require('path');
    const fs = require('fs');
    const sharp = require('sharp');

    // Extract base64 payload
    const matches = imagePayload.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imagePayload, 'base64');
    }

    const safeName = (filename || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const finalFilename = `${safeName}-${Date.now()}.webp`;

    const outBuffer = await sharp(buffer)
      .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    const publicPath = path.resolve(__dirname, '../../../frontend/public/images/products');
    const assetsPath = path.resolve(__dirname, '../../../frontend/public/assets/images/products');

    try {
      if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
      if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath, { recursive: true });
      fs.writeFileSync(path.join(publicPath, finalFilename), outBuffer);
      fs.writeFileSync(path.join(assetsPath, finalFilename), outBuffer);
    } catch (fsErr) {
      console.warn('[Admin Upload] Could not write to disk (ephemeral/serverless); returning optimized base64 data URI:', fsErr.message);
    }

    const dataUri = `data:image/webp;base64,${outBuffer.toString('base64')}`;
    const relativeUrl = `/images/products/${finalFilename}`;

    return sendSuccess(res, {
      url: relativeUrl,
      dataUri,
      filename: finalFilename,
      size: outBuffer.length
    }, 'Product image uploaded and optimized successfully');
  } catch (err) {
    next(err);
  }
}

async function changeAdminPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    const bcrypt = require('bcryptjs');
    const userId = req.user.id;
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash || user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    return sendSuccess(res, { updated: true }, 'Admin password updated successfully. Please keep your new credentials safe.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getAllCustomers,
  uploadProductImage,
  changeAdminPassword
};
