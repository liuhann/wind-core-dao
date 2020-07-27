const low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    DataBase = require('./database'),
    lodashId = require('lodash-id'),
    LowCollection = require('./low_collection');

class LowDB extends DataBase {
    constructor(dbFilePath) {
        super();
        this.adapter = new FileSync(dbFilePath);
        this.db = low(this.adapter);
        this.db._.mixin(lodashId);
        this.db._.id = '_id';
        this.collections = {};
    }

    /**
     * @override
     */
    getCollections() {
        return Object.keys(this.db.getState());
    }

    /**
     * @override
     */
    getCollection(name) {
        if (!this.collections[name]) {
            this.collections[name] = new LowCollection(this.db, name);
        }
        return this.collections[name];
    }
}

module.exports = LowDB;
