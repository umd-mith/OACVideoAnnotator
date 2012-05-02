# # Components
#
OAC.Client.StreamingVideo.namespace 'Component', (Component) ->

	# ## ModeButton
	#
	# Controls the Annotation Creation Tools set by app.buttonFeature
	#
	Component.namespace 'ModeButton', (ModeButton) ->
		ModeButton.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.ModeButton", args..., (that, buttonEl) ->
				options = that.options

				# #### AnnotationCreationButton #applyBindings
				active = false

				#
				# Mousedown: activate button - set as active mode
				#
				# Mousedown #2: de-activate button - unset active mode
				#
				# onCurrentModeChange: if != id passed, deactivate, else do nothing
				#
				
				# Attach binding to the mousedown
				$(buttonEl).mousedown (e) ->
					if active == false
						active = true
						options.application.setCurrentMode(options.mode)
						$(buttonEl).addClass("active")
					else if active == true
						active = false
						options.application.setCurrentMode(undefined)
						$(buttonEl).removeClass("active")

				# #### onCurrentModeChangeHandle (private)
				#
				# Handles when the mode is changed externally from controller
				#
				# Parameters:
				# * action - name of new mode
				#
				options.application.events.onCurrentModeChange.addListener (action) ->
					if action == options.mode
						active = true
						$(buttonEl).addClass('active')
					else
						active = false
						$(buttonEl).removeClass("active")

