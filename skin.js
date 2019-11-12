//判断是否支持webp格式图片 支持 返回true   不支持 返回false
function check_support_webp() {
    //通过UserAgent获取火狐浏览器的版本
    var fxVer = /Firefox\/(\d+)(?:\.\d+)+/.exec(navigator.userAgent);
    if (fxVer && fxVer[1]>=65)
        return true;
    else
        return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0;
}
//访GM_xmlhttpRequest函数v1.3
function GM_xmlhttpRequest(GM_param) {
    var xhr = new XMLHttpRequest(); //创建XMLHttpRequest对象
    xhr.open(GM_param.method, GM_param.url, true);
    if (GM_param.responseType) xhr.responseType = GM_param.responseType;
    if (GM_param.overrideMimeType) xhr.overrideMimeType(GM_param.overrideMimeType);
    xhr.onreadystatechange = function() //设置回调函数
        {
            if (xhr.readyState === xhr.DONE) {
                if (xhr.status === 200 && GM_param.onload)
                {
                    GM_param.onload(xhr);
                }
                if (xhr.status !== 200 && GM_param.onerror)
                {
                    GM_param.onerror(xhr);
                }
                xhr.abort();
                return;
            }
        }
    for (var header in GM_param.headers) {
        xhr.setRequestHeader(header, GM_param.headers[header]);
    }
    xhr.send(GM_param.data ? GM_param.data : null);
}
//皮肤的排序函数
function skinSort(cpFn) {
    if (typeof(cpFn) == "undefined") cpFn = function() { return 0; }
    let ul = document.querySelector("#banner-list");
    let sortArr = skinBannerArr.sort(cpFn);
    sortArr.forEach(function(item) {
        ul.appendChild(item);
    }); //把数组生成到列表里	
}
//储存游戏数据文件的类
class GameResInfo{
    constructor(name,filename){
        this.filename = filename;
        this.name = name;
        this.url = 'GameResInfo/' + filename + '.json';
    }
    getData(cb_load,cb_error){
        let _this=this;
        console.log('正在获取 ' + _this.name);
        GM_xmlhttpRequest({
            method: 'get',
            url:_this.url,
            onload: function(response) {
                _this.data = JSON.parse(response.response);
                _this.data.forEach((obj)=>{strToInt(obj);}) //将字符数字都转换为数字
                console.log(_this.name + ' 获取成功',_this.data);
                cb_load(response);
            },
            onerror: function(response) {
                var isChrome = navigator.userAgent.indexOf("Chrome") >=0;
                if (isChrome && location.host.length == 0)
                {
                    _this.data = JSON.parse(response.response);
                    _this.data.forEach((obj)=>{strToInt(obj);}) //将字符数字都转换为数字
                    console.info("因为是Chrome本地打开，" +_this.name+"尝试读取结果为",_this.data);
                    cb_load(response);
                }else
                {
                    console.error(_this.name + "数据获取错误",response);
                    _this.data = null;
                    cb_error();
                }
            }
        })
    }
}

var binfo; //用于显示进度信息的DOM
const supportWebP = check_support_webp();
//游戏数据
const cardRes = new GameResInfo('人物列表','Card'),
    skinRes = new GameResInfo('皮肤列表','Skin'),
    questsRes = new GameResInfo('委托列表','Quests'),
    spellRes = new GameResInfo('符卡列表','Spell');
const skinBannerArr = []; //储存生成的banner 的 li数组
var maxConsume = 0; //所有卡片中的最大消耗

//网页启动时的初始化
window.onload = function() {
    binfo = document.querySelector("#basic-info");
    console.log("您的浏览器" + (supportWebP?"支持":"不支持") + "WebP格式。");
    if (supportWebP)
    {
        document.querySelector("#Pic-Format").innerHTML = "有损WebP";
        document.querySelector("#MB").innerHTML = "13.25";
    }

    //给排序下拉框添加功能
    let sortType = document.querySelector("#sort-type");
    sortType.onchange = function() {
        skinSort(eval(
            "(function(a,b){" + this.value + "})"
        ));
    };

    start();
}
function strToInt(obj)
{
    for (var a in obj)
    {
        let value = obj[a];
        if (typeof(value) == "string" && /^-?[\d\.]+$/.test(value))
        {
            obj[a] = Number(value);
        }
    }
}
function start() {
    //读取人物列表
    binfo.innerHTML = "1.正在读取人物列表...";
    cardRes.getData((r)=>{
        binfo.innerHTML = "2.正在读取皮肤列表...";
        skinRes.getData((r)=>{
            binfo.innerHTML = "3.正在读取委托列表...";
            questsRes.getData((r)=>{
                binfo.innerHTML = "4.正在读取符卡列表...";
                spellRes.getData((r)=>{
                    buildList(); //开始构建网页
                })
            })
        })
    })
}

