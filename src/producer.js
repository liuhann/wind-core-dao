const mkdir = require('make-dir')
const path = require('path')

/**
 * 数据库生成器类,这里封装了所有数据库获取相关操作，对于使用者通过数据库、数据集合接口屏蔽了具体数据库的差异性
 */
class DatabaseProducer {
  constructor () {
    this.DataBase = null
    this.dbOptions = {
      store: './.data'
    }
    this.instances = {}
  }

  /**
     * 挂载相关默认方法到koa app
     * @param {Object} app
     */
  async ready (app) {
    if (this.dbOptions.store) {
      // ensure dir
      await mkdir(this.dbOptions.store)
    }
    // 设置到默认数据库
    app.context.db = app.db = await this.getDb()

    // 实现获取db实例方法
    app.context.getDb = app.getDb = this.getDb.bind(this)

    // 获取数据库列表
    app.context.getDbs = app.getDbs = this.getDbs.bind(this)

    // 直接获取coll的方法
    app.context.getCollection = app.getCollection = this.getCollection.bind(this)

    app.setCollRestful = this.setCollectionRestful.bind(this)
  }

  async setCollectionRestful (dbName, collName) {

  }

  async setDatabaseImpl (DataBase, options) {
    this.DataBase = DataBase
    Object.assign(this.dbOptions, options)
  }

  getDbs () {
    return Object.keys(this.instances)
  }

  async getDb (name = 'db') {
    const { DataBase } = this

    if (name.match(/^[a-z][a-z0-9]*/)) {
      if (this.instances[name] == null) {
        this.instances[name] = new DataBase(path.resolve(this.dbOptions.store, name), this.dbOptions)
        if (this.instances[name].connect) {
          await this.instances[name].connect()
        }
      }
      return this.instances[name]
    } else {
      throw new Error('Db name invalid')
    }
  }

  getCollection (dbname, collname) {
    if (dbname) {
      if (collname) {
        return this.getDb(dbname).getCollection(collname)
      } else {
        return this.getDb().getCollection(collname)
      }
    } else {
      throw new Error('db or collection name required')
    }
  }
}

module.exports = DatabaseProducer
