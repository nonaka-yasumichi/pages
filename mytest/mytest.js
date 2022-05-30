/** 文字コード"UTF-8" */
var ENCODING_UTF8 = 'UTF-8';
/** ブラウザがLinuxで動作していればtrueになるフラグ. */
var isLinux = false;
/* Firefoxでwindow.eventを認識させる。*/
(function() {
  var events = ['mousedown', 'mouseover', 'mouseout', 'mousemove',
    'mousedrag', 'click', 'dblclick'
  ];
  for (var i = 0; i < events.length; i++) {
    window.addEventListener(events[i], function(e) {
      window.event = e;
    }, true);
  }
  /* #706:関連事象対処:クリックイベントはwindow.clickeventにも保持する*/
  var events = ['click'];
  for (var i = 0; i < events.length; i++) {
    window.addEventListener(events[i], function(e) {
      window.clickevent = e;
    }, true);
  }
  /* Linux判定する */
  try {
    var plat = '' + window.navigator.platform;
    if (plat.indexOf('Linux') != -1) {
      isLinux = true;
    }
  } catch (e) {}
}());

/** url指定の内容を保持する領域。 */
var urlQuery = urlQuery || getUrlQuery();

/**
 * URL解析して、クエリ文字列を返す
 * @return {Array} クエリ文字列
 */
function getUrlQuery() {
  var vars = {};
  var max = 0;
  var hash = '';
  var array = '';
  var url = window.location.search;
  //?を取り除くため、1から始める。複数のクエリ文字列に対応するため、&で区切る
  hash = url.slice(1).split('&');
  max = hash.length;
  for (var i = 0; i < max; i++) {
    array = hash[i].split('='); //keyと値に分割。
    //vars.push(array[0]); //末尾にクエリ文字列のkeyを挿入。
    vars[array[0]] = array[1]; //先ほど確保したkeyに、値を代入。
  }
  return vars;
}
/**
 * 出題ページを出力する。
 * @param d URLクエリ情報
 */
function showQuestionPage(d){
	var target = d3.select("#target");
	target.selectAll(".myTarget").data([]).exit().remove();
	var myTarget = target.selectAll(".myTarget").data([urlQuery])
		.enter()
		.append("div")
		.classed("myTarget",true)
	;
	/* ページ自体のタイトル */
	var titleDiv = myTarget.append("div");
	titleDiv.append("span").classed("titleSpan",true).text("出題");
	/* タイトル入力 */
	var titleInputDiv = myTarget.append("div");
	titleInputDiv.append("span").text("タイトル:");
	titleInputDiv.append("input").attr("id","titleInput")
		.attr("value",d["titleValue"]);
	/* 行数入力 */
	var rowCount = d["rowCount"];
	var rowCountDiv = myTarget.append("div");
	rowCountDiv.append("span").text("問題数　:");
	var rowCountSelect = rowCountDiv.append("select").attr("id","rowCountSelect")
		.on("change",onChangeRowCountFunction)
	;
	for(var i=4;i<=20;i++){
		var o = rowCountSelect.selectAll(".option_"+i).data([i])
			.enter()
			.append("option")
			.attr("class","option_"+i)
			;
		if(i==rowCount){
			o.attr("selected","");
		}
		o.text(i);
	}
	/* テーブル */
	var tableDiv = myTarget.append("div");
	var table = tableDiv.append("table");
	var thead = table.append("thead");
	var headerTr = thead.append("tr");
	headerTr.append("th").text("#");
	headerTr.append("th").append("input").attr("id","questionTitleInput")
		.attr("value",d["questionTitle"]);
	headerTr.append("th").append("input").attr("id","answerTitleInput")
		.attr("value",d["answerTitle"]);
	headerTr.append("th").append("input").attr("id","marubatuTitleInput")
		.attr("value",d["marubatuTitle"]);
	headerTr.append("th").append("input").attr("id","rightAnswerTitleInput")
		.attr("value",d["rightAnswerTitle"]);
	var tbody = table.append("tbody");
	for(var i=0;i<rowCount;i++){
		var dataTr = tbody.append("tr");
		dataTr.append("td").text(i+1);
		var dataQ = d["question_"+i];
		if(dataQ==null){
			dataQ = {
				"question":"ここに問題を入力",
				"answer":"ここに答えを入力",
			};
			d["question_"+i] = dataQ;
		}
		var dd = {d:dataQ,i:i};
		dataTr.selectAll(".questionInput_"+i).data([dd])
			.enter()
			.append("td")
			.append("input")
			.attr("id","questionInput_"+i)
			.on("change",onChangeQuestionInputFunction)
			.attr("value",dataQ["question"]);
		dataTr.selectAll(".questionInput_"+i).data([dd])
			.enter()
			.append("td")
			.append("input")
			.attr("id","answerInput_"+i)
			.on("change",onChangeAnswerInputFunction)
			.attr("value",dataQ["answer"]);
	}
	/* ボタン */
	var buttonDiv = myTarget.append("div");
	buttonDiv.append("button").attr("id","questionButton")
		.on("click",onClickQuestionButton)
		.text("問題作成");
	/* URL出力領域 */
	var urlDiv = myTarget.append("div").attr("id","urlDiv");
}
/**
 * 解答ページを出力する。
 * @param d URLクエリ情報
 */
