/**
 * User: philliprosen
 * Date: 1/1/13
 * Time: 3:10 PM
 */
var natural = require('natural'),
    metaphone = natural.Metaphone,
    NGrams = natural.NGrams,
    TfIdf = natural.TfIdf;

metaphone.attach()

exports.Search = Search;

function Search(key, options) {
    var options = options || {};
    this.key = key;

    this.stopwords=options.stopwords ? options.stopwords : false;
    this.stopwords=options.naturalstop ? natural.stopwords : false;


}

Search.prototype.addIndex = function (document, words, field) {
    if (Array.isArray(words)) {
        words = words.join(' ');
    }
    if (!document[this.key]) {
        document[this.key] = {};
    }
    //document[this.key][field] = this.getIndexObj(words);
    var indexObj = this.getIndexObj(words)
    document.set(this.key + '.' + field, indexObj);
    document.markModified(this.key);

    //  document.markModified(this.key+'.'+field+'.counts');
    return document;
}

Search.prototype.ngrams = function (tokens) {
    var ngrams = [];
    if (tokens.length <= 1) {
        ngrams = [tokens];
    } else {
        ngrams = NGrams.bigrams(tokens);
    }
    return ngrams;
}

Search.prototype.getMongoQuery = function (str, field, mongoQuery) {
    var joinQuery = false;
    var searchField = this.key + '.' + field + '.ngrams.ngram';
    if (this.stopwords) {
        str = this.stripStopWords(str.split(' ')).join(' ');
    }
    var tokens = str.tokenizeAndPhoneticize();
    var ngrams = this.ngrams(tokens);
    if (ngrams.length == 0) {

    }
    var query = {'$or':[]};

    for (var i = 0; i < ngrams.length; i++) {
        var f = {};
        if (ngrams[i].length == 1) {
            f[searchField] = {'$in':ngrams[i]};
        } else {
            f[searchField] = ngrams[i];
        }
        query['$or'].push(f);
    }
    if (mongoQuery) {
        mongoQuery['$or'] = query['$or']
        query = mongoQuery;
    }
    return query;
}

Search.prototype.getIndexObj = function (str, fn) {
    if (this.stopwords) {
        str = this.stripStopWords(str.split(' ')).join(' ');
    }
    var tokens = str.tokenizeAndPhoneticize();
    var counts = {};
    var ngrams = [];
    var indexObj = {}
    for (var i = 0; i < tokens.length; i++) {
        counts[tokens[i]] = (counts[tokens[i]] || 0) + 1;
    }

    var bigrams = this.ngrams(tokens);
    for (var i = 0; i < bigrams.length; i++) {
        ngrams.push({ngram:bigrams[i]});
    }
    indexObj.counts = counts;
    indexObj.ngrams = ngrams;
    return indexObj;
}

Search.prototype.addScores = function (docs, queryStr, field) {
    var self = this;
    metaphone.attach()
    var tfidf = new TfIdf();
    for (var i = 0; i < docs.length; i++) {
        var doc = [];
        for (var word in docs[i][this.key][field].counts) {
            if (docs[i][this.key][field].counts[word] == 1) {
                doc.push(word.toLowerCase())
            } else {
                for (var j = 0; j < docs[i][this.key][field].counts[word]; j++) {
                    doc.push(word.toLowerCase())
                }
            }
        }
        tfidf.addDocument(doc);
    }
    var scores = tfidf.tfidfs(queryStr.tokenizeAndPhoneticize().join(' '));
    for (var i = 0; i < scores.length; i++) {
        docs[i][this.key]['score'] = scores[i];
    }

    docs.sort(function (a, b) {
        return b[self.key]['score'] - a[self.key]['score']
    })
    return docs;
}

//from Reds.
Search.prototype.stripStopWords = function (words) {
    var ret = [];
    for (var i = 0, len = words.length; i < len; ++i) {
        if (~this.stopwords.indexOf(words[i])) {
            continue;
        }
        ret.push(words[i]);
    }
    return ret;
};