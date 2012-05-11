# # Components
#
OAC.Client.StreamingVideo.namespace "Component", (Component) ->

	# ## ModeButton
	#
	# Manages a modal button connected to the Video Annotator application's CurrentMode variable.
	#
	# Options:
	#
	# * application - a callback that returns the application instance
	#
	# * mode - a string indicating the application mode
	#
	# * * *
	#
	Component.namespace "ModeButton", (ModeButton) ->
		ModeButton.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.ModeButton", args..., (that, buttonEl) ->
				options = that.options
				app = options.application()
				
				#
				# If the button is clicked and it isn't the current mode, then it is made the current mode.
				# Otherwise, if it is the current mode, then the current mode is made undefined. The effect is
				# that the button is a toggle for its mode.
				# 
				$(buttonEl).mousedown ->
					if $(buttonEl).hasClass("active")
						app.setCurrentMode null
					else
						app.setCurrentMode options.mode

				#
				# We listen for changes in the current application mode and reflect them in the button's
				# CSS class.
				#
				app.events.onCurrentModeChange.addListener (action) ->
					if action == options.mode
						$(buttonEl).addClass("active")
					else
						$(buttonEl).removeClass("active")

	# ## ShapeEditBox
	#
	# Creates and manages a SVG bounding box with resize handles and center drag handle.
	#
	# Options:
	#
	# * * *
	#
	Component.namespace "ShapeEditBox", (ShapeEditBox) ->
		dragController = null
		

		ShapeEditBox.initInstance = (args...) ->
			#
			# We delay creating the drag controller until we need it because we haven't defined the MITHGrid
			# defaults for the binding events.
			#
			dragController ?= OAC.Client.StreamingVideo.Controller.Drag.initInstance {}
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.ShapeEditBox", args..., (that, paper) ->
				options = that.options
				handleSet = null
				handles = {}
				activeRendering = null
				attrs = {}
				shapeAttrs = {}
				handleAttrs = {}
				extents = {}
				factors = {}
				svgBBox = null
				midDrag = null
				handleSize = 5
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

				#
				# ### calcXYHeightWidth (private)
				#
				# Translates the top-left, bottom-right dx/dy information we're tracking as part of the
				# handle drag operation into the x/y width/height needed to draw the bounding box. This
				# allows the mouse to move such that we "flip" the box around (e.g., the left side becomes
				# the right side).
				#
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
				# ### calcHandles (private)
				#
				# Calculates the positions of each of the bounding box resize/move handles given the
				# object holding the drag information.
				#
				calcHandles = (args) ->
					# calculate where the resize handles
					# will be located
					calcXYHeightWidth args
					
					calcHandle = (type, xn, yn) ->
						x: args.x + xn * args.width / 2 - handleSize / 2
						y: args.y + yn * args.height / 2 - handleSize / 2
						cursor: if type.length > 2 then type else type + "-resize"

					recalcHandle = (info, xn, yn) ->
						info.x = args.x + xn * args.width / 2 - handleSize / 2
						info.y = args.y + yn * args.height / 2 - handleSize / 2
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
				
				# ### calcFactors (private)
				#
				# Sets up object for tracking drag-related information based on the extents of the
				# currently active rendering.
				#
				calcFactors = ->
					extents = activeRendering.getExtents()
				
					attrs =
						tlx: (extents.x) - (extents.width / 2)
						tly: (extents.y) - (extents.height / 2)
						brx: (extents.x) + (extents.width / 2)
						bry: (extents.y) + (extents.height / 2)
						dx: 0
						dy: 0
						
					calcHandles attrs
	
				# ### drawHandles (private)
				#
				# Draws the handles defined in dirs as SVG rectangles and draws the SVG bounding box.
				#
				drawHandles = ->		
					if not handleSet?

						handleSet = paper.set()
						for i, o of handles
							if i == 'mid'
								midDrag = paper.rect(o.x, o.y, handleSize, handleSize)
								$(midDrag.node).css
									"pointer-events": "auto"
								o.id = midDrag.id
								o.el = midDrag
							else
								h = paper.rect(o.x, o.y, handleSize, handleSize)
								$(h.node).css
									"pointer-events": "auto"
								o.id = h.id
								o.el = h
								h.attr
									cursor: o.cursor
								handleSet.push h

						handleSet.attr
							fill: 'black'
							stroke: 'black'

						if not $.isEmptyObject midDrag
							midDrag.attr
								fill: 'black'
								stroke: 'black'
								cursor: 'move'

						calcXYHeightWidth attrs
						
						svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
						svgBBox.attr
							stroke: '#333333'
							'stroke-dasharray': ["--"]

						#
						# Bind the middle drag handle to the drag controller.
						#
						if midDrag?
							midDragDragBinding = dragController.bind midDrag

							midDragDragBinding.events.onUpdate.addListener (dx, dy) ->			
								attrs.dx = dx
								attrs.dy = dy

								calcHandles attrs
				
								svgBBox.attr
									x: attrs.x
									y: attrs.y

							midDragDragBinding.events.onFocus.addListener (x, y) ->
									that.events.onFocus.fire()
									factors.x = 0
									factors.y = 0
									calcFactors()
									activeRendering.shape.attr
										cursor: 'move'
				
							midDragDragBinding.events.onUnfocus.addListener ->
									calcXYHeightWidth attrs
									that.events.onMove.fire
										x: attrs.x + attrs.width/2
										y: attrs.y + attrs.height/2
									that.events.onUnfocus.fire()

						#
						# Bind each of the boundary handles to the drag controller.
						#
						handleSet.forEach (handle) ->
							handleBinding = dragController.bind(handle)
				
							handleBinding.events.onUpdate.addListener (dx, dy) ->
								attrs.dx = dx
								attrs.dy = dy
								
								calcHandles attrs
								
								svgBBox.attr
									x: attrs.x
									y: attrs.y
									width: attrs.width
									height: attrs.height

							handleBinding.events.onFocus.addListener (x, y) ->
								extents = activeRendering.getExtents()

								that.events.onFocus.fire()

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
								calcXYHeightWidth attrs
								
								#
								# We pass along the center and size to the listener instead of the
								# top-left and size.
								#
								that.events.onResize.fire
									x: attrs.x + attrs.width/2
									y: attrs.y + attrs.height/2
									width: attrs.width
									height: attrs.height
									
								that.events.onUnfocus.fire()
							
							svgBBox.toFront()
							handleSet.toFront()
							midDrag.toFront()
					else
						svgBBox.show().toFront()

						svgBBox.attr
							x: attrs.x
							y: attrs.y
							width: attrs.width
							height: attrs.height
							
						handleSet.show().toFront()
						midDrag.show().toFront()
	
				#
				# ### #show
				#
				# Makes the bounding box visible.
				#
				that.show = ->
					calcFactors()
					drawHandles()
	
				#
				# ### #hide
				#
				# Makes the bounding box invisible.
				#
				that.hide = ->
					if not $.isEmptyObject handleSet
						handleSet.hide()
						svgBBox.hide()
						midDrag.hide()
				
				#
				# ### #attachToRendering
				#
				# Records the rendering as the currently active rendering and makes sure the bounding box is visible.
				#
				# Parameters:
				#
				# * newRendering - the currently active rendering
				#
				# Returns: Nothing.
				#
				that.attachToRendering = (newRendering) ->
					that.detachFromRendering()

					if !newRendering?
						return

					activeRendering = newRendering
					that.show()

				#
				# ### #detachFromRendering
				#
				# Hides the bounding box and forgets the currently active rendering.
				#
				that.detachFromRendering = () ->
					activeRendering = null
					that.hide()

	#
	# ## ShapeCreateBox
	#
	# Draws and manages the bounding box used to create a new annotation.
	#
	# The container is the Raphaël paper on which the bounding box is drawn.
	#
	# **TODO:** See if the bindings in the presentation can be moved here and have a simple event from here go back to
	# the presentation to create the shape.
	#
	Component.namespace 'ShapeCreateBox', (ShapeCreateBox) ->
		ShapeCreateBox.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Component.ShapeCreateBox", args..., (that, paper) ->
				options = that.options

				#
				# Bounding box is created once in memory - it should be bound to the
				# canvas/paper object or something that contains more than 1 shape.
				#
				svgBBox = null
				factors = {}
				attrs = {}
				shapeAttrs = {}

				# ### #createGuide
				#
				# Creates the SVGBBOX which acts as a guide to the user
				# of how big their shape will be once shapeDone is fired
				#
				# Parameters:
				#
				# * coords - object that has x,y coordinates for user mousedown. This is where the left and top of the box will start
				#
				that.createGuide = (coords) ->
					attrs.x = coords[0]
					attrs.y = coords[1]
					attrs.width = 0
					attrs.height = 0
					if not svgBBox?
						svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height)
						svgBBox.attr
							stroke: '#333333'
							'stroke-dasharray': ["--"]
					else
						svgBBox.show()

						svgBBox.attr
							x: attrs.x
							y: attrs.y
							width: attrs.width
							height: attrs.height

				# ### #resizeGuide
				#
				# Resize the bounding box to have the passed coordinates be the opposite corner from the initial
				# coordinates.
				#
				# Parameters:
				#
				# * coords - array of x,y coordinates to use as bottom-right coords of the box
				#
				# Returns: Nothing.
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

				# ### #completeShape
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
