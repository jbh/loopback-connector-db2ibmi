// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-db2iseries
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = {
    username: process.env.DB2I_USERNAME,
    password: process.env.DB2I_PASSWORD,
    database: process.env.DB2I_DATABASE || '*LOCAL',
    schema: process.env.DB2I_SCHEMA || process.env.DB2I_USERNAME
};

console.log(config);

global.config = config;

global.getDataSource = global.getSchema = function(options) {
    return new DataSource(require('../'), config);
};

global.connectorCapabilities = {
    ilike: false,
    nilike: false
};

global.sinon = require('sinon');
