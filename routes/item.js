'use strict';

const Router = require('koa-router');
const ObjectId = require('mongodb').ObjectID;

const items = new Router({ prefix: '/items' });

function isArrayOfStrings(array) {
  if (!array || !Array.isArray(array)) return false;
  return array.every((e) => { return typeof e === 'string' });
}

// Convert request body into item model
function bodyToItem(body) {
  const obj = {};

  if (body.title) { obj.title = body.title; }
  if (body.urls) { obj.urls = body.urls; }
  if (body.notes) { obj.notes = body.notes; }
  if (body.tags) { obj.tags = body.tags; }

  return obj;
}

items.get('/', function *() {
  this.checkQuery('pageindex').optional().isInt();
  this.checkQuery('pagesize').optional().isInt().le(100);
  this.checkQuery('sortfield').optional().in(['_id','tag']);
  this.checkQuery('sortOrder').optional().isInt().in([1,-1]);

  if (this.errors) {
    this.throw(Error(JSON.stringify(this.errors)), 400);
  }

  // koa-validate sanitizers don't work so we have to do this manually:
  const pageIndex = Number(this.query.pageindex) || 1;
  const pageSize = Number(this.query.pagesize) || 20;
  const sortField = this.query.sortField || '_id';
  const sortOrder = Number(this.query.sortOrder) || -1;

  const items = yield this.db
    .find()
    .sort({ [sortField]: sortOrder })
    .skip((pageIndex-1) * pageSize)
    .limit(pageSize)
    .toArray();

  this.body = { count: items.length, data: items };
});

items.post('/', function *() {
  this.checkBody('title').notEmpty();
  this.checkBody('urls')
    .optional()
    .ensure(isArrayOfStrings(this.request.body.urls));
  this.checkBody('tags')
    .optional()
    .ensure(isArrayOfStrings(this.request.body.tags));

  if (this.errors) {
    this.throw(Error(JSON.stringify(this.errors)), 400);
  }

  const obj = bodyToItem(this.request.body);
  obj.createdAt = obj.updatedAt = new Date();
  const result = yield this.db.insertOne(obj);

  if (result && result.insertedCount) {
    this.status = 201;
  }
});

// Validate item id is an Mongo ObjectId
items.param('id', function *(id, next) {
  try {
    this.id = new ObjectId(id);
    yield next;
  } catch (err) {
    this.throw(err.message, 400);
  }
});

items.get('/:id', function *() {
  const item = yield this.db.findOne({ _id: this.id });

  if (item) {
    this.body = item;
  } else {
    this.status = 404;
  }
});

items.put('/:id', function *() {
  this.checkBody('title').notEmpty();
  this.checkBody('urls')
    .optional()
    .ensure(isArrayOfStrings(this.request.body.urls));
  this.checkBody('tags')
    .optional()
    .ensure(isArrayOfStrings(this.request.body.tags));

  const obj = { $set: bodyToItem(this.request.body) };

  if (Object.keys(obj.$set).length > 0) {
    obj.$set.updatedAt = new Date();
  }

  const result = yield this.db.updateOne({ _id: this.id }, obj);

  if (!result.matchedCount) { this.status = 404; }

  this.status = 204;
});

items.del('/', function *() {
  const result = yield this.db.removeOne({ _id: this.id });

  if (!result.deletedCount) { this.status = 404; }

  this.status = 204;
});

module.exports = items;

