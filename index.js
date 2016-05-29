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
const validate = require('koa-validate');
const mongo = require('mongodb').MongoClient;
const config = require('./config');
const items = require('./routes/item');
const tags = require('./routes/tag');

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
if (process.env.NODE_ENV === 'production') {
  app.use(auth({ name: config.USER, pass: config.PASS }));
}
app.use(logger());
app.use(bodyParser());
validate(app);

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
    app.context.db = yield mongo.connect(config.DB);

    if (process.env.NODE_ENV === 'production') {
      const options = {
        key: fs.readFileSync(process.argv[2]),
        cert: fs.readFileSync(process.argv[3])
      };

      https.createServer(options, app.callback()).listen(config.PORT);
    } else {
      app.listen(config.PORT);
    }
  } catch (err) {
    console.log(err);
    process.exit();
  }
})
