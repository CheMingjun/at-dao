/*!
 * 
 * Author: CheMingjun
 */

'@dao.column(name=id)';
var id;

'@dao.column(name=name,desc)';
var nameAndDesc = function (_name, _desc) {
    return _name + "." + _desc;
}

//-----------------------------------------------------------------------------------
module.exports = function (dao) {
    return {
        queryAll: function*() {
            return yield dao.query('select * from user');
        },
        queryById: function*(_id) {
            var ary = yield dao.query('select * from user where id=' + _id + ' and user_id=1234');
            return ary ? ary[0] : null;
        }
    }
}