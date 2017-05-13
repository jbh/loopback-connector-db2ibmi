var nv = process.version.match(/\d+/)[0];
var driverPath = nv === 4
  ? '/QOpenSys/QIBM/ProdData/OPS/Node4/os400/db2i/lib/db2a'
  : '/QOpenSys/QIBM/ProdData/OPS/Node6/os400/db2i/lib/db2a';
var db = require(driverPath);
var SqlConnector = require('loopback-connector').SqlConnector;
var util = require('util');
var debug = require('debug')('loopback:connector:db2ibmi');

/**
 * Initialize the  connector against the given data source
 *
 * @param {DataSource} dataSource The loopback-datasource-juggler dataSource
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(ds, cb) {
  ds.connector = new DB2IBMi(ds.settings);
  ds.connector.dataSource = ds;
  ds.connector.connect(function(err, conn) {
    ds.client = conn;
    cb && cb(err, conn);
  });

  cb();
};

function DB2IBMi(settings) {
  SqlConnector.call(this, 'db2ibmi', settings);
  
  this.setConnectionProperties(settings);
}

util.inherits(DB2IBMi, SqlConnector);

DB2IBMi.prototype.connect = function(cb) {
  var self = this;

  self.dataSource.connecting = true;
  var dbconn = new db.dbconn();
  dbconn.setConnAttr(db.SQL_ATTR_DBC_DEFAULT_LIB, self.schema);
  dbconn.conn(self.hostname);
  
  // Cannot figure out how to check if connection errored...
  self.dataSource.connected = true;
  self.dataSource.connecting = false;
  self.dataSource.connection = new db.dbstmt(dbconn);
  self.dataSource.emit('connected');
  self.client = dbconn;
  cb && cb(null, self.dataSource.connection);
};


DB2IBMi.prototype.disconnect = function(cb) {
  this.client.disconn();
};


DB2IBMi.prototype.ping = function(cb) {
  debug('DB2IBMi.prototype.ping');
  var self = this;
  var sql = 'SELECT COUNT(*) AS COUNT FROM SYSIBM.SYSDUMMY1';

  if (self.dataSource.connection) {
    ping(self.dataSource.connection, cb);
  } else {
    self.connect(function(err, conn) {
      if (err) {
        return cb(err);
      }
      ping(conn, function(err, res) {
        conn.close(function(cerr) {
          if (err || cerr) {
            return cb(err || cerr);
          }
          return cb(null, res);
        });
      });
    });
  }

  function ping(conn, cb) {
    conn.exec(sql, function(results) {
      cb && cb(null, results.length > 0 && results[0]['COUNT'] > 0);
    });
  }
}

/**
 * Escape an identifier such as the column name
 * DB2IBMi requires double quotes for case-sensitivity
 *
 * @param {string} name A database identifier
 * @returns {string} The escaped database identifier
 */
