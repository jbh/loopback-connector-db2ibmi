# loopback-connector-db2ibmi

A loopback connector for [IBM i DB2](http://www-03.ibm.com/systems/power/software/i/db2/) that does not require DB2 Connect.

The LoopBack DB2 for IBM i connector currently supports:

- Supports most CRUD calls. Put and replace requests are buggy.
- [Queries](http://loopback.io/doc/en/lb2/Querying-data.html) with limit, order, skip and where filters.

And currently lacks:

- Full CRUD [create, retrieve, update, and delete operations](http://loopback.io/doc/en/lb2/Creating-updating-and-deleting-data.html).
- [Queries](http://loopback.io/doc/en/lb2/Querying-data.html) with fields.
- Change stream
- Library list and multi-schema support would be nice to have. Right now a datasource has to be setup for each schema.
- **Needs code clean up and tests. This is very much pre-alpha right now.**
- HEAD request is currently not working.
- Entity put & replace requests are broken.


## Installation

Enter the following in the top-level directory of your LoopBack application:

```
$ npm install git+ssh://github.com/jbh/loopback-connector-db2ibmi.git --save
```

The above is how I got it work on the IBM i.

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
  "schema": <db2 schema>
}
```

The following table describes the connector properties.

Property&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Type&nbsp;&nbsp;    | Description
---------------| --------| --------
database       | String  | Database name (currently not set)
schema         | String  | Specifies the default schema name that is used to qualify unqualified database objects in dynamically prepared SQL statements. The value of this property sets the value in the CURRENT SCHEMA special register on the database server. The schema name is case-sensitive, and must be specified in uppercase characters
username       | String  | DB2 Username
password       | String  | DB2 password associated with the username above
hostname       | String  | DB2 server hostname or IP address
port           | String  | DB2 server TCP port number
useLimitOffset | Boolean | LIMIT and OFFSET must be configured on the DB2 server before use (compatibility mode)
supportDashDB  | Boolean | Create ROW ORGANIZED tables to support dashDB.

Some of the above are not currently supported. Database, schema, useLimitOffset,
and supportDashDB are not taken into consideration as they should be in the
code. This should be remedied.

### Goal

The goal is for this to become as verbose as `loopback-connector-db2iseries`, but not rely on odbc and DB2 Connect.
