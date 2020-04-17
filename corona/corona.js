/* 週次見える化 */
var SUMMARY_CSV_URL= "https://cors-anywhere.herokuapp.com/https://cors-ahttps://github.com/kaz-ogiwara/covid19/raw/master/data/summary.csv";

function getCsvStr(url){
	var xhr = new XMLHttpRequest();
	xhr.open("get",url,false);
	xhr.send(null);
	return xhr.response;
}
function onLoadFunction(){
	var csvStr = getCsvStr(SUMMARY_CSV_URL);
	console.log(csvStr);
}