function showAnswerPage(d){
	var target = d3.select("#target");
	target.selectAll(".myTarget").data([]).exit().remove();
	var myTarget = target.selectAll(".myTarget").data([urlQuery])
		.enter()
		.append("div")
		.classed("myTarget",true)
	;
	/* ページ自体のタイトル */
	document.title = d["titleValue"];
	var titleDiv = myTarget.append("div");
	titleDiv.append("span").classed("titleSpan",true).text(d["titleValue"]);
	/* 行数入力 */
	var rowCount = d["rowCount"];
	/* テーブル */
	var tableDiv = myTarget.append("div");
	var table = tableDiv.append("table");
	var thead = table.append("thead");
	var headerTr = thead.append("tr");
	headerTr.append("th").text("#");
	headerTr.append("th").append("span").attr("id","questionTitleInput")
		.text(d["questionTitle"]);
	headerTr.append("th").append("span").attr("id","answerTitleInput")
		.text(d["answerTitle"]);
	headerTr.append("th").append("span").attr("id","marubatuTitleInput")
		.text(d["marubatuTitle"]);
	headerTr.append("th").append("span").attr("id","rightAnswerTitleInput")
		.text(d["rightAnswerTitle"]);
	var tbody = table.append("tbody");
	for(var i=0;i<rowCount;i++){
		var dataTr = tbody.append("tr");
		dataTr.append("td").text(i+1);
		var dataQ = d["question_"+i];
		if(dataQ==null){
			dataQ = {
				"question":"ここに問題を入力",
				"answer":"ここに答えを入力",
			};
			d["question_"+i] = dataQ;
		}
		var dd = {d:dataQ,i:i};
		dataTr.selectAll(".question_"+i).data([dd])
			.enter()
			.append("td")
			.attr("class","question_"+i)
			.append("span")
			.attr("id","question_"+i)
			.text(dataQ["question"])
		;
		dataTr.selectAll(".answerInput_"+i).data([dd])
			.enter()
			.append("td")
			.attr("class","answerInput_"+i)
			.append("input")
			.attr("id","answerInput_"+i)
		;
		dataTr.selectAll(".marubatu_"+i).data([dd])
			.enter()
			.append("td")
			.attr("class","marubatu_"+i)
			.append("span")
			.attr("id","marubatu_"+i)
		;
		dataTr.selectAll(".rightAnswer_"+i).data([dd])
			.enter()
			.append("td")
			.attr("class","rightAnswer_"+i)
			.append("span")
			.attr("id","rightAnswer_"+i)
		;
	}
	/* ボタン */
	var buttonDiv = myTarget.append("div");
	buttonDiv.append("button").attr("id","checkButton")
		.on("click",function(d){
			onClickCheckButton("hideRightAnswer");
		})
		.text("採点");
	buttonDiv.append("button").attr("id","checkButton")
		.on("click",function(d){
			onClickCheckButton("showRightAnswer");
		})
		.text("採点(×の時正解表示)");
	var pointDiv = myTarget.append("div").attr("id","pointDiv");
}
/**
 * 問題数を変更したときに呼ばれる。
 * @param d 行数
 */
function onChangeRowCountFunction(d)
{
	var selected = d3.select("#rowCountSelect").node().value;
	urlQuery["rowCount"] = selected;
	showQuestionPage(urlQuery);
}
/**
 * 問題情報を更新したときに呼ばれる。
 */
function onChangeQuestionInputFunction(d){
	var di = d.i;
	var dd = d.d;
	dd["question"] = document.getElementById("questionInput_"+di).value;
}
/**
 * 答え情報を更新したときに呼ばれる。
 */
function onChangeAnswerInputFunction(d){
	var di = d.i;
	var dd = d.d;
	dd["answer"] = document.getElementById("answerInput_"+di).value;
}
/**
 * Checkボタンを押したときに呼ばれる。
 * @param flag "showRightAnswer","hideRightAnswer"のいずれか。
 */
