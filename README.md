mongoose-fulltext
=================

Dead simple fulltext search plugin for mongoose &amp; mongodb



## Installation

```
npm install mongoose-fulltext
```

## Example Usage

```javascript

//Fields can be indexed seperately, or a custom field defined allowing for multiple field's values to be munged.
//Valid fields for fulltext are String or Number or Arrays of either.
var ExampleSchema = new Schema({
    name:{type:String, fulltext:true},
    description:{type:String, fulltext:true,  searchfield:'customsearchfieldname'},
    tags:[{type:String, fulltext:true, searchfield:'customsearchfieldname'}]
})




//This will add a field called 'sindex' to the model containing the metaphone data
Fulltext(ExampleSchema,{indexfieldname:'sindex'});

var ex = new Fulltext({name:'This is a sample document name', description:'This is a sample document description of sometthing'})

//Index is done automatically via pre('save')
ex.save(function (err, res) {
  if (err) {
    console.log(err);
  } else {
    console.log(JSON.stringify(res));
    }    
})

//A method .search is added to the model. A custom option 'score' is available
//This will add scores and sort hi-lo.
search({name:'sample'}, {}, {score:true}, function (err, res) {
        if (err) {
            console.log(err);
        } else {
            console.log(JSON.stringify(res));
        }      
})

```
