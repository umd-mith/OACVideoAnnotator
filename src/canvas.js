(function ($, MITHGrid, OAC) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/

	OAC.Client.StreamingVideo.initApp = function (container, options) {
		var renderListItem, annoActiveController, app, svgLens, textLens;
		
		/*
		svgLens builds an object with functionality common to all SVG shapes on the canvas.
		The methods expect the SVG shape object to be in that.shape
		 */
		svgLens = function (container, view, model, itemId) {
			var that = {id: itemId};

			that.makeActive = function() {
				that.shape.attr({
					opacity: 1
				}).toFront();
				view.editBoundingBox.attachRendering(that);
				view.keyBoardListener.events.onDelete.addListener(that.eventDeleteHandle);
			};
			
			that.makeInactive = function() {
				that.shape.attr({
					opacity:0.5
				}).toBack();
				view.editBoundingBox.detachRendering();
				view.keyBoardListener.events.onDelete.removeListener(that.eventDeleteHandle);
			};

			that.remove = function (item) {
				// getting the removeItems callback
				that.shape.remove();
				view.editBoundingBox.detachRendering();
				view.keyBoardListener.events.onDelete.removeListener(that.eventDeleteHandle);
			};

			that.eventDeleteHandle = function (id) {

				if(id === itemId) {
					model.removeItems([itemId]);
				}
			};

			return that;
		};
		
		/*
		textLens returns a rendering of the text body of an annotation regardless of the shape
		 */
		textLens = function (container, view, model, itemId) {
			var that = {}, item = model.getItem(itemId),
			itemEl;
			// TODO: move this binding to a controller
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
			
			that.clickEventHandle = app.setActiveAnnotation;

			that.annoEvents.events.onClick.addListener(that.clickEventHandle);
			that.annoEvents.events.onUpdate.addListener(that.updateEventHandle);

			that.makeActive = function() {
				itemEl.addClass('selected');
			};
			
			that.makeInactive = function() {
				itemEl.removeClass('selected');
			};
			
			that.update = function (item) {
				// TODO: update text
			};
			
			that.remove = function () {
				$(itemEl).remove();
			};
			
			if(app.getActiveAnnotation() === itemId) {
				that.makeActive();
			}
			
			return that;
		};
		
		/*
		* Creating application to run DOM and presentations
		*
		*/
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
								var that = svgLens(container, view, model, itemId),
								item = model.getItem(itemId),
								c, ox, oy, bbox, isActive = (itemId === app.getActiveAnnotation());

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
										MITHGrid.debug(e);
									}
									// Raphael object is updated

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
							//	that.events ||= {};
							//	that.events.onShapeIsActive = MITHGrid.initEventFirer(false, false);

								// Event handlers
				
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

								// register shape
								that.shape = c;

								view.canvasEvents.registerRendering(that);
								//app.events.onActiveAnnotationChange.addListener(that.eventClickHandle);

								return that;
							},
							Ellipse: function (container, view, model, itemId) {
								var that = svgLens(container, view, model, itemId),
								item = model.getItem(itemId),
								c, isActive = (itemId === app.getActiveAnnotation());

								// create the shape
								c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0]/2, item.h[0]/2);
								// fill shape
								c.attr({
									fill: "red",
									opacity: isActive ? 1 : 0.5
								});
								

								that.update = function (item) {
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
										MITHGrid.debug(e);

									}
									// Raphael object is updated
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
					
							//	that.events ||= {};
							//	that.events.onShapeIsActive = MITHGrid.initEventFirer(true, false);

								// register shape
								that.shape = c;

								view.canvasEvents.registerRendering(that);
								//app.events.onActiveAnnotationChange.addListener(that.eventClickHandle);
								return that;

							}
						}
					},
					annoItem: {
						type: MITHGrid.Presentation.AnnotationList,
						dataView: 'drawspace',
						container: '.anno_list',
						lenses: {
							Rectangle: textLens,
							Ellipse: textLens
						} //annoItem lenses
					} //annoItem
				},
				cWidth: options.width,
				cHeight: options.height
			})
		);

		renderListItem = function (item, container) {
			var el = $(
				'<div class="anno_item">'+
					'<div class="editArea">'+
						'<textarea class="bodyContentTextArea"></textarea>'+ 
						'<br/>'+
						'<div class="button update">Update</div>'+
					'</div>'+
					'<div class="body">'+
						'<p class="bodyContent"></p>' +
						'<div class="button edit">Edit</div>'+
					'</div>'+
				'</div>'),
				bodyContentTextArea = $(el).find(".bodyContentTextArea"),
				bodyContent = $(el).find(".bodyContent");
			$(bodyContentTextArea).text(item.bodyContent[0]);
			$(bodyContent).text(item.bodyContent[0]);
			$(container).append(el);
			$(el).find(".editArea").hide();
			return $(el); 
		};
		
		app.ready(function() {
			annoActiveController = OAC.Client.StreamingVideo.Controller.annoActiveController({
				// attaching specific selector items here
				application: app,
				selectors: {
					annotation: '',
					annotationlist: ':parent',
					bodycontent: '.bodyContent',
					body: '.body',
					editbutton: '.button.edit',
					editarea: '.editArea',
					textarea: '.editArea > textarea',
					updatebutton: '.button.update',
					deletebutton: '.button.delete'
				}
			});
			app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventActiveRenderingChange);
			app.events.onActiveAnnotationChange.addListener(app.presentation.annoItem.eventActiveRenderingChange);
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
