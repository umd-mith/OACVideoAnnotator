
/*
# OAC Video Annotation Tool v
# 
# The **OAC Video Annotation Tool** is a MITHGrid application providing annotation capabilities for streaming
# video embedded in a web page. 
#  
# Date: Tue Apr 17 10:15:03 2012 -0400
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
    var S4, canvasId, uuid;
    OAC.Client.StreamingVideo.namespace('Controller', function(Controller) {
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
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.Drag"].concat(__slice.call(args), [function(that) {
            return that.applyBindings = function(binding, opts) {
              var dend, dmid, dstart, el;
              el = binding.locate('raphael');
              dstart = function(x, y, e) {
                x = e.layerX;
                y = e.layerY;
                return binding.events.onFocus.fire(x, y);
              };
              dend = function() {
                return binding.events.onUnfocus.fire();
              };
              dmid = function(x, y) {
                return binding.events.onUpdate.fire(x, y);
              };
              return el.drag(dmid, dstart, dend);
            };
          }]));
        };
      });
      Controller.namespace("Select", function(Select) {
        return Select.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.Select"].concat(__slice.call(args), [function(that) {
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
      Controller.namespace("AnnotationEditSelectionGrid", function(AnnotationEditSelectionGrid) {
        return AnnotationEditSelectionGrid.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid"].concat(__slice.call(args), [function(that) {
            var dirs, dragController, options;
            options = that.options;
            dirs = that.options.dirs;
            dragController = OAC.Client.StreamingVideo.Controller.Drag.initController({});
            return that.applyBindings = function(binding, opts) {
              var attrs, calcFactors, calcHandles, dAttrs, deleteButton, drawHandles, drawMenu, eAttrs, editButton, factors, handleAttrs, handleCalculationData, handleIds, handleSet, handles, itemDeleted, itemMenu, menuAttrs, menuContainer, midDrag, padding, paper, shapeAttrs, svgBBox;
              handleSet = {};
              midDrag = {};
              svgBBox = {};
              itemMenu = {};
              handles = {};
              deleteButton = {};
              editButton = {};
              menuContainer = {};
              factors = {};
              paper = opts.paper;
              attrs = {};
              padding = 5;
              handleIds = {};
              drawHandles;
              handleAttrs = {};
              shapeAttrs = {};
              menuAttrs = {};
              dAttrs = {};
              eAttrs = {};
              handleCalculationData = {};
              binding.attachRendering = function(newRendering) {
                var activeRendering;
                binding.detachRendering();
                if (!(newRendering != null)) return;
                activeRendering = newRendering;
                calcFactors();
                return drawHandles();
              };
              binding.detachRendering = function() {
                var activeRendering;
                if ($.isEmptyObject(handleSet)) return;
                activeRendering = void 0;
                handleSet.hide();
                svgBBox.hide();
                midDrag.hide();
                if (itemMenu) return itemMenu.hide();
              };
              calcFactors = function() {
                var extents;
                extents = activeRendering.getExtents();
                attrs.width = extents.width + (2 * padding);
                attrs.height = extents.height + (2 * padding);
                attrs.x = (extents.x - (padding / 8)) - (attrs.width / 2);
                attrs.y = (extents.y - (padding / 8)) - (attrs.height / 2);
                calcHandles(attrs);
                if (itemMenu) return drawMenu(attrs);
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
                    } else {
                      h = paper.rect(o.x, o.y, padding, padding);
                      o.id = h.id;
                      h.attr({
                        cursor: o.cursor
                      });
                      handleSet.push(h);
                    }
                  }
                  handleSet.attr({
                    fill: 990000,
                    stroke: 'black'
                  });
                  if (!$.isEmptyObject(midDrag)) {
                    midDrag.attr({
                      fill: 990000,
                      stroke: 'black',
                      cursor: 'move'
                    });
                  }
                  svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                  svgBBox.attr({
                    stroke: 'green',
                    'stroke-dasharray': ["--"]
                  });
                  drawMenu(attrs);
                  if (!$.isEmptyObject(midDrag)) {
                    midDragDragBinding = dragController.bind(midDrag);
                    midDragDragBinding.events.onUpdate.addListener(function(dx, dy) {
                      handleAttrs.nx = attrs.x + dx;
                      handleAttrs.ny = attrs.y + dy;
                      shapeAttrs.x = extents.x + dx;
                      shapeAttrs.y = extents.y + dy;
                      svgBBox.attr({
                        x: handleAttrs.nx,
                        y: handleAttrs.ny
                      });
                      calcHandles({
                        x: handleAttrs.nx,
                        y: handleAttrs.ny,
                        width: attrs.width,
                        height: attrs.height
                      });
                      if (itemMenu) {
                        return drawMenu({
                          x: handleAttrs.nx,
                          y: handleAttrs.ny,
                          width: attrs.width,
                          height: attrs.height
                        });
                      }
                    });
                    midDragDragBinding.events.onFocus.addListener(function(x, y) {
                      var ox, oy;
                      ox = x;
                      oy = y;
                      calcFactors();
                      return activeRendering.shape.attr({
                        cursor: 'move'
                      });
                    });
                    midDragDragBinding.events.onUnfocus.addListener(function() {
                      return binding.events.onMove.fire({
                        x: shapeAttrs.x,
                        y: shapeAttrs.y
                      });
                    });
                  }
                  return handleSet.forEach(function(handle) {
                    var handleBinding;
                    handleBinding = dragController.bind(handle);
                    handleBinding.events.onUpdate.addListener(function(dx, dy) {
                      shapeAttrs.w = Math.abs(extents.width + dx * factors.x);
                      shapeAttrs.h = Math.abs(extents.height + dy * factors.y);
                      handleAttrs.nw = shapeAttrs.w + padding * 2;
                      handleAttrs.nh = shapeAttrs.h + padding * 2;
                      handleAttrs.nx = (extents.x - (padding / 4)) - (handleAttrs.nw / 2);
                      handleAttrs.ny = (extents.y - (padding / 4)) - (handleAttrs.nh / 2);
                      svgBBox.attr({
                        x: handleAttrs.nx,
                        y: handleAttrs.ny,
                        width: handleAttrs.nw,
                        height: handleAttrs.nh
                      });
                      calcHandles({
                        x: handleAttrs.nx,
                        y: handleAttrs.ny,
                        width: handleAttrs.nw,
                        height: handleAttrs.nh
                      });
                      if (itemMenu) {
                        return drawMenu({
                          x: handleAttrs.nx,
                          y: handleAttrs.ny,
                          width: handleAttrs.nw,
                          height: handleAttrs.nh
                        });
                      }
                    });
                    handleBinding.events.onFocus.addListener(function(x, y) {
                      var extents, ox, oy, px, py;
                      extents = activeRendering.getExtents();
                      ox = x;
                      oy = y;
                      options.application.setCurrentMode('Drag');
                      px = (8 * (ox - extents.x) / extents.width) + 4;
                      py = (8 * (oy - extents.y) / extents.height) + 4;
                      if (px < 3) {
                        factors.x = -2;
                      } else if (px < 5) {
                        factors.x = 0;
                      } else {
                        factors.x = 2;
                      }
                      if (py < 3) {
                        factors.y = -2;
                      } else if (py < 5) {
                        factors.y = 0;
                      } else {
                        factors.y = 2;
                      }
                      return calcFactors();
                    });
                    return handleBinding.events.onUnfocus.addListener(function() {
                      if (typeof activeRendering !== "undefined" && activeRendering !== null) {
                        binding.events.onResize.fire({
                          width: shapeAttrs.w,
                          height: shapeAttrs.h
                        });
                      }
                      return options.application.setCurrentMode('Select');
                    });
                  });
                } else {
                  svgBBox.show();
                  svgBBox.attr({
                    x: attrs.x,
                    y: attrs.y,
                    width: attrs.width,
                    height: attrs.height
                  });
                  handleSet.show();
                  midDrag.show().toFront();
                  if (itemMenu) {
                    itemMenu.show();
                    return drawMenu(attrs);
                  }
                }
              };
              drawMenu = function(args) {
                if ($.isEmptyObject(itemMenu)) {
                  menuAttrs.x = args.x + args.width;
                  menuAttrs.y = args.y - (padding * 4) - 2;
                  menuAttrs.w = 100;
                  menuAttrs.h = 20;
                  eAttrs = {
                    x: menuAttrs.x + 2,
                    y: menuAttrs.y + 2,
                    w: menuAttrs.w / 2 - 4,
                    h: menuAttrs.h - (menuAttrs.h / 8)
                  };
                  dAttrs = {
                    x: eAttrs.x + eAttrs.w + 2,
                    y: menuAttrs.y + 2,
                    w: menuAttrs.w / 2 - 4,
                    h: menuAttrs.h - (menuAttrs.h / 8)
                  };
                  itemMenu = paper.set();
                  menuContainer = paper.rect(menuAttrs.x, menuAttrs.y, menuAttrs.w, menuAttrs.h);
                  menuContainer.attr({
                    fill: '#FFFFFF',
                    stroke: '#000'
                  });
                  itemMenu.push(menuContainer);
                  editButton = paper.rect(eAttrs.x, eAttrs.y, eAttrs.w, eAttrs.h);
                  editButton.attr({
                    fill: 334009,
                    cursor: 'pointer'
                  });
                  itemMenu.push(editButton);
                  deleteButton = paper.rect(dAttrs.x, dAttrs.y, dAttrs.w, dAttrs.h);
                  deleteButton.attr({
                    fill: 334009,
                    cursor: 'pointer'
                  });
                  itemMenu.push(deleteButton);
                  editButton.mousedown(function() {
                    if (typeof activeRendering !== "undefined" && activeRendering !== null) {
                      return that.events.onEdit.fire(activeRendering.id);
                    }
                  });
                  editButton.hover(function() {
                    return editButton.attr({
                      fill: 443009
                    });
                  }, function() {
                    return editButton.attr({
                      fill: 334009
                    });
                  });
                  deleteButton.mousedown(function() {
                    if (typeof activeRendering !== "undefined" && activeRendering !== null) {
                      binding.events.onDelete.fire();
                      return itemDeleted();
                    }
                  });
                  return deleteButton.hover(function() {
                    return deleteButton.attr({
                      fill: 443009
                    });
                  }, function() {
                    return deleteButton.attr({
                      fill: 334009
                    });
                  });
                } else {
                  menuAttrs.x = args.x + args.width;
                  menuAttrs.y = args.y - (padding * 4) - 2;
                  eAttrs = {
                    x: menuAttrs.x + 2,
                    y: menuAttrs.y + 2
                  };
                  dAttrs = {
                    x: eAttrs.x + editButton.attr('width') + 2,
                    y: menuAttrs.y + 2
                  };
                  menuContainer.attr({
                    x: menuAttrs.x,
                    y: menuAttrs.y
                  });
                  editButton.attr(eAttrs);
                  return deleteButton.attr(dAttrs);
                }
              };
              itemDeleted = function() {
                var activeRendering;
                binding.detachRendering();
                activeRendering = void 0;
                itemMenu.hide();
                svgBBox.hide();
                handleSet.hide();
                return midDrag.hide();
              };
              handleCalculationData = {
                ul: ['nw', 0, 0, 0, 0],
                top: ['n', 1, 0, 0, 0],
                ur: ['ne', 2, -1, 0, 0],
                rgt: ['e', 2, -1, 1, 0],
                lr: ['se', 2, -1, 2, -1],
                btm: ['s', 1, 0, 2, -1],
                ll: ['sw', 0, 0, 2, -1],
                lft: ['w', 0, 0, 1, 0],
                mid: ['pointer', 1, 0, 1, 0]
              };
              return calcHandles = function(args) {
                var calcHandle, data, o, recalcHandle, _i, _len, _results;
                calcHandle = function(type, xn, xp, yn, yp) {
                  return {
                    x: args.x + xn * args.width / 2 + xp * padding,
                    y: args.y + yn * args.height / 2 + yp * padding,
                    cursor: type.length > 2 ? type : type + "-resize"
                  };
                };
                recalcHandle = function(info, xn, xp, yn, yp) {
                  var el;
                  info.x = args.x + xn * args.width / 2 + xp * padding;
                  info.y = args.y + yn * args.height / 2 + yp * padding;
                  el = paper.getById(info.id);
                  return el.attr({
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
                      _results.push(recalcHandle(handles[o], data[1], data[2], data[3], data[4]));
                    } else {
                      _results.push(handles[o] = calcHandle(data[0], data[1], data[2], data[3], data[4]));
                    }
                  } else {
                    _results.push(void 0);
                  }
                }
                return _results;
              };
            };
          }]));
        };
      });
      Controller.namespace('ShapeCreateBox', function(ShapeCreateBox) {
        return ShapeCreateBox.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.ShapeCreateBox"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var attrs, factors, padding, paper, shapeAttrs, svgBBox;
              svgBBox = {};
              factors = {};
              paper = opts.paper;
              attrs = {};
              padding = 10;
              shapeAttrs = {};
              binding.createGuide = function(coords) {
                attrs.x = coords[0];
                attrs.y = coords[1];
                attrs.width = coords[0] + padding;
                attrs.height = coords[1] + padding;
                if ($.isEmptyObject(svgBBox)) {
                  svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                  return svgBBox.attr({
                    stroke: 'green',
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
              binding.resizeGuide = function(coords) {
                attrs.width = coords[0] - attrs.x;
                attrs.height = coords[1] - attrs.y;
                return svgBBox.attr({
                  width: attrs.width,
                  height: attrs.height
                });
              };
              return binding.completeShape = function(coords) {
                attrs.width = coords.width;
                attrs.height = coords.height;
                svgBBox.attr({
                  width: attrs.width,
                  height: attrs.height
                });
                svgBBox.hide();
                return {
                  x: attrs.x,
                  y: attrs.y,
                  width: attrs.width,
                  height: attrs.height
                };
              };
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
              var allAnnos, annoEl, bindingActive, bodyContent, deleteButton, editArea, editButton, editEnd, editStart, editUpdate, textArea, updateButton;
              annoEl = binding.locate('annotation');
              bodyContent = binding.locate('body');
              allAnnos = binding.locate('annotations');
              textArea = binding.locate('textarea');
              editArea = binding.locate('editarea');
              editButton = binding.locate('editbutton');
              updateButton = binding.locate('updatebutton');
              deleteButton = binding.locate('deletebutton');
              bindingActive = false;
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
                var prevMode;
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
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var attachDragResize, closeEnough, detachDragResize, drawShape, paper, renderings, selectShape;
              closeEnough = opts.closeEnough;
              renderings = {};
              paper = opts.paper;
              attachDragResize = function(id) {
                var curRendering, o;
                if ((typeof curRendering !== "undefined" && curRendering !== null) && id === curRendering.id) {
                  return;
                }
                o = renderings[id];
                if (o != null) {
                  return curRendering = o;
                } else {
                  binding.events.onClick.fire(void 0);
                  return curRendering = void 0;
                }
              };
              detachDragResize = function(id) {
                var o;
                if ((typeof curRendering !== "undefined" && curRendering !== null) && id === curRendering.id) {
                  return;
                }
                return o = renderings[id];
              };
              drawShape = function(container) {
                var bottomRight, mouseMode, offset, topLeft;
                mouseMode = 0;
                topLeft = [];
                bottomRight = [];
                offset = $(container).offset();
                $(container).unbind();
                $(container).mousedown(function(e) {
                  var x, y;
                  if (mouseMode > 0) return;
                  x = e.pageX - offset.left;
                  y = e.pageY - offset.top;
                  topLeft = [x, y];
                  mouseMode = 1;
                  return binding.events.onShapeStart.fire(topLeft);
                });
                $(container).mousemove(function(e) {
                  var x, y;
                  if (mouseMode === 2 || mouseMode === 0) return;
                  x = e.pageX - offset.left;
                  y = e.pageY - offset.top;
                  bottomRight = [x, y];
                  return binding.events.onShapeDrag.fire(bottomRight);
                });
                return $(container).mouseup(function(e) {
                  if (mouseMode < 1) return;
                  mouseMode = 0;
                  if (!(bottomRight != null)) bottomRight = [x + 5, y + 5];
                  return binding.events.onShapeDone.fire({
                    x: topLeft[0],
                    y: topLeft[1],
                    width: bottomRight[0] - topLeft[0],
                    height: bottomRight[1] - topLeft[1]
                  });
                });
              };
              selectShape = function(container) {
                $(container).unbind();
                return $(container).bind('mousedown', function(e) {
                  var activeId;
                  options.application.setActiveAnnotation(void 0);
                  return activeId = null;
                });
              };
              options.application.events.onActiveAnnotationChange.addListener(attachDragResize);
              options.application.events.onCurrentModeChange.addListener(function(mode) {
                if (mode === "Rectangle" || mode === "Ellipse") {
                  return drawShape(binding.locate('svgwrapper'));
                } else if (mode === 'Select') {
                  return selectShape(binding.locate('svgwrapper'));
                } else {
                  return $(binding.locate('svgwrapper')).unbind();
                }
              });
              binding.registerRendering = function(newRendering) {
                return renderings[newRendering.id] = newRendering;
              };
              return binding.removeRendering = function(oldRendering) {
                return delete renderings[oldRendering.id];
              };
            };
          }]));
        };
      });
      Controller.namespace('AnnotationCreationButton', function(AnnotationCreationButton) {
        return AnnotationCreationButton.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.AnnotationCreationButton"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var active, buttonEl, onCurrentModeChangeHandle;
              active = false;
              buttonEl = binding.locate('button');
              $(buttonEl).live('mousedown', function(e) {
                if (active === false) {
                  active = true;
                  options.application.setCurrentMode(opts.action);
                  return $(buttonEl).addClass("active");
                } else if (active === true) {
                  active = false;
                  options.application.setCurrentMode('');
                  return $(buttonEl).removeClass("active");
                }
              });
              onCurrentModeChangeHandle = function(action) {
                if (action === options.action) {
                  active = true;
                  return $(buttonEl).addClass('active');
                } else {
                  active = false;
                  return $(buttonEl).removeClass("active");
                }
              };
              return options.application.events.onCurrentModeChange.addListener(onCurrentModeChangeHandle);
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
      Controller.namespace('timeControl', function(timeControl) {
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
      return Controller.namespace('WindowResize', function(WindowResize) {
        return WindowResize.initController = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = MITHGrid.Controller).initController.apply(_ref, ["OAC.Client.StreamingVideo.Controller.WindowResize"].concat(__slice.call(args), [function(that) {
            var options;
            options = that.options;
            return that.applyBindings = function(binding, opts) {
              var w;
              w = binding.locate('resizeBox');
              return w.resize(function() {
                return setTimeout(binding.events.onResize.fire, 0);
              });
            };
          }]));
        };
      });
    });
    MITHGrid.Presentation.namespace("AnnotationList", function(AnnotationList) {
      return AnnotationList.initPresentation = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = MITHGrid.Presentation).initPresentation.apply(_ref, ["MITHGrid.Presentation.AnnotationList"].concat(__slice.call(args), [function(that, container) {}]));
      };
    });
    MITHGrid.Presentation.namespace("RaphaelCanvas", function(RaphaelCanvas) {
      return RaphaelCanvas.initPresentation = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = MITHGrid.Presentation).initPresentation.apply(_ref, ["MITHGrid.Presentation.RaphaelCanvas"].concat(__slice.call(args), [function(that, container) {
          var canvasBinding, canvasController, changeCanvasCoordinates, editBoundingBoxBinding, editBoxController, h, id, keyBoardController, keyboardBinding, options, shapeCreateBinding, shapeCreateController, superEventFocusChange, superRender, w, windowResizeBinding, windowResizeController, x, y;
          id = $(container).attr('id');
          options = that.options;
          canvasController = options.controllers.canvas;
          keyBoardController = options.controllers.keyboard;
          editBoxController = options.controllers.shapeEditBox;
          shapeCreateController = options.controllers.shapeCreateBox;
          windowResizeController = options.controllers.windowResize;
          x = $(container).css('x');
          y = $(container).css('y');
          w = $(container).width();
          h = $(container).height();
          keyboardBinding = keyBoardController.bind($(container), {});
          that.events = $.extend(true, that.events, keyboardBinding.events);
          that.canvas = new Raphael($(container), w, h);
          canvasBinding = canvasController.bind($(container), {
            closeEnough: 5,
            paper: that.canvas
          });
          editBoundingBoxBinding = editBoxController.bind($(container), {
            paper: that.canvas
          });
          shapeCreateBinding = shapeCreateController.bind($(container), {
            paper: that.canvas
          });
          windowResizeBinding = windowResizeController.bind(window);
          editBoundingBoxBinding.events.onResize.addListener(function(pos) {
            var activeRendering;
            activeRendering = that.getActiveRendering();
            if ((activeRendering != null) && (activeRendering.eventResize != null)) {
              return activeRendering.eventResize(pos);
            }
          });
          editBoundingBoxBinding.events.onMove.addListener(function(pos) {
            var activeRendering;
            activeRendering = that.getActiveRendering();
            if ((activeRendering != null) && (activeRendering.eventMove != null)) {
              return activeRendering.eventMove(pos);
            }
          });
          editBoundingBoxBinding.events.onDelete.addListener(function() {
            var activeRendering;
            activeRendering = that.getActiveRendering();
            if ((activeRendering != null) && (activeRendering.eventDelete != null)) {
              activeRendering.eventDelete();
              return editBoundingBoxBinding.detachRendering();
            }
          });
          options.application.events.onCurrentModeChange.addListener(function(newMode) {
            if (newMode !== "Select" && newMode !== "Drag") {
              return editBoundingBoxBinding.detachRendering();
            }
          });
          windowResizeBinding.events.onResize.addListener(function() {
            var canvasEl, containerEl, htmlWrapper;
            canvasEl = $('body').find('svg');
            containerEl = $(options.playerWrapper);
            htmlWrapper = $(container);
            x = parseInt($(containerEl).offset().left, 10);
            y = parseInt($(containerEl).offset().top, 10);
            w = parseInt($(containerEl).width(), 10);
            h = parseInt($(containerEl).height(), 10);
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
          });
          windowResizeBinding.events.onResize.fire();
          canvasBinding.events.onShapeStart.addListener(function(coords) {
            return shapeCreateBinding.createGuide(coords);
          });
          canvasBinding.events.onShapeDrag.addListener(function(coords) {
            return shapeCreateBinding.resizeGuide(coords);
          });
          canvasBinding.events.onShapeDone.addListener(function(coords) {
            var shape;
            shape = shapeCreateBinding.completeShape(coords);
            return options.application.insertShape(shape);
          });
          changeCanvasCoordinates = function(args) {
            var wh, xy;
            if (args != null) {
              xy = args.getcoordinates();
              wh = args.getsize();
              $(container).css({
                left: parseInt(xy[0], 10) + 'px',
                top: parseInt(xy[1], 10) + 'px',
                width: wh[0],
                height: wh[1]
              });
              return $('svg').css({
                left: parseInt(xy[0], 10) + 'px',
                top: parseInt(xy[1], 10) + 'px',
                width: wh[0],
                height: wh[1]
              });
            }
          };
          options.application.events.onCurrentTimeChange.addListener(function(npt) {
            return that.visitRenderings(function(id, rendering) {
              if (rendering.eventCurrentTimeChange != null) {
                return rendering.eventCurrentTimeChange(npt);
              }
            });
          });
          options.application.events.onTimeEasementChange.addListener(function(te) {
            return that.visitRenderings(function(id, rendering) {
              if (rendering.eventTimeEasementChange != null) {
                return rendering.eventTimeEasementChange(te);
              }
            });
          });
          options.application.events.onPlayerChange.addListener(changeCanvasCoordinates);
          options.application.dataStore.canvas.events.onModelChange.addListener(function() {
            return editBoundingBoxBinding.detachRendering();
          });
          superRender = that.render;
          that.render = function(c, m, i) {
            var allAnnosModel, rendering, searchAnnos, tempStore;
            rendering = superRender(c, m, i);
            if (rendering != null) {
              tempStore = m;
              while (tempStore.dataStore) {
                tempStore = tempStore.dataStore;
              }
              allAnnosModel = tempStore;
              searchAnnos = options.dataView.prepare(['!type']);
              canvasBinding.registerRendering(rendering);
            }
            return rendering;
          };
          superEventFocusChange = that.eventFocusChange;
          return that.eventFocusChange = function(id) {
            if (options.application.getCurrentMode() === 'Select') {
              superEventFocusChange(id);
              return editBoundingBoxBinding.attachRendering(that.getActiveRendering());
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
      var args, cb, container, extendedOpts, klass, myCanvasId, options, shapeAnnotationId, shapeTypes, wh, xy, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      shapeTypes = {};
      shapeAnnotationId = 0;
      myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId;
      xy = [];
      wh = [];
      _ref = MITHGrid.normalizeArgs.apply(MITHGrid, ["OAC.Client.StreamingVideo"].concat(__slice.call(args))), klass = _ref[0], container = _ref[1], options = _ref[2], cb = _ref[3];
      canvasId += 1;
      extendedOpts = $.extend(true, {}, {
        viewSetup: "<div id=\"" + myCanvasId + "\" class=\"section-canvas\"></div>\n<div class=\"mithgrid-bottomarea\">\n	<div class=\"timeselect\">\n		<p>Enter start time:</p>\n		<input id=\"timestart\" type=\"text\" />\n		<p>Enter end time:</p>\n		<input id=\"timeend\" type=\"text\" />\n		<div id=\"submittime\" class=\"button\">Confirm time settings</div>\n	</div>\n	<div id=\"sidebar" + myCanvasId + "\" class=\"section-controls\"></div>\n	<div class=\"section-annotations\">\n		<div class=\"header\">\n			Annotations\n		</div>\n	</div>\n</div>",
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
          },
          annoItem: {
            container: '.section-annotations',
            lenses: {},
            lensKey: ['.bodyType']
          }
        }
      }, options);
      return MITHGrid.Application.initInstance(klass, container, extendedOpts, function(appOb) {
        var NS, OAC_NS, app;
        app = appOb;
        app.initShapeLens = function(container, view, model, itemId) {
          var calcOpacity, end, fend, fstart, item, opacity, start, that;
          that = {
            id: itemId
          };
          item = model.getItem(itemId);
          calcOpacity = function(n) {
            var val;
            val = 0;
            if (n < fstart || n > fend) return 0.0;
            if (n < start) {
              val = 1 / (start - n);
              val = val.toFixed(3);
            } else if (n > end) {
              val = 1 / (n - end);
              val = val.toFixed(3);
            } else {
              val = 1;
            }
            return val;
          };
          start = item.npt_start[0];
          end = item.npt_end[0];
          fstart = start - app.getTimeEasement();
          fend = end + app.getTimeEasement();
          opacity = calcOpacity(app.getCurrentTime());
          that.eventTimeEasementChange = function(v) {
            fstart = start - v;
            fend = end + v;
            return that.setOpacity(calcOpacity(app.getCurrentTime()));
          };
          that.eventCurrentTimeChange = function(n) {
            return that.setOpacity(calcOpacity(n));
          };
          that.setOpacity = function(o) {
            if (o != null) opacity = o;
            return that.shape.attr({
              opacity: (typeof focused !== "undefined" && focused !== null ? focused : {
                1.0: 0.5
              }) * opacity
            });
          };
          that.eventFocus = function() {
            var focused;
            focused = 1;
            that.setOpacity();
            that.shape.toFront();
            return view.events.onDelete.addListener(that.eventDelete);
          };
          that.eventUnfocus = function() {
            var focused;
            focused = 0;
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
        app.buttonFeature = function(area, grouping, action) {
          var buttonBinding, buttons, groupEl, item, that;
          if ($('#' + action + myCanvasId).length !== 0) return false;
          that = {};
          buttons = $(".button");
          container = $("#sidebar" + myCanvasId);
          switch (area) {
            case 'buttongrouping':
              if ($(container).find('#' + grouping + myCanvasId).length === 0) {
                $(container).append('<div id="' + grouping + myCanvasId + '" class="buttongrouping"></div>');
              }
              groupEl = $("#" + grouping + myCanvasId);
              item = '<div id="' + action + myCanvasId + '" class="button">' + action + '</div>';
              $(groupEl).append(item);
              that.element = $("#" + action + myCanvasId);
              buttonBinding = app.controller.buttonActive.bind(that.element, {
                action: action
              });
              break;
            case 'slidergrouping':
              if ($(container).find('#' + grouping + myCanvasId).length === 0) {
                $(container).append('<div id="' + grouping + myCanvasId + '" class="slidergrouping"></div>');
              }
              groupEl = $("#" + grouping + myCanvasId);
              item = '<div id="' + action + myCanvasId + '"><div class="header">' + action + myCanvasId + '</div>' + '<div id="slider"></div><div class="timedisplay"></div></div>';
              $(groupEl).append(item);
              that.element = $("#" + action + myCanvasId);
              buttonBinding = app.controller.slider.bind(that.element, {
                action: action
              });
          }
          return that;
        };
        app.addShape = function(key, svgShape) {
          return app.presentation.raphsvg.addLens(key, svgShape);
        };
        app.addBody = function(key, textLens) {
          return app.presentation.annoItem.addLens(key, textLens);
        };
        app.addShapeType = function(type, args) {
          var button, calcF, lensF;
          calcF = args.calc;
          lensF = args.lens;
          button = app.buttonFeature('Shapes', type);
          shapeTypes[type] = {
            calc: calcF
          };
          return app.addShape(type, lensF);
        };
        app.insertShape = function(coords) {
          var curMode, npt_end, npt_start, shape, shapeItem;
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
            return app.dataStore.canvas.loadItems([$.extend(true, shapeItem, shape)]);
          }
        };
        OAC_NS = {
          root: 'http:#www.openannotation.org/ns/',
          Annotation: 'http:#www.openannotation.org/ns/Annotation',
          Body: 'http:#www.openannotation.org/ns/Body',
          Target: 'http:#www.openannotation.org/ns/Target',
          SpTarget: 'http:#www.openannotation.org/ns/ConstrainedTarget',
          Selector: 'http:#www.w3.org/ns/openannotation/core/CompoundSelector',
          FragSelector: 'http:#www.w3.org/ns/openannotation/core/FragmentSelector',
          SVGConstraint: 'http:#www.w3.org/ns/openannotation/extensions/SvgSelector'
        };
        NS = {
          OA: "http://www.w3.org/ns/openannotation/core",
          OAX: "http://www.w3.org/ns/openannotation/extensions",
          RDF: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          CNT: "http://www.w3.org/2008/content#",
          DC: "http://purl.org/dc/elements/1.1/"
        };
        app.importData = function(data) {
          var hasSelector, hasTarget, i, npt, nptid, o, s, suid, svgid, t, temp, tempstore, tuid, _i, _j, _len, _len2, _len3, _ref2, _ref3, _ref4, _ref5, _ref6;
          tempstore = [];
          for (o = 0, _len = data.length; o < _len; o++) {
            i = data[o];
            if (_ref2 = NS.OA + "Annotation", __indexOf.call(o[NS.RDF + "type"], _ref2) >= 0) {
              if (o[NS.OA + "hasTarget"] != null) {
                _ref3 = o[NS.OA + "hasTarget"];
                for (_i = 0, _len2 = _ref3.length; _i < _len2; _i++) {
                  hasTarget = _ref3[_i];
                  if ((data[hasTarget.value] != null) && (data[hasTarget.value][NS.OA + "hasSource"] != null)) {
                    if (_ref4 = app.options.url, __indexOf.call((function() {
                      var _j, _len3, _ref5, _results;
                      _ref5 = data[hasTarget.value][NS.OA + "hasSource"];
                      _results = [];
                      for (_j = 0, _len3 = _ref5.length; _j < _len3; _j++) {
                        s = _ref5[_j];
                        _results.push(s.value);
                      }
                      return _results;
                    })(), _ref4) >= 0) {
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
                      tuid = data[hasTarget.value];
                      _ref5 = tuid[NS.OA + "hasSelector"];
                      for (_j = 0, _len3 = _ref5.length; _j < _len3; _j++) {
                        hasSelector = _ref5[_j];
                        if ((data[hasSelector.value] != null) && (_ref6 = NS.OAX + "CompoundSelector", __indexOf.call((function() {
                          var _k, _len4, _ref7, _results;
                          _ref7 = data[hasSelector.value][NS.RDF + "type"];
                          _results = [];
                          for (_k = 0, _len4 = _ref7.length; _k < _len4; _k++) {
                            t = _ref7[_k];
                            _results.push(t.value);
                          }
                          return _results;
                        })(), _ref6) >= 0)) {
                          suid = data[hasSelector.value];
                          svgid = data[suid.hasSelector[0].value];
                          temp.shapeType = $(svgid.chars[0].value)[0].nodeName;
                          if (temp.shapeType === 'RECT') {
                            temp.shapeType = 'Rectangle';
                          } else if (temp.shapeType === 'ELLI') {
                            temp.shapeType = 'Ellipse';
                          }
                          temp.x = parseInt($(svgid.chars[0].value).attr('x'), 10);
                          temp.y = parseInt($(svgid.chars[0].value).attr('y'), 10);
                          temp.w = parseInt($(svgid.chars[0].value).attr('width'), 10);
                          temp.h = parseInt($(svgid.chars[0].value).attr('height'), 10);
                          nptid = data[suid.hasSelector[1].value];
                          npt = nptid.value[0].value.replace(/^t=npt:/g, '');
                          temp.npt_start = parseInt(npt.replace(/\,[0-9]+/g, ''), 10);
                          temp.npt_end = parseInt(npt.replace(/^[0-9]+\,/g, ''), 10);
                          temp.bodyContent = data[o.hasBody[0].value].chars[0].value || '';
                          tempstore.push(temp);
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
                if (o[NS.OA + "hasBody"] != null) {
                  temp.bodyContent = data[o[NS.OA + "hasBody"][0].value][NS.CNT + "chars"][0];
                }
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
            uri(id[0], NS.RDF, "type", "" + NS.OA + "ConstrainedTarget");
            uri(id[0], NS.OA, "hasSource", obj.targetURI[0]);
            bnode(id[0], NS.OA, "hasSelector", id[1]);
            uri(id[1], NS.RDF, "type", "" + NS.OA + "CompoundSelector");
            bnode(id[1], NS.OA, "hasSelector", id[2]);
            bnode(id[1], NS.OA, "hasSelector", id[3]);
            uri(id[2], NS.RDF, "type", "" + NS.OAX + "SVGConstraint");
            literal(id[2], NS.DC, "format", "text/svg+xml");
            literal(id[2], NS.CNT, "characterEncoding", "utf-8");
            literal(id[2], NS.CNT, "chars", '<' + obj.shapeType[0].substring(0, 4).toLowerCase() + ' x="' + obj.x[0] + '" y="' + obj.y[0] + '" width="' + obj.w[0] + '" height="' + obj.h[0] + '" />');
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
          app.events.onActiveAnnotationChange.addListener(app.presentation.annoItem.eventFocusChange);
          app.events.onCurrentTimeChange.addListener(function(t) {
            app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5);
            return app.setCurrentMode('Watch');
          });
          return app.events.onPlayerChange.addListener(function(playerobject) {
            app.setCurrentTime(playerobject.getPlayhead());
            playerobject.onPlayheadUpdate(function(t) {
              return app.setCurrentTime(app.getCurrentTime() + 1);
            });
            return app.events.onCurrentModeChange.addListener(function(nmode) {
              if (nmode !== 'Watch') {
                return playerobject.pause();
              } else if (nmode === 'Watch') {
                return playerobject.play();
              }
            });
          });
        });
        return app.ready(function() {
          var ellipseButton, exportRectangle, rectButton, selectButton, timeControlBinding, watchButton;
          exportRectangle = function(item, w, h) {
            var itemCopy;
            itemCopy = $.extend(true, {}, item);
            itemCopy.x = (itemCopy.x / w) * 100;
            itemCopy.y = (itemCopy.y / h) * 100;
            itemCopy.w = (itemCopy.w / w) * 100;
            itemCopy.h = (itemCopy.h / h) * 100;
            return itemCopy;
          };
          app.addShapeType("Rectangle", {
            calc: function(coords) {
              return {
                x: coords.x + (coords.width / 2),
                y: coords.y + (coords.height / 2),
                w: coords.width,
                h: coords.height
              };
            },
            lens: function(container, view, model, itemId) {
              var c, item, selectBinding, superUpdate, that;
              that = app.initShapeLens(container, view, model, itemId);
              item = model.getItem(itemId);
              c = view.canvas.rect(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.w[0], item.h[0]);
              that.shape = c;
              c.attr({
                fill: "red"
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
            lens: function(container, view, model, itemId) {
              var c, item, selectBinding, superUpdate, that;
              that = app.initShapeLens(container, view, model, itemId);
              item = model.getItem(itemId);
              c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0] / 2, item.h[0] / 2);
              that.shape = c;
              c.attr({
                fill: "red"
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
          app.addBody("Text", app.initTextLens);
          rectButton = app.buttonFeature('buttongrouping', 'Shapes', 'Rectangle');
          ellipseButton = app.buttonFeature('buttongrouping', 'Shapes', 'Ellipse');
          selectButton = app.buttonFeature('buttongrouping', 'General', 'Select');
          watchButton = app.buttonFeature('buttongrouping', 'General', 'Watch');
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

  MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid", {
    dirs: ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'],
    bind: {
      events: {
        onResize: null,
        onMove: null,
        onEdit: null,
        onDelete: null,
        onCurrentModeChange: null
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
      shapeEditBox: {
        type: OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid
      },
      shapeCreateBox: {
        type: OAC.Client.StreamingVideo.Controller.ShapeCreateBox
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
      buttonActive: {
        type: OAC.Client.StreamingVideo.Controller.AnnotationCreationButton,
        selectors: {
          button: ''
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
      },
      windowResize: {
        type: OAC.Client.StreamingVideo.Controller.WindowResize,
        selectors: {
          resizeBox: ''
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
      },
      Player: {
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
          canvas: "canvas",
          shapeCreateBox: "shapeCreateBox",
          shapeEditBox: "shapeEditBox",
          windowResize: "windowResize"
        },
        events: {
          onOpacityChange: null
        },
        fadeStart: 5
      },
      annoItem: {
        type: MITHGrid.Presentation.AnnotationList,
        dataView: 'currentAnnotations',
        container: '.anno_list'
      }
    }
  });

}).call(this);
