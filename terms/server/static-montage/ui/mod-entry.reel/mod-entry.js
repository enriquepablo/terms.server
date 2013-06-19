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
var ModEntry = exports.ModEntry = Montage.create(Component, /** @lends module:"ui/modifier.reel".Modifier# */ {

    mod: {
        value: null
    }

});
