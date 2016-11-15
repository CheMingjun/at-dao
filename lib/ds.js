/*!
 * Toybricks-dao
 * Copyright(c) 2016
 * @version 0.1
 * @author CheMingjun <chemingjun@126.com>
 */
'use strict';
let util = require('util'), co = require('co'), dsReg = {},
    dbLog = function (_msg, _paramAry, _bt, _conId) {
        logger.debug('[at-dao][' + _conId + '](' + (new Date().getTime() - _bt) + 'ms) ' + _msg + (_paramAry ? '  [' + _paramAry.join(',') + ']' : ''));
    }, toPojo = function (_rows, _mp) {
        let rtn = [];
        if (_rows && _rows.length > 0) {
            _rows.forEach(function (row) {
                let pj = {}, tm, tv;
                for (let k in _mp) {
                    tm = _mp[k];
                    pj[k] = tm(row);
                }
                rtn.push(pj);
            })
            return rtn;
        }
        return null;
    }, ds = function (_ds) {
        this.mysqlPool = null;
        let dsCfg = null;
        if (typeof(_ds) === 'function') {
            dsCfg = _ds();
        } else if (typeof(_ds) === 'object') {
            dsCfg = _ds;
        }
        if (typeof dsCfg === 'object') {
            if (!dsCfg.db || typeof(dsCfg.db) === 'string' && dsCfg.db.toUpperCase(dsCfg.db) === 'MYSQL') {
                var mysql = require('mysql');
                try {
                    this.mysqlPool = mysql.createPool({
                        host: dsCfg.host,
                        user: dsCfg.user,
                        password: dsCfg.password,
                        port: dsCfg.port,
                        database: dsCfg.database
                    });
                    logger.info('[at-dao] The database[host:' + dsCfg.host + '] start finished.');
                } catch (err) {
                    throw err;
                }
            }
        } else {
            throw new Error("[at-dao] error configuration for database.")
        }
    }, getCon = function (_name, _cb) {
        let ds = dsReg[_name];
        if (!ds) {
            throw new Error('The datasource[' + _name + '] not found.')
        }
        ds.mysqlPool.getConnection(_cb);
    }, getDao = function (_mapping) {
        let pe = function (_sql) {
            _sql ? logger.error('Dao error:sql[' + _sql + ']') : null;
        }, nd = function (_cb, _rtn) {
            let r = _rtn;
            if (typeof(_cb) == 'function') {
                r = _cb(null, _rtn);//return key value
            }
        }, rdao = {
            query: function (_sql, _paramAry, _mp) {
                return _cb=> {
                    try {
                        var bt = new Date().getTime(), tdId = this.con.threadId;
                        this.con.query(_sql, _paramAry, function (err, _rtn, fields) {
                            dbLog(_sql, _paramAry, bt, tdId);
                            if (err) {
                                pe.call(this, _sql);
                                _cb(err);
                                return;
                            } else {
                                //let tary = _sql.split(/\s/g);
                                //nd(_cb, /,|\(/g.test(tary[1]) || !_mapping ? _rtn : toPojo(_rtn, _mapping));
                                nd(_cb, _mp ? toPojo(_rtn, _mp) : (!_mapping ? _rtn : toPojo(_rtn, _mapping.columns)));
                            }
                        });
                    } catch (_err) {
                        pe.call(this);
                        return _cb(_err);
                    }
                }
            }, add: function (_sql, _paramAry) {
                return _cb=> {
                    try {
                        var bt = new Date().getTime(), tdId = this.con.threadId;
                        this.con.query(_sql, _paramAry, function (err, _rtn, fields) {
                            dbLog(_sql, _paramAry, bt, tdId);
                            if (err) {
                                pe.call(this, err, _sql);
                                return _cb(err);
                            } else {
                                nd(_cb, _rtn.insertId);
                            }
                        });
                    } catch (_err) {
                        pe.call(this, _err);
                        return _cb(_err);
                    }
                }
            }, update: function (_sql, _paramAry) {
                return _cb=> {
                    try {
                        var bt = new Date().getTime(), tdId = this.con.threadId;
                        this.con.query(_sql, _paramAry, function (err, _rtn, fields) {
                            dbLog(_sql, _paramAry, bt, tdId);
                            if (err) {
                                pe.call(this, err, _sql);
                                return _cb(err);
                            } else {
                                nd(_cb, _rtn.affectedRows);
                            }
                        });
                    } catch (_err) {
                        pe.call(this, _err);
                        return _cb(_err);
                    }
                }
            }, del: function (_sql, _paramAry) {
                return _cb=> {
                    try {
                        var bt = new Date().getTime(), tdId = this.con.threadId;
                        this.con.query(_sql, _paramAry, function (err, _rtn, fields) {
                            dbLog(_sql, _paramAry, bt, tdId);
                            if (err) {
                                pe.call(this, err, _sql);
                                return _cb(err);
                            } else {
                                nd(_cb, _rtn.affectedRows);
                            }
                        });
                    } catch (_err) {
                        pe.call(this, _err);
                        return _cb(_err);
                    }
                }
            }
        }, proxy = {
            __: rdao
        };
        //---------------------------------------------------------------------------------
        for (let nm in rdao) {
            (function (_nm) {
                proxy[_nm] = function (_sql, _paramAry, _mp) {
                    return function (_cb) {
                        getCon(_mapping.name, function (err, _con) {
                            if (err) {
                                return _cb(err);
                            }
                            rdao[_nm].call({con: _con}, _sql, _paramAry, _mp)(function (_err, _rtn) {
                                _con.release();
                                if (_err) {
                                    _cb ? _cb(_err) : null;
                                    return;
                                }
                                _cb ? _cb(null, _rtn) : null;
                            });
                        });
                    }
                }
            })(nm);
        }
        return proxy;
    }
