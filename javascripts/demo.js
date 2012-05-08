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
      onDelete: null,
      onEdit: null,
      onSave: null
    },
    viewSetup: "<span class=\"edit\"><a href=\"#\" title=\"edit annotation\"></a></span>\n<span class=\"save\"><a href=\"#\" title=\"save annotation\"></a></span>\n<span class=\"delete\"><a href=\"#\" title=\"delete annotation\"></a></span>"
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
      return TextControls.initInstance = function() {
        var args, clickController;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        clickController = Demo.Click.initInstance({});
        return MITHGrid.initInstance.apply(MITHGrid, ["OAC.Client.StreamingVideo.Demo.TextControls"].concat(__slice.call(args), [function(that, container) {
          var app, appFn, options, shown;
          options = that.options;
          app = options.application();
          appFn = options.application;
          shown = false;
          $(document).ready(function() {
            var deleteBinding, deleteEl, editBinding, editEl, saveBinding, saveEl;
            editEl = $(container).find(".edit");
            saveEl = $(container).find(".save");
            deleteEl = $(container).find(".delete");
            editBinding = clickController.bind(editEl);
            saveBinding = clickController.bind(saveEl);
            deleteBinding = clickController.bind(deleteEl);
            editBinding.events.onSelect.addListener(function() {
              if (shown) return that.events.onEdit.fire();
            });
            saveBinding.events.onSelect.addListener(function() {
              if (shown) return that.events.onSave.fire();
            });
            return deleteBinding.events.onSelect.addListener(function() {
              if (shown) return that.events.onDelete.fire();
            });
          });
          that.eventShow = function() {
            $(container).show();
            return shown = true;
          };
          that.eventHide = function() {
            $(container).hide();
            return shown = false;
          };
          that.eventMove = function(top, right) {
            return $(container).css({
              top: top + "px",
              left: (right - 60) + "px"
            });
          };
          return that.eventHide();
        }]));
      };
    });
    return Demo.namespace("Application", function(Application) {
      return Application.initInstance = function() {
        var args, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return (_ref = OAC.Client.StreamingVideo.Application).initInstance.apply(_ref, ["OAC.Client.StreamingVideo.Demo.Application"].concat(__slice.call(args), [function(app) {
          var appFn;
          appFn = function() {
            return app;
          };
          return app.ready(function() {
            var annotations, hoverController, textControls;
            annotations = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance('#annotation-text', {
              dataView: app.dataView.currentAnnotations,
              lensKey: ['.bodyType'],
              application: appFn
            });
            hoverController = OAC.Client.StreamingVideo.Demo.Hover.initInstance();
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
            annotations.addLens("Text", function(container, view, model, itemId) {
              var binding, inEditing, inputEl, rendering, superDelete, superFocus, superUnfocus, textEl;
              rendering = annotations.initTextLens(container, view, model, itemId);
              binding = hoverController.bind(rendering.el);
              inEditing = false;
              textEl = $(rendering.el).find(".body-content");
              inputEl = $("<textarea></textarea>");
              rendering.el.append(inputEl);
              inputEl.hide();
              binding.events.onFocus.addListener(function() {
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
                superUnfocus();
                return textControls.eventHide();
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
                if (inEditing) {
                  app.unlockActiveAnnotation();
                  inEditing = false;
                  textEl.show();
                  return inputEl.hide();
                } else {
                  if (app.getActiveAnnotation() === itemId) {
                    app.setActiveAnnotation(null);
                  }
                  return superDelete();
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
