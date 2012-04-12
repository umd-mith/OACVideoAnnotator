(function() {

  $(document).ready(function() {
    var playerObject, testdata;
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
        x: 1,
        y: 1,
        w: 10,
        h: 10,
        npt_start: 31,
        npt_end: 40
      }
    ];
    return test("Check views", function() {
      var app, callback, checkContains, expectAnnos;
      expect(9);
      app = OAC.Client.StreamingVideo.initApp('#content-container', {
        url: 'http://youtube.com/',
        playerWrapper: '#myplayer'
      });
      app.ready(function() {
        return app.setPlayer(playerObject);
      });
      app.run();
      app.dataStore.canvas.loadItems(testdata);
      checkContains = function(i, o) {
        return ok(app.dataView.currentAnnotations.contains(o.id) != null, i + " is contained in currentAnnotations");
      };
      $.each(testdata, checkContains);
      checkContains = function(i, o) {
        var check;
        check = app.dataView.currentAnnotations.contains(i);
        return ok(check = o, i + ' is ' + o);
      };
      callback = function(n) {
        console.log('time is now: ' + n);
        $.each(expectAnnos, checkContains);
        return start();
      };
      app.events.onCurrentTimeChange.addListener(callback);
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
      return stop();
    });
  });

}).call(this);
