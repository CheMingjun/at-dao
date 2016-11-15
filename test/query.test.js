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
var queryAll = function*() {
    var users = yield doUser.queryAll();
    assets(users);
    assets.ok(users.length, 0, null, '>');
}

'@test.step';
var transcation = function*() {
    yield daoBat([doUser], function*(_doUser) {
        var th = this;

        var users = yield _doUser.queryAll();
        assets(users);
        assets.ok(users.length, 10, null, '>');
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