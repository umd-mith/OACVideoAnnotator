/*
 *  OAC Video Annotation Tool v0.1
 * 
 *  Developed as a plugin for the MITHGrid framework. 
 *  
 *  Date: Fri Oct 21 08:15:59 2011 -0700
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
var OAC = OAC || {};/*
Presentations for canvas.js

@author Grant Dickie
*/


(function($, MITHGrid) {
	MITHGrid.Presentation.namespace("RaphaelCanvas");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphaelCanvas", container, options),
		//create canvas object to be used outside of the Presentation - objects
		//access this to generate shapes
		id = $(container).attr('id'), h, w;
		if(options.cWidth !== undefined) {
			w = options.cWidth;
		}
		else {
			w = $(container).width();
		}
		if(options.cHeight !== undefined) {
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
		
		return that;
	};
}(jQuery, MITHGrid));(function($, MITHGrid, OAC) {
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
		dragController = OAC.Client.StreamingVideo.Controller.annotationShapeDragController({});
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
			'<div class="anno_list"></div>',
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
							c, ox, oy;
							
							$("#testdone").append("<p>Raphael Object in data store:<br/> " + JSON.stringify(item) + "</p>");
							ox = (item.x - (item.w / 2));
							oy = (item.y - (item.h / 2));

							// Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
							c = view.canvas.rect(ox, oy, item.w, item.h);
							// fill and set opacity
							c.attr({
								fill: "red",
								opacity: 1
							});
							
							dragController.bind(c, {
								model: model,
								itemId: itemId,
								x: 'x',
								y: 'y'
							});

							that.update = function(item) {

								// receiving the Object passed through
								// model.updateItems in move()
								try {
									if (item.x !== undefined && item.y !== undefined) {
										c.attr({
											x: item.x[0],
											y: item.y[0]
										});
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

							// initiate the drag feature (RaphaelJS)
							//c.drag(move, start, up);

							return that;
						},
						Ellipse: function(container, view, model, itemId) {
							var that = {},
							item = model.getItem(itemId),
							c;
							
							// create the shape
							c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0], item.h[0]);
							// fill shape
							c.attr({
								fill: "red"
							});
							
							dragController.bind(c,{
								model: model,
								itemId: itemId,
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
											cy: item.y[0]
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
		})
		);
		
		renderListItem = function(item, container) {
			var el = '<div id="'+item.id[0]+'" class="anno_item">'+
			'<p>'+item.creator[0]+'</p>'+
			'<p>'+item.bodyContent[0]+'</p>'+
			'<p>'+item.x[0]+'<br/>'+
			item.y[0]+'<br/>'+
			item.w[0]+'<br/>'+
			item.h[0]+'</p>'+
			'<div id="delete'+item.id[0]+'">X</div>'+
			'</div>';
			$("#"+item.id[0]).remove();
			$(container).append(el);
			
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
});(function($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');
	OAC.Client.StreamingVideo.Controller.annotationShapeDragController = function(options) {
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationShapeDragController", options);
		
		that.applyBindings = function(binding, opts) {
			var ox, oy, svgEl;
			
			svgEl = binding.locate('raphael');
			svgEl.drag(
				function(dx, dy) {			
					opts.model.updateItems([{
						id: opts.itemId,
						x: ox + dx,
						y: oy + dy
					}]);
				},
				function() {
					ox = parseInt(svgEl.attr(opts.x), 10);
					oy = parseInt(svgEl.attr(opts.y), 10);
				},
				function() {
					
				}
			);
		};
		
		return that;
	}
}(jQuery, MITHGrid, OAC));// End of OAC Video Annotator

// @author Grant Dickie
