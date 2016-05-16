'use strict';

module.exports = {
  USER: process.env.USER || 'foo',
  PASS: process.env.PASS || 'bar',
  PORT: process.env.PORT || 5656,
  DB: process.env.DB || 'mongodb://localhost/stash'
};
