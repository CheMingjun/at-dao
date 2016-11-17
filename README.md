#at-dao
>基于@Annotation的dao/orm框架
>      Base on [at-js](https://github.com/CheMingjun/at-js)

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]


##使用举例
####1. 启动数据库
````js
var ds = require('at-test').start({
     "host": "127.0.0.1",
     "user": "root",
     "password": "123456",
     "database": "testDB",
     "port": 3306
 });
````
#### 关闭
````js
    ds.shutdown(); //generator方法
````
####2. 编写DO文件(DO_User.js)
>DO(Data access Object)

````js
//DO_User.js
/**
 * ORM(对象-关系 映射)
 * 将表中的id字段 映射到 select 结果集中的myId
 */
'@dao.column(name=id)';
var myId;

/**
 * ORM(对象-关系 映射)
 * 将表中的name字段,remark字段 映射到 select 结果集中的nameAndRemark
 * <b>nameAndRemark的结果对应function的运算结果</b>
 */
'@dao.column(name=name,remark)';
var nameAndRemark = function (_name, _remark) {
    return _name + "." + _remark;
}

/**
 * 事务调用声明
 */
'@dao.bat';
var bat = function () {

}
//-----------------------------------------------------------------------------------
const TABLE_NAME = 'user';
module.exports = {
    insert: function*(_name, _remark) {
        //this中被注入了exe方法,可对数据库做实际的各种操作
        //支持两种参数方式:1.直接将参数拼接在sql中;2.通过占位符(?,?)的方式使用  推荐第二种
        return yield this.exe(`insert into ${TABLE_NAME}(name,remark) values(?,?)`, [_name, _remark]);
    },
    mock100: function*() {
        //应用事务
        //bat([应用于一个事务中的DO],generator:入参与[]中相对应)
        //在DO内部,this即当前DO对象
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
####3. 单元测试(by [at-test](https://github.com/chemingjun/at-test))
````js
var ds = require('at-dao');

var doUser = require('./DOUser');
var assets = require('assert');

//启动数据库
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

//mock数据
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

//测试事务
'@test.step';
var transcation = function*() {
    yield daoBat([doUser], function*(_doUser) {
        var users = yield _doUser.queryAll();
        assets(users && users.length != 0);
        yield update();
        throw new Error(2);//模拟抛出异常使其rollback
    })
}

//关闭数据库
'@test.finish';
var finish = function *() {
    yield  ds.shutdown();
}

'@dao.bat';
var daoBat = function () {
    throw new Error('');
};
````
> 任何问题建议, 欢迎提issue，或者直接联系作者即时交流(微信号:ALJZJZ)

 [npm-image]: https://img.shields.io/npm/v/at-dao.svg
 [npm-url]: https://npmjs.org/package/at-dao
 [downloads-image]: https://img.shields.io/npm/dm/at-dao.svg
 [downloads-url]: https://npmjs.org/package/at-dao