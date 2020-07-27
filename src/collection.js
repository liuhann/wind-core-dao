/**
 * 文档性数据集合接口
 */
class Collection {
    /**
   * 插入文档
   * 若插入的数据主键已经存在，则会抛 DuplicateKeyException 异常，提示主键重复，不保存当前数据。
   * @abstract
   * @param object
   * @return inserted 插入后的对象（含id）
   */
    async insert(object) {}

    /**
     * 更新文档内容
     * @param {Object} query 同find接口查询条件
     * @param {Object} update 更新内容
     * @param {Object} [options] 更新配置
     * @param {Object} [options.multi=false] 批量更新
     * @param {Object} [options.upsert=true] 更新插入
     */
    async update(query, update, options) {}

    /**
     * 更新已存在的文档部分内容
     * 等同于
     * update({ _id: id }, {
     *        $set: object
     * });
     * @abstract
     * @param id 文档标识
     * @param patched 文档要更新的字段集合
     */
    async patch(id, patched) {}

    /**
     * 删除文档, 删除条件可以为对象（删除满足条件的文档）、字符串(删除指定id的文档)、数组(按多个对象或字符串删除)
     * @abstract
     * @example
     * coll.remove(id)
     * coll.remove({query: 'abc'})
     * coll.remove([id1, id2, id3])
     * @param [Array|Object|String] query 查询标识
     */
    async remove(query) {}

    /**
   * 根据id获取一个文档
   * @abstract
   * @param id
   */
    async findOne(id) {}

    /**
   * 判断是否有指定查询条件的文档
   * @param query
   * @return {Boolean}
   */
    async exist(query) {}

    /**
     * 查询满足条件的文档列表
     * @abstract
     * @example
     * await testColl.find({})
     * testColl.find({}, { projection: { name: true } }
     * testColl.find({name: 'Tom'}, { projection: { name: false } }
     * testColl.find({group: 'tm'}, { projection: { name: false }, skip: 0, limit: 20 }
     * @param {Object} query 查询条件
     * @param {Object} sort 指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 1 为升序排列，而 -1 是用于降序排列。
     * @param {Object} projection 可选，使用投影操作符指定返回的键。查询时返回文档中所有键值， 只需省略该参数即可（默认省略）
     * @param {Number} skip 数字参数作为跳过的记录条数。 默认为 0
     * @param {Number} limit 数字参数，该参数指定从读取的记录条数。 默认为 -1 不限制
     * @return {
     *  list: [],
     *  skip: 0,
     *  limit: 10
     * }
     */
    async find(query, {
        sort,
        projection,
        skip,
        limit
    }) {}

    /**
     * 按条件查询文档个数
     * @example
     * const count = await coll.count({}); // 3
     * @param {Object} query 查询条件
     */
    async count(query) {}

    /**
     * 清空数据库
     * @abstract
     * @return {Number} 删除的记录个数
     */
    async clean() {}

    /**
    * 字段distinct
    * @param {String} field 对应字段
    * @param {Object} query 条件，同find方法对应条件
    */
    async distinct(field, query) {}
}

module.exports = Collection;
