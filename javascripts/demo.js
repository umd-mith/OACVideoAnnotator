
/*
#
# ## Educational Community License, Version 2.0
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
*/

(function() {
  var __slice = Array.prototype.slice;

  MITHGrid.defaults("OAC.Client.StreamingVideo.Demo.Hover", {
    bind: {
      events: {
        onFocus: null,
        onUnfocus: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Demo.Click", {
    bind: {
      events: {
        onSelect: null
      }
    }
  });

  MITHGrid.defaults("OAC.Client.StreamingVideo.Demo.TextControls", {
    events: {
      onCancel: null,
      onDelete: null,
      onEdit: null,
      onSave: null
    },
    viewSetup: "<span class=\"edit\"><a href=\"#\" title=\"edit annotation\"></a></span>\n<span class=\"save\"><a href=\"#\" title=\"save edit\"></a></span>\n<span class=\"cancel\"><a href=\"#\" title=\"cancel edit\"></a></span>	\n<span class=\"delete\"><a href=\"#\" title=\"delete annotation\"></a></span>"
  });

  OAC.Client.StreamingVideo.namespace("Demo", function(Demo) {
    Demo.namespace("Click", function(Click) {
      return Click.initInstance = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Demo.Click"].concat(__slice.call(args), [function(that) {
          return that.applyBindings = function(binding) {
            return binding.locate('').click(binding.events.onSelect.fire);
          };
        }]));
      };
    });
    Demo.namespace("Hover", function(Hover) {
      return Hover.initInstance = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = MITHGrid.Controller).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Demo.Hover"].concat(__slice.call(args), [function(that) {
          return that.applyBindings = function(binding) {
            return binding.locate('').hover(binding.events.onFocus.fire, binding.events.onUnfocus.fire);
          };
        }]));
      };
    });
    Demo.namespace("TextControls", function(TextControls) {
      var clickController;
      clickController = Demo.Click.initInstance({});
      return TextControls.initInstance = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Demo.TextControls"].concat(__slice.call(args), [function(that, container) {
          var app, appFn, inEditing, options, resetEditMode, setEditMode, shown;
          options = that.options;
          app = options.application();
          appFn = options.application;
          shown = false;
          inEditing = false;
          setEditMode = function() {};
          resetEditMode = function() {};
          $(document).ready(function() {
            var cancelBinding, cancelEl, deleteBinding, deleteEl, editBinding, editEl, saveBinding, saveEl;
            editEl = $(container).find(".edit");
            saveEl = $(container).find(".save");
            cancelEl = $(container).find(".cancel");
            deleteEl = $(container).find(".delete");
            editBinding = clickController.bind(editEl);
            saveBinding = clickController.bind(saveEl);
            cancelBinding = clickController.bind(cancelEl);
            deleteBinding = clickController.bind(deleteEl);
            setEditMode = function() {
              inEditing = true;
              editEl.hide();
              saveEl.show();
              deleteEl.hide();
              return cancelEl.show();
            };
            resetEditMode = function() {
              inEditing = false;
              editEl.show();
              saveEl.hide();
              deleteEl.show();
              return cancelEl.hide();
            };
            editBinding.events.onSelect.addListener(function() {
              if (shown && !inEditing) {
                setEditMode();
                return that.events.onEdit.fire();
              }
            });
            saveBinding.events.onSelect.addListener(function() {
              if (shown && inEditing) {
                resetEditMode();
                return that.events.onSave.fire();
              }
            });
            cancelBinding.events.onSelect.addListener(function() {
              if (shown && inEditing) {
                resetEditMode();
                return that.events.onCancel.fire();
              }
            });
            deleteBinding.events.onSelect.addListener(function() {
              if (shown && !inEditing) return that.events.onDelete.fire();
            });
            return resetEditMode();
          });
          that.eventShow = function() {
            resetEditMode();
            $(container).show();
            return shown = true;
          };
          that.eventHide = function() {
            $(container).hide();
            return shown = false;
          };
          that.eventMove = function(top, right) {
            if (shown && inEditing) {
              resetEditMode();
              that.events.onCancel.fire();
            }
            return $(container).css({
              top: top + "px",
              left: (right - 45) + "px"
            });
          };
          return that.eventHide();
        }]));
      };
    });
    return Demo.namespace("Application", function(Application) {
      var hoverController;
      hoverController = OAC.Client.StreamingVideo.Demo.Hover.initInstance();
      return Application.initInstance = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = OAC.Client.StreamingVideo.Application).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Demo.Application"].concat(__slice.call(args), [function(app) {
          var appFn;
          appFn = function() {
            return app;
          };
          return app.ready(function() {
            var annotations, textControls;
            annotations = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance('#annotation-text', {
              dataView: app.dataView.currentAnnotations,
              lensKey: ['.bodyType'],
              application: appFn
            });
            textControls = OAC.Client.StreamingVideo.Demo.TextControls.initInstance("#text-controls", {
              application: appFn
            });
            app.events.onActiveAnnotationChange.addListener(annotations.eventFocusChange);
            textControls.events.onEdit.addListener(function() {
              var rendering;
              rendering = annotations.getFocusedRendering();
              if (rendering != null) return rendering.eventEdit();
            });
            textControls.events.onDelete.addListener(function() {
              var rendering;
              rendering = annotations.getFocusedRendering();
              if (rendering != null) return rendering.eventDelete();
            });
            textControls.events.onSave.addListener(function() {
              var rendering;
              rendering = annotations.getFocusedRendering();
              if (rendering != null) return rendering.eventSave();
            });
            textControls.events.onCancel.addListener(function() {
              var rendering;
              rendering = annotations.getFocusedRendering();
              if (rendering != null) return rendering.eventCancel();
            });
            annotations.addLens("Text", function(container, view, model, itemId) {
              var hoverBinding, inEditing, inputEl, rendering, superDelete, superFocus, superUnfocus, textEl;
              rendering = annotations.initTextLens(container, view, model, itemId);
              hoverBinding = hoverController.bind(rendering.el);
              inEditing = false;
              textEl = $(rendering.el).find(".body-content");
              inputEl = $("<textarea></textarea>");
              rendering.el.append(inputEl);
              inputEl.hide();
              hoverBinding.events.onFocus.addListener(function() {
                return app.setActiveAnnotation(itemId);
              });
              superFocus = rendering.eventFocus;
              superUnfocus = rendering.eventUnfocus;
              rendering.eventFocus = function() {
                superFocus();
                textControls.eventMove($(rendering.el).position().top, $(rendering.el).position().left);
                return textControls.eventShow();
              };
              rendering.eventUnfocus = function() {
                textControls.eventHide();
                return superUnfocus();
              };
              rendering.eventEdit = function() {
                var text;
                if (!inEditing) {
                  app.lockActiveAnnotation();
                  inEditing = true;
                  text = textEl.text();
                  textEl.hide();
                  inputEl.show();
                  return inputEl.val(text);
                }
              };
              superDelete = rendering.eventDelete;
              rendering.eventDelete = function() {
                if (!inEditing) return superDelete();
              };
              rendering.eventCancel = function() {
                if (inEditing) {
                  app.unlockActiveAnnotation();
                  inEditing = false;
                  textEl.show();
                  return inputEl.hide();
                }
              };
              rendering.eventSave = function() {
                if (inEditing) {
                  app.unlockActiveAnnotation();
                  inEditing = false;
                  textEl.show();
                  rendering.eventUpdate(inputEl.val());
                  return inputEl.hide();
                }
              };
              return rendering;
            });
            OAC.Client.StreamingVideo.Component.ModeButton.initInstance("#modeRectangle", {
              mode: "Rectangle",
              application: appFn
            });
            OAC.Client.StreamingVideo.Component.ModeButton.initInstance("#modeEllipse", {
              mode: "Ellipse",
              application: appFn
            });
            OAC.Client.StreamingVideo.Component.ModeButton.initInstance("#modeSelect", {
              mode: "Select",
              application: appFn
            });
            OAC.Client.StreamingVideo.Component.ModeButton.initInstance("#modeWatch", {
              mode: "Watch",
              application: appFn
            });
            $("#select-button").click(function() {
              $("#export-text").focus();
              return $("#export-text").select();
            });
            $("#export-button").click(function() {
              var data;
              data = app.exportData();
              return $("#export-text").val(jsl.format.formatJson(JSON.stringify(data)));
            });
            return $("#import-button").click(function() {
              var str;
              str = $("#export-text").val();
              if (str !== "") return app.importData(JSON.parse(str));
            });
          });
        }]));
      };
    });
  });

}).call(this);
