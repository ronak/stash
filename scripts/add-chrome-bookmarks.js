'use strict';

const co = require('co');
const fs = require('fs');
const mongo = require('mongodb').MongoClient;
const moment = require('moment');
const config = require('../config');

co(function* () {
  try {
    const db = yield mongo.connect(config.DB);
    const col = db.collection('items');

    fs.readFile(process.argv[2], 'utf-8', co.wrap(function *(err, data) {
      if (err) {
        console.log(err);
        process.exit();
      }

      const bookmarks = JSON.parse(data);
      const types = ['bookmark_bar', 'other', 'synced'];

      for (let i = 0; i < types.length; i++) {
        const type = types[i];

        for (let j = 0; j < bookmarks.roots[type].children.length; j++) {
          const item = bookmarks.roots[type].children[j];

          // http://stackoverflow.com/questions/19074423/how-to-parse-the-date-added-field-in-chrome-bookmarks-file
          const ts = item.date_added;
          let seconds = ts / 1000000;
          const milliseconds = (ts % 1000000) / 1000;
          const days = (seconds / 86400) - 1;
          seconds = seconds % 86400;
          const startDate = moment('1601-01-01');
          const duration = moment.duration({
            days: days,
            seconds: seconds,
            milliseconds: milliseconds
          });
          const dateAdded = startDate.add(duration);

          yield col.insertOne({
            title: item.name,
            urls: [item.url],
            createdAt: dateAdded.toDate(),
            updatedAt: dateAdded.toDate()
          });

          console.log('Added "' + item.name + '"');
        }
      }


      process.exit();
    }));
  } catch (err) {
    console.log(err);
    process.exit();
  }
});
