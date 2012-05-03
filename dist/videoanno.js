
/*
# OAC Video Annotation Tool v
# 
# The **OAC Video Annotation Tool** is a MITHGrid application providing annotation capabilities for streaming
# video embedded in a web page. 
#  
# Date: Wed May 2 12:53:44 2012 -0700
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
        return KeyboardListener.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.KeyboardListener"].concat(__slice.call(args), [function(that) {
            var isActive, options;
            options = that.options;
            isActive = options.isActive || function() {
              return true;
            };
            return that.applyBindings = function(binding, opts) {
              var doc;
              doc = binding.locate('doc');
              options.application.events.onActiveAnnotationChange.addListener(function(id) {
                var activeId;
                return activeId = id;
              });
              return $(doc).keydown(function(e) {
                var activeId, _ref;
                if (isActive() && (typeof activeId !== "undefined" && activeId !== null)) {
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
        return Drag.initInstance = function() {
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
        return Select.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller.Raphael).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.Select"].concat(__slice.call(args), [function(that) {
            var isSelectable, options;
            options = that.options;
            isSelectable = options.isSelectable || function() {
              return true;
            };
            return that.applyBindings = function(binding) {
              var el;
              el = binding.locate("raphael");
              return el.click(function(e) {
                if (isSelectable()) return binding.events.onSelect.fire();
              });
            };
          }]));
        };
      });
      Controller.namespace("TextBodyEditor", function(TextBodyEditor) {
        return TextBodyEditor.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.TextBodyEditor"].concat(__slice.call(args), [function(that) {
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
        return CanvasClickController.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.CanvasClickController"].concat(__slice.call(args), [function(that) {
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
                overlay.attr({
                  fill: "#ffffff",
                  opacity: 0.01
                });
                return $(overlay.node).css({
                  "pointer-events": "auto"
                });
              };
              removeOverlay = function() {
                if (overlay != null) {
                  overlay.unmousedown();
                  overlay.unmouseup();
                  overlay.unmousemove();
                  overlay.attr({
                    opacity: 0.0
                  });
                  overlay.remove();
                  overlay = null;
                }
                return uncaptureMouse();
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
                var bottomRight, mouseDown, mousedown, mousemove, mouseup, topLeft;
                mouseDown = false;
                mouseCaptured = false;
                topLeft = [];
                bottomRight = [];
                drawOverlay();
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
        return sliderButton.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.sliderButton"].concat(__slice.call(args), [function(that) {
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
        return timeControl.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.timeControl"].concat(__slice.call(args), [function(that) {
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
            return [$(domObj).width(), $(domObj).height()];
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
      Component.namespace('ModeButton', function(ModeButton) {
        return ModeButton.initInstance = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Component.ModeButton"].concat(__slice.call(args), [function(that, buttonEl) {
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
            dragController = OAC.Client.StreamingVideo.Controller.Drag.initInstance({});
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
                    $(midDrag.node).css({
                      "pointer-events": "auto"
                    });
                    o.id = midDrag.id;
                    o.el = midDrag;
                  } else {
                    h = paper.rect(o.x, o.y, padding, padding);
                    $(h.node).css({
                      "pointer-events": "auto"
                    });
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
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Component.ShapeCreateBox"].concat(__slice.call(args), [function(that, paper) {
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
    OAC.Client.StreamingVideo.namespace("Presentation", function(Presentation) {
      Presentation.namespace("AnnotationList", function(AnnotationList) {
        return AnnotationList.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Presentation).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Presentation.AnnotationList"].concat(__slice.call(args), [function(that, container) {
            var app, options;
            options = that.options;
            app = options.application;
            return that.initTextLens = function(container, view, model, itemId, cb) {
              var annoEvents, bodyContent, bodyContentTextArea, item, itemEl, lens;
              lens = {};
              item = model.getItem(itemId);
              itemEl = $("<div class=\"annotation-body\">\n	<div class=\"annotation-body-text\">\n		<div class=\"body-content\">\n		</div>\n	</div>\n</div>");
              bodyContentTextArea = $(itemEl).find(".body-content-edit");
              bodyContent = $(itemEl).find(".body-content");
              $(bodyContent).text(item.bodyContent[0]);
              $(container).append(itemEl);
              $(itemEl).find(".editArea").hide();
              lens.eventFocus = function() {
                return itemEl.addClass('selected');
              };
              lens.eventUnfocus = function() {
                return itemEl.removeClass('selected');
              };
              lens.eventUpdate = function(id, data) {
                if (id === itemId) {
                  return model.updateItems([
                    {
                      id: itemId,
                      bodyContent: data
                    }
                  ]);
                }
              };
              lens.eventDelete = function(id) {
                if (id === itemId) return model.removeItems([itemId]);
              };
              lens.update = function(item) {
                $(itemEl).find(".bodyContent").text(item.bodyContent[0]);
                return $(itemEl).find(".bodyContentTextArea").text(item.bodyContent[0]);
              };
              lens.remove = function() {
                return $(itemEl).remove();
              };
              annoEvents = app.controller.annoActive.bind(itemEl, {
                model: model,
                itemId: itemId
              });
              annoEvents.events.onClick.addListener(app.setActiveAnnotation);
              annoEvents.events.onDelete.addListener(lens.eventDelete);
              annoEvents.events.onUpdate.addListener(lens.eventUpdate);
              if (cb != null) cb(lens);
              return lens;
            };
          }]));
        };
      });
      return Presentation.namespace("RaphaelCanvas", function(RaphaelCanvas) {
        return RaphaelCanvas.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Presentation).initInstance.apply(_ref, ["OAC.StreamingVideo.Client.Presentation.RaphaelCanvas"].concat(__slice.call(args), [function(that, container) {
            var app, boundingBoxComponent, canvasBinding, canvasController, id, keyBoardController, keyboardBinding, options, playerObj, shapeCreateBoxComponent, superEventFocusChange, updateLocation;
            id = $(container).attr('id');
            options = that.options;
            app = options.application;
            canvasController = options.controllers.canvas;
            keyBoardController = options.controllers.keyboard;
            that.canvas = new Raphael($(container), 10, 10);
            $(that.canvas.canvas).css({
              "pointer-events": "none"
            });
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
              var h, w, x, y, _ref, _ref2;
              if (playerObj != null) {
                _ref = playerObj.getCoordinates(), x = _ref[0], y = _ref[1];
                _ref2 = playerObj.getSize(), w = _ref2[0], h = _ref2[1];
                $(that.canvas.canvas).css({
                  left: x + 'px',
                  top: y + 'px'
                });
                return that.canvas.setSize(w, h);
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
              if (shape.height > 1 && shape.width > 1) {
                return app.insertShape(shape);
              }
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
    });
    S4 = function() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    uuid = function() {
      return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
    };
    canvasId = 1;
    return OAC.Client.StreamingVideo.namespace("Application", function(Application) {
      return Application.initInstance = function() {
        var app, args, cb, container, extendedOpts, klass, myCanvasId, options, shapeAnnotationId, wh, xy, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        app = {};
        shapeAnnotationId = 0;
        myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId;
        xy = [];
        wh = [];
        _ref = MITHGrid.normalizeArgs.apply(MITHGrid, ["OAC.Client.StreamingVideo.Application"].concat(__slice.call(args))), klass = _ref[0], container = _ref[1], options = _ref[2], cb = _ref[3];
        canvasId += 1;
        if (!(container != null)) {
          container = $("<div id='" + myCanvasId + "-container'></div>");
          $("body").append(container);
        }
        extendedOpts = $.extend(true, {}, {
          viewSetup: "<div id=\"" + myCanvasId + "\" class=\"section-canvas\"></div>",
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
              lensKey: ['.shapeType']
            }
          }
        }, options);
        return MITHGrid.Application.initInstance(klass, container, extendedOpts, cb, function(appOb) {
          var NS, parseNPT, playerObj, screenSize, shapeTypes, _ref2;
          app = appOb;
          shapeTypes = {};
          options = app.options;
          playerObj = options.player;
          options.url = options.url || playerObj.getTargetURI();
          screenSize = {};
          if (playerObj != null) {
            _ref2 = playerObj.getSize(), screenSize.width = _ref2[0], screenSize.height = _ref2[1];
            playerObj.events.onResize.addListener(function(s) {
              return screenSize.width = s[0], screenSize.height = s[1], s;
            });
          }
          app.getPlayer = function() {
            return playerObj;
          };
          app.initShapeLens = function(container, view, model, itemId, cb) {
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
            that.scalePoint = function(x, y, w, h) {
              if ((w != null) && (w[0] != null)) {
                w = w[0];
              } else {
                w = screenSize.width;
              }
              if ((h != null) && (h[0] != null)) {
                h = h[0];
              } else {
                h = screenSize.height;
              }
              if (w === 0 || h === 0) {
                return [x, y];
              } else {
                return [x * screenSize.width / w, y * screenSize.height / h];
              }
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
                  h: pos.height,
                  targetWidth: screenSize.width,
                  targetHeight: screenSize.height
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
            if (cb != null) cb(that);
            return that;
          };
          app.addShapeType = function(type, args) {
            shapeTypes[type] = args;
            return app.presentation.raphsvg.addLens(type, args.lens);
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
                id: "_:anno" + shapeAnnotationId,
                type: "Annotation",
                bodyType: "Text",
                bodyContent: "This is an annotation for " + curMode,
                shapeType: curMode,
                targetURI: app.options.url,
                targetHeight: screenSize.height,
                targetWidth: screenSize.width,
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
            DC: "http://purl.org/dc/elements/1.1/",
            EXIF: "http://www.w3.org/2003/12/exif/ns#"
          };
          parseNPT = function(npt) {
            var b, bits, hours, minutes, seconds;
            if (npt.indexOf(':') === -1) {
              seconds = parseFloat(npt);
              minutes = 0;
              hours = 0;
            } else {
              bits = (function() {
                var _i, _len, _ref3, _results;
                _ref3 = npt.split(':');
                _results = [];
                for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                  b = _ref3[_i];
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
            var bits, doc, dom, fragment, hasSelector, hasSubSelector, hasTarget, i, info, o, refd, rootName, s, shapeInfo, svg, t, temp, tempstore, types, v, _i, _j, _k, _len, _len2, _len3, _ref10, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
            tempstore = [];
            for (i in data) {
              o = data[i];
              if (_ref3 = "" + NS.OA + "Annotation", __indexOf.call((function() {
                var _i, _len, _ref4, _results;
                _ref4 = o["" + NS.RDF + "type"];
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  t = _ref4[_i];
                  _results.push(t.value);
                }
                return _results;
              })(), _ref3) >= 0) {
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
                  _ref4 = (function() {
                    var _j, _len, _ref4, _results;
                    _ref4 = o["" + NS.OA + "hasTarget"];
                    _results = [];
                    for (_j = 0, _len = _ref4.length; _j < _len; _j++) {
                      v = _ref4[_j];
                      _results.push(v.value);
                    }
                    return _results;
                  })();
                  for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                    hasTarget = _ref4[_i];
                    if ((data[hasTarget] != null) && (data[hasTarget]["" + NS.OA + "hasSource"] != null)) {
                      refd = (_ref5 = app.options.url, __indexOf.call((function() {
                        var _j, _len2, _ref6, _results;
                        _ref6 = data[hasTarget]["" + NS.OA + "hasSource"];
                        _results = [];
                        for (_j = 0, _len2 = _ref6.length; _j < _len2; _j++) {
                          s = _ref6[_j];
                          _results.push(s.value);
                        }
                        return _results;
                      })(), _ref5) >= 0);
                      if (refd) {
                        _ref6 = (function() {
                          var _k, _len2, _ref6, _results;
                          _ref6 = data[hasTarget]["" + NS.OA + "hasSelector"];
                          _results = [];
                          for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
                            v = _ref6[_k];
                            _results.push(v.value);
                          }
                          return _results;
                        })();
                        for (_j = 0, _len2 = _ref6.length; _j < _len2; _j++) {
                          hasSelector = _ref6[_j];
                          refd = (_ref7 = "" + NS.OAX + "CompositeSelector", __indexOf.call((function() {
                            var _k, _len3, _ref8, _results;
                            _ref8 = data[hasSelector]["" + NS.RDF + "type"];
                            _results = [];
                            for (_k = 0, _len3 = _ref8.length; _k < _len3; _k++) {
                              t = _ref8[_k];
                              _results.push(t.value);
                            }
                            return _results;
                          })(), _ref7) >= 0);
                          if ((data[hasSelector] != null) && refd) {
                            _ref8 = (function() {
                              var _l, _len3, _ref8, _results;
                              _ref8 = data[hasSelector]["" + NS.OA + "hasSelector"];
                              _results = [];
                              for (_l = 0, _len3 = _ref8.length; _l < _len3; _l++) {
                                v = _ref8[_l];
                                _results.push(v.value);
                              }
                              return _results;
                            })();
                            for (_k = 0, _len3 = _ref8.length; _k < _len3; _k++) {
                              hasSubSelector = _ref8[_k];
                              if (data[hasSubSelector] != null) {
                                types = (function() {
                                  var _l, _len4, _ref9, _results;
                                  _ref9 = data[hasSubSelector]["" + NS.RDF + "type"];
                                  _results = [];
                                  for (_l = 0, _len4 = _ref9.length; _l < _len4; _l++) {
                                    t = _ref9[_l];
                                    _results.push(t.value);
                                  }
                                  return _results;
                                })();
                                if (_ref9 = "" + NS.OAX + "SvgSelector", __indexOf.call(types, _ref9) >= 0) {
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
                                            if ((data[hasSubSelector]["" + NS.EXIF + "width"] != null) && (data[hasSubSelector]["" + NS.EXIF + "width"][0] != null)) {
                                              temp.targetWidth = parseFloat(data[hasSubSelector]["" + NS.EXIF + "width"][0].value);
                                            }
                                            if ((data[hasSubSelector]["" + NS.EXIF + "height"] != null) && (data[hasSubSelector]["" + NS.EXIF + "height"][0] != null)) {
                                              temp.targetHeight = parseFloat(data[hasSubSelector]["" + NS.EXIF + "height"][0].value);
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                if (_ref10 = "" + NS.OA + "FragSelector", __indexOf.call(types, _ref10) >= 0) {
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
            var bnode, createJSONObjSeries, findAnnos, genBody, genTarget, literal, mergeData, node, o, tempstore, uri, _i, _len, _ref3;
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
              var svglens, _ref3;
              uri(id[0], NS.RDF, "type", "" + NS.OA + "SpecificResource");
              uri(id[0], NS.OA, "hasSource", obj.targetURI[0]);
              bnode(id[0], NS.OA, "hasSelector", id[1]);
              uri(id[1], NS.RDF, "type", "" + NS.OAX + "CompositeSelector");
              bnode(id[1], NS.OA, "hasSelector", id[2]);
              bnode(id[1], NS.OA, "hasSelector", id[3]);
              if (obj.shapeType != null) {
                svglens = (_ref3 = shapeTypes[obj.shapeType[0]]) != null ? _ref3.renderAsSVG : void 0;
              }
              if (svglens != null) {
                uri(id[2], NS.RDF, "type", "" + NS.OAX + "SvgSelector");
                literal(id[2], NS.DC, "format", "text/svg+xml");
                literal(id[2], NS.CNT, "characterEncoding", "utf-8");
                literal(id[2], NS.CNT, "chars", svglens(app.dataStore.canvas, obj.id[0]));
                if ((obj.targetHeight != null) && (obj.targetHeight[0] != null)) {
                  literal(id[2], NS.EXIF, "height", obj.targetHeight[0]);
                } else {
                  literal(id[2], NS.EXIF, "height", screenSize.height);
                }
                if ((obj.targetWidth != null) && (obj.targetWidth[0] != null)) {
                  literal(id[2], NS.EXIF, "width", obj.targetWidth[0]);
                } else {
                  literal(id[2], NS.EXIF, "width", screenSize.width);
                }
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
              var buid, found, obj, seli, selo, seltype, selval, suid, tuid, type, value, _ref3, _ref4, _results;
              obj = app.dataStore.canvas.getItem(id);
              if (data[obj.id] != null) {
                _ref3 = data[obj.id];
                _results = [];
                for (type in _ref3) {
                  value = _ref3[type];
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
                          _ref4 = data[suid];
                          for (seltype in _ref4) {
                            selval = _ref4[seltype];
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
            _ref3 = findAnnos.evaluate('Annotation');
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              o = _ref3[_i];
              mergeData(o);
            }
            return tempstore;
          };
          app.ready(function() {
            app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventFocusChange);
            app.events.onCurrentTimeChange.addListener(function(t) {
              app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5);
              playerObj.setPlayhead(t);
              return app.setCurrentMode('Watch');
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
                return app.initShapeLens(container, view, model, itemId, function(that) {
                  var c, h, item, selectBinding, superUpdate, w, x, y, _ref3, _ref4;
                  item = model.getItem(itemId);
                  _ref3 = that.scalePoint(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.targetWidth, item.targetHeight), x = _ref3[0], y = _ref3[1];
                  _ref4 = that.scalePoint(item.w[0], item.h[0], item.targetWidth, item.targetHeight), w = _ref4[0], h = _ref4[1];
                  c = view.canvas.rect(x, y, w, h);
                  that.shape = c;
                  c.attr({
                    fill: "silver",
                    border: "grey"
                  });
                  that.setOpacity();
                  $(c.node).css({
                    "pointer-events": "auto"
                  });
                  selectBinding = app.controller.selectShape.bind(c);
                  selectBinding.events.onSelect.addListener(function() {
                    return app.setActiveAnnotation(itemId);
                  });
                  superUpdate = that.update;
                  that.update = function(newItem) {
                    var _ref5, _ref6;
                    item = newItem;
                    superUpdate(item);
                    if ((item.x != null) && (item.y != null) && (item.w != null) && (item.h != null)) {
                      _ref5 = that.scalePoint(item.x[0], item.y[0], item.targetWidth, item.targetHeight), x = _ref5[0], y = _ref5[1];
                      _ref6 = that.scalePoint(item.w[0], item.h[0], item.targetWidth, item.targetHeight), w = _ref6[0], h = _ref6[1];
                      return c.attr({
                        x: x - w / 2,
                        y: y - h / 2,
                        width: w,
                        height: h
                      });
                    }
                  };
                  return that.getExtents = function() {
                    return {
                      x: c.attr("x") + (c.attr("width") / 2),
                      y: c.attr("y") + (c.attr("height") / 2),
                      width: c.attr("width"),
                      height: c.attr("height")
                    };
                  };
                });
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
                return app.initShapeLens(container, view, model, itemId, function(that) {
                  var c, h, item, selectBinding, superUpdate, w, x, y, _ref3, _ref4;
                  item = model.getItem(itemId);
                  _ref3 = that.scalePoint(item.x[0], item.y[0], item.targetWidth, item.targetHeight), x = _ref3[0], y = _ref3[1];
                  _ref4 = that.scalePoint(item.w[0] / 2, item.h[0] / 2, item.targetWidth, item.targetHeight), w = _ref4[0], h = _ref4[1];
                  c = view.canvas.ellipse(x, y, w, h);
                  that.shape = c;
                  c.attr({
                    fill: "silver",
                    border: "grey"
                  });
                  that.setOpacity();
                  $(c.node).css({
                    "pointer-events": "auto"
                  });
                  selectBinding = app.controller.selectShape.bind(c);
                  selectBinding.events.onSelect.addListener(function() {
                    return app.setActiveAnnotation(itemId);
                  });
                  superUpdate = that.update;
                  that.update = function(item) {
                    var _ref5, _ref6;
                    superUpdate(item);
                    if ((item.x != null) && (item.y != null)) {
                      _ref5 = that.scalePoint(item.x[0], item.y[0], item.targetWidth, item.targetHeight), x = _ref5[0], y = _ref5[1];
                      _ref6 = that.scalePoint(item.w[0], item.h[0], item.targetWidth, item.targetHeight), w = _ref6[0], h = _ref6[1];
                      return c.attr({
                        cx: x,
                        cy: y,
                        rx: w / 2,
                        ry: h / 2
                      });
                    }
                  };
                  return that.getExtents = function() {
                    return {
                      x: c.attr("cx"),
                      y: c.attr("cy"),
                      width: c.attr("rx") * 2,
                      height: c.attr("ry") * 2
                    };
                  };
                });
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
    });
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

  MITHGrid.defaults("OAC.Client.StreamingVideo.Component.ModeButton", {
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

  MITHGrid.defaults("OAC.Client.StreamingVideo.Application", {
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
        type: OAC.Client.StreamingVideo.Presentation.RaphaelCanvas,
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
