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

    //var cleanTree = getCleanTree(schema.tree, schema.paths, '')
    //indexFields2 = getIndexFields(cleanTree);


    for (var path in schema.paths) {
        if(schema.paths[path].options&&schema.paths[path].options.fulltext){
            var searchField = schema.paths[path].options.searchfield ? schema.paths[path].options.searchfield : path;
            indexFields[searchField]=[path];
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
        schema.index(iopt, {sparse:true});
    }

    function getFieldValue(field, doc) {
        var val = false;
        var val = doc.get(field)||false;

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

}



