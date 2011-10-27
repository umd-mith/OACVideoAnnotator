(function($, MITHGrid, OAC) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/
	
	// Set the namespace for the StreamingVideo Annotation application
	MITHGrid.globalNamespace("OAC");
	OAC.namespace("Client");
	OAC.Client.namespace("StreamingVideo");
	
	OAC.Client.StreamingVideo.initApp = function(container, options) {
		var that, dragController, renderListItem;
		//dragController = OAC.Client.StreamingVideo.Controller.annotationShapeDragController({});
		dragController = OAC.Client.StreamingVideo.Controller.annotationShapeResizeController({});
		editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({});
		annoActiveController = OAC.Client.StreamingVideo.Controller.annoActiveController({
			// attaching specific selector items here
			selectors: {
				annotation: '',
				annotationlist: ':parent',
				bodycontent: '.bodyContent',
				deleteButton: '.button.delete'
			}
		});
		
		that = MITHGrid.Application.initApp("OAC.Client.StreamingVideo", container, $.extend(true, {}, options, {
			
			dataViews: {
				// view for the space in which data from shapes
				// is drawn
				drawspace: {
					dataStore: 'canvas',
					types: ["Rectangle", "Ellipse"],
					label: 'drawspace'
				}
			},
			viewSetup: '<div id="canvasSVG"></div>'+
			'<div id="annoList" class="anno_list"></div>',
		   
			presentations: {
				raphsvg: {
					type: MITHGrid.Presentation.RaphaelCanvas,
					container: "#canvasSVG",
					dataView: 'drawspace',
					lenses: {
						Rectangle: function(container, view, model, itemId) {
							// Note: Rectangle measurements x,y start at CENTER
							var that = {},
							item = model.getItem(itemId),
							c, ox, oy, bbox;
							
							ox = (item.x - (item.w[0] / 2));
							oy = (item.y - (item.h[0] / 2));

							// Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
							c = view.canvas.rect(ox, oy, item.w[0], item.h[0]);
							// fill and set opacity
							c.attr({
								fill: "red",
								opacity: 1
							});
							
							that.update = function(item) {

								// receiving the Object passed through
								// model.updateItems in move()
								try {
									if (item.x !== undefined && item.y !== undefined && item.w !== undefined && item.y !== undefined) {
										c.attr({
											x: item.x[0] - item.w[0]/2,
											y: item.y[0] - item.h[0]/2,
											width: item.w[0],
											height: item.h[0]
										});
										c.toBack();
									}
								} catch(e) {
									console.log(e);
									//	c.remove();
								}
								// Raphael object is updated
								
							};

							that.remove = function(item) {
								// getting the removeItems callback
								c.remove();
							};

							attachBBox = function(e) {
								// attaching the controller to Bounding Box
								editBoxController.bind(c, {
									eventObj: e,
									model: model,
									itemId: itemId,
									calculate: {
										extents: function() {
											return {
												x: c.attr("x") + (c.attr("width")/2),
												y: c.attr("y") + (c.attr("height")/2),
												width: c.attr("width"),
												height: c.attr("height")
											};
										}
									},
									x: 'x',
									y: 'y'
								});
								
								c.unmousedown(attachBBox);
							};
							
							c.mousedown(attachBBox);
							
							return that;
						},
						Ellipse: function(container, view, model, itemId) {
							var that = {},
							item = model.getItem(itemId),
							c;
							
							// create the shape
							c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0]/2, item.h[0]/2);
							// fill shape
							c.attr({
								fill: "red"
							});
							
							dragController.bind(c, {
								model: model,
								itemId: itemId,
								calculate: {
									extents: function() {
										return {
											x: c.attr("cx"),
											y: c.attr("cy"),
											width: c.attr("rx") * 2,
											height: c.attr("ry") * 2
										};
									}
								},
								x: 'cx',
								y: 'cy'
							});

							that.update = function(item) {
								// receiving the Object passed through
								// model.updateItems in move()
								try {
									if (item.x !== undefined && item.y !== undefined) {
										c.attr({
											cx: item.x[0],
											cy: item.y[0],
											rx: item.w[0] / 2,
											ry: item.h[0] / 2
										});
									}
								} catch(e) {
									console.log(e);
									//	c.remove();
								}
								// Raphael object is updated
							};
					
							that.remove = function() {
								c.remove();
							};


							return that;

						}
					}
				},
				annoItem: {
					type: MITHGrid.Presentation.SimpleText,
					dataView: 'drawspace',
					container: '.anno_list',
					lenses: {
						Rectangle: function(container, view, model, itemId) {
							var that = {}, item = model.getItem(itemId), itemEl;
							$("#delete"+item.id[0]).live('click',function(e){
								e.preventDefault();
								model.removeItems([item.id[0]]);
							});
							itemEl = renderListItem(item, container);
							
							// attach the binding controller
							annoActiveController.bind(itemEl, {
								model: model,
								itemId: itemId
							});
							
							that.update = function(item) {
								renderListItem(item, container);
							};
							
							that.remove = function() {
						
								$("#"+item.id).remove();
							};
						
							return that;
						},
						Ellipse: function(container, view, model, itemId) {
							var that = {}, item = model.getItem(itemId);
							$("#delete"+item.id[0]).live('click',function(e){
								e.preventDefault();
								model.removeItems([item.id[0]]);
							});
							renderListItem(item, container);

							that.update = function(item) {
								renderListItem(item, container);
							};
							that.remove = function() {
								$("#"+item.id).remove();
							};
							return that;
						}
					}
				}
			},
			cWidth: options.width,
			cHeight: options.height
		}));
	
		renderListItem = function(item, container) {
			var el = '<div id="'+item.id[0]+'" class="anno_item">'+
			'<p>'+item.creator[0]+'</p>'+
			'<p>'+item.bodyContent[0]+'</p>'+
			'<p>'+item.x[0]+'<br/>'+
			item.y[0]+'<br/>'+
			item.w[0]+'<br/>'+
			item.h[0]+'</p>'+
			'<div id="delete'+item.id[0]+'" class="button delete">X</div>'+
			'</div>';
			$("#"+item.id[0]).remove();
			$(container).append(el);
			return $("#"+$(container).attr('id')+" > #"+item.id[0]);
		};
		renderEditMenu = function(item, container) {
			var el = '<div id="edit'+item.id[0]+'" class="editAnno">'+
			'<div id="edit" class="button">^^</div>'+
			'<div id="del" class="button">X</div>'+
			'</div>', x, y;
			
			$(container).append(el);
			el = $("#edit"+item.id[0]);
			x = (item.x[0] - item.w[0]);
			y = (item.y[0] - el.height());
			
			$("#edit"+item.id[0]).attr({
				x: x,
				y: y
			
			});
			return el;
		};
		
		that.ready(function() {
			// This has been extracted into
			// genApps.js and controls.js
		});
		
		return that;
	};
}(jQuery, MITHGrid, OAC));	


// Default library for the Canvas application
MITHGrid.defaults("OAC.Client.StreamingVideo", {
	// Data store for the Application
	dataStores: {
		canvas: {
			// put in here the types of data that will
			// be represented in OACVideoAnnotator
			types:{
				// types of shapes -- to add a new
				// shape object, add it here
				Rectangle: {},
				Ellipse: {}
			},
			properties: {
				// posInfo contains the SVG dimensions for 
				// a shape
				bodyContent: {
					type: 'String'
				},
				targetURI: {
					type: 'Item'
				}
			}
			
		}
		
	}
});