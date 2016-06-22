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

var load = R.curryN(2,R.flip(bind2($.ajax,$)));
var loadHtml = load({dataType:'HTML'});
var loadHtmlAsPromise = R.pipe(loadHtml,getPromise);

/***
 * function for generate getter/setter and intercept the setter on a new object for each property of the old object
 * @param objPair context includes old object,new object and the setter intercept function
 * @param k property name
 * @returns {*} the new object
 */
function combine(objPair,k){
    var o=objPair.o;
    var n=objPair.n;
    var f=objPair.f;
    if(typeof o[k]=='function'){
        n[k]=function(){return o[k].apply(o,arguments);}
    }else{
        Object.defineProperty(n,k,{
            get: function() { return o[k];},
            set: function(v) { var oldV = o[k];o[k]=v;f(n,k,oldV,v);}
        });
    }
    return objPair;
}

/**
 *
 * @param obj original object
 * @param f intercept handler
 * @returns {*} the copy of original object with setter intercepted
 */
function watchable(obj,f){
    return R.reduce(combine,{n:{},o:obj,f:f},Object.keys(obj)).n;
}

/**
 * reduce function on a string by iterate over each character
 * @param rst the result for accumulation
 * @param f the function
 * @param str the string
 * @returns {*} the accumulated result
 */

var strReduce= function(rst,f,str){
    for(var i=0;i<str.length;i++){
        rst = f(rst,str[i],i==str.length-1);
    }
    return rst;
};

/***
 * @param template the html template
 * @param data the javascript object to fill in the template
 * @returns {*} the final html string
 */
var blend = R.curry(function(template,data) {
    var rst = strReduce({data: data, output: "", last2: ['', ''], key: "", mode: 0, keys:[]}, function (rst, char, isLast) {
        if (rst.mode === 0)
            rst.output += rst.last2.shift(0);
        else
            rst.key += rst.last2.shift(0);
        rst.last2.push(char);

        if (rst.mode === 0 && rst.last2[0] == '{' && rst.last2[1] == '{') {
            rst.mode = 1;
        } else if (rst.mode === 1 && rst.last2[0] == '}' && rst.last2[1] == '}') {
            if (rst.key[0] == '{' && rst.key[1] == '{') {
                var k = rst.key.substr(2).trim();
                if(rst.keys.indexOf(k)==-1)rst.keys.push(k);
                var val = undefined;
                try{val = eval('rst.data.'+k);}catch(e){console.log("expression error on data : "+rst.key+";",e);}
                if(val==undefined)
                try{val = eval(k);}catch(e){console.log("expression error on global : "+rst.key+";",e);}
                rst.output += val;
                rst.key = "";
            } else {
                console.log("this should not happen:expression supposed to start with {{")
            }
            rst.mode = 0;
            rst.last2.fill('');
        }
        if (isLast) {
            if (rst.mode !== 0)console.log("this should not happen:expression is not closed with }} for key [" + rst.key + "]");
            rst.output += (rst.last2.join(""));
            rst.last2.fill('');
        }
        return rst;
    }, template);
    return {keys:rst.keys,output:rst.output,data:data,template:template};
});

console.log(
    blend(
        "<div>{{name.length}} , {{age}}, {{hello()}}</div>",
        {name:'john',age:30,hello:function(){return 'hello';}}
    ).output
);

var propertyChangeReceiver={
    listeners:{},
    onchange:function(obj,key,oldV,newV){
        R.forEach(function(f){
            f(obj,key,oldV,newV);
        },propertyChangeReceiver.listeners[obj])
    },
    watchChange:function(obj,f){
        var l=this.listeners[obj];
        if(l==undefined){
            l=[];
            this.listeners[obj]=l;
        }
        l.push(f);
    }
}

var watchData=function(obj){
    return watchable(obj,propertyChangeReceiver.onchange);
}

var d1=watchData({name:'john',age:30,job:'programmer'});
propertyChangeReceiver.watchChange(d1,function(obj,key,oldV,newV){console.log(obj,'['+key+']',oldV,'=>',newV);});

var renderList={};
var pendingList=[];
propertyChangeReceiver.watchChange(d1,function(obj,key,oldV,newV){
    if(oldV==newV)return;
    var watches = renderList[obj];
    if(watches==null)return;
    var firstTime=pendingList.length==0;
    R.forEach(function(k){
        if(k.indexOf(key)==0|| k.indexOf(key+".")==0){
            pendingList=$.unique(pendingList.concat(watches[k]));
        }
    },Object.keys(watches));
    if(firstTime)
        setTimeout(function(){
            R.forEach(function(f){f();},pendingList);
            pendingList.splice(0,pendingList.length);
        },0);
});
var updateRenderList=function(obj,keys,f){
    if(renderList[obj]==undefined)renderList[obj]={};
    var watches = renderList[obj];
    R.forEach(function(key){
        if(watches[key]==undefined)watches[key]=[];
        watches[key].push(f);
    },keys);
}

function draw(template,data,dom){
    console.log('draw ',dom);
    var rst = blend(template,data);
    var dom = setHtml(rst.output,dom);
    return {keys:rst.keys,dom:dom,data:data};
}

$(function(){
    loadHtmlAsPromise('fragment/template1.html')
        .then(function(template){
            var rst = draw(template,d1,$('#x'));
            var redrawX=function(){
                draw(template,d1,$('#x'));
            }
            updateRenderList(rst.data, rst.keys, redrawX);
        });
});