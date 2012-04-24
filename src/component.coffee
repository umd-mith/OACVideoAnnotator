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
				options = that.options
				dragController = OAC.Client.StreamingVideo.Controller.Drag.initController {}
				handleSet = {}
				handles = {}
				activeRendering = null
				attrs = {}
				shapeAttrs = {}
				handleAttrs = {}
				extents = {}
				factors = {}
				svgBBox = null
				midDrag = null
				padding = 10
				dirs = options.dirs
				app = options.application
	
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
								app.setCurrentMode('Drag')
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
