import path from 'path'
import fs from 'fs/promises'
import { test } from 'tap'
import { join } from 'desm'
import { execa } from 'execa'
import { cliPath } from './helper.mjs'

const moviesMigration = `
-- Add SQL in this file to create the database tables for your API
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);
`

test('run db init with default options', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'sqlite://./db.sqlite')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run init with default options twice', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  const { stdout: firstRunStdout } = await execa('node', [cliPath, 'init'], { cwd: pathToFolder })
  const { stdout: secondRunStdout } = await execa('node', [cliPath, 'init'], { cwd: pathToFolder })

  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const firstRunStdoutLines = firstRunStdout.split('\n')
  t.match(firstRunStdoutLines[0], /(.*)Configuration file platformatic.db.json successfully created./)
  t.match(firstRunStdoutLines[1], /(.*)Migrations folder .\/migrations successfully created./)
  t.match(firstRunStdoutLines[2], /(.*)Migration file 001.do.sql successfully created./)
  t.match(firstRunStdoutLines[3], /(.*)Please run `npm i --save-dev(.*)/)

  const secondRunStdoutLines = secondRunStdout.split('\n')
  t.match(secondRunStdoutLines[0], /(.*)Configuration file platformatic.db.json found, skipping creation of configuration file./)
  t.match(secondRunStdoutLines[1], /(.*)Migrations folder .\/migrations found, skipping creation of migrations folder./)
  t.match(secondRunStdoutLines[2], /(.*)Migration file 001.do.sql found, skipping creation of migration file./)
  t.match(secondRunStdoutLines[3], /(.*)Please run `npm i --save-dev(.*)/)

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'sqlite://./db.sqlite')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --database postgres', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--database', 'postgres'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'postgres://postgres:postgres@localhost:5432/postgres')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --database mysql', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--database', 'mysql'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'mysql://root@localhost:3306/graph')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --database mariadb', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--database', 'mariadb'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'mysql://root@localhost:3307/graph')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --database mysql8', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--database', 'mysql8'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'mysql://root@localhost:3308/graph')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --hostname 127.0.0.5', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--hostname', '127.0.0.5'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.5')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'sqlite://./db.sqlite')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --port 3055', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, 'migrations')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--port', '3055'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3055)

  t.equal(core.connectionString, 'sqlite://./db.sqlite')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, './migrations')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})

test('run db init --migrations custom-migrations-folder', async (t) => {
  const pathToFolder = join(import.meta.url, '..', 'fixtures', 'init')
  const pathToDbConfigFile = path.join(pathToFolder, 'platformatic.db.json')
  const pathToMigrationFolder = path.join(pathToFolder, './custom-migrations-folder')
  const pathToMigrationFile = path.join(pathToMigrationFolder, '001.do.sql')

  await execa('node', [cliPath, 'init', '--migrations', 'custom-migrations-folder'], { cwd: pathToFolder })
  t.teardown(async () => {
    await fs.rm(pathToDbConfigFile)
    await fs.rm(pathToMigrationFolder, { recursive: true, force: true })
  })

  const dbConfigFile = await fs.readFile(pathToDbConfigFile, 'utf8')
  const dbConfig = JSON.parse(dbConfigFile)

  const { server, core, migrations } = dbConfig

  t.same(server.logger, { level: 'info' })
  t.equal(server.hostname, '127.0.0.1')
  t.equal(server.port, 3042)

  t.equal(core.connectionString, 'sqlite://./db.sqlite')
  t.equal(core.graphiql, true)

  t.equal(migrations.dir, 'custom-migrations-folder')

  const migrationFile = await fs.readFile(pathToMigrationFile, 'utf8')
  t.equal(migrationFile, moviesMigration)
})
