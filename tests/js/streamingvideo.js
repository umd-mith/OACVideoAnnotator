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
      expect(37);
      initPlugin = function(raphApp) {
        var initStreamingVideoApp;
        initStreamingVideoApp = function(playerObj) {
          var callback, callback2, eveHandler, eveTester, val;
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
            raphApp.run();
            return start();
          };
          setTimeout(callback2, 10);
          stop();
          ok($.isFunction(raphApp.setActiveAnnotation) != null, "setActiveAnnotation");
          ok($.isFunction(raphApp.getActiveAnnotation) != null, "getActiveAnnotation");
          ok(raphApp.events.onActiveAnnotationChange != null, "Event set: active annotation");
          ok($.isFunction(raphApp.setCurrentTime) != null, "setCurrentTime");
          ok($.isFunction(raphApp.getCurrentTime) != null, "getCurrentTime");
          ok(raphApp.events.onCurrentTimeChange != null, "Event set: current time");
          ok($.isFunction(raphApp.setTimeEasement) != null, "setTimeEasement");
          ok($.isFunction(raphApp.getTimeEasement) != null, "getTimeEasement");
          ok(raphApp.events.onTimeEasementChange != null, "Event set: time easement");
          ok($.isFunction(raphApp.setCurrentMode) != null, "setCurrentMode");
          ok($.isFunction(raphApp.getCurrentMode) != null, "getCurrentMode");
          ok(raphApp.events.onCurrentModeChange != null, "Event set: current mode");
          ok($.isFunction(raphApp.setPlayer) != null, "setPlayer");
          ok($.isFunction(raphApp.getPlayer) != null, "getPlayer");
          ok(raphApp.events.onPlayerChange != null, "Event set: player");
          eveTester = function() {
            start();
            return ok(true, "Event called");
          };
          eveHandler = function(eve, obj) {
            return obj.addListener(eveTester);
          };
          $.each(raphApp.events, eveHandler);
          val = 'anno9008-9000-0112b';
          raphApp.setActiveAnnotation(val);
          stop();
          ok(raphApp.getActiveAnnotation = val != null, "getActiveAnnotation returned correct value");
          val = 4;
          raphApp.setCurrentTime(val);
          stop();
          ok(raphApp.getCurrentTime = val != null, "getCurrentTime returned correct value");
          val = 2;
          raphApp.setTimeEasement(val);
          stop();
          ok(raphApp.getTimeEasement = val != null, "getTimeEasement returned correct value");
          val = 'Watch';
          raphApp.setCurrentMode(val);
          stop();
          ok(raphApp.getCurrentMode = val != null, "getCurrentMode returned correct value");
          raphApp.setPlayer(playerObj);
          stop();
          ok(raphApp.getPlayer = playerObj != null, "getPlayer returned correct value");
          ok($.isFunction(raphApp.initShapeLens) != null, "initShapeLens");
          ok($.isFunction(raphApp.initTextLens) != null, "initTextLens");
          ok($.isFunction(raphApp.buttonFeature) != null, "buttonFeature");
          ok($.isFunction(raphApp.addShape) != null, "addShape");
          ok($.isFunction(raphApp.addBody) != null, "addBody");
          ok($.isFunction(raphApp.addShapeType) != null, "addShapeType");
          ok($.isFunction(raphApp.insertShape) != null, "insertShape");
          ok($.isFunction(raphApp.importData) != null, "importData");
          return ok($.isFunction(raphApp.exportData) != null, "exportData");
        };
        return OAC_Controller.on_new_player(initStreamingVideoApp);
      };
      app = {};
      return initPlugin(app);
    });
  });

}).call(this);
