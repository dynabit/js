/**
 * Created by john on 16-6-12.
 */

function val(data){
    if(data==undefined)data=null;
    return {_data:data,_cal:{},_dv:[]};
}

function recal(val){
    if(val._cal.f!==undefined){
        if(val._cal.args!==undefined){
            var args = val._cal.args.map(function(arg){
                if(arg._data!==undefined)return arg._data;
                else return arg;
            });
            //console.log('running',val._cal.f,' on ',args);
            set(val,val._cal.f.apply(null,args));
        }
    }
}

function set(val,data){
    val._data=data;
    val._dv.forEach(function(val){
        recal(val);
    });
}

function auto(f){
    return function(){
        var rst = val(null);
        rst._cal.f=f;
        rst._cal.args=Array.prototype.slice.apply(arguments);
        recal(rst);
        rst._cal.args.forEach(function(arg){
            if(arg._dv!==undefined)arg._dv.push(rst);
        });
        return rst;
    }
}

function test() {

    var compute = auto(function (x, y) {
        console.log('computing ' + x + '+' + y);
        return x + y;
    });

    var x = val(1);

    var y = val(1);

    var z = compute(x, y);

    var print = auto(function (data) {
        console.log(data);
    });

    print(z);

    set(x, 2);
    set(y, 2);
    set(x, 4);
}