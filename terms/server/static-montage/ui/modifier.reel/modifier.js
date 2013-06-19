/**
    @module "ui/modifier.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/modifier.reel".Modifier
    @extends module:montage/ui/component.Component
*/
var Modifier = exports.Modifier = Montage.create(Component, /** @lends module:"ui/modifier.reel".Modifier# */ {

    label: {
        value: null
    },

    wordType: {
        value: "word"
    },

    value: {
        value: null
    }

});
