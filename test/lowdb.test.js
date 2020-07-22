const test = require('ava'),
    Producer = require('../src/producer'),
    LowDB = require('../src/lowdb');

test('init db and collection', async t => {
    const producer = new Producer();

    await producer.setDatabaseImpl(LowDB);
    const db = producer.getDb(),
        coll = db.getCollection('test');

    t.true(coll !== null);
});

test('collection crud', async t => {
    const producer = new Producer();

    await producer.setDatabaseImpl(LowDB);
    const db = producer.getDb(),
        testColl = db.getCollection('test');

    testColl.clean();

    // insert
    const inserted = await testColl.insert({
        hello: 1,
        name: 'Your name'
    });

    t.true(inserted.id !== null);

    // find by id
    let one = await testColl.findOne(inserted.id);

    t.true(one !== null);

    t.is(one.hello, 1);

    one = await testColl.findOne({
        hello: 1
    });

    t.true(one !== null);

    t.is(one.hello, 1);

    t.true(await testColl.exist({
        hello: 1
    }));

    t.false(await testColl.exist({
        hello: 2
    }));

    // full update
    await testColl.update(inserted.id, {
        hello: 2,
        updated: 'this is updated adding'
    });

    t.false(await testColl.exist({
        hello: 1
    }));

    t.true(await testColl.exist({
        hello: 2
    }));

    // assign
    await testColl.patch(inserted.id, {
        patch: 'ok'
    });

    let found = await testColl.findOne(inserted.id);

    t.assert(found.patch, 'ok');

    // insert another
    await testColl.insert({
        hello: 2,
        name: 'Your name'
    });

    // query
    found = await testColl.find({
        hello: 2
    });

    // 2 doc with hello = 2
    t.true(found.list.length === 2);

    // remove 2
    await testColl.remove(found.list[0].id);
    await testColl.remove(found.list[1].id);

    const foundAgain = await testColl.find({});

    t.true(foundAgain.total === 0);

    await testColl.insert({
        q: 'a',
        name: 'Your name'
    });
    await testColl.insert({
        q: 'a',
        name: 'Your namewle'
    });

    found = await testColl.find({ q: 'a' });

    t.is(2, found.total);

    await testColl.remove({ q: 'a' });

    found = await testColl.find({ q: 'a' });

    t.is(0, found.total);
});

test('multi delete with id', async t => {
    const producer = new Producer();

    await producer.setDatabaseImpl(LowDB);
    const db = producer.getDb(),
        testColl = db.getCollection('test');

    testColl.clean();
    await testColl.insert({
        id: '21D4332',
        hello: 1,
        name: 'Your name'
    });
    await testColl.insert({
        id: '21D4331',
        hello: 1,
        name: 'Your name'
    });

    t.is(2, (await testColl.find({})).total);

    await testColl.remove(['21D4332', '21D4331']);

    t.is(0, (await testColl.find({})).total);
});

test('multilple delete', async t => {
    const producer = new Producer();

    await producer.setDatabaseImpl(LowDB);
    const db = producer.getDb(),
        testColl = db.getCollection('test');

    testColl.clean();

    // insert
    const inserted1 = await testColl.insert({
            hello: 1,
            name: 'Your name'
        }),

        // insert
        inserted2 = await testColl.insert({
            hello: 2,
            name: 'Your name'
        }),

        // insert
        inserted3 = await testColl.insert({
            hello: 3,
            name: 'Your name'
        }),

        // insert
        inserted4 = await testColl.insert({
            hello: 4,
            name: 'Your name'
        });

    t.is(4, (await testColl.find({})).total);

    await testColl.remove([inserted1.id, inserted2.id]);

    t.is(2, (await testColl.find({})).total);

    await testColl.remove([inserted3.id, inserted4.id]);

    t.is(0, (await testColl.find({})).total);
});

test('find with projection', async t => {
    const producer = new Producer();

    await producer.setDatabaseImpl(LowDB);
    const db = producer.getDb(),
        testColl = db.getCollection('test');

    testColl.clean();

    // insert
    await testColl.insert({
        hello: 1,
        name: 'Tom',
        title: 'Doctor',
        el: 'long long xiw'
    });

    // insert
    await testColl.insert({
        hello: 2,
        name: 'Peter',
        title: 'Master',
        el: 'long long xiw'
    });
    // 只包含name字段
    const found = await testColl.find({}, { projection: { name: true } });

    t.is(2, found.total);

    t.is('Tom', found.list[0].name);
    t.true(found.list[0].title == null);
    t.true(found.list[1].el == null);

    // 排除name字段
    const found2 = await testColl.find({}, { projection: { name: false } });

    t.is(2, found2.total);

    t.true(found2.list[0].name == null);

    t.is('Doctor', found2.list[0].title);
    t.is('long long xiw', found2.list[1].el);
    t.pass();
});
