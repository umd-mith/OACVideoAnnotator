(function() {

  $(document).ready(function() {
    module("Streaming Video");
    test("Check namespace", function() {
      expect(2);
      ok(OAC.Client != null, "OAC.Client");
      return ok(OAC.Client.StreamingVideo != null, "OAC.Client.StreamingVideo");
    });
    return test("Check construction", function() {
      var app, initPlugin;
      expect(19);
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
          setTimeout(callback2, 10);
          ok($.isFunction(app.setActiveAnnotation) != null, "setActiveAnnotation");
          ok($.isFunction(app.getActiveAnnotation) != null, "getActiveAnnotation");
          ok($.isFunction(app.setCurrentTime) != null, "setCurrentTime");
          ok($.isFunction(app.getCurrentTime) != null, "getCurrenTime");
          ok($.isFunction(app.setTimeEasement) != null, "setTimeEasement");
          ok($.isFunction(app.getTimeEasement) != null, "getTimeEasement");
          ok($.isFunction(app.setCurrentMode) != null, "setCurrentMode");
          ok($.isFunction(app.getCurrentMode) != null, "getCurrentMode");
          ok($.isFunction(app.setPlayer) != null, "setPlayer");
          ok($.isFunction(app.getPlayer) != null, "getPlayer");
          ok($.isFunction(app.initShapeLens) != null, "initShapeLens");
          ok($.isFunction(app.initTextLens) != null, "initTextLens");
          ok($.isFunction(app.buttonFeature) != null, "buttonFeature");
          ok($.isFunction(app.addShape) != null, "addShape");
          ok($.isFunction(app.addBody) != null, "addBody");
          ok($.isFunction(app.addShapeType) != null, "addShapeType");
          ok($.isFunction(app.insertShape) != null, "insertShape");
          ok($.isFunction(app.importData) != null, "importData");
          return ok($.isFunction(app.exportData) != null, "exportData");
        };
        return OAC_Controller.on_new_player(initStreamingVideoApp);
      };
      app = {};
      return initPlugin(app);
    });
  });

}).call(this);
