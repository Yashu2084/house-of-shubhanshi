// ==============================================================================
// HOUSE OF SHUBHANSHI — COLLECTION SERVICE
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
 * Get all collections
 */
async function getAllCollections(filters = {}) {
  const where = {};
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true' || filters.isActive === true;
  } else if (!filters.includeInactive) {
    where.isActive = true;
  }

  return await db.collection.findMany({
    where,
    include: { products: true }
  });
}

/**
 * Get single collection by ID or Slug
 */
async function getCollectionById(id) {
  const collection = await db.collection.findUnique({
    where: { id },
    include: { products: true }
  });

  if (!collection) {
    const error = new Error('Collection not found');
    error.statusCode = 404;
    throw error;
  }

  return collection;
}

async function getCollectionBySlug(slug) {
  const collection = await db.collection.findUnique({
    where: { slug },
    include: { products: true }
  });

  if (!collection) {
    const error = new Error('Collection not found');
    error.statusCode = 404;
    throw error;
  }

  return collection;
}

/**
 * Admin: Create Collection
 */
async function createCollection(data) {
  if (!data.name) {
    const error = new Error('Collection name is required');
    error.statusCode = 400;
    throw error;
  }

  const baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  const existing = await db.collection.findUnique({ where: { slug } });
  if (existing) {
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  return await db.collection.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description ? data.description.trim() : '',
      image: data.image || 'assets/images/collection/noor-set.jpg',
      isActive: data.isActive !== undefined ? !!data.isActive : true
    }
  });
}

/**
 * Admin: Update Collection
 */
async function updateCollection(id, data) {
  await getCollectionById(id);

  const updateData = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.image) updateData.image = data.image;
  if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

  return await db.collection.update({
    where: { id },
    data: updateData
  });
}

/**
 * Admin: Delete or Soft-Deactivate Collection
 */
async function deleteCollection(id, soft = true) {
  if (soft) {
    return await db.collection.update({
      where: { id },
      data: { isActive: false }
    });
  }
  return await db.collection.delete({ where: { id } });
}

module.exports = {
  getAllCollections,
  getCollectionById,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection
};
