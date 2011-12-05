/*
 *  OAC Video Annotation Tool v0.1
 * 
 *  Developed as a plugin for the MITHGrid framework. 
 *  
 *  Date: Mon Nov 21 16:23:40 2011 -0500
 *  
 * Educational Community License, Version 2.0
 * 
 * Copyright 2011 University of Maryland. Licensed under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 * 
 * http://www.osedu.org/licenses/ECL-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 * 
 */

var MITHGrid = MITHGrid || {};
var jQuery = jQuery || {};
var Raphael = Raphael || {};
var OAC = OAC || {};
var app = {};

// Set the namespace for the StreamingVideo Annotation application
MITHGrid.globalNamespace("OAC");
OAC.namespace("Client");
OAC.Client.namespace("StreamingVideo");(function ($, MITHGrid, OAC) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/

	OAC.Client.StreamingVideo.initApp = function (container, options) {
		var renderListItem, annoActiveController;
		annoActiveController = OAC.Client.StreamingVideo.Controller.annoActiveController({
			// attaching specific selector items here
			selectors: {
				annotation: '',
				annotationlist: ':parent',
				bodycontent: '> .bodyContent',
				editbutton: '> .bodyContent > .button.edit',
				editarea: '> .editArea',
				textarea: '> .editArea > textarea',
				updatebutton: '> .editArea > .button.update',
				deletebutton: '> .button.delete'
			}
		});
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
								that.annoEvents = annoActiveController.bind(itemEl, {
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
(function ($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');

/*
* Keyboard Listener Controller
*
* Keyboard listener - listens to keydown events on the document
* level (not sure if it will work on lower DOM elements)
*/
OAC.Client.StreamingVideo.Controller.keyBoardListener = function (options) {
	var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.keyBoardListener", options);
	that.options = options;

	that.applyBindings = function (binding, opts) {
		var doc = binding.locate('doc'),
		activeId,
		setActiveId = function (id) {
			activeId = id;
		};

		app.events.onActiveAnnotationChange.addListener(setActiveId);

		binding.events = {
			eventDelete: MITHGrid.initEventFirer(true, true)
		};

		$(doc).keydown(function (e) {
			if(activeId !== undefined || activeId !== ''){
				// If backspace or delete is pressed,
				// then it is interpreted as a
				// delete call
				if(e.keyCode === 8 || e.keyCode === 46) {
					// delete item
					binding.events.eventDelete.fire(activeId);
					activeId = '';
				}
			}

		});
	};

	return that;
};

/*
* Annotation Selection Grid
*
* Attaches to an SVG lens and creates a green rectangle dashed box to
* act as the resize and drag tool. Only edits the SVG data - no annotation
* bodyContent data.
*/
OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid = function (options) {
	var that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", options);
	options = that.options;
	that.handleSet = {};
	that.midDrag = {};
	that.svgBBox = {};
	that.rendering = {};
	that.handles = {};
	that.itemMenu = {};
	that.deleteButton = {};
	that.editButton = {};
	that.menuContainer = {};
	that.dirs = that.options.dirs || ['ul','top','ur','lft','lr','btm','ll','rgt','mid'];

	// Create event firers for resize and drag
	that.eventResize = MITHGrid.initEventFirer(true, false);
	that.eventDrag = MITHGrid.initEventFirer(true, false);
	that.eventEdit = MITHGrid.initEventFirer(true, false);
	that.eventDelete = MITHGrid.initEventFirer(true, false);

/*
* Bounding box is created once in memory - it should be bound to the
* canvas/paper object or something that contains more than 1 shape.
*/
that.applyBindings = function (binding, opts) {
	var ox, oy, factors = {}, extents, svgTarget, paper = opts.paper,
	attrs = {},
	padding = 5,
	calcFactors, calcHandles, drawMenu, handleIds = {}, drawHandles, 
	handleAttrs = {}, shapeAttrs = {}, menuAttrs = {}, cursor, 
	dAttrs = {}, eAttrs = {}, el;

	// Function for applying a new shape to the bounding box
	binding.attachRendering = function (rendering) {

		// register the rendering
		that.rendering = rendering;
		svgTarget = that.rendering.shape;

		calcFactors();
		drawHandles();

		if(that.rendering.eventResizeHandle !== undefined) {
			that.eventResize.addListener(that.rendering.eventResizeHandle);
		}
		if(that.rendering.eventMoveHandle !== undefined) {
			that.eventDrag.addListener(that.rendering.eventMoveHandle);
		}
	};

	// Function to call in order to "de-activate" the edit box
	// (i.e. make it hidden)
	binding.detachRendering = function () {

		if(that.rendering.eventResizeHandle !== undefined) {
			that.eventResize.removeListener(that.rendering.eventResizeHandle);
		}
		if(that.rendering.eventMoveHandle !== undefined) {
			that.eventDrag.removeListener(that.rendering.eventMoveHandle);
		}

		that.handleSet.hide();

		that.svgBBox.hide();
		that.midDrag.hide();
		if(that.itemMenu) {
			that.itemMenu.hide();
		}
	};

	calcFactors = function () {
		
		extents = that.rendering.getExtents();
		// extents: x, y, width, height
		px = (4 * (ox - extents.x) / extents.width) + 2;
		py = (4 * (oy - extents.y) / extents.height) + 2;
		if(px < 1) {
			factors.x = -1;
		}
		else if(px < 3) {
			factors.x = 0;
		}
		else {
			factors.x = 1;
		}
		if(py < 1) {
			factors.y = -1;
		}
		else if(py < 3) {
			factors.y = 0;
		}
		else {
			factors.y = 1;
		}

		// create offset factors for
		// bounding box
		// calculate width - height to be larger
		// than shape
		attrs.width = extents.width + (2 * padding);
		attrs.height = extents.height + (2 * padding);
		attrs.x = (extents.x - (padding/8)) - (attrs.width/2);
		attrs.y = (extents.y - (padding/8)) - (attrs.height/2);
		calcHandles(attrs);
		if(that.itemMenu) {
			drawMenu(attrs);
		}
	};

	// Draws the handles defined in that.dirs as SVG
	// rectangles and draws the SVG bounding box
	drawHandles = function () {
		if($.isEmptyObject(that.handleSet)){
			
			// draw the corner and mid-point squares
			that.handleSet = paper.set();
			$.each(that.handles, function (i, o) {
				if(i === 'mid'){
					that.midDrag = paper.rect(o.x, o.y, padding, padding);
					o.id = that.midDrag.id;

				} else {
					h = paper.rect(o.x, o.y, padding, padding);
					o.id = h.id;

					h.attr({cursor: o.cursor});
					that.handleSet.push(h);
				}
			});

			// make them all similar looking
			that.handleSet.attr({
				fill: 990000,
				stroke: 'black'
			});

			if(!($.isEmptyObject(that.midDrag))) {
				that.midDrag.attr({
					fill: 990000,
					stroke: 'black',
					cursor: 'move'
				});
			}

			// drawing bounding box
			that.svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
			that.svgBBox.attr({
				stroke: 'green',
				'stroke-dasharray': ["--"]
			});
			// Draw the accompanying menu that sits at top-right corner
			drawMenu(attrs);

			if(!($.isEmptyObject(that.midDrag))) {
				
				// Attaching listener to drag-only handle (that.midDrag)
				that.midDrag.drag(
					function (dx, dy) {
						// dragging means that the svgBBox stays padding-distance
						// away from the lens' shape and the lens shape gets updated
						// in dataStore

						handleAttrs.nx = attrs.x + dx;
						handleAttrs.ny = attrs.y + dy;
						shapeAttrs.x = extents.x + dx;
						shapeAttrs.y = extents.y + dy;

						that.svgBBox.attr({
							x: handleAttrs.nx,
							y: handleAttrs.ny
						});

						calcHandles({
							x: handleAttrs.nx,
							y: handleAttrs.ny,
							width: attrs.width,
							height: attrs.height
						});
						if(that.itemMenu) {
							drawMenu({
								x: handleAttrs.nx,
								y: handleAttrs.ny,
								width: attrs.width,
								height: attrs.height
							});
						}
					},
					function (x, y, e) {
						// start
						ox = e.offsetX;
						oy = e.offsetY;

						calcFactors();
						that.rendering.shape.attr({cursor: 'move'});
					},
					function () {
						// end
						var pos = {
							x: shapeAttrs.x,
							y: shapeAttrs.y
						};
					
						that.eventDrag.fire(that.rendering.id, pos);
						that.rendering.shape.attr({cursor: 'default'});
					}
				);
			}

			// Attaching drag and resize handlers
			
			that.handleSet.drag(
				function (dx, dy) {
					// dragging here means that as element is dragged
					// the factorial determines in which direction the
					// shape is pulled
					shapeAttrs.w = extents.width + 2 * dx * factors.x;
					shapeAttrs.h = extents.height + 2 * dy * factors.y;
					handleAttrs.nw = extents.width + 2 * dx * factors.x + (padding * 2);
					handleAttrs.nh = extents.height + 2 * dy * factors.y + (padding * 2);
					handleAttrs.nx = (extents.x - (padding/4)) - (handleAttrs.nw/2);
					handleAttrs.ny = (extents.y - (padding/4)) - (handleAttrs.nh/2);
					that.svgBBox.attr({
						x: handleAttrs.nx,
						y: handleAttrs.ny,
						width: handleAttrs.nw,
						height: handleAttrs.nh
					});
					calcHandles({
						x: handleAttrs.nx,
						y: handleAttrs.ny,
						width: handleAttrs.nw,
						height: handleAttrs.nh
					});
					if(that.itemMenu) {
						drawMenu({
							x: handleAttrs.nx,
							y: handleAttrs.ny,
							width: handleAttrs.nw,
							height: handleAttrs.nh
						});
					}
				},
				function (x, y, e) {
					ox = e.offsetX;
					oy = e.offsetY;

					calcFactors();

				},
				function () {
					// update
					pos = {
						width: shapeAttrs.w,
						height: shapeAttrs.h
					};
					that.eventResize.fire(that.rendering.id, pos);
				}
			);
		} else {
			// show all the boxes and
			// handles
			that.svgBBox.show();
			// adjust the SvgBBox to be around new
			// shape
			that.svgBBox.attr({
				x: attrs.x,
				y: attrs.y,
				width: attrs.width,
				height: attrs.height
			});
			that.handleSet.show();
			that.midDrag.show().toFront();
			if(that.itemMenu) {
				that.itemMenu.show();
				drawMenu(attrs);
			}
		}
	};

	// Draws menu that sits at the top-right corner
	// of the shape
	drawMenu = function (args) {
		if($.isEmptyObject(that.itemMenu)) {
			
			menuAttrs.x = args.x + (args.width);
			menuAttrs.y = args.y - (padding * 4) - 2;
			menuAttrs.w = 100;
			menuAttrs.h = 20;

			eAttrs = {
				x: menuAttrs.x + 2,
				y: menuAttrs.y + 2,
				w: (menuAttrs.w/2) - 4,
				h: menuAttrs.h - (menuAttrs.h/8)
			};

			dAttrs = {
				x: (eAttrs.x + eAttrs.w + 2),
				y: menuAttrs.y + 2,
				w: (menuAttrs.w/2) - 4,
				h: menuAttrs.h - (menuAttrs.h/8)
			};

			that.itemMenu = paper.set();
			that.menuContainer = paper.rect(menuAttrs.x,menuAttrs.y,menuAttrs.w,menuAttrs.h);
			that.menuContainer.attr({
				fill: '#FFFFFF',
				stroke: '#000'
			});

			that.itemMenu.push(that.menuContainer);

			that.editButton = paper.rect(eAttrs.x, eAttrs.y, eAttrs.w, eAttrs.h);
			that.editButton.attr({
				fill: 334009,
				cursor: 'pointer'
			});

			that.itemMenu.push(that.editButton);

			that.deleteButton = paper.rect(dAttrs.x, dAttrs.y, dAttrs.w, dAttrs.h);
			that.deleteButton.attr({
				fill: 334009,
				cursor: 'pointer'
			});

			that.itemMenu.push(that.deleteButton);
			// attach event firers
			that.editButton.mousedown(function () {
				if(that.rendering !== undefined){
					that.eventEdit.fire(that.rendering.id);
				}
			});

			that.deleteButton.mousedown(function () {
				if(that.rendering !== undefined) {
					that.eventDelete.fire(that.rendering.id);

					itemDeleted();
				}
			});

		} else {
		

			menuAttrs.x = args.x + (args.width);
			menuAttrs.y = args.y - (padding * 4) - 2;

			eAttrs = {
				x: (menuAttrs.x + 2),
				y: (menuAttrs.y + 2)
			};

			dAttrs = {
				x: (eAttrs.x + that.editButton.attr('width') + 2),
				y: menuAttrs.y + 2
			};
			that.menuContainer.attr({x: menuAttrs.x, y: menuAttrs.y});
			that.editButton.attr(eAttrs);
			that.deleteButton.attr(dAttrs);
		}
	};

	itemDeleted = function () {
		// set rendering to undefined
		that.rendering = undefined;

		that.itemMenu.hide();
		that.svgBBox.hide();
		that.handleSet.hide();
		that.midDrag.hide();
	};

	calcHandles = function (args) {
		// calculate where the resize handles
		// will be located
		$.each(that.dirs, function (i, o) {
			
			switch(o){
				case 'ul':
					if(that.handles.ul === undefined){
						that.handles.ul = {x: args.x, y: args.y, cursor: 'nw-resize'};
					} else {
					
						that.handles.ul.x = args.x;
						that.handles.ul.y = args.y;

						el = paper.getById(that.handles.ul.id);

						el.attr({
							x: that.handles.ul.x,
							y: that.handles.ul.y
						});
					}
				break;
				case 'top':
					if(that.handles.top === undefined) {
						that.handles.top = {x: (args.x + (args.width/2)), y: args.y, cursor: 'n-resize'};
					} else {
						
						that.handles.top.x = (args.x + (args.width/2));
						that.handles.top.y = args.y;
						el = paper.getById(that.handles.top.id);

						el.attr({
							x: that.handles.top.x,
							y: that.handles.top.y
						});
					}
				break;
				case 'ur':
					if(that.handles.ur === undefined) {
						that.handles.ur = {x: ((args.x) + (args.width - padding)), y: args.y, cursor: 'ne-resize'};
					} else {
						that.handles.ur.x = (args.x + (args.width - padding));
						that.handles.ur.y = args.y;
						
						el = paper.getById(that.handles.ur.id);
						el.attr({
							x: that.handles.ur.x,
							y: that.handles.ur.y
						});
					}
				break;
				case 'rgt':
					if(that.handles.rgt === undefined) {
						that.handles.rgt = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + (args.height/2)), cursor: 'e-resize'};
					} else {
						
						that.handles.rgt.x = ((args.x - padding) + args.width);
						that.handles.rgt.y = ((args.y - padding) + (args.height/2));
						el = paper.getById(that.handles.rgt.id);
						el.attr({
							x: that.handles.rgt.x,
							y: that.handles.rgt.y
						});
					}
				break;
				case 'lr':
					if(that.handles.lr === undefined) {
						that.handles.lr = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + args.width), cursor: 'se-resize'};
					} else {
						that.handles.lr.x = ((args.x - padding) + args.width);
						that.handles.lr.y = ((args.y - padding) + args.height);
						
						el = paper.getById(that.handles.lr.id);
						el.attr({
							x: that.handles.lr.x,
							y: that.handles.lr.y
						});
					}
					break;
				case 'btm':
					if(that.handles.btm === undefined) {
						that.handles.btm = {x: (args.x + (args.width/2)), y: ((args.y - padding) + args.height), cursor: 's-resize'};
					} else {
						that.handles.btm.x = (args.x + (args.width/2));
						that.handles.btm.y = ((args.y - padding) + args.height);
						 
						el = paper.getById(that.handles.btm.id);
						el.attr({
							x: that.handles.btm.x,
							y: that.handles.btm.y
						});
					}
					break;
				case 'll':
					if(that.handles.ll === undefined) {
						that.handles.ll = {x: args.x, y: ((args.y - padding) + args.height), cursor: 'sw-resize'};
					} else {
						that.handles.ll.x = args.x;
						that.handles.ll.y = ((args.y - padding) + args.height);
						
						el = paper.getById(that.handles.ll.id);
						el.attr({
							x: that.handles.ll.x,
							y: that.handles.ll.y
						});
					}
					break;
				case 'lft':
					if(that.handles.lft === undefined) {
						that.handles.lft = {x: args.x, y: (args.y + (args.height/2)), cursor: 'w-resize'};
					} else {
						that.handles.lft.x = args.x;
						that.handles.lft.y = (args.y + (args.height/2));
						
						el = paper.getById(that.handles.lft.id);
						el.attr({
							x: that.handles.lft.x,
							y: that.handles.lft.y
						});
					}
					break;
				case 'mid':
					if(that.handles.mid === undefined) {
						that.handles.mid = {x: (args.x + (args.width/2)), y: (args.y + (args.height/2)), cursor: 'pointer'};
					} else {
						that.handles.mid.x = (args.x + (args.width/2));
						that.handles.mid.y = (args.y + (args.height/2));
						
						el = paper.getById(that.handles.mid.id);
						el.attr({
							x: that.handles.mid.x,
							y: that.handles.mid.y
						});
					}
					break;
			}
		});
	};
};

return that;
};


/*
* Annotation Active Controller
* Handles HTML annotation lens
*/
OAC.Client.StreamingVideo.Controller.annoActiveController = function (options) {
	var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.annoActiveController", options);
	options = that.options;

	that.applyBindings = function (binding, opts) {
		var annoEl, bodyContent, allAnnos, deleteButton, editArea, textArea, editButton;

		annoEl = binding.locate('annotation');

		bodyContent = binding.locate('bodycontent');
		allAnnos = binding.locate('annotations');
		textArea = binding.locate('textarea');
		editArea = binding.locate('editarea');
		editButton = binding.locate('editbutton');
		updateButton = binding.locate('updatebutton');
		deleteButton = binding.locate('deletebutton');

		// Events
		binding.events = {};
		binding.events.eventClick = MITHGrid.initEventFirer(true, false);
		binding.events.eventDelete = MITHGrid.initEventFirer(true, false);
		binding.events.eventUpdate = MITHGrid.initEventFirer(true, false);
		binding.renderings = {};
		binding.active = false;

		// Event registration function - ties elements to
		// event handlers above
		

		editStart = function () {
			$(editArea).show();
			$(bodyContent).hide();
			binding.active = true;
			binding.events.eventClick.fire(opts.itemId);
		};

		editEnd = function () {
			$(editArea).hide();
			$(bodyContent).show();
			binding.active = false;
		};

		editUpdate = function (e) {
			e.preventDefault();

			var data = $(textArea).val();
			binding.events.eventUpdate.fire(opts.itemId, data);
			editEnd();
		};

		$(editButton).live('click', function (e) {
			e.preventDefault();
			if(binding.active) {
				editEnd();
			} else {
				editStart();
			}
		});

		$(updateButton).live('click', editUpdate);
		$(annoEl).live('click', function (e) {
		
			// binding.events.eventClick.fire(opts.itemId);
			app.setActiveAnnotation(opts.itemId);
		});

	};
	return that;
};

/*
* Canvas Controller
* Listens for all clicks on the canvas and connects shapes with the
* Edit controller above
*/
OAC.Client.StreamingVideo.Controller.canvasClickController = function (options) {
	var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.canvasClickController", options);
	that.options = options;

	// Create the object passed back to the Presentation
	that.applyBindings = function (binding, opts) {
		var ox, oy, extents, activeId, container = binding.locate('svg'),
		closeEnough = opts.closeEnough, dx, dy,
		x, y, w, h, paper = opts.paper,
		offset = $(container).offset(),
		attachDragResize = function (id) {
			
			if((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
				return;
			}
			var o = binding.renderings[id];
			if(o === undefined) {
				// de-activate rendering and all other listeners
				binding.event.eventClick.fire('');
				// hide the editBox
				// editBoxController.deActivateEditBox();
				binding.curRendering = undefined;
				return false;
			}

			binding.curRendering = o;
			
		},
		detachDragResize = function (id) {
			if((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
				return;
			}
			var o = binding.renderings[id];
		};
		
		app.events.onActiveAnnotationChange.addListener(attachDragResize);
		
		// Creating events that the renderings will bind to
		binding.event = {};
		binding.event.eventClick = MITHGrid.initEventFirer(true, false);

		binding.renderings = {};

		binding.curRendering = undefined;


		// Add to events
		binding.registerRendering = function (rendering) {
			binding.renderings[rendering.id] = rendering;
			
		};

		binding.removeRendering = function (rendering) {
			var tmp = {}, el;
			$.each(binding.renderings, function (i,o) {
				if(i !== rendering.id) {
					tmp[i] = o;
				}
			});
			binding.renderings = $.extend(true, {}, tmp);
		};

		$(container).bind('mousedown', function (e) {
			activeId = '';
			offset = $(container).offset();
			
			ox = Math.abs(e.pageX - offset.left);
			oy = Math.abs(e.pageY - offset.top);
			$.each(binding.renderings, function (i, o) {
				extents = o.getExtents();
			
				dx = Math.abs(ox - extents.x);
				dy = Math.abs(oy - extents.y);
				if(dx <= extents.width) {
					if(dy <= extents.height) {
						activeId = o.id;
						if((binding.curRendering === undefined) || (o.id !== binding.curRendering.id)) {
							binding.curRendering = o;
							app.setActiveAnnotation(o.id);
						}
						// stop running loop
						return false;
					}
				}
			});
			
			if((activeId.length === 0) && (binding.curRendering !== undefined)) {
				// No shapes selected - de-activate current rendering and all other possible renderings
			
				app.setActiveAnnotation('null');
					
				binding.curRendering = undefined;
			}
		});
		
		
	};

	return that;
};

} (jQuery, MITHGrid, OAC));
/*
Presentations for canvas.js

@author Grant Dickie
*/


(function ($, MITHGrid, OAC) {
	var canvasController, editBoxController, keyBoardController;
	canvasController = OAC.Client.StreamingVideo.Controller.canvasClickController({
		selectors: {
			svg: ''
		}
	});
	editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({

	});
	keyBoardController = OAC.Client.StreamingVideo.Controller.keyBoardListener({
		selectors: {
			doc: ''
		}
	});
	


	MITHGrid.Presentation.namespace("AnnotationList");
	MITHGrid.Presentation.AnnotationList.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("AnnotationList", container, options);

		// that.annoListController = annoActiveController.bind($(container), {});

		return that;
	};

	MITHGrid.Presentation.namespace("RaphaelCanvas");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphaelCanvas", container, options),
			id = $(container).attr('id'), h, w;
		if (options.cWidth !== undefined) {
			w = options.cWidth;
		}
		else {
			w = $(container).width();
		}
		if (options.cHeight !== undefined) {
			h = options.cHeight;
		} else {
			// measure the div space and make the canvas
			// to fit
			h = $(container).height();
		}
		
		// init RaphaelJS canvas
		// Parameters for Raphael:
		// @id: element ID for container div
		// @w: Integer value for width of the SVG canvas
		// @h: Integer value for height of the SVG canvas
		that.canvas = new Raphael(id, w, h);


		// attach binding
		that.canvasEvents = canvasController.bind(container, {

			closeEnough: 5,
			paper: that.canvas
		});

		that.editBoundingBox = editBoxController.bind($(container), {
			paper: that.canvas
		});

		that.keyBoardListener = keyBoardController.bind($('body'), {});


		return that;
	};
}(jQuery, MITHGrid, OAC));
// End of Presentation constructors
// End of OAC Video Annotator

// @author Grant Dickie
