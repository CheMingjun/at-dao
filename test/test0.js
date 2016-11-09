/*!
 * 
 * Author: CheMingjun
 */

'@dao.column(name=id)';
var id;

'@dao.column(name=name,name_ext)';
var nameComplete = function (_name, _extName) {
    return _name + (_extName ? "." + _extName : "");
}

module.exports = {
    queryById: function*(_id) {
        var ary = yield dao.query(sql + 'select * from user where id=' + _id);
        return ary ? ary[0] : null;
    }
}

'@dao';
var dao = function () {
    throw new Error('Not implemented.');
}