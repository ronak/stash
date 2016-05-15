'use strict';

const https = require('https');
const fs = require('fs');
const co = require('co');
const koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const logger = require('koa-logger');
const auth = require('koa-basic-auth');
const cors = require('koa-cors');
const mongo = require('mongodb').MongoClient;

const items = require('./routes/item');
const tags = require('./routes/tag');

// Config
const USER = process.env.USER;
const PASS = process.env.PASS;
const PORT = process.env.PORT;
const DB = process.env.DB;

const app = koa();

// Catch all error handler
app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = { error: err.message }
  }
});

// External middleware
app.use(cors());
app.use(auth({ name: USER, pass: PASS }));
app.use(logger());
app.use(bodyParser());

// There is only one collection. Make it available to all routes.
app.use(function *(next) {
  this.db = this.app.context.db.collection('items');
  yield next;
});

// Routes
app.use(items.routes());
app.use(tags.routes());

co(function* () {
  try {
    if (process.env.NODE_ENV === 'production') {
      const options = {
        key: fs.readFileSync(process.argv[2]),
        cert: fs.readFileSync(process.argv[3])
      };
      app.context.db = yield mongo.connect(DB);

      https.createServer(options, app.callback()).listen(PORT);
    } else {
      app.context.db = yield mongo.connect(DB);
      app.listen(PORT);
    }
  } catch (err) {
    console.log(err);
    process.exit();
  }
})
