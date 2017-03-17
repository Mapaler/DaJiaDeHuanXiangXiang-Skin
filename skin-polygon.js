var SVG_NS = "http://www.w3.org/2000/svg";
var w=550,h=500,x=w/2,y=h/2,radius = 170;
var fontSize = 25;
function GetQueryString(name)
{
	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if(r!=null)return  decodeURIComponent(r[2]); return null;
}

var transBox = document.querySelector(".transBox");
/*
//添加SVG边框
var rect = document.createElementNS(SVG_NS,"rect");
rect.setAttribute("class","line");
rect.setAttribute("width","100%");
rect.setAttribute("height","100%");
//document.documentElement.appendChild(rect);
transBox.appendChild(rect);
//添加多边形所在圆圈
var circle = document.createElementNS(SVG_NS,"circle");
circle.setAttribute("class","line");
circle.setAttribute("cx",0);
circle.setAttribute("cy",0);
circle.setAttribute("r",radius);
transBox.appendChild(circle);
*/

try
{
	var attrArr = JSON.parse(GetQueryString("attr"));
	drawPolygon(attrArr);
}catch(e){
	console.log("参数获取出错：",e);
}

function drawPolygon(arr)
{
	var len = arr.length;
	var radStep = 2 * Math.PI / len; //弧度步长
	//画六角边框
	var boxPointArr = new Array(); //储存外边框
	var namePointArr = new Array(); //储存名字的位置
	var attrPointArr = new Array(); //储存属性框
	var valuePointArr = new Array(); //储存属性值的位置
	for (var si=0;si<len;si++) //获取各点值
	{
		var radian = radStep * si - Math.PI/2; //当前弧度
		boxPointArr.push([
			radius * Math.cos(radian) + x,
			radius * Math.sin(radian) + y,
		]);
		var nameRadius = radius + fontSize * 2;//当前名字的半径，一般只有两个字
		namePointArr.push([
			nameRadius *1.1 * Math.cos(radian) + x,
			nameRadius * Math.sin(radian) + y,
		]);
		var attr = arr[si]; //当前属性值
		var attrRadius = radius * (attr.value / attr.max);//当前属性的半径
		attrPointArr.push([
			attrRadius * Math.cos(radian) + x,
			attrRadius * Math.sin(radian) + y,
		]);
		var valueRadius = attrRadius + fontSize;//当前属值的半径
		valuePointArr.push([
			valueRadius * Math.cos(radian) + x,
			valueRadius * Math.sin(radian) + y,
		]);
	}
	//底多边形的points属性用字符串
	var boxPointsStr = boxPointArr.map(function(item){
					return item.join(" ");
				}).join(" ");
	//属性多边形的points属性用字符串
	var attrPointsStr = attrPointArr.map(function(item){
					return item.join(" ");
				}).join(" ");
	//添加底多边形
	var bPolygon = document.createElementNS(SVG_NS,"polygon");
	bPolygon.setAttribute("class","background");
	bPolygon.setAttribute("points",boxPointsStr);
	transBox.appendChild(bPolygon);
	//添加辐线
	var lineGroup = document.createElementNS(SVG_NS,"g");
	lineGroup.setAttribute("class","lineGroup");
	for (var si=0;si<len;si++)
	{
		var ox =x,oy=y,toP=boxPointArr[si];
		var line = document.createElementNS(SVG_NS,"line");
		line.setAttribute("class","line");
		line.setAttribute("x1",ox);
		line.setAttribute("y1",oy);
		line.setAttribute("x2",toP[0]);
		line.setAttribute("y2",toP[1]);
		lineGroup.appendChild(line);
	}
	transBox.appendChild(lineGroup);
	//添加属性多边形
	var aPolygon = document.createElementNS(SVG_NS,"polygon");
	aPolygon.setAttribute("class","attribute");
	aPolygon.setAttribute("points",attrPointsStr);
	transBox.appendChild(aPolygon);

	//添加名称、值
	//添加名称
	var nameGroup = document.createElementNS(SVG_NS,"g");
	nameGroup.setAttribute("class","nameGroup");
	var valueGroup = document.createElementNS(SVG_NS,"g");
	valueGroup.setAttribute("class","valueGroup");
	for (var si=0;si<len;si++)
	{
		var attr = arr[si]; //当前属性值
		var bP=namePointArr[si],aP=valuePointArr[si];
		var ntext = document.createElementNS(SVG_NS,"text");
		ntext.setAttribute("class","text text-name");
		ntext.setAttribute("x",bP[0] - fontSize);
		ntext.setAttribute("y",bP[1] + fontSize/2);
		ntext.textContent = attr.name;
		nameGroup.appendChild(ntext);
		var atext = document.createElementNS(SVG_NS,"text");
		atext.setAttribute("class","text text-value");
		atext.setAttribute("x",aP[0] - fontSize/2);
		atext.setAttribute("y",aP[1] + fontSize/2);
		atext.textContent = attr.value;
		valueGroup.appendChild(atext);
	}
	transBox.appendChild(nameGroup);
	transBox.appendChild(valueGroup);
}