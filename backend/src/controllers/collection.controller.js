// ==============================================================================
// HOUSE OF SHUBHANSHI — COLLECTION CONTROLLER
// ==============================================================================
const collectionService = require('../services/collection.service');
const { sendSuccess } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const collections = await collectionService.getAllCollections(req.query);
    return sendSuccess(res, collections);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    let collection;
    try {
      collection = await collectionService.getCollectionBySlug(id);
    } catch (e) {
      collection = await collectionService.getCollectionById(id);
    }
    return sendSuccess(res, collection);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const collection = await collectionService.createCollection(req.body);
    return sendSuccess(res, collection, 'Collection created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const collection = await collectionService.updateCollection(req.params.id, req.body);
    return sendSuccess(res, collection, 'Collection updated successfully');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const soft = req.query.permanent !== 'true';
    const result = await collectionService.deleteCollection(req.params.id, soft);
    return sendSuccess(res, result, soft ? 'Collection deactivated' : 'Collection permanently deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove
};
