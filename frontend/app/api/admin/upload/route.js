export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/upload
 * Secured administrator upload handler with resilient image optimization
 * Compatible with Vercel Serverless (Node.js runtime) and local development.
 */
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

    // Extract raw buffer and mime type from base64 payload
    let mimeType = 'image/jpeg';
    let buffer;
    const matches = typeof imagePayload === 'string' ? imagePayload.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null;
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else if (typeof imagePayload === 'string') {
      buffer = Buffer.from(imagePayload, 'base64');
    } else {
      buffer = Buffer.from(imagePayload);
    }

    const safeName = (filename || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();

    let outBuffer = buffer;
    let outMime = mimeType;
    let extension = 'webp';

    // Attempt sharp optimization dynamically if available
    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
      outBuffer = await sharp(buffer)
        .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      outMime = 'image/webp';
      extension = 'webp';
    } catch (sharpErr) {
      console.warn('[Upload] Sharp processing bypassed (using direct buffer):', sharpErr.message);
      if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('webp')) extension = 'webp';
      else extension = 'jpg';
    }

    const finalFilename = `${safeName}-${Date.now()}.${extension}`;
    const dataUri = `data:${outMime};base64,${outBuffer.toString('base64')}`;
    let finalUrl = dataUri;

    // 1. Persistent Storage Option A: Vercel Blob Storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`products/${finalFilename}`, outBuffer, {
          access: 'public',
          contentType: outMime
        });
        if (blob && blob.url) {
          finalUrl = blob.url;
        }
      } catch (blobErr) {
        console.warn('[Upload] Vercel Blob put failed, falling back to persistent data URI:', blobErr.message);
      }
    }

    // 2. Local filesystem write for dev convenience (non-blocking if read-only / serverless)
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      try {
        const publicPath = path.resolve(process.cwd(), 'public/images/products');
        if (!fs.existsSync(publicPath)) {
          fs.mkdirSync(publicPath, { recursive: true });
        }
        fs.writeFileSync(path.join(publicPath, finalFilename), outBuffer);
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          finalUrl = `/images/products/${finalFilename}`;
        }
      } catch (fsErr) {
        // Read-only filesystem; finalUrl remains dataUri
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product image uploaded and processed successfully',
      data: {
        url: finalUrl,
        dataUri,
        filename: finalFilename,
        size: outBuffer.length
      }
    });
  } catch (err) {
    console.error('[API /api/admin/upload POST Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to upload product image' },
      { status: 500 }
    );
  }
}
