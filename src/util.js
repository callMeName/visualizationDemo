// 保留若干位小数
function fomatFloat(src,pos){     
             return Math.round(src*Math.pow(10, pos))/Math.pow(10, pos);     
}  

// 根据数据值返回对应的color
var getColor = function(population){
		if(population < 0) return d3.rgb(203,203,203);
		else if(population < 0.1 * 1000000) return d3.rgb(240,242,255);
		else if(population <= 1.1 * 1000000) return d3.rgb(194,214,232);
		else if(population <= 2.1 * 1000000) return d3.rgb(126,171,215);
		else if(population <= 3.1 * 1000000) return d3.rgb(78,127,215);
		else if(population > 3.1 * 1000000) return d3.rgb(44,80,157);
};

