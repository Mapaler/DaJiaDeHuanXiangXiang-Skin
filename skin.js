// JavaScript Document
var binfo; //用于显示进度信息
window.onload = function()
{
	binfo = document.querySelector("#basic-info");
	start();
}
var cardXML,skinXML,questsXML,spellXML,qheadXML = new Array();
var qheadFile = ["head0","head1"]; //储存有哪几个Q版头像名字。
var skinBannerArr = []; //储存生成的banner 的 li数组
var maxConsume = 0;
//访GM_xmlhttpRequest函数v1.3
if(typeof(GM_xmlhttpRequest) == "undefined")
{
	var GM_xmlhttpRequest = function(GM_param){

		var xhr = new XMLHttpRequest();	//创建XMLHttpRequest对象
		xhr.open(GM_param.method, GM_param.url, true);
		if(GM_param.responseType) xhr.responseType = GM_param.responseType;
		if(GM_param.overrideMimeType) xhr.overrideMimeType(GM_param.overrideMimeType);
		xhr.onreadystatechange = function()  //设置回调函数
		{
			if (xhr.readyState === xhr.DONE)
			{
				if (xhr.status === 200 && GM_param.onload)
					GM_param.onload(xhr);
				if (xhr.status !== 200 && GM_param.onerror)
					GM_param.onerror(xhr);
			}
		}

		for (var header in GM_param.headers){
			xhr.setRequestHeader(header, GM_param.headers[header]);
		}

		xhr.send(GM_param.data ? GM_param.data : null);
	}
}

//通用的获取XML数据函数，返回
var getXML = function(url, isJSON)
{
	if (typeof(isJSON) == "undefined") isJSON = true;
	var _this = this;
	_this.url = url;
	_this.isJSON = isJSON;
	_this.json = new Object();
	_this.keyArray = new Array();
	_this.jsonArray = new Array();
	_this.xml = null;
	_this.filename = "";
	_this.getData = function(callback){
		GM_xmlhttpRequest({
			method:'get',
			url:_this.url,
			responseType:'document',
			overrideMimeType:'text/xml',
			onload:function(response){
				_this.xml = response.responseXML;
				var dict = _this.xml.documentElement.firstElementChild;
				var keys = dict.getElementsByTagName("key");
				var strs = dict.getElementsByTagName("string");

				for (var ki=0,kil=keys.length;ki<kil;ki++)
				{
					var keyStr = keys[ki].textContent;
					var strObj = _this.isJSON ? JSON.parse(strs[ki].textContent) : strs[ki].textContent;
					for(var itm in strObj)
					{ //把所有文字里的数字转成真正的数字
						n = (typeof(strObj[itm]) == "string" && strObj[itm].length>0)?Number(strObj[itm]):NaN;
						if (!isNaN(n))
						{
							strObj[itm] = n;
						}
					}
					_this.keyArray.push(keyStr);
					_this.jsonArray.push(strObj);
					_this.json[keyStr] = strObj;
				}
				callback(_this);
			}
		})
	}
	_this.getImgdata = function(callback,filename){
		if (filename != undefined) _this.filename = filename;
		function getDictKeyValue(pnode,name)
		{ /*通过Key获取值*/
			var valueNode;
			for (var ci=0,cil=pnode.childElementCount;ci<cil;ci++)
			{
				var cNode = pnode.children[ci];
				if (cNode.textContent == name)
				{
					valueNode = cNode.nextElementSibling;
				}
			}
			return valueNode;
		}
		GM_xmlhttpRequest({
			method:'get',
			url:_this.url,
			responseType:'document',
			overrideMimeType:'text/xml',
			onload:function(response){
				function tranToArr(istr)
				{
					var nstr = istr.replace(/{/igm,"[").replace(/}/igm,"]");
					return JSON.parse(nstr);
				}
				_this.xml = response.responseXML;
				var dict = _this.xml.documentElement.firstElementChild;
				var rdict = getDictKeyValue(dict,"frames");
				if (typeof(rdict) != "undefined")
				{
					var keys = [].slice.call(rdict.children).filter(function(item){return item.nodeName == "key"});
					var dicts = [].slice.call(rdict.children).filter(function(item){return item.nodeName == "dict"});

					for (var ki=0,kil=keys.length;ki<kil;ki++)
					{
						var keyStr = keys[ki].textContent;
						var vd = dicts[ki]; //储存值的dict
						
						var strObj = {
							frame:tranToArr(getDictKeyValue(vd,"frame").textContent),
							offset:tranToArr(getDictKeyValue(vd,"offset").textContent),
							rotated:eval(getDictKeyValue(vd,"rotated").nodeName),
							sourceColorRect:tranToArr(getDictKeyValue(vd,"sourceColorRect").textContent),
							sourceSize:tranToArr(getDictKeyValue(vd,"sourceSize").textContent),
						};
						_this.keyArray.push(keyStr);
						_this.jsonArray.push(strObj);
						_this.json[keyStr] = strObj;
					}
					callback(_this);
				}
			}
		})
	}
}

