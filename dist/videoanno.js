
/*
# OAC Video Annotation Tool v
# 
# The **OAC Video Annotation Tool** is a MITHGrid application providing annotation capabilities for streaming
# video embedded in a web page. 
#  
# Date: Mon Apr 30 11:34:48 2012 -0400
#  
# Educational Community License, Version 2.0
# 
# Copyright 2011 University of Maryland. Licensed under the Educational
# Community License, Version 2.0 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of the License at
# 
# http:#www.osedu.org/licenses/ECL-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# Author: Grant Dickie
*/

(function() {
  var OAC,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  OAC = MITHGrid.globalNamespace("OAC");

  OAC.namespace("Client");

  OAC.Client.namespace("StreamingVideo");

  (function($, MITHGrid, OAC) {
    var S4, canvasId, initDummyPlayer, initHTML5PlayerDrv, initOACDummyPlayerDrv, uuid;
    OAC.Client.StreamingVideo.namespace('Controller', function(Controller) {
      var relativeCoords;
      relativeCoords = function(currentElement, event) {
        var totalOffsetX, totalOffsetY;
        totalOffsetX = 0;
        totalOffsetY = 0;
        while (currentElement != null) {
          totalOffsetX += currentElement.offsetLeft;
          totalOffsetY += currentElement.offsetTop;
          currentElement = currentElement.offsetParent;
        }
        return {
          x: event.pageX - totalOffsetX,
          y: event.pageY - totalOffsetY
        };
      };
      Controller.namespace("KeyboardListener", function(KeyboardListener) {
        return KeyboardListener.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.KeyboardListener"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var doc;
              doc = binding.locate('doc');
              options.application.events.onActiveAnnotationChange.addListener(function(id) {
                var activeId;
                return activeId = id;
              });
              return $(doc).keydown(function(e) {
                var activeId, _ref;
                if (options.application.getCurrentMode() === 'Editing') return;
                if (typeof activeId !== "undefined" && activeId !== null) {
                  if ((_ref = e.keyCode) === 8 || _ref === 46) {
                    binding.events.onDelete.fire(activeId);
                    return activeId = null;
                  }
                }
              });
            };
          }]));
        };
      });
      Controller.namespace("Drag", function(Drag) {
        return Drag.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller.Raphael).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.Drag"].concat(__slice.call(args), [function(that) {
            that.applyBindings = function(binding) {
              var dend, dmid, dstart, el;
              el = binding.locate('raphael');
              dstart = function(x, y, e) {
                var pos;
                pos = relativeCoords(el.node, e);
                return binding.events.onFocus.fire(pos.x, pos.y);
              };
              dend = function() {
                return binding.events.onUnfocus.fire();
              };
              dmid = function(x, y) {
                return binding.events.onUpdate.fire(x, y);
              };
              return el.drag(dmid, dstart, dend);
            };
            return that.removeBindings = function(binding) {
              var el;
              el = binding.locate('raphael');
              return el.undrag;
            };
          }]));
        };
      });
      Controller.namespace("Select", function(Select) {
        return Select.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller.Raphael).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.Select"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding) {
              var el;
              el = binding.locate("raphael");
              return el.click(function(e) {
                if (options.isSelectable()) return binding.events.onSelect.fire();
              });
            };
          }]));
        };
      });
      Controller.namespace("TextBodyEditor", function(TextBodyEditor) {
        return TextBodyEditor.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.TextBodyEditor"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var allAnnos, annoEl, bindingActive, bodyContent, deleteButton, editArea, editButton, editEnd, editStart, editUpdate, prevMode, textArea, updateButton;
              annoEl = binding.locate('annotation');
              bodyContent = binding.locate('body');
              allAnnos = binding.locate('annotations');
              textArea = binding.locate('textarea');
              editArea = binding.locate('editarea');
              editButton = binding.locate('editbutton');
              updateButton = binding.locate('updatebutton');
              deleteButton = binding.locate('deletebutton');
              bindingActive = false;
              prevMode = null;
              editStart = function() {
                $(editArea).show();
                $(bodyContent).hide();
                bindingActive = true;
                return binding.events.onClick.fire(opts.itemId);
              };
              editEnd = function() {
                $(editArea).hide();
                $(bodyContent).show();
                return bindingActive = false;
              };
              editUpdate = function(e) {
                var data;
                data = $(textArea).val();
                e.preventDefault();
                binding.events.onUpdate.fire(opts.itemId, data);
                return editEnd();
              };
              $(annoEl).bind('dblclick', function(e) {
                e.preventDefault();
                if (bindingActive) {
                  editEnd();
                  return options.application.setCurrentMode(prevMode || '');
                } else {
                  editStart();
                  prevMode = options.application.getCurrentMode();
                  return options.application.setCurrentMode('TextEdit');
                }
              });
              $(annoEl).bind('click', function(e) {
                return options.application.setActiveAnnotation(opts.itemId);
              });
              $(updateButton).bind('click', function(e) {
                binding.events.onUpdate.fire(opts.itemId, $(textArea).val());
                editEnd();
                return options.application.setCurrentMode(prevMode);
              });
              $(deleteButton).bind('click', function(e) {
                binding.events.onDelete.fire(opts.itemId);
                return $(annoEl).remove();
              });
              options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id !== opts.id && bindingActive) {
                  editUpdate({
                    preventDefault: function() {}
                  });
                  return editEnd();
                }
              });
              return options.application.events.onCurrentModeChange.addListener(function(newMode) {
                if (newMode !== 'TextEdit') return editEnd();
              });
            };
          }]));
        };
      });
      Controller.namespace("CanvasClickController", function(CanvasClickController) {
        return CanvasClickController.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.CanvasClickController"].concat(__slice.call(args), [function(that) {
            var options, overlay;
            options = that.options;
            overlay = null;
            return that.applyBindings = function(binding, opts) {
              var captureMouse, closeEnough, drawOverlay, drawShape, mouseCaptured, paper, removeOverlay, renderings, selectShape, uncaptureMouse;
              closeEnough = opts.closeEnough;
              renderings = {};
              paper = opts.paper;
              drawOverlay = function() {
                removeOverlay();
                overlay = paper.rect(0, 0, paper.width, paper.height);
                overlay.toFront();
                return overlay.attr({
                  fill: "#ffffff",
                  opacity: 0.01
                });
              };
              removeOverlay = function() {
                var mouseCaptured;
                if (overlay != null) {
                  overlay.unmousedown();
                  overlay.unmouseup();
                  overlay.unmousemove();
                  overlay.remove();
                }
                if (typeof mouseCaptured !== "undefined" && mouseCaptured !== null) {
                  MITHGrid.mouse.uncapture();
                  return mouseCaptured = false;
                }
              };
              mouseCaptured = false;
              captureMouse = function(handlers) {
                if (!mouseCaptured) {
                  mouseCaptured = true;
                  return MITHGrid.mouse.capture(function(eType) {
                    if (handlers[eType] != null) return handlers[eType](this);
                  });
                }
              };
              uncaptureMouse = function() {
                if (mouseCaptured) {
                  MITHGrid.mouse.uncapture();
                  return mouseCaptured = false;
                }
              };
              drawShape = function(container) {
                var bottomRight, mouseDown, mousedown, mousemove, mouseup, offset, topLeft;
                mouseDown = false;
                mouseCaptured = false;
                topLeft = [];
                bottomRight = [];
                container = $(container);
                drawOverlay();
                offset = container.offset();
                overlay.unmousedown();
                overlay.unmouseup();
                overlay.unmousemove();
                mousedown = function(e) {
                  var pos, x, y;
                  if (mouseDown) return;
                  pos = relativeCoords(overlay.node, e);
                  x = pos.x;
                  y = pos.y;
                  topLeft = [x, y];
                  bottomRight = [x, y];
                  mouseDown = true;
                  return binding.events.onShapeStart.fire(topLeft);
                };
                mousemove = function(e) {
                  var pos, x, y;
                  if (!mouseDown) return;
                  pos = relativeCoords(overlay.node, e);
                  x = pos.x;
                  y = pos.y;
                  bottomRight = [x, y];
                  return binding.events.onShapeDrag.fire(bottomRight);
                };
                mouseup = function(e) {
                  if (!mouseDown) return;
                  mouseDown = false;
                  binding.events.onShapeDone.fire(bottomRight);
                  uncaptureMouse();
                  return overlay.toFront();
                };
                overlay.mousedown(mousedown);
                overlay.mousemove(mousemove);
                overlay.mouseup(mouseup);
                return captureMouse({
                  mousedown: mousedown,
                  mouseup: mouseup,
                  mousemove: mousemove
                });
              };
              selectShape = function(container) {
                drawOverlay();
                overlay.unmousedown();
                overlay.mousedown(function(e) {
                  var activeId;
                  options.application.setActiveAnnotation(void 0);
                  activeId = null;
                  return overlay.toBack();
                });
                return overlay.toBack();
              };
              options.application.events.onCurrentModeChange.addListener(function(mode) {
                removeOverlay();
                if (mode === "Rectangle" || mode === "Ellipse") {
                  return drawShape(binding.locate('svgwrapper'));
                } else if (mode === 'Select') {
                  return selectShape(binding.locate('svgwrapper'));
                } else {
                  return $(binding.locate('svgwrapper')).unbind();
                }
              });
              return binding.toBack = function() {
                if (overlay != null) return overlay.toBack();
              };
            };
          }]));
        };
      });
      Controller.namespace('sliderButton', function(sliderButton) {
        return sliderButton.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.sliderButton"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var displayElement, positionCheck, sliderElement, sliderMove, sliderStart;
              displayElement = binding.locate('timedisplay');
              positionCheck = function(t) {
                var localTime;
                if (!(typeof localTime !== "undefined" && localTime !== null)) {
                  localTime = t;
                  return $(sliderElement).slider('value', localTime);
                }
              };
              sliderStart = function(e, ui) {
                var localTime;
                options.application.setCurrentTime(ui.value);
                $(displayElement).text('TIME: ' + ui.value);
                return localTime = ui.value;
              };
              sliderMove = function(e, ui) {
                var localTime;
                if (!(ui != null)) {
                  localTime = e;
                  $(sliderElement).slider('value', e);
                }
                if (localTime !== ui.value) {
                  options.application.setCurrentTime(ui.value);
                  $(displayElement).text('TIME: ' + ui.value);
                  return localTime = ui.value;
                }
              };
              sliderElement = binding.locate("slider");
              return $(sliderElement).slider({
                start: sliderStart,
                slide: sliderMove
              });
            };
          }]));
        };
      });
      return Controller.namespace('timeControl', function(timeControl) {
        return timeControl.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.timeControl"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            that.currentId = '';
            return that.applyBindings = function(binding, opts) {
              var menudiv, submit, timeend, timestart;
              timestart = binding.locate('timestart');
              timeend = binding.locate('timeend');
              submit = binding.locate('submit');
              menudiv = binding.locate('menudiv');
              $(menudiv).hide();
              $(submit).bind('click', function() {
                var end_time, start_time;
                start_time = parseInt($(timestart).val(), 10);
                end_time = parseInt($(timeend).val(), 10);
                if ((binding.currentId != null) && (start_time != null) && (end_time != null)) {
                  binding.events.onUpdate.fire(binding.currentId, start_time, end_time);
                  return $(menudiv).hide();
                }
              });
              return options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id != null) {
                  $(menudiv).show();
                  $(timestart).val('');
                  $(timeend).val('');
                  return binding.currentId = id;
                } else {
                  return $(menudiv).hide();
                }
              });
            };
          }]));
        };
      });
    });
    OAC.Client.StreamingVideo.namespace("Player", function(exports) {
      var callbacks, players;
      players = [];
      callbacks = [];
      exports.player = function(playerId) {
        if (!(playerId != null)) playerId = 0;
        return players[playerId];
      };
      exports.onNewPlayer = function(callback) {
        var player, _i, _len;
        for (_i = 0, _len = players.length; _i < _len; _i++) {
          player = players[_i];
          callback(player);
        }
        return callbacks.push(callback);
      };
      exports.register = function(driverObject) {
        var cb, p, player, ps, _i, _len, _results;
        ps = driverObject.getAvailablePlayers();
        _results = [];
        for (_i = 0, _len = ps.length; _i < _len; _i++) {
          player = ps[_i];
          $(player).data('driver', driverObject);
          p = driverObject.bindPlayer(player);
          players.push(p);
          _results.push((function() {
            var _j, _len2, _results2;
            _results2 = [];
            for (_j = 0, _len2 = callbacks.length; _j < _len2; _j++) {
              cb = callbacks[_j];
              _results2.push(cb.call({}, p));
            }
            return _results2;
          })());
        }
        return _results;
      };
      return exports.namespace("DriverBinding", function(db) {
        return db.initInstance = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Player.DriverBinding"].concat(__slice.call(args)));
        };
      });
    });
    $(document).ready(function() {
      return OAC.Client.StreamingVideo.Player.register(initOACDummyPlayerDrv());
    });
    initOACDummyPlayerDrv = function() {
      var driver;
      driver = {};
      driver.getAvailablePlayers = function() {
        var index, p, player, _i, _len, _ref, _results;
        index = 0;
        _ref = $('.dummyplayer');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          player = $(p).data('player');
          if (!(player != null)) {
            player = initDummyPlayer(p, index);
            $(p).data('player', player);
            player.startDummyPlayer();
          }
          index += 1;
          _results.push(player);
        }
        return _results;
      };
      driver.getOACVersion = function() {
        return "1.0";
      };
      driver.bindPlayer = function(playerObj) {
        return OAC.Client.StreamingVideo.Player.DriverBinding.initInstance(function(that) {
          playerObj.onplayheadupdate(function() {
            return that.events.onPlayheadUpdate.fire(that.getPlayhead());
          });
          that.getCoordinates = function() {
            var c, _i, _len, _ref, _results;
            _ref = playerObj.getcoordinates();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              c = _ref[_i];
              _results.push(parseInt(c, 10));
            }
            return _results;
          };
          that.getSize = function() {
            var s, _i, _len, _ref, _results;
            _ref = playerObj.getsize();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              s = _ref[_i];
              _results.push(parseInt(s, 10));
            }
            return _results;
          };
          that.play = playerObj.play;
          that.pause = playerObj.pause;
          that.getPlayhead = playerObj.getplayhead;
          return that.setPlayhead = playerObj.setplayhead;
        });
      };
      return driver;
    };
    initDummyPlayer = function(DOMObject, index) {
      var that;
      that = {};
      that.startDummyPlayer = function() {
        that.setAspect();
        that.setContent();
        that.play();
        return window.setTimeout(that.secondIntervalUpdate, 1000);
      };
      that.setAspect = function() {
        $(DOMObject).css('background', 'url("dummyplayer/images/dummy.png") no-repeat scroll right bottom #F8C700');
        return $(DOMObject).css('border', '1px solid darkBlue');
      };
      that.setContent = function() {
        var player;
        player = "$('#player-content-" + index + "').parents('.dummyplayer').data('player')";
        return $(DOMObject).append("<ul id=\"player-content-" + index + "\" style=\"list-style-type: none; padding: 0;\">\n	<li style=\"text-align: center; font-weight: bold; text-decoration: underline;\">Dummy Player #" + (index + 1) + "</li>\n	<li style=\"text-align: center;\">Status: <span class=\"dummy-status\">Paused</span></li>\n	<li style=\"text-align: center;\">Position: <span class=\"dummy-position\">0</span> seconds</li>\n	<!-- li style=\"text-align: center;\">\n		<ul style=\"list-style-type: none; padding: 0;\">\n			<li style=\"margin: 0 8px; display: inline;\">\n				<a onClick=\"" + player + ".rewind(5)\"><img src=\"dummyplayer/images/rewind.png\" /></a>\n			</li>\n			<li style=\"margin: 0 8px; display: inline;\">\n				<a onClick=\"" + player + ".toggle()\"><img src=\"dummyplayer/images/playpause.png\" /></a>\n			</li>\n			<li style=\"margin: 0 8px; display: inline;\">\n				<a onClick=\"" + player + ".forward(5)\"><img src=\"dummyplayer/images/forward.png\" /></a>\n			</li>\n		</ul>\n	</li -->\n</ul>");
      };
      that.secondIntervalUpdate = function() {
        window.setTimeout(that.secondIntervalUpdate, 1000);
        if ($(DOMObject).find(".dummy-status").html() === "Playing") {
          return that.forward(1);
        }
      };
      that.toggle = function() {
        if ($(DOMObject).find(".dummy-status").html() === "Playing") {
          return that.pause();
        } else {
          return that.play();
        }
      };
      that.pause = function() {
        return $(DOMObject).find(".dummy-status").html("Paused");
      };
      that.play = function() {
        return $(DOMObject).find(".dummy-status").html("Playing");
      };
      that.rewind = function(value) {
        return that.setplayhead(that.getplayhead() - parseInt(value, 10));
      };
      that.forward = function(value) {
        return that.setplayhead(that.getplayhead() + parseInt(value, 10));
      };
      that.setplayhead = function(value) {
        value = parseInt(value, 10);
        if (value < 0) value = 0;
        $(DOMObject).find(".dummy-position").html(value);
        return $(DOMObject).trigger('timeupdate');
      };
      that.getplayhead = function() {
        return parseInt($(DOMObject).find(".dummy-position").html(), 10);
      };
      that.getsize = function() {
        var retval;
        retval = [];
        retval.push(parseInt($("#player-content-" + index).parents('.dummyplayer').css("width"), 10));
        retval.push(parseInt($("#player-content-" + index).parents('.dummyplayer').css("height"), 10));
        return retval;
      };
      that.getcoordinates = function() {
        var retval;
        retval = [];
        retval.push($("#player-content-" + index).parents('.dummyplayer').position().top);
        retval.push($("#player-content-" + index).parents('.dummyplayer').position().left);
        return retval;
      };
      that.onplayheadupdate = function(callback) {
        return $(DOMObject).bind('timeupdate', callback);
      };
      return that;
    };
    $(document).ready(function() {
      return OAC.Client.StreamingVideo.Player.register(initHTML5PlayerDrv());
    });
    initHTML5PlayerDrv = function() {
      var driver;
      driver = {};
      driver.getAvailablePlayers = function() {
        return $('video');
      };
      driver.getOACVersion = function() {
        return "1.0";
      };
      driver.bindPlayer = function(domObj) {
        return OAC.Client.StreamingVideo.Player.DriverBinding.initInstance(function(that) {
          $(domObj).bind('loadedmetadata', function() {
            return that.events.onResize.fire(that.getSize());
          });
          $(domObj).bind('timeupdate', function() {
            return that.events.onPlayheadUpdate.fire(domObj.currentTime);
          });
          that.getCoordinates = function() {
            return [$(domObj).position().left, $(domObj).position().top];
          };
          that.getSize = function() {
            return [$(domObj).width() - 2, $(domObj).height() - 2];
          };
          that.getTargetURI = function() {
            return $(domObj).data('oatarget');
          };
          that.play = function() {
            return domObj.play();
          };
          that.pause = function() {
            return domObj.pause();
          };
          that.getPlayhead = function() {
            return domObj.currentTime;
          };
          return that.setPlayhead = function(n) {
            return domObj.currentTime = parseFloat(n);
          };
        });
      };
      return driver;
    };
    OAC.Client.StreamingVideo.namespace('Component', function(Component) {
      Component.namespace('AnnotationCreationButton', function(AnnotationCreationButton) {
        return AnnotationCreationButton.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Component.AnnotationCreationButton"].concat(__slice.call(args), [function(that, buttonEl) {
            var active, options;
            options = that.options;
            active = false;
            $(buttonEl).mousedown(function(e) {
              if (active === false) {
                active = true;
                options.application.setCurrentMode(options.mode);
                return $(buttonEl).addClass("active");
              } else if (active === true) {
                active = false;
                options.application.setCurrentMode(void 0);
                return $(buttonEl).removeClass("active");
              }
            });
            return options.application.events.onCurrentModeChange.addListener(function(action) {
              if (action === options.mode) {
                active = true;
                return $(buttonEl).addClass('active');
              } else {
                active = false;
                return $(buttonEl).removeClass("active");
              }
            });
          }]));
        };
      });
      Component.namespace("ShapeEditBox", function(ShapeEditBox) {
        return ShapeEditBox.initInstance = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Component.ShapeEditBox"].concat(__slice.call(args), [function(that, paper) {
            var activeRendering, attrs, calcFactors, calcHandles, calcXYHeightWidth, dirs, dragController, drawHandles, extents, factors, handleAttrs, handleCalculationData, handleSet, handles, midDrag, options, padding, shapeAttrs, svgBBox;
            options = that.options;
            dragController = OAC.Client.StreamingVideo.Controller.Drag.initController({});
            handleSet = {};
            handles = {};
            activeRendering = null;
            attrs = {};
            shapeAttrs = {};
            handleAttrs = {};
            extents = {};
            factors = {};
            svgBBox = null;
            midDrag = null;
            padding = 5;
            dirs = options.dirs;
            handleCalculationData = {
              ul: ['nw', 0, 0],
              top: ['n', 1, 0],
              ur: ['ne', 2, 0],
              rgt: ['e', 2, 1],
              lr: ['se', 2, 2],
              btm: ['s', 1, 2],
              ll: ['sw', 0, 2],
              lft: ['w', 0, 1],
              mid: ['pointer', 1, 1]
            };
            calcXYHeightWidth = function(args) {
              var brx, bry, tlx, tly;
              brx = args.brx;
              tlx = args.tlx;
              bry = args.bry;
              tly = args.tly;
              if (factors.x === 0 && factors.y === 0) {
                tlx += args.dx;
                brx += args.dx;
                tly += args.dy;
                bry += args.dy;
              } else {
                if (factors.x < 0) {
                  tlx += args.dx;
                } else if (factors.x > 0) {
                  brx += args.dx;
                }
                if (factors.y < 0) {
                  tly += args.dy;
                } else if (factors.y > 0) {
                  bry += args.dy;
                }
              }
              if (brx > tlx) {
                args.x = tlx;
              } else {
                args.x = brx;
              }
              if (bry > tly) {
                args.y = tly;
              } else {
                args.y = bry;
              }
              args.width = Math.abs(brx - tlx);
              args.height = Math.abs(bry - tly);
              return args;
            };
            calcHandles = function(args) {
              var calcHandle, data, o, recalcHandle, _i, _len, _results;
              calcXYHeightWidth(args);
              calcHandle = function(type, xn, yn) {
                return {
                  x: args.x + xn * args.width / 2 - padding / 2,
                  y: args.y + yn * args.height / 2 - padding / 2,
                  cursor: type.length > 2 ? type : type + "-resize"
                };
              };
              recalcHandle = function(info, xn, yn) {
                info.x = args.x + xn * args.width / 2 - padding / 2;
                info.y = args.y + yn * args.height / 2 - padding / 2;
                return info.el.attr({
                  x: info.x,
                  y: info.y
                });
              };
              _results = [];
              for (_i = 0, _len = dirs.length; _i < _len; _i++) {
                o = dirs[_i];
                data = handleCalculationData[o];
                if (data != null) {
                  if (handles[o] != null) {
                    _results.push(recalcHandle(handles[o], data[1], data[2]));
                  } else {
                    _results.push(handles[o] = calcHandle(data[0], data[1], data[2]));
                  }
                } else {
                  _results.push(void 0);
                }
              }
              return _results;
            };
            calcFactors = function() {
              extents = activeRendering.getExtents();
              attrs = {
                tlx: extents.x - (extents.width / 2),
                tly: extents.y - (extents.height / 2),
                brx: extents.x + (extents.width / 2),
                bry: extents.y + (extents.height / 2),
                dx: 0,
                dy: 0
              };
              return calcHandles(attrs);
            };
            drawHandles = function() {
              var h, i, midDragDragBinding, o;
              if ($.isEmptyObject(handleSet)) {
                handleSet = paper.set();
                for (i in handles) {
                  o = handles[i];
                  if (i === 'mid') {
                    midDrag = paper.rect(o.x, o.y, padding, padding);
                    o.id = midDrag.id;
                    o.el = midDrag;
                  } else {
                    h = paper.rect(o.x, o.y, padding, padding);
                    o.id = h.id;
                    o.el = h;
                    h.attr({
                      cursor: o.cursor
                    });
                    handleSet.push(h);
                  }
                }
                handleSet.attr({
                  fill: 'black',
                  stroke: 'black'
                });
                if (!$.isEmptyObject(midDrag)) {
                  midDrag.attr({
                    fill: 'black',
                    stroke: 'black',
                    cursor: 'move'
                  });
                }
                calcXYHeightWidth(attrs);
                svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                svgBBox.attr({
                  stroke: '#333333',
                  'stroke-dasharray': ["--"]
                });
                if (!$.isEmptyObject(midDrag)) {
                  midDragDragBinding = dragController.bind(midDrag);
                  midDragDragBinding.events.onUpdate.addListener(function(dx, dy) {
                    attrs.dx = dx;
                    attrs.dy = dy;
                    calcHandles(attrs);
                    return svgBBox.attr({
                      x: attrs.x,
                      y: attrs.y
                    });
                  });
                  midDragDragBinding.events.onFocus.addListener(function(x, y) {
                    factors.x = 0;
                    factors.y = 0;
                    calcFactors();
                    return activeRendering.shape.attr({
                      cursor: 'move'
                    });
                  });
                  midDragDragBinding.events.onUnfocus.addListener(function() {
                    calcXYHeightWidth(attrs);
                    return that.events.onMove.fire({
                      x: attrs.x + attrs.width / 2,
                      y: attrs.y + attrs.height / 2
                    });
                  });
                }
                return handleSet.forEach(function(handle) {
                  var handleBinding;
                  handleBinding = dragController.bind(handle);
                  handleBinding.events.onUpdate.addListener(function(dx, dy) {
                    attrs.dx = dx;
                    attrs.dy = dy;
                    calcHandles(attrs);
                    return svgBBox.attr({
                      x: attrs.x,
                      y: attrs.y,
                      width: attrs.width,
                      height: attrs.height
                    });
                  });
                  handleBinding.events.onFocus.addListener(function(x, y) {
                    var px, py;
                    extents = activeRendering.getExtents();
                    px = (8 * (x - extents.x) / extents.width) + 4;
                    py = (8 * (y - extents.y) / extents.height) + 4;
                    if (px < 3) {
                      factors.x = -1;
                    } else if (px < 5) {
                      factors.x = 0;
                    } else {
                      factors.x = 1;
                    }
                    if (py < 3) {
                      factors.y = -1;
                    } else if (py < 5) {
                      factors.y = 0;
                    } else {
                      factors.y = 1;
                    }
                    return calcFactors();
                  });
                  handleBinding.events.onUnfocus.addListener(function() {
                    calcXYHeightWidth(attrs);
                    return that.events.onResize.fire({
                      x: attrs.x + attrs.width / 2,
                      y: attrs.y + attrs.height / 2,
                      width: attrs.width,
                      height: attrs.height
                    });
                  });
                  svgBBox.toFront();
                  handleSet.toFront();
                  return midDrag.toFront();
                });
              } else {
                svgBBox.show().toFront();
                svgBBox.attr({
                  x: attrs.x,
                  y: attrs.y,
                  width: attrs.width,
                  height: attrs.height
                });
                handleSet.show().toFront();
                return midDrag.show().toFront();
              }
            };
            that.show = function() {
              calcFactors();
              return drawHandles();
            };
            that.hide = function() {
              if (!$.isEmptyObject(handleSet)) {
                handleSet.hide();
                svgBBox.hide();
                return midDrag.hide();
              }
            };
            that.attachToRendering = function(newRendering) {
              that.detachFromRendering();
              if (!(newRendering != null)) return;
              activeRendering = newRendering;
              return that.show();
            };
            return that.detachFromRendering = function() {
              activeRendering = null;
              return that.hide();
            };
          }]));
        };
      });
      return Component.namespace('ShapeCreateBox', function(ShapeCreateBox) {
        return ShapeCreateBox.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Component.ShapeCreateBox"].concat(__slice.call(args), [function(that, paper) {
            var attrs, factors, options, padding, shapeAttrs, svgBBox;
            options = that.options;
            svgBBox = {};
            factors = {};
            attrs = {};
            padding = 10;
            shapeAttrs = {};
            that.createGuide = function(coords) {
              attrs.x = coords[0];
              attrs.y = coords[1];
              attrs.width = 0;
              attrs.height = 0;
              if ($.isEmptyObject(svgBBox)) {
                svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                return svgBBox.attr({
                  stroke: '#333333',
                  'stroke-dasharray': ["--"]
                });
              } else {
                svgBBox.show();
                return svgBBox.attr({
                  x: attrs.x,
                  y: attrs.y,
                  width: attrs.width,
                  height: attrs.height
                });
              }
            };
            that.resizeGuide = function(coords) {
              attrs.width = coords[0] - attrs.x;
              attrs.height = coords[1] - attrs.y;
              if (attrs.width < 0) {
                if (attrs.height < 0) {
                  return svgBBox.attr({
                    width: -attrs.width,
                    height: -attrs.height,
                    x: attrs.x + attrs.width,
                    y: attrs.y + attrs.height
                  });
                } else {
                  return svgBBox.attr({
                    width: -attrs.width,
                    height: attrs.height,
                    x: attrs.x + attrs.width,
                    y: attrs.y
                  });
                }
              } else if (attrs.height < 0) {
                return svgBBox.attr({
                  width: attrs.width,
                  height: -attrs.height,
                  x: attrs.x,
                  y: attrs.y + attrs.height
                });
              } else {
                return svgBBox.attr({
                  width: attrs.width,
                  height: attrs.height,
                  x: attrs.x,
                  y: attrs.y
                });
              }
            };
            return that.completeShape = function(coords) {
              that.resizeGuide(coords);
              svgBBox.hide();
              if (attrs.width < 0) {
                attrs.x += attrs.width;
                attrs.width = -attrs.width;
              }
              if (attrs.height < 0) {
                attrs.y += attrs.height;
                attrs.height = -attrs.height;
              }
              return {
                x: attrs.x,
                y: attrs.y,
                width: attrs.width,
                height: attrs.height
              };
            };
          }]));
        };
      });
    });
    MITHGrid.Presentation.namespace("AnnotationList", function(AnnotationList) {
      return AnnotationList.initPresentation = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = MITHGrid.Presentation).initPresentation.apply(_ref, ["MITHGrid.Presentation.AnnotationList"].concat(__slice.call(args), [function() {}]));
      };
    });
    MITHGrid.Presentation.namespace("RaphaelCanvas", function(RaphaelCanvas) {
      return RaphaelCanvas.initPresentation = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = MITHGrid.Presentation).initPresentation.apply(_ref, ["MITHGrid.Presentation.RaphaelCanvas"].concat(__slice.call(args), [function(that, container) {
          var app, boundingBoxComponent, canvasBinding, canvasController, h, id, keyBoardController, keyboardBinding, options, playerObj, shapeCreateBoxComponent, superEventFocusChange, updateLocation, w, x, y;
          id = $(container).attr('id');
          options = that.options;
          app = options.application;
          canvasController = options.controllers.canvas;
          keyBoardController = options.controllers.keyboard;
          x = $(container).css('x');
          y = $(container).css('y');
          w = $(container).width();
          h = $(container).height();
          that.canvas = new Raphael($(container), w, h);
          canvasBinding = canvasController.bind($(container), {
            closeEnough: 5,
            paper: that.canvas
          });
          boundingBoxComponent = OAC.Client.StreamingVideo.Component.ShapeEditBox.initInstance(that.canvas);
          shapeCreateBoxComponent = OAC.Client.StreamingVideo.Component.ShapeCreateBox.initInstance(that.canvas);
          keyboardBinding = keyBoardController.bind($(container), {});
          that.events = $.extend(true, that.events, keyboardBinding.events);
          boundingBoxComponent.events.onResize.addListener(function(pos) {
            var activeRendering;
            activeRendering = that.getFocusedRendering();
            if ((activeRendering != null) && (activeRendering.eventResize != null)) {
              return activeRendering.eventResize(pos);
            }
          });
          boundingBoxComponent.events.onMove.addListener(function(pos) {
            var activeRendering;
            activeRendering = that.getFocusedRendering();
            if ((activeRendering != null) && (activeRendering.eventMove != null)) {
              return activeRendering.eventMove(pos);
            }
          });
          boundingBoxComponent.events.onDelete.addListener(function() {
            var activeRendering;
            activeRendering = that.getFocusedRendering();
            if ((activeRendering != null) && (activeRendering.eventDelete != null)) {
              activeRendering.eventDelete();
              return boundingBoxComponent.detachFromRendering();
            }
          });
          app.events.onCurrentModeChange.addListener(function(newMode) {
            if (newMode !== "Select" && newMode !== "Drag") {
              return boundingBoxComponent.detachFromRendering();
            }
          });
          playerObj = app.getPlayer();
          updateLocation = function() {
            var canvasEl, htmlWrapper, _ref, _ref2;
            canvasEl = $('body').find('svg');
            htmlWrapper = $(container);
            if (playerObj != null) {
              _ref = playerObj.getCoordinates(), x = _ref[0], y = _ref[1];
              _ref2 = playerObj.getSize(), w = _ref2[0], h = _ref2[1];
              $(canvasEl).css({
                left: x + 'px',
                top: y + 'px',
                width: w + 'px',
                height: h + 'px'
              });
              return $(htmlWrapper).css({
                left: x + 'px',
                top: y + 'px',
                width: w + 'px',
                height: h + 'px'
              });
            }
          };
          MITHGrid.events.onWindowResize.addListener(updateLocation);
          if (playerObj != null) {
            playerObj.events.onResize.addListener(updateLocation);
          }
          updateLocation();
          canvasBinding.events.onShapeStart.addListener(shapeCreateBoxComponent.createGuide);
          canvasBinding.events.onShapeDrag.addListener(shapeCreateBoxComponent.resizeGuide);
          canvasBinding.events.onShapeDone.addListener(function(coords) {
            var shape;
            shape = shapeCreateBoxComponent.completeShape(coords);
            if (shape.height > 1 && shape.width > 1) return app.insertShape(shape);
          });
          app.events.onCurrentTimeChange.addListener(function(npt) {
            return that.visitRenderings(function(id, rendering) {
              if (rendering.eventCurrentTimeChange != null) {
                return rendering.eventCurrentTimeChange(npt);
              }
            });
          });
          app.events.onTimeEasementChange.addListener(function(te) {
            return that.visitRenderings(function(id, rendering) {
              if (rendering.eventTimeEasementChange != null) {
                return rendering.eventTimeEasementChange(te);
              }
            });
          });
          superEventFocusChange = that.eventFocusChange;
          return that.eventFocusChange = function(id) {
            if (app.getCurrentMode() === 'Select') {
              superEventFocusChange(id);
              boundingBoxComponent.attachToRendering(that.getFocusedRendering());
              return canvasBinding.toBack();
            }
          };
        }]));
      };
    });
    S4 = function() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    uuid = function() {
      return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
    };
    canvasId = 1;
    return OAC.Client.StreamingVideo.initApp = OAC.Client.StreamingVideo.initInstance = function() {
      var app, args, cb, container, extendedOpts, klass, myCanvasId, options, shapeAnnotationId, wh, xy, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      app = {};
      shapeAnnotationId = 0;
      myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId;
      xy = [];
      wh = [];
      _ref = MITHGrid.normalizeArgs.apply(MITHGrid, ["OAC.Client.StreamingVideo"].concat(__slice.call(args))), klass = _ref[0], container = _ref[1], options = _ref[2], cb = _ref[3];
      canvasId += 1;
      if (!(container != null)) {
        container = $("<div id='" + myCanvasId + "-container'></div>");
        $("body").append(container);
      }
      extendedOpts = $.extend(true, {}, {
        viewSetup: "<div id=\"" + myCanvasId + "\" class=\"section-canvas\"></div>\n<!-- div class=\"mithgrid-bottomarea\">\n	<div class=\"timeselect\">\n		<p>Enter start time:</p>\n		<input id=\"timestart\" type=\"text\" />\n		<p>Enter end time:</p>\n		<input id=\"timeend\" type=\"text\" />\n		<div id=\"submittime\" class=\"button\">Confirm time settings</div>\n	</div>\n</div -->",
        controllers: {
          keyboard: {
            isActive: function() {
              return app.getCurrentMode() !== 'Editing';
            }
          },
          selectShape: {
            isSelectable: function() {
              return app.getCurrentMode() === "Select";
            }
          }
        },
        presentations: {
          raphsvg: {
            container: "#" + myCanvasId,
            lenses: {},
            lensKey: ['.shapeType'],
            playerWrapper: options.playerWrapper
          }
        }
      }, options);
      return MITHGrid.Application.initInstance(klass, container, extendedOpts, function(appOb) {
        var NS, parseNPT, playerObj, shapeTypes;
        app = appOb;
        shapeTypes = {};
        options = app.options;
        playerObj = options.player;
        options.url = options.url || playerObj.getTargetURI();
        app.getPlayer = function() {
          return playerObj;
        };
        app.initShapeLens = function(container, view, model, itemId) {
          var calcOpacity, end, fend, focused, fstart, item, opacity, start, that;
          that = {
            id: itemId
          };
          item = model.getItem(itemId);
          focused = false;
          start = item.npt_start[0];
          end = item.npt_end[0];
          fstart = start - app.getTimeEasement();
          fend = end + app.getTimeEasement();
          calcOpacity = function(n) {
            var e, val;
            val = 0.0;
            if (n >= fstart && n < fend) {
              e = app.getTimeEasement();
              if (e > 0) {
                if (n < start) {
                  val = (e - start + n) / e;
                } else if (n > end) {
                  val = (e + end - n) / e;
                } else {
                  val = 1.0;
                }
              } else {
                val = 1.0;
              }
            }
            return val;
          };
          that.eventTimeEasementChange = function(v) {
            fstart = start - v;
            fend = end + v;
            return that.setOpacity(calcOpacity(app.getCurrentTime()));
          };
          that.eventCurrentTimeChange = function(n) {
            return that.setOpacity(calcOpacity(n));
          };
          opacity = 0.0;
          that.setOpacity = function(o) {
            if (o != null) opacity = o;
            if (that.shape != null) {
              return that.shape.attr({
                opacity: (focused ? 0.5 : 0.25) * opacity
              });
            }
          };
          that.getOpacity = function() {
            return opacity;
          };
          that.setOpacity(calcOpacity(app.getCurrentTime()));
          that.eventFocus = function() {
            focused = true;
            that.setOpacity();
            that.shape.toFront();
            return view.events.onDelete.addListener(that.eventDelete);
          };
          that.eventUnfocus = function() {
            focused = false;
            that.setOpacity();
            that.shape.toBack();
            return view.events.onDelete.removeListener(that.eventDelete);
          };
          that.eventDelete = function() {
            return model.removeItems([itemId]);
          };
          that.eventResize = function(pos) {
            return model.updateItems([
              {
                id: itemId,
                x: pos.x,
                y: pos.y,
                w: pos.width,
                h: pos.height
              }
            ]);
          };
          that.eventMove = function(pos) {
            return model.updateItems([
              {
                id: itemId,
                x: pos.x,
                y: pos.y
              }
            ]);
          };
          that.update = function(item) {
            if (item.npt_start[0] !== start || item.npt_end[0] !== end) {
              start = item.npt_start[0];
              end = item.npt_end[0];
              fstart = start - app.getTimeEasement();
              fend = end + app.getTimeEasement();
              return that.setOpacity(calcOpacity(app.getCurrentTime()));
            }
          };
          that.remove = function(item) {
            return that.shape.remove();
          };
          return that;
        };
        app.initTextLens = function(container, view, model, itemId) {
          var annoEvents, bodyContent, bodyContentTextArea, item, itemEl, that;
          that = {};
          item = model.getItem(itemId);
          itemEl = $("<div class=\"anno_item\">\n	<p class=\"bodyContentInstructions\">Double click here to open edit window.</p>\n	<div class=\"editArea\">\n		<textarea class=\"bodyContentTextArea\"></textarea>\n		<div id=\"editUpdate\" class=\"button update\">Update</div>\n		<div id=\"editDelete\" class=\"button delete\">Delete</div>\n	</div>\n	<div class=\"body\">\n		<p class=\"bodyContent\"></p>\n	</div>\n</div>");
          bodyContentTextArea = $(itemEl).find(".bodyContentTextArea");
          bodyContent = $(itemEl).find(".bodyContent");
          $(bodyContentTextArea).text(item.bodyContent[0]);
          $(bodyContent).text(item.bodyContent[0]);
          $(container).append(itemEl);
          $(itemEl).find(".editArea").hide();
          that.eventFocus = function() {
            return itemEl.addClass('selected');
          };
          that.eventUnfocus = function() {
            return itemEl.removeClass('selected');
          };
          that.eventUpdate = function(id, data) {
            if (id === itemId) {
              return model.updateItems([
                {
                  id: itemId,
                  bodyContent: data
                }
              ]);
            }
          };
          that.eventDelete = function(id) {
            if (id === itemId) return model.removeItems([itemId]);
          };
          that.update = function(item) {
            $(itemEl).find(".bodyContent").text(item.bodyContent[0]);
            return $(itemEl).find(".bodyContentTextArea").text(item.bodyContent[0]);
          };
          that.remove = function() {
            return $(itemEl).remove();
          };
          annoEvents = app.controller.annoActive.bind(itemEl, {
            model: model,
            itemId: itemId
          });
          annoEvents.events.onClick.addListener(app.setActiveAnnotation);
          annoEvents.events.onDelete.addListener(that.eventDelete);
          annoEvents.events.onUpdate.addListener(that.eventUpdate);
          return that;
        };
        app.addShape = function(key, svgShape) {
          return app.presentation.raphsvg.addLens(key, svgShape);
        };
        app.addShapeType = function(type, args) {
          var calcF, lensF;
          calcF = args.calc;
          lensF = args.lens;
          shapeTypes[type] = args;
          return app.addShape(type, lensF);
        };
        app.insertShape = function(coords) {
          var curMode, npt_end, npt_start, shape, shapeItem, t;
          npt_start = parseFloat(app.getCurrentTime()) - 5;
          npt_end = parseFloat(app.getCurrentTime()) + 5;
          curMode = app.getCurrentMode();
          if (shapeTypes[curMode] != null) {
            shape = shapeTypes[curMode].calc(coords);
            shapeAnnotationId = uuid();
            shapeItem = {
              id: "anno" + shapeAnnotationId,
              type: "Annotation",
              bodyType: "Text",
              bodyContent: "This is an annotation for " + curMode,
              shapeType: curMode,
              targetURI: app.options.url,
              npt_start: npt_start < 0 ? 0 : npt_start,
              npt_end: npt_end
            };
            app.dataStore.canvas.loadItems([t = $.extend(true, shapeItem, shape)]);
            return shapeItem.id;
          }
        };
        NS = {
          OA: "http://www.w3.org/ns/openannotation/core",
          OAX: "http://www.w3.org/ns/openannotation/extensions",
          RDF: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          CNT: "http://www.w3.org/2008/content#",
          DC: "http://purl.org/dc/elements/1.1/"
        };
        parseNPT = function(npt) {
          var b, bits, hours, minutes, seconds;
          if (npt.indexOf(':') === -1) {
            seconds = parseFloat(npt);
            minutes = 0;
            hours = 0;
          } else {
            bits = (function() {
              var _i, _len, _ref2, _results;
              _ref2 = npt.split(':');
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                b = _ref2[_i];
                _results.push(parseFloat(b));
              }
              return _results;
            })();
            seconds = bits.pop();
            if (bits.length > 0) {
              minutes = bits.pop();
            } else {
              minutes = 0;
            }
            if (bits.length > 0) {
              hours = bits.pop();
            } else {
              hours = 0;
            }
          }
          return (hours * 60 + minutes) * 60 + seconds;
        };
        app.importData = function(data) {
          var bits, doc, dom, fragment, hasSelector, hasSubSelector, hasTarget, i, info, o, refd, rootName, s, shapeInfo, svg, t, temp, tempstore, types, v, _i, _j, _k, _len, _len2, _len3, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
          tempstore = [];
          for (i in data) {
            o = data[i];
            if (_ref2 = "" + NS.OA + "Annotation", __indexOf.call((function() {
              var _i, _len, _ref3, _results;
              _ref3 = o["" + NS.RDF + "type"];
              _results = [];
              for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                t = _ref3[_i];
                _results.push(t.value);
              }
              return _results;
            })(), _ref2) >= 0) {
              temp = {
                id: i,
                type: "Annotation",
                bodyContent: '',
                bodyType: 'Text',
                targetURI: app.options.url
              };
              if ((o["" + NS.OA + "hasBody"] != null) && (o["" + NS.OA + "hasBody"][0] != null) && (data[o["" + NS.OA + "hasBody"][0].value] != null)) {
                temp.bodyContent = data[o["" + NS.OA + "hasBody"][0].value]["" + NS.CNT + "chars"][0].value;
              }
              if (o["" + NS.OA + "hasTarget"] != null) {
                _ref3 = (function() {
                  var _j, _len, _ref3, _results;
                  _ref3 = o["" + NS.OA + "hasTarget"];
                  _results = [];
                  for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
                    v = _ref3[_j];
                    _results.push(v.value);
                  }
                  return _results;
                })();
                for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                  hasTarget = _ref3[_i];
                  if ((data[hasTarget] != null) && (data[hasTarget]["" + NS.OA + "hasSource"] != null)) {
                    refd = (_ref4 = app.options.url, __indexOf.call((function() {
                      var _j, _len2, _ref5, _results;
                      _ref5 = data[hasTarget]["" + NS.OA + "hasSource"];
                      _results = [];
                      for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
                        s = _ref5[_j];
                        _results.push(s.value);
                      }
                      return _results;
                    })(), _ref4) >= 0);
                    if (refd) {
                      _ref5 = (function() {
                        var _k, _len2, _ref5, _results;
                        _ref5 = data[hasTarget]["" + NS.OA + "hasSelector"];
                        _results = [];
                        for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
                          v = _ref5[_k];
                          _results.push(v.value);
                        }
                        return _results;
                      })();
                      for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
                        hasSelector = _ref5[_j];
                        refd = (_ref6 = "" + NS.OAX + "CompositeSelector", __indexOf.call((function() {
                          var _k, _len3, _ref7, _results;
                          _ref7 = data[hasSelector]["" + NS.RDF + "type"];
                          _results = [];
                          for (_k = 0, _len3 = _ref7.length; _k < _len3; _k++) {
                            t = _ref7[_k];
                            _results.push(t.value);
                          }
                          return _results;
                        })(), _ref6) >= 0);
                        if ((data[hasSelector] != null) && refd) {
                          _ref7 = (function() {
                            var _l, _len3, _ref7, _results;
                            _ref7 = data[hasSelector]["" + NS.OA + "hasSelector"];
                            _results = [];
                            for (_l = 0, _len3 = _ref7.length; _l < _len3; _l++) {
                              v = _ref7[_l];
                              _results.push(v.value);
                            }
                            return _results;
                          })();
                          for (_k = 0, _len3 = _ref7.length; _k < _len3; _k++) {
                            hasSubSelector = _ref7[_k];
                            if (data[hasSubSelector] != null) {
                              types = (function() {
                                var _l, _len4, _ref8, _results;
                                _ref8 = data[hasSubSelector]["" + NS.RDF + "type"];
                                _results = [];
                                for (_l = 0, _len4 = _ref8.length; _l < _len4; _l++) {
                                  t = _ref8[_l];
                                  _results.push(t.value);
                                }
                                return _results;
                              })();
                              if (_ref8 = "" + NS.OAX + "SvgSelector", __indexOf.call(types, _ref8) >= 0) {
                                if ((data[hasSubSelector]["" + NS.CNT + "chars"] != null) && (data[hasSubSelector]["" + NS.CNT + "chars"][0] != null)) {
                                  svg = data[hasSubSelector]["" + NS.CNT + "chars"][0].value;
                                  dom = $.parseXML(svg);
                                  if (dom != null) {
                                    doc = dom.documentElement;
                                    rootName = doc.nodeName;
                                    for (t in shapeTypes) {
                                      info = shapeTypes[t];
                                      if ((info.extractFromSVG != null) && __indexOf.call(info.rootSVGElement, rootName) >= 0) {
                                        shapeInfo = info.extractFromSVG(doc);
                                        if (shapeInfo != null) {
                                          $.extend(temp, shapeInfo);
                                          temp.shapeType = t;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              if (_ref9 = "" + NS.OA + "FragSelector", __indexOf.call(types, _ref9) >= 0) {
                                if ((data[hasSubSelector]["" + NS.RDF + "value"] != null) && (data[hasSubSelector]["" + NS.RDF + "value"][0] != null)) {
                                  fragment = data[hasSubSelector]["" + NS.RDF + "value"][0].value;
                                  fragment = fragment.replace(/^t=npt:/, '');
                                  bits = fragment.split(',');
                                  temp.npt_start = parseNPT(bits[0]);
                                  temp.npt_end = parseNPT(bits[1]);
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              } else {
                temp = {
                  id: i,
                  type: "Annotation",
                  bodyContent: '',
                  bodyType: 'Text',
                  targetURI: app.options.url,
                  shapeType: '',
                  npt_start: 0,
                  npt_end: 0
                };
              }
              if ((temp.npt_start != null) || (temp.npt_end != null) || (temp.shapeType != null)) {
                tempstore.push(temp);
              }
            }
          }
          return app.dataStore.canvas.loadItems(tempstore);
        };
        app.exportData = function(data) {
          var bnode, createJSONObjSeries, findAnnos, genBody, genTarget, literal, mergeData, node, o, tempstore, uri, _i, _len, _ref2;
          tempstore = {};
          findAnnos = app.dataStore.canvas.prepare(['!type']);
          node = function(s, pns, p, t, o) {
            if (!(tempstore[s] != null)) tempstore[s] = {};
            if (!(tempstore[s][pns + p] != null)) tempstore[s][pns + p] = [];
            return tempstore[s][pns + p].push({
              'type': t,
              'value': o
            });
          };
          bnode = function(s, pns, p, o) {
            return node(s, pns, p, 'bnode', o);
          };
          uri = function(s, pns, p, o) {
            return node(s, pns, p, 'uri', o);
          };
          literal = function(s, pns, p, o) {
            return node(s, pns, p, 'literal', o);
          };
          genBody = function(obj, id) {
            uri(id, NS.RDF, "type", "" + NS.OA + "Body");
            literal(id, NS.DC, "format", "text/plain");
            literal(id, NS.CNT, "characterEncoding", "utf-8");
            return literal(id, NS.CNT, "chars", obj.bodyContent[0]);
          };
          genTarget = function(obj, id) {
            var svglens, _ref2;
            uri(id[0], NS.RDF, "type", "" + NS.OA + "SpecificResource");
            uri(id[0], NS.OA, "hasSource", obj.targetURI[0]);
            bnode(id[0], NS.OA, "hasSelector", id[1]);
            uri(id[1], NS.RDF, "type", "" + NS.OAX + "CompositeSelector");
            bnode(id[1], NS.OA, "hasSelector", id[2]);
            bnode(id[1], NS.OA, "hasSelector", id[3]);
            if (obj.shapeType != null) {
              svglens = (_ref2 = shapeTypes[obj.shapeType[0]]) != null ? _ref2.renderAsSVG : void 0;
            }
            if (svglens != null) {
              uri(id[2], NS.RDF, "type", "" + NS.OAX + "SvgSelector");
              literal(id[2], NS.DC, "format", "text/svg+xml");
              literal(id[2], NS.CNT, "characterEncoding", "utf-8");
              literal(id[2], NS.CNT, "chars", svglens(app.dataStore.canvas, obj.id[0]));
            }
            uri(id[3], NS.RDF, "type", "" + NS.OA + "FragSelector");
            return literal(id[3], NS.RDF, "value", 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]);
          };
          createJSONObjSeries = function(id) {
            var buid, fgid, obj, suid, svgid, tuid;
            obj = app.dataStore.canvas.getItem(id[0]);
            if (id.length > 1) {
              buid = id[1];
              tuid = id[2];
              suid = id[3];
              svgid = id[4];
              fgid = id[5];
            } else {
              buid = '_:b' + uuid();
              tuid = '_:t' + uuid();
              suid = '_:sel' + uuid();
              svgid = '_:sel' + uuid();
              fgid = '_:sel' + uuid();
            }
            uri(id[0], NS.RDF, "type", "" + NS.OA + "Annotation");
            bnode(id[0], NS.OA, "hasBody", buid);
            bnode(id[0], NS.OA, "hasTarget", tuid);
            genBody(obj, buid);
            return genTarget(obj, [tuid, suid, svgid, fgid]);
          };
          mergeData = function(id) {
            var buid, found, obj, seli, selo, seltype, selval, suid, tuid, type, value, _ref2, _ref3, _results;
            obj = app.dataStore.canvas.getItem(id);
            if (data[obj.id] != null) {
              _ref2 = data[obj.id];
              _results = [];
              for (type in _ref2) {
                value = _ref2[type];
                switch (type) {
                  case "" + NS.OA + "hasBody":
                    buid = data[obj.id].hasBody[0].value;
                    _results.push(data[buid].chars[0].value = obj.bodyContent);
                    break;
                  case "" + NS.OA + "hasTarget":
                    if ((obj.targetURI[0] != null) && (obj.x[0] != null)) {
                      tuid = data[obj.id].hasTarget[0].value;
                      found = false;
                      if (data[tuid].hasSource[0].value === obj.targetURI[0]) {
                        suid = data[tuid].hasSelector[0].value;
                        found = true;
                        _ref3 = data[suid];
                        for (seltype in _ref3) {
                          selval = _ref3[seltype];
                          if (seltype === 'hasSelector') {
                            for (seli in selval) {
                              selo = selval[seli];
                              if (data[selo.value].type[0].value === OAC_NS.SVGConstraint) {
                                data[selo.value].chars = [
                                  {
                                    type: 'literal',
                                    value: '<' + obj.shapeType[0].substring(0, 4).toLowerCase() + ' x="' + obj.x[0] + '" y="' + obj.y[0] + ' width="' + obj.w[0] + '" height="' + obj.h[0] + '" />'
                                  }
                                ];
                              } else if (data[selo.value].type[0].value === OAC_NS.FragSelector) {
                                data[selval].chars = [
                                  {
                                    'type': 'literal',
                                    'value': 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]
                                  }
                                ];
                              }
                            }
                          }
                        }
                      }
                      if (!found) {
                        _results.push(genTarget(obj));
                      } else {
                        _results.push(void 0);
                      }
                    } else {
                      _results.push(void 0);
                    }
                    break;
                }
              }
              return _results;
            } else {
              return createJSONObjSeries(obj.id);
            }
          };
          data = data || {};
          _ref2 = findAnnos.evaluate('Annotation');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            o = _ref2[_i];
            mergeData(o);
          }
          return tempstore;
        };
        app.ready(function() {
          app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventFocusChange);
          app.events.onCurrentTimeChange.addListener(function(t) {
            app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5);
            return playerObj.setPlayhead(t);
          });
          app.setCurrentTime(playerObj.getPlayhead());
          playerObj.events.onPlayheadUpdate.addListener(app.setCurrentTime);
          return app.events.onCurrentModeChange.addListener(function(nmode) {
            if (nmode !== 'Watch') {
              return playerObj.pause();
            } else if (nmode === 'Watch') {
              return playerObj.play();
            }
          });
        });
        return app.ready(function() {
          var timeControlBinding;
          app.addShapeType("Rectangle", {
            calc: function(coords) {
              return {
                x: coords.x + (coords.width / 2),
                y: coords.y + (coords.height / 2),
                w: coords.width,
                h: coords.height
              };
            },
            renderAsSVG: function(model, itemId) {
              var item;
              item = model.getItem(itemId);
              return "<rect x='" + item.x[0] + "' y='" + item.y[0] + "' width='" + item.w[0] + "' height='" + item.h[0] + "' />";
            },
            rootSVGElement: ["rect"],
            extractFromSVG: function(svg) {
              var info;
              info = {};
              info.w = parseFloat(svg.getAttribute('width'));
              info.h = parseFloat(svg.getAttribute('height'));
              info.x = parseFloat(svg.getAttribute('x'));
              info.y = parseFloat(svg.getAttribute('y'));
              return info;
            },
            lens: function(container, view, model, itemId) {
              var c, item, selectBinding, superUpdate, that;
              that = app.initShapeLens(container, view, model, itemId);
              item = model.getItem(itemId);
              c = view.canvas.rect(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.w[0], item.h[0]);
              that.shape = c;
              c.attr({
                fill: "silver",
                border: "grey"
              });
              that.setOpacity();
              $(c.node).attr('id', item.id[0]);
              selectBinding = app.controller.selectShape.bind(c);
              selectBinding.events.onSelect.addListener(function() {
                return app.setActiveAnnotation(itemId);
              });
              superUpdate = that.update;
              that.update = function(newItem) {
                item = newItem;
                superUpdate(item);
                if ((item.x != null) && (item.y != null) && (item.w != null) && (item.h != null)) {
                  return c.attr({
                    x: item.x[0] - item.w[0] / 2,
                    y: item.y[0] - item.h[0] / 2,
                    width: item.w[0],
                    height: item.h[0]
                  });
                }
              };
              that.getExtents = function() {
                return {
                  x: c.attr("x") + (c.attr("width") / 2),
                  y: c.attr("y") + (c.attr("height") / 2),
                  width: c.attr("width"),
                  height: c.attr("height")
                };
              };
              return that;
            }
          });
          app.addShapeType("Ellipse", {
            calc: function(coords) {
              return {
                x: coords.x + (coords.width / 2),
                y: coords.y + (coords.height / 2),
                w: coords.width,
                h: coords.height
              };
            },
            renderAsSVG: function(model, itemId) {
              var item;
              item = model.getItem(itemId);
              return "<elli x='" + item.x[0] + "' y='" + item.y[0] + "' width='" + item.w[0] + "' height='" + item.h[0] + "' />";
            },
            rootSVGElement: ["elli"],
            extractFromSVG: function(svg) {
              var info;
              info = {};
              info.w = parseFloat(svg.getAttribute('width'));
              info.h = parseFloat(svg.getAttribute('height'));
              info.x = parseFloat(svg.getAttribute('x'));
              info.y = parseFloat(svg.getAttribute('y'));
              return info;
            },
            lens: function(container, view, model, itemId) {
              var c, item, selectBinding, superUpdate, that;
              that = app.initShapeLens(container, view, model, itemId);
              item = model.getItem(itemId);
              c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0] / 2, item.h[0] / 2);
              that.shape = c;
              c.attr({
                fill: "silver",
                border: "grey"
              });
              that.setOpacity();
              selectBinding = app.controller.selectShape.bind(c);
              selectBinding.events.onSelect.addListener(function() {
                return app.setActiveAnnotation(itemId);
              });
              superUpdate = that.update;
              that.update = function(item) {
                superUpdate(item);
                if ((item.x != null) && (item.y != null)) {
                  return c.attr({
                    cx: item.x[0],
                    cy: item.y[0],
                    rx: item.w[0] / 2,
                    ry: item.h[0] / 2
                  });
                }
              };
              that.getExtents = function() {
                return {
                  x: c.attr("cx"),
                  y: c.attr("cy"),
                  width: c.attr("rx") * 2,
                  height: c.attr("ry") * 2
                };
              };
              return that;
            }
          });
          app.setCurrentTime(0);
          timeControlBinding = app.controller.timecontrol.bind('.timeselect', {});
          return timeControlBinding.events.onUpdate.addListener(function(id, start, end) {
            return app.dataStore.canvas.updateItems([
              {
                id: id,
                npt_start: start,
                npt_end: end
              }
            ]);
          });
        });
      });
    };
  })(jQuery, MITHGrid, OAC);

  MITHGrid.defaults("OAC.Client.StreamingVideo.Player.DriverBinding", {
    events: {
      onResize: null,
      onPlayheadUpdate: null
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Component.ShapeEditBox", {
    dirs: ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'],
    events: {
      onResize: null,
      onMove: null,
      onEdit: null,
      onDelete: null,
      onCurrentModeChange: null
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.CanvasClickController", {
    bind: {
      events: {
        onClick: null,
        onShapeStart: null,
        onShapeDrag: null,
        onShapeDone: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.TextBodyEditor", {
    bind: {
      events: {
        onClick: null,
        onDelete: null,
        onUpdate: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.KeyboardListener", {
    bind: {
      events: {
        onDelete: ["preventable", "unicast"]
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", {
    bind: {
      events: {
        onCurrentModeChange: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", {
    bind: {
      events: {}
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.WindowResize", {
    bind: {
      events: {
        onResize: null
      }
    },
    selectors: {
      '': ''
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Drag", {
    bind: {
      events: {
        onFocus: null,
        onUnfocus: null,
        onUpdate: null
      }
    },
    selectors: {
      '': ''
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Select", {
    bind: {
      events: {
        onSelect: null
      }
    },
    selectors: {
      '': ''
    },
    isSelectable: function() {
      return true;
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.timeControl", {
    bind: {
      events: {
        onUpdate: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo", {
    controllers: {
      keyboard: {
        type: OAC.Client.StreamingVideo.Controller.KeyboardListener,
        selectors: {
          doc: ''
        }
      },
      canvas: {
        type: OAC.Client.StreamingVideo.Controller.CanvasClickController,
        selectors: {
          svgwrapper: ''
        }
      },
      annoActive: {
        type: OAC.Client.StreamingVideo.Controller.TextBodyEditor,
        selectors: {
          annotation: '',
          annotationlist: ':parent',
          bodycontent: '.bodyContent',
          body: '.body',
          editbutton: '.button.edit',
          editarea: '.editArea',
          textarea: '.editArea > textarea',
          updatebutton: '.button.update',
          deletebutton: '.button.delete'
        }
      },
      timecontrol: {
        type: OAC.Client.StreamingVideo.Controller.timeControl,
        selectors: {
          timestart: '#timestart',
          timeend: '#timeend',
          submit: '#submittime',
          menudiv: ''
        }
      },
      selectShape: {
        type: OAC.Client.StreamingVideo.Controller.Select,
        selectors: {
          raphael: ''
        }
      }
    },
    variables: {
      ActiveAnnotation: {
        is: 'rw'
      },
      CurrentTime: {
        is: 'rw',
        "default": 0
      },
      TimeEasement: {
        is: 'rw',
        "default": 5
      },
      CurrentMode: {
        is: 'rw'
      }
    },
    dataViews: {
      currentAnnotations: {
        dataStore: 'canvas',
        type: MITHGrid.Data.RangePager,
        leftExpressions: ['.npt_start'],
        rightExpressions: ['.npt_end']
      }
    },
    dataStores: {
      canvas: {
        types: {
          Annotation: {}
        },
        properties: {
          shapeType: {
            valueType: 'text'
          },
          bodyType: {
            valueType: 'text'
          },
          bodyContent: {
            valueType: 'text'
          },
          targetURI: {
            valueType: 'uri'
          },
          npt_start: {
            valueType: "numeric"
          },
          npt_end: {
            valueType: "numeric"
          }
        }
      }
    },
    presentations: {
      raphsvg: {
        type: MITHGrid.Presentation.RaphaelCanvas,
        dataView: 'currentAnnotations',
        controllers: {
          keyboard: "keyboard",
          canvas: "canvas"
        },
        events: {
          onOpacityChange: null
        },
        fadeStart: 5
      }
    }
  });

}).call(this);
