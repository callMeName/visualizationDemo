var width  = 600;
var height = 550;

var globalSvg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geo.orthographic()
					.scale(200);
					
var graticule = d3.geo.graticule();

var path = d3.geo.path()
				.projection(projection);

var mapTooltip = d3.select("body")
	.append("div")  // declare the mapTooltip div 
	.attr("class", "mapTooltip")              // apply the 'mapTooltip' class
	.style("opacity", 0);                  // set the opacity to nil

var circleTooltip = d3.select("body")
	.append("div") 
	.attr("class", "circleTooltip")           
	.style("opacity", 0);    

// chart中圆的随机颜色
var colors = d3.scale.category20();              

globalSvg.append("text")
	.attr("id","loading")
	.attr("x",width)
	.attr("y",height/2)
	.text("Now Loading...");




var chartSvg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);



d3.json("src/data.json", function(error, root) {
	if (error) 
		return console.error(error);

	features = root.features;

	var dataset = [];

	for(var i = 0; i < features.length;i ++){
		if(features[i].rate_num != 2) ; //do nothing
		else {
			if(features[i].dropOut_rate && features[i].netEnrolment_rate)
				dataset.push([features[i].properties.NAME, features[i].dropOut_rate, features[i].netEnrolment_rate, features[i].GNI_per])
		}
	}
	console.log(dataset);


	/* The global map */
	var intervalList = [];

	var rotate_x = 0;

	var grid = graticule();
	
	console.log(grid);
	
	var map = globalSvg.append("g")
				 .attr("transform", "translate(" +  -180 + "," + -0 + ")");

	map.append("path")
		.datum( grid )
		.attr("id","grid_id")
		.attr("class","grid_path")
		.attr("d",path);
	
	map.selectAll(".map_path")
			.data( features)
			.enter()
			.append("path")
			.attr("id", function(d,i){
				return "path" + d.properties.NAME;
			})
			.attr("class","map_path")
			.attr("fill",function(d,i){
				return getColor(d.enrolment_population);

				// return color(i);
				// todo
			})
			.attr("d", path )
			.on("mouseover",function(d,i){
				console.log("map: mouseover");	

				d3.select(this)
					.attr("fill","yellow");
				
				// 停止动画
				for(var i = 0;i < intervalList.length;i ++){
					clearInterval(intervalList[i]);
				}
				intervalList.length = 0;

				mapTooltip.transition()
					.duration(200)	
					.style("opacity", .9);	
				// 格式化数据
				if(d.enrolment_population != -1){
					var showNumber = fomatFloat(d.enrolment_population / 1000000, 1) + "million"; 
				}
				else{
					var showNumber = "No data."
				} 
				// tooptip的html内容
				mapTooltip.html("<strong style='color:red'>" + d.properties.NAME + "</strong> </br></br>" + 'Enrolment in primary school. Total:  ' + showNumber)
					.style("left", (d3.event.pageX - 150) + "px")			 
					.style("top", (d3.event.pageY - 50) + "px");

				// 右边的chart也有对应的交互显示
				// 首先判断是否存在对应的圆
				for(var i = 0;i < dataset.length;i ++){
					if(dataset[i][0] != d.properties.NAME){
						continue;	// 不存在对应的圆
					}
					else if(dataset[i][0] === d.properties.NAME){
						d3.select("#circle" + d.properties.NAME)
							.attr("fill","black");
						
						var cx = parseFloat(d3.select("#circle" + d.properties.NAME)
									.attr("cx"));

						var cy = parseFloat(d3.select("#circle" + d.properties.NAME)
									.attr("cy"));

						circleTooltip.transition()
							.duration(200)	
							.style("opacity", .9);	

						// 格式化数据
						var dropOut_rate = (dataset[i][1] == -1)?("No data"):(fomatFloat(dataset[i][1], 1) + " %");
						var netEnrolment_rate = (dataset[i][2] == -1)?("No data"):(fomatFloat(dataset[i][2],1) + " %");
						var GNI_per = (dataset[i][3] == -1)?("No data"):(fomatFloat(dataset[i][3], 1) + " $");

						// tooptip的html内容
						circleTooltip.html("<strong style='color:red'>" + dataset[i][0] + "</strong> </br> </br>"
							+ "In primary school. Total: " 
							+ "</br>" + 'Net enrolment rate: ' + netEnrolment_rate 
							+ "</br>" + "Drop out rate: " + dropOut_rate
							+ "</br>" + "GNI per capita: " + GNI_per)
							.style("left", (cx + 20 + width) + "px")			 
							.style("top", (cy - 50) + "px");

						break;
					}
				}

				


			})
			// tooptip跟随鼠标的移动而变化
			.on("mousemove",function(d,i){
				mapTooltip.style("left", (d3.event.pageX - 300) + "px")			 
					.style("top", (d3.event.pageY - 50) + "px");

			})
			.on("mouseout",function(d,i){
				console.log("map: mouseout");
				mapTooltip.transition()
					.duration(200)	
					.style("opacity", 0);
				d3.select(this)
					.attr("fill", getColor(d.enrolment_population));

				// 重新开始旋转
				intervalList.push(setInterval(function(){ rotateGlobe();}, 33));
				console.log(intervalList);

				// 取消右边chart中的filter
				for(var i = 0;i < dataset.length;i ++){
					if(dataset[i][0] != d.properties.NAME){
						continue;	// 不存在对应的圆
					}
					else if(dataset[i][0] === d.properties.NAME){
						circleTooltip.transition()
							.duration(200)	
							.style("opacity", 0);
						d3.select("#circle" + d.properties.NAME)
							.attr("fill", colors(i));
					}
				}

			});
	
	// 设置动画使地球仪旋转
	function rotateGlobe() { 
			rotate_x += 1.5;
			projection.rotate([rotate_x, -15]).clipAngle(90);
			
			map.select("#grid_id")
				.attr("d",path);
			
			map.selectAll(".map_path")
				.attr("d",path);
	}
	intervalList.push(setInterval(function(){ rotateGlobe();}, 33));

	globalSvg.append("svg:image")
	    .attr("xlink:href","src/scaleImg.png")
		.attr("width", 150)
	    .attr("height", 150);


	globalSvg.append("text")
		.attr("text-anchor", "middle")
		// .attr("align", "center")
		.attr("x",width/2)
		.attr("y",height - 20)
		.style("font-size", "25px")
		.text("Global Enrolment for primary");	


	/* End of the global map */

	/* The chart */

	var paddingX = 40;
	var paddingY = 40;


	//Create scale functions
	var xScale = d3.fisheye.scale(d3.scale.linear)
						 .domain([0, d3.max(dataset, function(d) { return d[1]; })])
						 .range([paddingY, width - paddingY])
	xScale.nice();
						 // .clamp(true)
						 // .nice();
	var yScale = d3.fisheye.scale(d3.scale.linear)
						 .domain([d3.min(dataset, function(d) {  return d[2]; }) - 10, d3.max(dataset, function(d) {  return d[2]; }) + 10])
						 .range([height - paddingX, paddingX])
						 // .clamp(true)
						 // .nice();
	yScale.nice();
	var rScale = d3.scale.linear()
						 .domain([0, d3.max(dataset, function(d) { return d[3]; })])
						 .rangeRound([10, 40])
						 .nice();

	// var formatAsPercentage = d3.format(".1%");//设置刻度的格式
	
	var circle = chartSvg.selectAll("circle")
	   .data(dataset)
	   .enter()
	   .append("circle")
	   .attr("id",function(d,i){
	   		return "circle" + d[0];
	   })
	   .call(position)
	   .attr("fill",function(d,i){
	   		return colors(i);
	   })
	   .on("mouseover",function(d,i){
			console.log("circle: mouseover");	

			d3.select(this)
				.attr("fill","black");
			
			circleTooltip.transition()
				.duration(200)	
				.style("opacity", .9);	
			// 格式化数据
			var dropOut_rate = (d[1] == -1)?("No data"):(fomatFloat(d[1],1) + " %");
			var netEnrolment_rate = (d[2] == -1)?("No data"):(fomatFloat(d[2],1) + " %");
			var GNI_per = (d[3] == -1)?("No data"):(fomatFloat(d[3],1) + " $");

			// tooptip的html内容
			circleTooltip.html("<strong style='color:red'>" + d[0] + "</strong> </br> </br>"
				+ "In primary school. Total: " 
				+ "</br>" + 'Net enrolment rate: ' + netEnrolment_rate 
				+ "</br>" + "Drop out rate: " + dropOut_rate
				+ "</br>" + "GNI per capita: " + GNI_per)
				.style("left", (d3.event.pageX + 20) + "px")			 
				.style("top", (d3.event.pageY - 50) + "px");

			d3.select("#path" + d[0])
				.attr("fill","yellow");

		})
	   // tooptip跟随鼠标的移动而变化
		.on("mousemove",function(d,i){
			circleTooltip.style("left", (d3.event.pageX + 20) + "px")			 
				.style("top", (d3.event.pageY - 50) + "px");

		})
		.on("mouseout",function(d,i){
			console.log("circle: mouseout");
			circleTooltip.transition()
				.duration(200)	
				.style("opacity", 0);
			d3.select(this)
				.attr("fill", colors(i));

			d3.select("#path" + d[0])
					.attr("fill",function(d, i){
						return getColor(d.enrolment_population);
					});
		});


	// Positions the dots based on data.
    function position(circle) {
      circle.attr("cx", function(d) { return xScale(d[1]); })
          .attr("cy", function(d) { return yScale(d[2]); })
          .attr("r", function(d) { return (d[3])?rScale(d[3]):10; });
    }

	//Define X axis
	var xAxis = d3.svg.axis()
					  .scale(xScale)
					  .ticks(10)//最多刻度数，连上原点
					  .orient("bottom")
					 
	//Define Y axis
	var yAxis = d3.svg.axis()
					  .scale(yScale)
					  .orient("left")
					  .ticks(5)
					 
	// Add an x-axis label.
	chartSvg.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "end")
		.attr("x", width - 60)
		.attr("y", height - 10)
		.text("Drop Out rate for primary(%)");

	// Add a y-axis label.
	chartSvg.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("x", -150)
		.attr("y", 6)
		.attr("dy", ".75em")
		.attr("transform", "rotate(-90)")
		.text("Net Enrolment Ratio for primary(%)");

	//Create X axis
	chartSvg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (height - paddingY) + ")")//设置据下边界的距离 
		.call(xAxis);

	//Create Y axis
	chartSvg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + paddingX + ",0)")//设置轴据左边界的距离 
		.call(yAxis);

	chartSvg.on("mousemove", function() {
		var mouse = d3.mouse(this);
		xScale.distortion(2.5).focus(mouse[0]);
		yScale.distortion(2.5).focus(mouse[1]);

		circle.call(position);
		chartSvg.select(".x.axis").call(xAxis);
		chartSvg.select(".y.axis").call(yAxis);
    });

	/* End of the chart */

	// 使欢迎界面变为透明
	globalSvg.select("#loading")
		.attr("opacity",0);

});