//--------------------------------------------------------------------------------------------
const DefDSName = 'default';
module.exports = {
    initPool: function (_cfg) {
        let inst = _cfg[DefDSName];
        if (typeof inst === 'undefined') {
            dsReg[DefDSName] = new ds(_cfg);
        }
    }, shutdown: function*() {
        if (dsReg) {
            for (var name in dsReg) {
                var ds = dsReg[name];
                if (ds.mysqlPool) {
                    logger.warn('The ds[' + name + '] will be shutdown.');
                    yield (function () {
                        return function (_next) {
                            ds.mysqlPool.end(function (err) {
                                if (err) {
                                    _next(err);
                                }
                                logger.warn('The ds[' + name + '] had been shutdown.');
                                _next(null);
                            })
                        }
                    })();
                }
            }
        }
    }, dao: function (_mapping) {
        return getDao(_mapping);
    }, proxy: function (_mapping, _targetFn) {//proxy
        let dao = this.dao(_mapping);
        let rtn = _targetFn(dao);
        rtn['__'] = {
            mapping: _mapping,
            dao: dao['__'],
            target: _targetFn
        };
        return rtn;
    }, bat: function (_daoAry, _gen) {//for transactioin
        let dsName = null, rDaoAry = [];
        if (_daoAry && util.isArray(_daoAry)) {
            _daoAry.forEach(function (_dao) {
                if (typeof _dao.__ === 'object') {
                    rDaoAry.push(_dao.__);
                    if (dsName === null) {
                        dsName = _dao.__.mapping.name;
                    } else if (dsName !== _dao.__.mapping.name) {
                        throw new Error('You must use the same datasource name in a dao.bat .');
                    }
                } else {
                    throw new Error('Unknown dao format.');
                }
            })
            if (dsName === null) {
                throw new Error('No datasource name found.');
            }
        } else {
            throw new Error('Param error:([dao object],function*{}).');
        }
        return function (_cb) {
            getCon(dsName, function (_err, con) {
                if (_err) {
                    return _cb(_err);
                }
                let ctx = this;
                var bt = new Date().getTime(), tdId = con.threadId;
                con.beginTransaction(function (_e) {
                    if (_e) {
                        con.release();
                        return _cb(_e);
                    }
                    dbLog('commit start...', null, bt, tdId);

                    let newDaoAry = [];
                    rDaoAry.forEach(function (_pro) {
                        let ndao = {};
                        let rdao = _pro['dao'];
                        for (let nm in rdao) {
                            ndao[nm] = function (_sql, _paramAry, _mp) {
                                return function (_cb) {
                                    rdao[nm].call({con: con}, _sql, _paramAry, _mp)(function (_err, _rtn) {
                                        _cb ? _cb(_err, _rtn) : null;
                                    });
                                }
                            }
                        }
                        newDaoAry.push(_pro['target'](ndao));
                    })

                    co(_gen.apply(ctx, newDaoAry)).then(function (_rtn) {
                        var bt = new Date().getTime(), tdId = con.threadId;
                        con.commit(function (_e) {
                            if (_e) {
                                con.rollback(function () {
                                    con.release();
                                    dbLog('rollback', null, bt, tdId);
                                    return _cb(_e);
                                });
                            }
                            dbLog('commit finish', null, bt, tdId);
                            con.release();
                            _cb(null, _rtn);
                        });
                    }, function (_e) {
                        var bt = new Date().getTime(), tdId = con.threadId;
                        con.rollback(function () {
                            //_con.release();
                            dbLog('rollback', null, bt, tdId);
                            return _cb(_e);
                        });
                        _cb(_e);
                    });
                });
            })
        }
    }
};

//--------------------------------------------------------------------------------------
var lfn = function (_t, _m) {
    let logColor = {
        'INFO': '\x1b[32m', 'WARN': '\x1b[33m', 'ERROR': '\x1b[31m', 'TRACE': '\x1b[34m'
    }
    if (/^(\n)*$/ig.test(_m)) {
        console.log(_m);
    } else {
        console.log(logColor[_t] + '[' + _t + ']' + _m, '\x1b[0m');
    }
}
'@logger';
var logger = {
    trace: function (_msg) {
        lfn('TRACE', _msg);
    }, debug: function (_msg) {
        lfn('TRACE', _msg);
    }, info: function (_msg) {
        lfn('INFO', _msg);
    }, warn: function (_msg) {
        lfn('WARN', _msg);
    }, error: function (_msg) {
        lfn('ERROR', _msg);
    }
};