class Database {
    /**
     * 获取数据库所有集合
     */
    async getCollections() {}

    /**
   * 获取集合
   * @param name
   */
    async getCollection(name) {}

    /**
   * 删除数据集合
   * @param name
   */
    async removeCollection(name) {}

    /**
   * 创建数据集合
   */
    async createCollection(name) {}
}
module.exports = Database;
