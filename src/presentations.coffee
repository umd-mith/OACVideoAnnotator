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
		MITHGrid.Presentation.initPresentation "MITHGrid.Presentation.AnnotationList", args..., (that, container) ->

# ## RaphaelCanvas
#
# Presentation for the Canvas area - area that the Raphael canvas is drawn on
#
MITHGrid.Presentation.namespace "RaphaelCanvas", (RaphaelCanvas) ->
	RaphaelCanvas.initPresentation = (args...) ->
		MITHGrid.Presentation.initPresentation "MITHGrid.Presentation.RaphaelCanvas", args..., (that, container) ->
			id = $(container).attr('id')
		
			options = that.options

			# Setting up local names for the assigned presentation controllers
			canvasController = options.controllers.canvas
			keyBoardController = options.controllers.keyboard
			editBoxController = options.controllers.shapeEditBox
			shapeCreateController = options.controllers.shapeCreateBox
			windowResizeController = options.controllers.windowResize

			# x,y,w, and h coordinates are set through the CSS of the container passed in the constructor
			x = $(container).css('x')
			y = $(container).css('y')


			w = $(container).width()
			# measure the div space and make the canvas
			# to fit
			h = $(container).height()

			# Keyboard binding attached to container to avoid multiple-keyboard events from firing
			keyboardBinding = keyBoardController.bind $(container), {}

			that.events = $.extend true, that.events, keyboardBinding.events

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

			editBoundingBoxBinding = editBoxController.bind $(container),
				paper: that.canvas

			shapeCreateBinding = shapeCreateController.bind $(container),
				paper: that.canvas

			# **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
			windowResizeBinding = windowResizeController.bind window

			editBoundingBoxBinding.events.onResize.addListener (pos) ->
				activeRendering = that.getActiveRendering()
				if activeRendering? and activeRendering.eventResize?
					activeRendering.eventResize(pos)

			editBoundingBoxBinding.events.onMove.addListener (pos) ->
				activeRendering = that.getActiveRendering()
				if activeRendering? and activeRendering.eventMove?
					activeRendering.eventMove(pos)

			editBoundingBoxBinding.events.onDelete.addListener ->
				activeRendering = that.getActiveRendering()
				if activeRendering? and activeRendering.eventDelete?
					activeRendering.eventDelete()
					editBoundingBoxBinding.detachRendering()

			options.application.events.onCurrentModeChange.addListener (newMode) ->
				if newMode not in ["Select", "Drag"]
					editBoundingBoxBinding.detachRendering()

			# Adjusts the canvas area, canvas wrapper to fall directly over the
			# player area
			windowResizeBinding.events.onResize.addListener ->
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

			windowResizeBinding.events.onResize.fire()
			# to make sure we get things set up right
			#
			# Registering canvas special events for start, drag, stop
			#
			canvasBinding.events.onShapeStart.addListener (coords) ->
				shapeCreateBinding.createGuide(coords)

			canvasBinding.events.onShapeDrag.addListener (coords) ->
				shapeCreateBinding.resizeGuide(coords)

			canvasBinding.events.onShapeDone.addListener (coords) ->
				#
				# Adjust x,y in order to fit data store
				# model
				#
				shape = shapeCreateBinding.completeShape(coords)
				options.application.insertShape(shape)


			#
			# Called whenever a player is set by the Application.
			# Assumes that said player object has getcoordinates() and
			# getsize() as valid methods that return arrays.
			#
			changeCanvasCoordinates = (args) ->
				if args?
					# player passes args of x,y and width, height
					xy = args.getcoordinates()
					wh = args.getsize()
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

			options.application.events.onCurrentTimeChange.addListener (npt) ->
				that.visitRenderings (id, rendering) ->
					if rendering.eventCurrentTimeChange?
						rendering.eventCurrentTimeChange npt

			options.application.events.onTimeEasementChange.addListener (te) ->
				that.visitRenderings (id, rendering) ->
					if rendering.eventTimeEasementChange?
						rendering.eventTimeEasementChange te

			options.application.events.onPlayerChange.addListener changeCanvasCoordinates
		
			options.application.dataStore.canvas.events.onModelChange.addListener () ->
				editBoundingBoxBinding.detachRendering()

			superRender = that.render

			that.render = (c, m, i) ->
				rendering = superRender(c, m, i)

				if rendering?
					tempStore = m
					while tempStore.dataStore
						tempStore = tempStore.dataStore

					allAnnosModel = tempStore
					searchAnnos = options.dataView.prepare ['!type']

					canvasBinding.registerRendering rendering
				rendering

			superEventFocusChange = that.eventFocusChange

			that.eventFocusChange = (id) ->
				if options.application.getCurrentMode() == 'Select'
					superEventFocusChange id
					editBoundingBoxBinding.attachRendering that.getActiveRendering()

		# End of Presentation constructors