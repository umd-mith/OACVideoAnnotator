(function() {

  $(document).ready(function() {
    module("Streaming Video");
    test("Check namespace", function() {
      expect(2);
      ok(OAC.Client != null, "OAC.Client");
      return ok(OAC.Client.StreamingVideo != null, "OAC.Client.StreamingVideo");
    });
    return test("Check construction", function() {
      expect(19);
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
    });
  });

}).call(this);
