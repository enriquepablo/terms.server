
var Montage = require("montage").Montage;

exports.Controller = Montage.create(Montage, {

    handleMouseover: {
        value: function (event) {
            alert(this.element.value);
        }
    }

});
