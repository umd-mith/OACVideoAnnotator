
/*
# OAC Video Annotation Tool v
# 
# The **OAC Video Annotation Tool** is a MITHGrid application providing annotation capabilities for streaming
# video embedded in a web page. 
#  
# Date: Wed May 9 14:36:46 2012 -0400
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
      return Controller.namespace("CanvasClickController", function(CanvasClickController) {
        return CanvasClickController.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Controller.CanvasClickController"].concat(__slice.call(args), [function(that) {
            var options, overlay;
            options = that.options;
            overlay = null;
            return that.applyBindings = function(binding, opts) {
              var captureMouse, drawOverlay, drawShape, mouseCaptured, paper, removeOverlay, renderings, selectShape, svgWrapper, uncaptureMouse;
              renderings = {};
              paper = opts.paper;
              svgWrapper = binding.locate('svgwrapper');
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
                overlay.mousedown(function() {
                  var activeId;
                  options.application().setActiveAnnotation(void 0);
                  activeId = null;
                  return overlay.toBack();
                });
                return overlay.toBack();
              };
              options.application().events.onCurrentModeChange.addListener(function(mode) {
                removeOverlay();
                switch (options.application().getCurrentModeClass()) {
                  case "shape":
                    return drawShape(svgWrapper);
                  case "select":
                    return selectShape(svgWrapper);
                  default:
                    return $(svgWrapper).unbind();
                }
              });
              return binding.toBack = function() {
                if (overlay != null) return overlay.toBack();
              };
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
      exports.register = function(driverObjectCB) {
        var cb, driverObject, p, player, ps, _i, _len, _results;
        driverObject = {};
        driverObjectCB(driverObject);
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
      return OAC.Client.StreamingVideo.Player.register(function(driver) {
        var initDummyPlayer;
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
            that.getTargetURI = playerObj.getTargetURI;
            that.play = playerObj.play;
            that.pause = playerObj.pause;
            that.getPlayhead = playerObj.getplayhead;
            return that.setPlayhead = playerObj.setplayhead;
          });
        };
        return initDummyPlayer = function(DOMObject, index) {
          var that;
          that = {};
          that.getTargetURI = function() {
            return $(DOMObject).data('oatarget');
          };
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
      });
    });
    $(document).ready(function() {
      return OAC.Client.StreamingVideo.Player.register(function(driver) {
        driver.getAvailablePlayers = function() {
          return $('video');
        };
        driver.getOACVersion = function() {
          return "1.0";
        };
        return driver.bindPlayer = function(domObj) {
          return OAC.Client.StreamingVideo.Player.DriverBinding.initInstance(function(that) {
            var lastTime;
            $(domObj).bind('loadedmetadata', function() {
              return that.events.onResize.fire(that.getSize());
            });
            lastTime = 0;
            $(domObj).bind('timeupdate', function() {
              var now;
              now = domObj.currentTime;
              if (Math.abs(lastTime - now) >= 0.2 || now < 0.1) {
                lastTime = now;
                return that.events.onPlayheadUpdate.fire(domObj.currentTime);
              }
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
      });
    });
    OAC.Client.StreamingVideo.namespace("Component", function(Component) {
      Component.namespace("ModeButton", function(ModeButton) {
        return ModeButton.initInstance = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Component.ModeButton"].concat(__slice.call(args), [function(that, buttonEl) {
            var app, options;
            options = that.options;
            app = options.application();
            $(buttonEl).mousedown(function() {
              if ($(buttonEl).hasClass("active")) {
                return app.setCurrentMode(null);
              } else {
                return app.setCurrentMode(options.mode);
              }
            });
            return app.events.onCurrentModeChange.addListener(function(action) {
              if (action === options.mode) {
                return $(buttonEl).addClass("active");
              } else {
                return $(buttonEl).removeClass("active");
              }
            });
          }]));
        };
      });
      Component.namespace("ShapeEditBox", function(ShapeEditBox) {
        var dragController;
        dragController = OAC.Client.StreamingVideo.Controller.Drag.initInstance({});
        return ShapeEditBox.initInstance = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Component.ShapeEditBox"].concat(__slice.call(args), [function(that, paper) {
            var activeRendering, attrs, calcFactors, calcHandles, calcXYHeightWidth, dirs, drawHandles, extents, factors, handleAttrs, handleCalculationData, handleSet, handleSize, handles, midDrag, options, shapeAttrs, svgBBox;
            options = that.options;
            handleSet = null;
            handles = {};
            activeRendering = null;
            attrs = {};
            shapeAttrs = {};
            handleAttrs = {};
            extents = {};
            factors = {};
            svgBBox = null;
            midDrag = null;
            handleSize = 5;
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
                  x: args.x + xn * args.width / 2 - handleSize / 2,
                  y: args.y + yn * args.height / 2 - handleSize / 2,
                  cursor: type.length > 2 ? type : type + "-resize"
                };
              };
              recalcHandle = function(info, xn, yn) {
                info.x = args.x + xn * args.width / 2 - handleSize / 2;
                info.y = args.y + yn * args.height / 2 - handleSize / 2;
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
              if (!(handleSet != null)) {
                handleSet = paper.set();
                for (i in handles) {
                  o = handles[i];
                  if (i === 'mid') {
                    midDrag = paper.rect(o.x, o.y, handleSize, handleSize);
                    $(midDrag.node).css({
                      "pointer-events": "auto"
                    });
                    o.id = midDrag.id;
                    o.el = midDrag;
                  } else {
                    h = paper.rect(o.x, o.y, handleSize, handleSize);
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
                if (midDrag != null) {
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
                    that.events.onFocus.fire();
                    factors.x = 0;
                    factors.y = 0;
                    calcFactors();
                    return activeRendering.shape.attr({
                      cursor: 'move'
                    });
                  });
                  midDragDragBinding.events.onUnfocus.addListener(function() {
                    calcXYHeightWidth(attrs);
                    that.events.onMove.fire({
                      x: attrs.x + attrs.width / 2,
                      y: attrs.y + attrs.height / 2
                    });
                    return that.events.onUnfocus.fire();
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
                    that.events.onFocus.fire();
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
                    that.events.onResize.fire({
                      x: attrs.x + attrs.width / 2,
                      y: attrs.y + attrs.height / 2,
                      width: attrs.width,
                      height: attrs.height
                    });
                    return that.events.onUnfocus.fire();
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
            var attrs, factors, options, shapeAttrs, svgBBox;
            options = that.options;
            svgBBox = null;
            factors = {};
            attrs = {};
            shapeAttrs = {};
            that.createGuide = function(coords) {
              attrs.x = coords[0];
              attrs.y = coords[1];
              attrs.width = 0;
              attrs.height = 0;
              if (!(svgBBox != null)) {
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
            app = options.application();
            return that.initTextLens = function(container, view, model, itemId, cb) {
              var bodyContent, item, itemEl, lens;
              lens = {};
              item = model.getItem(itemId);
              itemEl = $("<div class=\"annotation-body\">\n	<div class=\"annotation-body-text\">\n		<div class=\"body-content\">\n		</div>\n	</div>\n</div>");
              bodyContent = $(itemEl).find(".body-content");
              $(bodyContent).text(item.bodyContent[0]);
              lens.el = itemEl;
              $(container).append(itemEl);
              lens.eventFocus = function() {
                return itemEl.addClass('selected');
              };
              lens.eventUnfocus = function() {
                return itemEl.removeClass('selected');
              };
              lens.eventUpdate = function(data) {
                return model.updateItems([
                  {
                    id: itemId,
                    bodyContent: data
                  }
                ]);
              };
              lens.eventDelete = function() {
                return model.removeItems([itemId]);
              };
              lens.update = function(item) {
                return $(bodyContent).text(item.bodyContent[0]);
              };
              lens.remove = function() {
                return $(itemEl).remove();
              };
              if (cb != null) cb(lens);
              return lens;
            };
          }]));
        };
      });
      return Presentation.namespace("RaphaelCanvas", function(RaphaelCanvas) {
        var counter;
        counter = 1;
        return RaphaelCanvas.initInstance = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Presentation).initInstance.apply(_ref, ["OAC.StreamingVideo.Client.Presentation.RaphaelCanvas"].concat(__slice.call(args), [function(that, container) {
            var app, boundingBoxComponent, canvasBinding, canvasController, id, options, playerObj, screenSize, shapeCreateBoxComponent, superEventFocusChange, updateLocation;
            if (!(container != null)) {
              id = "oac-raphael-presentation-canvas-" + counter;
              counter += 1;
              container = $("<div id='" + id + "'></div>");
              $("body").append(container);
            } else {
              id = $(container).attr('id');
              if (!(id != null)) {
                id = "oac-raphael-presentation-canvas-" + counter;
                counter += 1;
                $(container).attr({
                  id: id
                });
              }
            }
            options = that.options;
            app = options.application();
            screenSize = {
              width: 0,
              height: 0
            };
            canvasController = options.controllers.canvas;
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
              var activeRendering;
              if (app.getCurrentModeClass() === "select") {
                activeRendering = that.getFocusedRendering();
                if (activeRendering != null) {
                  return boundingBoxComponent.attachToRendering(activeRendering);
                }
              } else {
                return boundingBoxComponent.detachFromRendering();
              }
            });
            playerObj = app.getPlayer();
            updateLocation = function() {
              var h, w, x, y, _ref, _ref2;
              if (playerObj != null) {
                _ref = playerObj.getCoordinates(), x = _ref[0], y = _ref[1];
                _ref2 = playerObj.getSize(), w = _ref2[0], h = _ref2[1];
                screenSize = {
                  width: w,
                  height: h
                };
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
            that.eventFocusChange = function(id) {
              superEventFocusChange(id);
              if (app.getCurrentMode() === 'Select') {
                boundingBoxComponent.attachToRendering(that.getFocusedRendering());
                if (canvasBinding != null) return canvasBinding.toBack();
              }
            };
            return that.initShapeLens = function(container, view, model, itemId, cb) {
              var calcOpacity, end, fend, focused, fstart, item, lens, opacity, start;
              lens = {
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
              lens.scalePoint = function(x, y, w, h) {
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
              lens.eventTimeEasementChange = function(v) {
                fstart = start - v;
                fend = end + v;
                return lens.setOpacity(calcOpacity(app.getCurrentTime()));
              };
              lens.eventCurrentTimeChange = function(n) {
                return lens.setOpacity(calcOpacity(n));
              };
              opacity = 0.0;
              lens.setOpacity = function(o) {
                if (o != null) opacity = o;
                if (lens.shape != null) {
                  return lens.shape.attr({
                    opacity: (focused ? 0.5 : 0.25) * opacity
                  });
                }
              };
              lens.getOpacity = function() {
                return opacity;
              };
              lens.setOpacity(calcOpacity(app.getCurrentTime()));
              lens.eventFocus = function() {
                focused = true;
                lens.setOpacity();
                if (lens.shape != null) return lens.shape.toFront();
              };
              lens.eventUnfocus = function() {
                focused = false;
                lens.setOpacity();
                if (lens.shape != null) return lens.shape.toBack();
              };
              lens.eventDelete = function() {
                return model.removeItems([itemId]);
              };
              lens.eventResize = function(pos) {
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
              lens.eventMove = function(pos) {
                return model.updateItems([
                  {
                    id: itemId,
                    x: pos.x,
                    y: pos.y
                  }
                ]);
              };
              lens.update = function(item) {
                if (item.npt_start[0] !== start || item.npt_end[0] !== end) {
                  start = item.npt_start[0];
                  end = item.npt_end[0];
                  fstart = start - app.getTimeEasement();
                  fend = end + app.getTimeEasement();
                  return lens.setOpacity(calcOpacity(app.getCurrentTime()));
                }
              };
              lens.remove = function(item) {
                if (lens.shape != null) {
                  lens.shape.remove();
                  lens.shape = null;
                }
                if (app.getActiveAnnotation() === itemId) {
                  return app.setActiveAnnotation(null);
                }
              };
              if (cb != null) cb(lens);
              return lens;
            };
          }]));
        };
      });
    });
    return OAC.Client.StreamingVideo.namespace("Application", function(Application) {
      var S4, uuid;
      S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      };
      uuid = function() {
        return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
      };
      return Application.initInstance = function() {
        var appOb, args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return appOb = (_ref = MITHGrid.Application).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Application"].concat(__slice.call(args), [{
          controllers: {
            selectShape: {
              isSelectable: function() {
                return appOb.getCurrentMode() === "Select";
              }
            }
          }
        }], [function(app) {
          var NS, options, parseNPT, playerObj, screenSize, shapeAnnotationId, shapeTypes, wh, xy, _ref;
          shapeTypes = {};
          screenSize = {};
          shapeAnnotationId = 0;
          xy = [];
          wh = [];
          options = app.options;
          playerObj = options.player;
          if (options.url == null) options.url = playerObj.getTargetURI();
          if (playerObj != null) {
            _ref = playerObj.getSize(), screenSize.width = _ref[0], screenSize.height = _ref[1];
            playerObj.events.onResize.addListener(function(s) {
              return screenSize.width = s[0], screenSize.height = s[1], s;
            });
          }
          app.getPlayer = function() {
            return playerObj;
          };
          app.ready(function() {
            return app.initShapeLens = app.presentation.raphsvg.initShapeLens;
          });
          app.getCurrentModeClass = function() {
            var m;
            m = app.getCurrentMode();
            if (shapeTypes[m] != null) {
              return "shape";
            } else {
              switch (m) {
                case "Select":
                  return "select";
                case "Watch":
                  return "video";
                default:
                  return null;
              }
            }
          };
          app.addShapeType = function(type, args) {
            shapeTypes[type] = args;
            return app.presentation.raphsvg.addLens(type, args.lens);
          };
          app.insertShape = function(coords) {
            var curMode, npt_end, npt_start, shape;
            npt_start = coords.npt_start != null ? coords.npt_start : parseFloat(app.getCurrentTime()) - 5;
            npt_end = coords.npt_end != null ? coords.npt_end : parseFloat(app.getCurrentTime()) + 5;
            curMode = app.getCurrentMode();
            if (shapeTypes[curMode] != null) {
              shape = shapeTypes[curMode].calc != null ? shapeTypes[curMode].calc(coords) : {};
              shapeAnnotationId = uuid();
              shape.id = "_:anno" + shapeAnnotationId;
              shape.type = "Annotation";
              shape.bodyType = "Text";
              shape.bodyContent = "This is an annotation for " + curMode;
              shape.shapeType = curMode;
              shape.targetURI = app.options.url;
              shape.targetHeight = screenSize.height;
              shape.targetWidth = screenSize.width;
              shape.npt_start = npt_start < 0 ? 0 : npt_start;
              shape.npt_end = npt_end;
              shape.x = coords.x + (coords.width / 2);
              shape.y = coords.y + (coords.height / 2);
              shape.w = coords.width;
              shape.h = coords.height;
              app.dataStore.canvas.loadItems([shape]);
              app.setActiveAnnotation(shape.id);
              return shape.id;
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
            var bits, doc, dom, fragment, hasSelector, hasSubSelector, hasTarget, i, info, o, rootName, s, shapeInfo, svg, t, temp, tempstore, types, v, _i, _j, _k, _len, _len2, _len3, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
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
                  targetURI: options.url
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
                      if ((_ref4 = options.url, __indexOf.call((function() {
                        var _j, _len2, _ref5, _results;
                        _ref5 = data[hasTarget]["" + NS.OA + "hasSource"];
                        _results = [];
                        for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
                          s = _ref5[_j];
                          _results.push(s.value);
                        }
                        return _results;
                      })(), _ref4) >= 0)) {
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
                          if ((data[hasSelector] != null) && (_ref6 = "" + NS.OAX + "CompositeSelector", __indexOf.call((function() {
                            var _k, _len3, _ref7, _results;
                            _ref7 = data[hasSelector]["" + NS.RDF + "type"];
                            _results = [];
                            for (_k = 0, _len3 = _ref7.length; _k < _len3; _k++) {
                              t = _ref7[_k];
                              _results.push(t.value);
                            }
                            return _results;
                          })(), _ref6) >= 0)) {
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
                }
                if ((temp.npt_start != null) || (temp.npt_end != null) || (temp.shapeType != null)) {
                  tempstore.push(temp);
                }
              }
            }
            return app.dataStore.canvas.loadItems(tempstore);
          };
          app.exportData = function() {
            var bnode, createJSONObjSeries, data, findAnnos, genBody, genTarget, literal, mergeData, node, o, tempstore, uri, _i, _len, _ref2;
            data = {};
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
            genBody = function(obj, ids) {
              uri(ids.buid, NS.RDF, "type", "" + NS.OA + "Body");
              literal(ids.buid, NS.DC, "format", "text/plain");
              literal(ids.buid, NS.CNT, "characterEncoding", "utf-8");
              return literal(ids.buid, NS.CNT, "chars", obj.bodyContent[0]);
            };
            genTarget = function(obj, ids) {
              var svglens, _ref2;
              uri(ids.tuid, NS.RDF, "type", "" + NS.OA + "SpecificResource");
              uri(ids.tuid, NS.OA, "hasSource", obj.targetURI[0]);
              bnode(ids.tuid, NS.OA, "hasSelector", ids.suid);
              uri(ids.suid, NS.RDF, "type", "" + NS.OAX + "CompositeSelector");
              bnode(ids.suid, NS.OA, "hasSelector", ids.svgid);
              bnode(ids.suid, NS.OA, "hasSelector", ids.fgid);
              if (obj.shapeType != null) {
                svglens = (_ref2 = shapeTypes[obj.shapeType[0]]) != null ? _ref2.renderAsSVG : void 0;
              }
              if (svglens != null) {
                uri(ids.svgid, NS.RDF, "type", "" + NS.OAX + "SvgSelector");
                literal(ids.svgid, NS.DC, "format", "text/svg+xml");
                literal(ids.svgid, NS.CNT, "characterEncoding", "utf-8");
                literal(ids.svgid, NS.CNT, "chars", svglens(app.dataStore.canvas, obj.id[0]));
                if ((obj.targetHeight != null) && (obj.targetHeight[0] != null)) {
                  literal(ids.svgid, NS.EXIF, "height", obj.targetHeight[0]);
                } else {
                  literal(ids.svgid, NS.EXIF, "height", screenSize.height);
                }
                if ((obj.targetWidth != null) && (obj.targetWidth[0] != null)) {
                  literal(ids.svgid, NS.EXIF, "width", obj.targetWidth[0]);
                } else {
                  literal(ids.svgid, NS.EXIF, "width", screenSize.width);
                }
              }
              uri(ids.fgid, NS.RDF, "type", "" + NS.OA + "FragSelector");
              return literal(ids.fgid, NS.RDF, "value", 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]);
            };
            createJSONObjSeries = function(ids) {
              var obj;
              obj = app.dataStore.canvas.getItem(ids.id);
              if (ids.buid == null) ids.buid = '_:b' + uuid();
              if (ids.tuid == null) ids.tuid = '_:t' + uuid();
              if (ids.suid == null) ids.suid = '_:sel' + uuid();
              if (ids.svgid == null) ids.svgid = '_:sel' + uuid();
              if (ids.fgid == null) ids.fgid = '_:sel' + uuid();
              uri(ids.id, NS.RDF, "type", "" + NS.OA + "Annotation");
              bnode(ids.id, NS.OA, "hasBody", ids.buid);
              bnode(ids.id, NS.OA, "hasTarget", ids.tuid);
              genBody(obj, ids);
              return genTarget(obj, ids);
            };
            mergeData = function(id) {
              var obj;
              obj = app.dataStore.canvas.getItem(id);
              return createJSONObjSeries({
                id: obj.id
              });
            };
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
              playerObj.setPlayhead(t);
              if (app.getCurrentMode() !== "Watch") {
                return app.setCurrentMode(null);
              }
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
            app.addShapeType("Rectangle", {
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
                  var c, h, item, selectBinding, superUpdate, w, x, y, _ref2, _ref3;
                  item = model.getItem(itemId);
                  _ref2 = that.scalePoint(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.targetWidth, item.targetHeight), x = _ref2[0], y = _ref2[1];
                  _ref3 = that.scalePoint(item.w[0], item.h[0], item.targetWidth, item.targetHeight), w = _ref3[0], h = _ref3[1];
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
                    var _ref4, _ref5;
                    item = newItem;
                    superUpdate(item);
                    if ((item.x != null) && (item.y != null) && (item.w != null) && (item.h != null)) {
                      _ref4 = that.scalePoint(item.x[0], item.y[0], item.targetWidth, item.targetHeight), x = _ref4[0], y = _ref4[1];
                      _ref5 = that.scalePoint(item.w[0], item.h[0], item.targetWidth, item.targetHeight), w = _ref5[0], h = _ref5[1];
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
              renderAsSVG: function(model, itemId) {
                var item;
                item = model.getItem(itemId);
                return "<ellipse x='" + item.x[0] + "' y='" + item.y[0] + "' width='" + item.w[0] + "' height='" + item.h[0] + "' />";
              },
              rootSVGElement: ["ellipse"],
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
                  var c, h, item, selectBinding, superUpdate, w, x, y, _ref2, _ref3;
                  item = model.getItem(itemId);
                  _ref2 = that.scalePoint(item.x[0], item.y[0], item.targetWidth, item.targetHeight), x = _ref2[0], y = _ref2[1];
                  _ref3 = that.scalePoint(item.w[0] / 2, item.h[0] / 2, item.targetWidth, item.targetHeight), w = _ref3[0], h = _ref3[1];
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
                    var _ref4, _ref5;
                    superUpdate(item);
                    if ((item.x != null) && (item.y != null)) {
                      _ref4 = that.scalePoint(item.x[0], item.y[0], item.targetWidth, item.targetHeight), x = _ref4[0], y = _ref4[1];
                      _ref5 = that.scalePoint(item.w[0], item.h[0], item.targetWidth, item.targetHeight), w = _ref5[0], h = _ref5[1];
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
            return app.setCurrentTime(0);
          });
        }]));
      };
    });
  })(jQuery, MITHGrid, OAC);

  MITHGrid.defaults("OAC.Client.StreamingVideo.Application", {
    controllers: {
      canvas: {
        type: OAC.Client.StreamingVideo.Controller.CanvasClickController,
        selectors: {
          svgwrapper: ''
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
        is: 'rwl'
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
          bodyContent: {
            valueType: 'text'
          },
          bodyType: {
            valueType: 'text'
          },
          npt_end: {
            valueType: 'numeric'
          },
          npt_start: {
            valueType: 'numeric'
          },
          shapeType: {
            valueType: 'text'
          },
          targetURI: {
            valueType: 'uri'
          },
          h: {
            valueType: 'numeric'
          },
          targetHeight: {
            valueType: 'numeric'
          },
          targetWidth: {
            valueType: 'numeric'
          },
          w: {
            valueType: 'numeric'
          },
          x: {
            valueType: 'numeric'
          },
          y: {
            valueType: 'numeric'
          }
        }
      }
    },
    presentations: {
      raphsvg: {
        type: OAC.Client.StreamingVideo.Presentation.RaphaelCanvas,
        container: ".canvas",
        lenses: {},
        lensKey: ['.shapeType'],
        dataView: 'currentAnnotations',
        controllers: {
          canvas: "canvas"
        }
      }
    },
    viewSetup: "<div class=\"canvas\"></div>"
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Component.ModeButton", {
    bind: {
      events: {
        onCurrentModeChange: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Component.ShapeCreateBox", {
    bind: {
      events: {
        onNewShape: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Component.ShapeEditBox", {
    dirs: ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'],
    events: {
      onResize: null,
      onMove: null,
      onDelete: null,
      onFocus: null,
      onUnfocus: null
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.CanvasClickController", {
    bind: {
      events: {
        onShapeStart: null,
        onShapeDrag: null,
        onShapeDone: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Drag", {
    bind: {
      events: {
        onFocus: null,
        onUnfocus: null,
        onUpdate: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Select", {
    bind: {
      events: {
        onSelect: null
      }
    },
    isSelectable: function() {
      return true;
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Player.DriverBinding", {
    events: {
      onResize: null,
      onPlayheadUpdate: null
    }
  });

}).call(this);
