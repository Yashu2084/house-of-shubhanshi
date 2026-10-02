import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const imagePayload = body.imageBase64 || body.file || body.image;
    const filename = body.filename || body.name || 'product';

    if (!imagePayload) {
      return NextResponse.json(
        { success: false, message: 'Image data is required' },
        { status: 400 }
      );
    }

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

    let dataUri = imagePayload.startsWith('data:') ? imagePayload : `data:image/webp;base64,${buffer.toString('base64')}`;
    let relativeUrl = `/images/products/${finalFilename}`;

    // Try Sharp optimization if available, or write directly
    try {
      const sharp = require('sharp');
      const outBuffer = await sharp(buffer)
        .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer();

      dataUri = `data:image/webp;base64,${outBuffer.toString('base64')}`;

      const publicPath = path.resolve(process.cwd(), 'public/images/products');
      if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
      fs.writeFileSync(path.join(publicPath, finalFilename), outBuffer);
    } catch (e) {
      // In serverless / read-only environment, fallback to data URI
      relativeUrl = dataUri;
    }

    return NextResponse.json({
      success: true,
      message: 'Product image uploaded and processed successfully',
      data: {
        url: relativeUrl,
        dataUri,
        filename: finalFilename,
        size: buffer.length
      }
    });
  } catch (err) {
    console.error('[API /api/admin/upload POST Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to upload product image' },
      { status: 500 }
    );
  }
}
