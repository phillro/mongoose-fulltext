/**
 * User: philliprosen
 * Date: 1/1/13
 * Time: 3:10 PM
 */

var mongoose = require('mongoose');
var Search = require('./search').Search;
var Schema = mongoose.Schema;

module.exports = exports = function fulltext(schema, options) {

    var indexfieldname = options.indexfieldname || 'sindex';
    var search = new Search(indexfieldname);
    var indexFields = {};

    for (var f in schema.tree) {
        if (Array.isArray(schema.tree[f])) {
            if (schema.tree[f].length > 0 && schema.tree[f][0].fulltext) {
                var fname = schema.tree[f][0].searchfield || f
                indexFields[fname] = indexFields[fname] ? indexFields[fname] : [];
                indexFields[fname].push(f)
            }
        } else if (schema.tree[f].fulltext) {
            var fname = schema.tree[f].searchfield || f
            indexFields[fname] = indexFields[fname] ? indexFields[fname] : [];
            indexFields[fname].push(f)
        }
    }

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
        schema.index(iopt,{sparse:true});
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

    schema.statics.searchByIndexFieldName = function (searchQuery, fields, options, cb) {
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

}



