# # Controllers
#
OAC.Client.StreamingVideo.namespace 'Controller', (Controller) ->
	# ## KeyboardListener
	#
	# OAC.Client.StreamingVideo.Controller.KeyboardListener listens to keydown events on the DOM document
	# level and translates them into delete events.
	#
	Controller.namespace "KeyboardListener", (KeyboardListener) ->

		# ### KeyboardListener.initController
		#
		# Parameters:
		#
		# * options - object holding configuration options for the KeyboardListener object
		#
		# Returns:
		#
		# The configured KeyboardListener controller.
		#
		# Options:
		#
		# * application - the application using this controller
		# * isAction - a function which returns true if keyboard events should be propagated
		#
		KeyboardListener.initController = (args...) ->			
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Controller.KeyboardListener", args..., (that) ->
				options = that.options

				that.applyBindings = (binding, opts) ->
					doc = binding.locate('doc')

					options.application.events.onActiveAnnotationChange.addListener (id) ->
						activeId = id

					$(doc).keydown (e) ->
						if options.application.getCurrentMode() == 'Editing'
							return

						if activeId?
							# If backspace or delete is pressed,
							# then it is interpreted as a
							# delete call.
							if e.keyCode in [8, 46]
								binding.events.onDelete.fire activeId
								activeId = null

	# ## Drag
	#
	# Attaches to an SVG rendering and produces events at the start, middle, and end of a drag.
	#
	Controller.namespace "Drag", (Drag) ->

		# ### Drag.initController
		#
		Drag.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.Drag", args..., (that) ->
				that.applyBindings = (binding, opts) ->
					el = binding.locate('raphael')

					dstart = (x, y, e) ->
						# **FIXME**: layerX and layerY are deprecated in WebKit
						x = e.layerX
						y = e.layerY
						binding.events.onFocus.fire x, y
					dend = ->
						binding.events.onUnfocus.fire()
					dmid = (x, y) ->
						binding.events.onUpdate.fire x, y
					
					el.drag dmid, dstart, dend

	# ## Select
	#
	# Attaches a click handler to an SVG rendering and fires an onSelect event if the rendering is clicked AND
	# the application is in a mode to select things.
	#
	Controller.namespace "Select", (Select) ->

		# ### Select.initController
		#
		# Parameters:
		#
		# * options - object holding configuration information
		#
		# Returns:
		#
		# The configured controller object.
		#
		# Configuration Options:
		#
		# * isSelectable - function taking no arguments that should return "true" if the click should cause the
		#				   onSelect event to fire.
		#
		Select.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.Select", args..., (that) ->
				options = that.options

				that.applyBindings = (binding) ->
					el = binding.locate("raphael")

					el.click (e) ->
						if options.isSelectable()
							binding.events.onSelect.fire()

	# ## AnnotationEditSelectionGrid
	#
	# Attaches to an SVG lens and creates a green rectangle dashed box to
	# act as the resize and drag tool. Only edits the SVG data - no annotation
	# bodyContent data.
	Controller.namespace "AnnotationEditSelectionGrid", (AnnotationEditSelectionGrid) ->

		# ### AnnotationEditSelectionGrid.initController
		#
		# Initializes the AnnotationEditSelectionGrid controller object. This object may then be used to bind actions to
		# the DOM.
		#
		# We create the bounding box once and keep it around. We then track which rendering is associated with
		# the bounding box and draw it accordingly.
		# We associate the bounding box with the SVG/Raphaël canvas holding the renderings we want to use it with.
		#
		# Each Raphaël canvas should have its own AnnotationEditSelectionGrid instance for binding renderings.
		#
		# Parameters:
		#
		# * options - object holding configuration information
		#
		# Returns:
		#
		# The initialized controller object.
		#
		# **FIXME:**
		#
		# The controller needs to be broken up a bit. The idea of providing a bounding box for renderings is something that
		# should be handled in the presentation, not here. The controller should just generate events based on user interactions.
		# The presentation should worry about which rendering is currently active and manage the translation of controller
		# events to the rendering.
		#
		# For now, we'll refactor this into two pieces: the bounding box drawing (rendering), and translating events in the binding.
		#
		# We will eventually split this controller into two: bounding box resize controller and bounding box drag/move controller.
		#
		AnnotationEditSelectionGrid.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid", args..., (that) ->
				options = that.options
				dirs = that.options.dirs
				dragController = OAC.Client.StreamingVideo.Controller.Drag.initController {}

				# #### AnnotationEditSelectionGrid #applyBindings
				#
				that.applyBindings = (binding, opts) ->
					handleSet = {}
					midDrag = {}
					svgBBox = {}
					itemMenu = {}
					handles = {}
					deleteButton = {}
					editButton = {}
					menuContainer = {}
					factors = {}
					paper = opts.paper
					attrs = {}
					padding = 5
					handleIds = {}
					drawHandles
					handleAttrs = {}
					shapeAttrs = {}
					menuAttrs = {}
					dAttrs = {}
					eAttrs = {}
					handleCalculationData = {}

					# ### attachRendering
					#
					# Function for applying a new shape to the bounding box
					#
					# Parameters:
					#
					# * newRendering -
					binding.attachRendering = (newRendering) ->
						binding.detachRendering()

						if !newRendering?
							return

						# register the rendering
						activeRendering = newRendering
						calcFactors()
						drawHandles()

					# Function to call in order to "de-activate" the edit box
					# (i.e. make it hidden)
					binding.detachRendering = () ->
						if $.isEmptyObject(handleSet)
							return
						activeRendering = undefined
						handleSet.hide()

						svgBBox.hide()
						midDrag.hide()
						if itemMenu
							itemMenu.hide()

					# ##### calcFactors (private)
					#
					# Measures where the handles should be on mousemove.
					#
					# Parameters: None.
					#
					# Returns: Nothing.
					#
					calcFactors = () ->
						extents = activeRendering.getExtents()

						# create offset factors for
						# bounding box
						# calculate width - height to be larger
						# than shape
						attrs.width = extents.width + (2 * padding)
						attrs.height = extents.height + (2 * padding)
						attrs.x = (extents.x - (padding / 8)) - (attrs.width / 2)
						attrs.y = (extents.y - (padding / 8)) - (attrs.height / 2)
						calcHandles(attrs)
						if itemMenu
							drawMenu(attrs)

					# #### drawHandles (private)
					#
					# Draws the handles defined in dirs as SVG rectangles and draws the SVG bounding box
					#
					# Parameters: None.
					#
					# Returns: Nothing.
					#
					drawHandles = () ->
						if $.isEmptyObject(handleSet)

							# draw the corner and mid-point squares
							handleSet = paper.set()
							for i, o of handles
								if i == 'mid'
									midDrag = paper.rect(o.x, o.y, padding, padding)
									o.id = midDrag.id
								else
									h = paper.rect(o.x, o.y, padding, padding)
									o.id = h.id

									h.attr
										cursor: o.cursor
									handleSet.push h

							# make them all similar looking
							handleSet.attr
								fill: 990000
								stroke: 'black'

							if !$.isEmptyObject(midDrag)
								midDrag.attr
									fill: 990000,
									stroke: 'black'
									cursor: 'move'

							# drawing bounding box
							svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
							svgBBox.attr
								stroke: 'green'
								'stroke-dasharray': ["--"]

							# Draw the accompanying menu that sits at top-right corner
							drawMenu attrs

							if !$.isEmptyObject(midDrag)

								# Attaching listener to drag-only handle (midDrag)
								midDragDragBinding = dragController.bind(midDrag)

								midDragDragBinding.events.onUpdate.addListener (dx, dy) ->
									# dragging means that the svgBBox stays padding-distance
									# away from the lens' shape and the lens shape gets updated
									# in dataStore
									handleAttrs.nx = attrs.x + dx
									handleAttrs.ny = attrs.y + dy
									shapeAttrs.x = extents.x + dx
									shapeAttrs.y = extents.y + dy

									svgBBox.attr
										x: handleAttrs.nx,
										y: handleAttrs.ny

									calcHandles
										x: handleAttrs.nx
										y: handleAttrs.ny
										width: attrs.width
										height: attrs.height

									if itemMenu
										drawMenu
											x: handleAttrs.nx
											y: handleAttrs.ny
											width: attrs.width
											height: attrs.height

								midDragDragBinding.events.onFocus.addListener (x, y) ->
									# start
									ox = x
									oy = y
									calcFactors()
									activeRendering.shape.attr
										cursor: 'move'

								midDragDragBinding.events.onUnfocus.addListener ->
									# end
									binding.events.onMove.fire
										x: shapeAttrs.x,
										y: shapeAttrs.y

							# Attaching drag and resize handlers
							handleSet.forEach (handle) ->
								handleBinding = dragController.bind(handle)

								handleBinding.events.onUpdate.addListener (dx, dy) ->
									# onmove function - handles dragging
									# dragging here means that the shape is being resized;
									# the factorial determines in which direction the
									# shape is pulled
									shapeAttrs.w = Math.abs extents.width + dx * factors.x
									shapeAttrs.h = Math.abs extents.height + dy * factors.y
									handleAttrs.nw = shapeAttrs.w + padding * 2
									handleAttrs.nh = shapeAttrs.h + padding * 2
									handleAttrs.nx = (extents.x - (padding / 4)) - (handleAttrs.nw / 2)
									handleAttrs.ny = (extents.y - (padding / 4)) - (handleAttrs.nh / 2)

									svgBBox.attr
										x: handleAttrs.nx
										y: handleAttrs.ny
										width: handleAttrs.nw
										height: handleAttrs.nh

									calcHandles
										x: handleAttrs.nx
										y: handleAttrs.ny
										width: handleAttrs.nw
										height: handleAttrs.nh

									if itemMenu
										drawMenu
											x: handleAttrs.nx
											y: handleAttrs.ny
											width: handleAttrs.nw
											height: handleAttrs.nh

								handleBinding.events.onFocus.addListener (x, y) ->
									# onstart function
									extents = activeRendering.getExtents()
									ox = x
									oy = y

									# change mode
									options.application.setCurrentMode('Drag')
									# extents: x, y, width, height
									px = (8 * (ox - extents.x) / extents.width) + 4
									py = (8 * (oy - extents.y) / extents.height) + 4
									if px < 3
										factors.x = -2
									else if px < 5
										factors.x = 0
									else
										factors.x = 2
									if py < 3
										factors.y = -2
									else if py < 5
										factors.y = 0
									else
										factors.y = 2
									calcFactors()

								handleBinding.events.onUnfocus.addListener () ->
									# onend function
									# update
									if activeRendering?
										binding.events.onResize.fire
											width: shapeAttrs.w
											height: shapeAttrs.h
									# change mode back
									options.application.setCurrentMode 'Select'
						else
							# show all the boxes and
							# handles
							svgBBox.show()
							# adjust the SvgBBox to be around new
							# shape
							svgBBox.attr
								x: attrs.x
								y: attrs.y
								width: attrs.width
								height: attrs.height

							handleSet.show()
							midDrag.show().toFront()
							if itemMenu
								itemMenu.show()
								drawMenu(attrs)

					# #### drawMenu (private)
					#
					# Draws menu that sits at the top-right corner of the shape.
					#
					# Parameters:
					#
					# * args - object holding the .x, .y, and .width properties
					#
					# Returns: Nothing.
					#
					drawMenu = (args) ->
						if $.isEmptyObject(itemMenu)
							menuAttrs.x = args.x + (args.width)
							menuAttrs.y = args.y - (padding * 4) - 2
							menuAttrs.w = 100
							menuAttrs.h = 20
							# Create separate attribute objects
							# for each menu button/container
							eAttrs =
								x: menuAttrs.x + 2
								y: menuAttrs.y + 2
								w: menuAttrs.w / 2 - 4
								h: menuAttrs.h - (menuAttrs.h / 8)

							dAttrs =
								x: (eAttrs.x + eAttrs.w + 2)
								y: menuAttrs.y + 2
								w: menuAttrs.w / 2 - 4
								h: menuAttrs.h - (menuAttrs.h / 8)

							itemMenu = paper.set()
							menuContainer = paper.rect(menuAttrs.x, menuAttrs.y, menuAttrs.w, menuAttrs.h)
							menuContainer.attr
								fill: '#FFFFFF'
								stroke: '#000'

							itemMenu.push menuContainer

							editButton = paper.rect(eAttrs.x, eAttrs.y, eAttrs.w, eAttrs.h)
							editButton.attr
								fill: 334009
								cursor: 'pointer'

							itemMenu.push editButton

							deleteButton = paper.rect(dAttrs.x, dAttrs.y, dAttrs.w, dAttrs.h)
							deleteButton.attr
								fill: 334009
								cursor: 'pointer'

							itemMenu.push deleteButton
							# attach event firers
							editButton.mousedown ->
								if activeRendering?
									that.events.onEdit.fire(activeRendering.id)

							editButton.hover ->
								editButton.attr
									fill: 443009
							, ->
								editButton.attr
									fill: 334009

							deleteButton.mousedown ->
								if activeRendering?
									binding.events.onDelete.fire()
									itemDeleted()

							deleteButton.hover ->
								deleteButton.attr
									fill: 443009
							, ->
								deleteButton.attr
									fill: 334009
						else
							menuAttrs.x = args.x + (args.width)
							menuAttrs.y = args.y - (padding * 4) - 2

							eAttrs =
								x: menuAttrs.x + 2
								y: menuAttrs.y + 2

							dAttrs =
								x: (eAttrs.x + editButton.attr('width') + 2)
								y: menuAttrs.y + 2

							menuContainer.attr
								x: menuAttrs.x
								y: menuAttrs.y

							editButton.attr eAttrs
							deleteButton.attr dAttrs

					itemDeleted = ->
						# set rendering to undefined
						binding.detachRendering()
						activeRendering = undefined

						itemMenu.hide()
						svgBBox.hide()
						handleSet.hide()
						midDrag.hide();

					handleCalculationData =
						ul: ['nw', 0, 0, 0, 0]
						top: ['n', 1, 0, 0, 0]
						ur: ['ne', 2, -1, 0, 0]
						rgt: ['e', 2, -1, 1, 0]
						lr: ['se', 2, -1, 2, -1]
						btm: ['s', 1, 0, 2, -1]
						ll: ['sw', 0, 0, 2, -1]
						lft: ['w', 0, 0, 1, 0]
						mid: ['pointer', 1, 0, 1, 0]

					#
					# Goes through handle object array and
					# sets each handle box coordinate
					#
					calcHandles = (args) ->
						# calculate where the resize handles
						# will be located
						calcHandle = (type, xn, xp, yn, yp) ->
							x: args.x + xn * args.width / 2 + xp * padding,
							y: args.y + yn * args.height / 2 + yp * padding,
							cursor: if type.length > 2 then type else type + "-resize"

						recalcHandle = (info, xn, xp, yn, yp) ->
							info.x = args.x + xn * args.width / 2 + xp * padding
							info.y = args.y + yn * args.height / 2 + yp * padding
							el = paper.getById(info.id)
							el.attr
								x: info.x
								y: info.y

						for o in dirs
							data = handleCalculationData[o]
							if data?
								if handles[o]?
									recalcHandle(handles[o], data[1], data[2], data[3], data[4])
								else
									handles[o] = calcHandle(data[0], data[1], data[2], data[3], data[4])

	# ## ShapeCreateBox
	#
	# Creates an SVG shape with a dotted border to be used as a guide for drawing shapes. Listens for user mousedown, which
	# activates the appearance of the box at the x,y where the mousedown coords are, then finishes when user mouseup call is made
	#
	Controller.namespace 'ShapeCreateBox', (ShapeCreateBox) ->
		ShapeCreateBox.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.ShapeCreateBox", args..., (that) ->
				options = that.options

				# #### ShapeCreateBox #applyBindings
				#
				# Init function for Controller.
				#
				# Parameters:
				#
				# * binding - refers to Controller instance
				# * opts - copy of options passed through initController
				#
				# Creates the following methods:
				that.applyBindings = (binding, opts) ->
					#
					# Bounding box is created once in memory - it should be bound to the
					# canvas/paper object or something that contains more than 1 shape.
					#
					svgBBox = {}
					factors = {}
					paper = opts.paper
					attrs = {}
					padding = 10
					shapeAttrs = {}

					# #### createGuide
					#
					# Creates the SVGBBOX which acts as a guide to the user
					# of how big their shape will be once shapeDone is fired
					#
					# Parameters:
					#
					# * coords - object that has x,y coordinates for user mousedown. This is where the left and top of the box will start
					#
					binding.createGuide = (coords) ->
						# coordinates are top x,y values
						attrs.x = coords[0]
						attrs.y = coords[1]
						attrs.width = (coords[0] + padding)
						attrs.height = (coords[1] + padding)
						if $.isEmptyObject(svgBBox)
							svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
							svgBBox.attr
								stroke: 'green'
								'stroke-dasharray': ["--"]
						else
							# show all the boxes and
							# handles
							svgBBox.show()
							# adjust the SvgBBox to be around new
							# shape
							svgBBox.attr
								x: attrs.x
								y: attrs.y
								width: attrs.width
								height: attrs.height

					# #### resizeGuide
					#
					# Take passed x,y coords and set as bottom-right, not
					# top left
					#
					# Parameters:
					#
					# * coords - array of x,y coordinates to use as bottom-right coords of the box
					#
					binding.resizeGuide = (coords) ->
						attrs.width = (coords[0] - attrs.x)
						attrs.height = (coords[1] - attrs.y)

						svgBBox.attr
							width: attrs.width
							height: attrs.height

					# #### completeShape
					#
					# Take the saved coordinates and pass them back
					# to the calling function
					#
					# Parameters:
					#
					# * coords - coordinates object with properties x, y, width, and height
					#
					# Returns:
					# Coordinates object with properties x, y, width, and height
					#
					binding.completeShape = (coords) ->
						attrs.width = coords.width
						attrs.height = coords.height

						svgBBox.attr
							width: attrs.width
							height: attrs.height

						svgBBox.hide()
						return {
							x: attrs.x
							y: attrs.y
							width: attrs.width
							height: attrs.height
						}

	# ## TextBodyEditor
	#
	# Handles HTML annotation lens for editing the bodyContent text.
	#
	#
	Controller.namespace "TextBodyEditor", (TextBodyEditor) ->
		TextBodyEditor.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.TextBodyEditor", args..., (that) ->
				options = that.options

				# ### TextBodyEditor #applyBindings
				#
				# Generates the following the methods:
				that.applyBindings = (binding, opts) ->
					annoEl = binding.locate('annotation')
					bodyContent = binding.locate('body')
					allAnnos = binding.locate('annotations')
					textArea = binding.locate('textarea')
					editArea = binding.locate('editarea')
					editButton = binding.locate('editbutton')
					updateButton = binding.locate('updatebutton')
					deleteButton = binding.locate('deletebutton')
					bindingActive = false

					# #### editStart (private)
					#
					# displays editing area
					#
					editStart = () ->
						$(editArea).show()
						$(bodyContent).hide()
						bindingActive = true
						binding.events.onClick.fire(opts.itemId)

					# #### editEnd (private)
					#
					# Hides the editing area after the user has completed editing/canceled editing
					#
					editEnd = () ->
						$(editArea).hide()
						$(bodyContent).show()
						bindingActive = false

					# #### editUpdate (private)
					#
					# Called when the user sends new data to dataStore
					#
					editUpdate = (e) ->
						data = $(textArea).val()
						e.preventDefault()
						binding.events.onUpdate.fire(opts.itemId, data)
						editEnd()

					# Annotation DOM element listens for a double-click to either
					# display and become active or hide and become unactive
					$(annoEl).bind 'dblclick', (e) ->
						e.preventDefault()
						if bindingActive
							editEnd()
							options.application.setCurrentMode(prevMode or '')
						else
							editStart()
							prevMode = options.application.getCurrentMode()
							options.application.setCurrentMode 'TextEdit'

					# Clicking once on the annotation DOM element will activate the attached SVG shape
					$(annoEl).bind 'click', (e) ->
						# binding.events.onClick.fire(opts.itemId);
						options.application.setActiveAnnotation opts.itemId

					# Attach binding to the update button which ends editing and updates the bodyContent of the attached
					# annotation
					$(updateButton).bind 'click', (e) ->
						binding.events.onUpdate.fire(opts.itemId, $(textArea).val())
						editEnd()
						options.application.setCurrentMode(prevMode)

					# Attach binding to the delete button to delete the entire annotation - removes from dataStore
					$(deleteButton).bind 'click', (e) ->
						binding.events.onDelete.fire(opts.itemId)
						# remove DOM elements
						$(annoEl).remove()

					# Listening for changes in active annotation so that annotation text lens stays current
					options.application.events.onActiveAnnotationChange.addListener (id) ->
						if id != opts.id and bindingActive
							editUpdate
								preventDefault: ->
							editEnd()

					# Listens for changes in the mode in order to stay current with rest of the application
					options.application.events.onCurrentModeChange.addListener (newMode) ->
						if newMode != 'TextEdit'
							editEnd()

	# ## CanvasClickController
	#
	# Listens for all clicks on the canvas and connects shapes with the Edit controller above
	#
	# Parameters:
	#
	# * options - Object that includes:
	#	** paper - RaphaelSVG canvas object generated by Raphael Presentation
	#	** closeEnough - value for how close (In RaphaelSVG units) a mouse-click has to be in order to be considered
	# 'clicking' an object
	#
	Controller.namespace "CanvasClickController", (CanvasClickController) ->
		CanvasClickController.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.CanvasClickController", args..., (that) ->
				options = that.options

				# #### CanvasClickController #applyBindings
				#
				# Create the object passed back to the Presentation
				#
				that.applyBindings = (binding, opts) ->
					closeEnough = opts.closeEnough
					renderings = {}
					paper = opts.paper
					
					# #### attachDragResize (private)
					#
					# Find the passed rendering ID, set that rendering object
					# as the current rendering
					#
					# Parameters:
					# * id - ID of the rendering to set as active
					#
					attachDragResize = (id) ->
						if curRendering? and id == curRendering.id
							return

						o = renderings[id]
						if o?
							curRendering = o
						else
							# de-activate rendering and all other listeners
							binding.events.onClick.fire(undefined)
							# hide the editBox
							# editBoxController.deActivateEditBox();
							curRendering = undefined

					# #### detachDragResize (private)
					#
					# Make the current rendering or rendering that has matching ID *id* non-active
					#
					# Parameters:
					# * id - ID of rendering to make non-active
					#
					detachDragResize = (id) ->
						if curRendering? and id == curRendering.id
							return
						o = renderings[id]

					# #### drawShape (private)
					#
					# Using two html elements: container is for
					# registering the offset of the screen (.section-canvas) and
					# the svgEl is for registering mouse clicks on the svg element (svg)
					#
					# Parameters:
					# * container - DOM element that contains the canvas
					# * svgEl - SVG shape element that will have mouse bindings attached to it
					#
					drawShape = (container) ->
						#
						# Sets mousedown, mouseup, mousemove to draw a
						# shape on the canvas.
						#
						mouseMode = 0
						topLeft = []
						bottomRight = []
						offset = $(container).offset()

						#
						# MouseMode cycles through three settings:
						# * 0: stasis
						# * 1: Mousedown and ready to drag
						# * 2: Mouse being dragged
						#
						# remove all previous bindings
						$(container).unbind()

						$(container).mousedown (e) ->
							if mouseMode > 0
								return

							x = e.pageX - offset.left
							y = e.pageY - offset.top
							topLeft = [x, y]
							mouseMode = 1
							binding.events.onShapeStart.fire(topLeft)

						$(container).mousemove (e) ->
							if mouseMode in [2, 0]
								return

							x = e.pageX - offset.left
							y = e.pageY - offset.top
							bottomRight = [x, y]
							binding.events.onShapeDrag.fire(bottomRight)

						$(container).mouseup (e) ->
							if mouseMode < 1
								return

							mouseMode = 0
							if !bottomRight?
								bottomRight = [x + 5, y + 5]

							binding.events.onShapeDone.fire
								x: topLeft[0]
								y: topLeft[1]
								width: (bottomRight[0] - topLeft[0])
								height: (bottomRight[1] - topLeft[1])

					# #### selectShape (private)
					#
					# Creates a binding for the canvas to listen for mousedowns to select a shape
					#
					# Parameters:
					# * container - HTML element housing the canvas
					selectShape = (container) ->
						#
						# Sets mousedown events to select shapes, not to draw
						# them.
						#
						$(container).unbind()
						$(container).bind 'mousedown', (e) ->
							# By default, nullifies all selections
							options.application.setActiveAnnotation(undefined)
							activeId = null

					# Attaches binding for active annotation change to attachDragResize
					options.application.events.onActiveAnnotationChange.addListener attachDragResize
					
					# Change the mouse actions depending on what Mode the application is currently
					# in
					# **FIXME:** We shouldn't depend on the shape name being drawn - will break when a third
					# shape is added
					options.application.events.onCurrentModeChange.addListener (mode) ->
						if mode in ["Rectangle", "Ellipse"]
							drawShape binding.locate('svgwrapper')
						else if mode == 'Select'
							selectShape binding.locate('svgwrapper')
						else
							$(binding.locate('svgwrapper')).unbind()

					# #### registerRendering
					#
					# Takes a rendering object and adds it to internal array for renderings
					#
					# Parameters:
					# * newRendering - Rendering object for a shape annotation
					#
					binding.registerRendering = (newRendering) ->
						renderings[newRendering.id] = newRendering

					# #### removeRendering
					#
					# Removes rendering object from internal array - for when a shape is out of view or deleted.
					#
					# Parameters:
					#
					# * oldRendering - Rendering object for a shape annotation
					#
					binding.removeRendering = (oldRendering) ->
						delete renderings[oldRendering.id]

	# ## AnnotationCreationButton
	#
	# Controls the Annotation Creation Tools set by app.buttonFeature
	#
	Controller.namespace 'AnnotationCreationButton', (AnnotationCreationButton) ->
		AnnotationCreationButton.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", args..., (that) ->
				options = that.options

				# #### AnnotationCreationButton #applyBindings
				that.applyBindings = (binding, opts) ->
					active = false

					#
					# Mousedown: activate button - set as active mode
					#
					# Mousedown #2: de-activate button - unset active mode
					#
					# onCurrentModeChange: if != id passed, deactivate, else do nothing
					#
					buttonEl = binding.locate('button')

					# Attach binding to the mousedown
					$(buttonEl).live 'mousedown', (e) ->
						if active == false
							active = true
							options.application.setCurrentMode(opts.action)
							$(buttonEl).addClass("active")
						else if active == true
							active = false
							options.application.setCurrentMode('')
							$(buttonEl).removeClass("active")

					# #### onCurrentModeChangeHandle (private)
					#
					# Handles when the mode is changed externally from controller
					#
					# Parameters:
					# * action - name of new mode
					#
					onCurrentModeChangeHandle = (action) ->
						if action == options.action
							active = true
							$(buttonEl).addClass('active')
						else
							active = false
							$(buttonEl).removeClass("active")

					options.application.events.onCurrentModeChange.addListener onCurrentModeChangeHandle

	# ## sliderButton
	#
	# Creates a jQuery UI slider for the current time in the video
	#
	Controller.namespace 'sliderButton', (sliderButton) ->
		sliderButton.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.sliderButton", args..., (that) ->
				options = that.options

				that.applyBindings = (binding, opts) ->
					displayElement = binding.locate('timedisplay')
					positionCheck = (t) ->
						#
						# if time is not equal to internal time, then
						# reset the slider
						#
						if !localTime?
							localTime = t
							$(sliderElement).slider('value', localTime)

					sliderStart = (e, ui) ->
						options.application.setCurrentTime ui.value
						$(displayElement).text 'TIME: ' + ui.value
						localTime = ui.value

					sliderMove = (e, ui) ->
						if !ui?
							localTime = e
							$(sliderElement).slider('value', e)

						if localTime != ui.value
							options.application.setCurrentTime(ui.value)
							$(displayElement).text('TIME: ' + ui.value)
							localTime = ui.value

					sliderElement = binding.locate("slider")

					$(sliderElement).slider
						start: sliderStart
						slide: sliderMove

	# ## timeControl
	#
	# Controller for manipulating the time sequence for an annotation.
	# Currently, just a text box for user to enter basic time data
	#
	Controller.namespace 'timeControl', (timeControl) ->
		timeControl.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.timeControl", args..., (that) ->
				options = that.options
				that.currentId = ''

				# #### timeControl #applyBindings
				that.applyBindings = (binding, opts) ->
					timestart = binding.locate('timestart')
					timeend = binding.locate('timeend')
					submit = binding.locate('submit')
					menudiv = binding.locate('menudiv')

					$(menudiv).hide()

					$(submit).bind 'click', ->
						# **FIXME:** times can be in parts of seconds
						start_time = parseInt($(timestart).val(), 10)
						end_time = parseInt($(timeend).val(), 10)
						if binding.currentId? and start_time? and end_time?
							# update core data
							binding.events.onUpdate.fire binding.currentId, start_time, end_time

							$(menudiv).hide()

					options.application.events.onActiveAnnotationChange.addListener (id) ->
						if id?
							$(menudiv).show()
							$(timestart).val('')
							$(timeend).val('')
							binding.currentId = id
						else
							$(menudiv).hide()

	# ## WindowResize
	#
	# Emits an onResize event when the browser window is resized.
	#
	Controller.namespace 'WindowResize', (WindowResize) ->
		WindowResize.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.WindowResize", args..., (that) ->
				options = that.options

				that.applyBindings = (binding, opts) ->
					w = binding.locate('resizeBox')
					w.resize ->
						setTimeout(binding.events.onResize.fire, 0)