# # Presentations
#
#
# Presentations for OAC:ASP Application
# @author Grant Dickie, Jim Smith
#

# ## AnnotationList
#
# Presentation that extends SimpleText in order to add new
# functionality for Annotation HTML lens
#
MITHGrid.Presentation.namespace "AnnotationList", (AnnotationList) ->
	AnnotationList.initPresentation = (args...) ->
		MITHGrid.Presentation.initPresentation "MITHGrid.Presentation.AnnotationList", args..., ->

# ## RaphaelCanvas
#
# Presentation for the Canvas area - area that the Raphael canvas is drawn on
#
MITHGrid.Presentation.namespace "RaphaelCanvas", (RaphaelCanvas) ->
	RaphaelCanvas.initPresentation = (args...) ->
		MITHGrid.Presentation.initPresentation "MITHGrid.Presentation.RaphaelCanvas", args..., (that, container) ->
			id = $(container).attr('id')
		
			options = that.options
			
			app = options.application

			# Setting up local names for the assigned presentation controllers
			canvasController = options.controllers.canvas
			keyBoardController = options.controllers.keyboard

			that.canvas = new Raphael($(container), 10, 10)

			# attach binding
			# **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
			canvasBinding = canvasController.bind $(container),
				closeEnough: 5
				paper: that.canvas
			
			boundingBoxComponent = OAC.Client.StreamingVideo.Component.ShapeEditBox.initInstance that.canvas
						
			shapeCreateBoxComponent = OAC.Client.StreamingVideo.Component.ShapeCreateBox.initInstance that.canvas

			# Keyboard binding attached to container to avoid multiple-keyboard events from firing
			keyboardBinding = keyBoardController.bind $(container), {}

			that.events = $.extend true, that.events, keyboardBinding.events

			boundingBoxComponent.events.onResize.addListener (pos) ->
				activeRendering = that.getFocusedRendering()
				if activeRendering? and activeRendering.eventResize?
					activeRendering.eventResize(pos)

			boundingBoxComponent.events.onMove.addListener (pos) ->
				activeRendering = that.getFocusedRendering()
				if activeRendering? and activeRendering.eventMove?
					activeRendering.eventMove(pos)

			boundingBoxComponent.events.onDelete.addListener ->
				activeRendering = that.getFocusedRendering()
				if activeRendering? and activeRendering.eventDelete?
					activeRendering.eventDelete()
					boundingBoxComponent.detachFromRendering()

			app.events.onCurrentModeChange.addListener (newMode) ->
				if newMode not in ["Select", "Drag"]
					boundingBoxComponent.detachFromRendering()

			# Adjusts the canvas area, canvas wrapper to fall directly over the
			# player area
			playerObj = app.getPlayer()
			
			updateLocation = ->
				# the following elements should be parts of this presentation
				if playerObj?
					[x, y] = playerObj.getCoordinates()
					[w, h] = playerObj.getSize()

					$(that.canvas.canvas).css
						left: x + 'px'
						top: y + 'px'
						#width: w + 'px'
						#height: h + 'px'
						
					that.canvas.setSize w, h

			MITHGrid.events.onWindowResize.addListener updateLocation
			
			if playerObj?
				playerObj.events.onResize.addListener updateLocation
			
			updateLocation()
			
			# to make sure we get things set up right
			#
			# Registering canvas special events for start, drag, stop
			#
			canvasBinding.events.onShapeStart.addListener shapeCreateBoxComponent.createGuide 

			canvasBinding.events.onShapeDrag.addListener shapeCreateBoxComponent.resizeGuide

			canvasBinding.events.onShapeDone.addListener (coords) ->
				#
				# Adjust x,y in order to fit data store
				# model
				#
				shape = shapeCreateBoxComponent.completeShape coords
				if shape.height > 1 and shape.width > 1
					app.insertShape shape

			app.events.onCurrentTimeChange.addListener (npt) ->
				that.visitRenderings (id, rendering) ->
					if rendering.eventCurrentTimeChange?
						rendering.eventCurrentTimeChange npt

			app.events.onTimeEasementChange.addListener (te) ->
				that.visitRenderings (id, rendering) ->
					if rendering.eventTimeEasementChange?
						rendering.eventTimeEasementChange te

			superEventFocusChange = that.eventFocusChange

			that.eventFocusChange = (id) ->
				if app.getCurrentMode() == 'Select'
					superEventFocusChange id
					boundingBoxComponent.attachToRendering that.getFocusedRendering()
					canvasBinding.toBack()

		# End of Presentation constructors