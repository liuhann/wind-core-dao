const RestfyDB = require('./rest.js'),
    packageInfo = require('../package.json'),
    Producer = require('./producer'),
    LowDB = require('./lowdb'),
    Collection = require('./collection'),
    DataBase = require('./database');

module.exports = {
    name: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description,
    Collection,
    DataBase,
    Producer,
    // 模块初始化动作，对于核心模块可以进行koa相关插件注册
    // 业务模块可以进行服务创建
    async created(app) {
        app.dataBaseProducer = new Producer();

        // 默认设置Lowdb实现
        app.dataBaseProducer.setDatabaseImpl(LowDB, app.lowdb)
    },

    // 模块路由注册，对外提供API可在此写api相关地址
    async ready(app) {
        await app.dataBaseProducer.ready(app);

        new RestfyDB().initRoutes(app.router);
    },

    // 启动收尾工作，可以在此执行建库、建索引等一些全局的具体业务操作
    async bootComplete(app) { }
};