function start()
{
	//给排序下拉框添加功能
	var sortType = document.querySelector("#sort-type");
	sortType.onchange = function()
	{
		skinSort(eval(
			"(function(a,b){"+this.value+"})"
			));
	};

	//读取人物列表
	binfo.innerHTML = "正在读取人物列表...";
	cardXML = new getXML("data/card.plist");
	cardXML.getData(
		function(re)
		{
			dealCardList(re); //处理人物
		}
	);
}
function skinSort(cpFn)
{
	if (typeof(cpFn) == "undefined") cpFn = function(){return 0;}
	var ul = document.querySelector("#banner-list");
	var sortArr = skinBannerArr.sort(cpFn);
	sortArr.forEach(function(item){
		ul.appendChild(item);
	});//把数组生成到列表里	
}
//处理人物
function dealCardList(xmlObj)
{
	//读取委托列表
	binfo.innerHTML = "正在读取委托列表...";
	questsXML = new getXML("data/quests.plist");
	questsXML.getData(
		function(re)
		{
			dealQuestsList(re); //处理委托
		}
	);
}
//处理委托
function dealQuestsList(xmlObj)
{
	//读取符卡列表
	binfo.innerHTML = "正在读取符卡列表...";
	spellXML = new getXML("data/spell.plist");
	spellXML.getData(
		function(re)
		{
			dealSpellList(re); //处理符卡
		}
	);
}
//处理符卡
function dealSpellList(xmlObj)
{
	//读取Q版头像列表
	//回掉循环处理
	function getQHead(qheadarr,callback)
	{
		if (qheadarr.length < 1) //如果已经没有后续，就执行后续函数
		{
			callback(qheadXML);
			return;
		}
		
		binfo.innerHTML = "正在读取Q版头像列表" + (qheadXML.length+1) + "...";
		var qheadarrN = qheadarr.concat(); //将现在需要处理的Q版头像图片名称数组存到一个新的数组
		var thisQHead = qheadarrN.shift(); //删除新数组的第一个元素
		var qhXML = new getXML("imgdata/" + thisQHead + ".plist"); //生成一个新的XML
		qheadXML.push(qhXML); //添加到头像XML数组
		qhXML.getImgdata(
			function(re)
			{
				getQHead(qheadarrN,callback)
			}
		,thisQHead);
	}
	getQHead(qheadFile,function(re)
		{
			dealQheadList(re); //处理Q版头像
		}
	)
}
//处理Q版头像
function dealQheadList(xmlObj)
{
	//读取皮肤列表
	binfo.innerHTML = "正在读取皮肤列表...";
	skinXML = new getXML("data/skin.plist");
	skinXML.getData(
		function(re)
		{
			dealSkinJSON(re); //处理皮肤
		}
	);
}
//处理皮肤
function dealSkinJSON(xmlObj)
{
	var skinList = xmlObj.jsonArray;
	
	var skinCount=skinList.length; //皮肤个数
	binfo.innerHTML = "总共有" + skinCount + "个皮肤";
	//console.log("总共有" + skinCount + "个皮肤");
	//console.log(xmlObj);
	
	//获取最大消耗
	maxConsume = skinList.map(function(item){
		return item.use_faith + item.use_food;
	});
	maxConsume = maxConsume.sort(function(a,b){return a<b?1:-1});
	//console.log("最大消耗",maxConsume);
	maxConsume = maxConsume[0];

	/*
	//需要部分截图时用
	for (var si=3;si<12;si++) //生成5个人
	//for (var si=0;si<skinList.length;si++) //生成全部
	{
		var item = skinList[si];
		skinBannerArr.push(creatSkinBanner(item, si));
	}
	*/
	skinList.forEach(function(item, si){
		skinBannerArr.push(creatSkinBanner(item, si));
	}); //将所有生成的li都添加到数组

	var sortType = document.querySelector("#sort-type");
	sortType.onchange();
	//skinSort(); //不进行排序，直接添加

}
//创建人物信息  
function creatSkinBanner(skin, skinIndex)
{
	//化简创建元素
	function creatElmt(tag, className, inner)
	{
		var dom = document.createElement(tag);
		dom.className = className;
		if (typeof(inner) != "undefined")
		{
			if(inner instanceof HTMLElement) //如果传入的是HTML元素
				dom.appendChild(inner);
			else
				dom.innerHTML = inner;
		}
		return dom;
	}
	//创建简介
	function buildDetail(infoJSON)
	{
		var dl = creatElmt("dl","details-dl");
		
		for (var title in infoJSON){ //遍历所有信息
			var detail = infoJSON[title];
			
			//添加标题
			var dt = creatElmt("dt","title",title);
			dl.appendChild(dt);
			
			if (detail instanceof Array){ //如果是数组（文本）
				if (detail.length == 0) detail.push("-");
				detail.forEach(function(item){
					var dd = creatElmt("dd","content",item);
					dl.appendChild(dd);
				})
			}else
			{
				var dd = creatElmt("dd","content",detail);
				dl.appendChild(dd);
			}
		}
		return dl;
	}
	//创建消耗条
	function buildConsume(faith, food)
	{
		var bar = creatElmt("div","progress");
		var faithBar = creatElmt("div","progress-faith",faith);
		faithBar.style.width = (faith / maxConsume * 100) + "%";
		var foodBar = creatElmt("div","progress-food",food);
		foodBar.style.width = (food / maxConsume * 100) + "%";
		bar.appendChild(faithBar);
		bar.appendChild(foodBar);
		return bar;
	}
	//创建消耗条
	function creatCharLink(name)
	{
		var lnk = creatElmt("a","link");
		lnk.innerHTML = name;
		lnk.href = "http://thwiki.cc/" + name;
		lnk.target = "_blank";
		lnk.title = "前往THBWiki看看我来自哪部东方作品";
		return lnk;
	}
	var sid = skin.skinid;	//皮肤ID
	var cid = skin.cardid;	//角色ID
	var card = cardXML.json[cid]; //角色
	var thisQHeadXML = qheadXML.filter(function(item){return item.json['head/' + sid + '.png'] != undefined;})[0]; //寻找有这个皮肤的头像对应的XML
	var qhead = thisQHeadXML?thisQHeadXML.json['head/' + sid + '.png']:undefined; //Q版头像
	
	var attrInfoArr = [
		{name:"生命",value: card.hp , valueAdd: skin.hp , max:500},
		{name:"灵力",value: card.atk_rang , valueAdd: skin.atk_rang , max:100},
		{name:"命中",value: card.hitrate , valueAdd: skin.hitrate , max:100},
		{name:"回避",value: card.avoid , valueAdd: skin.avoid , max:100},
		{name:"防御",value: card.def , valueAdd: skin.def , max:100},
		//{name:"格挡",value: card.block , valueAdd: skin.block , max:100},
		{name:"幸运",value: card.lucky , valueAdd: skin.lucky , max:100},
		{name:"暴击",value: card.crit , valueAdd: skin.crit , max:100},
		{name:"力量",value: card.atk_mel , valueAdd: skin.atk_mel , max:100},
	];
	//8属性合计值
	var tolAttr = attrInfoArr.reduce(function(previous, item){return previous + item.value + item.valueAdd;},0);
	var hp_v =  card.hp + skin.hp;
	var no_hp = tolAttr - hp_v;
	var hp_c_5 = no_hp + hp_v/5;

	var banner = creatElmt("li", "banner");
	banner.index = skinIndex;; //储存对应的皮肤序号
	banner.skin = skin; //储存对应的皮肤对象
	banner.card = card; //储存对应的人物对象
	//创建立绘Box
	var head = creatElmt("div", "head");
	banner.appendChild(head);
	//添加立绘Box内容
	/* //普通的img标签添加起来麻烦
	var headimg = creatElmt("img", "picture"); //头像
	headimg.src = 'char/' + sid + '.png';
	head.appendChild(headimg);
	*/
	var headimg = creatElmt("div", "picture"); //头像
	headimg.style.backgroundImage = 'url("imgdata/char/' + sid + '.png")';
	head.appendChild(headimg);

	var qheadimg = creatElmt("div", "qhead"); //Q版头像
	head.appendChild(qheadimg);
	if (qhead != undefined)
	{
		qheadimg.style.backgroundImage = 'url("imgdata/' + thisQHeadXML.filename + '.png")'; //图片地址
		qheadimg.style.backgroundPosition = "-" + qhead.frame[0][0] + "px -" + qhead.frame[0][1] + "px"; //图片位置偏移定位
		var ro = qhead.rotated; //是否逆时针旋转90°
		qheadimg.style.width = qhead.frame[1][ro?1:0] + "px"; //图像宽
		qheadimg.style.height = qhead.frame[1][ro?0:1] + "px"; //图像高
		if (ro) qheadimg.className="qhead_rotate";
		qheadimg.style.left = (ro?(qhead.frame[1][0]/2+10):10) + "px"; //图像左边距离
		qheadimg.style.bottom = (ro?qhead.frame[1][0]/-2:0) + "px"; //图像低部距离
		//Q版头像弹跳速度根据消耗依次上升
		qheadimg.style.animationDuration = (skin.use_faith+skin.use_food) / 15 + "s";
	}

	var headcover = creatElmt("div", "headcover"); //头像上方的覆盖
	head.appendChild(headcover);
	//var cardname = creatElmt("div", "cardname", card.cardname); //人物名
	var racename = creatElmt("div", "racename", card.racename); //种类名
	var skinname = creatElmt("div", "skinname", skin.skinname); //皮肤名
	var author = creatElmt("div", "author", "作者：" + skin.author); //作者名
	//head.appendChild(cardname);
	head.appendChild(racename);head.appendChild(skinname);head.appendChild(author);
	//创建详情Box
	var detail = creatElmt("div", "detail");
	banner.appendChild(detail);
	//添加详情Box内容
	//筛选任务中有的
	var questsArr = questsXML.jsonArray.filter(function(item) {
						return item.skinid == sid; //返回获得当前皮肤的任务
					});
	
	var cardArr1 = cardXML.jsonArray.filter(function(item) {
						var had =item.banquetSkins1.some(function(banquet){
									return banquet == sid; //返回宴请列表里是否有当前皮肤
								});
						return had; //返回能宴出当前皮肤的人物
					});
	var cardArr2 = cardXML.jsonArray.filter(function(item) {
						var had =item.banquetSkins2.some(function(banquet){
									return banquet == sid; //返回宴请列表里是否有当前皮肤
								});
						return had; //返回能宴出当前皮肤的人物
					});
	var cardArr3 = cardXML.jsonArray.filter(function(item) {
						var had =item.banquetSkins3.some(function(banquet){
									return banquet == sid; //返回宴请列表里是否有当前皮肤
								});
						return had; //返回能宴出当前皮肤的人物
					});
	var infos = {
		"角色名": creatCharLink(card.cardname),
		"皮肤ID": "No." + (skinIndex+1) + " " +skin.skinid,
		"任务获得":questsArr.length>0?questsArr.map(function(item){return "任务ID：" + item.questsid + "，" + item.cyclename + "，" + item.name + "，" + item.true_content }):[], //当有任务时，原来的任务列表生成字符串
		"宴请人-小":cardArr1.length>0?cardArr1.map(function(item){return item.cardname}).join("，"):[],
		"宴请人-中":cardArr2.length>0?cardArr2.map(function(item){return item.cardname}).join("，"):[],
		"宴请人-大":cardArr3.length>0?cardArr3.map(function(item){return item.cardname}).join("，"):[],
		"初次见面":skin.description1,
		"再次见面":skin.description2,
		"早上好":skin.dialog1,
		"中午好":skin.dialog2,
		"下午好":skin.dialog3,
		"晚上好":skin.dialog4,
	};
	var detailDL = buildDetail(infos);
	detail.appendChild(detailDL);
	//detail.innerHTML = card.cardname;


	//8属性合计值
	var tolBP = attrInfoArr.reduce(function(previous, item){return previous + countBasicPoint(item.name=="生命"?(item.value + item.valueAdd)/5:item.value+item.valueAdd);},0);
	banner.skin.basicpoint = tolBP;
	//创建属性八边图
	var attribute = creatElmt("div", "attribute");
	banner.appendChild(attribute);
	//属性值移到了上面去
	var attrSVG = creatPolygonSVG(attrInfoArr);
	attribute.appendChild(attrSVG);
	//创建属性值合计
	var attrCount = creatElmt("div", "attr-count", [
		attrInfoArr.length + "项合计" + tolAttr,
		"血÷5合计" + hp_c_5,
		"等同基础点" + tolBP,
		"<br>去血" + (attrInfoArr.length-1) + "项合计" + no_hp,
		"格挡值 ",
		].join("，")
	);
	//格挡值
	var bV = (card.block + skin.block); //blockValue
	var blockSpan = creatElmt("span", bV>20?"block-high":(bV<20?"block-low":"block-normal"), bV);
	attrCount.appendChild(blockSpan);
	attribute.appendChild(attrCount);

	//创建符卡
	var spell_card = creatElmt("div", "spell_card");
	banner.appendChild(spell_card);

	var spePrefix = cid.replace("ATH","SPE"); //当前人物符卡前缀
	var spellidA = skin.spell_card_id_atk.length>0 ? skin.spell_card_id_atk : spePrefix + "A01"; //攻击
	var spellidB = skin.spell_card_id_def.length>0 ? skin.spell_card_id_def : spePrefix + "B01"; //防御
	var spellidC = skin.spell_card_id_aid.length>0 ? skin.spell_card_id_aid : spePrefix + "C01"; //支援
	var spellidD = spePrefix + "D01"; //魔力

	function crtSpellArr(spl)
	{
		if (typeof(spl) != "undefined")
		{
			return [
				spl.name + " " + spl.spell_point + " lv" + spl.need_level + "",
				"基础释放率 " + spl.spell_rate + "%",
				spl.content,
				];
		}
		return ["-","-","-"];
	}

	//攻击类型
	function getAtkTypeName(type)
	{
		var str = "";
		switch(type)
		{
			case 3001:
				str = "弹幕";
				break;
			case 1001:
				str = "斩击(体术)";
				break;
			case 1002:
				str = "击打(体术)";
				break;
			default:
				str = "未知的";
		}
		return str;
	}
	//攻击范围
	function getAtkRangeName(type)
	{
		var str = "";
		switch(type)
		{
			case 1:
				str = "近";
				break;
			case 2:
				str = "中";
				break;
			case 3:case 4:case 5:
				str = "远";
				break;
			default:
				str = "未知的";
		}
		return str;
	}
	var spells = {
		"出击消耗": buildConsume(skin.use_faith,skin.use_food),
		"攻击类型": getAtkTypeName(skin.atktype) + "，射程 " + getAtkRangeName(skin.range) + "",
		"攻击符卡":crtSpellArr(spellXML.json[spellidA]),
		"防御符卡":crtSpellArr(spellXML.json[spellidB]),
		"支援符卡":crtSpellArr(spellXML.json[spellidC]),
	};
	if (
		typeof(spellXML.json[spellidD]) != "undefined" //必须要有魔力符卡
			&& [ //排除没有魔力符但是其他皮肤有的情况，ES5写法
				spellXML.json[spellidA].spell_point,
				spellXML.json[spellidB].spell_point,
				spellXML.json[spellidC].spell_point,
			].some(function(str){return str.indexOf("魔力")>=0?true:false;})
			/*
			&& ( //排除没有魔力符但是其他皮肤有的情况
			spellXML.json[spellidA].spell_point.indexOf("魔力")>=0 ||
			spellXML.json[spellidB].spell_point.indexOf("魔力")>=0 ||
			spellXML.json[spellidC].spell_point.indexOf("魔力")>=0
			)
			*/
		)
	{
		spells["魔力符卡"] = crtSpellArr(spellXML.json[spellidD]);
	}
	var spellsDL = buildDetail(spells);
	spell_card.appendChild(spellsDL);


	return banner;

}

