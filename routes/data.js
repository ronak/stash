'use strict';

const Router = require('koa-router');
const ObjectId = require('mongodb').ObjectID;

const data = new Router({ prefix: '/data' });

// Convert request body into data model
function bodyToData(body) {
  const obj = {};

  if (body.title) { obj.title = body.title; }
  if (body.urls) { obj.urls = body.urls; }
  if (body.notes) { obj.notes = body.notes; }
  if (body.tags) { obj.tags = body.tags; }

  return obj;
}

data.get('/', function *() {
  const results = yield this.db.find().toArray();

  this.body = { count: results.length, data: results };
});

data.post('/', function *() {
  const result = yield this.db.insertOne(bodyToData(this.request.body));

  if (result && result.insertedCount) {
    this.status = 201;
  }
});

// Validate data id is an Mongo ObjectId
data.param('id', function *(id, next) {
  try {
    this.id = new ObjectId(id);
    yield next;
  } catch (err) {
    this.throw(err.message, 400);
  }
});

data.get('/:id', function *() {
  const result = yield this.db.findOne({ _id: this.id });

  if (result) {
    this.body = result;
  } else {
    this.status = 404;
  }
});

data.put('/:id', function *() {
  const obj = { $set: bodyToData(this.request.body) };
  const result = yield this.db.updateOne({ _id: this.id }, obj);

  if (!result.matchedCount) { this.status = 404; }

  this.status = 204;
});

data.del('/:id', function *() {
  const result = yield this.db.removeOne({ _id: this.id });

  if (!result.deletedCount) { this.status = 404; }

  this.status = 204;
});

module.exports = data;

