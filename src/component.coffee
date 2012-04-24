# # Components
#
OAC.Client.StreamingVideo.namespace 'Component', (Component) ->

# ## BoundingBox
#
# Creates and manages a SVG bounding box with resize handles and center drag handle.
#
	Component.namespace "BoundingBox", (BoundingBox) ->

		BoundingBox.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.BoundingBox", args..., (that, paper) ->
				dragController = OAC.Client.StreamingVideo.Controller.Drag.initController {}
				handleSet = {}
				activeRendering = null
				attrs = {}
	
				handleCalculationData =
					ul:  ['nw', 0,  0, 0,  0]
					top: ['n',  1,  0, 0,  0]
					ur:  ['ne', 2, -1, 0,  0]
					rgt: ['e',  2, -1, 1,  0]
					lr:  ['se', 2, -1, 2, -1]
					btm: ['s',  1,  0, 2, -1]
					ll:  ['sw', 0,  0, 2, -1]
					lft: ['w',  0,  0, 1,  0]
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
				
				# ##### calcFactors (private)
				#
				# Measures where the handles should be on mousemove.
				#
				# Parameters: None.
				#
				# Returns: Nothing.
				#
				calcFactors = ->
					extents = activeRendering.getExtents()

					# create offset factors for
					# bounding box
					# calculate width - height to be larger
					# than shape
					attrs =
						width: extents.width + (2 * padding)
						height: extents.height + (2 * padding)
						x: (extents.x - (padding / 8)) - (attrs.width / 2)
						y: (extents.y - (padding / 8)) - (attrs.height / 2)
					calcHandles attrs
	
				# #### drawHandles (private)
				#
				# Draws the handles defined in dirs as SVG rectangles and draws the SVG bounding box
				#
				# Parameters: None.
				#
				# Returns: Nothing.
				#
				drawHandles = ->		
					if $.isEmptyObject handleSet

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

						if not $.isEmptyObject midDrag
							midDrag.attr
								fill: 990000,
								stroke: 'black',
								cursor: 'move'

						# drawing bounding box
						svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
						svgBBox.attr
							stroke: 'green'
							'stroke-dasharray': ["--"]

						if not $.isEmptyObject midDrag

							# Attaching listener to drag-only handle (midDrag)
							midDragDragBinding = dragController.bind midDrag
				
							midDragDragBinding.events.onUpdate.addListener (dx, dy) ->
								# dragging means that the svgBBox stays padding-distance
								# away from the lens' shape and the lens shape gets updated
								# in dataStore
								handleAttrs.nx = attrs.x + dx
								handleAttrs.ny = attrs.y + dy
								shapeAttrs.x = extents.x + dx
								shapeAttrs.y = extents.y + dy

								svgBBox.attr
									x: handleAttrs.nx
									y: handleAttrs.ny

								calcHandles
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
									that.events.onMove.fire
										x: shapeAttrs.x
										y: shapeAttrs.y

						# Attaching drag and resize handlers
						handleSet.forEach (handle) ->
							handleBinding = dragController.bind(handle)
				
							handleBinding.events.onUpdate.addListener (dx, dy) ->
								# onmove function - handles dragging
								# dragging here means that the shape is being resized;
								# the factorial determines in which direction the
								# shape is pulled
								shapeAttrs.w = Math.abs(extents.width + dx * factors.x)
								shapeAttrs.h = Math.abs(extents.height + dy * factors.y)
								handleAttrs.nw = shapeAttrs.w + (padding * 2)
								handleAttrs.nh = shapeAttrs.h + (padding * 2)
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
				
							handleBinding.events.onUnfocus.addListener ->
								# onend function
								# update
								that.events.onResize.fire
									width: shapeAttrs.w,
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
	
	
				that.show = ->
					calcFactors()
					drawHandles()
	
				that.hide = ->
					if not $.isEmptyObject handleSet
						handleSet.hide()
						svgBBox.hide()
						midDrag.hide()
				
				that.attachToRendering = (newRendering) ->
					that.detachFromRendering()

					if !newRendering?
						return

					# register the rendering
					activeRendering = newRendering
					that.show()

				# Function to call in order to "de-activate" the edit box
				# (i.e. make it hidden)
				that.detachFromRendering = () ->
					activeRendering = null
					that.hide()					

OAC.Client.StreamingVideo.namespace 'Controller', (Controller) ->
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
