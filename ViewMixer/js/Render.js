/**
 * Created by john on 16-6-17.
 */
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
function fill(template,data) {
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
}