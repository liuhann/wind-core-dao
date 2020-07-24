const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const DataBase = require('./database')
const lodashId = require('lodash-id')
const LowCollection = require('./low_collection')

class LowDB extends DataBase {
  constructor (dbFilePath) {
    super()
    this.adapter = new FileSync(dbFilePath)
    this.db = low(this.adapter)
    this.db._.mixin(lodashId)
    this.collections = {}
  }

  /**
     * @override
     */
  getCollections () {
    return Object.keys(this.db.getState())
  }

  /**
     * @override
     */
  getCollection (name) {
    if (!this.collections[name]) {
      this.collections[name] = new LowCollection(this.db, name)
    }
    return this.collections[name]
  }
}

module.exports = LowDB
