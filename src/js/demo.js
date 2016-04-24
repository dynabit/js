/**
 * Created by gordon on 4/23/2016.
 */
var m2f0=function(name){
    return function(obj){
        return obj[name]();
    }
};

var m2f1=function(name){
    return R.curry(function(arg,obj){
        return obj[name](arg);
    });
};

var bind2=function(f,obj){
    return R.curry(function(arg1,arg2){
        return f.call(obj,arg1,arg2);
    });
};
var hide=m2f0('hide');
var show=m2f0('show');
var getPromise=m2f0('promise');

var setText=m2f1('text');
var getText=m2f0('text');
var setHtml=m2f1('html');
var getHtml=m2f0('html');

var render = setText('def');

var load = R.curryN(2,R.flip(bind2($.ajax,$)));
var loadHtml = load({dataType:'HTML'});
var loadHtmlAsPromise = R.pipe(loadHtml,getPromise);

var process=R.pipe(hide,render,show);

var strReduce= R.curry(function(rst,f,str){
    for(var i=0;i<str.length;i++){
        rst = f(rst,str[i],i==str.length-1);
    }
    return rst;
});
//mode in {0:output,1:key}
var render = R.curry(function(data,template) {
    return strReduce({data: data, output: "", last2: ['', ''], key: "", mode: 0}, function (rst, char, isLast) {
        if (rst.mode === 0)
            rst.output += rst.last2[0];
        else
            rst.key += rst.last2[0];
        rst.last2[0] = rst.last2[1];
        rst.last2[1] = char;

        if (rst.mode === 0 && rst.last2[0] == '{' && rst.last2[1] == '{') {
            rst.mode = 1;
        } else if (rst.mode === 1 && rst.last2[0] == '}' && rst.last2[1] == '}') {
            if (rst.key[0] == '{' && rst.key[1] == '{') {
                rst.output += eval('rst.data.'+rst.key.substr(2).trim());
                rst.key = "";
            } else {
                console.log("this should not happen:expression supposed to start with")
            }
            rst.mode = 0;
            rst.last2[0] = '';
            rst.last2[1] = '';
        }
        if (isLast) {
            if (rst.mode !== 0)console.log("this should not happen:expression is not closed with }} for key [" + rst.key + "]");
            rst.output += (rst.last2.join(""));
            rst.last2[0] = '';
            rst.last2[1] = '';
        }
        return rst;
    }, template).output;
});

console.log(render({name:'john',age:30,hello:function(){return 'hello';}},"<div>{{name}} , {{age}}, {{hello()}}</div>"));

var draw=R.pipe(render,setHtml);

var d1={name:'john',age:30};
var t1="<div>{{name}} , {{age}}</div>";
$(function(){
    draw(d1,t1)($('#x'));
});