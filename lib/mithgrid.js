(function() {
  /*
   * mithgrid JavaScript Library v0.0.1
   *
   * Date: Fri Sep 30 06:11:02 2011 -0700
   *
   * (c) Copyright University of Maryland 2011.  All rights reserved.
   *
   * (c) Copyright Texas A&M University 2010.  All rights reserved.
   *
   * Portions of this code are copied from The SIMILE Project:
   *  (c) Copyright The SIMILE Project 2006. All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions
   * are met:
   *
   * 1. Redistributions of source code must retain the above copyright
   *    notice, this list of conditions and the following disclaimer.
   *
   * 2. Redistributions in binary form must reproduce the above copyright
   *    notice, this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   *
   * 3. The name of the author may not be used to endorse or promote products
   *    derived from this software without specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
   * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
   * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
   * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
   * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
   * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
   * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
   * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
   * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *
  */  var MITHGrid, fluid, jQuery, _ref, _ref2, _ref3;
  var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  MITHGrid = (_ref = this.MITHGrid) != null ? _ref : this.MITHGrid = {};
  fluid = (_ref2 = this.fluid) != null ? _ref2 : this.fluid = {};
  jQuery = (_ref3 = this.jQuery) != null ? _ref3 : this.jQuery = {};
  (function($, MITHGrid) {
    var Application, Data, Expression, Facet, MITHGridDefaults, genericNamespacer, initViewCounter, _operators, _ref4;
    if ((typeof window !== "undefined" && window !== null ? (_ref4 = window.console) != null ? _ref4.log : void 0 : void 0) != null) {
      MITHGrid.debug = window.console.log;
    } else {
      MITHGrid.debug = function() {};
    }
    MITHGrid.error = function() {
      MITHGrid.debug.call({}, arguments);
      return {
        'arguments': arguments
      };
    };
    genericNamespacer = function(base, nom) {
      var newbase;
      if (!(base[nom] != null)) {
        newbase = {
          namespace: function(nom2) {
            return genericNamespacer(newbase, nom2);
          },
          debug: MITHGrid.debug
        };
      }
      return base[nom] = newbase;
    };
    MITHGrid.namespace = function(nom) {
      return genericNamespacer(MITHGrid, nom);
    };
    MITHGridDefaults = {};
    MITHGrid.defaults = function(namespace, defaults) {
      MITHGridDefaults[namespace] || (MITHGridDefaults[namespace] = {});
      return MITHGridDefaults[namespace] = $.extend(true, MITHGridDefaults[namespace], defaults);
    };
    MITHGrid.initEventFirer = function(isPreventable, isUnicast) {
      var listeners, that;
      that = {};
      that.isPreventable = isPreventable;
      that.isUnicast = isUnicast;
      listeners = [];
      that.addListener = function(listener, namespace) {
        return listeners.push([listener, namespace]);
      };
      that.removeListener = function(listener) {
        var listener;
        if (typeof listener === "string") {
          return listeners = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = listeners.length; _i < _len; _i++) {
              listener = listeners[_i];
              if (listener[1] !== listener) {
                _results.push(listener);
              }
            }
            return _results;
          })();
        } else {
          return listeners = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = listeners.length; _i < _len; _i++) {
              listener = listeners[_i];
              if (listener[0] !== listener) {
                _results.push(listener);
              }
            }
            return _results;
          })();
        }
      };
      if (isUnicast) {
        that.fire = function() {
          var args, _ref5;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (listeners.length > 0) {
            try {
              return (_ref5 = listeners[0])[0].apply(_ref5, args);
            } catch (e) {
              return console.log(e);
            }
          } else {
            return true;
          }
        };
      } else if (isPreventable) {
        that.fire = function() {
          var args, l, listener, r, _i, _len;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          r = true;
          for (_i = 0, _len = listeners.length; _i < _len; _i++) {
            listener = listeners[_i];
            l = listener[0];
            try {
              r = l.apply(null, args);
            } catch (e) {
              console.log(e);
            }
            if (r === false) {
              return false;
            }
          }
          return true;
        };
      } else {
        that.fire = function() {
          var args, listener, _i, _len;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          for (_i = 0, _len = listeners.length; _i < _len; _i++) {
            listener = listeners[_i];
            try {
              listener[0].apply(listener, args);
            } catch (e) {
              console.log(e);
            }
          }
          return true;
        };
      }
      return that;
    };
    initViewCounter = 0;
    MITHGrid.initView = function(namespace, container, config) {
      var bits, c, k, ns, options, that, _ref5;
      if (!(config != null)) {
        config = container;
        container = void 0;
      }
      that = {};
      options = {};
      bits = namespace.split('.');
      ns = bits.shift();
      options = $.extend(true, {}, MITHGridDefaults[ns] || {});
      while (bits.length > 0) {
        ns = ns + "." + bits.shift();
        options = $.extend(true, options, MITHGridDefaults[ns] || {});
      }
      options = $.extend(true, options, config || {});
      initViewCounter += 1;
      that.id = initViewCounter;
      that.options = options;
      that.container = container;
      that.events = {};
      if (that.options.events != null) {
        _ref5 = that.options.events;
        for (k in _ref5) {
          c = _ref5[k];
          if (c != null) {
            if (typeof c === "string") {
              c = [c];
            }
          } else {
            c = [];
          }
          that.events[k] = MITHGrid.initEventFirer((__indexOf.call(c, "preventable") >= 0), (__indexOf.call(c, "unicast") >= 0));
        }
      }
      return that;
    };
    Data = MITHGrid.namespace('Data');
    Data.initSet = function(values) {
      var count, i, items, items_list, recalc_items, that, _i, _len;
      that = {};
      items = {};
      count = 0;
      recalc_items = true;
      items_list = [];
      that.isSet = true;
      that.items = function() {
        var i;
        if (recalc_items) {
          items_list = [];
          for (i in items) {
            if (typeof i === "string" && items[i] === true) {
              items_list.push(i);
            }
          }
        }
        return items_list;
      };
      that.add = function(item) {
        if (!(items[item] != null)) {
          items[item] = true;
          recalc_items = true;
          return count += 1;
        }
      };
      that.remove = function(item) {
        if (items[item] != null) {
          delete items[item];
          recalc_items = true;
          return count -= 1;
        }
      };
      that.visit = function(fn) {
        var o, _results;
        _results = [];
        for (o in items) {
          if (fn(o) === true) {
            break;
          }
        }
        return _results;
      };
      that.contains = function(o) {
        return items[o] != null;
      };
      that.size = function() {
        if (recalc_items) {
          return that.items().length;
        } else {
          return items_list.length;
        }
      };
      if (values instanceof Array) {
        for (_i = 0, _len = values.length; _i < _len; _i++) {
          i = values[_i];
          that.add(i);
        }
      }
      return that;
    };
    Data.initType = function(t) {
      var that;
      return that = {
        name: t,
        custom: {}
      };
    };
    Data.initProperty = function(p) {
      var that;
      return that = {
        name: p,
        getValueType: function() {
          var _ref5;
          return (_ref5 = that.valueType) != null ? _ref5 : 'text';
        }
      };
    };
    Data.initStore = function(options) {
      var getUnion, indexFillSet, indexPut, ops, properties, quiesc_events, set, spo, that, types;
      quiesc_events = false;
      set = Data.initSet();
      types = {};
      properties = {};
      spo = {};
      ops = {};
      indexPut = function(index, x, y, z) {
        var array, counts, hash;
        hash = index[x];
        if (!(hash != null)) {
          hash = {
            values: {},
            counts: {}
          };
          index[x] = hash;
        }
        array = hash.values[y];
        counts = hash.counts[y];
        if (!(array != null)) {
          array = [];
          hash.values[y] = array;
        }
        if (!(counts != null)) {
          counts = {};
          hash.counts[y] = counts;
        } else if (__indexOf.call(array, z) >= 0) {
          counts[z] += 1;
          return;
        }
        array.push(z);
        return counts[z] = 1;
      };
      indexFillSet = function(index, x, y, set, filter) {
        var array, hash, z, _i, _j, _len, _len2, _results, _results2;
        hash = index[x];
        if (hash != null) {
          array = hash.values[y];
          if (array != null) {
            if (filter != null) {
              _results = [];
              for (_i = 0, _len = array.length; _i < _len; _i++) {
                z = array[_i];
                _results.push(filter.contains(z) ? set.add(z) : void 0);
              }
              return _results;
            } else {
              _results2 = [];
              for (_j = 0, _len2 = array.length; _j < _len2; _j++) {
                z = array[_j];
                _results2.push(set.add(z));
              }
              return _results2;
            }
          }
        }
      };
      getUnion = function(index, xSet, y, set, filter) {
        if (!(set != null)) {
          set = Data.initSet();
        }
        xSet.visit(function(x) {
          return indexFillSet(index, x, y, set, filter);
        });
        return set;
      };
            if (options != null) {
        options;
      } else {
        options = {};
      };
      that = MITHGrid.initView("MITHGrid.Data.initStore", options);
      that.items = set.items;
      that.contains = set.contains;
      that.addProperty = function(nom, options) {
        var prop;
        prop = Data.initProperty(nom);
        if ((options != null ? options.valueType : void 0) != null) {
          prop.valueType = options.valueType;
          properties[nom] = prop;
        }
        return prop;
      };
      that.getProperty = function(nom) {
        var _ref5;
        return (_ref5 = properties[nom]) != null ? _ref5 : Data.initProperty(nom);
      };
      that.addType = function(nom, options) {
        var type;
        type = Data.initType(nom);
        types[nom] = type;
        return type;
      };
      that.getType = function(nom) {
        var _ref5;
        return (_ref5 = types[nom]) != null ? _ref5 : Data.initType(nom);
      };
      that.getItem = function(id) {
        var _ref5, _ref6;
        return (_ref5 = (_ref6 = spo[id]) != null ? _ref6.values : void 0) != null ? _ref5 : {};
      };
      that.getItems = function(ids) {
        if (!$.isArray(ids)) {
          return [that.getItem(ids)];
        }
        return $.map(ids, function(id, idx) {
          return that.getItem(id);
        });
      };
      that.fetchData = function(uri) {
        return $.ajax({
          url: uri,
          dataType: "json",
          success: function(data, textStatus) {
            return that.loadData(data);
          }
        });
      };
      that.removeItems = function(ids) {
        var id, id_list, indexRemove, indexRemoveFn, removeItem, removeValues, _i, _len;
        id_list = [];
        indexRemove = function(index, x, y, z) {
          var array, counts, hash, i, k, sum, v;
          hash = index[x];
          if (!(hash != null)) {
            return;
          }
          array = hash.values[y];
          counts = hash.counts[y];
          if (!(array != null) || !(counts != null)) {
            return;
          }
          counts[z] -= 1;
          if (counts[z] < 1) {
            i = $.inArray(z, array);
            if (i === 0) {
              array = array.slice(1, array.length);
            } else if (i === array.length - 1) {
              array = array.slice(0, i);
            } else if (i > 0) {
              array = array.slice(0, i).concat(array.slice(i + 1, array.length));
            }
            if (array.length > 0) {
              hash.values[y] = array;
            } else {
              delete hash.values[y];
            }
            delete counts[z];
            sum = 0;
            for (k in counts) {
              v = counts[k];
              sum += v;
            }
            if (sum === 0) {
              return delete index[x];
            }
          }
        };
        indexRemoveFn = function(s, p, o) {
          indexRemove(spo, s, p, o);
          return indexRemove(ops, o, p, s);
        };
        removeValues = function(id, p, list) {
          var o, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = list.length; _i < _len; _i++) {
            o = list[_i];
            _results.push(indexRemoveFn(id, p, o));
          }
          return _results;
        };
        removeItem = function(id, indexRemoveFn) {
          var entry, items, p, type;
          entry = that.getItem(id);
          type = entry.type;
          if ($.isArray(type)) {
            type = type[0];
          }
          for (p in entry) {
            items = entry[p];
            if (typeof p !== "string" || (p === "id" || p === "type")) {
              continue;
            }
            removeValues(id, p, items);
          }
          return removeValues(id, 'type', [type]);
        };
        for (_i = 0, _len = ids.length; _i < _len; _i++) {
          id = ids[_i];
          removeItem(id, indexRemoveFn);
          id_list.push(id);
          set.remove(id);
        }
        return that.events.onModelChange.fire(that, id_list);
      };
      that.updateItems = function(items) {
        var chunk_size, f, id_list, indexPutFn, indexRemove, indexRemoveFn, n, updateItem;
        id_list = [];
        indexRemove = function(index, x, y, z) {
          var array, counts, hash, i;
          hash = index[x];
          if (!(hash != null)) {
            return;
          }
          array = hash.values[y];
          counts = hash.counts[y];
          if (!(array != null) || !(counts != null)) {
            return;
          }
          counts[z] -= 1;
          if (counts[z] < 1) {
            i = $.inArray(z, array);
            if (i === 0) {
              array = array.slice(1, array.length);
            } else if (i === array.length - 1) {
              array = array.slice(0, i);
            } else if (i > 0) {
              array = array.slice(0, i).concat(array.slice(i + 1, array.length));
            }
            if (array.length > 0) {
              hash.values[y] = array;
            } else {
              delete hash.values[y];
            }
            return delete counts[z];
          }
        };
        indexPutFn = function(s, p, o) {
          indexPut(spo, s, p, o);
          return indexPut(ops, o, p, s);
        };
        indexRemoveFn = function(s, p, o) {
          indexRemove(spo, s, p, o);
          return indexRemove(ops, o, p, s);
        };
        updateItem = function(entry, indexPutFn, indexRemoveFn) {
          var changed, id, itemListIdentical, items, old_item, p, putValues, removeValues, s, type;
          id = entry.id;
          type = entry.type;
          changed = false;
          itemListIdentical = function(to, from) {
            var i, items_same, _ref5;
            items_same = true;
            if (to.length !== from.length) {
              return false;
            }
            for (i = 0, _ref5 = to.length; 0 <= _ref5 ? i < _ref5 : i > _ref5; 0 <= _ref5 ? i++ : i--) {
              if (to[i] !== from[i]) {
                items_same = false;
              }
            }
            return items_same;
          };
          removeValues = function(id, p, list) {
            var o, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = list.length; _i < _len; _i++) {
              o = list[_i];
              _results.push(indexRemoveFn(id, p, o));
            }
            return _results;
          };
          putValues = function(id, p, list) {
            var o, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = list.length; _i < _len; _i++) {
              o = list[_i];
              _results.push(indexPutFn(id, p, o));
            }
            return _results;
          };
          if ($.isArray(id)) {
            id = id[0];
          }
          if ($.isArray(type)) {
            type = type[0];
          }
          old_item = that.getItem(id);
          for (p in entry) {
            items = entry[p];
            if (typeof p !== "string" || (p === "id" || p === "type")) {
              continue;
            }
            if (!$.isArray(items)) {
              items = [items];
            }
            s = items.length;
            if (!(old_item[p] != null)) {
              putValues(id, p, items);
              changed = true;
            } else if (!itemListIdentical(items, old_item[p])) {
              changed = true;
              removeValues(id, p, old_item[p]);
              putValues(id, p, items);
            }
          }
          return changed;
        };
        that.events.onBeforeUpdating.fire(that);
        n = items.length;
        chunk_size = parseInt(n / 100, 10);
        if (chunk_size > 200) {
          chunk_size = 200;
        }
        if (chunk_size < 1) {
          chunk_size = 1;
        }
        f = function(start) {
          var end, entry, i;
          end = start + chunk_size;
          if (end > n) {
            end = n;
          }
          for (i = start; start <= end ? i < end : i > end; start <= end ? i++ : i--) {
            entry = items[i];
            if (typeof entry === "object" && updateItem(entry, indexPutFn, indexRemoveFn)) {
              id_list.push(entry.id);
            }
          }
          if (end < n) {
            return setTimeout(function() {
              return f(end);
            }, 0);
          } else {
            that.events.onAfterUpdating.fire(that);
            return that.events.onModelChange.fire(that, id_list);
          }
        };
        return f(0);
      };
      that.loadItems = function(items, endFn) {
        var chunk_size, f, id_list, indexFn, loadItem, n;
        id_list = [];
        indexFn = function(s, p, o) {
          indexPut(spo, s, p, o);
          return indexPut(ops, o, p, s);
        };
        loadItem = function(item, indexFN) {
          var id, p, type, v, vv, _results;
          if (!(item.id != null)) {
            throw MITHGrid.error("Item entry has no id: ", item);
          }
          if (!(item.type != null)) {
            throw MITHGrid.error("Item entry has no type: ", item);
          }
          id = item.id;
          type = item.type;
          if ($.isArray(id)) {
            id = id[0];
          }
          if ($.isArray(type)) {
            type = type[0];
          }
          set.add(id);
          id_list.push(id);
          indexFn(id, "type", type);
          indexFn(id, "id", id);
          _results = [];
          for (p in item) {
            v = item[p];
            if (typeof p !== "string") {
              continue;
            }
            _results.push((function() {
              var _i, _len, _results2;
              if (p !== "id" && p !== "type") {
                if ($.isArray(v)) {
                  _results2 = [];
                  for (_i = 0, _len = v.length; _i < _len; _i++) {
                    vv = v[_i];
                    _results2.push(indexFn(id, p, vv));
                  }
                  return _results2;
                } else if (v != null) {
                  return indexFn(id, p, v);
                }
              }
            })());
          }
          return _results;
        };
        that.events.onBeforeLoading.fire(that);
        n = items.length;
        if (endFn != null) {
          chunk_size = parseInt(n / 100, 10);
          if (chunk_size > 200) {
            chunk_size = 200;
          }
          if (chunk_size < 1) {
            chunk_size = 1;
          }
        } else {
          chunk_size = n;
        }
        f = function(start) {
          var end, entry, i;
          end = start + chunk_size;
          if (end > n) {
            end = n;
          }
          for (i = start; start <= end ? i < end : i > end; start <= end ? i++ : i--) {
            entry = items[i];
            if (typeof entry === "object") {
              loadItem(entry);
            }
          }
          if (end < n) {
            return setTimeout(function() {
              return f(end);
            }, 0);
          } else {
            return setTimeout(function() {
              that.events.onAfterLoading.fire(that);
              return setTimeout(function() {
                that.events.onModelChange.fire(that, id_list);
                if (endFn != null) {
                  return setTimeout(endFn, 0);
                }
              }, 0);
            }, 0);
          }
        };
        return f(0);
      };
      that.prepare = function(expressions) {
        var ex, parsed;
        parsed = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = expressions.length; _i < _len; _i++) {
            ex = expressions[_i];
            _results.push(MITHGrid.Expression.initParser().parse(ex));
          }
          return _results;
        })();
        return {
          evaluate: function(id) {
            var ex, values, _fn, _i, _len;
            values = [];
            _fn = function(ex) {
              var items;
              items = ex.evaluateOnItem(id, that);
              return values = values.concat(items.values.items());
            };
            for (_i = 0, _len = parsed.length; _i < _len; _i++) {
              ex = parsed[_i];
              _fn(ex);
            }
            return values;
          }
        };
      };
      that.getObjectsUnion = function(subjects, p, set, filter) {
        return getUnion(spo, subjects, p, set, filter);
      };
      that.getSubjectsUnion = function(objects, p, set, filter) {
        return getUnion(ops, objects, p, set, filter);
      };
      return that;
    };
    Data.initView = function(options) {
      var filterItems, set, that, _ref5, _ref6;
      that = MITHGrid.initView("MITHGrid.Data.initView", options);
      set = Data.initSet();
      filterItems = function(endFn) {
        var chunk_size, f, ids, n;
        set = Data.initSet();
        ids = that.dataStore.items();
        n = ids.length;
        if (n === 0) {
          endFn();
          return;
        }
        if (n > 200) {
          chunk_size = parseInt(n / 100, 10);
          if (chunk_size > 200) {
            chunk_size = 200;
          }
        } else {
          chunk_size = n;
        }
        if (chunk_size < 1) {
          chunk_size = 1;
        }
        f = function(start) {
          var end, free, i, id;
          end = start + chunk_size;
          if (end > n) {
            end = n;
          }
          for (i = start; start <= end ? i < end : i > end; start <= end ? i++ : i--) {
            id = ids[i];
            free = that.events.onFilterItem.fire(that.dataStore, id);
            if (free !== false) {
              set.add(id);
            }
          }
          if (end < n) {
            return setTimeout(function() {
              return f(end);
            }, 0);
          } else {
            that.items = set.items;
            that.size = set.size;
            that.contains = set.contains;
            if (endFn != null) {
              return setTimeout(endFn, 0);
            }
          }
        };
        return f(0);
      };
      that.registerFilter = function(ob) {
        that.events.onFilterItem.addListener(function(x, y) {
          return ob.eventFilterItem(x, y);
        });
        that.events.onModelChange.addListener(function(m, i) {
          return ob.eventModelChange(m, i);
        });
        return ob.events.onFilterChange.addListener(that.eventFilterChange);
      };
      that.registerPresentation = function(ob) {
        that.events.onModelChange.addListener(function(m, i) {
          return ob.eventModelChange(m, i);
        });
        return filterItems(function() {
          return ob.eventModelChange(that, that.items());
        });
      };
      that.items = set.items;
      that.size = set.size;
      that.contains = set.contains;
      if ((options != null ? (_ref5 = options.types) != null ? _ref5.length : void 0 : void 0) > 0) {
        (function(types) {
          return that.registerFilter({
            eventFilterItem: function(model, id) {
              var item, t, _i, _len;
              item = model.getItem(id);
              if (!(item.type != null)) {
                return false;
              }
              for (_i = 0, _len = types.length; _i < _len; _i++) {
                t = types[_i];
                if (__indexOf.call(item.type, t) >= 0) {
                  return;
                }
              }
              return false;
            },
            eventModelChange: function(x, y) {},
            events: {
              onFilterChange: {
                addListener: function(x) {}
              }
            }
          });
        })(options.types);
      }
      if ((options != null ? (_ref6 = options.filters) != null ? _ref6.length : void 0 : void 0) > 0) {
        (function(filters) {
          var ex, parsedFilters, parser;
          parser = MITHGrid.Expression.initParser();
          parsedFilters = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = filters.length; _i < _len; _i++) {
              ex = filters[_i];
              _results.push(parser.parse(ex));
            }
            return _results;
          })();
          return that.registerFilter({
            eventFilterItem: function(model, id) {
              var ex, v, values, _i, _j, _len, _len2;
              for (_i = 0, _len = parsedFilters.length; _i < _len; _i++) {
                ex = parsedFilters[_i];
                values = ex.evaluateOnItem(id, model);
                values = values.values.items();
                for (_j = 0, _len2 = values.length; _j < _len2; _j++) {
                  v = values[_j];
                  if (v !== "false") {
                    return;
                  }
                }
              }
              return false;
            },
            eventModelChange: function(x, y) {},
            events: {
              onFilterChange: {
                addListener: function(x) {}
              }
            }
          });
        })(options.filters);
      }
      if ((options != null ? options.collection : void 0) != null) {
        that.registerFilter({
          eventFilterItem: options.collection,
          eventModelChange: function(x, y) {},
          events: {
            onFilterChange: {
              addListener: function(x) {}
            }
          }
        });
      }
      that.eventModelChange = function(model, items) {
        var allowed_set;
        allowed_set = Data.initSet(that.items());
        return filterItems(function() {
          var changed_set, id, _i, _j, _len, _len2, _ref7;
          changed_set = Data.initSet();
          _ref7 = that.items();
          for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
            id = _ref7[_i];
            allowed_set.add(id);
          }
          for (_j = 0, _len2 = items.length; _j < _len2; _j++) {
            id = items[_j];
            if (allowed_set.contains(id)) {
              changed_set.add(id);
            }
          }
          if (changed_set.size() > 0) {
            return that.events.onModelChange.fire(that, changed_set.items());
          }
        });
      };
      that.eventFilterChange = that.eventModelChange;
      that.dataStore = options.dataStore;
      that.getItems = that.dataStore.getItems;
      that.getItem = that.dataStore.getItem;
      that.removeItems = that.dataStore.removeItems;
      that.fetchData = that.dataStore.fetchData;
      that.updateItems = that.dataStore.updateItems;
      that.loadItems = that.dataStore.loadItems;
      that.prepare = that.dataStore.prepare;
      that.addType = that.dataStore.addType;
      that.getType = that.dataStore.getType;
      that.addProperty = that.dataStore.addProperty;
      that.getProperty = that.dataStore.getProperty;
      that.getObjectsUnion = that.dataStore.getObjectsUnion;
      that.getSubjectsUnion = that.dataStore.getSubjectsUnion;
      that.dataStore.events.onModelChange.addListener(that.eventModelChange);
      return that;
    };
    Expression = MITHGrid.namespace("Expression");
    _operators = {
      "+": {
        argumentType: "number",
        valueType: "number",
        f: function(a, b) {
          return a + b;
        }
      },
      "-": {
        argumentType: "number",
        valueType: "number",
        f: function(a, b) {
          return a - b;
        }
      },
      "*": {
        argumentType: "number",
        valueType: "number",
        f: function(a, b) {
          return a * b;
        }
      },
      "/": {
        argumentType: "number",
        valueType: "number",
        f: function(a, b) {
          return a / b;
        }
      },
      "=": {
        valueType: "boolean",
        f: function(a, b) {
          return a === b;
        }
      },
      "<>": {
        valueType: "boolean",
        f: function(a, b) {
          return a !== b;
        }
      },
      "><": {
        valueType: "boolean",
        f: function(a, b) {
          return a !== b;
        }
      },
      "<": {
        valueType: "boolean",
        f: function(a, b) {
          return a < b;
        }
      },
      ">": {
        valueType: "boolean",
        f: function(a, b) {
          return a > b;
        }
      },
      "<=": {
        valueType: "boolean",
        f: function(a, b) {
          return a <= b;
        }
      },
      ">=": {
        valueType: "boolean",
        f: function(a, b) {
          return a >= b;
        }
      }
    };
    Expression.controls = {
      "if": {
        f: function(args, roots, rootValueTypes, defaultRootName, database) {
          var condition, conditionCollection;
          conditionCollection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database);
          condition = false;
          conditionCollection.forEachValue(function(v) {
            if (v) {
              condition = true;
              return true;
            } else {
              ;
            }
          });
          if (condition) {
            return args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
          } else {
            return args[2].evaluate(roots, rootValueTypes, defaultRootName);
          }
        }
      },
      "foreach": {
        f: function(args, roots, rootValueTypes, defaultRootName, database) {
          var collection, oldValue, oldValueType, results, valueType;
          collection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database);
          oldValue = roots.value;
          oldValueType = rootValueTypes.value;
          results = [];
          valueType = "text";
          rootValueTypes.value = collection.valueType;
          collection.forEachValue(function(element) {
            var collection2;
            roots.value = element;
            collection2 = args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
            valueType = collection2.valueType;
            return collection2.forEachValue(function(result) {
              return results.push(result);
            });
          });
          roots.value = oldValue;
          rootValueTypes.value = oldValueType;
          return Expression.initCollection(results, valueType);
        }
      },
      "default": {
        f: function(args, roots, rootValueTypes, defaultRootName, database) {
          var arg, collection, _i, _len;
          for (_i = 0, _len = args.length; _i < _len; _i++) {
            arg = args[_i];
            collection = arg.evaluate(roots, rootValueTypes, defaultRootName, database);
            if (collection.size() > 0) {
              return collection;
            }
          }
          return Expression.initCollection([], "text");
        }
      }
    };
    Expression.initExpression = function(rootNode) {
      var that;
      that = {};
      that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
        var collection;
        collection = rootNode.evaluate(roots, rootValueTypes, defaultRootName, database);
        return {
          values: collection.getSet(),
          valueType: collection.valueType,
          size: collection.size
        };
      };
      that.evaluateOnItem = function(itemID, database) {
        return this.evaluate({
          "value": itemID
        }, {
          "value": "item"
        }, "value", database);
      };
      that.evaluateSingle = function(roots, rootValueTypes, defaultRootName, database) {
        var collection, result;
        collection = rootNode.evaluate(roots, rootValueTypes, defaultRootName, database);
        result = {
          value: null,
          valueType: collection.valueType
        };
        collection.forEachValue(function(v) {
          result.value = v;
          return true;
        });
        return result;
      };
      that.isPath = rootNode.isPath;
      if (that.isPath) {
        that.getPath = function() {
          return rootNode;
        };
        that.testExists = function(roots, rootValueTypes, defaultRootName, database) {
          return rootNode.testExists(roots, rootValueTypes, defaultRootName, database);
        };
      } else {
        that.getPath = function() {
          return null;
        };
        that.testExists = function(roots, rootValueTypes, defaultRootName, database) {
          return that.evaluate(roots, rootValueTypes, defaultRootName, database).values.size() > 0;
        };
      }
      that.evaluateBackward = function(value, valueType, filter, database) {
        return rootNode.walkBackward([value], valueType, filter, database);
      };
      that.walkForward = function(values, valueType, database) {
        return rootNode.walkForward(values, valueType, database);
      };
      that.walkBackward = function(values, valueType, filter, database) {
        return rootNode.walkBackward(values, valueType, filter, database);
      };
      return that;
    };
    Expression.initCollection = function(values, valueType) {
      var that;
      that = {
        valueType: valueType
      };
      if (values instanceof Array) {
        that.forEachValue = function(f) {
          var v, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            v = values[_i];
            if (f(v) === true) {
              break;
            }
          }
          return _results;
        };
        that.getSet = function() {
          return MITHGrid.Data.initSet(values);
        };
        that.contains = function(v) {
          return __indexOf.call(values, v) >= 0;
        };
        that.size = function() {
          return values.length;
        };
      } else {
        that.forEachValue = values.visit;
        that.size = values.size;
        that.getSet = function() {
          return values;
        };
        that.contains = values.contains;
      }
      that.isPath = false;
      return that;
    };
    Expression.initConstant = function(value, valueType) {
      var that;
      that = {};
      that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
        return Expression.initCollection([value], valueType);
      };
      that.isPath = false;
      return that;
    };
    Expression.initOperator = function(operator, args) {
      var that, _args, _operator;
      that = {};
      _operator = operator;
      _args = args;
      that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
        var a, f, values, _i, _len;
        values = [];
        args = [];
        for (_i = 0, _len = _args.length; _i < _len; _i++) {
          a = _args[_i];
          args.push(a.evaluate(roots, rootValueTypes, defaultRootName, database));
        }
        operator = _operators[_operator];
        f = operator.f;
        if (operator.argumentType === "number") {
          args[0].forEachValue(function(v1) {
            if (typeof v1 !== "number") {
              v1 = parseFloat(v1);
            }
            return args[1].forEachValue(function(v2) {
              if (typeof v2 !== "number") {
                v2 = parseFloat(v2);
              }
              return values.push(f(v1, v2));
            });
          });
        } else {
          args[0].forEachValue(function(v1) {
            return args[1].forEachValue(function(v2) {
              return values.push(f(v1, v2));
            });
          });
        }
        return Expression.initCollection(values, operator.valueType);
      };
      that.isPath = false;
      return that;
    };
    Expression.initFunctionCall = function(name, args) {
      var that, _args;
      that = {};
      _args = args;
      that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
        var a, _i, _len, _ref5;
        args = [];
        for (_i = 0, _len = _args.length; _i < _len; _i++) {
          a = _args[_i];
          args.push(a.evaluate(roots, rootValueTypes, defaultRootName, database));
        }
        if (((_ref5 = Expression.functions[name]) != null ? _ref5.f : void 0) != null) {
          return Expression.functions[name].f(args);
        } else {
          throw new Error("No such function named " + _name);
        }
      };
      that.isPath = false;
      return that;
    };
    Expression.initControlCall = function(name, args) {
      var that;
      that = {};
      that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
        return Expression.controls[name].f(args, roots, rootValueTypes, defaultRootName, database);
      };
      that.isPath = false;
      return that;
    };
    Expression.initPath = function(property, forward) {
      var that, walkBackward, walkForward, _rootName, _segments;
      that = {};
      _rootName = null;
      _segments = [];
      walkForward = function(collection, database) {
        var a, backwardArraySegmentFn, forwardArraySegmentFn, i, segment, valueType, values, _ref5;
        forwardArraySegmentFn = function(segment) {
          var a;
          a = [];
          collection.forEachValue(function(v) {
            return database.getObjects(v, segment.property).visit(function(v2) {
              return a.push(v2);
            });
          });
          return a;
        };
        backwardArraySegmentFn = function(segment) {
          var a;
          a = [];
          collection.forEachValue(function(v) {
            return database.getSubjects(v, segment.property).visit(function(v2) {
              return a.push(v2);
            });
          });
          return a;
        };
        for (i = 0, _ref5 = _segments.length; 0 <= _ref5 ? i < _ref5 : i > _ref5; 0 <= _ref5 ? i++ : i--) {
          segment = _segments[i];
          if (segment.isMultiple) {
            a = [];
            if (segment.forward) {
              a = forwardArraySegmentFn(segment);
              property = database.getProperty(segment.property);
              valueType = property != null ? property.getValueType() : "text";
            } else {
              a = backwardArraySegmentFn(segment);
              valueType = "item";
            }
            collection = Expression.initCollection(a, valueType);
          } else {
            if (segment.forward) {
              values = database.getObjectsUnion(collection.getSet(), segment.property);
              property = database.getProperty(segment.property);
              valueType = property != null ? property.getValueType() : "text";
              collection = Expression.initCollection(values, valueType);
            } else {
              values = database.getSubjectsUnion(collection.getSet(), segment.property);
              collection = Expression.initCollection(values, "item");
            }
          }
        }
        return collection;
      };
      walkBackward = function(collection, filter, database) {
        var a, backwardArraySegmentFn, forwardArraySegmentFn, i, segment, valueType, values, _ref5;
        forwardArraySegmentFn = function(segment) {
          var a;
          a = [];
          collection.forEachValue(function(v) {
            return database.getSubjects(v, segment.property).visit(function(v2) {
              if (i > 0 || !(filter != null) || filter.contains(v2)) {
                return a.push(v2);
              }
            });
          });
          return a;
        };
        backwardArraySegmentFn = function(segment) {
          var a;
          a = [];
          collection.forEachValue(function(v) {
            return database.getObjects(v, segment.property).visit(function(v2) {
              if (i > 0 || !(filter != null) || filter.contains(v2)) {
                return a.push(v2);
              }
            });
          });
          return a;
        };
        if (filter instanceof Array) {
          filter = MITHGrid.Data.initSet(filter);
        }
        for (i = _ref5 = _segments.length - 1; _ref5 <= 0 ? i <= 0 : i >= 0; _ref5 <= 0 ? i++ : i--) {
          segment = _segments[i];
          if (segment.isMultiple) {
            a = [];
            if (segment.forward) {
              a = forwardArraySegmentFn(segment);
              property = database.getProperty(segment.property);
              valueType = property != null ? property.getValueType() : "text";
            } else {
              a = backwardArraySegmentFn(segment);
              valueType = "item";
            }
            collection = Expression.initCollection(a, valueType);
          } else if (segment.forward) {
            values = database.getSubjectsUnion(collection.getSet(), segment.property, null, i === 0 ? filter : null);
            collection = Expression.initCollection(values, "item");
          } else {
            values = database.getObjectsUnion(collection.getSet(), segment.property, null, i === 0 ? filter : null);
            property = database.getProperty(segment.property);
            valueType = property != null ? property.getValueType() : "text";
            collection = Expression.initCollection(values, valueType);
          }
        }
        return collection;
      };
      if (property != null) {
        _segments.push({
          property: property,
          forward: forward,
          isMultiple: false
        });
      }
      that.isPath = true;
      that.setRootName = function(rootName) {
        return _rootName = rootName;
      };
      that.appendSegment = function(property, hopOperator) {
        return _segments.push({
          property: property,
          forward: hopOperator[0] === ".",
          isMultiple: hopOperator.length > 1
        });
      };
      that.getSegment = function(index) {
        var segment;
        if (index < _segments.length) {
          segment = _segments[index];
          return {
            property: segment.property,
            forward: segment.forward,
            isMultiple: segment.isMultiple
          };
        } else {
          return null;
        }
      };
      that.getLastSegment = function() {
        return that.getSegment(_segments.length - 1);
      };
      that.getSegmentCount = function() {
        return _segments.length;
      };
      that.rangeBackward = function(from, to, filter, database) {
        var i, segment, set, valueType, _ref5;
        set = MITHGrid.Data.initSet();
        valueType = "item";
        if (_segments.length > 0) {
          segment = _segments[_segments.length - 1];
          if (segment.forward) {
            database.getSubjectsInRange(segment.property, from, to, false, set, _segments.length === 1 ? filter : null);
          } else {
            throw new Error("Last path of segment must be forward");
          }
          for (i = _ref5 = _segments.length - 2; _ref5 <= 0 ? i <= 0 : i >= 0; _ref5 <= 0 ? i++ : i--) {
            segment = _segments[i];
            if (segment.forward) {
              set = database.getSubjectsUnion(set, segment.property, null, i === 0 ? filter : null);
              valueType = "item";
            } else {
              set = database.getObjectsUnion(set, segment.property, null, i === 0 ? filter : null);
              property = database.getPropertysegment.property;
              valueType = property != null ? property.getValueType() : "text";
            }
          }
        }
        return {
          valueType: valueType,
          values: set,
          count: set.size()
        };
      };
      that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
        var collection, root, rootName, valueType;
        rootName = _rootName != null ? _rootName : defaultRootName;
        valueType = rootValueTypes[rootName] != null ? rootValueTypes[rootName] : "text";
        collection = null;
        if (roots[rootName] != null) {
          root = roots[rootName];
          if (root.isSet || root instanceof Array) {
            collection = Expression.initCollection(root, valueType);
          } else {
            collection = Expression.initCollection([root], valueType);
          }
          return walkForward(collection, database);
        } else {
          throw new Error("No such variable called " + rootName);
        }
      };
      that.testExists = function(roots, rootValueTypes, defaultRootName, database) {
        return that.evaluate(roots, rootValueTypes, defaultRootName, database).size() > 0;
      };
      that.evaluateBackward = function(value, valueType, filter, database) {
        var collection;
        collection = Expression.initCollection([value], valueType);
        return walkBackward(collection, filter, database);
      };
      that.walkForward = function(values, valueType, database) {
        return walkForward(Expression.initCollection(values, valueType), database);
      };
      that.walkBackward = function(values, valueType, filter, database) {
        return walkBackward(Expression.initCollection(values, valueType), filter, database);
      };
      return that;
    };
    Expression.initParser = function() {
      var internalParse, that;
      that = {};
      internalParse = function(scanner, several) {
        var Scanner, expressions, makePosition, next, parseExpression, parseExpressionList, parseFactor, parsePath, parseSubExpression, parseTerm, r, roots, token, _i, _len;
        token = scanner.token();
        Scanner = Expression.initScanner;
        next = function() {
          scanner.next();
          return token = scanner.token();
        };
        parseFactor = function() {};
        parseTerm = function() {
          var operator, term, _ref5;
          term = parseFactor();
          while ((token != null) && token.type === Scanner.OPERATOR && ((_ref5 = token.value) === "*" || _ref5 === "/")) {
            operator = token.value;
            next();
            term = Expression.initOperator(operator, [term, parseFactor()]);
          }
          return term;
        };
        parseSubExpression = function() {
          var operator, subExpression, _ref5;
          subExpression = parseTerm();
          while ((token != null) && token.type === Scanner.OPERATOR && ((_ref5 = token.value) === "+" || _ref5 === "-")) {
            operator = token.value;
            next();
            subExpression = Expression.initOperator(operator, [subExpression, parseTerm()]);
          }
          return subExpression;
        };
        parseExpression = function() {
          var expression, operator, _ref5;
          expression = parseSubExpression();
          while ((token != null) && token.type === Scanner.OPERATOR && ((_ref5 = token.value) === "=" || _ref5 === "<>" || _ref5 === "<" || _ref5 === ">" || _ref5 === "<=" || _ref5 === ">=")) {
            operator = token.value;
            next();
            expression = Expression.initOperator(operator, [expression, parseSubExpression()]);
          }
          return expression;
        };
        parseExpressionList = function() {
          var expressions;
          expressions = [parseExpression()];
          while ((token != null) && token.type === Scanner.DELIMITER && token.value === ",") {
            next();
            expressions.push(parseExpression());
          }
          return expressions;
        };
        makePosition = function() {
          if (token != null) {
            return token.start;
          } else {
            return scanner.index();
          }
        };
        parsePath = function() {
          var hopOperator, path;
          path = Expression.initPath();
          while ((token != null) && token.type === Scanner.PATH_OPERATOR) {
            hopOperator = token.value;
            next();
            if ((token != null) && token.type === Scanner.IDENTIFIER) {
              path.appendSegment(token.value, hopOperator);
              next();
            } else {
              throw new Error("Missing property ID at position " + makePosition());
            }
          }
          return path;
        };
        parseFactor = function() {
          var args, identifier, result;
          result = null;
          args = [];
          if (!(token != null)) {
            throw new Error("Missing factor at end of expression");
          }
          switch (token.type) {
            case Scanner.NUMBER:
              result = Expression.initConstant(token.value, "number");
              next();
              break;
            case Scanner.STRING:
              result = Expression.initConstant(token.value, "text");
              next();
              break;
            case Scanner.PATH_OPERATOR:
              result = parsePath();
              break;
            case Scanner.IDENTIFIER:
              identifier = token.value;
              next();
              if (Expression.controls[identifier] != null) {
                if ((token != null) && token.type === Scanner.DELIMITER && token.value === "(") {
                  next();
                  if ((token != null) && token.type === Scanner.DELIMITER && token.value === ")") {
                    args = [];
                  } else {
                    args = parseExpressionList();
                  }
                  result = Expression.initControlCall(identifier, args);
                  if ((token != null) && token.type === Scanner.DELIMITER && token.value === ")") {
                    next();
                  } else {
                    throw new Error("Missing ) to end " + identifier + " at position " + makePosition());
                  }
                } else {
                  throw new Error("Missing ( to start " + identifier + " at position " + makePosition());
                }
              } else {
                if ((token != null) && token.type === Scanner.DELIMITER && token.value === "(") {
                  next();
                  if ((token != null) && token.type === Scanner.DELIMITER && token.value === ")") {
                    args = [];
                  } else {
                    args = parseExpressionList();
                  }
                  result = Expression.initFunctionCall(identifier, args);
                  if ((token != null) && token.type === Scanner.DELIMITER && token.value === ")") {
                    next();
                  } else {
                    throw new Error("Missing ) after function call " + identifier + " at position " + makePosition());
                  }
                } else {
                  result = parsePath();
                  result.setRootName(identifier);
                }
              }
              break;
            case Scanner.DELIMITER:
              if (token.value === "(") {
                next();
                result = parseExpression();
                if ((token != null) && token.type === Scanner.DELIMITER && token.value === ")") {
                  next();
                } else {
                  throw new Error("Missing ) at position " + makePosition());
                }
              } else {
                throw new Error("Unexpected text " + token.value + " at position " + makePosition());
              }
              break;
            default:
              throw new Error("Unexpected text " + token.value + " at position " + makePosition());
          }
          return result;
        };
        if (several) {
          roots = parseExpressionList();
          expressions = [];
          for (_i = 0, _len = roots.length; _i < _len; _i++) {
            r = roots[_i];
            expressions.push(Expression.initExpression(r));
          }
          return expressions;
        } else {
          return [Expression.initExpression(parseExpression())];
        }
      };
      that.parse = function(s, startIndex, results) {
        var scanner;
                if (startIndex != null) {
          startIndex;
        } else {
          startIndex = 0;
        };
                if (results != null) {
          results;
        } else {
          results = {};
        };
        scanner = Expression.initScanner(s, startIndex);
        try {
          return internalParse(scanner, false)[0];
        } finally {
          results.index = scanner.token() != null ? scanner.token().start : scanner.index();
        }
      };
      return that;
    };
    Expression.initScanner = function(text, startIndex) {
      var isDigit, that, _index, _maxIndex, _text, _token;
      that = {};
      _text = text + " ";
      _maxIndex = text.length;
      _index = startIndex;
      _token = null;
      isDigit = function(c) {
        return "0123456789".indexOf(c) >= 0;
      };
      that.token = function() {
        return _token;
      };
      that.index = function() {
        return _index;
      };
      that.next = function() {
        var c, c1, c2, i;
        _token = null;
        while (_index < _maxIndex && " \t\r\n".indexOf(_text.charAt(_index)) >= 0) {
          _index += 1;
        }
        if (_index < _maxIndex) {
          c1 = _text.charAt(_index);
          c2 = _text.charAt(_index + 1);
          if (".!".indexOf(c1) >= 0) {
            if (c2 === "@") {
              _token = {
                type: Expression.initScanner.PATH_OPERATOR,
                value: c1 + c2,
                start: _index,
                end: _index + 2
              };
              return _index += 2;
            } else {
              _token = {
                type: Expression.initScanner.PATH_OPERATOR,
                value: c1,
                start: _index,
                end: _index + 1
              };
              return _index += 1;
            }
          } else if ("<>".indexOf(c1) >= 0) {
            if ((c2 === "=") || ("<>".indexOf(c2) >= 0 && c1 !== c2)) {
              _token = {
                type: Expression.initScanner.OPERATOR,
                value: c1 + c2,
                start: _index,
                end: _index + 2
              };
              return _index += 2;
            } else {
              _token = {
                type: Expression.initScanner.OPERATOR,
                value: c1,
                start: _index,
                end: _index + 1
              };
              return _index += 1;
            }
          } else if ("+-*/=".indexOf(c1) >= 0) {
            _token = {
              type: Expression.initScanner.OPERATOR,
              value: c1,
              start: _index,
              end: _index + 1
            };
            return _index += 1;
          } else if ("()".indexOf(c1) >= 0) {
            _token = {
              type: Expression.initScanner.DELIMITER,
              value: c1,
              start: _index,
              end: _index + 1
            };
            return _index += 1;
          } else if ("\"'".indexOf(c1) >= 0) {
            i = _index + 1;
            while (i < _maxIndex) {
              if (_text.charAt(i) === c1 && _text.charAt(i - 1) !== "\\") {
                break;
              }
              i += 1;
            }
            if (i < _maxIndex) {
              _token = {
                type: Expression.initScanner.STRING,
                value: _text.substring(_index + 1, i).replace(/\\'/g, "'").replace(/\\"/g, '"'),
                start: _index,
                end: i + 1
              };
              return _index = i + 1;
            } else {
              throw new Error("Unterminated string starting at " + String(_index));
            }
          } else if (isDigit(c1)) {
            i = _index;
            while (i < _maxIndex && isDigit(_text.charAt(i))) {
              i += 1;
            }
            if (i < _maxIndex && _text.charAt(i) === ".") {
              i += 1;
              while (i < _maxIndex && isDigit(_text.charAt(i))) {
                i += 1;
              }
            }
            _token = {
              type: Expression.initScanner.NUMBER,
              value: parseFloat(_text.substring(_index, i)),
              start: _index,
              end: i
            };
            return _index = i;
          } else {
            i = _index;
            while (i < _maxIndex) {
              c = _text.charAt(i);
              if (!("(),.!@ \t".indexOf(c) < 0)) {
                break;
              }
              i += 1;
            }
            _token = {
              type: Expression.initScanner.IDENTIFIER,
              value: _text.substring(_index, i),
              start: _index,
              end: i
            };
            return _index = i;
          }
        }
      };
      that.next();
      return that;
    };
    Expression.initScanner.DELIMITER = 0;
    Expression.initScanner.NUMBER = 1;
    Expression.initScanner.STRING = 2;
    Expression.initScanner.IDENTIFIER = 3;
    Expression.initScanner.OPERATOR = 4;
    Expression.initScanner.PATH_OPERATOR = 5;
    Expression.functions = {};
    Expression.FunctionUtilities = {};
    Expression.FunctionUtilities.registerSimpleMappingFunction = function(name, f, valueType) {
      return Expression.functions[name] = {
        f: function(args) {
          var arg, evalArg, set, _i, _len;
          set = MITHGrid.Data.initSet();
          evalArg = function(arg) {
            return arg.forEachValue(function(v) {
              var v2;
              v2 = f(v);
              if (v2 != null) {
                return set.add(v2);
              }
            });
          };
          for (_i = 0, _len = args.length; _i < _len; _i++) {
            arg = args[_i];
            evalArg(arg);
          }
          return Expression.initCollection(set, valueType);
        }
      };
    };
    MITHGrid.namespace('Presentation');
    MITHGrid.Presentation.initPresentation = function(type, container, options) {
      var lenses, renderings, that;
      that = {};
      that = MITHGrid.initView("MITHGrid.Presentation." + type, container, options);
      renderings = {};
      lenses = that.options.lenses;
      options = that.options;
      $(container).empty();
      that.getLens = function(item) {
        if ((item.type != null) && (item.type[0] != null) && (lenses[item.type[0]] != null)) {
          return {
            render: lenses[item.type[0]]
          };
        }
      };
      that.renderingFor = function(id) {
        return renderings[id];
      };
      that.renderItems = function(model, items) {
        var f, n;
        n = items.length;
        f = function(start) {
          var end, hasItem, i, id, lens, _base;
          if (start < n) {
            end = n;
            if (n > 200) {
              end = start + parseInt(Math.sqrt(n), 10) + 1;
              if (end > n) {
                end = n;
              }
            }
            for (i = start; start <= end ? i < end : i > end; start <= end ? i++ : i--) {
              id = items[i];
              hasItem = model.contains(id);
              if (!hasItem) {
                if (renderings[id] != null) {
                  if (typeof (_base = renderings[id]).remove === "function") {
                    _base.remove();
                  }
                  delete renderings[id];
                }
              } else if (renderings[id] != null) {
                renderings[id].update(model.getItem(id));
              } else {
                lens = that.getLens(model.getItem(id));
                if (lens != null) {
                  renderings[id] = lens.render(container, that, model, id);
                }
              }
            }
            return setTimeout(function() {
              return f(end);
            }, 0);
          } else {
            return that.finishDisplayUpdate();
          }
        };
        that.startDisplayUpdate();
        return f(0);
      };
      that.eventModelChange = that.renderItems;
      that.startDisplayUpdate = function() {};
      that.finishDisplayUpdate = function() {};
      that.selfRender = function() {
        return that.renderItems(that.dataView, that.dataView.items());
      };
      that.dataView = that.options.dataView;
      that.dataView.registerPresentation(that);
      return that;
    };
    Facet = MITHGrid.namespace('Facet');
    Facet.initFacet = function(klass, container, options) {
      var that;
      that = MITHGrid.initView(klass, container, options);
      options = that.options;
      that.selfRender = function() {};
      that.eventFilterItem = function(model, itemId) {
        return false;
      };
      that.eventModelChange = function(model, itemList) {};
      that.constructFacetFrame = function(container, options) {
        var dom;
        dom = {};
        $(container).addClass("mithgrid-facet");
        dom.header = $("<div class='header' />");
        if (options.onClearAllSelections != null) {
          dom.controls = $("<div class='control' title='Clear Selection'>");
          dom.counter = $("<span class='counter'></span>");
          dom.controls.append(dom.counter);
          dom.header.append(dom.controls);
        }
        dom.title = $("<span class='title'></span>");
        dom.title.text(options.facetLabel || "");
        dom.header.append(dom.title);
        dom.bodyFrame = $("<div class='body-frame'></div>");
        dom.body = $("<div class='body'></div>");
        dom.bodyFrame.append(dom.body);
        $(container).append(dom.header);
        $(container).append(dom.bodyFrame);
        if (options.onClearAllSelections != null) {
          dom.controls.bind("click", options.onClearAllSelections);
        }
        dom.setSelectionCount = function(count) {
          dom.counter.innerHTML = count;
          if (count > 0) {
            return dom.counter.show();
          } else {
            return dom.counter.hide();
          }
        };
        return dom;
      };
      that.events || (that.events = {});
      that.events.onFilterChange = fluid.event.getEventFirer();
      options.dataView.registerFilter(that);
      return that;
    };
    Facet.namespace('TextSearch');
    Facet.TextSearch.initFacet = function(container, options) {
      var ex, parsed, that;
      that = Facet.initFacet("MITHGrid.Facet.TextSearch", container, options);
      options = that.options;
      if (options.expressions != null) {
        if (!$.isArray(options.expressions)) {
          options.expressions = [options.expressions];
          parsed = (function() {
            var _i, _len, _ref5, _results;
            _ref5 = options.expressions;
            _results = [];
            for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
              ex = _ref5[_i];
              _results.push(MITHGrid.Expression.initParser().parse(ex));
            }
            return _results;
          })();
        }
      }
      that.eventFilterItem = function(dataSource, id) {
        var ex, items, v, _i, _j, _len, _len2, _ref5;
        if ((that.text != null) && (options.expressions != null)) {
          for (_i = 0, _len = parsed.length; _i < _len; _i++) {
            ex = parsed[_i];
            items = ex.evaluateOnItem(id, dataSource);
            _ref5 = items.values.items();
            for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
              v = _ref5[_j];
              if (v.toLowerCase().indexOf(that.text) >= 0) {
                return;
              }
            }
          }
        }
        return false;
      };
      that.eventModelChange = function(dataView, itemList) {};
      that.selfRender = function() {
        var dom, inputElement;
        dom = that.constructFacetFrame(container, null, {
          facetLabel: options.facetLabel
        });
        $(container).addClass("mithgrid-facet-textsearch");
        inputElement = $("<input type='text'>");
        dom.body.append(inputElement);
        return inputElement.keyup(function() {
          that.text = $.trim(inputElement.val().toLowerCase());
          return that.events.onFilterChange.fire();
        });
      };
      return that;
    };
    Facet.namespace('List');
    Facet.List.initFacet = function(container, options) {
      var ex, parsed, that;
      that = Facet.initFacet("MITHGrid.Facet.List", container, options);
      options = that.options;
      that.selections = [];
      if (options.expressions != null) {
        if (!$.isArray(options.expressions)) {
          options.expressions = [options.expressions];
          parsed = (function() {
            var _i, _len, _ref5, _results;
            _ref5 = options.expressions;
            _results = [];
            for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
              ex = _ref5[_i];
              _results.push(MITHGrid.Expression.initParser().parse(ex));
            }
            return _results;
          })();
        }
      }
      that.eventFilterItem = function(dataSource, id) {
        var ex, items, v, _i, _j, _len, _len2, _ref5, _results;
        if ((that.text != null) && (options.expressions != null)) {
          _results = [];
          for (_i = 0, _len = parsed.length; _i < _len; _i++) {
            ex = parsed[_i];
            items = ex.evaluateOnItem(id, dataSource);
            _ref5 = items.values.items();
            for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
              v = _ref5[_j];
              if (__indexOf.call(that.selections, v) >= 0) {
                return;
              }
            }
          }
          return _results;
        }
      };
      that.selfRender = function() {
        var dom;
        return dom = that.constructFacetFrame(container, null, {
          facetLabel: options.facetLabel,
          resizable: true
        });
      };
      return that;
    };
    Application = MITHGrid.namespace('Application');
    Application.initApp = function(klass, container, options) {
      var config, onReady, prop, propOptions, store, storeName, that, type, typeInfo, view, viewConfig, viewName, viewOptions, _ref5, _ref6, _ref7, _ref8;
      that = MITHGrid.initView(klass, container, options);
      onReady = [];
      that.presentation = {};
      that.facet = {};
      that.dataStore = {};
      that.dataView = {};
      options = that.options;
      that.ready = function(fn) {
        return onReady.push(fn);
      };
      if ((options != null ? options.dataStores : void 0) != null) {
        _ref5 = options.dataStores;
        for (storeName in _ref5) {
          config = _ref5[storeName];
          if (!(that.dataStore[storeName] != null)) {
            store = MITHGrid.Data.initStore();
            that.dataStore[storeName] = store;
            store.addType('Item');
            store.addProperty('label', {
              valueType: 'text'
            });
            store.addProperty('type', {
              valueType: 'text'
            });
            store.addProperty('id', {
              valueType: 'text'
            });
          } else {
            store = that.dataStore[storeName];
          }
          if ((config != null ? config.types : void 0) != null) {
            _ref6 = config.types;
            for (type in _ref6) {
              typeInfo = _ref6[type];
              store.addType(type);
            }
          }
          if ((config != null ? config.properties : void 0) != null) {
            _ref7 = config.properties;
            for (prop in _ref7) {
              propOptions = _ref7[prop];
              store.addProperty(prop, propOptions);
            }
          }
        }
      }
      if ((options != null ? options.dataViews : void 0) != null) {
        _ref8 = options.dataViews;
        for (viewName in _ref8) {
          viewConfig = _ref8[viewName];
          viewOptions = {
            dataStore: that.dataStore[viewConfig.dataStore],
            label: viewName
          };
          if (!(that.dataView[viewName] != null)) {
            if (viewConfig.collection != null) {
              viewOptions.collection = viewConfig.collection;
            }
            if (viewConfig.types != null) {
              viewOptions.types = viewConfig.types;
            }
            if (viewConfig.filters != null) {
              viewOptions.filters = viewConfig.filters;
            }
            view = MITHGrid.Data.initView(viewOptions);
            that.dataView[viewName] = view;
          }
        }
      }
      if ((options != null ? options.viewSetup : void 0) != null) {
        if ($.isFunction(options.viewSetup)) {
          that.ready(function() {
            return options.viewSetup($(container));
          });
        } else {
          that.ready(function() {
            return $(container).append(options.viewSetup);
          });
        }
      }
      if ((options != null ? options.facets : void 0) != null) {
        that.ready(function() {
          var fName, facet, fconfig, fcontainer, foptions, _ref9, _results;
          _ref9 = options.facets;
          _results = [];
          for (fName in _ref9) {
            fconfig = _ref9[fName];
            foptions = $.extend(true, {}, fconfig);
            fcontainer = $(container).find(fconfig.container);
            if ($.isArray(fcontainer)) {
              fcontainer = fcontainer[0];
            }
            foptions.dataView = that.dataView[fconfig.dataView];
            foptions.application = that;
            facet = fconfig.type.initFacet(fcontainer, foptions);
            that.facet[fName] = facet;
            _results.push(facet.selfRender());
          }
          return _results;
        });
      }
      if ((options != null ? options.presentations : void 0) != null) {
        that.ready(function() {
          var pName, pconfig, pcontainer, poptions, presentation, _ref9, _results;
          _ref9 = options.presentations;
          _results = [];
          for (pName in _ref9) {
            pconfig = _ref9[pName];
            poptions = $.extend(true, {}, pconfig);
            pcontainer = $(container).find(poptions.container);
            if ($.isArray(pcontainer)) {
              pcontainer = pcontainer[0];
            }
            poptions.dataView = that.dataView[pconfig.dataView];
            poptions.application = that;
            presentation = pconfig.type.initPresentation(pcontainer, poptions);
            that.presentation[pName] = presentation;
            _results.push(presentation.selfRender());
          }
          return _results;
        });
      }
      if ((options != null ? options.plugins : void 0) != null) {
        that.ready(function() {
          var pconfig, pcontainer, plugin, pname, prconfig, presentation, prop, propOptions, proptions, type, typeInfo, _i, _len, _ref9, _results;
          _ref9 = options.plugins;
          _results = [];
          for (_i = 0, _len = _ref9.length; _i < _len; _i++) {
            pconfig = _ref9[_i];
            plugin = pconfig.type.initPlugin(pconfig);
            _results.push((function() {
              var _ref10, _ref11, _ref12, _results2;
              if (plugin != null) {
                if ((pconfig != null ? pconfig.dataView : void 0) != null) {
                  plugin.dataView = that.dataView[pconfig.dataView];
                  _ref10 = plugin.getTypes();
                  for (type in _ref10) {
                    typeInfo = _ref10[type];
                    plugin.dataView.addType(type);
                  }
                  _ref11 = plugin.getProperties();
                  for (prop in _ref11) {
                    propOptions = _ref11[prop];
                    plugin.dataView.addProperty(prop, propOptions);
                  }
                }
                _ref12 = plugin.getPresentations();
                _results2 = [];
                for (pname in _ref12) {
                  prconfig = _ref12[pname];
                  proptions = $.extend(true, {}, prconfig.options);
                  pcontainer = $(container).find(prconfig.container);
                  if ($.isArray(pcontainer)) {
                    pcontainer = pcontainer[0];
                  }
                  if ((prconfig != null ? prconfig.lenses : void 0) != null) {
                    proptions.lenses = prconfig.lenses;
                  }
                  if (prconfig.dataView != null) {
                    proptions.dataView = that.dataView[prconfig.dataView];
                  } else if (pconfig.dataView != null) {
                    proptions.dataView = that.dataView[pconfig.dataView];
                  }
                  proptions.application = that;
                  presentation = prconfig.type.initPresentation(pcontainer, proptions);
                  plugin.presentation[pname] = presentation;
                  _results2.push(presentation.selfRender());
                }
                return _results2;
              }
            })());
          }
          return _results;
        });
      }
      that.run = function() {
        return $(document).ready(function() {
          var fn, _i, _len;
          for (_i = 0, _len = onReady.length; _i < _len; _i++) {
            fn = onReady[_i];
            fn();
          }
          onReady = [];
          return that.ready = function(fn) {
            return setTimeout(fn, 0);
          };
        });
      };
      return that;
    };
    MITHGrid.namespace("Plugin");
    /*
    	 * This is the base of a plugin, which can package together various things that augment
    	 * an application.
    	 *
         *
         *  MITHGrid.Plugin.MyPlugin = function(options) {
         *    var that = MITHGrid.Plugin.initPlugin('MyPlugin', options, { ... })
         *  };
         *
         *  var myApp = MITHGrid.Application({
         *    plugins: [ { name: 'MyPlugin', ... } ]
         *  });
    	*/
    return MITHGrid.Plugin.initPlugin = function(klass, options) {
      var readyFns, that;
      that = {
        options: options,
        presentation: {}
      };
      readyFns = [];
      that.getTypes = function() {
        if ((options != null ? options.types : void 0) != null) {
          return options.types;
        } else {
          return [];
        }
      };
      that.getProperties = function() {
        if ((options != null ? options.properties : void 0) != null) {
          return options.properties;
        } else {
          return [];
        }
      };
      that.getPresentations = function() {
        if ((options != null ? options.presentations : void 0) != null) {
          return options.presentations;
        } else {
          return [];
        }
      };
      that.ready = readyFns.push;
      that.eventReady = function(app) {
        var fn, _i, _len;
        for (_i = 0, _len = readyFns.length; _i < _len; _i++) {
          fn = readyFns[_i];
          fn(app);
        }
        readyFns = [];
        return that.ready = function(fn) {
          return fn(app);
        };
      };
      return that;
    };
  })(jQuery, MITHGrid);
  MITHGrid.defaults("MITHGrid.Data.initStore", {
    events: {
      onModelChange: null,
      onBeforeLoading: null,
      onAfterLoading: null,
      onBeforeUpdating: null,
      onAfterUpdating: null
    }
  });
  MITHGrid.defaults("MITHGrid.Data.initView", {
    events: {
      onModelChange: null,
      onFilterItem: "preventable"
    }
  });
  MITHGrid.defaults("MITHGrid.Facet", {});
  MITHGrid.defaults("MITHGrid.Facet.TextSearch", {
    facetLabel: "Search",
    expressions: [".label"]
  });
}).call(this);
