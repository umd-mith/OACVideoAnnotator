# # Annotation Application
#
# This is the heart of the Video Annotator library. This core application pulls together the major components needed to
# construct a video annotation client. Functions are provided to manage import and export of annotations in the OA model
# represented as RDF/JSON. Armed with the data schema outlined in the outro.coffee file, you can add other MITHgrid-based
# components to visualize the annotations.

OAC.Client.StreamingVideo.namespace "Application", (Application) ->
  #
  # The first thing we do is set up some private functions to generate unique identifiers. We use these when exporting
  # the annotations since OA requires a number of blank nodes. We also use these to create unique item IDs for the
  # MITHgrid data store.
  #
  
  # ### S4 (private)
  #
  # Generates a UUID value component. This is not a global uid.
  #
  # Returns:
  # String with 4 hex digits.
  S4 = -> (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

  # ### uuid (private)
  #
  # Generates a UUID
  #
  # This is not a globally unique value. It could clash with another
  # value, but such a clash is very unlikely.
  #
  # **FIXME:** Abstract so that there is a server prefix component that ensures
  # more of a GUID
  #
  uuid = -> (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
  
  # ## StreamingVideo.initInstance
  #
  # Options:
  #
  # * player - the player driver binding object that provides the standard OAC API for video players
  #
  # * url - that target URL for annotations managed by this application instance. If this is not provided, then
  #         we look to the player driver binding object to provide this value through its #targetURI method.
  #
  # * * *
  #
    
  Application.initInstance = (args...) ->
    #
    # We store the application object in `appOb` so it's available to the `isSelectable` callback. Note that
    # this is the same object as the `app` parameter in the callback provided to the initInstance method.
    #
    appOb = MITHgrid.Application.initInstance "OAC.Client.StreamingVideo.Application", args..., {
      controllers:
        selectShape:
          isSelectable: -> appOb.getCurrentMode() == "Select"
    }, (app) ->
      shapeTypes = {}
      screenSize = {}
      shapeAnnotationId = 0
      xy = []
      wh = []
          
      options = app.options
    
      #
      # We isolate the player object through a closure so it won't change on us.
      # We expect one application instance per player binding object.
      #
      playerObj = options.player
    
      options.url ?= playerObj.getTargetURI()
    
      if playerObj?
        [ screenSize.width, screenSize.height ] = playerObj.getSize()
    
        playerObj.events.onResize.addListener (s) ->
          [ screenSize.width, screenSize.height ] = s

      #
      # ### #getPlayer
      #
      # Returns the player binding object associated with this application instance.
      #
      app.getPlayer = -> playerObj
  
      #
      # We wait until the application is ready before we make the initShapeLens method available. Otherwise,
      # app.presentation.raphsvg won't be defined.
      #
      app.ready ->
        app.initShapeLens = app.presentation.raphsvg.initShapeLens

      #
      # ### #getCurrentModeClass
      #
      # Returns the type of mode currently set. This can be null or one of the following values:
      #
      # - **shape**: current mode is a shape that can be drawn on the play surface
      #
      # - **select**: application is set to select a shape shown on the play surface
      #
      # - **video**: application is set to allow control of the video instead of editing/creating annotations
      #
      app.getCurrentModeClass = ->
        m = app.getCurrentMode()
        if shapeTypes[m]?
          "shape"
        else
          switch m
            when "Select" then "select"
            when "Watch"  then "video"
            else
              null

      # ### #addShapeType
      #
      # Adds a shape type. This includes a lens, and a set of callbacks for creating an item and handling
      # import/export.
      #
      # Parameters:
      #
      # * type - the internal shape name
      # * args - an object containing the following properties:
      #   * calc - an optional callback function for creating data for the new shape being added to the data store
      #   * lens - the lens rendering function for rendering the shape on the SVG overlay
      #   * renderAsSVG - callback that will return the SVG fragment representing the shape
      #   * rootSVGElement - an array of root SVG elements that may represent this shape
      #   * extractFromSVG - callback that returns the MITHgrid data store information representing
      #                          the parameters for this shape extracted from the SVG XML document
      #
      # Returns: Nothing.
      #
      app.addShapeType = (type, args) ->
        app.ready ->
          shapeTypes[type] = args
          app.presentation.raphsvg.addLens(type, args.lens)
      
      # ### #addBodyType
      #
      # Adds a body type. This consists of a set of callbacks for creating an item and handling import/export.
      #
      # Parameters:
      #
      # * type - the internal body type name
      # * args - an object containing the following properties:
      #     * renderAsOA - callback that will construct the Open Annotation body from the item
      #     * extractFromOA - callback that will construct the item from the Open Annotation body
      #
      # Returns: Nothing.
      #
      app.addBodyType = (type, args) ->
        bodyTypes[type] = args

      # ### #insertAnnotation
      #
      # Inserts a new annotation into the data store using the passed coordinates. An empty text annotation body
      # is added. The application CurrentMode variable determines the shape. The default time span is 5 seconds 
      # on either side of the CurrentTime variable.
      #
      # Parameters:
      #
      # * coords - the coordinates of the center of the shape in the .x, .y, .width, and .height properties.
      #            .npt_start and .npt_end may be included.
      #
      # Returns:
      #
      # The item id of the inserted annotation item.
      #
      # * * *
      #
      
  
      app.insertAnnotation = (coords) ->
        npt_start = if coords.npt_start? then coords.npt_start else parseFloat(app.getCurrentTime()) - 5
        npt_end = if coords.npt_end? then coords.npt_end else parseFloat(app.getCurrentTime()) + 5
        curMode = if coords.shapeType? then coords.shapeType else app.getCurrentMode()

        if shapeTypes[curMode]?
          shape = if shapeTypes[curMode].calc? then shapeTypes[curMode].calc(coords) else {}
          #
          # **FIXME:** We should ensure that we don't have clashing IDs. We need to use UUIDs when possible.
          # Using uuid() to generate local UUIDs - not truly a UUID, but close enough for now.
          #
          shapeAnnotationId = uuid()

          #
          # We do not allow shapes to define any of these properties:
          #
          # - id
          # - type
          # - bodyType
          # - bodyContent
          # - shapeType
          # - targetURI
          # - targetHeight
          # - targetWidth
          # - npt_start
          # - npt_end
          # - x
          # - y
          # - w
          # - h
          #
          # x, y, w, h define the bounding box about the shape based on the center and width/height.
          #
          shape.id           = "_:anno" + shapeAnnotationId
          shape.type         = "Annotation"
          shape.bodyType     = "Text"
          shape.bodyContent  = "This is an annotation for " + curMode
          shape.shapeType    = curMode
          shape.targetURI    = app.options.url
          shape.targetHeight = screenSize.height
          shape.targetWidth  = screenSize.width
          shape.npt_start    = if(npt_start<0) then 0 else npt_start
          shape.npt_end      = npt_end
          shape.x            = coords.x + (coords.width / 2)
          shape.y            = coords.y + (coords.height / 2)
          shape.w            = coords.width
          shape.h            = coords.height

          app.dataStore.canvas.loadItems [shape]
          app.setActiveAnnotation shape.id
          shape.id
  
      #
      # We have a few namespaces we expect. Anything not understood by the import/export
      # routines is ignored.
      #
      NS = 
        OA: "http://www.w3.org/ns/oa#"
        RDF: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        CNT: "http://www.w3.org/2011/content#"
        DC: "http://purl.org/dc/elements/1.1/"
        DCTERMS: "http://purl.org/dc/terms/"
        DCTYPES: "http://purl.org/dc/dcmitype/"
        EXIF: "http://www.w3.org/2003/12/exif/ns#"
    
      #
      # ### parseNPT (private)
      #
      # Given a string representing a timing, parse into a float representing seconds.
      #
      # Examples:
      #
      # parseNPT("30") == 30
      #
      # parseNPT("1:20") == 80 (1 minute, 20 seconds)
      #
      # parseNPT("1:2:3.4") == 3723.4 (1 hour, 2 minutes, 3.4 seconds)
      #
      # Parameters:
      #
      # * npt - string representing timing
      #
      # Returns:
      # A float representing the timing in seconds.
      # 
      parseNPT = (npt) ->
        if npt.indexOf(':') == -1
          seconds = parseFloat npt
          minutes = 0
          hours = 0
        else
          bits = ((parseFloat b) for b in npt.split(':'))
          seconds = bits.pop()
          if bits.length > 0
            minutes = bits.pop()
          else
            minutes = 0
          if bits.length > 0
            hours = bits.pop()
          else
            hours = 0
        (hours * 60 + minutes) * 60 + seconds
      
      #
      # ### #importData
      #
      # Finds annotations targeting the video given the target URI provided in the application configuration or
      # by the player driver binding.
      #
      # Parameters:
      #
      # * data - RDF/JSON representation of OAC annotations
      #
      # Returns:
      # Nothing.
      #
      # * * *
      app.importData = (data) ->
        tempstore = []
        for i, o of data
          #
          # We consider items with oa:Annotation as our starting point. Everything else we import must be
          # found by tracing pointers from these items.
          #
          if "#{NS.OA}Annotation" in (t.value for t in o["#{NS.RDF}type"])
            temp = 
              id: i
              type: "Annotation"
              bodyContent: ''
              bodyType: 'Text'
              targetURI: options.url
          
            #
            # If the item has a pointer through oa:hasBody, then we follow it and get the cnt:chars
            # value for the bodyContent property for the internal data model.
            #
            if o["#{NS.OA}hasBody"]? and o["#{NS.OA}hasBody"][0]? and data[o["#{NS.OA}hasBody"][0].value]?
              temp.bodyContent = data[o["#{NS.OA}hasBody"][0].value]["#{NS.CNT}chars"][0].value
            #
            # If the item has a pointer through oa:hasTarget, then we need to check which ones are
            # pointing to our video. **N.B.:** If the item is not targeting our video, we will not
            # reach the code that inserts the `temp` object into our MITHgrid data store.
            #
            if o["#{NS.OA}hasTarget"]?
              for hasTarget in (v.value for v in o["#{NS.OA}hasTarget"])
                if data[hasTarget]? and data[hasTarget]["#{NS.OA}hasSource"]?
                  if (options.url in (s.value for s in data[hasTarget]["#{NS.OA}hasSource"]))
                    #
                    # For each selector that the target source points to, we see if it's an
                    # oax:CompositeSelector. If not, we aren't interested since we want annotations
                    # targeting parts of video frames for time spans within the video.
                    #               
                    for hasSelector in (v.value for v in data[hasTarget]["#{NS.OA}hasSelector"])
                      if data[hasSelector]? and ("#{NS.OA}Composite" in (t.value for t in data[hasSelector]["#{NS.RDF}type"]))
                        for hasSubSelector in (v.value for v in data[hasSelector]["#{NS.OA}item"])
                          if data[hasSubSelector]?
                            #
                            # We go ahead and extract the types for this selector because someone
                            # might collapse multiple selector types into a single RDF node since
                            # oax:SvgSelector and oa:FragSelector don't share properties.
                            #
                            types = (t.value for t in data[hasSubSelector]["#{NS.RDF}type"])
                            #
                            # We expect SVG constraints to be found through oax:SvgSelector nodes.
                            #
                            if "#{NS.OA}SvgSelector" in types
                              if data[hasSubSelector]["#{NS.CNT}chars"]? and data[hasSubSelector]["#{NS.CNT}chars"][0]?
                                svg = data[hasSubSelector]["#{NS.CNT}chars"][0].value
                                dom = $.parseXML svg
                                #
                                # Based on the root element, we interogate the shape info to see
                                # which one wants to handle extracting the extents/etc. from the svg.
                                #
                                if dom?
                                  doc = dom.documentElement
                                  rootName = doc.nodeName
                                  for t, info of shapeTypes
                                    if info.extractFromSVG? and rootName in info.rootSVGElement
                                      shapeInfo = info.extractFromSVG doc
                                      if shapeInfo?
                                        $.extend(temp, shapeInfo)
                                        temp.shapeType = t
                                        if data[hasSubSelector]["#{NS.EXIF}width"]? and data[hasSubSelector]["#{NS.EXIF}width"][0]?
                                          temp.targetWidth = parseFloat data[hasSubSelector]["#{NS.EXIF}width"][0].value
                                        if data[hasSubSelector]["#{NS.EXIF}height"]? and data[hasSubSelector]["#{NS.EXIF}height"][0]?
                                          temp.targetHeight = parseFloat data[hasSubSelector]["#{NS.EXIF}height"][0].value
                                      
                              
                            #
                            # We get timing information from the oa:FragSelector.
                            #
                            if "#{NS.OA}FragmentSelector" in types
                              if data[hasSubSelector]["#{NS.RDF}value"]? and data[hasSubSelector]["#{NS.RDF}value"][0]?
                                fragment = data[hasSubSelector]["#{NS.RDF}value"][0].value
                                fragment = fragment.replace(/^t=npt:/, '')
                                bits = fragment.split(',')
                                temp.npt_start = parseNPT bits[0]
                                temp.npt_end   = parseNPT bits[1] 

            #
            # We only load an annotation if it has a shape type or a beginning or end time. Otherwise,
            # we're not interested since it doesn't represent anything we know what to do with.
            #
            if temp.npt_start? or temp.npt_end? or temp.shapeType?
              tempstore.push temp

        app.dataStore.canvas.loadItems tempstore

      # For now, we require that @context be "http://www.w3.org/ns/oa-context-20130208.json"
      # and exif map to the NS.EXIF namespace since we aren't using the JSON-LD api
      # for expanding the JSON-LD based on contexts
      app.importJSONLD = (data) ->
        if data['@context']?
          if !$.isArray(data['@context']) 
            if data['@context'] != "http://www.w3.org/ns/oa-context-20130208.json" 
              return
          else
            if "http://www.w3.org/ns/oa-context-20130208.json" not in data['@context']
              return
            if data['@context'][1]?.exif != NS.EXIF
              return
        
        graph = if data['@graph']? then data['@graph'] else data
        graph = [ graph ] if not $.isArray graph
        
        tempstore = []
        
        for anno in graph
          type = anno['@type']
          type = [ type ] unless $.isArray type
          if "oa:Annotation" not in type
            return

          if anno.hasBody?['@type'] != 'dctypes:Text'
            continue        
            
          if !anno.hasTarget? or anno.hasTarget['@type'] != 'oa:SpecificResource'
            continue
          
          if anno.hasTarget.hasSource != options.url
            continue

          item =
            id: anno['@id']
            type: 'Annotation'
            bodyContent: anno.hasBody.chars
            bodyType: 'Text'
            targetURI: options.url      
          
          if anno.hasTarget.hasSelector?
            if anno.hasTarget.hasSelector['@type'] == "oa:Composite"
              selectors = anno.hasTarget.hasSelector.item
            else
              selectors = anno.hasTarget.hasSelector
            selectors = [ selectors ] if not $.isArray selectors

            for selector in selectors
              switch selector['@type']
                when 'oa:FragmentSelector'
                  if selector.conformsTo? and selector.conformsTo == "http://www.w3.org/TR/media-frags/"
                    if selector.value? and selector.value[0..5] == "t=npt:"
                      bits = selector.value[6..].split(',')
                      if bits.length == 2
                        item.npt_start = parseNPT bits[0]
                        item.npt_end   = parseNPT bits[1]
                        
                when 'oa:SvgSelector'
                  if selector.format == "text/svg+xml" and selector.chars?
                    svg = selector.chars
                    dom = $.parseXML svg
                    #
                    # Based on the root element, we interogate the shape info to see
                    # which one wants to handle extracting the extents/etc. from the svg.
                    #
                    if dom?
                      doc = dom.documentElement
                      rootName = doc.nodeName
                      for t, info of shapeTypes
                        if info.extractFromSVG? and rootName in info.rootSVGElement
                          shapeInfo = info.extractFromSVG doc
                          if shapeInfo?
                            $.extend item, shapeInfo
                            item.shapeType = t
                    if selector["exif:height"]?
                      item.targetHeight = parseInt selector["exif:height"], 10
                    if selector["exif:width"]?
                      item.targetWidth = parseInt selector["exif:width"], 10

          if item.npt_start? and item.npt_end?
            tempstore.push item          
        
        app.dataStore.canvas.loadItems tempstore
        
      app.exportJSONLD = () ->
        jsonLD = {
          '@context': ["http://www.w3.org/ns/oa-context-20130208.json",{ 
            'exif': NS.EXIF 
          }]
          '@graph': [ ] 
        }
        findAnnos = app.dataStore.canvas.prepare ['!type']
        
        genBody = (obj) ->
          {
            '@type': 'dctypes:Text'
            'format': 'text/plain'
            'chars': obj.bodyContent[0]
          }
          
        genTarget = (obj) ->
          svgItem = {}
          fragItem = {}

          if obj.shapeType?
            svglens = shapeTypes[obj.shapeType[0]]?.renderAsSVG

          if svglens?
            svgItem =
              "@type": "oa:SvgSelector"
              "format": "text/svg+xml"
              "chars": svglens(app.dataStore.canvas, obj.id[0])
            if obj.targetHeight?[0]?
              svgItem["exif:height"] = obj.targetHeight?[0]
            else
              svgItem["exif:height"] = screenSize.height
            if obj.targetWidth?[0]?
              svgItem["exif:width"] = obj.targetWidth?[0]
            else
              svgItem["exif:width"] = screenSize.width
          fragItem =
            "@type": "oa:FragmentSelector"
            "value": 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]
            "conformsTo": "http://www.w3.org/TR/media-frags/"

          {
            "@type": "oa:SpecificResource"
            "hasSource": obj.targetURI[0]
            "hasSelector":
              "@type": "oa:Composite"
              "item": [ svgItem, fragItem ]
          }
          
        genAnno = (obj) ->
          {
            "@type": "oa:Annotation"
            "@id": obj.id?[0]
            "hasBody": genBody(obj)
            "hasTarget": genTarget(obj)
          }

        for id in findAnnos.evaluate('Annotation')
          jsonLD["@graph"].push genAnno app.dataStore.canvas.getItem id

        jsonLD
        
      # ### exportData
      #
      # Produces a OAC-based RDF/JSON representation of the annotations in the MITHgrid data store.
      #
      # Parameters: None.
      #
      # Returns:
      #
      # RDF/JSON that conforms to the OAC data model.
      #
      app.exportData = () ->
        data = {}
        tempstore = {}
        findAnnos = app.dataStore.canvas.prepare ['!type']
    
    
        node = (s, pns, p, t, o) ->
          if !tempstore[s]?
            tempstore[s] = {}
          if !tempstore[s][pns+p]?
            tempstore[s][pns+p] = []
          tempstore[s][pns+p].push
            'type': t
            'value': o
    
        bnode =   (s, pns, p, o) -> node s, pns, p, 'bnode',   o
        uri =     (s, pns, p, o) -> node s, pns, p, 'uri',     o
        literal = (s, pns, p, o) -> node s, pns, p, 'literal', o

        # #### genBody (private)
        #
        # Generates the body oject and adds it to tempstore
        #
        # Parameters:
        #
        # * obj - DataStore item
        #
        # * ids - Object holding ids for various parts of the RDF graph:
        #   * id - annotation resource (required)
        #   * buid - body resource
        #   * tuid - target resource
        #   * suid - selector resource
        #   * svgid - SvgSelector resource
        #   * fgid - FragSelector resource
        #
        genBody = (obj, ids) ->
          # Generating body element
          uri     ids.buid, NS.RDF, "type",   "#{NS.DCTYPES}Text"
          literal ids.buid, NS.DC,  "format", "text/plain"
          literal ids.buid, NS.CNT, "characterEncoding", "utf-8"
          literal ids.buid, NS.CNT, "chars",  obj.bodyContent[0]
          
        # #### genTarget (private)
        #
        # Generates a JSON object representing a target and adds it to tempstore
        #
        # Parameters
        #
        # * obj - dataStore item
        #
        # * ids - Object holding ids for various parts of the RDF graph:
        #   * id - annotation resource (required)
        #   * buid - body resource
        #   * tuid - target resource
        #   * suid - selector resource
        #   * svgid - SvgSelector resource
        #   * fgid - FragSelector resource
        #
        genTarget = (obj, ids) ->
          # Unique Identifiers for pieces of Target
      
          # Generating target element
          uri   ids.tuid, NS.RDF, "type",       "#{NS.OA}SpecificResource"
          uri   ids.tuid, NS.OA,  "hasSource",  obj.targetURI[0]
          bnode ids.tuid, NS.OA,  "hasSelector", ids.suid

          # Selector element, which points to the SVG constraint and NPT constraint
          uri   ids.suid, NS.RDF, "type",       "#{NS.OA}Composite"
          bnode ids.suid, NS.OA,  "item", ids.svgid
          bnode ids.suid, NS.OA,  "item", ids.fgid
        
          if obj.shapeType?
            svglens = shapeTypes[obj.shapeType[0]]?.renderAsSVG

          if svglens?
            # Targets have selectors, which then have svg and npt elements
            uri     ids.svgid, NS.RDF,  "type",              "#{NS.OA}SvgSelector"
            literal ids.svgid, NS.DC,   "format",            "text/svg+xml"
            literal ids.svgid, NS.CNT,  "characterEncoding", "utf-8"
            literal ids.svgid, NS.CNT,  "chars",             svglens(app.dataStore.canvas, obj.id[0])
            if obj.targetHeight? and obj.targetHeight[0]?
              literal ids.svgid, NS.EXIF, "height",        obj.targetHeight[0]
            else
              literal ids.svgid, NS.EXIF, "height",        screenSize.height
            if obj.targetWidth? and obj.targetWidth[0]?
              literal ids.svgid, NS.EXIF, "width",         obj.targetWidth[0]
            else
              literal ids.svgid, NS.EXIF, "width",         screenSize.width
    
          # This is inserted regardless of the shape type - it's a function of this being a
          # streaming video annotation client
          uri     ids.fgid, NS.RDF, "type",  "#{NS.OA}FragmentSelector"
          literal ids.fgid, NS.RDF, "value", 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]
          uri     ids.fgid, NS.DCTERMS, "conformsTo", "http://www.w3.org/TR/media-frags/"

        # #### createJSONObjSeries (private)
        #
        # Creates the necessary series of objects to be inserted
        # into the exported JSON. Only called if there isn't already a RDF:JSON object that was imported with a matching ID
        #
        # Parameters:
        #
        # * ids - Object holding ids for various parts of the RDF graph:
        #   * id - annotation resource (required)
        #   * buid - body resource
        #   * tuid - target resource
        #   * suid - selector resource
        #   * svgid - SvgSelector resource
        #   * fgid - FragSelector resource
        #
        createJSONObjSeries = (ids) ->
          obj = app.dataStore.canvas.getItem ids.id
          ids.buid ?= '_:b' + uuid()
          ids.tuid ?= '_:t' + uuid()
          ids.suid ?= '_:sel' + uuid()
          ids.svgid ?= '_:sel' + uuid()
          ids.fgid ?= '_:sel' + uuid()

          uri   ids.id, NS.RDF, "type",      "#{NS.OA}Annotation"
          bnode ids.id, NS.OA,  "hasBody",   ids.buid
          bnode ids.id, NS.OA,  "hasTarget", ids.tuid

          genBody obj, ids
          genTarget obj, ids

        mergeData = (id) ->
          obj = app.dataStore.canvas.getItem id
          
          #
          # TODO: Rebuild the merging functionality that allows us to correct a prior version of the
          # annotations. For now, mergeData simply exports the data regardless of what's in the data
          # variable.
          #
          createJSONObjSeries 
            id: obj.id

        for o in findAnnos.evaluate('Annotation')
          mergeData o

        tempstore

      # ## Application Configuration
      #
      # The rest of this prepares the annotation application once it's in the up-and-running process.
      #
      # We wrap all of this in the app.ready() call so we will have all of the events, presentations,
      # data stores, etc., instantiated for us.
      #
      app.ready ->
        # We want the SVG overlay and the annotation body presentation to react to changes in
        # the selection focus.
        app.events.onActiveAnnotationChange.addListener app.presentation.raphsvg.eventFocusChange

        # We always want the current annotation list to include anything that covers a time within five seconds
        # of the current time.
        app.events.onCurrentTimeChange.addListener (t) ->
          app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5)
          playerObj.setPlayhead t
          # Making sure that none of the button items are still active while video is playing
          # (Can't draw a shape while video is playing - force user to re-click item)
          if app.getCurrentMode() != "Watch"
            app.setCurrentMode null

        app.setCurrentTime playerObj.getPlayhead()
        playerObj.events.onPlayheadUpdate.addListener app.setCurrentTime

        app.events.onCurrentModeChange.addListener (nmode) ->
          if nmode != 'Watch'
            playerObj.pause()
          else if nmode == 'Watch'
            playerObj.play()

      # We want to populate the available shapes with the rectangle and ellipse. These are considered stock
      # shapes for annotations.
      app.ready ->
        # Using addShapeType to add Rectangle to the array of possible SVG
        # shapes
        app.addShapeType "Rectangle",
          #
          # Renders the SVG <rect/> element representing the rectangle
          #
          # Parameters:
          #
          # * model - the data store or data view holding information abut the item to be rendered
          #
          # * itemId - the item ID of the item to be rendered
          # 
          renderAsSVG: (model, itemId) ->
            item = model.getItem itemId
            "<rect x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"

          #
          # We are interested in <rect/> elements. If the SvgConstraint is a <rect/> element, then
          # the import routine will call the extractFromSVG() function and the imported annotation
          # will have a shapeType of "Rectangle"
          #
          rootSVGElement: ["rect"]
                
          extractFromSVG: (svg) ->
            info = {}
            info.w = parseFloat svg.getAttribute('width')
            info.h = parseFloat svg.getAttribute('height')
            info.x = parseFloat svg.getAttribute('x')
            info.y = parseFloat svg.getAttribute('y')
            info
        
          #
          # Renders the rectangular constraint on the video target.
          #
          # Parameters:
          #
          # * container - the container holding the lens content
          #
          # * view - the presentation managing the collection of renderings
          #
          # * model - the data store or data view holding information abut the item to be rendered
          #
          # * itemId - the item ID of the item to be rendered
          #
          # Returns:
          #
          # The rendering object.
          #
          lens: (container, view, model, itemId) ->
            # Note: Rectangle measurements x,y start at CENTER
            # Initiate object with super-class methods and variables
            app.initShapeLens container, view, model, itemId, (that) ->
              item = model.getItem itemId

              # Accessing the view.canvas Object that was created in MITHgrid.Presentation.RaphSVG
              [x, y] = that.scalePoint item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.targetWidth, item.targetHeight
              [w, h] = that.scalePoint item.w[0], item.h[0], item.targetWidth, item.targetHeight
          
              c = view.canvas.rect(x, y, w, h)

              that.shape = c
              # fill and set opacity
              c.attr
                fill: "silver"
                border: "grey"
              that.setOpacity()

              $(c.node).css
                "pointer-events": "auto"

              selectBinding = app.controller.selectShape.bind c
              selectBinding.events.onSelect.addListener ->
                app.setActiveAnnotation(itemId)

              superUpdate = that.update
              that.update = (newItem) ->
                # receiving the Object passed through
                # model.updateItems in move()
                item = newItem
                superUpdate item
                if item.x? and item.y? and item.w? and item.h?
                  [x, y] = that.scalePoint item.x[0], item.y[0], item.targetWidth, item.targetHeight
                  [w, h] = that.scalePoint item.w[0], item.h[0], item.targetWidth, item.targetHeight
                  c.attr
                    x: x - w / 2
                    y: y - h / 2
                    width: w
                    height: h

              # calculate the extents (x, y, width, height)
              # of this type of shape
              that.getExtents = ->
                x: c.attr("x") + (c.attr("width") / 2)
                y: c.attr("y") + (c.attr("height") / 2)
                width: c.attr("width")
                height: c.attr("height")

        app.addShapeType "Ellipse",
          # Generates a JSON object containing the measurements for an
          # ellipse object but only using x, y, w, h
          #
          # Returns:
          # JSON object
          #calc: (coords) ->
          # x: coords.x + (coords.width / 2)
          # y: coords.y + (coords.height / 2)
          # w: coords.width
          # h: coords.height
          
          #
          # Renders the SVG <rect/> element representing the rectangle
          #
          # Parameters:
          #
          # * model - the data store or data view holding information abut the item to be rendered
          #
          # * itemId - the item ID of the item to be rendered
          # 
          renderAsSVG: (model, itemId) ->
            item = model.getItem itemId
            "<ellipse x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"
          
          rootSVGElement: ["ellipse"]
        
          extractFromSVG: (svg) ->
            info = {}
            info.w = parseFloat svg.getAttribute('width')
            info.h = parseFloat svg.getAttribute('height')
            info.x = parseFloat svg.getAttribute('x')
            info.y = parseFloat svg.getAttribute('y')
            info
          #
          # Rendering Lens for the Ellipse SVG shape
          #
          # Parameters:
          #
          # * container - the container holding the lens content
          #
          # * view - the presentation managing the collection of renderings
          #
          # * model - the data store or data view holding information abut the item to be rendered
          #
          # * itemId - the item ID of the item to be rendered
          #
          # Returns:
          #
          # The rendering object.
          #
          lens: (container, view, model, itemId) ->
            app.initShapeLens container, view, model, itemId, (that) ->
              item = model.getItem itemId

              # create the shape
              [x, y] = that.scalePoint item.x[0], item.y[0], item.targetWidth, item.targetHeight
              [w, h] = that.scalePoint item.w[0]/2, item.h[0]/2, item.targetWidth, item.targetHeight
              c = view.canvas.ellipse(x, y, w, h)
              that.shape = c

              # fill shape
              c.attr
                fill: "silver"
                border: "grey"
              that.setOpacity()
              $(c.node).css
                "pointer-events": "auto"

              selectBinding = app.controller.selectShape.bind c
              selectBinding.events.onSelect.addListener ->
                app.setActiveAnnotation(itemId)

              superUpdate = that.update

              that.update = (item) ->
                # receiving the Object passed through
                # model.updateItems in move()
                superUpdate item

                if item.x? and item.y?
                  [x, y] = that.scalePoint item.x[0], item.y[0], item.targetWidth, item.targetHeight
                  [w, h] = that.scalePoint item.w[0], item.h[0], item.targetWidth, item.targetHeight
                  c.attr
                    cx: x
                    cy: y
                    rx: w / 2
                    ry: h / 2
          
              # calculate the extents (x, y, width, height)
              # of this type of shape
              that.getExtents = ->
                x: c.attr("cx")
                y: c.attr("cy")
                width: (c.attr("rx") * 2)
                height: (c.attr("ry") * 2)

        app.setCurrentTime 0