#at-dao
>基于@Annotation的dao框架(支持事务)

 Base on [at-js](https://github.com/CheMingjun/at-js)

##使用举例
####1. 启动数据库
````js
require('at-test').start({
     "host": "127.0.0.1",
     "user": "root",
     "password": "123456",
     "database": "testDB",
     "port": 3306
 });
````
####2. 编写DO文件(DO_User.js)
````js
//DO_User.js

'@dao.column(name=id)';
var id;

'@dao.column(name=name,remark)';
var nameAndDesc = function (_name, _remark) {
    return _name + "." + _remark;
}

/**
 * For transaction
 */
'@dao.bat';
var bat = function () {

}
//-----------------------------------------------------------------------------------
const TABLE_NAME = 'user';
module.exports = {
    insert: function*(_name, _remark) {
        return yield this.exe(`insert into ${TABLE_NAME}(name,remark) values(?,?)`, [_name, _remark]);
    },
    //在一个事务中 mock100条数据
    mock100: function*() {
        yield bat([this], function*(_my) {
            for (var i = 0; i < 100; i++) {
                yield  _my.insert('tom' + i, 'desc' + i);
            }
        })
    },
    //-----------------------------------------------------------------------------------
    queryAll: function*() {
        var ts = yield this.queryById(1);
        return yield this.exe(`select * from ${TABLE_NAME}`);
    },
    queryById: function*(_id) {
        var ary = yield this.exe(`select * from ${TABLE_NAME} where id=?`, [_id]);
        return ary ? ary[0] : null;
    }, queryByName: function*(_name) {
        var ary = yield this.exe(`select * from ${TABLE_NAME} where id=?`, [_name]);
        return ary ? ary[0] : null;
    },
    //-----------------------------------------------------------------------------------
    delNameLike: function*(_nameLike) {
        return yield this.exe(`delete from ${TABLE_NAME} where name like ?`, [_nameLike]);
    },
    //-----------------------------------------------------------------------------------
    updateByName: function*(_newName, _oriName) {
        return yield this.exe(`update ${TABLE_NAME} set name=? where name like ?`, [_newName, _oriName]);
    }
}
````
####3. 使用DO文件(以单元测试为例)
````js
var doUser = require('./DOUser');
var assets = require('assert');

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

'@dao.bat';
var daoBat = function () {
    throw new Error('');
};
````