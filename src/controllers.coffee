# # Controllers
#
OAC.Client.StreamingVideo.namespace 'Controller', (Controller) ->
	relativeCoords = (currentElement, event) ->
		totalOffsetX = 0
		totalOffsetY = 0
		
		while currentElement?
			totalOffsetX += currentElement.offsetLeft
			totalOffsetY += currentElement.offsetTop
			currentElement = currentElement.offsetParent
		
		x: event.pageX - totalOffsetX
		y: event.pageY - totalOffsetY
		
	# ## KeyboardListener
	#
	# OAC.Client.StreamingVideo.Controller.KeyboardListener listens to keydown events on the DOM document
	# level and translates them into delete events.
	#
	Controller.namespace "KeyboardListener", (KeyboardListener) ->

		# ### KeyboardListener.initInstance
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
		KeyboardListener.initInstance = (args...) ->			
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Controller.KeyboardListener", args..., (that) ->
				options = that.options
				isActive = options.isActive or -> true
				
				that.applyBindings = (binding, opts) ->
					doc = binding.locate('doc')

					options.application().events.onActiveAnnotationChange.addListener (id) ->
						activeId = id

					$(doc).keydown (e) ->
						if isActive() and activeId?
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

		# ### Drag.initInstance
		#
		Drag.initInstance = (args...) ->
			MITHGrid.Controller.Raphael.initInstance "OAC.Client.StreamingVideo.Controller.Drag", args..., (that) ->
				that.applyBindings = (binding) ->
					el = binding.locate('raphael')

					dstart = (x, y, e) ->
						# We need to get the X/Y relative to the container we're bound to
						pos = relativeCoords el.node, e
						binding.events.onFocus.fire pos.x, pos.y
					dend = ->
						binding.events.onUnfocus.fire()
					dmid = (x, y) ->
						binding.events.onUpdate.fire x, y
					
					el.drag dmid, dstart, dend

				that.removeBindings = (binding) ->
					el = binding.locate('raphael')
					
					el.undrag
					
	# ## Select
	#
	# Attaches a click handler to an SVG rendering and fires an onSelect event if the rendering is clicked AND
	# the application is in a mode to select things.
	#
	Controller.namespace "Select", (Select) ->

		# ### Select.initInstance
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
		Select.initInstance = (args...) ->
			MITHGrid.Controller.Raphael.initInstance "OAC.Client.StreamingVideo.Controller.Select", args..., (that) ->
				options = that.options
				isSelectable = options.isSelectable or -> true
				

				that.applyBindings = (binding) ->
					el = binding.locate("raphael")

					el.click (e) ->
						if isSelectable()
							binding.events.onSelect.fire()
	
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
		CanvasClickController.initInstance = (args...) ->
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Controller.CanvasClickController", args..., (that) ->
				options = that.options
				overlay = null

				# #### CanvasClickController #applyBindings
				#
				# Create the object passed back to the Presentation
				#
				that.applyBindings = (binding, opts) ->
					closeEnough = opts.closeEnough
					renderings = {}
					paper = opts.paper
					svgWrapper = binding.locate('svgwrapper')
						
					drawOverlay = ->
						removeOverlay()
						overlay = paper.rect(0,0,paper.width,paper.height)
						overlay.toFront()
						overlay.attr
							fill: "#ffffff"
							opacity: 0.01
						$(overlay.node).css
							"pointer-events": "auto"
					
					removeOverlay = ->
						if overlay?
							overlay.unmousedown()
							overlay.unmouseup()
							overlay.unmousemove()
							overlay.attr
								opacity: 0.0
							overlay.remove()
							overlay = null
						uncaptureMouse()
					
					mouseCaptured = false
					
					captureMouse = (handlers) ->
						if !mouseCaptured
							mouseCaptured = true
							MITHGrid.mouse.capture (eType) ->
								if handlers[eType]?
									handlers[eType](this)
					
					uncaptureMouse = ->
						if mouseCaptured
							MITHGrid.mouse.uncapture()
							mouseCaptured = false

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
						mouseDown = false
						mouseCaptured = false
						topLeft = []
						bottomRight = []
						drawOverlay()

						# remove all previous bindings
						overlay.unmousedown()
						overlay.unmouseup()
						overlay.unmousemove()
						
						mousedown = (e) ->
							if mouseDown
								return

							pos = relativeCoords overlay.node, e
							x = pos.x
							y = pos.y
							topLeft = [x, y]
							bottomRight = [x, y]
							mouseDown = true
							binding.events.onShapeStart.fire(topLeft)

						mousemove = (e) ->
							if !mouseDown
								return

							pos = relativeCoords overlay.node, e
							x = pos.x
							y = pos.y
							bottomRight = [x, y]
							binding.events.onShapeDrag.fire(bottomRight)

						mouseup = (e) ->
							if !mouseDown
								return

							mouseDown = false

							binding.events.onShapeDone.fire bottomRight
							uncaptureMouse()
							overlay.toFront()
								
						overlay.mousedown mousedown
						overlay.mousemove mousemove
						overlay.mouseup   mouseup
						
						captureMouse
							mousedown: mousedown
							mouseup: mouseup
							mousemove: mousemove
						
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
						drawOverlay()
						overlay.unmousedown()
						overlay.mousedown (e) ->
							# By default, nullifies all selections
							options.application().setActiveAnnotation(undefined)
							activeId = null
							overlay.toBack()
						overlay.toBack()
					
					# Change the mouse actions depending on what class of Mode the application is currently in
					options.application().events.onCurrentModeChange.addListener (mode) ->
						removeOverlay()
						switch options.application().getCurrentModeClass()
							when "shape"  then drawShape svgWrapper
							when "select" then selectShape svgWrapper
							else
								$(svgWrapper).unbind()
					
					binding.toBack = ->
						if overlay?
							overlay.toBack()