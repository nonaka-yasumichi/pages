/* 週次見える化 */
var CORS_URL="https://cors-anywhere.herokuapp.com/";
var SUMMARY_CSV_URL= "https://github.com/kaz-ogiwara/covid19/raw/master/data/summary.csv";
var TRANS_MAP = {
	"PCR検査陽性者":"陽性",
	"PCR検査実施人数":"PCR",
	"有症状者":"有症",
	"無症状者":"無症",
	"症状有無確認中":"確認",
	"退院した者":"退院",
	"人工呼吸器又は集中治療室に入院している者":"重症",
	"死亡者":"死者",
	"死亡者（都道府県の公表ベース）":"都道府県ベース",
};
var 曜日リスト = ["日","月","火","水","木","金","土"];
var savedCustomList = null;
var selectedKeywordList = ["陽性","PCR"];
var colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, 10]);
var clickEventName = window.ontouchstart===null?"touchstart":"click";

function getCsvStr(url){
	var xhr = new XMLHttpRequest();
	xhr.open("get",CORS_URL+url,true);
	xhr.send(null);
	return xhr.response;
}
function getValue(str){
	if(str==""){
		return 0;
	}
	var iValue = parseInt(str);
	if(isNaN(iValue)){
		return str;
	}
	return iValue;
}
function getObjListFromCsvUrl(csvUrl){
	var csvStr = ""+getCsvStr(csvUrl);
	return getObjListFromCsvStr(csvStr);
}
function getObjListFromCsvStr(csvStr){
	csvStr = csvStr.replace(/\r/g,"");
	var csvLines = csvStr.split("\n");
	
	var ret = [];
	var headers = csvLines[0].split(",");
	for(var i=1;i<csvLines.length;i++){
		var csvLine = csvLines[i];
		if(csvLine==""){
			continue;
		}
		var obj = {};
		var csvCells = csvLine.split(",");
		for(var j=0;j<csvCells.length;j++){
			var key = headers[j];
			var value = getValue(csvCells[j]);
			obj[key] = value;
		}
		ret.push(obj);
	}
	return ret;
}
function getTwoDigit(num){
	if(num<10){
		return "0"+num;
	}
	return ""+num;
}
function customizeObj(prevObj,obj){
	var ret = {};
	/* 月日変換 */
	var dateFormatStr = obj.年 + "-" + getTwoDigit(obj.月) + "-"+getTwoDigit(obj.日)
		+ "T00:00:00+09:00";
	var date = new Date(dateFormatStr);
	ret.dateFormatStr = dateFormatStr;
	ret.date = date;
	ret.dayOfWeek = date.getDay();
	ret.月日 = obj.月 + "/" + obj.日;
	ret.曜日 = 曜日リスト[ret.dayOfWeek];
	/* 累計→当日変換 */
	for(var key in obj){
		if(key.indexOf("数")==-1 && key.indexOf("者")==-1){
			continue;
		}
		var value = obj[key];
		var prevValue = 0;
		if(prevObj!=null){
			prevValue = prevObj[key];
		}
		ret[TRANS_MAP[key]] = value - prevValue;
	}
	ret.URL = obj.URL;
	return ret;
}
function makeDummyObj(format,date){
	var ret = {};
	ret.date = date;
	ret.dayOfWeek = date.getDay();
	ret.曜日 = 曜日リスト[ret.dayOfWeek];
	ret.月日 = (date.getMonth()+1)+"/"+date.getDate();
	return ret;
}
function customizeList(objList){
	var retList = [];
	var prevObj = null;
	var prevRet = null;
	var week = 0;
	for(var i=0;i<objList.length;i++){
		var obj = objList[i];
		var ret = customizeObj(prevObj,obj);
		var termDay = 1;
		if(prevRet!=null){
			termDay = (ret.date - prevRet.date) / 86400000;
		}
		else{
			termDay = ret.dayOfWeek+1;
		}
		while(termDay>1){
			var dummyDate = new Date(ret.date.getTime() - (termDay-1) * 86400000);
			var dummyRet = makeDummyObj(ret,dummyDate);
			dummyRet.week = week;
			retList.push(dummyRet);
			if(dummyRet.dayOfWeek==6){
				week++;
			}
			termDay-=1;
		}
		
		ret.week = week;
		retList.push(ret);
		if(ret.dayOfWeek==6){
			week++;
		}
		prevObj = obj;
		prevRet = ret;
	}
	retList[retList.length-1].selected = true;
	return retList;
}
function dumpList(list){
	if(list==null){
		list = savedCustomList;
	}
	var ret = "";
	for(var i=0;i<list.length;i++){
		var obj = list[i];
		if(!obj.selected){
			continue;
		}
		ret+=JSON.stringify(obj,null,"  ");
	}
	return ret;
}
function makeSeriesList(customList){
	var ret = [];
	var sub = [];
	var prevWeek = 0;
	for(var i=0;i<customList.length;i++){
		var d = customList[i];
		if(d.week!=prevWeek){
			ret.push(sub);
			sub = [];
		}
		sub.push(d);
		prevWeek = d.week;
	}
	ret.push(sub);
	return ret;
}
function getCalenderCellText(d,i){
	var ret = "";
	ret+= d.月日+"("+d.曜日+")";
	for(var i=0;i<selectedKeywordList.length;i++){
		var key = selectedKeywordList[i];
		var value = d[key];
		if(value!=null){
			ret+= "<br>" + key + ":" + d[key];
		}
	}
	return ret;
}
function onClickObj(d,i){
	for(var i=0;i<savedCustomList.length;i++){
		var s = savedCustomList[i];
		s.selected = false;
	}
	d.selected = true;
	refreshView();
}
function makeCalenderTable(customList){
	if(customList==null){
		customList = savedCustomList;
	}
	var seriesList = makeSeriesList(customList);
	var target = d3.select("#calenderTableDiv");
	target.selectAll(".calenderTable").data([]).exit().remove();
	var table = target.selectAll(".calenderTable").data([1]).enter()
		.append("table")
		.attr("class","calenderTable")
	;
	var thead = table.append("thead");
	var tbody = table.append("tbody");
	var headerTr = thead.append("tr").attr("class","headerTr");
	var headerTd = headerTr.selectAll(".headerTd").data(曜日リスト).enter()
		.append("th")
		.text(function(d,i){return d;})
	;
	for(var i=0;i<seriesList.length;i++){
		var series = seriesList[i];
		var dataTr = tbody.append("tr").attr("class","dataTr");
		var dataTd = dataTr.selectAll(".dataTd").data(series)
			.enter()
			.append("td")
			.attr("class","dataTd")
			.style("background",function(d){
				if(d.selected){
					return "navy";
				}
				else{
					return "none";
				}
			})
			.style("border-left",function(d,x){
				var color = "white";
				var width = "1px";
				if(x==0){
					color = colorScale(i);
					width = "6px";
				}
				return color+" solid "+width;
			})
			.on(clickEventName,onClickObj)
			.html(getCalenderCellText)
		;
	}
}

