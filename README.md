mongoose-fulltext
=================

Dead simple fulltext search plugin for mongoose &amp; mongodb

Uses https://github.com/NaturalNode/natural to tokenize, create phonetics and score fields of type String/Number/[String]/[Number]

## Installation

```
npm install mongoose-fulltext
```

## Example Usage

Fields can be indexed seperately, or a custom field defined allowing for
multiple field's values to be munged.
Valid fields for fulltext are String or Number or Arrays of either.

```javascript
var ExampleSchema = new Schema({
    name:{type:String, fulltext:true},
    description:{type:String, fulltext:true,  searchfield:'customsearchfieldname'},
    tags:[{type:String, fulltext:true, searchfield:'customsearchfieldname'}]
})


Fulltext(ExampleSchema,{indexfieldname:'sindex'});

var ex = new Fulltext({name:'This is a sample document name', 
    description:'This is a sample document description of sometthing'})
```
Index is done automatically via pre('save');

```javascript
ex.save(function (err, res) {
  if (err) {
    console.log(err);
  } else {
    console.log(JSON.stringify(res));
    }    
})
```

A method .search is added to the model. A custom option 'score' is available
This will add scores and sort hi-lo.
```javascript
ex.search({name:'sample'}, {}, {score:true}, function (err, res) {
        if (err) {
            console.log(err);
        } else {
            console.log(JSON.stringify(res));
        }      
})
```


## License

Copyright (c) 2013 Phillip Rosen

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
