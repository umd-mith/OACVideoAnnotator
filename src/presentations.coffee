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

			# x,y,w, and h coordinates are set through the CSS of the container passed in the constructor
			x = $(container).css('x')
			y = $(container).css('y')

			w = $(container).width()
			# measure the div space and make the canvas
			# to fit
			h = $(container).height()
			
			# init RaphaelJS canvas
			# Parameters for Raphael:
			# * @x: value for top left corner
			# * @y: value for top left corner
			# * @w: Integer value for width of the SVG canvas
			# * @h: Integer value for height of the SVG canvas
			# Create canvas at xy and width height
			that.canvas = new Raphael($(container), w, h)

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
			updateLocation = ->
				# the following elements should be parts of this presentation
				canvasEl = $('body').find('svg')
				containerEl = $(options.playerWrapper)
				htmlWrapper = $(container)
				x = parseInt($(containerEl).offset().left, 10)
				y = parseInt($(containerEl).offset().top, 10)
				w = parseInt($(containerEl).width(), 10)
				h = parseInt($(containerEl).height(), 10)

				$(canvasEl).css
					left: x + 'px'
					top: y + 'px'
					width: w + 'px'
					height: h + 'px'

				$(htmlWrapper).css
					left: x + 'px'
					top: y + 'px'
					width: w + 'px'
					height: h + 'px'

			MITHGrid.events.onWindowResize.addListener updateLocation
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

			#
			# Called whenever a player is set by the Application.
			# Assumes that said player object has getcoordinates() and
			# getsize() as valid methods that return arrays.
			#
			app.events.onPlayerChange.addListener (player) ->
				if player?
					# player passes args of x,y and width, height
					xy = player.getcoordinates()
					wh = player.getsize()
					# move container and change size
					$(container).css
						left: parseInt(xy[0], 10) + 'px'
						top: parseInt(xy[1], 10) + 'px'
						width: wh[0]
						height: wh[1]

					# Move canvas SVG to this location
					$('svg').css
						left: parseInt(xy[0], 10) + 'px'
						top: parseInt(xy[1], 10) + 'px'
						width: wh[0],
						height: wh[1]
				
					updateLocation()

			superEventFocusChange = that.eventFocusChange

			that.eventFocusChange = (id) ->
				if app.getCurrentMode() == 'Select'
					superEventFocusChange id
					boundingBoxComponent.attachToRendering that.getFocusedRendering()
					canvasBinding.toBack()

		# End of Presentation constructors