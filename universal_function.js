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
//将对象内的纯数字的字符串属性值变为数字
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
//创建SVG多边图
function creatPolygonSVG(attrArr) {
    let SVG_NS = "http://www.w3.org/2000/svg";
    let w = 550,
        h = 500,
        x = w / 2,
        y = h / 2,
        radius = 170,
        fontSize = 25;

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