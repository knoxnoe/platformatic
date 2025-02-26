'use strict'

const buildEntity = require('./lib/entity')
const queriesFactory = require('./lib/queries')
const fp = require('fastify-plugin')

// Ignore the function as it is only used only for MySQL and PostgreSQL
/* istanbul ignore next */
async function buildConnection (log, createConnectionPool, connectionString) {
  const db = await createConnectionPool({
    connectionString,
    bigIntMode: 'string',
    onQueryStart: (_query, { text, values }) => {
      log.trace({
        query: {
          text,
          values
        }
      }, 'start query')
    },
    onQueryResults: (_query, { text }, results) => {
      log.trace({
        query: {
          text,
          results: results.length
        }
      }, 'end query')
    },
    onQueryError: (_query, { text }, err) => {
      log.error({
        query: {
          text,
          error: err.message
        }
      }, 'query error')
    }
  })
  return db
}

async function connect ({ connectionString, log, onDatabaseLoad, ignore = {}, autoTimestamp = true, hooks = {} }) {
  // TODO validate config using the schema
  if (!connectionString) {
    throw new Error('connectionString is required')
  }

  let queries
  let sql
  let db

  /* istanbul ignore next */
  if (connectionString.indexOf('postgres') === 0) {
    const createConnectionPoolPg = require('@databases/pg')
    db = await buildConnection(log, createConnectionPoolPg, connectionString)
    sql = createConnectionPoolPg.sql
    queries = queriesFactory.pg
    db.isPg = true
  } else if (connectionString.indexOf('mysql') === 0) {
    const createConnectionPoolMysql = require('@databases/mysql')
    db = await buildConnection(log, createConnectionPoolMysql, connectionString)
    sql = createConnectionPoolMysql.sql
    const version = (await db.query(sql`SELECT VERSION()`))[0]['VERSION()']
    db.version = version
    db.isMariaDB = version.indexOf('maria') !== -1
    if (db.isMariaDB) {
      queries = queriesFactory.mariadb
    } else {
      db.isMySQL = true
      queries = queriesFactory.mysql
    }
  } else if (connectionString.indexOf('sqlite') === 0) {
    const sqlite = require('@databases/sqlite')
    const path = connectionString.replace('sqlite://', '')
    db = sqlite(connectionString === 'sqlite://:memory:' ? undefined : path)
    sql = sqlite.sql
    queries = queriesFactory.sqlite
    db.isSQLite = true
  } else {
    throw new Error('You must specify either postgres, mysql or sqlite as protocols')
  }

  const entities = {}

  try {
    /* istanbul ignore else */
    if (typeof onDatabaseLoad === 'function') {
      await onDatabaseLoad(db, sql)
    }

    const tables = await queries.listTables(db, sql)

    for (const table of tables) {
      // The following line is a safety net when developing this module,
      // it should never happen.
      /* istanbul ignore next */
      if (typeof table !== 'string') {
        throw new Error(`Table must be a string, got '${table}'`)
      }
      if (ignore[table] === true) {
        continue
      }

      const entity = await buildEntity(db, sql, log, table, queries, autoTimestamp, ignore[table] || {})
      // Check for primary key of all entities
      if (!entity.primaryKey) {
        throw new Error(`Cannot find primary key for ${entity.name} entity`)
      }
      entities[entity.singularName] = entity
      if (hooks[entity.name]) {
        addEntityHooks(entity.singularName, hooks[entity.name])
      } else if (hooks[entity.singularName]) {
        addEntityHooks(entity.singularName, hooks[entity.singularName])
      }
    }
  } catch (err) /* istanbul ignore next */ {
    db.dispose()
    throw err
  }

  return {
    db,
    sql,
    entities,
    addEntityHooks
  }

  function addEntityHooks (entityName, hooks) {
    const entity = entities[entityName]
    if (!entity) {
      throw new Error('Cannot find entity ' + entityName)
    }
    for (const key of Object.keys(hooks)) {
      if (hooks[key] && entity[key]) {
        entity[key] = hooks[key].bind(null, entity[key])
      }
    }
  }
}

async function sqlMapper (app, opts) {
  const mapper = await connect({
    log: app.log,
    ...opts
  })

  app.onClose(() => mapper.db.dispose())
  // TODO this would need to be refactored as other plugins
  // would need to use this same namespace
  app.decorate('platformatic', mapper)
}

module.exports = fp(sqlMapper)
module.exports.connect = connect
module.exports.plugin = module.exports
module.exports.utils = require('./lib/utils')
