(function() {

  $(document).ready(function() {
    var playerObject, setupApp, testdata;
    module("Views");
    playerObject = {
      getcoordinates: function() {
        return [0, 0];
      },
      getsize: function() {
        return [100, 100];
      },
      play: function() {
        return true;
      },
      pause: function() {
        return true;
      },
      onPlayheadUpdate: function(callback) {
        setTimeout(callback, 1000);
        return true;
      },
      getPlayhead: function() {
        return 0;
      }
    };
    testdata = [
      {
        id: 'anno1',
        type: 'Annotation',
        bodyType: 'Text',
        bodyContent: 'anno1_',
        shapeType: 'Rectangle',
        opacity: 0,
        x: 1,
        y: 1,
        w: 10,
        h: 10,
        npt_start: 0,
        npt_end: 15
      }, {
        id: 'anno2',
        type: 'Annotation',
        bodyType: 'Text',
        bodyContent: 'anno2_',
        shapeType: 'Rectangle',
        opacity: 0,
        x: 1,
        y: 1,
        w: 10,
        h: 10,
        npt_start: 30,
        npt_end: 45
      }, {
        id: 'anno3',
        type: 'Annotation',
        bodyType: 'Text',
        bodyContent: 'anno2_',
        shapeType: 'Rectangle',
        opacity: 0,
        x: 1,
        y: 1,
        w: 10,
        h: 10,
        npt_start: 31,
        npt_end: 40
      }
    ];
    setupApp = function() {
      var app;
      app = OAC.Client.StreamingVideo.initApp('#content-container', {
        url: 'http://youtube.com/',
        playerWrapper: '#myplayer'
      });
      app.ready(function() {
        return app.setPlayer(playerObject);
      });
      app.run();
      app.dataStore.canvas.loadItems(testdata);
      return app;
    };
    test("Check views", function() {
      var app, checkContains, checkEventTrigger, expectAnnos, size;
      expect(24);
      app = setupApp();
      checkContains = function(i, o) {
        return ok(app.dataView.currentAnnotations.contains(o.id) != null, i + " is contained in currentAnnotations");
      };
      $.each(testdata, checkContains);
      checkContains = function(i, o) {
        var check;
        check = app.dataView.currentAnnotations.contains(i);
        return ok(check = o != null, i + ' is ' + o);
      };
      checkEventTrigger = function() {
        start();
        ok(true, "OnModelChange is called");
        return $.each(expectAnnos, checkContains);
      };
      app.dataView.currentAnnotations.events.onModelChange.addListener(checkEventTrigger);
      expectAnnos = {
        'anno1': true,
        'anno2': false,
        'anno3': false
      };
      app.setCurrentTime(3);
      stop();
      expectAnnos = {
        'anno1': false,
        'anno2': true,
        'anno3': true
      };
      app.setCurrentTime('33');
      stop();
      app.dataStore.canvas.removeItems(['anno2']);
      expectAnnos = {
        'anno1': false,
        'anno3': true
      };
      size = app.dataView.currentAnnotations.size();
      ok(size = 2, "Size is correct");
      return app.dataView.currentAnnotations.events.onModelChange.removeListener(checkEventTrigger);
    });
    test("Check presentations", function() {
      var app, callback, expectAnnos, rendering, walkRenderings;
      expect(16);
      app = setupApp();
      ok(app.presentation.raphsvg.hasLens('Rectangle'), "Rectangle lens present");
      ok(app.presentation.raphsvg.hasLens('Ellipse'), "Ellipse lens present");
      expectAnnos = {
        'anno1': true,
        'anno2': true,
        'anno3': true
      };
      walkRenderings = function(i, r) {
        return ok(expectAnnos[i] != null, i + " in renderings array");
      };
      app.presentation.raphsvg.visitRenderings(walkRenderings);
      rendering = app.presentation.raphsvg.renderingFor('anno1');
      callback = function(i, o) {
        return ok($.isFunction(rendering[o]) != null, "rendering." + o + " exists");
      };
      return $.each(['eventTimeEasementChange', 'eventCurrentTimeChange', 'setOpacity', 'eventFocus', 'eventUnfocus', 'eventDelete', 'eventResize', 'eventMove', 'update', 'remove', 'getExtents'], callback);
    });
    return test("Check Shape Lens", function() {
      var app, changeListen, coords, obj, opac;
      expect(10);
      app = setupApp();
      changeListen = function(n) {
        start();
        return ok(obj.opacity[0] >= opac, "opacity is now " + obj.opacity[0] + ' formerly: ' + opac);
      };
      app.events.onCurrentTimeChange.addListener(changeListen);
      obj = app.dataStore.canvas.getItem('anno2');
      opac = obj.opacity[0];
      app.setCurrentTime(20);
      stop();
      opac = obj.opacity[0];
      app.setCurrentTime(26);
      stop();
      opac = obj.opacity[0];
      app.setCurrentTime(27);
      stop();
      opac = obj.opacity[0];
      app.setCurrentTime(28);
      stop();
      opac = obj.opacity[0];
      app.events.onCurrentTimeChange.removeListener(changeListen);
      changeListen = function(n) {
        start();
        return ok(obj.opacity[0] < opac, "opacity is now " + obj.opacity[0] + " formerly: " + opac);
      };
      app.events.onCurrentTimeChange.addListener(changeListen);
      app.setCurrentTime(50);
      stop();
      opac = obj.opacity[0];
      app.setCurrentTime(52);
      stop();
      opac = obj.opacity[0];
      app.setCurrentTime(55);
      stop();
      app.events.onCurrentTimeChange.removeListener(changeListen);
      changeListen = function(id) {
        ok(id = obj.id[0] != null, "ID passed in activeAnnotationChange same as expected");
        return ok(obj.opacity[0] = 1.0 != null, "Opacity now set to 1");
      };
      app.setCurrentTime(3);
      app.events.onActiveAnnotationChange.addListener(changeListen);
      obj = app.dataStore.canvas.getItem('anno1');
      app.setActiveAnnotation('anno1');
      app.events.onActiveAnnotationChange.removeListener(changeListen);
      changeListen = function(view, items) {
        start();
        obj = app.dataStore.canvas.getItem(items[0]);
        ok(obj.opacity[0] = 1, "Opacity is " + obj.opacity[0]);
        return ok(obj.npt_start[0] = app.getCurrentTime() - 5, "npt_start " + obj.npt_start[0]);
      };
      app.dataView.currentAnnotations.events.onModelChange.addListener(changeListen);
      app.setCurrentTime(20);
      app.setCurrentMode('Rectangle');
      coords = {
        'x': 10,
        'y': 3,
        'width': 100,
        'height': 100
      };
      app.insertShape(coords);
      stop();
      app.dataView.currentAnnotations.events.onModelChange.removeListener(changeListen);
      changeListen = function() {
        start();
        ok(app.dataView.currentAnnotations.contains(obj.id[0]), "annotation " + obj.id[0] + " contained");
        return ok(obj.opacity[0] != null, "Opacity " + obj.opacity[0]);
      };
      app.dataView.currentAnnotations.events.onModelChange.addListener(changeListen);
      app.setCurrentTime(22);
      stop();
      app.setCurrentTime(35);
      stop();
      return app.dataView.currentAnnotations.events.onModelChange.removeListener(changeListen);
    });
  });

}).call(this);