//创建SVG多边图
function creatPolygonSVG(attrArr)
{
	var SVG_NS = "http://www.w3.org/2000/svg";
	var w=550,h=500,x=w/2,y=h/2,radius = 170;
	var fontSize = 25;

	var dt = document.implementation.createDocumentType('svg:svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd');
	var doc = document.implementation.createDocument(SVG_NS, 'svg:svg', dt);
	var de = doc.documentElement;
	de.setAttribute("xmlns",SVG_NS);
	de.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
	de.setAttribute("version","1.2");
	de.setAttribute("viewBox","0 0 550 550");
	var defs = document.createElementNS(SVG_NS, 'defs');
	de.appendChild(defs);
	var radialGradient = document.createElementNS(SVG_NS, 'radialGradient');
	radialGradient.id = "grey_blue";
	var stop1 = document.createElementNS(SVG_NS, 'stop');
	stop1.setAttribute("offset","50%");
	stop1.setAttribute("class","stop1");
	var stop2 = document.createElementNS(SVG_NS, 'stop');
	stop2.setAttribute("offset","100%");
	stop2.setAttribute("class","stop2");
	radialGradient.appendChild(stop1);
	radialGradient.appendChild(stop2);
	defs.appendChild(radialGradient);
	var transBox = document.createElementNS(SVG_NS, 'g');
	transBox.setAttribute("class","transBox");
	de.appendChild(transBox);
	drawPolygon(attrArr);

	//具体画图的函数
	function drawPolygon(arr)
	{
		var len = arr.length;
		var radStep = 2 * Math.PI / len; //弧度步长
		//画六角边框
		var boxPointArr = new Array(); //储存外边框
		var namePointArr = new Array(); //储存名字的位置
		var attrPointArr = new Array(); //储存初始属性多边形
		var attrAddPointArr = new Array(); //储存属性值-增加值多边形
		var valuePointArr = new Array(); //储存属性值文字的位置
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
			var attr = arr[si]; //当前属性
			var attrRadius = radius * (attr.value / attr.max);//初始属性的半径
			attrPointArr.push([
				attrRadius * Math.cos(radian) + x,
				attrRadius * Math.sin(radian) + y,
			]);
			var attrAddRadius = radius * ((attr.value + attr.valueAdd) / attr.max);//属性值-增加值的半径
			attrAddPointArr.push([
				attrAddRadius * Math.cos(radian) + x,
				attrAddRadius * Math.sin(radian) + y,
			]);
			var valueRadius = attrAddRadius + fontSize;//当前属性值文字的半径
			valuePointArr.push([
				valueRadius * Math.cos(radian) + x,
				valueRadius * Math.sin(radian) + y,
			]);
		}
		//底多边形的points属性用字符串
		var boxPointsStr = boxPointArr.map(function(item){
						return item.join(" ");
					}).join(" ");
		//初始属性多边形的points属性用字符串
		var attrPointsStr = attrPointArr.map(function(item){
						return item.join(" ");
					}).join(" ");
		//属性-增加值多边形的points属性用字符串
		var attrAddPointsStr = attrAddPointArr.map(function(item){
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
		if (arr.filter(function(item){return item.valueAdd != 0}).length > 0) //如果皮肤的属性有改变
		{
			//添加初始属性多边形
			var aPolygon = document.createElementNS(SVG_NS,"polygon");
			aPolygon.setAttribute("class","attribute");
			aPolygon.setAttribute("points",attrPointsStr);
			transBox.appendChild(aPolygon);
		}
		//添加属性-增加值多边形
		var aPolygon = document.createElementNS(SVG_NS,"polygon");
		aPolygon.setAttribute("class","attribute-add");
		aPolygon.setAttribute("points",attrAddPointsStr);
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
			atext.textContent = (attr.value + attr.valueAdd);
			valueGroup.appendChild(atext);
		}
		transBox.appendChild(nameGroup);
		transBox.appendChild(valueGroup);
	}
	return de;
}
//计算属性值需要的点数
function countBasicPoint(value)
{
	var decade = parseInt(value / 10); //10位的最大数
	var remainder = value % 10; //余数
	var bp = (1+decade)*decade/2*10 + (decade+1)*remainder;
	return bp;
}