/**
 * Created by john on 16-6-22.
 */
var templateCache = {};

var returnUrl = function (url, template) {
    return url;
};
var returnTemplate = function (url, template) {
    return template;
};
var setCache = R.curry(function (cache, returnFunc, url, template) {
    console.log('setting cache for [' + url + '] to ' + template);
    cache[url] = template;
    return returnFunc(url, template);
});

var load = R.curryN(2, R.flip(R.bind($.ajax, $)));
var loadHtml = load({dataType: 'HTML'});
var loadHtmlAsPromise = R.pipe(loadHtml, R.prop('promise'), R.call);
var markInCacheThenLoadHtmlAsPromise = R.pipe(setCache(templateCache, returnUrl, R.__, {'loading': 1}), loadHtmlAsPromise);

var loadCacheAsPromise = R.curry(function (cache, key) {
    console.log('using cache for key : ' + key);
    return $.Deferred().resolve(cache[key]).promise();
});

var loadTemplateCacheAsPromise = loadCacheAsPromise(templateCache);

var alwaysNilPromise = function (url) {
    return {
        then: function (f) {
            console.log('nil promise, just ignore');
        }
    };
};
var _loadTemplate =
    R.ifElse(
        R.has(R.__, templateCache),
        R.ifElse(
            R.pipe(
                R.prop(R.__, templateCache),
                R.propEq('loading', 1)
            ),
            alwaysNilPromise,
            loadTemplateCacheAsPromise
        ),
        markInCacheThenLoadHtmlAsPromise
    );

var loadTemplate = function(url){
    return _loadTemplate(url).then(
        setCache(templateCache, returnTemplate, url)
    );
};