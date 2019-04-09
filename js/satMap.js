/*

Important
---------
(Note*) or (Duplicate) in Comments are:
Sections of Code that could use improvement or tweaking.


*/

$( document ).ready(function() {
    loadMap();
	
});

//XML/DOM VARIABLES
var parser = new DOMParser();
var reader = new FileReader();
var xmlDoc;

function loadMap(){

	//ESRI Packages
	require([
	"esri/Map",
	"esri/views/SceneView",
	"esri/layers/GraphicsLayer",
	"esri/Graphic",
	"esri/Camera",
	"esri/geometry/Point",
	"esri/geometry/Polyline",
	"esri/widgets/BasemapToggle"	
	], function(Map, SceneView, GraphicsLayer, Graphic,Camera,Point,Polyline,BasemapToggle) {

	//MAP 
	var map = new Map({
	  basemap: 'satellite',
	  ground: "world-elevation"
	});

	//SCENE
	var view = new SceneView({
		container: "viewDiv", // Reference to the scene div created in step 5
		map: map,
		environment:{
			lighting: {
				ambientOcclusionEnabled:true,
				cameraTrackingEnabled:true,
			},
			atmosphereEnabled: false,
			atmosphere:{
				quality:"high",
			}
		},	  // Reference to the map object created before the scene
		scale: 50000000, // Sets the initial scale to 1:50,000,000
		center: [-101.17, 21.78], // Sets the center point of view with lon/lat
		qualityProfile: "high",
	});

	//GRAPHICS LAYER
	var graphicsLayer = new GraphicsLayer();
	map.add(graphicsLayer);

	//BASEMAP TOGGLER
	var basemapToggle = new BasemapToggle({
		view: view,  // The view that provides access to the map's "streets" basemap
		nextBasemap: "topo"  // Allows for toggling to the "hybrid" basemap
	});

	//VARIABLES	
	var path=[]; //Drawing Path Coordinates
	var counter=0;//Counter for Path Coordinates
	var eraserFlag = 0;//Ereaser Flag 0=draw,1=erase
	var fillColor = '#ff0000';//Drawing Color
	var mouseDownFlag = 0;
	var pixelWidth=5;
	var createFlag=-1;
	var createdPath=[];
	var createdPathEsriGraphicsLines=[];
		
	//BUTTON REFRENCES
	const createRouteBtn = document.getElementById("createRouteBtn");
	const endRouteBtn = document.getElementById("endRouteBtn");
	const screenshotBtn = document.getElementById("screenshotBtn");
	const undoRouteBtn = document.getElementById("undoRouteBtn");
	const gpsBtn = document.getElementById("addGPSBtn");
	const refreshBtn = document.getElementById("refreshBtn");
	const maskDiv = document.getElementById("maskDiv");	
	const screenshotDiv = document.getElementById("screenshotDiv");
	const saveBtn = document.getElementById("saveBtn");
	const cancelSaveBtn = document.getElementById("cancelSaveBtn");
	

	//ADD BUTTONS TO UI
	view.ui.add(screenshotBtn, "top-left");
	view.ui.add(gpsBtn, "top-left");
	view.ui.add(refreshBtn, "top-left");
	view.ui.add(createRouteBtn,"top-left");
	view.ui.add(endRouteBtn,"top-left");
	view.ui.add(undoRouteBtn,"top-left");	
	view.ui.add(basemapToggle, "top-right");
	
	//File Upload Handler
	document.getElementById('files').addEventListener('change', handleFileSelect, false);
		
	//Save Route Handler
	saveBtn.addEventListener('click',saveHandler);
	
	
	//Refresh Page Button
	refreshBtn.addEventListener('click',function(){
		location.reload();	
	});
	
	//Cancel Save Button
	cancelSaveBtn.addEventListener('click',function(){
		$('#saveGPSDiv').addClass('hide');
		$("#saveName").val("");		
	});
	
	//Create Route Button
	createRouteBtn.addEventListener('click',function(){
		
		//Show Editing Options
		$('#endRouteBtn').slideDown();
		$('#undoRouteBtn').slideDown();	
		$('#createRouteBtn').slideUp();
		
		createdPathEsriGraphicsLines=[];
		createdPath=[];
		
		//Set Creation Flag for View Click Events
		if(createFlag<0){
			createFlag=createFlag*-1;	
		}
	});
	
	//End Route Button
	endRouteBtn.addEventListener('click',function(){				
		
		if(createFlag>0){			
			$('#saveGPSDiv').removeClass('hide');			
		}		
	});
	
	//Save Button Handler
	function saveHandler(){

		routeName=$("#saveName").val();
		
		if(routeName.length<1){
			routeName="file";
		}
		
		generateGPX(createdPath,routeName);

	}

	//Generate GPX XML Document and Download it
	function generateGPX(pathArray,routeName){
		
		var doc = document.implementation.createDocument("", "", null);

		//GPX
		var gpx = doc.createElement("gpx");
		gpx.setAttribute("xmlns","http://www.topografix.com/GPX/1/1");
		gpx.setAttribute("xmlns:xsi","http://www.w3.org/2001/XMLSchema-instance");
		gpx.setAttribute("xsi:schemaLocation","http://www.topografix.com/GPX/1/1/gpx.xsd");
		
		//METADATA
		var metaData = doc.createElement("metadata");
		
			//METADATA:BOUNDS
			var lonArray=[];
			var latArray=[];
			
			for(var i=0;i<createdPath.length;i++){
				lonArray.push(createdPath[i][1]);
				latArray.push(createdPath[i][0]);			
			}
			
			var maxLat=Math.max.apply(null,latArray);
			var minLat=Math.min.apply(null,latArray);
			var maxLon=Math.max.apply(null,lonArray);
			var minLon=Math.min.apply(null,lonArray);
			
					
			var bounds = doc.createElement('bounds');
			bounds.setAttribute("maxLat",maxLat);
			bounds.setAttribute("maxLon",maxLon);
			bounds.setAttribute("minLat",minLat);
			bounds.setAttribute("minLon",minLon);
			metaData.appendChild(bounds);

		//TRK SETTINGS
		var trk = doc.createElement("trk");
		var trkName = doc.createElement("name");
		
		trkName.textContent=routeName;
		trk.appendChild(trkName);
		
		var trkExtension = doc.createElement("extensions");
		var gpxxtrkExt=doc.createElement("gpxx:TrackExtension");
		
		gpxxtrkExt.setAttribute("xmlns:gpxx","http://www.garmin.com/xmlschemas/GpxExtensions/v3");
		
		var trkColor = doc.createElement("gpxx:DisplayColor");
		trkColor.textContent='DarkBlue';
		
		gpxxtrkExt.appendChild(trkColor);
		trkExtension.appendChild(gpxxtrkExt);
		trk.appendChild(trkExtension);

		//TRKSEG
		var trkseg=doc.createElement("trkseg");
		for(var i=0; i<pathArray.length;i++){
			var trkpt=doc.createElement("trkpt");
			//0 is lat, 1 is lon
			trkpt.setAttribute("lat",pathArray[i][0]);
			trkpt.setAttribute("lon",pathArray[i][1]);
			trkseg.appendChild(trkpt);
		}

		trk.appendChild(trkseg);
		gpx.appendChild(metaData);
		gpx.appendChild(trk);
		doc.appendChild(gpx);

		download();

		function download(){
			
			var header='<?xml version="1.0" encoding="UTF-8" standalone="no" ?>';
			var xmlText = header+new XMLSerializer().serializeToString(doc);

			var bb = new Blob([xmlText],{type:"text/xml"});
			var url = URL.createObjectURL(bb);

			var lnk = document.createElement('a'), e;
			lnk.download = routeName+".gpx";
			lnk.href = url;
			if (document.createEvent) {
				e = document.createEvent("MouseEvents");
				e.initMouseEvent("click", true, true, window,
									0, 0, 0, 0, 0, false, false, false,
									false, 0, null);
					  lnk.dispatchEvent(e);
			} else if (lnk.fireEvent) {
				lnk.fireEvent("onclick");
			}
		}
	}

	//Remove Last Path Segment
	undoRouteBtn.addEventListener('click',function(){
				
		graphicsLayer.remove(createdPathEsriGraphicsLines[createdPathEsriGraphicsLines.length-1]);		
		
		createdPathEsriGraphicsLines.pop();
		createdPath.pop();
		
		//Removes Last Point Automatically so Next Click starts Segment at New Point
		if(createdPath.length==1){
			
			createdPathEsriGraphicsLines.pop();
			createdPath.pop();
				
		}
	
	});

		

	view.on("click",function(event){
			
		if(createFlag>0){ //Create GPS Button Sets Flag
			
			createdPath.push([event.mapPoint.latitude,event.mapPoint.longitude]);//Attributes at Click Event
					 
			if(createdPath.length>1){//If Second Point in Path start Drawing Line

				var startPathCoords=[createdPath[createdPath.length-2][1],createdPath[createdPath.length-2][0]];
				var endPathCoords=[createdPath[createdPath.length-1][1],createdPath[createdPath.length-1][0]];
				var pathSegment=[startPathCoords,endPathCoords];
								
				var createdLineSymbol = {
					type: "simple-line", // autocasts as SimpleLineSymbol()
					color: [150, 26, 15],
					width: 4
				};

				var polylineCreated = {
					type: "polyline", // autocasts as new Polyline()
					paths:pathSegment		  
				};

				var polylineGraphicCreated = new Graphic({
					geometry: polylineCreated,
					symbol: createdLineSymbol
				});
				
				
				createdPathEsriGraphicsLines.push(polylineGraphicCreated);//Keep a History of the Actual Graphic Objects (Easier to Undo Lines)
				graphicsLayer.add(polylineGraphicCreated);//Add Line to Graphics Layer

			}			
		}
	});

	//Triggers Screen shot Event (Source: Esri JS Screen Shot Example)
	screenshotBtn.addEventListener("click", function() {

		screenshotBtn.classList.add("active");
		view.container.classList.add("screenshotCursor");
		let area = null;

		// listen for drag events and compute the selected area
		const dragHandler = view.on("drag", function(event) {

		// prevent navigation in the view
		event.stopPropagation();

		// when the user starts dragging or is dragging
		if (event.action !== "end") {
		  // calculate the extent of the area selected by dragging the cursor
		  const xmin = clamp(Math.min(event.origin.x, event.x), 0, view.width);
		  const xmax = clamp(Math.max(event.origin.x, event.x), 0, view.width);
		  const ymin = clamp(Math.min(event.origin.y, event.y), 0, view.height);
		  const ymax = clamp(Math.max(event.origin.y, event.y), 0, view.height);
		  area = {
			x: xmin,
			y: ymin,
			width: xmax - xmin,
			height: ymax - ymin
		  };
		  // set the position of the div element that marks the selected area
		  setMaskPosition(area);
		}
		// when the user stops dragging
		else {
		  // remove the drag event listener from the SceneView
		  dragHandler.remove();

		  // the screenshot of the selected area is taken
		  view.takeScreenshot({
			  area: area,
			  format: "png"
			})
			.then(function(screenshot) {

			  // display a preview of the image
			  showPreview(screenshot);
			  drawCanvas(screenshot);
			  // create the image for download

			  // the screenshot mode is disabled
			  screenshotBtn.classList.remove("active");
			  view.container.classList.remove("screenshotCursor");
			  setMaskPosition(null);
			});
		}
	  });

		//Creates Mask over Page
		function setMaskPosition(area) {
			if (area) {
			  maskDiv.classList.remove("hide");
			  maskDiv.style.left = area.x + "px";
			  maskDiv.style.top = area.y + "px";
			  maskDiv.style.width = area.width + "px";
			  maskDiv.style.height = area.height + "px";
			} else {
			  maskDiv.classList.add("hide");
			}
		}

		function clamp(value, from, to) {
			return value < from ? from : value > to ? to : value;
		}

	});

	//Show Screenshot Preview Div
	function showPreview(screenshot) {
		
		//Shows ScreenShot Container Overlay
		screenshotDiv.classList.remove("hide");
		
		// add the screenshot dataUrl as the src of an image element
		const screenshotImage = document.getElementsByClassName("js-screenshot-image")[0];
		screenshotImage.width = screenshot.data.width;//Note* Could Pass to function and use instead of JQuery for Dimensions
		screenshotImage.height = screenshot.data.height;
		screenshotImage.src = screenshot.dataUrl;
		$('#screenshot').css('display', 'none');//Duplicate Note*
		loadToCanvas();
		maskDiv.classList.add("hide");

	}

	//Draws Screen shot to a Canvas and Makes a Transparent Drawing Layer Above it
	function loadToCanvas(){

		//Holds Screen Shot Image
		var img1 = new Image();

		//Background Canvas(for Screen Shot)
		var newCanvas = $('<canvas/>', {
			'class': 'screenShotCanvas',
			id: 'backgroundCanvas'
		}).prop({
			width: $('.js-screenshot-image')[0].width,//Set as Height and Width of Screen Shot
			height: $('.js-screenshot-image')[0].height
		});

		$('#screenshotDiv').prepend(newCanvas); //Add Canvas to Screen Shot Div
		$('#screenshot').css('display','none'); //Hide Actual Screen Shot Image(no longer needed)

		//Drawing Canvas(ForeGround Canvas)
		var newCanvas2 = $('<canvas/>', {
			'class': 'screenShotCanvas',
			id: 'drawingCanvas'
		}).prop({
			width: $('.js-screenshot-image')[0].width,//Set as Height and Width of Screen Shot
			height: $('.js-screenshot-image')[0].height
		});
	
		//CSS Positions are Absolute and Control Overlap of Two Canvases
		$('#screenshotDiv').prepend(newCanvas2);//Add Canvas to Screen Shot Div(Added in front of Background Canvas)
		
		//Drawing Canvas Variables
		var drawingCanvas = document.getElementById('drawingCanvas');
		var drawingCtx = drawingCanvas.getContext('2d');

		//Draw ScreenShot on Background Canvas Once it is loaded
		img1.onload = function() {
			
			var ctx1 = $('#backgroundCanvas')[0].getContext('2d');
			ctx1.drawImage(img1, 0, 0);
		
		};

		//Load ScreenShot Image
		img1.src = $('.js-screenshot-image')[0].src;

		//Click Drawing Function (Starts Drawing Path & Allows drawing of single Dots)
		drawingCanvas.addEventListener("mousedown", function(evt) {
			
			
			fillColor=$('#myColor')[0].value;//Get Fill Color on every Beginning of Click
			
			if(eraserFlag==0){
				drawingCtx.fillStyle = fillColor;
				drawingCtx.fillRect(evt.offsetX, evt.offsetY, pixelWidth, pixelWidth);
			}else if (eraserFlag==1){
				drawingCtx.clearRect(evt.offsetX, evt.offsetY, pixelWidth, pixelWidth);
			}
			
			mouseDownFlag = 1;//Sets Flag to confirm drawing on mouse move
			
			//First Coordinates in Line To functions used on drag
			path.push(evt.offsetX);
			path.push(evt.offsetY);

		});
	  
		//Change Cursor When Over Drawing Canvas
		drawingCanvas.addEventListener("mouseover",function(){
			
			if(eraserFlag===0){
				$('#drawingCanvas').css('cursor','url(cursor/pencil-cursor.png) 0 15, auto');
			}else if(eraserFlag===1){
				$('#drawingCanvas').css('cursor','url(cursor/eraser-cursor.png) 0 15, auto');
			}
			
		});

		//Drawing On Click + Drag
		drawingCanvas.addEventListener('mousemove', function(evt) {
					
			if (mouseDownFlag == 1) {//Check if Mouse is Pressed
			  
				if (eraserFlag == 0) {//Drawing Mode
				
					drawingCtx.fillStyle = fillColor;
					path.push(evt.offsetX);
					path.push(evt.offsetY);
					counter+=2;
					drawingCtx.strokeStyle =fillColor;
					drawingCtx.lineWidth = pixelWidth;
					drawingCtx.beginPath();
					drawingCtx.moveTo(path[counter-2],path[counter-1]);//Click pushes first Coordinates
					drawingCtx.lineCap = 'round';
					drawingCtx.lineTo(path[counter], path[counter+1]);
					drawingCtx.stroke();
				}else {  //Eraser Mode
					drawingCtx.clearRect(evt.offsetX, evt.offsetY, pixelWidth, pixelWidth);
				}
			}
			
		});

		//Release Drawing tools on Mouse Up
		drawingCanvas.addEventListener("mouseup", function() {

			mouseDownFlag = 0;
			counter=0;
			path=[];
		});

	}
	
	//Eraser Toggle Button
	document.getElementById("eraserToggle").addEventListener('click',function(){
		
		if(eraserFlag === 0){
			eraserFlag = 1;
			$('#eraserToggle').html('Draw');
			return;
		}
	
		if(eraserFlag === 1){
			eraserFlag=0;
			$('#eraserToggle').html('Erase');
			return;
		}

	});
	
	//Close ScreenShot Container Button
	document.getElementById("closeBtn").addEventListener("click", function() {
		
		screenshotDiv.classList.add("hide");
		//Clear Background and Forground Canvas
		$('#backgroundCanvas').remove();
		$('#drawingCanvas').remove();
		//Set Back to Drawing Mode for Next Openining
		eraserFlag=0;
		$('#eraserToggle').html('Erase');
		view.container.classList.remove("screenshotCursor");
		
	});

	//Download Image Button
	document.getElementById("downloadBtn").addEventListener("click", function() {
		mergeCanvases();
	});
	
	//Pixel Width Selector Button
	document.getElementById('pixelWidthSelector').addEventListener('change',function(){
		pixelWidth=$('#pixelWidthSelector').val();
	});
	
	//Add GPS Route Button
	document.getElementById('addGPSBtn').addEventListener('click',function(){
		$('#addGPSDiv').removeClass('hide');		
	});
	
	//Close Add GPS Container (X Button)
	document.getElementById('closeGPSAdditionDiv').addEventListener('click',function(){
		$('#addGPSDiv').addClass('hide');		
	});
	
	//Close Save GPS Route Container (X Button)
	document.getElementById('closeGPSSaveDiv').addEventListener('click',function(){
		$('#saveGPSDiv').addClass('hide');
		$("#saveName").val("");	
	});

	//Download Image Merging, Automatically calls download Function
	function mergeCanvases(){
		
		//Foreground(User Drawn) and Background(ScreenShot)
		var canvasBackground = document.getElementById('backgroundCanvas');
		var canvasForeGround = document.getElementById('drawingCanvas');
		
		//Create Virtual Canvas to Merge
		var mergedCanvas= document.createElement('canvas');
		mergedCanvas.width=$('.js-screenshot-image')[0].width;//Set Width and Height equal to background sizes
		mergedCanvas.height=$('.js-screenshot-image')[0].height;
		var mergedCtx = mergedCanvas.getContext('2d');
		
		//Draw ForeGround and Background on Virtual Canvas
		mergedCtx.drawImage(canvasBackground, 0, 0);
		mergedCtx.drawImage(canvasForeGround, 0, 0);
		
		//Pass Virtual Canvas to Download
		download(mergedCanvas,'image');
	}

	//Downloads The merged Canvases(Source:Stack OverFlow)
	function download(canvas, filename) {
		// create an "off-screen" anchor tag
		var lnk = document.createElement('a'), e;

		// the key here is to set the download attribute of the a tag
		lnk.download = filename;

		//convert canvas content to data-uri for link. When download
		// attribute is set the content pointed to by link will be
		// pushed as "download" in HTML5 capable browsers
		lnk.href = canvas.toDataURL("image/png;base64");

		// create a "fake" click-event to trigger the download
		if (document.createEvent) {
		  e = document.createEvent("MouseEvents");
		  e.initMouseEvent("click", true, true, window,
						   0, 0, 0, 0, 0, false, false, false,
						   false, 0, null);

		  lnk.dispatchEvent(e);
		} else if (lnk.fireEvent) {
		  lnk.fireEvent("onclick");
		}
	}

	//Read GPX File & Add Path to graphics Array
	function handleFileSelect(evt) {
		
		var routeFile = evt.target.files[0]; //Uploaded File
					
		if(routeFile){
			reader.onload=function(){
			var text = reader.result;
			convertToDOM(text);
		}

		reader.onerror=function(){
			alert('File Could Not Be Read!');
		}
		
		reader.readAsText(routeFile);	
		}
	
	
		function convertToDOM(file){
			
			var pathsArray=[]; //Holds The parsed GPX Coordinates
			var lineColor;
			
			xmlDoc = parser.parseFromString(file,"text/xml")//Parse Files
			
			//Get Track and Route Node List
			var trkptNodeList=xmlDoc.getElementsByTagName('trkpt');
			var rteptNodeList=xmlDoc.getElementsByTagName('rtept');
			
			//Add Track first if it exists
			if(trkptNodeList.length>1){
				//Orange for Tracks
				lineColor = [226,119,40];
				for(var i =0;i<trkptNodeList.length;i++){
					var lat=parseFloat(trkptNodeList[i].getAttribute("lat"));
					var lon=parseFloat(trkptNodeList[i].getAttribute("lon"));						
					pathsArray.push([lon,lat]);
				}
			//Add Route if Track doesn't exist			
			}else if(rteptNodeList.length>1){
				lineColor = [0, 191, 255];
				for(var i =0;i<rteptNodeList.length;i++){
					var lat=parseFloat(rteptNodeList[i].getAttribute("lat"));
					var lon=parseFloat(rteptNodeList[i].getAttribute("lon"));						
					pathsArray.push([lon,lat]);
				}
			}else{
				alert('File Could Not Be Read!');
			}
			
			//Line Vectors
			var polyline = {
				type: "polyline", // autocasts as new Polyline()
				paths:pathsArray 
				};

			//Line Details
			lineSymbol = {
			  type: "simple-line", // autocasts as SimpleLineSymbol()
			  color: [226, 119, 40],
			  width: 4
			};

			//Graphic Object(Vectors + Line Details)
			var polylineGraphic = new Graphic({
			  geometry: polyline,
			  symbol: lineSymbol
			});
				
			//Coordinates to Move Camera Too
			var goToLat=Number.parseFloat(pathsArray[0][1]).toFixed(2);
			var goToLon=Number.parseFloat(pathsArray[0][0]).toFixed(2)
				

			//Camera Object(holds details of a View)	
			var cam = new Camera({
				position: new Point({
					x: goToLon, // lon
					y: goToLat, // lat
					z: 30000,   // elevation in meters
				}),
				heading: 180, // facing due south
				tilt: 0      // bird's eye view
			});

			//Move Camera to route/trk added	
			view.goTo(cam);	

			//Add The route to the graphics layer
			graphicsLayer.add(polylineGraphic);
			


		}
	}
	});
}
