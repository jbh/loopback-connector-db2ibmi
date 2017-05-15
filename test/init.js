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
    hostname: process.env.DB2I_HOSTNAME || '*LOCAL',
    port: process.env.DB2I_PORTNUM || 60000,
    database: process.env.DB2I_DATABASE || 'testdb',
    schema: process.env.DB2I_SCHEMA || 'MDU21_D'
};

global.config = config;

global.getDataSource = global.getSchema = function(options) {
    return new DataSource(require('../'), config);
};

global.connectorCapabilities = {
    ilike: false,
    nilike: false
};

global.sinon = require('sinon');
