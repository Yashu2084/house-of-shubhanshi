// ==============================================================================
// HOUSE OF SHUBHANSHI — PRODUCT SERVICE
// ==============================================================================
const db = require('../config/db');

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all products with filtering
 */
async function getAllProducts(filters = {}) {
  const where = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true' || filters.isActive === true;
  } else if (!filters.includeInactive) {
    where.isActive = true;
  }

  if (filters.collectionId) {
    where.collectionId = filters.collectionId;
  }

  const products = await db.product.findMany({
    where,
    include: {
      collection: true
    }
  });

  return products;
}

/**
 * Get single product by ID or Slug
 */
async function getProductById(id) {
  const product = await db.product.findUnique({
    where: { id },
    include: { collection: true }
  });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function getProductBySlug(slug) {
  const product = await db.product.findUnique({
    where: { slug },
    include: { collection: true }
  });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
}

/**
 * Admin: Create Product
 */
async function createProduct(data) {
  if (!data.name || !data.price) {
    const error = new Error('Product name and price are required');
    error.statusCode = 400;
    throw error;
  }

  const baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) {
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  const newProduct = await db.product.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description ? data.description.trim() : '',
      price: parseFloat(data.price),
      compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
      image: data.image || 'assets/images/collection/noor-set.jpg',
      images: data.images ? (typeof data.images === 'string' ? data.images : JSON.stringify(data.images)) : null,
      category: data.category ? data.category.trim() : null,
      fabric: data.fabric ? data.fabric.trim() : null,
      color: data.color ? data.color.trim() : null,
      size: data.size ? data.size.trim() : null,
      material: data.material ? data.material.trim() : null,
      featured: !!data.featured,
      stock: data.stock !== undefined ? parseInt(data.stock, 10) : 10,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
      collectionId: data.collectionId || null,
      isRentable: data.isRentable !== undefined ? !!data.isRentable : false,
      rentalBasePrice: data.rentalBasePrice !== undefined ? parseFloat(data.rentalBasePrice) : 0,
      rentalPricePerDay: data.rentalPricePerDay !== undefined ? parseFloat(data.rentalPricePerDay) : 0,
      minimumRentalDays: data.minimumRentalDays !== undefined ? parseInt(data.minimumRentalDays, 10) : 1,
      maximumRentalDays: data.maximumRentalDays !== undefined ? parseInt(data.maximumRentalDays, 10) : 7,
      rentalDeposit: data.rentalDeposit !== undefined ? parseFloat(data.rentalDeposit) : 0,
      rentalAvailableStock: data.rentalAvailableStock !== undefined ? parseInt(data.rentalAvailableStock, 10) : 1,
      lengths: data.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom',
      customLengthAvailable: data.customLengthAvailable !== undefined ? !!data.customLengthAvailable : true
    }
  });

  return newProduct;
}

/**
 * Admin: Update Product
 */
async function updateProduct(id, data) {
  await getProductById(id); // Ensure exists

  const updateData = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.price !== undefined) updateData.price = parseFloat(data.price);
  if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice ? parseFloat(data.compareAtPrice) : null;
  if (data.image) updateData.image = data.image;
  if (data.images !== undefined) updateData.images = typeof data.images === 'string' ? data.images : JSON.stringify(data.images);
  if (data.category !== undefined) updateData.category = data.category;
  if (data.fabric !== undefined) updateData.fabric = data.fabric;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.size !== undefined) updateData.size = data.size;
  if (data.material !== undefined) updateData.material = data.material;
  if (data.featured !== undefined) updateData.featured = !!data.featured;
  if (data.stock !== undefined) updateData.stock = parseInt(data.stock, 10);
  if (data.isActive !== undefined) updateData.isActive = !!data.isActive;
  if (data.collectionId !== undefined) updateData.collectionId = data.collectionId || null;
  if (data.isRentable !== undefined) updateData.isRentable = !!data.isRentable;
  if (data.rentalBasePrice !== undefined) updateData.rentalBasePrice = parseFloat(data.rentalBasePrice);
  if (data.rentalPricePerDay !== undefined) updateData.rentalPricePerDay = parseFloat(data.rentalPricePerDay);
  if (data.minimumRentalDays !== undefined) updateData.minimumRentalDays = parseInt(data.minimumRentalDays, 10);
  if (data.maximumRentalDays !== undefined) updateData.maximumRentalDays = parseInt(data.maximumRentalDays, 10);
  if (data.rentalDeposit !== undefined) updateData.rentalDeposit = parseFloat(data.rentalDeposit);
  if (data.rentalAvailableStock !== undefined) updateData.rentalAvailableStock = parseInt(data.rentalAvailableStock, 10);
  if (data.lengths !== undefined) updateData.lengths = data.lengths;
  if (data.customLengthAvailable !== undefined) updateData.customLengthAvailable = !!data.customLengthAvailable;

  return await db.product.update({
    where: { id },
    data: updateData
  });
}

/**
 * Admin: Delete or Soft-Deactivate Product
 */
async function deleteProduct(id, soft = true) {
  if (soft) {
    return await db.product.update({
      where: { id },
      data: { isActive: false }
    });
  }
  return await db.product.delete({ where: { id } });
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
};
