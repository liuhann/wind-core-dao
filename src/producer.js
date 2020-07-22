const mkdir = require('make-dir'),
    LowDB = require('./lowdb'),
    path = require('path');

/**
 * 数据库生成器类,这里封装了所有数据库获取相关操作，对于使用者通过数据库、数据集合接口屏蔽了具体数据库的差异性
 */
class DatabaseProducer {
    constructor() {
        // 默认使用LowDB
        this.DataBase = LowDB;
        this.dbOptions = {
            store: './.data'
        };
        this.instances = {};
    }

    /**
     * 挂载相关默认方法到koa app
     * @param {Object} app
     */
    ready(app) {
        // 设置到默认数据库
        app.context.db = app.db = this.getDb();

        // 实现获取db实例方法
        app.context.getDb = app.getDb = this.getDb.bind(this);

        // 获取数据库列表
        app.context.getDbs = app.getDbs = this.getDbs.bind(this);

        // 直接获取coll的方法
        app.context.getCollection = app.getCollection = this.getCollection.bind(this);
    }

    async setDatabaseImpl(Database, options) {
        this.Database = Database;
        Object.assign(this.dbOptions, options);
        // ensure dir
        await mkdir(this.dbOptions.store);
    }

    getDbs() {
        return Object.keys(this.instances);
    }

    getDb(name = 'db') {
        const { DataBase: DataBaseImpl } = this;

        if (name.match(/^[a-z][a-z0-9]*/)) {
            if (this.instances[name] == null) {
                this.instances[name] = new DataBaseImpl(path.resolve(this.dbOptions.store, name), this.dbOptions);
            }
            return this.instances[name];
        } else {
            throw new Error('Db name invalid');
        }
    }

    getCollection(dbname, collname) {
        if (dbname) {
            if (collname) {
                return this.getDb(dbname).getCollection(collname);
            } else {
                return this.getDb().getCollection(collname);
            }
        } else {
            throw new Error('db or collection name required');
        }
    }
}

module.exports = DatabaseProducer;
