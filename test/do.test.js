/*!
 * 
 * Author: CheMingjun
 */
var ds = require('at-dao');

var doUser = require('./DOUser');
var assets = require('assert');

'@test.start';
var start = function*() {
    ds.start({//for database
        "host": "127.0.0.1",
        "user": "root",
        "password": "123456",
        "database": "testDB",
        "port": 3306
    })
}

'@test.step';
var initData = function*() {
    yield doUser.mock100();
}

'@test.step';
var queryAll = function*() {
    var users = yield doUser.queryAll();
    assets(users.length >= 100);
}

'@test.step';
var update = function*() {
    var rows = yield doUser.updateByName('tom----fool','tom%');
    assets(rows >= 100);
}

'@test.step';
var deleteJustBefore = function*() {
    var rows = yield doUser.delNameLike('tom%');
    assets(rows >= 100);
}

'@test.step';
var addAUser = function*() {
    var uid = yield doUser.insert('tom', 'tom cat');
    assets(uid);
}

'@test.step';
var queryById = function*() {
    var user = yield doUser.queryById(2);
    assets(user);
}


'@test.step';
var transcation = function*() {
    yield daoBat([doUser], function*(_doUser) {
        var users = yield _doUser.queryAll();
        assets(users && users.length != 0);
    })
}

'@test.finish';
var finish = function *() {
    yield  ds.shutdown();
}

'@dao.bat';
var daoBat = function () {
    throw new Error('');
};