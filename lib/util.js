/**
 * Created by CheMingjun on 2016/11/16.
 */
module.exports = {
    isGenerator: function (_o) {
        return 'function' == typeof _o.next && 'function' == typeof _o.throw;
    }, isGeneratorFunction: function (_o) {
        var constructor = _o.constructor;
        if (!constructor) return false;
        if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
        return isGenerator(constructor.prototype);
    }, isObject: function (_o) {
        return Object == _o.constructor;
    }
}