# ## BoundingBox
#
# Creates and manages a SVG bounding box with resize handles and center drag handle.
#
	Component.namespace "ShapeEditBox", (ShapeEditBox) ->

		ShapeEditBox.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.ShapeEditBox", args..., (that, paper) ->
				options = that.options
				dragController = OAC.Client.StreamingVideo.Controller.Drag.initInstance {}
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
				# The padding is how big the resize handles should be
				padding = 5
				dirs = options.dirs
	
				handleCalculationData =
					ul:  ['nw', 0, 0]
					top: ['n',  1, 0]
					ur:  ['ne', 2, 0]
					rgt: ['e',  2, 1]
					lr:  ['se', 2, 2]
					btm: ['s',  1, 2]
					ll:  ['sw', 0, 2]
					lft: ['w',  0, 1]
					mid: ['pointer', 1, 1]

				calcXYHeightWidth = (args) ->
					brx = args.brx
					tlx = args.tlx
					bry = args.bry
					tly = args.tly
					if factors.x == 0 and factors.y == 0
						tlx += args.dx
						brx += args.dx
						tly += args.dy
						bry += args.dy
					else 
						if factors.x < 0
							tlx += args.dx
						else if factors.x > 0
							brx += args.dx
						if factors.y < 0
							tly += args.dy
						else if factors.y > 0
							bry += args.dy
					if brx > tlx
						args.x = tlx
					else
						args.x = brx
					if bry > tly
						args.y = tly
					else
						args.y = bry
				
					args.width = Math.abs(brx - tlx)
					args.height = Math.abs(bry - tly)
					args
					
				#
				# Goes through handle object array and
				# sets each handle box coordinate
				#
				calcHandles = (args) ->
					# calculate where the resize handles
					# will be located
					calcXYHeightWidth args
					
					calcHandle = (type, xn, yn) ->
						x: args.x + xn * args.width / 2 - padding / 2
						y: args.y + yn * args.height / 2 - padding / 2
						cursor: if type.length > 2 then type else type + "-resize"

					recalcHandle = (info, xn, yn) ->
						info.x = args.x + xn * args.width / 2 - padding / 2
						info.y = args.y + yn * args.height / 2 - padding / 2
						info.el.attr
							x: info.x
							y: info.y

					for o in dirs
						data = handleCalculationData[o]
						if data?
							if handles[o]?
								recalcHandle(handles[o], data[1], data[2])
							else
								handles[o] = calcHandle(data[0], data[1], data[2])
				
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
						tlx: (extents.x) - (extents.width / 2)
						tly: (extents.y) - (extents.height / 2)
						brx: (extents.x) + (extents.width / 2)
						bry: (extents.y) + (extents.height / 2)
						dx: 0
						dy: 0
						
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
								$(midDrag.node).css
									"pointer-events": "auto"
								o.id = midDrag.id
								o.el = midDrag
							else
								h = paper.rect(o.x, o.y, padding, padding)
								$(h.node).css
									"pointer-events": "auto"
								o.id = h.id
								o.el = h
								h.attr
									cursor: o.cursor
								handleSet.push h

						# make them all similar looking
						handleSet.attr
							fill: 'black'
							stroke: 'black'

						if not $.isEmptyObject midDrag
							midDrag.attr
								fill: 'black'
								stroke: 'black'
								cursor: 'move'

						# drawing bounding box
						calcXYHeightWidth attrs
						svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
						svgBBox.attr
							stroke: '#333333'
							'stroke-dasharray': ["--"]

						if not $.isEmptyObject midDrag

							# Attaching listener to drag-only handle (midDrag)
							midDragDragBinding = dragController.bind midDrag
				
							midDragDragBinding.events.onUpdate.addListener (dx, dy) ->
								# dragging means that the svgBBox stays padding-distance
								# away from the lens' shape and the lens shape gets updated
								# in dataStore
								attrs.dx = dx
								attrs.dy = dy

								calcHandles attrs
				
								svgBBox.attr
									x: attrs.x
									y: attrs.y

							midDragDragBinding.events.onFocus.addListener (x, y) ->
									# start
									factors.x = 0
									factors.y = 0
									calcFactors()
									activeRendering.shape.attr
										cursor: 'move'
				
							midDragDragBinding.events.onUnfocus.addListener ->
									# end
									calcXYHeightWidth attrs
									that.events.onMove.fire
										x: attrs.x + attrs.width/2
										y: attrs.y + attrs.height/2

						# Attaching drag and resize handlers
						handleSet.forEach (handle) ->
							handleBinding = dragController.bind(handle)
				
							handleBinding.events.onUpdate.addListener (dx, dy) ->
								# onmove function - handles dragging
								# dragging here means that the shape is being resized;
								# the factor determines in which direction the
								# shape is pulled
								attrs.dx = dx
								attrs.dy = dy
								
								calcHandles attrs
								
								svgBBox.attr
									x: attrs.x
									y: attrs.y
									width: attrs.width
									height: attrs.height

				
							handleBinding.events.onFocus.addListener (x, y) ->
								# onstart function
								extents = activeRendering.getExtents()

								# extents: x, y, width, height
								px = (8 * (x - extents.x) / extents.width) + 4
								py = (8 * (y - extents.y) / extents.height) + 4
								if px < 3
									factors.x = -1
								else if px < 5
									factors.x = 0
								else
									factors.x = 1
								if py < 3
									factors.y = -1
								else if py < 5
									factors.y = 0
								else
									factors.y = 1
								calcFactors()
				
							handleBinding.events.onUnfocus.addListener ->
								# onend function
								# update
								calcXYHeightWidth attrs
								
								that.events.onResize.fire
									x: attrs.x + attrs.width/2
									y: attrs.y + attrs.height/2
									width: attrs.width
									height: attrs.height
							svgBBox.toFront()
							handleSet.toFront()
							midDrag.toFront()
					else
						# show all the boxes and
						# handles
						svgBBox.show().toFront()
						# adjust the SvgBBox to be around new
						# shape
						svgBBox.attr
							x: attrs.x
							y: attrs.y
							width: attrs.width
							height: attrs.height
						handleSet.show().toFront()
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

	# ## ShapeCreateBox
	#
	# Creates an SVG shape with a dotted border to be used as a guide for drawing shapes. Listens for user mousedown, which
	# activates the appearance of the box at the x,y where the mousedown coords are, then finishes when user mouseup call is made
	#
	Component.namespace 'ShapeCreateBox', (ShapeCreateBox) ->
		ShapeCreateBox.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.ShapeCreateBox", args..., (that, paper) ->
				options = that.options

				#
				# Bounding box is created once in memory - it should be bound to the
				# canvas/paper object or something that contains more than 1 shape.
				#
				svgBBox = {}
				factors = {}
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
				that.createGuide = (coords) ->
					# coordinates are top x,y values
					attrs.x = coords[0]
					attrs.y = coords[1]
					attrs.width = 0
					attrs.height = 0
					if $.isEmptyObject(svgBBox)
						svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
						svgBBox.attr
							stroke: '#333333'
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
				that.resizeGuide = (coords) ->
					attrs.width = (coords[0] - attrs.x)
					attrs.height = (coords[1] - attrs.y)

					if attrs.width < 0
						if attrs.height < 0
							svgBBox.attr
								width: -attrs.width
								height: -attrs.height
								x: attrs.x + attrs.width
								y: attrs.y + attrs.height
						else
							svgBBox.attr
								width: -attrs.width
								height: attrs.height
								x: attrs.x + attrs.width
								y: attrs.y
					else if attrs.height < 0
						svgBBox.attr
							width: attrs.width
							height: -attrs.height
							x: attrs.x
							y: attrs.y + attrs.height
					else
						svgBBox.attr
							width: attrs.width
							height: attrs.height
							x: attrs.x
							y: attrs.y

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
				that.completeShape = (coords) ->
					that.resizeGuide coords

					svgBBox.hide()
					
					if attrs.width < 0
						attrs.x += attrs.width
						attrs.width = -attrs.width
					if attrs.height < 0
						attrs.y += attrs.height
						attrs.height = -attrs.height
					return {
						x: attrs.x
						y: attrs.y
						width: attrs.width
						height: attrs.height
					}
