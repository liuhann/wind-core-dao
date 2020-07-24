/**
 * 实现database相关Rest接口服务
 */
module.exports = class DBRestify {
  constructor (dbName, colName) {
    this.dbName = dbName
    this.colName = colName
  }

  async initRoute (router) {
    const path = `${this.dbName}/${this.colName}`

    router.get(`${path}`, this.getCollection.bind(this), async (ctx, next) => {
      const skip = parseInt(ctx.request.query.skip) || 0
      const limit = parseInt(ctx.request.query.limit) || 20
      const sort = ctx.request.query.sort
      const order = ctx.request.query.order
      const projection = ctx.request.query.projection
      const query = Object.assign({}, ctx.request.query)
      delete query.skip
      delete query.limit
      delete query.sort
      delete query.order
      delete query.projection

      ctx.body = await this.list(query, {
        skip,
        limit,
        sort: {
          [sort]: parseInt(order)
        },
        projection
      })
      await next()
    })

    router.get(`${path}/:id`, async (ctx, next) => {
      const { id } = ctx.request.params
      ctx.body = await this.getDocument(id)
      await next()
    })

    router.post(`${path}/id`, async (ctx, next) => {
      const { ids } = ctx.query.body
    })
    router.post(`${path}/distinct/:field`, this.distinct.bind(this))
    router.get(`${path}/regex/:prop/:value`, this.regex.bind(this))
    const middleware = filter || (async (ctx, next) => {
      await next()
    })
    router.post(`${path}`, middleware, this.create.bind(this))
    router.patch(`${path}/:id`, middleware, this.patch.bind(this))
    router.delete(`${path}/:id`, middleware, this.delete.bind(this))
    debug('rest service booted ' + path)
  }

  async getCollection (ctx, next) {
    if (!this.coll) {
      const db = await ctx.getDb(this.dbName)
      this.coll = await db.getCollection(this.colName)
    }
    await next()
  }

  setAdmin (admin) {
    this.admin = admin
  }

  async ensureIndex (indexKey, {
    overwriteOnDuplicated
  }) {
    const db = await this.getDb()
    await db.collection(this.coll).createIndex({
      [indexKey]: 1
    }, {
      unique: true
    })
    this.indexKey = indexKey
    debug(`ensure index ${this.coll}: ${indexKey}`)
    this.overwriteOnDuplicated = overwriteOnDuplicated
  }

  /**
       * 设置自动转换为ObjectId类型的字段
       * @param keys
       */
  async setObjectIdField (keys) {
    this.objectIdFields = keys
  }

  /**
       * 设置子集和对应的外键， 主要用于目录、文件这类包含子项应用场景
       * @param subColl 子集名称
       * @param subCollForeignKey  子集文档外键 指向当前集合的id
       * @param collKey 父文档标记字段，默认为_id
       * @returns {Promise<void>}
       */
  setSubCollection (subColl, subCollForeignKey, collKey) {
    this.subColl = subColl
    this.subCollForeignKey = subCollForeignKey
    this.parentCollKey = collKey
  }

  /**
       * 正则查找
       */
  async regex (ctx, next) {
    const db = await this.getDb()
    const coll = db.collection(this.coll)
    const count = ctx.request.query.count || 1000
    const query = {}
    query[ctx.params.prop] = {
      $regex: ctx.params.value
    }
    const cursor = await coll.find(query).limit(count)
    const result = await cursor.toArray()
    ctx.body = {
      result
    }
    await next()
  }

  async list (query, options) {
    // consider value convert to true or false
    for (const key in query) {
      if (query[key] === 'true' || query[key] === 'false') {
        query[key] = JSON.parse(query[key])
      }
    }
    const list = await this.coll.find(query, options)
    const total = await this.coll.count(query)
    const cursor = coll.find(query)

    return {
      query,
      options,
      list,
      total
    }
  }

  /**
       * 创建一条文档，如何发生主键重复时， overwriteOnDuplicated 可配置是否可替换
       * @param ctx
       * @param next
       * @returns {Promise<void>}
       */
  async create (ctx, next) {
    const object = ctx.request.body
    object.creator = ctx.user.id
    object.created = new Date().getTime()
    object.updated = object.created
    object.token = ctx.token
    const db = await this.getDb()
    const coll = db.collection(this.coll)
    let result = null
    this.convertForeignFieldValueToObjectId(ctx, object)
    for (const key in object) {
      if (key.match(/^_[a-z]+_id$/)) {
        object[key] = new ObjectID(object[key])
      }
    }
    try {
      result = await coll.insertOne(object, {
        bypassDocumentValidation: true
      })
    } catch (e) {
      if (e instanceof MongoError) {
        if (this.overwriteOnDuplicated) {
          debug(`overwrite duplicated  ${this.coll} ${this.indexKey}=${object[this.indexKey]}`)
          await coll.deleteOne({
            [this.indexKey]: object[this.indexKey]
          })
          result = await coll.insertOne(object)
          debug('removed and inserted new')
        }
      }
    }
    ctx.body = {
      result,
      object
    }
    await next()
  }

  convertForeignFieldValueToObjectId (ctx, object) {
    // 处理foreignkey 创建转换
    try {
      if (this.objectIdFields) {
        for (const foreignKey of this.objectIdFields) {
          if (object[foreignKey]) {
            object[foreignKey] = new ObjectID(object[foreignKey])
          }
          if (foreignKey.match(/^_[a-z]+_id$/)) {
            object[foreignKey] = new ObjectID(object[foreignKey])
          }
        }
      }
    } catch (e) {
      ctx.throw(400, this.objectIdFields + ' must be ObjectId')
    }
  }

  async getMultipleDocuments (ids) {
    return await this.coll.find({
      id: {
        $in: ids
      }
    })
  }

  async getDocument (id) {
    return await this.coll.findOne(id)
  }

  /**
       * 更新文档
       * @param ctx
       * @param next
       * @returns {Promise<void>}
       */
  async patch (ctx, next) {
    const body = ctx.request.body
    const db = await this.getDb()
    const coll = db.collection(this.coll)
    const setProperties = Object.assign({}, body)

    // only admin can modify prop.system
    if (setProperties.system && ctx.user.id !== this.admin) {
      debug(`Patch prop.system ${ctx.user.id} !== ${this.admin}`)
      ctx.throw(403, 'Patch on prop.system not allowed')
      return
    }
    setProperties.updated = new Date().getTime()
    if (setProperties._id) {
      delete setProperties._id
    }
    const objectId = ctx.params.id

    setProperties.packKey = new ObjectID(objectId)

    await coll.findOneAndUpdate({
      _id: new ObjectID(objectId)
    }, {
      $set: setProperties
    })
    ctx.body = {
      code: 204
    }
    await next()
  }

  async delete (ctx, next) {
    const objectId = ctx.params.id
    const db = await this.getDb()
    const coll = db.collection(this.coll)
    const found = await coll.findOne({
      _id: new ObjectID(objectId)
    })
    if (found) {
      // 匿名删除
      if ((found.creator == null && ctx.token === found.token) || found.token == null) {
        const deleted = await coll.deleteOne({
          _id: new ObjectID(objectId)
        })
        ctx.body = {
          deleted
        }
        await next()
        return
      }

      if (!ctx.user || !ctx.user.id) { // only the creator and admin can perform deleting
        ctx.throw(403)
      }
      if (found.creator === ctx.user.id || ctx.user.id === this.admin) {
        const deleted = await coll.deleteOne({
          _id: new ObjectID(objectId)
        })
        ctx.body = {
          deleted
        }
      } else {
        ctx.throw(403)
      }
    }
    await next()
  }

  /**
       * 获取coll的distinct列值
       * @param ctx
       * @param next
       * @returns {Promise<void>}
       */
  async distinct (ctx, next) {
    const { field } = ctx.params
    const db = await this.getDb()
    const coll = db.collection(this.coll)
    const distinctValue = await coll.distinct(field, ctx.request.body)
    ctx.body = distinctValue
    await next()
  }
}
