/**
 * User: philliprosen
 * Date: 1/1/13
 * Time: 3:18 PM
 */
var mongoose = require('mongoose'),
    Fulltext = require('../lib/plugin');
var Schema = mongoose.Schema;




var ExampleSchema = new Schema({
    name:{type:String, fulltext:true},
    description:{type:String, fulltext:true,  searchfield:'customsearchfieldname'},
    tags:[{type:String, fulltext:true, searchfield:'s3'}],
    nested:{
        n1:{type:String, fulltext:true}
    },

})


Fulltext(ExampleSchema,{indexfieldname:'sindex'});

module.exports = ExampleSchema