# wind-core-dao
核心模块：数据访问层及默认lowdb实现
## 基本用法

```shell script
npm install @gw/wind-core-dao
```

```javascript
async (ctx, next) => {
    // 获取数据集合
    const testColl = ctx.getCollection('test');
   
    // 插入数据
    const inserted = await testColl.insert({
        hello: 1,
        name: 'Your name'
    });

    // 根据Id查找
    const one = await testColl.findOne(inserted.id);
    
    // 列表查询
    const found = await testColl.find({
        hello: 1
    });
  
}

```

## 基本概念

数据访问层定义了2个接口，Collection 和  Database， 二者功能和Mongodb概念类似， 体现的是文档型数据库的相关操作，开发使用接口对数据层进行存取，不必关心具体实现。
具体底层存储可能采取mongodb\pg\sqlite\lowdb等。 本模块内置的是lowdb实现，不需要其他任何服务，数据存储在指定配置的文件夹下。

## 接口定义

Collection
```javascript
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
   * 更新已存在的文档
   * @abstract
   * @param id 文档标识
   * @param object 文档对象全文
   */
    async update(id, object) {}

    /**
   * 更新已存在的文档局部
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
   * @return {Promise<void>}
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
     */
    async find(query, {
        sort,
        projection,
        skip,
        limit
    }) {}

    /**
    * 字段distinct
    * @param {String} field 对应字段
    * @param {Object} query 条件，同find方法对应条件
    */
    async distinct (field, query) {}

    /**
   * 清空数据库
   * @return {Promise<void>}
   */
    async clean() {}
}
```

```javascript
class Database {
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
```

## 配置及对象获取


### 默认lowdb配置参数

启动参数

```
{
  lowdb: {
    store: __dirname // 库地址，默认为lowdb目录
  }
}
```

### 获取数据库对象 

```javascript
    app.db  // 获取默认数据库 （保存到db.json）
    app.getDb('name') //获取指定数据库 (保存到name.json)
```

### 获取Coll对象

```javascript
  db.getCollection('coll')
```

### 执行coll操作

```javascript
async function bootComplete(app) {
    const testColl = app.db.getCollection('test');

    // clean
    await testColl.clean();

    // insert
    const inserted = await testColl.insert({
        hello: 1,
        name: 'Your name'
    });

    // full update
    await testColl.update(inserted.id, {
        hello: 2,
        updated: 'this is updated adding'
    });

    // find by id
    const one = await testColl.findOne(inserted.id);

    console.log(one);

    // assign
    await testColl.patch(inserted.id, {
        patch: 'this is patching'
    });

    // insert another
    await testColl.insert({
        hello: 2,
        name: 'Your name'
    });

    // query
    const found = await testColl.find({
        hello: 2
    });

    console.log(found.list.length);

    await testColl.remove(found.list[0].id);
    await testColl.remove(found.list[1].id);
}
```


### 批量删除

```javascript
  // insert
    const inserted1 = await testColl.insert({
            hello: 1,
            name: 'Your name'
        }),

        // insert
        inserted2 = await testColl.insert({
            hello: 2,
            name: 'Your name'
        });

    await testColl.remove([inserted1.id, inserted2.id]);

```

## 注意

1. 默认的lowdb只用于少量数据使用 建议<1000
2. lowdb query 暂时不支持sort  projection功能


