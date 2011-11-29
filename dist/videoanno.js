/*
 *  OAC Video Annotation Tool v0.1
 * 
 *  Developed as a plugin for the MITHGrid framework. 
 *  
 *  Date: Mon Nov 28 16:41:44 2011 -0500
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
				$(itemEl).find(".bodyContent").text(item.bodyContent[0]);
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
				viewSetup: '<div class="canvas_svg_holder"><div id="canvasSVG" class="canvas_svg"></div></div>'+
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
					//	'<br/>'+
					//	'<div class="button update">Update</div>'+
					'</div>'+
					'<div class="body">'+
						'<p class="bodyContent"></p>' +
					//	'<div class="button edit">Edit</div>'+
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
(function($, MITHGrid, OAC) {
    OAC.Client.StreamingVideo.namespace('Controller');

    MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.keyBoardListener", {
        bind: {
            events: {
                onDelete: ["preventable", "unicast"]
            }
        }
    });
    /*
	 * Keyboard Listener Controller
	 *
	 * Keyboard listener - listens to keydown events on the document
	 * level (not sure if it will work on lower DOM elements)
     */
    OAC.Client.StreamingVideo.Controller.keyBoardListener = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.keyBoardListener", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var doc = binding.locate('doc'),
            activeId,
            setActiveId = function(id) {
                activeId = id;
            };

            options.application.events.onActiveAnnotationChange.addListener(setActiveId);

            $(doc).keydown(function(e) {
                if (activeId !== undefined || activeId !== '') {
                    // If backspace or delete is pressed,
                    // then it is interpreted as a
                    // delete call
                    if (e.keyCode === 8 || e.keyCode === 46) {
                        // delete item
                        binding.events.onDelete.fire(activeId);
                        activeId = '';
                    }
                }

            });
        };

        return that;
    };

    MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", {
        events: {
            onResize: "preventable",
            onDrag: "preventable",
            onEdit: "preventable",
            onDelete: "preventable"
        }
    });
    /*
	 * Annotation Selection Grid
	 *
	 * Attaches to an SVG lens and creates a green rectangle dashed box to
	 * act as the resize and drag tool. Only edits the SVG data - no annotation
	 * bodyContent data.
     */
    OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid = function(options) {
        var that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", options),
        handleSet = {},
        midDrag = {},
        dirs = [],
        svgBBox = {},
        itemMenu = {},
        handles = {},
        activeRendering = {};
        options = that.options;
        that.deleteButton = {}; // **
        that.editButton = {};   // ** - and change live() to on()
        that.menuContainer = {};// **
        dirs = that.options.dirs || ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'];

        /*
		 * Bounding box is created once in memory - it should be bound to the
		 * canvas/paper object or something that contains more than 1 shape.
         */
        that.applyBindings = function(binding, opts) {
            var ox,
            oy,
            factors = {},
            extents,
            svgTarget,
            paper = opts.paper,
            attrs = {},
            padding = 5,
            calcFactors,
            calcHandles,
            drawMenu,
            itemDeleted,
            handleIds = {},
            drawHandles,
            handleAttrs = {},
            shapeAttrs = {},
            menuAttrs = {},
            cursor,
            dAttrs = {},
            eAttrs = {},
			handleCalculationData = {},
            el;

            // Function for applying a new shape to the bounding box
            binding.attachRendering = function(newRendering) {

                // register the rendering
                activeRendering = newRendering;
                svgTarget = activeRendering.shape;

                calcFactors();
                drawHandles();

                if (activeRendering.eventResizeHandle !== undefined) {
                    that.events.onResize.addListener(activeRendering.eventResizeHandle);
                }
                if (activeRendering.eventMoveHandle !== undefined) {
                    that.events.onDrag.addListener(activeRendering.eventMoveHandle);
                }
                if (activeRendering.eventDeleteHandle !== undefined) {
                    that.events.onDelete.addListener(activeRendering.eventDeleteHandle);
                }
            };

            // Function to call in order to "de-activate" the edit box
            // (i.e. make it hidden)
            binding.detachRendering = function() {
                if (typeof(activeRendering) === "undefined" || activeRendering === null) {
                    return;
                }

                if (activeRendering.eventResizeHandle !== undefined) {
                    that.events.onResize.removeListener(activeRendering.eventResizeHandle);
                }
                if (activeRendering.eventMoveHandle !== undefined) {
                    that.events.onDrag.removeListener(activeRendering.eventMoveHandle);
                }
                if (activeRendering.eventDeleteHandle !== undefined) {
                    that.events.onDelete.removeListener(activeRendering.eventDeleteHandle);
                }

                handleSet.hide();

                svgBBox.hide();
                midDrag.hide();
                if (itemMenu) {
                    itemMenu.hide();
                }
            };

            calcFactors = function() {
                var px,
                py;
                extents = activeRendering.getExtents();
                // extents: x, y, width, height
                px = (4 * (ox - extents.x) / extents.width) + 2;
                py = (4 * (oy - extents.y) / extents.height) + 2;
                if (px < 1) {
                    factors.x = -1;
                }
                else if (px < 3) {
                    factors.x = 0;
                }
                else {
                    factors.x = 1;
                }
                if (py < 1) {
                    factors.y = -1;
                }
                else if (py < 3) {
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
                attrs.x = (extents.x - (padding / 8)) - (attrs.width / 2);
                attrs.y = (extents.y - (padding / 8)) - (attrs.height / 2);
                calcHandles(attrs);
                if (itemMenu) {
                    drawMenu(attrs);
                }
            };

            // Draws the handles defined in dirs as SVG
            // rectangles and draws the SVG bounding box
            drawHandles = function() {
                if ($.isEmptyObject(handleSet)) {

                    // draw the corner and mid-point squares
                    handleSet = paper.set();
                    $.each(handles,
                    function(i, o) {
                        var h;
                        if (i === 'mid') {
                            midDrag = paper.rect(o.x, o.y, padding, padding);
                            o.id = midDrag.id;

                        } else {
                            h = paper.rect(o.x, o.y, padding, padding);
                            o.id = h.id;

                            h.attr({
                                cursor: o.cursor
                            });
                            handleSet.push(h);
                        }
                    });

                    // make them all similar looking
                    handleSet.attr({
                        fill: 990000,
                        stroke: 'black'
                    });

                    if (! ($.isEmptyObject(midDrag))) {
                        midDrag.attr({
                            fill: 990000,
                            stroke: 'black',
                            cursor: 'move'
                        });
                    }

                    // drawing bounding box
                    svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                    svgBBox.attr({
                        stroke: 'green',
                        'stroke-dasharray': ["--"]
                    });
                    // Draw the accompanying menu that sits at top-right corner
                    drawMenu(attrs);

                    if (! ($.isEmptyObject(midDrag))) {

                        // Attaching listener to drag-only handle (midDrag)
                        midDrag.drag(
                        function(dx, dy) {
                            // dragging means that the svgBBox stays padding-distance
                            // away from the lens' shape and the lens shape gets updated
                            // in dataStore
                            handleAttrs.nx = attrs.x + dx;
                            handleAttrs.ny = attrs.y + dy;
                            shapeAttrs.x = extents.x + dx;
                            shapeAttrs.y = extents.y + dy;

                            svgBBox.attr({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny
                            });

                            calcHandles({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny,
                                width: attrs.width,
                                height: attrs.height
                            });
                            if (itemMenu) {
                                drawMenu({
                                    x: handleAttrs.nx,
                                    y: handleAttrs.ny,
                                    width: attrs.width,
                                    height: attrs.height
                                });
                            }
                        },
                        function(x, y, e) {
                            // start
                            ox = e.offsetX;
                            oy = e.offsetY;

                            calcFactors();
                            activeRendering.shape.attr({
                                cursor: 'move'
                            });
                        },
                        function() {
                            // end
                            var pos = {
                                x: shapeAttrs.x,
                                y: shapeAttrs.y
                            };

                            that.events.onDrag.fire(activeRendering.id, pos);
                            activeRendering.shape.attr({
                                cursor: 'default'
                            });
                        }
                        );
                    }

                    // Attaching drag and resize handlers
                    handleSet.drag(
                    function(dx, dy) {
                        // dragging here means that as element is dragged
                        // the factorial determines in which direction the
                        // shape is pulled
                        shapeAttrs.w = extents.width + 2 * dx * factors.x;
                        shapeAttrs.h = extents.height + 2 * dy * factors.y;
                        handleAttrs.nw = extents.width + 2 * dx * factors.x + (padding * 2);
                        handleAttrs.nh = extents.height + 2 * dy * factors.y + (padding * 2);
                        handleAttrs.nx = (extents.x - (padding / 4)) - (handleAttrs.nw / 2);
                        handleAttrs.ny = (extents.y - (padding / 4)) - (handleAttrs.nh / 2);
                        svgBBox.attr({
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
                        if (itemMenu) {
                            drawMenu({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny,
                                width: handleAttrs.nw,
                                height: handleAttrs.nh
                            });
                        }
                    },
                    function(x, y, e) {
                        ox = e.offsetX;
                        oy = e.offsetY;

                        calcFactors();

                    },
                    function() {
                        // update
                        var pos = {
                            width: shapeAttrs.w,
                            height: shapeAttrs.h
                        };
                        that.events.onResize.fire(activeRendering.id, pos);
                    }
                    );
                } else {
                    // show all the boxes and
                    // handles
                    svgBBox.show();
                    // adjust the SvgBBox to be around new
                    // shape
                    svgBBox.attr({
                        x: attrs.x,
                        y: attrs.y,
                        width: attrs.width,
                        height: attrs.height
                    });
                    handleSet.show();
                    midDrag.show().toFront();
                    if (itemMenu) {
                        itemMenu.show();
                        drawMenu(attrs);
                    }
                }
            };

            // Draws menu that sits at the top-right corner
            // of the shape
            drawMenu = function(args) {
                if ($.isEmptyObject(itemMenu)) {

                    menuAttrs.x = args.x + (args.width);
                    menuAttrs.y = args.y - (padding * 4) - 2;
                    menuAttrs.w = 100;
                    menuAttrs.h = 20;

                    eAttrs = {
                        x: menuAttrs.x + 2,
                        y: menuAttrs.y + 2,
                        w: (menuAttrs.w / 2) - 4,
                        h: menuAttrs.h - (menuAttrs.h / 8)
                    };

                    dAttrs = {
                        x: (eAttrs.x + eAttrs.w + 2),
                        y: menuAttrs.y + 2,
                        w: (menuAttrs.w / 2) - 4,
                        h: menuAttrs.h - (menuAttrs.h / 8)
                    };

                    itemMenu = paper.set();
                    that.menuContainer = paper.rect(menuAttrs.x, menuAttrs.y, menuAttrs.w, menuAttrs.h);
                    that.menuContainer.attr({
                        fill: '#FFFFFF',
                        stroke: '#000'
                    });

                    itemMenu.push(that.menuContainer);

                    that.editButton = paper.rect(eAttrs.x, eAttrs.y, eAttrs.w, eAttrs.h);
                    that.editButton.attr({
                        fill: 334009,
                        cursor: 'pointer'
                    });

                    itemMenu.push(that.editButton);

                    that.deleteButton = paper.rect(dAttrs.x, dAttrs.y, dAttrs.w, dAttrs.h);
                    that.deleteButton.attr({
                        fill: 334009,
                        cursor: 'pointer'
                    });

                    itemMenu.push(that.deleteButton);
                    // attach event firers
                    that.editButton.mousedown(function() {
                        if (activeRendering !== undefined) {
                            that.events.onEdit.fire(activeRendering.id);
                        }
                    });

                    that.deleteButton.mousedown(function() {
                        if (activeRendering !== undefined) {
                            that.events.onDelete.fire(activeRendering.id);
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
                    that.menuContainer.attr({
                        x: menuAttrs.x,
                        y: menuAttrs.y
                    });
                    that.editButton.attr(eAttrs);
                    that.deleteButton.attr(dAttrs);
                }
            };

            itemDeleted = function() {
                // set rendering to undefined
                binding.detachRendering();
                activeRendering = undefined;

                itemMenu.hide();
                svgBBox.hide();
                handleSet.hide();
                midDrag.hide();
            };

			handleCalculationData = {
				ul:  [ 'nw', 0,  0, 0,  0 ],
				top: [  'n', 1,  0, 0,  0 ],
				ur:  [ 'ne', 2, -1, 0,  0 ],
				rgt: [  'e', 2, -1, 1, -1 ],
				lr:  [ 'se', 2, -1, 2, -1 ],
				btm: [  's', 1,  0, 2, -1 ],
				ll:  [ 'sw', 0,  0, 2, -1 ],
				lft: [  'w', 0,  0, 1,  0 ],
				mid: ['pointer', 1, 0, 1, 0]
			};
			
            calcHandles = function(args) {
                // calculate where the resize handles
                // will be located
				var calcHandle = function(type, xn, xp, yn, yp) {
					return {
						x: args.x + xn * args.width / 2 + xp * padding,
						y: args.y + yn * args.height / 2 + yp * padding,
						cursor: type === "pointer" ? type : type + "-resize"
					};
				},
				recalcHandle = function(info, xn, xp, yn, yp) {
					var el;
					info.x = args.x + xn * args.width/2 + xp*padding;
					info.y = args.y + yn * args.height/2 + yp*padding;
					el = paper.getById(info.id);
					el.attr({
						x: info.x,
						y: info.y
					});
				};
                $.each(dirs,
                function(i, o) {
					var data = handleCalculationData[o];
					if(handles[o] === undefined) {
						handles[o] = calcHandle(data[0], data[1], data[2], data[3], data[4]);
					}
					else {
						recalcHandle(handles[o], data[1], data[2], data[3], data[4]);
					}
/*                    switch (o) {
                    case 'ul':
                        if (handles.ul === undefined) {
                            handles.ul = calcHandle('nw', 0, 0, 0, 0);
                        } else {
							recalcHandle(handles.ul, 0, 0, 0, 0);
                        }
                        break;
                    case 'top':
                        if (handles.top === undefined) {
                            handles.top = calcHandle('n', 1, 0, 0, 0);
                        } else {
							recalcHandle(handles.top, 1, 0, 0, 0);
                        }
                        break;
                    case 'ur':
                        if (handles.ur === undefined) {
                            handles.ur = calcHandle('ne', 2, -1, 0, 0);
                        } else {
							recalcHandle(handles.ur, 2, -1, 0, 0);
                        }
                        break;
                    case 'rgt':
                        if (handles.rgt === undefined) {
                            handles.rgt = calcHandle('e', 2, -1, 1, -1);
                        } else {
							recalcHandle(handles.rgt, 2, -1, 1, -1);
                        }
                        break;
                    case 'lr':
                        if (handles.lr === undefined) {
                            handles.lr = calcHandle('se', 2, -1, 2, -1);
                        } else {
							recalcHandle(handles.lr, 2, -1, 2, -1);
                        }
                        break;
                    case 'btm':
                        if (handles.btm === undefined) {
                            handles.btm = calcHandle('s', 1, 0, 2, -1);
                        } else {
							recalcHandle(handles.btm, 1, 0, 2, -1);
                        }
                        break;
                    case 'll':
                        if (handles.ll === undefined) {
                            handles.ll = calcHandle('sw', 0, 0, 2, -1);
                        } else {
							recalcHandle(handles.ll, 0, 0, 2, -1);
                        }
                        break;
                    case 'lft':
                        if (handles.lft === undefined) {
                            handles.lft = calcHandle('w', 0, 0, 1, 0);
                        } else {
							recalcHandle(handles.lft, 0, 0, 1, 0);
                        }
                        break;
                    case 'mid':
                        if (handles.mid === undefined) {
                            handles.mid = calcHandle('pointer', 1, 0, 1, 0);
                        } else {
							recalcHandle(handles.mid, 1, 0, 1, 0);
                        }
                        break;
                    } */
                });
            };
        };

        return that;
    };

    MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.annoActiveController", {
        bind: {
            events: {
                onClick: "preventable",
                onDelete: "preventable",
                onUpdate: "preventable"
            }
        }
    });

    /*
* Annotation Active Controller
* Handles HTML annotation lens
*/
    OAC.Client.StreamingVideo.Controller.annoActiveController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.annoActiveController", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var editStart,
            editEnd,
            editUpdate,
            annoEl = binding.locate('annotation'),
            bodyContent = binding.locate('body'),
            allAnnos = binding.locate('annotations'),
            textArea = binding.locate('textarea'),
            editArea = binding.locate('editarea'),
            editButton = binding.locate('editbutton'),
            updateButton = binding.locate('updatebutton'),
            deleteButton = binding.locate('deletebutton');

            binding.renderings = {};
            binding.active = false;

            // Event registration function - ties elements to
            // event handlers above

            editStart = function() {
                $(editArea).show();
                $(bodyContent).hide();
                binding.active = true;
                binding.events.onClick.fire(opts.itemId);
            };

            editEnd = function() {
                $(editArea).hide();
                $(bodyContent).show();
                binding.active = false;
            };

            editUpdate = function(e) {
                var data = $(textArea).val();
                e.preventDefault();
                binding.events.onUpdate.fire(opts.itemId, data);
                editEnd();
            };

            $(bodyContent).bind('dblclick',
            function(e) {
                e.preventDefault();
                if (binding.active) {
                    editEnd();
                } else {
                    editStart();
                }
            });

            $(annoEl).bind('click',
            function(e) {
                // binding.events.onClick.fire(opts.itemId);
                options.application.setActiveAnnotation(opts.itemId);
            });

            options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id !== opts.id && binding.active) {
                    editUpdate({
                        preventDefault: function() {}
                    });
                    editEnd();
                }
            });

        };
        return that;
    };

    MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.canvasClickController", {
        bind: {
            events: {
                onClick: "preventable"
            }
        }
    });
    /*
* Canvas Controller
* Listens for all clicks on the canvas and connects shapes with the
* Edit controller above
*/
    OAC.Client.StreamingVideo.Controller.canvasController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.canvasClickController", options);
        options = that.options;

        // Create the object passed back to the Presentation
        that.applyBindings = function(binding, opts) {
            var ox,
            oy,
            extents,
            activeId,
            container = binding.locate('svg'),
            closeEnough = opts.closeEnough,
            dx,
            dy,
            x,
            y,
            w,
            h,
            paper = opts.paper,
            offset = $(container).offset(),
            attachDragResize = function(id) {
				var o;
                if ((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
                    return;
                }
                o = binding.renderings[id];
                if (o === undefined) {
                    // de-activate rendering and all other listeners
                    binding.events.onClick.fire(undefined);
                    // hide the editBox
                    // editBoxController.deActivateEditBox();
                    binding.curRendering = undefined;
                    return false;
                }

                binding.curRendering = o;

            },
            detachDragResize = function(id) {
                if ((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
                    return;
                }
                var o = binding.renderings[id];
            };

            options.application.events.onActiveAnnotationChange.addListener(attachDragResize);

            binding.renderings = {};

            binding.curRendering = undefined;


            // Add to events
            binding.registerRendering = function(newRendering) {
                binding.renderings[newRendering.id] = newRendering;
            };

            binding.removeRendering = function(oldRendering) {
                var tmp = {},
                el;
                delete binding.renderings[oldRendering.id];
                /*
			$.each(binding.renderings, function (i,o) {
				if(i !== oldRendering.id) {
					tmp[i] = o;
				}
			});
			binding.renderings = $.extend(true, {}, tmp);
			*/
            };

            $(container).bind('mousedown',
            function(e) {
                activeId = '';
                offset = $(container).offset();

                ox = Math.abs(e.pageX - offset.left);
                oy = Math.abs(e.pageY - offset.top);
                if (binding.curRendering !== undefined) {
                    extents = binding.curRendering.getExtents();
                    dx = Math.abs(ox - extents.x);
                    dy = Math.abs(oy - extents.y);
                    if (dx <= extents.width / 2 + 3 && dy <= extents.height / 2 + 3) {
                        // nothing has changed
                        return;
                    }
                }
                $.each(binding.renderings,
                function(i, o) {
                    extents = o.getExtents();

                    dx = Math.abs(ox - extents.x);
                    dy = Math.abs(oy - extents.y);
                    // the '3' is for the drag boxes around the object
                    if (dx <= extents.width / 2 + 3 && dy <= extents.height / 2 + 3) {
                        activeId = o.id;
                        if ((binding.curRendering === undefined) || (o.id !== binding.curRendering.id)) {
                            binding.curRendering = o;
                            options.application.setActiveAnnotation(o.id);
                        }
                        // stop running loop
                        return false;
                    }
                });
                if ((activeId.length === 0) && (binding.curRendering !== undefined)) {
                    // No shapes selected - de-activate current rendering and all other possible renderings
                    options.application.setActiveAnnotation(undefined);

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
	MITHGrid.Presentation.namespace("AnnotationList");
	MITHGrid.Presentation.AnnotationList.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("AnnotationList", container, options), activeRenderingId;

		// that.annoListController = annoActiveController.bind($(container), {});
		that.eventActiveRenderingChange = function(id) {
			var rendering;
			if(typeof activeRenderingId !== "undefined" && activeRenderingId !== null) {
				rendering = that.renderingFor(activeRenderingId);
			}
			if(activeRenderingId !== id) {
				if(rendering !== null && typeof rendering !== "undefined" && typeof rendering.makeInactive !== "undefined") {
					rendering.makeInactive();
				}
				if(typeof id !== "undefined" && id !== null) {
					rendering = that.renderingFor(id);
					if(rendering && typeof rendering.makeActive !== "undefined") {
						rendering.makeActive();
					}
				}
				activeRenderingId = id;
			}
		};
		
		return that;
	};

	MITHGrid.Presentation.namespace("RaphaelCanvas");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphaelCanvas", container, options),
			id = $(container).attr('id'), h, w, activeRenderingId, 
			canvasController, keyBoardController, editBoxController;
		
		canvasController = OAC.Client.StreamingVideo.Controller.canvasController({
			application: that.options.application,
			selectors: {
				svg: ''
			}
		});
		
		keyBoardController = OAC.Client.StreamingVideo.Controller.keyBoardListener({
			application: that.options.application,
			selectors: {
				doc: ''
			}
		});
		
		editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({
			application: that.options.application
		});
			
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

		that.eventActiveRenderingChange = function(id) {
			var rendering;
			if(typeof activeRenderingId !== "undefined" && activeRenderingId !== null) {
				rendering = that.renderingFor(activeRenderingId);
			}
			if(activeRenderingId !== id) {
				if(rendering !== null && typeof(rendering) !== "undefined" && typeof(rendering.makeInactive) !== "undefined") {
					rendering.makeInactive();
				}
				if(typeof id !== "undefined" && id !== null) {
					rendering = that.renderingFor(id);
					if(rendering !== null && typeof(rendering) !== "undefined" && typeof rendering.makeActive !== "undefined") {
						rendering.makeActive();
					}
				}
				activeRenderingId = id;
			}
		};
				
		return that;
	};
}(jQuery, MITHGrid, OAC));
// End of Presentation constructors
// End of OAC Video Annotator

// @author Grant Dickie
