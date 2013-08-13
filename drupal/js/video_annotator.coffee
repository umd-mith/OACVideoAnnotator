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
      
    
)(jQuery)
  