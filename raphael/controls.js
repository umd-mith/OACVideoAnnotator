/*
* Controls Application
* Sets up the buttons and options for the Raphael Canvas annotator
* @author Grant Dickie
*/ 

(function($, MITHGrid){
	MITHGrid.Application.namespace('Controls');
	MITHGrid.Application.Controls.initApp = function(container, options) {
		var that = MITHGrid.Application.initApp("MITHGrid.Application.Controls", container, $.extend(true, {}, options, {
			viewSetup: '<div id="controls_anno"></div>',
			dataStores: {
				controls: {
					types: {
						button: {}
					}
				}
			},
			dataViews: {
				buttons: {
					label: 'buttons',
					types: ["button"],
					dataStore: 'controls'
				}
			},
			presentations: {
				buttonRender: {
					type: MITHGrid.Presentation.AnnotationControls,
					container: "#controls_anno",
					dataView: 'buttons',
					lenses: {
						button: function(container, view, model, itemId) {
							var that = {}, item = model.getItem(itemId), el ='';
							
							// render the button 
							el = '<div class="button_item">'+
							'<div class="buttonClick" id="'+item.id[0]+'">'+
							item.text[0]+
							'</div>'+
							'</div>';
							
							$(container).append(el);
							
							// attach callback
							if(item.callback[0] !== undefined) {
								$("#"+item.id[0]).click(item.callback[0]);
							}
							
							that.update = function(item) {
								
							};
							
							return that;
						}
					}
				}
			}
		}));
		
		
		
		
		return that;
	};
	
})(jQuery, MITHGrid);