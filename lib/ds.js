/*!
 * Toybricks-dao
 * Copyright(c) 2016
 * @version 0.1
 * @author CheMingjun <chemingjun@126.com>
 */
'use strict';
let util = require('util'),
    co = require('co'),
    dsReg = {},
    dbLog = function (_msg, _paramAry, _bt, _conId) {
        logger.debug('[at-dao][' + _conId + '](' + (new Date().getTime() - _bt) + 'ms) ' + _msg + '   [' + (_paramAry ? _paramAry.join(',') : '') + ']');
    },
    toPojo = function (_rows, _mp) {
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
    }, getDao = function (_ds, _mapping) {
        let injectCon = this && this.injectCon ? this.injectCon : null, pe = function (_sql) {
            _sql ? logger.error('Dao error:sql[' + _sql + ']') : null;
            injectCon ? null : this.con.release();
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
                                nd(_cb, _mp ? toPojo(_rtn, _mp) : (!_mapping ? _rtn : toPojo(_rtn, _mapping)));
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
        }, getCon = function (_ds, _cb) {
            if (injectCon) {
                _cb(null, injectCon);
            } else {
                _ds.mysqlPool.getConnection(_cb);
            }
        }, ndao = {
            __meta__: {
                rdao: rdao, proxy: null
            }
        };
        for (let nm in rdao) {
            (function (_nm) {
                ndao[_nm] = function (_sql, _paramAry, _mp) {
                    return function (_cb) {
                        getCon(_ds, function (err, _con) {
                            if (err) {
                                return _cb(err);
                            }
                            rdao[_nm].call({con: _con}, _sql, _paramAry, _mp)(function (_err, _rtn) {
                                injectCon ? null : _con.release();
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
        ndao.use = function () {
            var dAry = [];
            if (arguments.length > 0) {
                var pro = function (_dao) {
                    if (typeof _dao.__meta__ === 'object') {
                        let mt = _dao.__meta__;
                        let ndao = {};
                        let rdao = mt.rdao;
                        for (let nm in rdao) {
                            ndao[nm] = function (_sql, _paramAry, _mp) {
                                return function (_cb) {
                                    rdao[nm].call({con: _con}, _sql, _paramAry, _mp)(function (_err, _rtn) {
                                        _cb ? _cb(_err, _rtn) : null;
                                    });
                                }
                            }
                        }
                        return mt.proxy(ndao);
                    }
                    throw new Error('Wrong dao');
                }
                for (var i = 0; i < arguments.length; i++) {
                    dAry.push(pro(arguments[i]));
                }
            }
            return {
                bat: function (_exeGen) {
                    return function (_cb) {
                        ds.mysqlPool.getConnection(function (_e, _con) {
                            if (_e) {
                                _con.release();
                                return _cb(_e);
                            }
                            var bt = new Date().getTime(), tdId = _con.threadId;
                            _con.beginTransaction(function (_e) {
                                if (_e) {
                                    _con.release();
                                    return _cb(_e);
                                }
                                dbLog('commit start...', null, bt, tdId);
                                co(_exeGen.apply(this, dAry)).then(function (_rtn) {
                                    var bt = new Date().getTime(), tdId = _con.threadId;
                                    _con.commit(function (_e) {
                                        if (_e) {
                                            _con.rollback(function () {
                                                _con.release();
                                                dbLog('rollback', null, bt, tdId);
                                                return _cb(_e);
                                            });
                                        }
                                        dbLog('commit finish', null, bt, tdId);
                                        _con.release();
                                        _cb(null, _rtn);
                                    });
                                }, function (_e) {
                                    var bt = new Date().getTime(), tdId = _con.threadId;
                                    _con.rollback(function () {
                                        //_con.release();
                                        dbLog('rollback', null, bt, tdId);
                                        return _cb(_e);
                                    });
                                    _cb(_e);
                                });
                            });
                        });
                    }
                }
            }
        }
        return ndao;
    }
//--------------------------------------------------------------------------------------------
const DefDSName = 'default';
module.exports = {
    initPool: function (_cfg) {
        let inst = _cfg[DefDSName];
        if (typeof inst === 'undefined') {
            dsReg[DefDSName] = new ds(_cfg);
        }
    }, dao: function (_mapping) {
        return this.proxy(_mapping);
    }, proxy: function (_mapping, _target) {//return thunk
        let ds = dsReg[DefDSName], genDao = function (_ctx) {////TODO
            if (_target) {
                let rdao = getDao.call(_ctx, ds, _mapping);
                _target['__meta__'] = rdao.__meta__;
                return _target;
            } else {
                return getDao.call(_ctx, ds, _mapping)
            }
        }
        var dao = genDao(null);

        dao.bat = function (_exeGen) {
            return function (_cb) {
                ds.mysqlPool.getConnection(function (_e, _con) {
                    if (_e) {
                        _con.release();
                        return _cb(_e);
                    }
                    var bt = new Date().getTime(), tdId = _con.threadId;
                    _con.beginTransaction(function (_e) {
                        if (_e) {
                            _con.release();
                            return _cb(_e);
                        }
                        dbLog('commit start...', null, bt, tdId);
                        co(_exeGen(function (_dao) {
                            if (typeof _dao.__meta__ === 'object') {
                                let mt = _dao.__meta__;
                                let ndao = {};
                                let rdao = mt.rdao;
                                for (let nm in rdao) {
                                    ndao[nm] = function (_sql, _paramAry, _mp) {
                                        return function (_cb) {
                                            rdao[nm].call({con: _con}, _sql, _paramAry, _mp)(function (_err, _rtn) {
                                                _cb ? _cb(_err, _rtn) : null;
                                            });
                                        }
                                    }
                                }
                                return mt.proxy(ndao);
                            }
                            return _cb(new Error('Wrong dao'));
                        })).then(function (_rtn) {
                            var bt = new Date().getTime(), tdId = _con.threadId;
                            _con.commit(function (_e) {
                                if (_e) {
                                    _con.rollback(function () {
                                        _con.release();
                                        dbLog('rollback', null, bt, tdId);
                                        return _cb(_e);
                                    });
                                }
                                dbLog('commit finish', null, bt, tdId);
                                _con.release();
                                _cb(null, _rtn);
                            });
                        }, function (_e) {
                            var bt = new Date().getTime(), tdId = _con.threadId;
                            _con.rollback(function () {
                                //_con.release();
                                dbLog('rollback', null, bt, tdId);
                                return _cb(_e);
                            });
                            _cb(_e);
                        });
                    });
                });
            }
        }
        return dao;
    }
};
'@logger';
var logger = {
    trace: function (_msg) {
        console.log(_msg);
    }, debug: function (_msg) {
        console.log(_msg);
    }, info: function (_msg) {
        console.log(_msg);
    }, warn: function (_msg) {
        console.log(_msg);
    }, error: function (_msg) {
        console.log(_msg);
    }
}