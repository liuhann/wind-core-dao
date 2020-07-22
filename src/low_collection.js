const Collection = require('./collection');

class LowCollection extends Collection {
    constructor(db, name) {
        super();
        this.db = db;
        this.name = name;
        this.check();
    }

    check() {
        if (!this.db.has(this.name).value()) {
            this.db.set(this.name, []).write();
        }
        this.coll = this.db.get(this.name);
    }

    async insert(object) {
        return this.coll.insert(object).write();
    }

    async update(id, object) {
        await this.coll.remove({ id }).write();
        await this.coll.insert(object).assign({ id }).write();
    }

    async patch(id, object) {
        await this.coll.find({ id }).assign(object).write();
    }

    async clean() {
        await this.db.set(this.name, []).write();
    }

    /**
   * 删除一个文档
   * @override
   * @param id 文档标识/查询条件
   */
    async remove(id) {
        if (typeof id === 'object') {
            // 按查询条件删除
            if (Array.isArray(id)) {
                // 作为数组进行批量删除
                for (const arrayItem of id) {
                    await this.remove(arrayItem);
                }
            } else {
                await this.coll.remove(id).write();
            }
        } else if (typeof id === 'string') {
            // 按id删除
            await this.coll.remove({ id }).write();
        }
    }

    /**
   * 根据id或条件获取一个文档
   * @abstract
   * @param id 文档id或者文档的查询条件
   */
    async findOne(id) {
        if (typeof id === 'string') {
            return this.coll.getById(id).value();
        } else {
            const result = await this.find(id);

            if (result.list.length > 0) {
                return result.list[0];
            } else {
                return null;
            }
        }
    }

    /**
   * 查询满足条件的文档列表
   * @todo 目前暂时不支持sort、project功能
   * @override
   * @param query 查询条件
   * @param sort 指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 1 为升序排列，而 -1 是用于降序排列。
   * @param projection 使用投影操作符指定返回的键。查询时返回文档中所有键值， 只需省略该参数即可（默认省略） { field1: true, field2: true ... }
   * @param skip 数字参数作为跳过的记录条数。 默认为 0
   * @param limit 数字参数，该参数指定从读取的记录条数。 默认为 -1 不限制
   */
    async find(query, {
        sort,
        projection,
        skip = 0,
        limit = -1
    } = {}) {
        const result = this.coll.filter(query).value(),
            total = result.length;
        let targetList = limit > 0 ? result.splice(skip, limit) : result.splice(skip);

        // 处理投影， 优先使用exclude
        if (projection && typeof projection === 'object') {
            const includes = [],
                excludes = [];

            for (const key in projection) {
                if (projection[key] === true) {
                    includes.push(key);
                } else {
                    excludes.push(key);
                }
            }
            if (excludes.length) {
                targetList = targetList.map(o => {
                    const cloned = JSON.parse(JSON.stringify(o));

                    for (const exc of excludes) {
                        delete cloned[exc];
                    }
                    return cloned;
                });
            } else {
                targetList = targetList.map(o => {
                    const out = {};

                    for (const inc of includes) {
                        out[inc] = o[inc];
                    }
                    return out;
                });
            }
        }
        return {
            skip,
            total,
            list: targetList
        };
    }

    /**
   * 判断是否有指定查询条件的文档
   * @param query
   * @return {Promise<void>}
   */
    async exist(query) {
        const result = this.coll.filter(query).value();

        return result.length > 0;
    }
}

module.exports = LowCollection;
