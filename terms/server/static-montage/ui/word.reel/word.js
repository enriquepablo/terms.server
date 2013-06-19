/**
    @module "ui/word.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/word.reel".Word
    @extends module:montage/ui/component.Component
*/
exports.Word = Montage.create(Component, /** @lends module:"ui/word.reel".Word# */ {

    isword: {
        value: true
    },

    content: {
        value: []
    },

    _value: {
        value: ""
    },

    value: {
        set: function(value) {
            this._value = value;
            //this.ownerComponent.wordChange(value);
        },
        get: function() {
            return this._value;
        }
    },

    _type: {
        value: "word"
    },

    type: {
        set: function(value) {
            this._type = value;
            var self = this;
            $.get('/terms/' + this.type, function (data) {
                self.loadWords(JSON.parse(data));
            });
        },
        get: function() {
            return this._type;
        }
    },

    _base: {
        value: null
    },

    base: {
        set: function(value) {
            this._base = value;
            var self = this;
            $.get('/subterms/' + this.type, function (data) {
                self.loadWords(JSON.parse(data));
            });
        },
        get: function() {
            return this._base;
        }
    },

    loadWords: {
        value: function (words) {
            var content = [ {text: "---", value: ""} ];
            for (var i=0, t=words.length; i < t; i++) {
                content.push({text: words[i], value: words[i]});
            }
            this.content = content;
        }
    }

});
