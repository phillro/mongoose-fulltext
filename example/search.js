/**
 * User: philliprosen
 * Date: 1/1/13
 * Time: 3:29 PM
 */
var cli = require('cli');

cli.main(function (args, options) {

    var mongoose = require('mongoose');
    mongoose.connect('localhost', 'stest');
    var ExampleSchema = require('./schema')

    var Ex = mongoose.model('Example', ExampleSchema);

    Ex.search({name:'sample'}, {}, {}, function (err, res) {
        if (err) {
            console.log(err);
        } else {
            console.log(JSON.stringify(res));
        }
        process.exit(0);
    })

});