function onClickCheckButton(flag){
	var rowCount = urlQuery["rowCount"];
	var maruCount = 0;
	for(var i=0;i<rowCount;i++){
		var dataQ = urlQuery["question_"+i];
		var answer = d3.select("#answerInput_"+i).node().value;
		d3.select("#rightAnswer_"+i).text("");
		if(dataQ.answer==answer){
			d3.select("#marubatu_"+i).text("○");
			maruCount = maruCount + 1;
		}
		else if(answer==""){
			d3.select("#marubatu_"+i).text("");
		}
		else{
			d3.select("#marubatu_"+i).text("×");
			if(flag=="showRightAnswer"){
				d3.select("#rightAnswer_"+i).text(dataQ.answer);
			}
		}
	}
	var congratulations = "";
	if(rowCount==maruCount){
		congratulations = " Congratulations!!";
	}
	d3.select("#pointDiv").text("点数: "+maruCount+"/"+rowCount+congratulations);
}

function makeUrl(urlQuery,pageType){
	var q = JSON.parse(JSON.stringify(urlQuery));
	q["pageType"] = pageType;
	q["titleValue"] = d3.select("#titleInput").node().value;
	var inputTitles = ["questionTitle","answerTitle","marubatuTitle","rightAnswerTitle"];
	for(var i=0;i<inputTitles.length;i++){
		var input = inputTitles[i];
		q[input] = d3.select("#"+input+"Input").node().value;
	}
	var url = window.location.href;
	var firstQuestionIndex = url.indexOf("?");
	if(firstQuestionIndex!=-1){
		url = url.substring(0,firstQuestionIndex);
	}
	var ret=url+"?urlQuery="+encodeURI(JSON.stringify(q));
	return ret;
}
/**
 * 問題作成ボタンを押したときに呼ばれる。
 */
function onClickQuestionButton(){
	//console.log(JSON.stringify(urlQuery,null,"  "));
	
	var urlDiv = d3.select("#urlDiv");
	var urlList = [
		{"name":"問題","url":makeUrl(urlQuery,"question")},
		{"name":"解答","url":makeUrl(urlQuery,"answer")},
	];
	var subUrlDiv = urlDiv.selectAll(".subUrlDiv").data(urlList)
		.enter()
		.append("div")
		.attr("class","subUrlDiv")
	;
	subUrlDiv
		.append("a")
		.attr("class","urlRef")
		.attr("href",function(d){return d.url;})
		.text(function(d){return d.name;})
	;
}

/**
 * 辞書にkeyがなければvalueを設定する。
 * @param ret 辞書
 * @param key キー
 * @param value 値
 */
function setDefaultParameter(ret,key,value){
	var v = ret[key];
	if(v==null){
		ret[key] = value;
	}
}
/**
 * URLクエリに設定されていないパラメータがあれば追加する。
 * @param urlQuery URLクエリ情報
 * @return パラメータ追加したURLクエリ
 */
function setDefaultParametersToUrlQuery(urlQuery){
	var ret = urlQuery;
//	setDefaultParameter(ret,"titleValue","");
	setDefaultParameter(ret,"pageType","question");
	setDefaultParameter(ret,"titleValue","タイトル");
	setDefaultParameter(ret,"rowCount",8);
	setDefaultParameter(ret,"questionTitle","問題");
	setDefaultParameter(ret,"answerTitle","答え");
	setDefaultParameter(ret,"marubatuTitle","○/×");
	setDefaultParameter(ret,"rightAnswerTitle","正解");
	
	
	return ret;
}
/**
 * body.onload時に呼ばれる。
 */
function onLoadFunction(){
	if(urlQuery==null){
		urlQuery = {};
	}
	if(urlQuery["urlQuery"]!=null){
		urlQueryStr = urlQuery["urlQuery"];
		newUrlQuery = null;
		try{
			urlQueryStr = decodeURI(urlQueryStr);
			newUrlQuery = JSON.parse(urlQueryStr);
			if(newUrlQuery["urlQuery"]!=null){
				delete newUrlQuery["urlQuery"];
			}
		}
		catch(e){
			console.log("e:"+e);
		}
		if(newUrlQuery!=null){
			urlQuery = newUrlQuery;
		}
	}
	urlQuery = setDefaultParametersToUrlQuery(urlQuery);
	var pagetype = urlQuery["pageType"];
	if(pagetype=="question"){
		showQuestionPage(urlQuery);
	}
	else if(pagetype=="answer"){
		showAnswerPage(urlQuery);
	}
	else{
		window.alert("Unknown PageType:"+pagetype);
	}
}
