$(document).ready ->
	module "Streaming Video"
	
	test "Check namespace", ->
		expect 2
		ok OAC.Client?, "OAC.Client"
		ok OAC.Client.StreamingVideo?, "OAC.Client.StreamingVideo"
	
	test "Check construction", ->
		expect 19
		ok $.isFunction(app.setActiveAnnotation)?, "setActiveAnnotation"
		ok $.isFunction(app.getActiveAnnotation)?, "getActiveAnnotation"
		
		ok $.isFunction(app.setCurrentTime)?, "setCurrentTime"
		ok $.isFunction(app.getCurrentTime)?, "getCurrenTime"
		
		ok $.isFunction(app.setTimeEasement)?, "setTimeEasement"
		ok $.isFunction(app.getTimeEasement)?, "getTimeEasement"
		ok $.isFunction(app.setCurrentMode)?, "setCurrentMode"
		ok $.isFunction(app.getCurrentMode)?, "getCurrentMode"
		ok $.isFunction(app.setPlayer)?, "setPlayer"
		ok $.isFunction(app.getPlayer)?, "getPlayer"
		
		ok $.isFunction(app.initShapeLens)?, "initShapeLens"
		ok $.isFunction(app.initTextLens)?, "initTextLens"
		ok $.isFunction(app.buttonFeature)?, "buttonFeature"
		ok $.isFunction(app.addShape)?, "addShape"
		ok $.isFunction(app.addBody)?, "addBody"
		ok $.isFunction(app.addShapeType)?, "addShapeType"
		ok $.isFunction(app.insertShape)?, "insertShape"
		ok $.isFunction(app.importData)?, "importData"
		ok $.isFunction(app.exportData)?, "exportData"