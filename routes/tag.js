'use strict';

const Router = require('koa-router');

const tags = new Router({ prefix: '/tags' });

tags.get('/', function *() {
  const tags = yield this.db.aggregate([
    {
      $unwind: '$tags'
    },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        tag: '$_id',
        count: '$count'
      }
    }
  ]).toArray();

  this.body = { count: tags.length, data: tags };
});

tags.get('/:tag', function *() {
  const data = yield this.db.find({ tags: this.params.tag }).toArray();

  this.body = { count: data.length, data: data };
});

module.exports = tags;
