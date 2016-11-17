/*!
 * 
 * Author: CheMingjun
 */

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
