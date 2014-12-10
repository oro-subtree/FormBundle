/*global define*/
define(['jquery', 'underscore'
    ], function ($, _) {
    'use strict';

    /**
     * @export  oroform/js/select2-config
     * @class   oroform.Select2Config
     */
    var Select2Config = function (config, url, perPage, excluded) {
        this.config = config;
        this.url = url;
        this.perPage = perPage;
        this.excluded = excluded;
    };

    Select2Config.prototype = {
        getConfig: function () {
            var self = this;
            // create default AJAX object for AJAX based Select2
            // and if this object was not created in extra config block
            if (this.config.ajax === undefined && this.url) {
                this.config.ajax = {
                    url: this.url,
                    data: function (query, page) {
                        return {
                            page: page,
                            per_page: self.perPage,
                            query: query
                        };
                    },
                    results: function (data, page) {
                        return data;
                    }
                };
            }
            // configure AJAX object if it exists
            if (this.config.ajax !== undefined) {
                if (this.config.initSelection === undefined) {
                    this.config.initSelection = _.bind(this.initSelection, this);
                }
                var filterData = function(data) {
                    if (self.excluded) {
                        var forRemove = [];
                        var results = data.results;
                        for (var i = 0; i < results.length; i++) {
                            if (results[i].hasOwnProperty('id') && self.excluded.indexOf(results[i].id) > -1) {
                                forRemove.push(i);
                            }
                        }
                        for (i = 0; i < forRemove.length; i++) {
                            results.splice(forRemove[i], 1);
                        }
                        data.results = results;
                    }
                    return data;
                };
                var resultsMethod = this.config.ajax.results;
                this.config.ajax.results = function(data, page) {
                    return filterData(resultsMethod(data, page));
                };
                if (this.config.ajax.quietMillis === undefined) {
                    this.config.ajax.quietMillis = 700;
                }
            } else {
                // configure non AJAX based Select2
                if (this.config.minimumResultsForSearch === undefined) {
                    this.config.minimumResultsForSearch = 7;
                }
            }
            // set default values for other Select2 options
            if (this.config.formatResult === undefined) {
                this.config.formatResult = this.format(this.config.result_template || false);
            }
            if (this.config.formatSelection === undefined) {
                this.config.formatSelection = this.format(this.config.selection_template || false);
            }
            if (this.config.escapeMarkup === undefined) {
                this.config.escapeMarkup = function (m) { return m; };
            }
            if (this.config.dropdownAutoWidth === undefined) {
                this.config.dropdownAutoWidth = true;
            }
            if (this.config.openOnEnter === undefined) {
                this.config.openOnEnter = null;
            }
            return this.config;
        },

        format: function(jsTemplate) {
            var self = this;
            // pre-compile template if it exists
            if (jsTemplate) {
                jsTemplate = _.template(jsTemplate);
            }

            return function (object, container, query) {
                if ($.isEmptyObject(object)) {
                    return undefined;
                }
                var result = '',
                    highlight = function (str) {
                        return object.children ? str : self.highlightSelection(str, query);
                    };
                if (object._html !== undefined) {
                    result = _.escape(object._html);
                } else if (jsTemplate) {
                    object = _.clone(object);
                    object.highlight = highlight;
                    if (self.config.formatContext !== undefined) {
                        object.context = self.config.formatContext();
                    }
                    result = jsTemplate(object);
                } else {
                    result = highlight(_.escape(self.getTitle(object, self.config.properties)));
                }
                return result;
            };
        },

        initSelection: function(element, callback) {
            var self = this;

            var handleResults = function(data) {
                if (self.config.multiple === true) {
                    callback(data);
                } else {
                    callback(data.pop());
                }
            };

            var setSelect2ValueById = function(id) {
                if (_.isArray(id)) {
                    id = id.join(',');
                }
                var select2Obj = element.data('select2');
                var select2AjaxOptions = select2Obj.opts.ajax;
                var searchData = select2AjaxOptions.data(id, 1, true);
                var url = (typeof select2AjaxOptions.url === 'function')
                    ? select2AjaxOptions.url.call(select2Obj, id, 1)
                    : select2AjaxOptions.url;

                searchData.search_by_id = true;
                $.ajax({
                    url: url,
                    data: searchData,
                    success: function(response) {
                        if (typeof select2AjaxOptions.results == 'function') {
                            response = select2AjaxOptions.results.call(select2Obj, response, 1);
                        }
                        if (typeof response.results != 'undefined') {
                            handleResults(response.results);
                        }
                        element.trigger('select2-data-loaded');
                    }
                });
            };

            var currentValue = element.select2('val');
            if (!_.isArray(currentValue)) {
                currentValue = [currentValue];
            }

            // elementData must have name
            var elementData = _.filter(
                element.data('selected-data'),
                function (item) {
                    return item.name !== undefined && item.name !== null;
                }
            );

            if (_.isArray(elementData) && elementData.length > 0) {
                var dataIds = _.map(elementData, function(item) {
                    return item.id;
                });

                // handle case when creation of new item allowed and value should be restored (f.e. validation failed)
                dataIds = _.compact(dataIds);

                if (dataIds.length === 0 || dataIds.sort().join(',') === currentValue.sort().join(',')) {
                    handleResults(elementData);
                } else {
                    setSelect2ValueById(currentValue);
                }
            } else {
                setSelect2ValueById(currentValue);
            }
        },

        highlightSelection: function(str, selection) {
            return str && selection && selection.term ?
                str.replace(new RegExp(selection.term, 'ig'), '<span class="select2-match">$&</span>') : str;
        },

        getTitle: function(data, properties) {
            var title = '', result;
            if (data) {
                if (properties === undefined) {
                    if (data.text !== undefined) {
                        title = data.text;
                    }
                } else {
                    result = [];
                    _.each(properties, function(property) {
                        result.push(data[property]);
                    });
                    title = result.join(' ');
                }
            }
            return title;
        }
    };

    return Select2Config;
});
