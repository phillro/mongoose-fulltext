/**
 * User: philliprosen
 * Date: 1/1/13
 * Time: 3:10 PM
 */

var mongoose = require('mongoose');
var Search = require('./search').Search;
var Schema = mongoose.Schema;
var extend = require('node.extend');

module.exports = exports = function fulltext(schema, options) {

    var indexfieldname = options.indexfieldname || 'sindex';
    var search = new Search(indexfieldname);
    var indexFields = {};

    function getIndexFields(schemaTree) {
        var fields = {};
        for (var f in schemaTree) {
            if (Array.isArray(schemaTree[f])) {
                if (schemaTree[f].length > 0 && schemaTree[f][0].fulltext) {
                    var fname = schemaTree[f][0].searchfield || f
                    fields[fname] = fields[fname] ? fields[fname] : [];
                    fields[fname].push(f)
                }
            } else if (schemaTree[f].fulltext) {
                var fname = schemaTree[f].searchfield || f
                fields[fname] = fields[fname] ? fields[fname] : [];
                fields[fname].push(f)
            }
            if (typeof schemaTree[f] == 'object') {
                // var tmp = getIndexFields(schemaTree[f]);
                //     fields = extend(fields, tmp);
            }
        }
        return fields;
    }

    var cleanTree = getCleanTree(schema.tree, schema.paths, '')
    indexFields = getIndexFields(cleanTree);

    var fieldDef = {};
    var indexPaths = [];

    for (var f in indexFields) {
        fieldDef[f] = {'ngrams':[
            {'ngram':[
                {type:String, index:true, sparse:true}
            ]}
        ]}
        indexPaths.push([indexfieldname, f, 'ngrams', 'ngram'].join('.'))
    }
    var postingDoc = {};
    postingDoc[indexfieldname] = fieldDef;
    schema.add(postingDoc);
    for (var i = 0; i < indexPaths.length; i++) {
        var iopt = {};
        iopt[indexPaths[i]] = 1
        schema.index(iopt, {sparse:true});
    }

    function getFieldValue(field, doc) {
        var val = false;
        if (typeof doc._doc[field] == 'string' || typeof doc._doc[field] == 'number') {
            val = doc._doc[field];
        } else if (Array.isArray(doc._doc[field])) {
            for (var i = 0; i < doc._doc[field].length; i++) {
                if (typeof doc._doc[field][i] == 'string' || typeof doc._doc[field] == 'number') {
                    val += doc._doc[field][i] + ' ';
                }
            }
            val = val ? val.trim() : val;
        }
        return val;
    }

    schema.pre('save', function (cb) {
        var self = this;
        for (var searchFieldName in indexFields) {
            var values = [];
            for (var i = 0; i < indexFields[searchFieldName].length; i++) {
                var sourceFieldName = indexFields[searchFieldName][i]
                var fieldValue = getFieldValue(sourceFieldName, self);
                if (fieldValue) {
                    values.push(fieldValue);
                }
            }
            self = search.addIndex(self, values, searchFieldName);
        }
        cb();
    })

    schema.statics.search = function (searchQuery, fields, options, cb) {
        var options = options || {};
        var field = Object.keys(searchQuery)[0];
        var query = search.getMongoQuery(searchQuery[field], field);
        this.find(query, fields, options, function (err, docs) {
            if (err) {
                cb(err);
            } else {
                if (options.score) {
                    docs = search.addScores(docs, searchQuery[field], field);
                }
                cb(undefined, docs);

            }
        })
    }

    //Below is from Mongoosastic.
    function getTypeFromPaths(paths, field) {
        var type = false;

        if (paths[field] && paths[field].options.type === Date) {
            return 'date';
        }

        if (paths[field] && paths[field].options.type === Boolean) {
            return 'boolean';
        }

        if (paths[field]) {
            type = paths[field].instance ? paths[field].instance.toLowerCase() : 'object';
        }

        return type;
    }

    function getCleanTree(tree, paths, prefix) {
        var cleanTree = {},
            type = '',
            value = {};

        delete tree.id;
        delete tree._id;

        if (prefix !== '') {
            prefix = prefix + '.';
        }

        for (var field in tree) {
            type = getTypeFromPaths(paths, prefix + field);
            value = tree[field];

            // Field has some kind of type
            if (type) {
                // If it is an nestec schema
                if (value[0]) {
                    //A nested schema can be just a blank object with no defined paths
                    if (value[0].tree && value[0].paths) {
                        cleanTree[field] = getCleanTree(value[0].tree, value[0].paths, '');
                    }
                    // Check for single type arrays (which elasticsearch will treat as the core type i.e. [String] = string)
                    else if (paths[field].caster && paths[field].caster.instance) {
                        cleanTree[field] = value;
                        cleanTree[field].type = 'array';
                        //cleanTree[field] = {type: paths[field].caster.instance.toLowerCase()};
                    }
                    else {
                        cleanTree[field] = {
                            type:'object'
                        };
                    }
                } else {
                    cleanTree[field] = value;
                    cleanTree[field].type = type;
                }

                // It has no type for some reason
            } else {
                // Because it is an geo_point object!!
                if (typeof value === 'object' && value.geo_point) {
                    cleanTree[field] = value.geo_point;
                    continue;
                }

                // Because it is some other object!! Or we assumed that it is one.
                if (typeof value === 'object') {
                    cleanTree[field] = getCleanTree(value, paths, prefix + field);
                }
            }
        }

        return cleanTree;
    }

}



