/**
    @module "ui/modifier.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Word = require("ui/word.reel").Word;

/**
    Description TODO
    @class module:"ui/modifier.reel".Modifier
    @extends module:montage/ui/component.Component
*/
var ModVal = exports.ModVal = Montage.create(Component, /** @lends module:"ui/modifier.reel".Modifier# */ {

    word: {
        value: null
    },

    fact: {
        value: null
    },

    _wordType: {
        value: "word"
    },

    wordType: {
        set: function (val) {
            this._wordType = val;
            var newword = Word.create();
            newword.ownerComponent = this;
            newword.type = val;
            this.word = newword;
        },
        get: function () {
            return this._wordType;
        }
    }

});
