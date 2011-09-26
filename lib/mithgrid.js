/*
 * mithgrid JavaScript Library v0.0.1
 *
 * Date: Fri Sep 2 08:57:44 2011 -0400
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
 */

var MITHGrid = MITHGrid || {};
var fluid = fluid || {};
var jQuery = jQuery || {};
(function($, MITHGrid) {
	if (window.console !== undefined && window.console.log !== undefined) {
        MITHGrid.debug = window.console.log;
    }
    else {
        MITHGrid.debug = function() {};
    }

	MITHGrid.error = function() {
		MITHGrid.debug.call({}, arguments);
		return { 'arguments': arguments };
	};

    var genericNamespacer;

	genericNamespacer = function(base, nom) {
        if (base[nom] === undefined) {
            base[nom] = {
				namespace: function(nom2) {
					return genericNamespacer(base[nom], nom2);
				},
				debug: MITHGrid.debug
			};
        }
        return base[nom];
    };

    MITHGrid.namespace = function(nom) {
        return genericNamespacer(MITHGrid, nom);
    };
}(jQuery, MITHGrid));(function($, MITHGrid) {
	var Data = MITHGrid.namespace('Data');

    Data.initSet = function(values) {
        var that = {},
        items = {},
        count = 0,
        recalc_items = true,
        items_list = [];

        that.isSet = true;

        that.items = function() {
			var i;
            if (recalc_items) {
                items_list = [];
                for (i in items) {
                    if (typeof(i) === "string" && items[i] === true) {
                        items_list.push(i);
                    }
                }
            }
            return items_list;
        };

        that.add = function(item) {
            if (items[item] === undefined) {
                items[item] = true;
                recalc_items = true;
                count += 1;
            }
        };

        that.remove = function(item) {
            if (items[item] !== undefined) {
                delete items[item];
                recalc_items = true;
                count -= 1;
            }
        };

        that.visit = function(fn) {
            var o;
            for (o in items) {
                if (fn(o) === true) {
                    break;
                }
            }
        };

        that.contains = function(o) {
            return (items[o] !== undefined);
        };

        that.size = function() {
            if (recalc_items) {
                return that.items().length;
            }
            else {
                return items_list.length;
            }
        };

        if (values instanceof Array) {
            $(values).each(function(idx, i) {
                that.add(i);
            });
        }

        return that;
    };

    Data.initType = function(t) {
        var that = {};

        that.name = t;
        that.custom = {};

        return that;
    };

    Data.initProperty = function(p) {
        var that = {};

        that.name = p;

        that.getValueType = function() {
            return that.valueType || 'text';
        };

        return that;
    };

    Data.initStore = function(options) {
        var that,
        prop,
        quiesc_events = false,
        set = Data.initSet(),
        types = {},
        properties = {},
        spo = {},
        ops = {},
		indexPut = function(index, x, y, z) {
            var hash = index[x],
            array,
            counts,
            i,
            n;

            if (!hash) {
                hash = {
                    values: {},
                    counts: {}
                };
                index[x] = hash;
            }

            array = hash.values[y];
            counts = hash.counts[y];

            if (!array) {
                array = [];
                hash.values[y] = array;
            }
            if (!counts) {
                counts = {};
                hash.counts[y] = counts;
            }
            else {
                if ($.inArray(z, array) !== -1) {
                    counts[z] += 1;
                    return;
                }
            }
            array.push(z);
            counts[z] = 1;
        },
		indexFillSet = function(index, x, y, set, filter) {
            var hash = index[x],
            array,
            i,
            n,
            z;
            if (hash) {
                array = hash.values[y];
                if (array) {
                    if (filter) {
                        for (i = 0, n = array.length; i < n; i += 1) {
                            z = array[i];
                            if (filter.contains(z)) {
                                set.add(z);
                            }
                        }
                    }
                    else {
                        for (i = 0, n = array.length; i < n; i += 1) {
                            set.add(array[i]);
                        }
                    }
                }
            }
        },
		getUnion = function(index, xSet, y, set, filter) {
            if (!set) {
                set = Data.initSet();
            }

            xSet.visit(function(x) {
                indexFillSet(index, x, y, set, filter);
            });
            return set;
        };

		options = options || {};

        that = fluid.initView("MITHGrid.Data.initStore", $(window), options);

        that.items = set.items;

		that.contains = set.contains;

        that.addProperty = function(nom, options) {
            var prop = Data.initProperty(nom);
			if( options !== undefined && options.valueType !== undefined ) {
				prop.valueType = options.valueType;
			}
            properties[nom] = prop;
        };

		that.getProperty = function(nom) {
			if(properties[nom] === undefined) {
				return Data.initProperty(nom);
			}
			else {
				return properties[nom];
			}
		};

        that.addType = function(nom, options) {
            var type = Data.initType(nom);
            types[nom] = type;
        };

		that.getType = function(nom) {
			if(types[nom] === undefined) {
				return Data.initType(nom);
			}
			else {
				return types[nom];
			}
		};

        that.getItem = function(id) {
            if (spo[id] !== undefined) { //id in that.spo) {
                return spo[id].values;
            }
            return {};
        };

        that.getItems = function(ids) {
            if (!$.isArray(ids)) {
                return [that.getItem(ids)];
            }

            return $.map(ids,
            function(id, idx) {
                return that.getItem(id);
            });
        };

        that.fetchData = function(uri) {
            $.ajax({
                url: uri,
                dataType: "json",
                success: function(data, textStatus) {
                    that.loadData(data);
                }
            });
        };

        that.updateItems = function(items) {
            var indexTriple,
            n,
            chunk_size,
            f,
            id_list = [],
            entry,
			indexRemove = function(index, x, y, z) {
                var hash = index[x],
                array,
                counts,
                i,
                n;

                if (!hash) {
                    return;
                    // nothing to remove
                    //hash = { values: { }, counts: { }};
                    //index[x] = hash;
                }

                array = hash.values[y];
                counts = hash.counts[y];
                if (!array) {
                    return;
                    // nothing to remove
                    //		array = new Array();
                    //		hash.values[y] = array;
                }
                if (!counts) {
                    return;
                    // nothing to remove
                    //		counts = { };
                    //		hash.counts[y] = counts;
                }
                // we need to remove the old z values
                counts[z] -= 1;
                if (counts[z] < 1) {
                    i = $.inArray(z, array);
                    if (i === 0) {
                        array = array.slice(1);
                    }
                    else if (i === array.length - 1) {
                        array = array.slice(0, i);
                    }
                    else if ( i > 0 ) {
                        array = array.slice(0, i).concat(array.slice(i + 1));
                    }
                    hash.values[y] = array;
                }
            },
			indexPutFn = function(s, p, o) {
                indexPut(spo, s, p, o);
                indexPut(ops, o, p, s);
            },
            indexRemoveFn = function(s, p, o) {
                indexRemove(spo, s, p, o);
                indexRemove(ops, o, p, s);
            },
            updateItem = function(entry, indexPutFn, indexRemoveFn) {
                // we only update things that are different from the old_item
                // we also only update properties that are in the new item
                // if anything is changed, we return true
                //   otherwise, we return false
                var old_item,
				p,
				items,
				s,
                id = entry.id,
                type = entry.type,
                changed = false,
				itemListIdentical = function(to, from) {
				    var items_same = true;
				    if (to.length !== from.length) {
				        return false;
				    }
				    $.each(to,
				    function(idx, i) {
				        if (i !== from[idx]) {
				            items_same = false;
				        }
				    });
				    return items_same;
				},
				removeValues = function(id, p, list) {
					$.each(list, function(idx, o) {
						indexRemoveFn(id, p, o);
					});
				},
				putValues = function(id, p, list) {
					$.each(list, function(idx, o) {
						indexPutFn(id, p, o);
					});
				};
				
				if ($.isArray(id)) { id = id[0]; }
                if ($.isArray(type)) { type = type[0]; }

                old_item = that.getItem(id);

                for (p in entry) {
                    if (typeof(p) !== "string" || p === "id" || p === "type") {
                        continue;
                    }
                    // if entry[p] and old_item[p] have the same members in the same order, then
                    // we do nothing
                    items = entry[p];
                    if (!$.isArray(items)) {
                        items = [items];
                    }
                    s = items.length;
                    if (old_item[p] === undefined) {
						putValues(id, p, items);
						changed = true;
					}
					else if(!itemListIdentical(items, old_item[p])) {
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
			    var end,
			    i;

			    end = start + chunk_size;
			    if (end > n) {
			        end = n;
			    }

			    for (i = start; i < end; i += 1) {
			        entry = items[i];
			        if (typeof(entry) === "object") {
			            if (updateItem(entry, indexPutFn, indexRemoveFn)) {
			                id_list.push(entry.id);
			            }
			        }
			    }

			    if (end < n) {
			        setTimeout(function() {
			            f(end);
			        },
			        0);
			    }
			    else {
			       // setTimeout(function() {
			            that.events.onAfterUpdating.fire(that);
			   //         setTimeout(function() {
			                that.events.onModelChange.fire(that, id_list);
			 //           },
			 //           0);
		//	        },
		//	        0);
			    }
			};
			f(0);
        };

        that.loadItems = function(items, endFn) {
            var indexTriple,
            entry,
            n,
			chunk_size,
            id_list = [],
            f,
			indexFn = function(s, p, o) {
                indexPut(spo, s, p, o);
                indexPut(ops, o, p, s);
            },
            loadItem = function(item, indexFN) {
                var id,
                type,
                p,
                i,
				v,
                n;

                if (item.id === undefined) {
                    throw MITHGrid.error("Item entry has no id: ", item);
                }
                if (item.type === undefined) {
                    throw MITHGrid.error("Item entry has no type: ", item);
                }

                id = item.id;
                type = item.type;

                if ($.isArray(id)) { id = id[0]; }
                if ($.isArray(type)) { type = type[0]; }

                set.add(id);
                id_list.push(id);

                indexFn(id, "type", type);
                indexFn(id, "id", id);

                for (p in item) {
                    if (typeof(p) !== "string") {
                        continue;
                    }

                    if (p !== "id" && p !== "type") {
                        v = item[p];
                        if ($.isArray(v)) {
                            for (i = 0, n = v.length; i < n; i += 1) {
                                indexFn(id, p, v[i]);
                            }
                        }
                        else if (v !== undefined && v !== null) {
                            indexFn(id, p, v);
                        }
                    }
                }
            };

            that.events.onBeforeLoading.fire(that);
			n = items.length;
			if ($.isFunction(endFn)) {
			    chunk_size = parseInt(n / 100, 10);
			    if (chunk_size > 200) {
			        chunk_size = 200;
			    }
			    if (chunk_size < 1) {
			        chunk_size = 1;
			    }
			}
			 else {
			    chunk_size = n;
			}
			f = function(start) {
			    var end,
			    i;

			    end = start + chunk_size;
			    if (end > n) {
			        end = n;
			    }

			    for (i = start; i < end; i += 1) {
			        entry = items[i];
			        if (typeof(entry) === "object") {
			            loadItem(entry);
			        }
			    }

			    if (end < n) {
			        setTimeout(function() {
			            f(end);
			        },
			        0);
			    }
			    else {
			        setTimeout(function() {
			            that.events.onAfterLoading.fire(that);
			            setTimeout(function() {
			                that.events.onModelChange.fire(that, id_list);
			                if ($.isFunction(endFn)) {
			                    endFn();
			                }
			            },
			            0);
			        },
			        0);
			    }
			};
			f(0);
        };

		that.prepare = function(expressions) {
		    var parsed = $.map(expressions,
		    function(ex) {
		        return MITHGrid.Expression.initParser().parse(ex);
		    });

			return {
			    evaluate: function(id) {
					var values = [];
					$.each(parsed,
					function(idx, ex) {
						var items = ex.evaluateOnItem(id, that);
						values = values.concat(items.values.items());
					});
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
        var that,
        set = Data.initSet(),
		filterItems = function(endFn) {
            var id,
            fres,
            ids,
            n,
            chunk_size,
            f;

            set = Data.initSet();
           
            ids = that.dataStore.items();
            n = ids.length;
            if (n === 0) {
                endFn();
                return;
            }
            chunk_size = parseInt(n / 100, 10);
            if (chunk_size > 200) {
                chunk_size = 200;
            }
            if (chunk_size < 1) {
                chunk_size = 1;
            }

            f = function(start) {
                var i,
				free,
                end;
                end = start + chunk_size;
                if (end > n) {
                    end = n;
                }
                for (i = start; i < end; i += 1) {
                    id = ids[i];
                    free = that.events.onFilterItem.fire(that.dataStore, id);
                    if (free !== false) {
                        set.add(id);
                    }
                }
                if (end < n) {
                    setTimeout(function() {
                        f(end);
                    },
                    0);
                }
                else {
					that.items = set.items;
			        that.size = set.size;
					that.contains = set.contains;
                    if (endFn) {
                        setTimeout(endFn, 0);
                    }
                }
            };
            f(0);
        };

        that = fluid.initView("MITHGrid.Data.initView", $(window), options);

        that.registerFilter = function(ob) {
            that.events.onFilterItem.addListener(function(x, y) {
                return ob.eventFilterItem(x, y);
            });
            that.events.onModelChange.addListener(function(m, i) {
                ob.eventModelChange(m, i);
            });
            ob.events.onFilterChange.addListener(that.eventFilterChange);
        };

        that.registerPresentation = function(ob) {
            that.events.onModelChange.addListener(function(m, i) {
                ob.eventModelChange(m, i);
            });
            filterItems(function() {
                ob.eventModelChange(that, that.items());
            });
        };

        that.items = set.items;
        that.size = set.size;
		that.contains = set.contains;

		if(options.types !== undefined && options.types.length > 0) {
			(function(types) {
				var n = types.length;
				that.registerFilter({
					eventFilterItem: function(model, id) {
						var item = model.getItem(id), i;

						if(item.type === undefined) {
							return false;
						}
						for(i = 0; i < n; i += 1) {
							if($.inArray(types[i], item.type) !== -1) {
								return;
							}
						}
						return false;
					},
					eventModelChange: function(x,y){},
					events: {
						onFilterChange: {
							addListener: function(x) {}
						}
					}
				});
			}(options.types));
		}
		
		if(options.filters !== undefined && options.filters.length > 0) {
			(function(filters) {
				var parser = MITHGrid.Expression.initParser(), 
					n = filters.length,
					parsedFilters = $.map(filters, function(ex) {
							return parser.parse(ex);
						}
					);
										
				that.registerFilter({
					eventFilterItem: function(model, id) {
						var values = [], i, m;
						for(i = 0; i < n; i += 1) {
							values = parsedFilters[i].evaluateOnItem(id, model);
							values = values.values.items();
							m = values.length;
							for(i = 0; i < m; i += 1) {
								if(values[i] !== "false") {
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
			}(options.filters));
		}
		
		if(options.collection !== undefined) {
			that.registerFilter({
				eventFilterItem: options.collection,
				eventModelChange: function(x, y) { },
				events: {
					onFilterChange: {
						addListener: function(x) { }
					}
				}
			});
		}

        that.eventModelChange = function(model, items) {
			var allowed_set = Data.initSet(that.items());
            filterItems(function() {
				var changed_set = Data.initSet(),
				i, n;
				$.each(that.items(), function(idx, id) { allowed_set.add(id); });
				n = items.length;
				for(i = 0; i < n; i += 1) {
					if(allowed_set.contains(items[i])) {
						changed_set.add(items[i]);
					}
				}
				if(changed_set.size() > 0) {
                    that.events.onModelChange.fire(that, changed_set.items());
				}
            });
        };

        that.eventFilterChange = that.eventModelChange;

        that.dataStore = options.dataStore;

		// these mappings allow a data View to stand in for a data Store
        that.getItems = that.dataStore.getItems;
        that.getItem = that.dataStore.getItem;
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
}(jQuery, MITHGrid));(function($, MITHGrid) {
    /*jslint nomen: true */
    var Expression = MITHGrid.namespace("Expression"),
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
                var conditionCollection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database),
                condition = false;
                conditionCollection.forEachValue(function(v) {
                    if (v) {
                        condition = true;
                        return true;
                    }
                });

                if (condition) {
                    return args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
                }
                else {
                    return args[2].evaluate(roots, rootValueTypes, defaultRootName, database);
                }
            }
        },
        "foreach": {
            f: function(args, roots, rootValueTypes, defaultRootName, database) {
                var collection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database),
                oldValue = roots.value,
                oldValueType = rootValueTypes.value,
                results = [],
                valueType = "text",
                collection2;

                rootValueTypes.value = collection.valueType;

                collection.forEachValue(function(element) {
                    roots.value = element;
                    collection2 = args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
                    valueType = collection2.valueType;

                    collection2.forEachValue(function(result) {
                        results.push(result);
                    });
                });

                roots.value = oldValue;
                rootValueTypes.value = oldValueType;

                return Expression.initCollection(results, valueType);
            }
        },
        "default": {
            f: function(args, roots, rootValueTypes, defaultRootName, database) {
                var i,
                n,
                collection;
                for (i = 0, n = args.length; i < n; i += 1) {
                    collection = args[i].evaluate(roots, rootValueTypes, defaultRootName, database);
                    if (collection.size() > 0) {
                        return collection;
                    }
                }
                return Expression.initCollection([], "text");
            }
        }
    };

    Expression.initExpression = function(rootNode) {
        var that = {};

        that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
            var collection = rootNode.evaluate(roots, rootValueTypes, defaultRootName, database);
            return {
                values: collection.getSet(),
                valueType: collection.valueType,
                size: collection.size
                //()
            };
        };

        that.evaluateOnItem = function(itemID, database) {
            return this.evaluate(
            {
                "value": itemID
            },
            {
                "value": "item"
            },
            "value",
            database
            );
        };

        that.evaluateSingle = function(roots, rootValueTypes, defaultRootName, database) {
            var collection = rootNode.evaluate(roots, rootValueTypes, defaultRootName, database),
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

		if(that.isPath) {
			that.getPath = function() { 
				return rootNode; 
			};
            that.testExists = function(roots, rootValueTypes, defaultRootName, database) {
                return rootNode.testExists(roots, rootValueTypes, defaultRootName, database);
            };
		}
		else {
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
        var that = {
            valueType: valueType
        };

        if (values instanceof Array) {

            that.forEachValue = function(f) {
                var a = values,
                i,
                n;

                for (i = 0, n = a.length; i < n; i += 1) {
                    if (f(a[i]) === true) {
                        break;
                    }
                }
            };

            that.getSet = function() {
                return MITHGrid.Data.initSet(values);
            };

            that.contains = function(v) {
                var a = values,
                i,
                n;

                for (i = 0, n = a.length; i < n; i += 1) {
                    if (a[i] === v) {
                        return true;
                    }
                }
                return false;
            };

            that.size = function() {
                return values.length;
            };

        }
        else {

            that.forEachValue = function(f) {
                return values.visit(f);
            };

            that.getSet = function() {
                return values;
            };

            that.contains = function(v) {
                return values.contains(v);
            };

            that.size = values.size;

        }

        that.isPath = false;

        return that;
    };

    Expression.initConstant = function(value, valueType) {
        var that = {};

        that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
            return Expression.initCollection([value], valueType);
        };

        that.isPath = false;

        return that;
    };

    Expression.initOperator = function(operator, args) {
        var that = {},
        _operator = operator,
        _args = args;

        that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
            var values = [],
            args = [],
            i,
            n,
            operator,
            f;

            for (i = 0, n = _args.length; i < n; i += 1) {
                args.push(_args[i].evaluate(roots, rootValueTypes, defaultRootName, database));
            }

            operator = _operators[_operator];
            f = operator.f;
            if (operator.argumentType === "number") {
                args[0].forEachValue(function(v1) {
                    if (typeof(v1) !== "number") {
                        v1 = parseFloat(v1);
                    }

                    args[1].forEachValue(function(v2) {
                        if (typeof(v2) !== "number") {
                            v2 = parseFloat(v2);
                        }

                        values.push(f(v1, v2));
                    });
                });
            }
            else {
                args[0].forEachValue(function(v1) {
                    args[1].forEachValue(function(v2) {
                        values.push(f(v1, v2));
                    });
                });
            }

            return Expression.initCollection(values, operator.valueType);
        };

        that.isPath = false;

        return that;
    };

    Expression.initFunctionCall = function(name, args) {
        var that = {},
        _name = name,
        _args = args;

        that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
            var args = [],
            i,
            n;

            for (i = 0, n = _args.length; i < n; i += 1) {
                args.push(_args[i].evaluate(roots, rootValueTypes, defaultRootName, database));
            }

            if (Expression.functions[_name] !== undefined) {
                return Expression.functions[_name].f(args);
            }
            else {
                throw new Error("No such function named " + _name);
            }
        };

        that.isPath = false;

        return that;
    };

    Expression.initControlCall = function(name, args) {
        var that = {},
        _name = name,
        _args = args;

        that.evaluate = function(roots, rootValueTypes, defaultRootName, database) {
            return Expression.controls[_name].f(_args, roots, rootValueTypes, defaultRootName, database);
        };

        that.isPath = false;

        return that;
    };

    Expression.initPath = function(property, forward) {
        var that = {},
        _rootName = null,
        _segments = [],
        walkForward = function(collection, database) {
            var i,
            n,
            segment,
            a,
            valueType,
            property,
            values,
            forwardArraySegmentFn = function(segment) {
                var a = [];
                collection.forEachValue(function(v) {
                    database.getObjects(v, segment.property).visit(function(v2) {
                        a.push(v2);
                    });
                });
                return a;
            },
            backwardArraySegmentFn = function(segment) {
                var a = [];
                collection.forEachValue(function(v) {
                    database.getSubjects(v, segment.property).visit(function(v2) {
                        a.push(v2);
                    });
                });
                return a;
            };

            for (i = 0, n = _segments.length; i < n; i += 1) {
                segment = _segments[i];
                if (segment.isMultiple) {
                    a = [];
                    if (segment.forward) {
                        a = forwardArraySegmentFn(segment);
                        property = database.getProperty(segment.property);
                        valueType = property !== null ? property.getValueType() : "text";
                    }
                    else {
                        a = backwardArraySegmentFn(segment);
                        valueType = "item";
                    }
                    collection = Expression.initCollection(a, valueType);
                }
                else {
                    if (segment.forward) {
                        values = database.getObjectsUnion(collection.getSet(), segment.property);
                        property = database.getProperty(segment.property);
                        valueType = property !== null ? property.getValueType() : "text";
                        collection = Expression.initCollection(values, valueType);
                    }
                    else {
                        values = database.getSubjectsUnion(collection.getSet(), segment.property);
                        collection = Expression.initCollection(values, "item");
                    }
                }
            }

            return collection;
        },
        walkBackward = function(collection, filter, database) {
            var i,
            segment,
            a,
            valueType,
            property,
            values,
            forwardArraySegmentFn = function(segment) {
                var a = [];
                collection.forEachValue(function(v) {
                    database.getSubjects(v, segment.property).visit(function(v2) {
                        if (i > 0 || filter === null || filter.contains(v2)) {
                            a.push(v2);
                        }
                    });
                });
                return a;
            },
            backwardArraySegmentFn = function(segment) {
                var a = [];
                collection.forEachValue(function(v) {
                    database.getObjects(v, segment.property).visit(function(v2) {
                        if (i > 0 || filter === null || filter.contains(v2)) {
                            a.push(v2);
                        }
                    });
                });
                return a;
            };

            if (filter instanceof Array) {
                filter = MITHGrid.Data.initSet(filter);
            }
            for (i = _segments.length - 1; i >= 0; i -= 1) {
                segment = _segments[i];
                if (segment.isMultiple) {
                    a = [];
                    if (segment.forward) {
                        a = forwardArraySegmentFn(segment);
                        property = database.getProperty(segment.property);
                        valueType = property !== null ? property.getValueType() : "text";
                    }
                    else {
                        a = backwardArraySegmentFn(segment);
                        valueType = "item";
                    }
                    collection = Expression.initCollection(a, valueType);
                }
                else {
                    if (segment.forward) {
                        values = database.getSubjectsUnion(collection.getSet(), segment.property, null, i === 0 ? filter: null);
                        collection = Expression.initCollection(values, "item");
                    }
                    else {
                        values = database.getObjectsUnion(collection.getSet(), segment.property, null, i === 0 ? filter: null);
                        property = database.getProperty(segment.property);
                        valueType = property !== null ? property.getValueType() : "text";
                        collection = Expression.initCollection(values, valueType);
                    }
                }
            }

            return collection;
        };

        if (property !== undefined) {
            _segments.push({
                property: property,
                forward: forward,
                isMultiple: false
            });
        }

        that.isPath = true;

        that.setRootName = function(rootName) {
            _rootName = rootName;
        };

        that.appendSegment = function(property, hopOperator) {
            _segments.push({
                property: property,
                forward: hopOperator.charAt(0) === ".",
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
            }
            else {
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
            var set = MITHGrid.Data.initSet(),
            valueType = "item",
            segment,
            i;

            if (_segments.length > 0) {
                segment = _segments[_segments.length - 1];
                if (segment.forward) {
                    database.getSubjectsInRange(segment.property, from, to, false, set, _segments.length === 1 ? filter: null);
                }
                else {
                    throw new Error("Last path of segment must be forward");
                }

                for (i = _segments.length - 2; i >= 0; i -= 1) {
                    segment = _segments[i];
                    if (segment.forward) {
                        set = database.getSubjectsUnion(set, segment.property, null, i === 0 ? filter: null);
                        valueType = "item";
                    }
                    else {
                        set = database.getObjectsUnion(set, segment.property, null, i === 0 ? filter: null);
                        property = database.getProperty(segment.property);
                        valueType = property !== null ? property.getValueType() : "text";
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
            var rootName = _rootName !== null ? _rootName: defaultRootName,
            valueType = rootValueTypes[rootName] !== undefined ? rootValueTypes[rootName] : "text",
            collection = null,
            root;

            if (roots[rootName] !== undefined) {
                root = roots[rootName];

                if (root.isSet || root instanceof Array) {
                    collection = Expression.initCollection(root, valueType);
                }
                else {
                    collection = Expression.initCollection([root], valueType);
                }

                return walkForward(collection, database);
            }
            else {
                throw new Error("No such variable called " + rootName);
            }
        };

        that.testExists = function(roots, rootValueTypes, defaultRootName, database) {
            return that.evaluate(roots, rootValueTypes, defaultRootName, database).size() > 0;
        };

        that.evaluateBackward = function(value, valueType, filter, database) {
            var collection = Expression.initCollection([value], valueType);
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
        var that = {},
        internalParse = function(scanner, several) {
            var token = scanner.token(),
            roots,
            expressions,
            r,
            n,
            Scanner = Expression.initScanner,
            next = function() {
                scanner.next();
                token = scanner.token();
            },
            parseFactor = function() {},
            parseTerm = function() {
                var term = parseFactor(),
                operator;

                while (token !== null && token.type === Scanner.OPERATOR &&
                (token.value === "*" || token.value === "/")) {
                    operator = token.value;
                    next();

                    term = Expression.initOperator(operator, [term, parseFactor()]);
                }
                return term;
            },
            parseSubExpression = function() {
                var subExpression = parseTerm(),
                operator;

                while (token !== null && token.type === Scanner.OPERATOR &&
                (token.value === "+" || token.value === "-")) {
                    operator = token.value;
                    next();

                    subExpression = Expression.initOperator(operator, [subExpression, parseTerm()]);
                }
                return subExpression;
            },
            parseExpression = function() {
                var expression = parseSubExpression(),
                operator;

                while (token !== null && token.type === Scanner.OPERATOR &&
                (token.value === "=" || token.value === "<>" ||
                token.value === "<" || token.value === "<=" ||
                token.value === ">" || token.value === ">=")) {

                    operator = token.value;
                    next();

                    expression = Expression.initOperator(operator, [expression, parseSubExpression()]);
                }
                return expression;
            },
            parseExpressionList = function() {
                var expressions = [parseExpression()];
                while (token !== null && token.type === Scanner.DELIMITER && token.value === ",") {
                    next();
                    expressions.push(parseExpression());
                }
                return expressions;
            },
            makePosition = function() {
                return token !== null ? token.start: scanner.index();
            },
            parsePath = function() {
                var path = Expression.initPath(),
                hopOperator;
                while (token !== null && token.type === Scanner.PATH_OPERATOR) {
                    hopOperator = token.value;
                    next();

                    if (token !== null && token.type === Scanner.IDENTIFIER) {
                        path.appendSegment(token.value, hopOperator);
                        next();
                    }
                    else {
                        throw new Error("Missing property ID at position " + makePosition());
                    }
                }
                return path;
            };

            parseFactor = function() {
                var result = null,
                args = [],
                identifier;

                if (token === null) {
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

                    if (Expression.controls[identifier] !== undefined) {
                        if (token !== null && token.type === Scanner.DELIMITER && token.value === "(") {
                            next();

                            args = (token !== null && token.type === Scanner.DELIMITER && token.value === ")") ?
                            [] : parseExpressionList();
                            result = Expression.initControlCall(identifier, args);

                            if (token !== null && token.type === Scanner.DELIMITER && token.value === ")") {
                                next();
                            }
                            else {
                                throw new Error("Missing ) to end " + identifier + " at position " + makePosition());
                            }
                        }
                        else {
                            throw new Error("Missing ( to start " + identifier + " at position " + makePosition());
                        }
                    }
                    else {
                        if (token !== null && token.type === Scanner.DELIMITER && token.value === "(") {
                            next();

                            args = (token !== null && token.type === Scanner.DELIMITER && token.value === ")") ?
                            [] : parseExpressionList();
                            result = Expression.initFunctionCall(identifier, args);

                            if (token !== null && token.type === Scanner.DELIMITER && token.value === ")") {
                                next();
                            }
                            else {
                                throw new Error("Missing ) after function call " + identifier + " at position " + makePosition());
                            }
                        }
                        else {
                            result = parsePath();
                            result.setRootName(identifier);
                        }
                    }
                    break;
                case Scanner.DELIMITER:
                    if (token.value === "(") {
                        next();

                        result = parseExpression();
                        if (token !== null && token.type === Scanner.DELIMITER && token.value === ")") {
                            next();
                        }
                        else {
                            throw new Error("Missing ) at position " + makePosition());
                        }
                    }
                    else {
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
                for (r = 0, n = roots.length; r < n; r += 1) {
                    expressions.push(Expression.initExpression(roots[r]));
                }
                return expressions;
            }
            else {
                return [Expression.initExpression(parseExpression())];
            }
        };

        that.parse = function(s, startIndex, results) {
            var scanner;

            startIndex = startIndex || 0;
            results = results || {};

            scanner = Expression.initScanner(s, startIndex);
            try {
                return internalParse(scanner, false)[0];
            }
            finally {
                results.index = scanner.token() !== null ? scanner.token().start: scanner.index();
            }
        };

        return that;
    };

    Expression.initScanner = function(text, startIndex) {
        var that = {},
        _text = text + " ",
        _maxIndex = text.length,
        _index = startIndex,
        _token = null,
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
            var c1,
            c2,
            i,
            c;

            _token = null;

            while (_index < _maxIndex &&
            " \t\r\n".indexOf(_text.charAt(_index)) >= 0) {
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
                        _index += 2;
                    }
                    else {
                        _token = {
                            type: Expression.initScanner.PATH_OPERATOR,
                            value: c1,
                            start: _index,
                            end: _index + 1
                        };
                        _index += 1;
                    }
                }
                else if ("<>".indexOf(c1) >= 0) {
                    if ((c2 === "=") || ("<>".indexOf(c2) >= 0 && c1 !== c2)) {
                        _token = {
                            type: Expression.initScanner.OPERATOR,
                            value: c1 + c2,
                            start: _index,
                            end: _index + 2
                        };
                        _index += 2;
                    }
                    else {
                        _token = {
                            type: Expression.initScanner.OPERATOR,
                            value: c1,
                            start: _index,
                            end: _index + 1
                        };
                        _index += 1;
                    }
                }
                else if ("+-*/=".indexOf(c1) >= 0) {
                    _token = {
                        type: Expression.initScanner.OPERATOR,
                        value: c1,
                        start: _index,
                        end: _index + 1
                    };
                    _index += 1;
                }
                else if ("()".indexOf(c1) >= 0) {
                    _token = {
                        type: Expression.initScanner.DELIMITER,
                        value: c1,
                        start: _index,
                        end: _index + 1
                    };
                    _index += 1;
                }
                else if ("\"'".indexOf(c1) >= 0) {
                    // quoted strings
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
                        _index = i + 1;
                    }
                    else {
                        throw new Error("Unterminated string starting at " + String(_index));
                    }
                }
                else if (isDigit(c1)) {
                    // number
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

                    _index = i;
                }
                else {
                    // identifier
                    i = _index;

                    while (i < _maxIndex) {
                        c = _text.charAt(i);
                        if ("(),.!@ \t".indexOf(c) < 0) {
                            i += 1;
                        }
                        else {
                            break;
                        }
                    }

                    _token = {
                        type: Expression.initScanner.IDENTIFIER,
                        value: _text.substring(_index, i),
                        start: _index,
                        end: i
                    };
                    _index = i;
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

	Expression.functions = { };
	Expression.FunctionUtilities = { };
	
	Expression.FunctionUtilities.registerSimpleMappingFunction = function(name, f, valueType) {
		Expression.functions[name] = {
			f: function(args) {
				var set = MITHGrid.Data.initSet(),
				evalArg = function(arg) {
					arg.forEachValue(function(v) {
						var v2 = f(v);
						if(v2 !== undefined) {
							set.add(v2);
						}
					});
				},
				i;
				
				for(i = 0; i < args.length; i += 1) {
					evalArg(args[i]);
				}
				return Expression.initCollection(set, valueType);
			}
		};
	};

	Expression.FunctionUtilities.registerSimpleMappingFunction("$", function(arg) {
		return arg;
	}, 'Item');
} (jQuery, MITHGrid));
(function($, MITHGrid) {
    MITHGrid.namespace('Presentation');

    MITHGrid.Presentation.initPresentation = function(type, container, options) {
        var that = fluid.initView("MITHGrid.Presentation." + type, container, options),
        renderings = {}, lenses = that.options.lenses;
        options = that.options;

        $(container).empty();

        //		$("<div id='" + my_id + "-body'></div>").appendTo($(container));
        //		that.body_container = $('#' + my_id + '-body');

	    that.getLens = function(item) {
			if(lenses[item.type[0]] !== undefined) {
				return { render: lenses[item.type[0]] };
			}
	    };

        that.renderingFor = function(id) {
            return renderings[id];
        };

        that.renderItems = function(model, items) {
            var n = items.length,
            f;

			f = function(start) {
                var end,
                i,
				id,
				hasItem,
                lens;

                if (start < n) {
                    end = n;
                    if (n > 200) {
                        end = start + parseInt(Math.sqrt(n), 10) + 1;
                        if (end > n) {
                            end = n;
                        }
                    }
                    for (i = start; i < end; i += 1) {
                        id = items[i];
                        hasItem = model.contains(id);
                        if (!hasItem) {
                            // item was removed
                            if (renderings[id]) {
                                // we need to remove it from the display
                                // .remove() should not make changes in the model
                                renderings[id].remove();
								delete renderings[id];
                            }
                        }
                        else if (renderings[id]) {
                            renderings[id].update(model.getItem(id));
                        }
                        else {
                            lens = that.getLens(model.getItem(id));
                            if (lens) {
                                renderings[id] = lens.render(container, that, model, items[i]);
                            }
                        }
                    }

                    that.finishDisplayUpdate();
                    setTimeout(function() {
                        f(end);
                    },
                    0);
                }
            };
            that.startDisplayUpdate();
            f(0);
        };

        that.eventModelChange = that.renderItems;

        that.startDisplayUpdate = function() {
        };

        that.finishDisplayUpdate = function() {
        };

        that.selfRender = function() {
            /* do nothing -- needs to be implemented in subclass */
            that.renderItems(that.dataView, that.dataView.items());
        };

        that.dataView = that.options.dataView;
        that.dataView.registerPresentation(that);
        return that;
    };
} (jQuery, MITHGrid));(function($, MITHGrid) {
    var Application = MITHGrid.namespace('Application');
    Application.initApp = function(klass, container, options) {
        var that = fluid.initView(klass, container, options),
        onReady = [];

		that.presentation = {};
		that.dataStore = {};
		that.dataView = {};
		
		options = that.options;
		
        that.ready = function(fn) {
            onReady.push(fn);
        };


        if (options.dataStores !== undefined) {
            $.each(options.dataStores,
            function(storeName, config) {
                var store;
				if(that.dataStore[storeName] === undefined) {
					store = MITHGrid.Data.initStore();
	                that.dataStore[storeName] = store;
	                store.addType('Item');
				}
				else {
					store = that.dataStore[storeName];
				}
                store.addProperty('label', {
                    valueType: 'text'
                });
                store.addProperty('type', {
                    valueType: 'text'
                });
                store.addProperty('id', {
                    valueType: 'text'
                });
                if (config.types !== undefined) {
                    $.each(config.types,
                    function(type, typeInfo) {
                        store.addType(type);
                    });
                }
                if (config.properties !== undefined) {
                    $.each(config.properties,
                    function(prop, propOptions) {
                        store.addProperty(prop, propOptions);
                    });
                }
            });
        }

        if (options.dataViews !== undefined) {
            $.each(options.dataViews,
            function(viewName, config) {
				var view = {},
				viewOptions = {
					dataStore: that.dataStore[config.dataStore],
					label: viewName
				};
				
				if(that.dataView[viewName] === undefined) {				
					if(config.collection !== undefined) {
						viewOptions.collection = config.collection;
					}
					if(config.types !== undefined) {
						viewOptions.types = config.types;
					}
					if(config.filters !== undefined) {
						viewOptions.filters = config.filters;
					}
	                view = MITHGrid.Data.initView(viewOptions);
	                that.dataView[viewName] = view;
				}
				else {
					view = that.dataView[viewName];
				}
            });
        }

		if (options.viewSetup !== undefined) {
			if($.isFunction(options.viewSetup)) {
				that.ready(function() { options.viewSetup($(container)); });
			}
			else {
				that.ready(function() { $(container).append(options.viewSetup); });
			}
		}

        if (options.presentations !== undefined) {
            that.ready(function() {
                $.each(options.presentations,
                function(pName, config) {
                    var poptions = $.extend(true, {}, config),
                    pcontainer = $('#' + $(container).attr('id') + ' > ' + config.container),
                    presentation;
                    if ($.isArray(container)) {
                        pcontainer = pcontainer[0];
                    }
                    poptions.dataView = that.dataView[config.dataView];
					poptions.application = that;
					
                    presentation = config.type(pcontainer, poptions);
                    that.presentation[pName] = presentation;
                    presentation.selfRender();
                });
            });
        }

        if (options.plugins !== undefined) {
            that.ready(function() {
                $.each(options.plugins,
                function(idx, pconfig) {
                    var plugin = pconfig.type(pconfig);
                    if (plugin !== undefined) {
                        if (pconfig.dataView !== undefined) {
                            // hook plugin up with dataView requested by app configuration
                            plugin.dataView = that.dataView[pconfig.dataView];
                            // add
                            $.each(plugin.getTypes(),
                            function(idx, t) {
                                plugin.dataView.addType(t);
                            });
                            $.each(plugin.getProperties(),
                            function(idx, p) {
                                plugin.dataView.addProperty(p.label, p);
                            });
                        }
                        $.each(plugin.getPresentations(),
                        function(idx, config) {
                            var options = $.extend(true, {},
                            config.options),
                            pcontainer = $("#" + $(container).attr('id') + ' > ' + config.container),
                            presentation;

                            if ($.isArray(container)) {
                                pcontainer = pcontainer[0];
                            }
                            if (config.dataView !== undefined) {
                                options.store = that.dataView[config.dataView];
                            }
                            else if (pconfig.dataView !== undefined) {
                                options.store = that.dataView[pconfig.dataView];
                            }
							options.application = that;
                            presentation = config.type(pcontainer, options);
                            plugin.presentation[config.label] = presentation;
                            presentation.selfRender();
                        });
                    }
                });
            });
        }

        that.run = function() {
            $(document).ready(function() {
                $.each(onReady,
                function(idx, fn) {
                    fn();
                });
                that.ready = function(fn) {
                    setTimeout(fn, 0);
                };
            });
        };

        return that;
    };
} (jQuery, MITHGrid));
(function($, MITHGrid) {
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
		
	MITHGrid.Plugin.initPlugin = function(klass, options) {
		var that = { options: options, presentation: { } }, readyFns = [ ];
		
		that.getTypes = function() {
			if(options.types !== undefined) {
				return options.types;
			}
			else {
				return [ ];
			}
		};
		
		that.getProperties = function() {
			if(options.properties !== undefined) {
				return options.properties;
			}
			else {
				return [ ];
			}
		};
		
		that.getPresentations = function() {
			if(options.presentations !== undefined) {
				return options.presentations;
			}
			else {
				return [ ];
			}
		};
		
		that.ready = function(fn) {
			readyFns.push(fn);
		};
		
		that.eventReady = function(app) {
			$.each(readyFns, function(idx, fn) {
				fn(app);
			});
			that.ready = function(fn) {
				fn(app);
			};
		};
		
		return that;
	};
	
}(jQuery, MITHGrid));fluid.defaults("MITHGrid.Data.initStore", {
    events: {
        onModelChange: null,
        onBeforeLoading: null,
        onAfterLoading: null,
        onBeforeUpdating: null,
        onAfterUpdating: null
    }
});

fluid.defaults("MITHGrid.Data.initView", {
    events: {
        onModelChange: null,
        onFilterItem: "preventable"
    }
});
