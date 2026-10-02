import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../lib/auth';
const db = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const orders = user.role === 'ADMIN'
      ? await db.order.findMany()
      : await db.order.findMany({ where: { userId: user.id } });

    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error('[API /api/orders GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    const body = await req.json();
    const { items, shippingAddress, phone, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Your shopping bag is empty' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json(
        { success: false, message: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Enrich items with real product info from DB
    const allProducts = await db.product.findMany();
    let totalAmount = 0;
    let rentalDepositTotal = 0;

    const verifiedItems = items.map((it) => {
      const prod = allProducts.find(p => p.id === it.productId) || {};
      const qty = parseInt(it.quantity, 10) || 1;
      const isRent = it.purchaseType === 'RENT';

      let price = 0;
      let securityDeposit = 0;

      if (isRent) {
        const days = parseInt(it.rentalDays, 10) || 3;
        const basePrice = prod.rentalBasePrice || 1199;
        const extraPrice = Math.max(0, days - (prod.minimumRentalDays || 2)) * (prod.rentalPricePerDay || 350);
        price = (basePrice + extraPrice) * qty;
        securityDeposit = (prod.rentalDeposit || 2500) * qty;
        rentalDepositTotal += securityDeposit;
      } else {
        price = (prod.price || 4499) * qty;
      }

      totalAmount += price;

      return {
        productId: it.productId,
        productName: prod.name || it.productName || 'Atelier Garment',
        quantity: qty,
        price,
        purchaseType: isRent ? 'RENT' : 'BUY',
        rentalDays: isRent ? (parseInt(it.rentalDays, 10) || 3) : null,
        rentalStartDate: isRent ? (it.rentalStartDate || new Date().toISOString().split('T')[0]) : null,
        rentalEndDate: isRent ? (it.rentalEndDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]) : null,
        rentalPrice: isRent ? price : null,
        securityDeposit: isRent ? securityDeposit : null
      };
    });

    // If there's rental deposit, total amount includes deposit
    const grandTotal = totalAmount + rentalDepositTotal;

    const isWhatsApp = !paymentMethod || paymentMethod === 'WHATSAPP' || paymentMethod === 'WHATSAPP_ENQUIRY';
    const status = isWhatsApp ? 'WHATSAPP_ENQUIRY' : 'RECEIVED';
    const paymentStatus = isWhatsApp ? 'WHATSAPP_ENQUIRY' : 'PENDING';

    const createdOrder = await db.order.create({
      data: {
        userId: user ? user.id : 'guest',
        user: user || { name: shippingAddress.split(',')[0], phone },
        items: verifiedItems,
        totalAmount: grandTotal,
        rentalDepositTotal,
        status,
        paymentStatus,
        shippingAddress: shippingAddress.trim(),
        phone: (phone || '').trim()
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        data: createdOrder
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/orders POST Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to process order' },
      { status: 500 }
    );
  }
}