//处理皮肤
function buildList() {
    //需要部分截图时用
    //skinRes.data = skinRes.data.slice(0,5);

    binfo.innerHTML = "总共有" + skinRes.data.length + "个皮肤";

    //获取最大消耗
    let consumeArr = skinRes.data.map((i)=>{return parseInt(i.use_faith) + parseInt(i.use_food);}); //得到信仰加食物的值
    consumeArr.sort((a,b)=>{return b-a}); //从大到小排序
    maxConsume = consumeArr[0]; //取1

    skinRes.data.forEach((s, si)=>{
        skinBannerArr.push(creatSkinBanner(s, si));
    }); //将所有生成的li都添加到数组

    //排一次序
    let sortType = document.querySelector("#sort-type");
    sortType.onchange();
}
//创建人物信息  
function creatSkinBanner(skin, skinIndex) {
    //化简创建元素
    function creatElmt(tag, className, inner) {
        let dom = document.createElement(tag);
        dom.className = className;
        if (typeof(inner) != "undefined") {
            if (inner instanceof HTMLElement) //如果传入的是HTML元素
                dom.appendChild(inner);
            else
                dom.innerHTML = inner;
        }
        return dom;
    }
    //创建简介
    function buildDetail(infoJSON) {
        let dl = creatElmt("dl", "details-dl");

        for (let title in infoJSON) { //遍历所有信息
            let detail = infoJSON[title];

            //添加标题
            let dt = dl.appendChild(creatElmt("dt", "title", title));
            if (detail.titleClassName != undefined) {
                dt.className += " " + detail.titleClassName;
            }

            if (detail instanceof Array) { //如果是数组（文本）
                if (detail.length == 0) detail.push("-");
                detail.forEach(function(item) {
                    let dd = creatElmt("dd", "content", item);
                    dl.appendChild(dd);
                })
            } else {
                let dd = creatElmt("dd", "content", detail);
                dl.appendChild(dd);
            }
        }
        return dl;
    }
    //创建消耗条
    function buildConsume(faith, food) {
        let bar = creatElmt("div", "progress");
        let faithBar = creatElmt("div", "progress-faith", faith);
        faithBar.style.width = (faith / maxConsume * 100) + "%";
        let foodBar = creatElmt("div", "progress-food", food);
        foodBar.style.width = (food / maxConsume * 100) + "%";
        bar.appendChild(faithBar);
        bar.appendChild(foodBar);
        return bar;
    }
    //创建消耗条
    function creatCharLink(name) {
        let lnk = creatElmt("a", "link");
        lnk.innerHTML = name;
        lnk.href = "http://thwiki.cc/" + name;
        lnk.target = "_blank";
        lnk.title = "前往THBWiki看看我来自哪部东方作品";
        return lnk;
    }
    let sid = skin.skinid; //皮肤ID
    let cid = skin.cardid; //角色ID
    let card = cardRes.data.filter((c)=>{return c.cardid == cid})[0]; //角色

    let attrInfoArr = [
        { name: "生命", value: card.hp, valueAdd: skin.hp, max: 500 },
        { name: "灵力", value: card.atk_rang, valueAdd: skin.atk_rang, max: 100 },
        { name: "命中", value: card.hitrate, valueAdd: skin.hitrate, max: 100 },
        { name: "回避", value: card.avoid, valueAdd: skin.avoid, max: 100 },
        { name: "防御", value: card.def, valueAdd: skin.def, max: 100 },
        //{name:"格挡",value: card.block , valueAdd: skin.block , max:100},
        { name: "幸运", value: card.lucky, valueAdd: skin.lucky, max: 100 },
        { name: "暴击", value: card.crit, valueAdd: skin.crit, max: 100 },
        { name: "力量", value: card.atk_mel, valueAdd: skin.atk_mel, max: 100 },
    ];
    attrInfoArr.forEach((o)=>{
        o.value = parseInt(o.value);
        o.valueAdd = parseInt(o.valueAdd);
    });
    //8属性合计值
    let tolAttr = attrInfoArr.reduce(function(previous, item) { return previous + item.value + item.valueAdd; }, 0);
    let hp_v = card.hp + skin.hp;
    let no_hp = tolAttr - hp_v;
    let hp_c_5 = no_hp + hp_v / 5;

    let banner = creatElmt("li", "banner");
    banner.index = skinIndex;; //储存对应的皮肤序号
    banner.skin = skin; //储存对应的皮肤对象
    banner.card = card; //储存对应的人物对象
    //创建立绘Box
    let head = banner.appendChild(creatElmt("div", "head"));
    head.onclick = function() { //点击时查看宽的头像
        this.classList.toggle("widehead");
    }
    head.title = "点击宽屏查看图片";

    //添加立绘Box内容
    let headimg = creatElmt("div", "picture"); //头像
    headimg.style.backgroundImage = 'url("Resources/char/charimg/' + sid + (supportWebP?".webp":".png") + '")';
    head.appendChild(headimg);

    let qheadimg = creatElmt("div", "qhead"); //Q版头像
    head.appendChild(qheadimg);
    qheadimg.style.backgroundImage = 'url("Resources/char/charcute/' + sid + (supportWebP?".webp":".png") + '")'; //图片地址
    //qheadimg.style.backgroundPosition = "-" + qhead.frame[0][0] + "px -" + qhead.frame[0][1] + "px"; //图片位置偏移定位
    //var ro = qhead.rotated; //是否逆时针旋转90°
    //qheadimg.style.width = qhead.frame[1][ro ? 1 : 0] + "px"; //图像宽
    //qheadimg.style.height = qhead.frame[1][ro ? 0 : 1] + "px"; //图像高
    //if (ro) qheadimg.className = "qhead_rotate";
    //qheadimg.style.left = (ro ? (qhead.frame[1][0] / 2 + 10) : 10) + "px"; //图像左边距离
    //qheadimg.style.bottom = (ro ? qhead.frame[1][0] / -2 : 0) + "px"; //图像低部距离
    //Q版头像弹跳速度根据消耗依次上升
    qheadimg.style.animationDuration = (skin.use_faith + skin.use_food) / 15 + "s";

    let headcover = creatElmt("div", "headcover"); //头像上方的覆盖
    head.appendChild(headcover);
    //var cardname = creatElmt("div", "cardname", card.cardname); //人物名
    let racename = creatElmt("div", "racename", card.racename); //种类名
    let skinname = creatElmt("div", "skinname", skin.skinname); //皮肤名
    let author = creatElmt("div", "author", "作者：" + skin.author); //作者名
    //head.appendChild(cardname);
    head.appendChild(racename);
    head.appendChild(skinname);
    head.appendChild(author);
    //创建详情Box
    let detail = creatElmt("div", "detail");
    banner.appendChild(detail);
    //添加详情Box内容
    //筛选任务中有的
    let questsArr = questsRes.data.filter(function(item) {
        return item.skinid == sid; //返回获得当前皮肤的任务
    });


    let infos = {
        "角色名": creatCharLink(card.cardname),
        "皮肤ID": "No." + (skinIndex + 1) + " " + skin.skinid,
        "任务获得": questsArr.length > 0 ? questsArr.map(function(item) { return "任务ID：" + item.questsid + "，" + item.cyclename + "，" + item.name + "，" + item.true_content }) : [], //当有任务时，原来的任务列表生成字符串
        "初次见面": skin.description1 || "-",
        "再次见面": skin.description2 || "-",
        "早上好": skin.dialog1 || "-",
        "中午好": skin.dialog2 || "-",
        "下午好": skin.dialog3 || "-",
        "晚上好": skin.dialog4 || "-",
    };
    let detailDL = buildDetail(infos);
    detail.appendChild(detailDL);
    //detail.innerHTML = card.cardname;


    //8属性合计值
    let tolBP = attrInfoArr.reduce(function(previous, item) { return previous + countBasicPoint(item.name == "生命" ? (item.value + item.valueAdd) / 5 : item.value + item.valueAdd); }, 0);
    banner.skin.basicpoint = tolBP;
    //创建属性八边图
    let attribute = creatElmt("div", "attribute");
    banner.appendChild(attribute);
    //属性值移到了上面去
    let attrSVG = creatPolygonSVG(attrInfoArr);
    attribute.appendChild(attrSVG);
    //创建属性值合计
    let attrCount = creatElmt("div", "attr-count", [
        attrInfoArr.length + "项合计" + tolAttr,
        "血÷5合计" + hp_c_5,
        "等同基础点" + tolBP,
        "<br>去血" + (attrInfoArr.length - 1) + "项合计" + no_hp,
        "格挡值 ",
    ].join("，"));
    //格挡值
    let bV = (card.block + skin.block); //blockValue
    let blockSpan = creatElmt("span", bV > 20 ? "block-high" : (bV < 20 ? "block-low" : "block-normal"), bV);
    attrCount.appendChild(blockSpan);
    attribute.appendChild(attrCount);

    //创建符卡
    let spell_card = creatElmt("div", "spell_card");
    banner.appendChild(spell_card);

    let spePrefix = cid.replace("ATH", "SPE"); //当前人物符卡前缀
    let spellidA = skin.spell_card_id_atk.length > 0 ? skin.spell_card_id_atk : spePrefix + "A01"; //攻击
    let spellidB = skin.spell_card_id_def.length > 0 ? skin.spell_card_id_def : spePrefix + "B01"; //防御
    let spellidC = skin.spell_card_id_aid.length > 0 ? skin.spell_card_id_aid : spePrefix + "C01"; //支援
    let spellidD = null;
    let idxSkin = /\d$/.exec(spellidA);
    if (idxSkin && idxSkin.length>0)
    {
        spellidD = spePrefix + "D0" + idxSkin[0]; //特殊
    }

    function crtSpellArr(spl) {
        if (typeof(spl) != "undefined") {
            let textArr = [
                spl.name + " 消耗" + spl.spell_point + " Lv" + spl.need_level + "",
            ];
            if (spl.point_up>0)
            textArr.push('魔力值大于 ' + spl.point_up + '时进化');
            textArr.push("基础释放率 " + spl.spell_rate + "%",);
            textArr.push(spl.content);
            return textArr;
        }
        return ["-", "-", "-"];
    }

    //攻击类型
    function getAtkTypeName(type) {
        let str = "";
        switch (type) {
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
    function getAtkRangeName(type) {
        let str = "";
        switch (type) {
            case 1:
                str = "近";
                break;
            case 2:
                str = "中";
                break;
            case 3:
            case 4:
            case 5:
                str = "远";
                break;
            default:
                str = "未知的";
        }
        return str;
    }
    let spells = {
        "出击消耗": buildConsume(skin.use_faith, skin.use_food),
        "攻击类型": getAtkTypeName(skin.atktype) + "，射程 " + getAtkRangeName(skin.range) + "",
    };
    [
        {name:"攻击",id:spellidA},
        {name:"防御",id:spellidB},
        {name:"支援",id:spellidC},
    ].forEach(function(type) {
        let spellCard = spellRes.data.filter((s)=>{return s.spellid==type.id;})[0];
        spells[type.name + "符卡"] = crtSpellArr(spellCard);
        if (spellCard && //先判断有没有
            spellCard.spell_id_up.length>0) {
            spells["魔力" + type.name] = crtSpellArr(spellRes.data.filter((s)=>{return s.spellid==spellCard.spell_id_up;})[0]);
            spells["魔力" + type.name].titleClassName = "magiccard";
        }
    })
    if (spellidD && //先判断有没有
        spellRes.data.filter((s)=>{return s.spellid==spellidD;}).length>0) {
        spells["特殊符卡"] = crtSpellArr(spellRes.data.filter((s)=>{return s.spellid==spellidD;})[0]);
        spells["特殊符卡"].titleClassName = "specialcard";
    }

    let spellsDL = buildDetail(spells);
    spell_card.appendChild(spellsDL);


    return banner;

}

//创建SVG多边图
function creatPolygonSVG(attrArr) {
    let SVG_NS = "http://www.w3.org/2000/svg";
    let w = 550,
        h = 500,
        x = w / 2,
        y = h / 2,
        radius = 170;
        let fontSize = 25;

    let dt = document.implementation.createDocumentType('svg:svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd');
    let doc = document.implementation.createDocument(SVG_NS, 'svg:svg', dt);
    let de = doc.documentElement;
    de.setAttribute("xmlns", SVG_NS);
    de.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    de.setAttribute("version", "1.2");
    de.setAttribute("viewBox", "0 0 550 500");
    let defs = document.createElementNS(SVG_NS, 'defs');
    de.appendChild(defs);
    let radialGradient = document.createElementNS(SVG_NS, 'radialGradient');
    radialGradient.id = "grey_blue";
    let stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute("offset", "50%");
    stop1.setAttribute("class", "stop1");
    let stop2 = document.createElementNS(SVG_NS, 'stop');
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("class", "stop2");
    radialGradient.appendChild(stop1);
    radialGradient.appendChild(stop2);
    defs.appendChild(radialGradient);
    let transBox = document.createElementNS(SVG_NS, 'g');
    transBox.setAttribute("class", "transBox");
    de.appendChild(transBox);
    drawPolygon(attrArr);


    //具体画图的函数
    function drawPolygon(arr) {
        //是否超越了边界
        let breakThrough = arr.some(function(item) {
            return (item.value + item.valueAdd) > item.max;
        });
        //是否改变了值
        let valueChanged = arr.some(function(item) {
            return item.valueAdd != 0;
        });

        let len = arr.length;
        let radStep = 2 * Math.PI / len; //弧度步长
        //画六角边框
        let outBoxPointArr = new Array(); //储存外边框
        let inBoxPointArr = new Array(); //储存内边框
        let namePointArr = new Array(); //储存名字的位置
        let attrPointArr = new Array(); //储存初始属性多边形
        let attrAddPointArr = new Array(); //储存属性值-增加值多边形
        let valuePointArr = new Array(); //储存属性值文字的位置
        for (let si = 0; si < len; si++) //获取各点值
        {
            let radian = radStep * si - Math.PI / 2; //当前弧度
            outBoxPointArr.push([
                radius * Math.cos(radian) + x,
                radius * Math.sin(radian) + y,
            ]);
            inBoxPointArr.push([
                radius / 2 * Math.cos(radian) + x,
                radius / 2 * Math.sin(radian) + y,
            ]);
            let nameRadius = radius + fontSize * 2; //当前名字的半径，一般只有两个字
            namePointArr.push([
                nameRadius * 1.1 * Math.cos(radian) + x,
                nameRadius * Math.sin(radian) + y,
            ]);
            let attr = arr[si]; //当前属性
            if (valueChanged) {
                var attrRadius = radius / (breakThrough ? 2 : 1) * (attr.value / attr.max); //初始属性的半径
                attrPointArr.push([
                    attrRadius * Math.cos(radian) + x,
                    attrRadius * Math.sin(radian) + y,
                ]);
            }
            let attrAddRadius = radius / (breakThrough ? 2 : 1) * ((attr.value + attr.valueAdd) / attr.max); //属性值-增加值的半径
            attrAddPointArr.push([
                attrAddRadius * Math.cos(radian) + x,
                attrAddRadius * Math.sin(radian) + y,
            ]);
            let valueRadius = attrAddRadius + fontSize; //当前属性值文字的半径
            valuePointArr.push([
                valueRadius * Math.cos(radian) + x,
                valueRadius * Math.sin(radian) + y,
            ]);
        }
        //底多边形的points属性用字符串
        let outBoxPointsStr = outBoxPointArr.map(function(item) {
            return item.join(" ");
        }).join(" ");
        let inBoxPointsStr = inBoxPointArr.map(function(item) {
            return item.join(" ");
        }).join(" ");
        let attrPointsStr;
        if (valueChanged) {
            //初始属性多边形的points属性用字符串
            attrPointsStr = attrPointArr.map(function(item) {
                return item.join(" ");
            }).join(" ");
        }
        //属性-增加值多边形的points属性用字符串
        let attrAddPointsStr = attrAddPointArr.map(function(item) {
            return item.join(" ");
        }).join(" ");
        //添加底多边形
        let obPolygon = document.createElementNS(SVG_NS, "polygon");
        obPolygon.setAttribute("class", breakThrough ? "outbackground" : "background");
        obPolygon.setAttribute("points", outBoxPointsStr);
        transBox.appendChild(obPolygon);
        if (breakThrough) {
            let ibPolygon = document.createElementNS(SVG_NS, "polygon");
            ibPolygon.setAttribute("class", "background");
            ibPolygon.setAttribute("points", inBoxPointsStr);
            transBox.appendChild(ibPolygon);
        }
        //添加辐线
        let lineGroup = document.createElementNS(SVG_NS, "g");
        lineGroup.setAttribute("class", "lineGroup");
        for (let si = 0; si < len; si++) {
            let ox = x,
                oy = y,
                toP = outBoxPointArr[si];
                let line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("class", "line");
            line.setAttribute("x1", ox);
            line.setAttribute("y1", oy);
            line.setAttribute("x2", toP[0]);
            line.setAttribute("y2", toP[1]);
            lineGroup.appendChild(line);
        }
        transBox.appendChild(lineGroup);
        if (valueChanged) //如果皮肤的属性有改变
        {
            //添加初始属性多边形
            let aPolygon = document.createElementNS(SVG_NS, "polygon");
            aPolygon.setAttribute("class", "attribute");
            aPolygon.setAttribute("points", attrPointsStr);
            transBox.appendChild(aPolygon);
        }
        //添加属性-增加值多边形
        let aPolygon = document.createElementNS(SVG_NS, "polygon");
        aPolygon.setAttribute("class", "attribute-add");
        aPolygon.setAttribute("points", attrAddPointsStr);
        transBox.appendChild(aPolygon);
        //添加名称、值
        //添加名称
        let nameGroup = document.createElementNS(SVG_NS, "g");
        nameGroup.setAttribute("class", "nameGroup");
        let valueGroup = document.createElementNS(SVG_NS, "g");
        valueGroup.setAttribute("class", "valueGroup");
        for (let si = 0; si < len; si++) {
            let attr = arr[si]; //当前属性值
            let bP = namePointArr[si],
                aP = valuePointArr[si];
            let ntext = document.createElementNS(SVG_NS, "text");
            ntext.setAttribute("class", "text text-name");
            ntext.setAttribute("x", bP[0] - fontSize);
            ntext.setAttribute("y", bP[1] + fontSize / 2);
            ntext.textContent = attr.name;
            nameGroup.appendChild(ntext);
            let atext = document.createElementNS(SVG_NS, "text");
            atext.setAttribute("class", "text text-value");
            atext.setAttribute("x", aP[0] - fontSize / 2);
            atext.setAttribute("y", aP[1] + fontSize / 2);
            atext.textContent = (attr.value + attr.valueAdd);
            if (attr.valueAdd != 0) {
                let atext_c = document.createElementNS(SVG_NS, "tspan");
                atext_c.setAttribute("class", "diff " + (attr.valueAdd > 0 ? "diff-add" : "diff-reduce"));
                atext_c.textContent = [
                    //"(",
                    (attr.valueAdd > 0 ? "+" : ""),
                    attr.valueAdd,
                    //")"
                ].join("");
                atext_c.setAttribute("x", aP[0] - 13 - fontSize / 20);
                atext_c.setAttribute("dy", 20);
                atext.appendChild(atext_c);
            }
            valueGroup.appendChild(atext);
        }
        transBox.appendChild(nameGroup);
        transBox.appendChild(valueGroup);
    }
    return de;
}
//计算属性值需要的点数
function countBasicPoint(value) {
    let decade = parseInt(value / 10); //10位的最大数
    let remainder = value % 10; //余数
    let bp = (1 + decade) * decade / 2 * 10 + (decade + 1) * remainder;
    return bp;
}