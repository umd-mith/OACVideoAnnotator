	
)(jQuery, MITHGrid, OAC)

# # Default Configurations
#

MITHGrid.defaults "OAC.Client.StreamingVideo.Player.DriverBinding",
	events:
		onResize: null
		onPlayheadUpdate: null

# ## Component.ShapeEditBox
#
# Bindings created by this controller will have the following events:
#
# - onResize
# - onMove
# - onDelete
# - onFocus
# - onUnfocus
MITHGrid.defaults "OAC.Client.StreamingVideo.Component.ShapeEditBox",
	dirs: ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid']
	events:
		onResize: null
		onMove: null
		onDelete: null
		onFocus: null
		onUnfocus: null


# ## Controller.CanvasClickController
#
# Bindings created by this controller will have the following events:
#
# - onShapeStart
# - onShapeDrag
# - onShapeDone
MITHGrid.defaults "OAC.Client.StreamingVideo.Controller.CanvasClickController",
	bind:
		events:
			onShapeStart: null
			onShapeDrag: null
			onShapeDone: null

# ## Component.ModeButton
#
# Bindings created by this controller will have the following events:
#
# - onCurrentModeChange
MITHGrid.defaults "OAC.Client.StreamingVideo.Component.ModeButton",
	bind:
		events:
			onCurrentModeChange: null

# ## Controller.ShapeCreateBox
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Controller.ShapeCreateBox",
	bind:
		events: { }

# ## Controller.Drag
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Controller.Drag",
	bind:
		events:
			onFocus: null
			onUnfocus: null
			onUpdate: null

# ## Controller.Select
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Controller.Select",
	bind:
		events:
			onSelect: null
	isSelectable: -> true

# ## Annotation Client
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Application",
	controllers:
		canvas:
			type: OAC.Client.StreamingVideo.Controller.CanvasClickController
			selectors:
				svgwrapper: ''
		selectShape:
			type: OAC.Client.StreamingVideo.Controller.Select
			selectors:
				raphael: ''
	variables:
		# **ActiveAnnotation** holds the item ID of the annotation currently receiving selection focus.
		#
		# - setActiveAnnotation(id) sets the id
		# - getActiveAnnotation() returns the id
		# - lockActiveAnnotation() keeps it from being changed
		# - unlockActiveAnnotation() undoes a previous call to lockActiveAnnotation()
		# - events.onActiveAnnotationChange fires when the ActiveAnnotation value changes
		ActiveAnnotation:
			is: 'rwl'

		# **CurrentTime** holds the current position of the video play head in seconds. The value defaults to 0 seconds.
		#
		# - setCurrentTime(time) sets the play head position for the annotation client (does not affect the player)
		# - getCurrentTime() returns the current play head position
		# - events.onCurrentTimeChange fires when the CurrentTime value changes
		CurrentTime:
			is: 'rw'
			"default": 0

		# **TimeEasement** holds the number of seconds an annotation eases in or out of full view.
		#
		# - setTimeEasement(t)
		# - getTimeEasement()
		# - events.onTimeEasementChange
		TimeEasement:
			is: 'rw',
			"default": 5

		# **CurrentMode** holds the current interaction mode for the annotation client. Values may be a shape type,
		# "Watch", or "Select".
		#
		# - setCurrentMode(mode) sets the annotation client mode
		# - getCurrentMode() returns the current annotation client mode
		# - events.onCurrentModeChange fires when the CurrentMode value changes
		CurrentMode:
			is: 'rw'

	dataViews:
		# **currentAnnotations** pages a range of times through the annotation store selecting those
		# annotations which have a time range (.npt\_start through .npt\_end) that fall within the time
		# range set.
		currentAnnotations:
			dataStore: 'canvas'
			type: MITHGrid.Data.RangePager
			leftExpressions: [ '.npt_start' ]
			rightExpressions: [ '.npt_end' ]

	# Data store for the Application
	dataStores:
		# **canvas** holds all of the annotation data for the client.
		canvas:
			types:
				# All annotation items are of type "Annotation"
				Annotation: {}
			# The following properties are understood by the annotation client:
			properties:
				# - shapeType indicates which shape is used as the SVG constraint within the frame (e.g., Rectangle or Ellipse)
				shapeType:
					valueType: 'text'
				# - bodyType indicates what kind of body the annotation associates with the target (e.g., Text)
				bodyType:
					valueType: 'text'
				# - bodyContent holds the byte stream associated with the annotation body
				bodyContent:
					valueType: 'text'
				# - targetURI points to the annotation target video without time constraints
				targetURI:
					valueType: 'uri'
				# - the play head position at which this annotation becomes active/current
				npt_start:
					valueType: "numeric"
				# - the play head position at which this annotation ceases being active/current
				npt_end: 
					valueType: "numeric"
	presentations: 
		raphsvg:
			type: OAC.Client.StreamingVideo.Presentation.RaphaelCanvas
			container: ".canvas"
			lenses: {}
			lensKey: ['.shapeType']
			dataView: 'currentAnnotations'
			# The controllers are configured for the application and passed in to the presentation's
			# initInstance method as named here.
			controllers:
				canvas: "canvas"
	# We create a general template that holds all of the different DOM elements we need:
	#
	# * the SVG view that will overlay the play surface (myCanvasId is the DOM id)
	#
	viewSetup: """
		<div class="canvas"></div>
	"""