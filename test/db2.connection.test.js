// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var describe = require('./describe');

/* eslint-env node, mocha */
process.env.NODE_ENV = 'test';
require('./init.js');
var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;

var config;

before(function() {
    config = global.config;
});

describe('testConnection', function() {
    it('should pass with valid settings', function(done) {
        var db = new DataSource(require('../'), config);
        db.ping(function(err) {
            assert(!err, 'Should connect without err.');
            done();
        });
    });
});
