/*!
 * Author: CheMingjun
 */
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
