// JavaScript Document
window.onload = function()
{
	start();
}
var cardXML,skinXML,questsXML,spellXML;
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
var getXML = function(url, callcack, isJSON)
{
	if (typeof(isJSON) == "undefined") isJSON = true;
	var _this = this;
	_this.url = url;
	_this.isJSON = isJSON;
	_this.callcack = callcack;
	_this.json = new Object();
	_this.keyArray = new Array();
	_this.jsonArray = new Array();
	_this.xml = null;
	_this.get = function(){
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

				var objList = new Object();//以对象形式储存XML中的数据
				for (var ki=0,kil=keys.length;ki<kil;ki++)
				{
					var keyStr = keys[ki].textContent;
					var strObj = _this.isJSON ? JSON.parse(strs[ki].textContent) : strs[ki].textContent;
					_this.keyArray.push(keyStr);
					_this.jsonArray.push(_this.isJSON ? JSON.parse(strs[ki].textContent) : strs[ki].textContent);
					objList[keyStr] = strObj;
				}
				_this.json = objList;
				_this.callcack(_this);
			}
		})
	}
	_this.get();
}

function start()
{
	//读取人物列表
	cardXML = new getXML("data/card.plist",
		function(re)
		{
			dealCardList(re); //处理人物
		}
	);
}
//处理人物
function dealCardList(xmlObj)
{
	//读取委托列表
	questsXML = new getXML("data/quests.plist",
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
	spellXML = new getXML("data/spell.plist",
		function(re)
		{
			dealSpellList(re); //处理符卡
		}
	);
}
//处理符卡
function dealSpellList(xmlObj)
{
	//读取任务列表
	skinXML = new getXML("data/skin.plist",
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
	var ul = document.createElement("ul");
	
	var binfo = document.querySelector("#basic-info");
	var skinCount=skinList.length; //皮肤个数
	binfo.innerHTML = "总共有" + skinCount + "个皮肤";
	//console.log("总共有" + skinCount + "个皮肤");
	//console.log(xmlObj);
	
	//获取最大消耗
	maxConsume = skinList.map(function(item){
		return parseInt(item.use_faith) + parseInt(item.use_food);
	});
	maxConsume = maxConsume.sort(function(a,b){return a<b?1:-1});
	//console.log("最大消耗",maxConsume);
	maxConsume = maxConsume[0];

	/*
	//需要部分截图时用
	for (var si=0;si<5;si++) //生成5个人
	//for (var si=0;si<skinList.length;si++) //生成全部
	{
		var item = skinList[si];
		var li = creatSkinBanner(item, si);
		ul.appendChild(li);
	}
	*/
	skinList.forEach(function(item, index){
		var li = creatSkinBanner(item, index);
		ul.appendChild(li);
	})

	document.body.appendChild(ul);
}
//创建人物信息  
function creatSkinBanner(skin, skinIndex)
{
	//化简创建元素
	function creatElmt(tag, classnName, inner)
	{
		var dom = document.createElement(tag);
		dom.className = classnName;
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
	//创建SVG多边图
	function creatPolygonSVG(valueArr)
	{
		var svg = document.createElement("embed");
		svg.type="image/svg+xml";
		svg.src = "skin-polygon.svg?attr=" + encodeURIComponent(JSON.stringify(valueArr));
		return svg;
	}
	//创建消耗条
	function buildConsume(faith, food)
	{
		var bar = creatElmt("div","progress");
		var faithBar = creatElmt("div","progress-faith",faith);
		faithBar.style.width = parseInt(faith / maxConsume * 100) + "%";
		var foodBar = creatElmt("div","progress-food",food);
		foodBar.style.width = parseInt(food / maxConsume * 100) + "%";
		bar.appendChild(faithBar);
		bar.appendChild(foodBar);
		return bar;
	}
	sid = skin.skinid;	//皮肤ID
	cid = skin.cardid;	//角色ID
	card = cardXML.json[cid]; //角色
	
	var banner = creatElmt("li", "banner");
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
	headimg.style.backgroundImage = 'url("char/' + sid + '.png")';
	head.appendChild(headimg);
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
		"角色名": card.cardname,
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

	//创建属性八边图
	var attribute = creatElmt("div", "attribute");
	banner.appendChild(attribute);
	var attrInfoArr = [
		{name:"生命",value: parseInt(card.hp) + parseInt(skin.hp) , max:500},
		{name:"灵力",value: parseInt(card.atk_rang) + parseInt(skin.atk_rang) , max:100},
		{name:"命中",value: parseInt(card.hitrate) + parseInt(skin.hitrate) , max:100},
		{name:"防御",value: parseInt(card.def) + parseInt(skin.def) , max:100},
		{name:"回避",value: parseInt(card.avoid) + parseInt(skin.avoid) , max:100},
		{name:"格挡",value: parseInt(card.block) + parseInt(skin.block) , max:100},
		{name:"幸运",value: parseInt(card.lucky) + parseInt(skin.lucky) , max:100},
		{name:"暴击",value: parseInt(card.crit) + parseInt(skin.crit) , max:100},
		{name:"力量",value: parseInt(card.atk_mel) + parseInt(skin.atk_mel) , max:100},
	];
	var attrSVG = creatPolygonSVG(attrInfoArr);
	attribute.appendChild(attrSVG);
	//创建属性值合计
	var attrCount = creatElmt("div", "attr-count", [
		"9项合计" + attrInfoArr.reduce(function(previous, item){return previous + item.value;},0) + " ",
		"去血合计" + attrInfoArr.reduce(function(previous, item, index){ if(index >0)return previous + item.value;else return previous;},0) + " ",
		"去格挡合计" + attrInfoArr.reduce(function(previous, item, index){ if(index >0 && index!=5)return previous + item.value;else return previous;},0) + " ",
		].join("，")
	);
	attribute.appendChild(attrCount);

	//创建符卡
	var spell_card = creatElmt("div", "spell_card");
	banner.appendChild(spell_card);

	var spePrefix = cid.replace("ATH","SPE"); //当前人物符卡前缀
	var spellidA = skin.spell_card_id_atk.length>0 ? skin.spell_card_id_atk : spePrefix + "A01"; //攻击
	var spellidB = skin.spell_card_id_def.length>0 ? skin.spell_card_id_def : spePrefix + "B01"; //防御
	var spellidC = skin.spell_card_id_aid.length>0 ? skin.spell_card_id_aid : spePrefix + "C01"; //支援

	function crtSpellArr(spl)
	{
		if (typeof(spl) != "undefined")
		{
			return [
				spl.name + " " + spl.spell_point + " lv" + spl.need_level + "",
				spl.spell_rate + "%几率释放",
				spl.content,
				];
		}
		return ["-","-","-"];
	}

	//攻击类型
	aType =	(function(n){
				switch(n)
				{
				case 3001:
					return "弹幕";
					break;
				case 1001:
					return "剑术(体术)";
					break;
				case 1002:
					return "体术";
					break;
				default:
					return "未知的";
				}
			})(parseInt(skin.atktype));
	//攻击范围
	aRange =(function(n){
				switch(n)
				{
				case 1:
					return "近";
					break;
				case 2:
					return "中";
					break;
				case 3:
					return "远";
					break;
				default:
					return "未知的";
				}
			})(parseInt(skin.range));
	var spells = {
		"出击消耗": buildConsume(parseInt(skin.use_faith),parseInt(skin.use_food)),
		/*[
					skin.use_faith + " 信仰，" + skin.use_food + " 饭团，合计" + (parseInt(skin.use_faith) + parseInt(skin.use_food)) + "",
					buildConsume(parseInt(skin.use_faith),parseInt(skin.use_food)),
					],
		*/
		"攻击类型": aType + "，射程 " + aRange + "",
		"攻击符卡":crtSpellArr(spellXML.json[spellidA]),
		"防御符卡":crtSpellArr(spellXML.json[spellidB]),
		"支援符卡":crtSpellArr(spellXML.json[spellidC]),
	};
	var spellsDL = buildDetail(spells);
	spell_card.appendChild(spellsDL);


	return banner;
}