DB2IBMi.prototype.escapeName = function(name) {
  debug('DB2IBMi.prototype.escapeName name=%j', name);
  if (!name) return name;
  name.replace(/["]/g, '""');
  return '"' + name + '"';
};

/**
 * Create the data model in DB2
 *
 * @param {string} model The model name
 * @param {Object} data The model instance data
 * @param {Object} options Options object
 * @param {Function} [callback] The callback function
 */
DB2IBMi.prototype.create = function(model, data, options, callback) {
  console.log('hello');
  var self = this;
  var stmt = self.buildInsert(model, data, options);
  var id = self.idColumn(model);
  var sql = 'SELECT \"' + id + '\" FROM FINAL TABLE (' + stmt.sql + ')';

  if (!options.transaction) {
    sql += ' WITH NC';
  }

  self.executeSQL(sql, stmt.params, options, function(err, info) {
    if (err) {
      callback(err);
    } else {
      callback(err, info[0][id]);
    }
  });
};

/**
 * Execute the sql statement
 *
 */
DB2IBMi.prototype.executeSQL = function(sql, params, options, callback) {
  debug('DB2IBMi.prototype.executeSQL (enter)',
        sql, params, options);

  var self = this;

  function executeStatement(conn, cb) {
    var limit = 0;
    var offset = 0;
    var stmt = {};

    stmt.noResults = options && options.noResultSet ?
                       options.noResultSet : false;

    // This is standard DB2 syntax. LIMIT and OFFSET
    // are configured off by default. Enable these to
    // leverage LIMIT and OFFSET.
    if (!self.useLimitOffset) {
      var res = sql.match(self.limitRE);
      if (res) {
        limit = parseInt(res[1], 10);
        sql = sql.replace(self.limitRE, '');
      }
      res = sql.match(self.offsetRE);
      if (res) {
        offset = parseInt(res[1], 10);
        sql = sql.replace(self.offsetRE, '');
      }
    }

    // Build the stmt object that will be passed into the query call.
    // This is done because the query call can take an object or a set
    // of parameters.  Depending on the SQL being passed in the call with
    // parameters may fail due to improper handling in the ibm_db module.
    stmt.sql = sql;
    stmt.params = params;
    
    if (params.length > 0) {
      // Find a better way. This is insecure.
      var placeholderIndices = [];
      for (var i = 0; i < sql.length; i++) {
        if (sql[i] === "?") placeholderIndices.push(i);
      }
      
      var idx = 0;
      var increase = 0;
      var tempParam = '';
      for (var j = 0; j < placeholderIndices.length; j++) {
        // this only works with a number (id)
        tempParam = isNaN(params[j]) ? "'" + params[j] + "'" : params[j];
        sql = sql.substr(0, placeholderIndices[j] + increase) +
          tempParam +
          sql.substr(placeholderIndices[j] + increase + 1);
        increase += tempParam.length - 1;
      }
      conn.exec(sql, function(results) {
        cb && cb(null, results);
      });
    } else {
      conn.exec(sql, function(results) {
        cb && cb(null, results);
      });
    }
  };

  if (options.transaction) {
    var conn = options.transaction.connection;
    executeStatement(conn, function(err, data) { callback(err, data); });
  } else {
    this.connect(function(err, conn) {
      if (err) return callback(err);

      executeStatement(conn, function(err, data) {
        db.close();
        
        callback(err, data);
      });
    });
  }
};

DB2IBMi.prototype.getCountForAffectedRows = function(model, info) {
  // Not sure how to implement this. As long as it is defined, CRUD works.
  console.log(model);
  console.log(info);
};

/**
 * Convert the data from database column to model property
 *
 * @param {object} Model property descriptor
 * @param {*) val Column value
 * @returns {*} Model property value
 */
DB2IBMi.prototype.fromColumnValue = function(prop, val) {
  debug('DB2IBMi.prototype.fromColumnValue %j %j', prop, val);
  if (val === null || !prop) {
    return val;
  }
  switch (prop.type.name) {
    case 'Number':
      return Number(val);
    case 'String':
      return String(val);
    case 'Date':
      val = this.parseDate(val);
      
      return new Date(Date.parse(val));
    case 'Boolean':
      return Boolean(val);
    case 'GeoPoint':
    case 'Point':
    case 'List':
    case 'Array':
    case 'Object':
    case 'JSON':
      return JSON.parse(val);
    default:
      return val;
  }
};

/**
 * Convert property name/value to an escaped DB column value
 *
 * @param {Object} prop Property descriptor
 * @param {*} val Property value
 * @returns {*} The escaped value of DB column
 */
DB2IBMi.prototype.toColumnValue = function(prop, val) {
  debug('DB2IBMi.prototype.toColumnValue prop=%j val=%j', prop, val);
  if (val === null) {
    // if (prop.autoIncrement || prop.id) {
    //   return new ParameterizedSQL('DEFAULT');
    // }
    return null;
  }
  if (!prop) {
    return val;
  }
  switch (prop.type.name) {
    default:
    case 'Array':
    case 'Number':
    case 'String':
      return val;
    case 'Boolean':
      return Number(val);
    case 'GeoPoint':
    case 'Point':
    case 'List':
    case 'Object':
    case 'ModelConstructor':
      return JSON.stringify(val);
    case 'JSON':
      return String(val);
    case 'Date':
      return dateToIBMDB(val);
  }
};

/**
 * Get the place holder in SQL for values, such as :1 or ?
 *
 * @param {string} key Optional key, such as 1 or id
 * @returns {string} The place holder
 */
DB2IBMi.prototype.getPlaceholderForValue = function(key) {
  debug('IBMDB.prototype.getPlaceholderForValue key=%j', key);
  return '?';
};


function buildLimit(limit, offset) {
  if (isNaN(limit)) { limit = 0; }
  if (isNaN(offset)) { offset = 0; }
  if (!limit && !offset) {
    return '';
  }
  if (limit && !offset) {
    return 'FETCH FIRST ' + limit + ' ROWS ONLY';
  }
  if (offset && !limit) {
    return 'OFFSET ' + offset;
  }
  return 'LIMIT ' + limit + ' OFFSET ' + offset;
}

DB2IBMi.prototype.applyPagination = function(model, stmt, filter) {
  debug('IBMDB.prototype.applyPagination');
  var limitClause = buildLimit(filter.limit, filter.offset || filter.skip);
  return stmt.merge(limitClause);
};

function dateToIBMDB(val) {
  var dateStr = val.getFullYear() + '-'
      + fillZeros(val.getMonth() + 1) + '-'
      + fillZeros(val.getDate()) + '-'
      + fillZeros(val.getHours()) + '.'
      + fillZeros(val.getMinutes()) + '.'
      + fillZeros(val.getSeconds()) + '.';
  var ms = val.getMilliseconds();
  if (ms < 10) {
    ms = '00000' + ms;
  } else if (ms < 100) {
    ms = '0000' + ms;
  } else {
    ms = '000' + ms;
  }
  return dateStr + ms;
  function fillZeros(v) {
    return v < 10 ? '0' + v : v;
  }
};

DB2IBMi.prototype.parseDate = function(date) {
    // oh... my... goat...
    // there has got to be a better way!
    var thirdDashIndex = date
      .split('-', 3)
      .join('-')
      .length;
    var dateObj = new Date();
    var offset = -dateObj.getTimezoneOffset();
    var prefix = offset >= 0 ? "+" : "-";
    offset = (prefix) + parseInt(offset / 60) + ":" + offset % 60;
    
    date = date.substr(0, thirdDashIndex) +
      'T' + date.substr(thirdDashIndex + 1);
      
    // Timezone needs to not be hardcoded
    var parts = date.split('.');
    date = parts.slice(0,-1).join(':') + '.' + parts.slice(-1);
    date = date.substring(0, date.length - 3) + '+01:00';
      
    return date;
};

DB2IBMi.prototype.setConnectionProperties = function(settings) {
  var self = this;
  self.hostname = settings.hostname || '*LOCAL';
  self.dbname = settings.database || settings.db || 'testdb';
  self.username = settings.username || settings.user;
  self.password = settings.password;
  self.schema = settings.schema;
};