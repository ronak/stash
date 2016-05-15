'use strict';

const Router = require('koa-router');
const ObjectId = require('mongodb').ObjectID;

const items = new Router({ prefix: '/items' });

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
  const items = yield this.db.find().toArray();

  this.body = { count: items.length, data: items };
});

items.post('/', function *() {
  const result = yield this.db.insertOne(bodyToItem(this.request.body));

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
  const obj = { $set: bodyToItem(this.request.body) };
  const result = yield this.db.updateOne({ _id: this.id }, obj);

  if (!result.matchedCount) { this.status = 404; }

  this.status = 204;
});

items.put('/', function *() {
  const result = yield this.db.removeOne({ _id: this.id });

  if (!result.deletedCount) { this.status = 404; }

  this.status = 204;
});

module.exports = items;

