/*
* Controller testing
*
*
*/

$(document).ready(function() {
	module('Controllers');
	
	test("canvasClickController", function() {
		expect(3);
		var canvas = OAC.Client.StreamingVideo.initApp('#qunit-fixture', {width: 100, height: 100}),
		checkCanvasClick = function(id) {
			console.log('click');
			ok(id.length === 0, "Click event returned no shapes clicked");
		};
		
		ok($.isFunction(Controller.canvasController), "OAC.Client.StreamingVideo.Controller.canvasController is defined");
		
		// test for activeAnnotation tests
		ok(canvas.events.onActiveAnnotationChange, "canvas.events.onActiveAnnotationChange");
		
		// hook up canvas event with activeannotationchange event
		
		
		canvas.events.onActiveAnnotationChange.addListener(checkCanvasClick);
		$("#canvasSVG")[0].click();
		
	});
	
	test("OAC.Client.StreamingVideo.Controller.keyBoardListener", function() {
		expect(1);
		ok($.isFunction(OAC.Client.StreamingVideo.Controller.keyBoardListener), "OAC.Client.StreamingVideo.Controller.keyBoardListener is defined");
	});
	
	test("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", function() {
		expect(1);
		ok($.isFunction(OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid), "OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid is defined");
	});
	
	test("OAC.Client.StreamingVideo.Controller.annoActiveController", function() {
		expect(1);
		ok($.isFunction(OAC.Client.StreamingVideo.Controller.annoActiveController), "OAC.Client.StreamingVideo.Controller.annoActiveController is defined");
	});
});