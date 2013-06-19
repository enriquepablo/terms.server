/**
    @module "ui/fact.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Modifier = require("ui/modifier.reel").Modifier;

/**
    Description TODO
    @class module:"ui/fact.reel".Fact
    @extends module:montage/ui/component.Component
*/
exports.Fact = Montage.create(Component, /** @lends module:"ui/fact.reel".Fact# */ {

    isword: {
        value: false
    },

    verb: {
        value: null
    },

    subject: {
        value: null
    },

    mods: {
        distinct: true,
        value: []
    },

    modsController: {
        value: null
    },

    verbChange: {
        value: function (verb) {
            //this.modsController.content = [];
            var mod = Modifier.create();
            mod.label = "a";
            mod.wordType = "person";
            this.modsController.content = [mod];
            alert(verb);
        }
    }

});