function makeLineList(seriesList){
	var ret = [];
	for(var week=0;week<seriesList.length;week++){
		var series = seriesList[week];
		if(series.length<=1){
			continue;
		}
		for(var i=1;i<series.length;i++){
			var line = {
				src:series[i-1],
				dst:series[i],
				week:week,
			};
			if(line.src.陽性==null || line.dst.陽性==null){
				continue;
			}
			ret.push(line);
		}
	}
	return ret;
}
function makeGraph(customList,id,param){
	if(customList==null){
		customList = savedCustomList;
	}
	var maxValue = d3.max(customList,function(d){return d[param];});
	var minValue = d3.min(customList,function(d){return d[param];});
	var maxWeek = d3.max(customList,function(d){return d.week;});
	colorScale = d3.scaleSequential(d3.interpolateRainbow).domain([0, maxWeek]);

	var seriesList = makeSeriesList(customList);
	var lineList = makeLineList(seriesList);
	var target = d3.select("#"+id);
	target.selectAll(".svg").data([]).exit().remove();
	var svg = target.selectAll(".svg").data([1]).enter()
		.append("svg")
		.attr("class","svg")
		.style("overflow","visible")
		.attr("width","650")
		.attr("height","300")
	;
	var borderG = svg.append("g").attr("id","borderG");
	var lineG = svg.append("g").attr("id","lineG");
	var pointG = svg.append("g").attr("id","pointG");
	var left = 80;
	var right = 590;
	var dayOfWeekScale = d3.scaleLinear()
		.domain([0,6])
		.range([left+30,right-30])
	;
	var valueScale = d3.scaleLinear()
		.domain([minValue,maxValue])
		.range([250,30])
	;
	var borders = [
		[left,0,left,250],
		[left,250,right,250],
		[right,0,right,250],
	];
	if(minValue!=0){
		borders.push([left,valueScale(0),right,valueScale(0)]);
	}
	
	for(var i=0;i<borders.length;i++){
		var b = borders[i];
		borderG.append("line")
			.attr("x1",b[0])
			.attr("y1",b[1])
			.attr("x2",b[2])
			.attr("y2",b[3])
			.attr("stroke","white")
			.attr("stroke-width",1)
		;
	}
	borderG.selectAll(".dayOfWeekText").data(曜日リスト).enter()
		.append("text")
		.attr("x",function(d,i){return dayOfWeekScale(i);})
		.attr("y",function(d,i){return 280;})
		.attr("fill","white")
		.attr("font-size",20)
		.attr("text-anchor","middle")
		.text(function(d){return d;})
	;
	borderG
		.append("text")
		.attr("class",".numLabel")
		.attr("x",left-2)
		.attr("y",30)
		.attr("font-size",20)
		.attr("fill","white")
		.attr("text-anchor","end")
		.text(maxValue)
	;
	borderG
		.append("text")
		.attr("class",".numLabel")
		.attr("x",left-2)
		.attr("y",valueScale(0))
		.attr("font-size",20)
		.attr("fill","white")
		.attr("text-anchor","end")
		.text(0)
	;
	if(minValue!=0){
		borderG
			.append("text")
			.attr("class",".numLabel")
			.attr("x",left-2)
			.attr("y",250)
			.attr("font-size",20)
			.attr("fill","white")
			.attr("text-anchor","end")
			.text(minValue)
		;
	}
	lineG.selectAll(".line").data(lineList).enter()
		.append("line")
		.attr("class","line")
		.attr("x1",function(d){return dayOfWeekScale(d.src.dayOfWeek);})
		.attr("y1",function(d){return valueScale(d.src[param]);})
		.attr("x2",function(d){return dayOfWeekScale(d.dst.dayOfWeek);})
		.attr("y2",function(d){return valueScale(d.dst[param]);})
		.attr("stroke",function(d){return colorScale(d.week);})
		.attr("stroke-width",1)
	;
	var pointCircle = pointG.selectAll(".pointCircle").data(customList).enter()
		.append("circle")
		.attr("class","pointCircle")
		.attr("r",4)
		.attr("cx",function(d){return dayOfWeekScale(d.dayOfWeek);})
		.attr("cy",function(d){return valueScale(d[param]);})
		.attr("fill",function(d){return colorScale(d.week);})
		.on(clickEventName,onClickObj)
		.attr("stroke",function(d){
			if(d.selected){
				return "yellow";
			}
			else{
				return "none";
			}
		})
		.attr("stroke-width",function(d){
			if(d.selected){
				return 4;
			}
			else{
				return 0;
			}
		})
		.style("visibility",function(d){
			if(d[param]==null){
				return "hidden";
			}
			return "visible";
		})
	;
	
	pointCircle.append("title").text(function(d,i){
		var str = "";
		str += d.月日 + "("+d.曜日+")";
		for(var key in TRANS_MAP){
			var t = TRANS_MAP[key];
			str += "\n"+t+":"+d[t];
		}
		return str;
	});
	var selectCircle = pointG.selectAll(".selectCircle").data(customList).enter()
		.append("circle")
		.attr("class","selectCircle")
		.attr("r",20)
		.attr("cx",function(d){return dayOfWeekScale(d.dayOfWeek);})
		.attr("cy",function(d){return valueScale(d[param]);})
		.attr("fill","white")
		.style("opacity",0.001)
		.on(clickEventName,onClickObj)
		;

}
function makeDescription(){
	var target = d3.select("#descSpan");
	var str = "このページでは以下の読み替えをしています。";
	for(var key in TRANS_MAP){
		var value = TRANS_MAP[key];
		str += "<br>"+key+"→"+value;
	}
	target.html(str);
}
function makeUrlDiv(){
	var list = savedCustomList;
	var target = d3.select("#urlDiv");
	var str = "";
	for(var i=0;i<list.length;i++){
		var obj = list[i];
		if(!obj.selected){
			continue;
		}
		str+="<a target='_blank' href='"+obj.URL+"'>"+obj.URL+"</a>";
//		str+=obj.URL;
	}
	target.html(str);
}
function refreshView(){
	d3.select("#dataDiv").html(dumpList());
	makeCalenderTable();
	makeGraph(null,"graphDiv","陽性");
	makeGraph(null,"graphPcrDiv","PCR");
	makeUrlDiv();
}
function onReceiveFunction(csvStr){
	var objList = getObjListFromCsvStr(csvStr);
	customList = customizeList(objList);
	savedCustomList = customList;
	refreshView();
	d3.select("#bodyDiv").style("visibility","visible");
	d3.select("#readingDiv").style("visibility","hidden");
}
function onLoadFunction(){
	makeDescription();
	var xhr = new XMLHttpRequest();
	xhr.open("GET", CORS_URL+SUMMARY_CSV_URL, true);
	xhr.onload = function (e) {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				onReceiveFunction(xhr.responseText);
//				console.log(xhr.responseText);
			} else {
				console.error(xhr.statusText);
				d3.select("#readingDiv").html(xhr.statusText);
			}
		}
	};
	xhr.onerror = function (e) {
		console.error(xhr.statusText);
		d3.select("#readingDiv").html(xhr.statusText);
	};
	xhr.send(null); 

}
