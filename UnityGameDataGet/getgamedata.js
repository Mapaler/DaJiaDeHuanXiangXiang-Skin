const http = require('http');
const fs = require('fs');
const zlib = require('zlib');

class GameResInfo{
    constructor(Name,Url,Md5,type){
        this.Name = Name;
        this.Url = Url;
        this.Md5 = Md5;
		this.type = type;
	}
	downloadString() {
		console.log('开始下载 '+this.Name);
		let _this = this;
		http.get(this.Url, (res) => {
			const { statusCode } = res;
			const contentType = res.headers['content-type'];
		  
			let error;
			if (statusCode !== 200) {
			  error = new Error('Request Failed.\n' +
								`Status Code: ${statusCode}`);
			}
			if (error) {
			  console.error(error.message);
			  // Consume response data to free up memory
			  res.resume();
			  return;
			}
		  
			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				var buffer = Buffer.from(rawData, 'base64'); //解码成buffer
				zlib.unzip(buffer, (err, buffer) => {
					if (!err) {
						_this.data = buffer.toString();
						fs.writeFile('../data/'+_this.Name+'.json',_this.data,(err)=>{
							if (!err)
								console.log(_this.Name + '已保存');
						});
					} else {
						this.data = null;
					}
				});
			});
		  }).on('error', (e) => {
			console.error(`Got error: ${e.message}`);
		  });
	}
}

var GameResArray = [];
//获取文档列表
http.get('http://121.40.19.137:8070/TouHouServer/DownLoadList.txt', (res) => {
	const { statusCode } = res;
	const contentType = res.headers['content-type'];
  
	let error;
	if (statusCode !== 200) {
	  error = new Error('Request Failed.\n' +
						`Status Code: ${statusCode}`);
	}
	if (error) {
	  console.error(error.message);
	  // Consume response data to free up memory
	  res.resume();
	  return;
	}
  
	res.setEncoding('utf8');
	let rawData = '';
	res.on('data', (chunk) => { rawData += chunk; });
	res.on('end', () => {
	  try {
		GameResArray = rawData.split('#').slice(1).map((s)=>{
			let sa = s.split(',');
			return new GameResInfo(sa[0],sa[1],sa[2],sa[3]);
		});
		GameResArray.forEach((r)=>{r.downloadString();});
	  } catch (e) {
		console.error(e.message);
	  }
	});
  }).on('error', (e) => {
	console.error(`Got error: ${e.message}`);
  });