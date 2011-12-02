(function ($, MITHGrid, OAC) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/
	// generating the canvasId allows us to have multiple instances of the app on a page and still
	// have a unique ID as expected by the Raphaël library
	var canvasId = 1;
	OAC.Client.StreamingVideo.initApp = function (container, options) {
		var renderListItem, annoActiveController, app, svgLens, textLens,
		    myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId;
		
		canvasId += 1;
		
		/*
		* Creating application to run DOM and presentations
		*
		*/
		app = MITHGrid.Application.initApp("OAC.Client.StreamingVideo", container, 
			$.extend(true, {}, {
				viewSetup: '<div class="canvas_svg_holder"><div id="' + myCanvasId + '" class="canvas_svg"></div></div>'+
				'<div class="anno_list"></div>',
				presentations: {
					raphsvg: {
						container: "#" + myCanvasId,
						lenses: {
							/*
							* The following are lenses for shapes that
							* are found in the dataStore. These items are using
							* the MITHGrid.Presentation.RaphaelCanvas.canvas
							* object, which is a Raphaël paper object, to draw
							* themselves.
							*/
						}
					},
					annoItem: {
						lenses: {
				//			Rectangle: textLens,
				//			Ellipse: textLens
						} //annoItem lenses
					} //annoItem
				},
				cWidth: options.width,
				cHeight: options.height
			}, options)
		);
		
		/*
		svgLens builds an object with functionality common to all SVG shapes on the canvas.
		The methods expect the SVG shape object to be in that.shape
		 */
		app.initShapeLens = function (container, view, model, itemId) {
			var that = {id: itemId};

			that.eventFocus = function() {
				that.shape.attr({
					opacity: 1
				}).toFront();
				view.events.onDelete.addListener(that.eventDelete);
			};
			
			that.eventUnfocus = function() {
				that.shape.attr({
					opacity:0.5
				}).toBack();
				view.events.onDelete.removeListener(that.eventDelete);
			};

			that.eventDelete = function (id) {
				if(id === itemId) {
					model.removeItems([itemId]);
				}
			};
			
			that.eventResize = function (id, pos) {
				if(id === itemId) {
					// update item with new width/height
					model.updateItems([{
						id: itemId,
						w: pos.width,
						h: pos.height
					}]);
				}
			};

			that.eventMove = function (id, pos) {
				if(id === itemId) {
					// update item with new x/y
					model.updateItems([{
						id: itemId,
						x: pos.x,
						y: pos.y
					}]);
				}
			};
			
			that.remove = function (item) {
				// getting the removeItems callback
				that.shape.remove();
			};

			return that;
		};
		
		/*
		textLens returns a rendering of the text body of an annotation regardless of the shape
		 */
		app.initTextLens = function (container, view, model, itemId) {
			var that = {}, item = model.getItem(itemId),
			itemEl, annoEvents;
			
			itemEl = renderListItem(item, container);

			// attaching controller to make the
			// HTML highlighted when shape is selected
			annoEvents = annoActiveController.bind(itemEl, {
				model: model,
				itemId: itemId
			});

			that.eventUpdate = function (id, data) {
				if(id === itemId) {
					model.updateItems([{
						id: itemId,
						bodyContent: data
					}]);
				 }
			};
			
			that.eventFocus = function() {
				itemEl.addClass('selected');
			};
			
			that.eventUnfocus = function() {
				itemEl.removeClass('selected');
			};
			
			annoEvents.events.onClick.addListener(app.setActiveAnnotation);
			annoEvents.events.onUpdate.addListener(that.eventUpdate);
			
			that.update = function (item) {
				$(itemEl).find(".bodyContent").text(item.bodyContent[0]);
				$(itemEl).find(".bodyContentTextArea").text(item.bodyContent[0]);
			};
			
			that.remove = function () {
				$(itemEl).remove();
			};
			
			return that;
		};

		renderListItem = function (item, container) {
			var el = $(
				'<div class="anno_item">'+
					'<div class="editArea">'+
						'<textarea class="bodyContentTextArea"></textarea>'+ 
					'</div>'+
					'<div class="body">'+
						'<p class="bodyContent"></p>' +
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

		app.addShape = function(key, svgShape) {
			app.presentation.raphsvg.addLens(key, svgShape);
		};
		
		app.addBody = function(key, textLens) {
			app.presentation.annoItem.addLens(key, textLens);
		};
		
		app.ready(function() {
			annoActiveController = app.controller.annoActive;
			app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventFocusChange);
			app.events.onActiveAnnotationChange.addListener(app.presentation.annoItem.eventFocusChange);
			app.events.onCurrentTimeChange.addListener(function(t) {
				// five seconds on either side of the current time
				app.dataView.currentAnnotations.setKeyRange(t-5, t+5);
			});
		});
		
		app.ready(function() {
			app.addShape("Rectangle", function (container, view, model, itemId) {
				// Note: Rectangle measurements x,y start at CENTER
				var that = app.initShapeLens(container, view, model, itemId),
				item = model.getItem(itemId),
				c, ox, oy, bbox;

				ox = (item.x - (item.w[0] / 2));
				oy = (item.y - (item.h[0] / 2));

				// Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
				c = view.canvas.rect(ox, oy, item.w[0], item.h[0]);
				// fill and set opacity
				c.attr({
					fill: "red",
					opacity: 0.5
				});
				
				that.update = function (item) {
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

				// register shape
				that.shape = c;
				
				return that;
			});
			app.addShape("Ellipse", function (container, view, model, itemId) {
				var that = app.initShapeLens(container, view, model, itemId),
				item = model.getItem(itemId),
				c;

				// create the shape
				c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0]/2, item.h[0]/2);
				// fill shape
				c.attr({
					fill: "red",
					opacity: 0.5
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

				// register shape
				that.shape = c;

				return that;
			});
			
			app.addBody("Rectangle", app.initTextLens);
			app.addBody("Ellipse", app.initTextLens);
		});
		
		return app;
	};
} (jQuery, MITHGrid, OAC));
															
// Default library for the Canvas application