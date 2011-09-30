/*
 *  OAC Video Annotation Tool
 * 
 *  Developed as a plugin for the MITHGrid framework. 
 *  
 *  Date: Thu Sep 29 16:46:37 2011 -0400
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
var fluid = fluid || {};
var Raphael = Raphael || {};/*
Presentations for canvas.js

@author Grant Dickie
*/


(function($, MITHGrid) {
	MITHGrid.Presentation.namespace("RaphSVG");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphSVG.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphSVG", container, options),
		//create canvas object to be used outside of the Presentation - objects
		//access this to generate shapes
		id = $(container).attr('id'), h, w;
		
		if(options.cWidth && options.cHeight) {
			w = options.cWidth;
			h = options.cHeight;
		} else {
			// measure the div space and make the canvas
			// to fit
			w = $(container).width();
			h = $(container).height();
		}
		// init RaphaelJS canvas
		that.canvas = new Raphael(id, w, h);
		
		
		
		return that;
	};
}(jQuery, MITHGrid));(function($, MITHGrid) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/
	
	
	// Set the namespace for the Canvas application
	MITHGrid.Application.namespace("Canvas");
	MITHGrid.Application.Canvas.initApp = function(container, options) {
	
		var that = MITHGrid.Application.initApp("MITHGrid.Application.Canvas", container, $.extend(true, {}, options, {
			dataViews: {
				// view for the space in which data from shapes
				// is drawn
				drawspace: {
					dataStore: 'canvas',
					types: ["paper", "shape"],
					label: 'drawspace'
				},
				shapes: {
					dataStore: 'canvas',
					types: ["shape"],
					label: 'shapes',
					filters: [".posInfo"]
				}
			},
			viewSetup: '<h3>Canvas Area</h3><div id="canvasSVG"></div><div id="testdone"></div><button id="loadrect">Load SVG Shape</button>',
			presentations: {
				raphsvg: {
					type: MITHGrid.Presentation.RaphSVG,
					container: "#canvasSVG",
					dataView: 'drawspace',
					lenses: {
						shape: function(container, view, model, itemId) {
							var that = {},
							item = model.getItem(itemId);
							
							$("#testdone").append("<p>Rect object: "+JSON.stringify(item)+"</p>");
							
							// attach the svg element to the paper object
							if(item.shapeType[0] === 'rect') {
								view.canvas.rect(item.posInfo[0].x, item.posInfo[0].y, item.posInfo[0].w, item.posInfo[0].h);
							}
						}
					},
					cWidth: options.width,
					cHeight: options.height
				}
			}
			
		})
		);
		
		that.ready(function() {
		
			
			$("#loadrect").click(function(e) {
				e.preventDefault();
				
				// create a shape object
				
				
				that.dataStore.canvas.loadItems([{
					id: "rect1",
					type: "shape",
					shapeType: 'rect',
					posInfo: {
						w: 100,
						h: 100,
						x: 110,
						y: 23
					}
				}]);
			});
		});
		
		return that;
	};
	

	
	// Default library for the Canvas application
	fluid.defaults("MITHGrid.Application.Canvas", {
		// Data store for the Application
		dataStores: {
			canvas: {
				types:{
					// the plane that is being drawn on
					paper: {}, 
				
					// types of shapes -- to add a new
					// shape object, add it here
					shape: {}
				},
				properties: {
					// posInfo contains the SVG dimensions for 
					// a shape
					posInfo: {
						type: "Item"
					}
				}
				
			}
			
		}
	});
	 
}(jQuery, MITHGrid));// End of OAC Video Annotator

// @author Grant Dickie
