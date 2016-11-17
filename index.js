/*!
 * Author: CheMingjun
 */
'use strict';
/**
 * define a file annotations
 */
const LibName = 'at-dao',DefDSName = 'default';
require('at-js').define('dao.\\S+', {
    scope: 'file', build: function () {
        var columns = [];
        return {
            which: {
                'dao.bat': function (_ctx, _argAry) {
                    return "function(){return require('" + LibName + "/lib/ds').bat.apply(null,Array.prototype.slice.call(arguments));}";
                },
                'dao.column': function (_ctx, _argAry) {
                    var paramName = '_pojo', desc = _ctx.desc, script = '',cNames = null;
                    if (desc) {
                        cNames = desc['name'] || desc['names']||_ctx.refName;
                    }
                    cNames = cNames||_ctx.refName;
                    cNames = cNames.split(',');
                    if (cNames.length > 0) {
                        cNames.forEach(function (_nm) {
                            script += ',' + paramName + '[\"' + _nm + '\"]';
                        })
                        script = script.substring(1);
                    }
                    if (_ctx.refType === 'function') {
                        script = _ctx.refName + ':function(' + paramName + '){return ' + _ctx.refName + '(' + script + ');}';
                    } else if (_ctx.refType === 'undefined') {
                        if (cNames.length > 1) {
                            throw new Error('The column[' + _ctx.refName + '] should use only one database column.');
                        }
                        script = _ctx.refName + ':function(' + paramName + '){return ' + script + ';}';
                    } else {
                        throw new Error('The column[' + _ctx.refName + '] define error[should be a undefined or a function].');
                    }
                    columns.push(script);
                }
            }, script: function () {
                if (columns.length > 0) {
                    return 'var a = module.exports,b = {name:"'+DefDSName+'",columns:{' + columns.join(',') + '}};' +
                        'module.exports = require(\'' + LibName + '/lib/ds\').proxy(b,a);'
                }
                return null;
            }
        }
    }
});
var ds = require(LibName + '/lib/ds');
module.exports = {
    start: function (_cfg) {
        ds.initPool(_cfg);
        return this;
    }, shutdown: function(_cb) {
        require('co')(ds.shutdown()).then(function (_rtn) {
            typeof _cb==='function'?_cb(null,_rtn):null;
        }, function (_e) {
            typeof _cb==='function'?_cb(_e):null;
        });
        return this;
    }
};