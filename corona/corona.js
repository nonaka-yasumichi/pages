/* 週次見える化 */
var CORS_URL="https://cors-anywhere.herokuapp.com/";
var SUMMARY_CSV_URL= "https://github.com/kaz-ogiwara/covid19/raw/master/data/summary.csv";
var TRANS_MAP = {
	"PCR検査陽性者":"陽性",
	"有症状者":"有症",
	"退院した者":"退院",
	"人工呼吸器又は集中治療室に入院している者":"重症",
	"死亡者":"死者",
	"死亡者（都道府県ベース）":"都道府県ベース",
	"PCR検査実施人数":"PCR",
};
var 曜日リスト = ["日","月","火","水","木","金","土"];
var savedCustomList = null;
var selectedKeywordList = ["陽性","PCR"];

function getCsvStr(url){
	var xhr = new XMLHttpRequest();
	xhr.open("get",CORS_URL+url,false);
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
	return retList;
}
function dumpList(list){
	if(customList==null){
		customList = savedCustomList;
	}
	var ret = "";
	for(var i=0;i<list.length;i++){
		var obj = list[i];
		ret+=JSON.stringify(obj)+"<br>";
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
			.html(getCalenderCellText);
	}
}
function onLoadFunction(){
	var objList = getObjListFromCsvUrl(SUMMARY_CSV_URL);
	customList = customizeList(objList);
	savedCustomList = customList;
	makeCalenderTable(customList);
	d3.select("#dataDiv").html(dumpList(customList));
}
