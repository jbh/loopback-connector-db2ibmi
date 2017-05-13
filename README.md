# loopback-connector-db2ibmi

A loopback connector for [IBM i DB2](http://www-03.ibm.com/systems/power/software/i/db2/) that does not require DB2 Connect.

The LoopBack DB2 for IBM i connector currently supports:

- Patch, Post
- [Queries](http://loopback.io/doc/en/lb2/Querying-data.html) with limit, order, skip and where filters.

And currently lacks:

- Full CRUD [create, retrieve, update, and delete operations](http://loopback.io/doc/en/lb2/Creating-updating-and-deleting-data.html).
- [Queries](http://loopback.io/doc/en/lb2/Querying-data.html) with fields.
- Change stream
- Library list and multi-schema support would be nice to have. Right now a datasource has to be setup for each schema.
- Needs code clean up and tests. This is very much pre-alpha right now.
- I'm not sure what the HEAD request is for, and it currently does not work.
- Entity put & replace requests are broken.


## Installation

Enter the following in the top-level directory of your LoopBack application:

```
$ npm install git@github.com:jbh/loopback-connector-db2ibmi.git --save
```

## Configuration

Use the [data source generator](http://loopback.io/doc/en/lb2/Data-source-generator.html) to add the DB2 for iSeries data source to your application.
The entry in the application's `server/datasources.json` will look something like this:

```js
"mydb": {
  "name": "mydb",
  "connector": "db2ibmi"
}
```

Edit `server/datasources.json` to add other supported properties as required:

```js
"mydb": {
  "name": "mydb",
  "connector": "db2ibmi",
  "username": <username>,
  "password": <password>,
  "database": <database name>,
  "hostname": <db2 server hostname>,
  "port":     <port number>
}
```

The following table describes the connector properties.

Property&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Type&nbsp;&nbsp;    | Description
---------------| --------| --------
database       | String  | Database name
schema         | String  | Specifies the default schema name that is used to qualify unqualified database objects in dynamically prepared SQL statements. The value of this property sets the value in the CURRENT SCHEMA special register on the database server. The schema name is case-sensitive, and must be specified in uppercase characters
username       | String  | DB2 Username
password       | String  | DB2 password associated with the username above
hostname       | String  | DB2 server hostname or IP address
port           | String  | DB2 server TCP port number
useLimitOffset | Boolean | LIMIT and OFFSET must be configured on the DB2 server before use (compatibility mode)
supportDashDB  | Boolean | Create ROW ORGANIZED tables to support dashDB.


Alternatively, you can create and configure the data source in JavaScript code.
For example:

```js
var DataSource = require('loopback-datasource-juggler').DataSource;
var DB2 = require('loopback-connector-db2iseries');

var config = {
  username: process.env.DB2_USERNAME,
  password: process.env.DB2_PASSWORD,
  hostname: '*LOCAL',
  schema: 'MDU21_D',
};

var db = new DataSource(DB2, config);

var User = db.define('User', {
  name: { type: String },
  email: { type: String },
});

db.autoupdate('User', function(err) {
  if (err) {
    console.log(err);
    return;
  }

  User.create({
    name: 'Tony',
    email: 'tony@t.com',
  }, function(err, user) {
    console.log(err, user);
  });

  User.find({ where: { name: 'Tony' }}, function(err, users) {
    console.log(err, users);
  });

  User.destroyAll(function() {
    console.log('example complete');
  });
});
```

### Goal

The goal is for this to become as verbose as `loopback-connector-db2iseries`, but not rely on odbc and DB2 Connect.
