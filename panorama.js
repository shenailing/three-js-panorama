var ImgArr = ["img/bg.jpg","img/g5.png"];


(function() {
	Date.prototype.format = function(format) {
		var o = {
			"M+": this.getMonth() + 1, //month 
			"d+": this.getDate(), //day 
			"h+": this.getHours(), //hour 
			"m+": this.getMinutes(), //minute 
			"s+": this.getSeconds(), //second 
			"q+": Math.floor((this.getMonth() + 3) / 3), //quarter 
			"S": this.getMilliseconds() //millisecond 
		}
		if (/(y+)/.test(format)) {
			format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		}

		for (var k in o) {
			if (new RegExp("(" + k + ")").test(format)) {
				format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
			}
		}
		return format;
	}


	function _$(nodeId) {
		return document.getElementById(nodeId);
	}


	/**
	 *图像加载完毕的处理程序
	 **/
	var imgLoad = function(self) {
		return function() {
			self.loadedCount += 1;
			self.loadedImgs[this.srcPath] = this;
			this.onLoad = null; //保证图片的onLoad执行一次后销毁
			self.loadedPercent = Math.floor(self.loadedCount / self.sum * 100);
			self.onLoad && self.onLoad(self.loadedPercent);

			// perNum.innerHTML = self.loadedPercent + "%";

			if (self.loadedPercent >= 90) {
				// perNum.innerHTML = 100 + "%";

				loadingImgs = {};
				setTimeout(function() {
					self.loadedCount = 0;
					self.loadedPercent = 0;
					panorama(ImgArr[0],"container",fillData);
				}, 1000);
			}
		}
	}

	/**
	 *图像加载器
	 **/
	var loader = {
		sum: 0, //图片总数
		loadedCount: 0, //图片已加载数
		loadingImgs: {}, //未加载图片集合
		loadedImgs: {}, //已加载图片集合
		/**
		 *图像加载，之后启动游戏
		 **/
		start: function(src, gameObj, onLoad) { //可传入src数组 ["xxx.jpg","ggg,gif","www.png"]
			var testDate = new Date();

			this.sum = src.length;
			for (var i = 0, len = src.length; i < len; i++) {
				this.gameObj = gameObj;
				this.onLoad = onLoad;
				this.loadingImgs[src[i]] = new Image();
				this.loadingImgs[src[i]].onload = imgLoad(this);
				this.loadingImgs[src[i]].src = src[i];
				this.loadingImgs[src[i]].srcPath = src[i]; //没有经过自动变换的src
			}
		}
	}

	this.loader = loader;

})();

var fillData = [
	{
		x:0,
		y:-40,
		z:50,
		w:20,
		h:13,
		img:ImgArr[1],
		type:"plane",
		animate:"flash",
		repeat:true,
		delayTime:9,
		id:"test1", //此值必须是唯一
		clickFn:function(){
			//点中后的回调方法
			alert("test1")
		}
	},
	{
		x:25,
		y:-20,
		z:30,
		w:20,
		h:13,
		img:ImgArr[1],
		type:"plane",
		animate:"scale",
		repeat:true,
		delayTime:0,
		id:"test2", //此值必须是唯一
		clickFn:function(){
			//点中后的回调方法
			alert("test2")
		}
	},
	{
		x:50,
		y:-8,
		z:-36,
		w:20,
		h:13,
		img:ImgArr[1],
		type:"plane",
		animate:"rotate",
		repeat:true,
		delayTime:0,
		id:"test3", //此值必须是唯一
		clickFn:function(){
			//点中后的回调方法
			alert("test3")
		}
	}
]




loader.start(ImgArr);

