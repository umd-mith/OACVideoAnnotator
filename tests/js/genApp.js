(function() {
  var initPlugin;

  initPlugin = function(raphApp) {
    var initStreamingVideoApp;
    initStreamingVideoApp = function(playerObj) {
      var callback, callback2;
      raphApp = OAC.Client.StreamingVideo.initApp("#content-container", {
        playerWrapper: '#myplayer',
        url: 'http://www.youtube.com/watch?v=HYLacuAp76U&feature=fvsr',
        easement: 5
      });
      callback = function(playerobj) {
        return raphApp.ready(function() {
          return raphApp.setPlayer(playerobj);
        });
      };
      setTimeout(callback, 1);
      callback2 = function() {
        return raphApp.run();
      };
      return setTimeout(callback2, 10);
    };
    return OAC_Controller.on_new_player(initStreamingVideoApp);
  };

  $(document).ready = function(app) {
    return initPlugin(app);
  };

}).call(this);
