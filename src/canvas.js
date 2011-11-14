(function ($, MITHGrid, OAC) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/

	


	OAC.Client.StreamingVideo.initApp = function (container, options) {
		var app, renderListItem;

		app = MITHGrid.Application.initApp("OAC.Client.StreamingVideo", container, 
			$.extend(true, {}, options, {
				variables: {
					ActiveAnnotation: {
						is: 'rw'
					}
				},
				dataViews: {
					// view for the space in which data from shapes
					// is drawn
					drawspace: {
						dataStore: 'canvas',
						types: ["Rectangle","Ellipse"],
						label: 'drawspace'

					}
				},
				viewSetup: '<div id="canvasSVG" class="canvas_svg"></div>'+
				'<div id="annoList" class="anno_list"></div>',
				presentations: {
					raphsvg: {
						type: MITHGrid.Presentation.RaphaelCanvas,
						container: "#canvasSVG",
						dataView: 'drawspace',
						lenses: {
							/*
							* The following are lenses for shapes that
							* are found in the dataStore. These items are using
							* the MITHGrid.Presentation.RaphaelCanvas.canvas
							* object, which is a Raphaël paper object, to draw
							* themselves.
							*/

							Rectangle: function (container, view, model, itemId) {
								// Note: Rectangle measurements x,y start at CENTER
								var that = {id: itemId},
								item = model.getItem(itemId),
								c, ox, oy, bbox, isActive = item.active[0];

								ox = (item.x - (item.w[0] / 2));
								oy = (item.y - (item.h[0] / 2));

								// Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
								c = view.canvas.rect(ox, oy, item.w[0], item.h[0]);
								// fill and set opacity
								c.attr({
									fill: "red",
									opacity: isActive ? 1 : 0.5
								});

								that.update = function (item) {
									if(item.active[0] && isActive === false) {
										c.attr({
											opacity: 1
										}).toFront();
										isActive = true;

										view.editBoundingBox.attachRendering(that);
										view.keyBoardListener.events.eventDelete.addListener(that.eventDeleteHandle);
									} else if(item.active[0] === false && isActive === true){
										c.attr({
											opacity:0.5
										}).toBack();
										isActive = false;
										view.editBoundingBox.detachRendering();
										view.keyBoardListener.events.eventDelete.removeListener(that.eventDeleteHandle);
									}
									// receiving the Object passed through
									// model.updateItems in move()
									try {
										if (item.x !== undefined && item.y !== undefined && item.w !== undefined && item.y !== undefined) {
											that.shape.attr({
												x: item.x[0] - item.w[0]/2,
												y: item.y[0] - item.h[0]/2,
												width: item.w[0],
												height: item.h[0]
											});
										}
									} catch(e) {
										console.log(e);
									}
									// Raphael object is updated

								};

								that.remove = function (item) {
									// getting the removeItems callback
									c.remove();
									view.editBoundingBox.detachRendering();
									view.keyBoardListener.events.eventDelete.removeListener(that.eventDeleteHandle);
								};
								// calculate the extents (x, y, width, height)
								// of this type of shape
								that.getExtents = function () {
									return {
										x: c.attr("x") + (c.attr("width")/2),
										y: c.attr("y") + (c.attr("height")/2),
										width: c.attr("width"),
										height: c.attr("height")
									};
								};
								// Event that fires when shape has activated
								that.shapeIsActive = MITHGrid.initEventFirer(false, false);

								// Event handlers
								that.eventClickHandle = function (id) {

									if(id === itemId) {
										// Selected
										model.updateItems([{
											id: itemId,
											active: true
											}]);
										} else {
											// De-select this shape
											model.updateItems([{
												id: itemId,
												active: false
											}]);
										}
								};
				
								that.eventResizeHandle = function (id, pos) {
									if(id === itemId) {
										// update item with new width/height
										model.updateItems([{
											id: itemId,
											w: pos.width,
											h: pos.height
											}]);
										}
									};

									that.eventMoveHandle = function (id, pos) {
										if(id === itemId) {
											// update item with new x/y
											model.updateItems([{
												id: itemId,
												x: pos.x,
												y: pos.y
												}]);
											}
										};

										that.eventDeleteHandle = function (id) {

											if(id === itemId) {
												model.removeItems([itemId]);
											}
										};

								// register shape
								that.shape = c;

								view.canvasEvents.registerRendering(that);
								app.events.onActiveAnnotationChange.addListener(that.eventClickHandle);

								return that;
							},
							Ellipse: function (container, view, model, itemId) {
								var that = {id: itemId},
								item = model.getItem(itemId),
								c, isActive = item.active[0];

								// create the shape
								c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0]/2, item.h[0]/2);
								// fill shape
								c.attr({
									fill: "red",
									opacity: isActive ? 1 : 0.5
								});

								that.update = function (item) {
									if(item.active[0] && isActive === false) {
										c.attr({
											opacity: 1
										}).toFront();
										isActive = true;
										view.editBoundingBox.attachRendering(that);
										view.keyBoardListener.events.eventDelete.addListener(that.eventDeleteHandle);
									} else if(item.active[0] === false && isActive === true){
										c.attr({
											opacity:0.5
										}).toBack();
										isActive = false;
										view.editBoundingBox.detachRendering();
										view.keyBoardListener.events.eventDelete.removeListener(that.eventDeleteHandle);
									}

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

									}
									// Raphael object is updated
								};

								that.remove = function () {
									c.remove();
									view.editBoundingBox.detachRendering();
									view.keyBoardListener.events.eventDelete.removeListener(that.eventDeleteHandle);
								};

								// calculate the extents (x, y, width, height)
								// of this type of shape
								that.getExtents = function () {
									return {
										x: c.attr("cx"),
										y: c.attr("cy"),
										width: (c.attr("rx") * 2),
										height: (c.attr("ry") * 2)
									};
								};

								// Event handlers
								that.eventClickHandle = function (id) {
									if(id === itemId) {
										// Selected
										model.updateItems([{
											id: itemId,
											active: true
										}]);
									} else {
										// De-select this shape
										model.updateItems([{
											id: itemId,
											active: false
										}]);
									}
								};

								that.eventResizeHandle = function (id, pos) {
									if(id === itemId) {
										// update item with new width/height
										model.updateItems([{
											id: itemId,
											w: pos.width,
											h: pos.height
										}]);
									}
								};

								that.eventMoveHandle = function (id, pos) {
									if(id === itemId) {
										// update item with new x/y
										model.updateItems([{
											id: itemId,
											x: pos.x,
											y: pos.y
										}]);
									}
								};

								that.eventDeleteHandle = function (id) {

									if(id === itemId) {
										model.removeItems([itemId]);
									}
								};
					
								that.shapeIsActive = MITHGrid.initEventFirer(true, false);

								// register shape
								that.shape = c;

								view.canvasEvents.registerRendering(that);
								app.events.onActiveAnnotationChange.addListener(that.eventClickHandle);
								return that;

							}
						}
					},
					annoItem: {
						type: MITHGrid.Presentation.AnnotationList,
						dataView: 'drawspace',
						container: '.anno_list',
						lenses: {
							Rectangle: function (container, view, model, itemId) {
								var that = {}, item = model.getItem(itemId), itemEl;
								$("#delete"+item.id[0]).live('click',function (e){
									e.preventDefault();
									model.removeItems([item.id[0]]);
								});
								itemEl = renderListItem(item, container);

								// attach the binding controller
								that.annoEvents = view.annoActiveController.bind(itemEl, {
									model: model,
									itemId: itemId
								});

								that.clickEventHandle = function (id) {
									if(id === itemId) {
										if(item.active[0] !== true){
											model.updateItems([{
												id: itemId,
												active: true
												}]);
											}
										}
									};

								that.updateEventHandle = function (id, data) {
									if(id === itemId) {
										model.updateItems([{
											id: itemId,
											bodyContent: data
										}]);
									}
								};
								that.annoEvents.events.eventClick.addListener(that.clickEventHandle);
								that.annoEvents.events.eventUpdate.addListener(that.updateEventHandle);

								that.update = function (item) {
									if(item.active[0]) {
										itemEl.addClass('selected');
									} else {
										itemEl.removeClass('selected');
									}
								};

								that.remove = function () {

									$("#"+item.id).remove();
								};

								return that;
							},
							Ellipse: function (container, view, model, itemId) {
								var that = {}, item = model.getItem(itemId),
								itemEl;
								$("#delete"+item.id[0]).live('click',function (e){
									e.preventDefault();
									model.removeItems([item.id[0]]);
								});
								itemEl = renderListItem(item, container);

								// attaching controller to make the
								// HTML highlighted when shape is selected
								that.annoEvents = annoActiveController.bind(itemEl, {
									model: model,
									itemId: itemId
								});

								that.updateEventHandle = function (id, data) {
									if(id === itemId) {
										model.updateItems([{
											id: itemId,
											bodyContent: data
										}]);
									 }
								};

								that.annoEvents.events.eventUpdate.addListener(that.updateEventHandle);

								that.update = function (item) {
									if(item.active[0]) {
										itemEl.addClass('selected');
									} else {
										itemEl.removeClass('selected');
									}
								};
								that.remove = function () {
									$("#"+item.id).remove();
								};
								return that;
							}
						} //annoItem lenses
					} //annoItem
				},
				cWidth: options.width,
				cHeight: options.height
			})
		);

		renderListItem = function (item, container) {
			var className = (item.active[0])?'anno_item selected':'anno_item',
			el = '<div id="'+item.id[0]+'" class="'+className+'">'+
			'<div class="editArea">'+
			'<textarea class="bodyContentTextArea">'+item.bodyContent[0]+'</textarea>'+
			'<br/>'+
			'<div id="update'+item.id[0]+'" class="button update">Update</div>'+
			'</div>'+
			'<div class="bodyContent">'+
			'<p>'+item.bodyContent[0]+'</p>'+
			'<div id="#edit'+item.id[0]+'" class="button edit">Edit</div>'+
			'</div>'+
			'</div>';
			$("#"+item.id[0]).remove();

			$(container).append(el);
			$("#"+item.id[0]+' > .editArea').hide();
			return $("#"+$(container).attr('id')+" > #"+item.id[0]);
		};


		app.ready(function () {
			// This has been extracted into
			// genApps.js and controls.js

			var activeShapes = [],
			prep = app.dataStore.canvas.prepare(["!active"]);

			// attach clickEvent listener
			$("body").live('shapeActive', function (e, id) {
				activeShapes = prep.evaluate([true]);
				$.each(activeShapes, function (i, o) {
					app.dataStore.canvas.updateItems([{
						id: o,
						active: false
					}]);
				});
			});

			app.dataStore.canvas.updateItems([{
				id: id,
				active: true
			}]);
		
		});

		return app;
	};
} (jQuery, MITHGrid, OAC));
															
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
					valueType: 'String'
				},
				targetURI: {
					valueType: 'Item'
				},
				active: {
					valueType: 'Bool'
				}
			}

		}

	}
});