function panorama(bgImg,containerid,fillData) {



	var camera, controls, scene , projector , renderer;

	var isUserInteracting = false,
		onMouseDownMouseX = 0,
		onMouseDownMouseY = 0,
		lon = 0,
		onMouseDownLon = 0,
		lat = 0,
		onMouseDownLat = 0,
		phi = 0,
		theta = 0,
		stats;

	//mouse，鼠标所对应的二维向量  raycaster 是指三维偏移向量
	var mouse,
		raycaster;
	//记录当前活动点
	var activePointer;

	var INTERSECTED;

	init();
	animate();

	function init() {
		var container, mesh;
		//获取容器
		container = document.getElementById(containerid);
		//创建透视投影照相机()
		/*
		THREE.PerspectiveCamera(fov, aspect, near, far) 
		fov是视景体竖直方向上的张角（是角度制而非弧度制）
		aspect等于width / height，是照相机水平方向和竖直方向长度的比值，通常设为Canvas的横纵比例。
		near和far分别是照相机到视景体最近、最远的距离，均为正值，且far应大于near。
		 */
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);

		//设定摄像机的目标
		camera.target = new THREE.Vector3(0, 0, 0);

		//创建场景
		scene = new THREE.Scene();

		//添加球型几何形状
		var geometry = new THREE.SphereBufferGeometry(500, 60, 40);

		//设定形状的
		geometry.scale(-1, 1, 1);

		//使用基本材质（BasicMaterial）的物体，渲染后物体的颜色始终为该材质的颜色，不会由于光照产生明暗、阴影效果
		var material = new THREE.MeshBasicMaterial({
			//添加纹理材质
			map: new THREE.TextureLoader().load(bgImg)
		});

		//Mesh（图元装配函数）   生成三维物体
		mesh = new THREE.Mesh(geometry, material);

		//添加至场景中
		scene.add(mesh);

		//光线投射，用于确定鼠标点击位置
		raycaster = new THREE.Raycaster();

		//创建二维平面
		mouse = new THREE.Vector2();

		function createClickTag(data) {

			for(var i=0;i<data.length;i++){
				if(data[i].type == "plane"){
					//plane图片
					var geometry = new THREE.PlaneBufferGeometry(data[i].w, data[i].h);
					var material = new THREE.MeshBasicMaterial( {
							map:new THREE.TextureLoader().load(
								data[i].img,
							),
							side: THREE.DoubleSide,
							opacity :1,
							transparent:true
						});
					var planeMesh = new THREE.Mesh( geometry, material );
					//放置一个位置
					planeMesh.position.x = data[i].x;
					planeMesh.position.y = data[i].y;
					planeMesh.position.z = data[i].z;
					planeMesh.name=data[i].id;

					console.log(planeMesh.rotation)

					animationAll(data[i].animate,planeMesh,data[i].repeat,data[i].delayTime);
					

					//加到场景中去
					scene.add(planeMesh);
				}
			}
		}

		createClickTag(fillData);
		

		//创建渲染器
		renderer = new THREE.WebGLRenderer({antialias:true});

		renderer.setPixelRatio(window.devicePixelRatio);

		//设定尺寸
		renderer.setSize(window.innerWidth, window.innerHeight);

		//将场景加入到画面
		container.appendChild(renderer.domElement);

		//显示了一个左上角的性能监视窗口
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild(stats.domElement);

		//添加监听事件
		document.addEventListener('mousedown', onDocumentMouseDown, false);
		document.addEventListener('touchstart', onDocumentMouseDown, false);
		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('touchmove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		document.addEventListener('touchend', onDocumentMouseUp, false);
		document.addEventListener('wheel', onDocumentMouseWheel, false);


		window.addEventListener('resize', onWindowResize, false);
	}

	function animationAll(animate,obj,repeat,delayTime){
		switch(animate){
		    case "scale":
		        //放大缩小动画
				aniScale(obj,repeat,delayTime);
		        break;
		    case "flash":
		        //闪烁动画
				aniFlash(obj,repeat,delayTime);
		        break;
		    case "bounce":
		        //弹跳动画
				aniBounce(obj,repeat,delayTime);
		        break;
		    case "rotate":
		        //旋转动画
				aniRotate(obj,repeat,delayTime);
		        break;
		    default:
		       
		}
	}

	//旋转动画
	function aniRotate(obj,repeat,delayTime){

		TweenMax.to(obj.rotation, 3, {
                y: Math.PI*2,
                ease: Linear.easeInOut,
                repeat:repeat ? -1 : 1
            }).delay(delayTime);

	}


	//闪烁
	function aniFlash(obj,repeat,delayTime){
		
		TweenMax.to(obj.material, 3, {
                opacity: 0.3,
                ease: Sine.easeOut,
                repeat: repeat ? -1 : 1,
                yoyo:repeat
            }).delay(delayTime);
	}

	//放大缩小
	function aniScale(obj,repeat,delayTime){
		
		TweenMax.to(obj.scale, 3, {
                x:1.2,
                y:1.2,
                z:1.2,
                repeat:repeat ? -1 : 1,
                yoyo:repeat                    
            }).delay(delayTime);

	}

	//弹跳动画
	function aniBounce(obj,repeat,delayTime){
		var startY = obj.position.y;
		TweenMax.to(obj.position, 3, {
                y:startY-1,
                repeat:repeat ? -1 : 1,
                yoyo:repeat                    
            }).delay(delayTime);

	}


	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	


	function onDocumentMouseDown(event) {
		event.preventDefault();
		isUserInteracting = true;
		var touch;
		if (event.touches) {
			touch = event.touches[0];
		} else {
			touch = event;
		}

		onMouseDownMouseX = touch.clientX;
		onMouseDownMouseY = touch.clientY;
		onMouseDownLon = lon;
		onMouseDownLat = lat;

		//将html坐标系转化为webgl坐标系，并确定鼠标点击位置
	    mouse.x =  touch.clientX / renderer.domElement.clientWidth*2-1;
	    mouse.y =  -(touch.clientY / renderer.domElement.clientHeight*2)+1;
	    
	}

	function onDocumentMouseMove(event) {
		var touch;
		if (event.touches) {
			touch = event.touches[0];
		} else {
			touch = event;
		}
		if (isUserInteracting === true) {
			lon = (onMouseDownMouseX - touch.clientX) * 0.1 + onMouseDownLon;
			lat = (touch.clientY - onMouseDownMouseY) * 0.1 + onMouseDownLat;


			
		}
	}

	function onDocumentMouseUp(event) {
		isUserInteracting = false;
		//以camera为z坐标，确定所点击物体的3D空间位置
	    raycaster.setFromCamera(mouse,camera);
	    //确定所点击位置上的物体数量
	    var intersects = raycaster.intersectObjects(scene.children);
	    //选中后进行的操作
	    if(intersects.length>=2){
	       INTERSECTED = intersects[0].object;
	       //循环数组，判定是那个选中
	       for(var i=0;i<fillData.length;i++){
	       	if(fillData[i].id == INTERSECTED.name){
	       		fillData[i].clickFn();
	       	}
	       }
	    }
	}

	function onDocumentMouseWheel(event) {
		var fov = camera.fov + event.deltaY * 0.05;
		camera.fov = THREE.Math.clamp(fov, 10, 75);
		camera.updateProjectionMatrix();
	}



	function animate() {
		requestAnimationFrame(animate);
		update();
		stats.update();
	}

	function update() {
		// if ( isUserInteracting === false ) {
		// 	lon += 0.1;
		// }

		lat = Math.max(-85, Math.min(85, lat));
		phi = THREE.Math.degToRad(90 - lat);
		theta = THREE.Math.degToRad(lon);
		camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
		camera.target.y = 500 * Math.cos(phi);
		camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
		camera.lookAt(camera.target);

		renderer.render(scene, camera);
	}

}