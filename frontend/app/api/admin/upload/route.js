export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/upload
 * Secured administrator upload handler with sharp WebP optimization
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

    // Extract raw buffer from base64 payload
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

    // Process & optimize image with sharp:
    // Resize to luxury e-commerce proportions (max 1200x1600 inside), convert to high-fidelity WebP
    const outBuffer = await sharp(buffer)
      .resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const dataUri = `data:image/webp;base64,${outBuffer.toString('base64')}`;
    let finalUrl = dataUri;

    // 1. Persistent Storage Option A: Vercel Blob Storage (if BLOB_READ_WRITE_TOKEN is configured)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`products/${finalFilename}`, outBuffer, {
          access: 'public',
          contentType: 'image/webp'
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
        // In local development with filesystem access, use relative URL if not using Blob
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
