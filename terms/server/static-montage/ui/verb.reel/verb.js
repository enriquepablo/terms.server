/**
    @module "ui/verb.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/verb.reel".Verb
    @extends module:montage/ui/component.Component
*/
exports.Verb = Montage.create(Component, /** @lends module:"ui/verb.reel".Verb# */ {

    word: {
        value: null
    },

    select: {
        value: null
    },

    handleChange: {
        value: function (value) {
            this.ownerComponent.verbChange(value);
        }
    },

    prepareForDraw:  {
        value: function () {
            Object.defineBinding(this.word, 'content', {
                boundObject: this.select,
                boundObjectPropertyPath: 'content'
            });
            this.word.type = "verb";
            Object.defineBinding(this.word, 'value', {
                boundObject: this.select,
                boundObjectPropertyPath: 'value'
            });
            this.word.addEventListener("change@value", this);
        }
    }

});
