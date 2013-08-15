MITHgrid.defaults "OAC.Client.StreamingVideo.Drupal.Hover",
  bind:
    events:
      onFocus: null
      onUnfocus: null

OAC.Client.StreamingVideo.namespace 'Drupal', (Drupal) ->
  Drupal.namespace 'Application', (Application) ->
    Application.initInstance = (args...) ->
      OAC.Client.StreamingVideo.Application.initInstance "OAC.Client.StreamingVideo.Drupal.Application", args..., (that) ->
        appFn = -> that
        
        that.ready ->

(($) ->
  Drupal.behaviors.video_annotator =
    attach: (context, settings) ->
      settings = settings.video_annotator
      # We want to tie together the videoanno.js pieces and the drupal page
      # view. We want to find all of the videos for which we have a driver
      # and create a unified annotation management interface for them. That is,
      # we want a single set of controls to manage annotations in all videos.
      # We associate their events with the video we're closest to. They can
      # float down the page as needed.
      
      # We want all of the controls to hide away except for some small icon that
      # can be clicked to bring up the annotation HUD, which can float off to
      # the side of the video.
      
      # When possible, the controls should float off to the side in the middle
      # of the page, but if the page is scrolled all the way up or down, we
      # may need to do something different.
      
      # Another option: have a control/selector pop up when the mouse hovers
      # near a video on the page.
      
      # We gather all annotations from the server in one call
      # we need to pull in available annotations from the server
      # based on the page we're on and the url of the player's video
      # this page: window.document.location.href or
      #            window.document.location.pathname
      annotationJSONLD = null
      needAnnos = []
      

      #
      # WE need to build out the controls palette based on the settings.controls and settings.permissions
      #

      uri_from_template = (template, variables) ->
        if template?
          out = template.replace('{id}', variables.id)
          out = out.replace('{scope_id}', settings.scope_id)
          out

      $.ajax
        url: uri_from_template(settings?.urls?.collection?.get, {
            id: 0
          })
        dataType: 'json'
        success: (data) ->
          console.log "Data:", data
          if data?
            annotationJSONLD = data
            for a in needAnnos
              a.importJSONLD data
            needAnnos = []
        error: ->
          console.log("Unable to get annotations from server")
      
      OAC.Client.StreamingVideo.Player.onNewPlayer.addListener (playerobj) ->
        app = OAC.Client.StreamingVideo.Drupal.Application.initInstance
          player: playerobj
        app.run()
        if annotationJSONLD?
          app.importJSONLD annotationJSONLD
        else
          needAnnos.push app

      $.ajax
        url: 'http://localhost/~jgsmith/drupal/?q=services/session/token'
        type: 'GET'
        success: (csr_token) -> 
          console.log 'CSR Token: ', csr_token

          $.ajax
            url: uri_from_template(settings?.urls?.collection?.post, {
                id: 0
              })
            dataType: 'json'
            contentType: 'application/json'
            type: 'POST'
            headers:
              'X-CSRF-Token': csr_token
            success: (data) ->
              console.log "Data returned:", data
            error: (err) ->
              console.log "Err:", err
            data: JSON.stringify
              "@context":
                "oa":"http://www.w3.org/ns/oa#"
                "rdf":"http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                "cnt":"http://www.w3.org/2011/content#"
                "dc":"http://purl.org/dc/elements/1.1/"
                "dcterms":"http://purl.org/dc/terms/"
                "exif":"http://www.w3.org/2003/12/exif/ns#"
                "foaf":"http://xmlns.com/foaf/0.1/"
                "height":"exif:height"
                "width":"exif:width"
                "id":"@id"
                "type":"@type"
                "graph":"@graph"
                "value":"rdf:value"
                "annotatedBy":{"@id":"oa:annotatedBy","@type":"@id"}
                "serializedBy":{"@id":"oa:serializedBy","@type":"@id"}
                "motivatedBy":{"@id":"oa:motivatedBy","@type":"@id"}
                "equivalentTo":{"@id":"oa:equivalentTo","@type":"@id"}
                "styledBy":{"@id":"oa:styledBy","@type":"@id"}
                "cachedSource":{"@id":"oa:cachedSource","@type":"@id"}
                "conformsTo":{"@id":"dcterms:conformsTo","@type":"@id"}
                "default":{"@id":"oa:default","@type":"@id"}
                "first":{"@id":"rdf:first","@type":"@id"}
                "rest":{"@id":"rdf:rest","@container":"@list","@type":"@id"}
                "body":{"@id":"oa:hasBody","@type":"@id"}
                "target":{"@id":"oa:hasTarget","@type":"@id"}
                "chars":"cnt:chars"
                "format":"dc:format"
                "source":{"@id":"oa:hasSource","@type":"@id"}
                "selector":{"@id":"oa:hasSelector","@type":"@id"}
                "scope":{"@id":"oa:hasScope","@type":"@id"}
                "item":{"@id":"oa:item","@type":"@id"}
              "@graph":[{
                "type": "oa:Annotation"
                "body":
                  "type":[
                    "cnt:ContentAsText"
                    "dctypes:Text"
                  ]
                  "format":"text/plain"
                  "chars":"This is a comment..."
                "target":
                  "source":"http://www.example.com/movies/4.m4v"
                  "type":"oa:SpecificResource"
                  "scope":"/~jgsmith/drupal/?q=node/1"
                  "selector":
                    "type":"oa:CompoundSelector"
                    "item":[{
                      "type":"oa:FragmentSelector"
                      "conformsTo":"http://www.w3.org/TR/media-frags/"
                      "value":"t=npt:1,2.5"
                    }, {
                      "type":"oa:SVGSelector"
                      "chars":"<rect x=\"101\" y=\"202\" w=\"303\" h=\"404\" />"
                      "width":606
                      "height":505
                    }]
              }]
    
)(jQuery)
  