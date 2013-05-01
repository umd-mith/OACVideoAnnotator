  
)(jQuery, MITHgrid, OAC)

# # Default Configurations
#

# ## Application
#
# The Video Annotator core application has the basic set of components needed to provide video annotation.
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Application",
  # ### Controllers
  controllers:
    canvas:
      type: OAC.Client.StreamingVideo.Controller.CanvasClickController
      selectors:
        svgwrapper: ''
    selectShape:
      type: OAC.Client.StreamingVideo.Controller.Select
      selectors:
        raphael: ''
  # ### Variables
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
  # ### Data Views
  dataViews:
    # **currentAnnotations** pages a range of times through the annotation store selecting those
    # annotations which have a time range (.npt\_start through .npt\_end) that fall within the time
    # range set.
    currentAnnotations:
      dataStore: 'canvas'
      type: MITHgrid.Data.RangePager
      leftExpressions: [ '.npt_start' ]
      rightExpressions: [ '.npt_end' ]

  # ### Data Store
  dataStores:
    # **canvas** holds all of the annotation data for the client.
    canvas:
      # #### Types
      types:
        # All annotation items are of type "Annotation"
        Annotation: {}
      # #### Properties
      properties:
        # The following properties are understood by the annotation client:
        
        # - bodyContent holds the byte stream associated with the annotation body
        bodyContent:
          valueType: 'text'
        # - bodyType indicates what kind of body the annotation associates with the target (e.g., Text)
        bodyType:
          valueType: 'text'
        
        # - the play head position at which this annotation ceases being active/current
        npt_end: 
          valueType: 'numeric'
        # - the play head position at which this annotation becomes active/current
        npt_start:
          valueType: 'numeric'
        # - shapeType indicates which shape is used as the SVG constraint within the frame (e.g., Rectangle or Ellipse)
        shapeType:
          valueType: 'text'
        
        # - targetURI points to the annotation target video without time constraints
        targetURI:
          valueType: 'uri'

        
        # The following properties are used by the Rectangle and Ellipse shape types:
        
        # - h
        h:
          valueType: 'numeric'
        # - targetHeight
        targetHeight:
          valueType: 'numeric'
        # - targetWidth
        targetWidth:
          valueType: 'numeric'
        # - w
        w:
          valueType: 'numeric'
        # - x
        x:
          valueType: 'numeric'
        # - y
        y:
          valueType: 'numeric'
          
  # ### Presentations
  #
  # We go ahead and define the overlay that will show the annotation shapes over the video. Any other presentation
  # must be configured outside this application (or as a sub-class).
  #
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
  # ### View Setup
  #
  # We create a simple `<div/>` to hold the Raphaël canvas. Everything else in the UI is provided by a super class
  # or the environment in which this application is being used.
  #
  viewSetup: """
    <div class="canvas"></div>
  """

# ## Component.ShapeCreateBox
#
# Instances of this component will have the following event:
#
# - onNewShape
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Component.ShapeCreateBox",
  bind:
    events:
      onNewShape: null
            
# ## Component.ShapeEditBox
#
# By default, this component will have eight handles around the edges of the bounding box and a handle in the center.
#
# Instances of this component will have the following events:
#
# - onResize
# - onMove
# - onDelete
# - onFocus
# - onUnfocus
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Component.ShapeEditBox",
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
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Controller.CanvasClickController",
  bind:
    events:
      onShapeStart: null
      onShapeDrag: null
      onShapeDone: null

# ## Controller.Drag
#
# Bindings created by this controller will have the following events:
#
# - onFocus
# - onUnfocus
# - onUpdate
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Controller.Drag",
  bind:
    events:
      onFocus: null
      onUnfocus: null
      onUpdate: null

# ## Controller.Select
#
# This controller accepts the `isSelectable` configuration option as a function that is called to see
# if the `onSelect` event should fire.
#
# Bindings created by this controller will have the following event:
#
# - onSelect
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Controller.Select",
  bind:
    events:
      onSelect: null
  isSelectable: -> true

# ## Player.DriverBinding
#
# All driver bindings associating a driver object with a DOM player object have the following events:
#
# - onResize
# - onPlayheadUpdate
#
MITHgrid.defaults "OAC.Client.StreamingVideo.Player.DriverBinding",
  events:
    onResize: null
    onPlayheadUpdate: null