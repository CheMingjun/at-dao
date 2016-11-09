/*!
 * 
 * Author: CheMingjun
 */
'use strict';
/**
 * define a file annotations
 */
const LibName = 'at-dao';
require('at-js').define('dao', {
    scope: 'var', build: function (_ctx, _argAry) {
        return 'return require("'+LibName+'/lib/ds").dao(_dao_mapping_||null)';
    }
}).define('dao.\\S+', {
    scope: 'file', build: function () {
        var columns = [];
        return {
            which: {
                'dao.column': function (_ctx, _argAry) {
                    var paramName = '_pojo', desc = _ctx.desc, script = '';
                    if (desc) {
                        var ts = desc['name'] || desc['names'];
                        ts = ts.split(',');
                        if (ts.length > 0) {
                            ts.forEach(function (_nm) {
                                script += ',' + paramName + '[\"' + _nm + '\"]';
                            })
                            script = script.substring(1);
                        }
                        if (_ctx.refType === 'function') {
                            script = _ctx.refName + ':function(' + paramName + '){return ' + _ctx.refName + '(' + script + ');}';
                        } else if (_ctx.refType === 'undefined') {
                            if (ts.length > 1) {
                                throw new Error('The column[' + _ctx.refName + '] should use only one database column.');
                            }
                            script = _ctx.refName + ':function(' + paramName + '){return ' + script + ';}';
                        } else {
                            throw new Error('The column[' + _ctx.refName + '] define error[should be a undefined or a function].');
                        }
                        columns.push(script);
                    } else {
                        throw new Error('The column[' + _ctx.refName + '] muse define name property in it\'s annotation.');
                    }
                }
            }, script: function () {
                var mapping = '{' + columns.join(',') + '}';
                return {
                    exports: 'var _dao_mapping_ = '+mapping+',_dao_md_ = module.exports;module.exports = require(\''+LibName+'/lib/ds\').proxy(_dao_mapping_,_dao_md_)'
                }
            }
        }
    }
});

module.exports = function (_cfg) {
    require(LibName+'/lib/ds').initPool(_cfg);
};

