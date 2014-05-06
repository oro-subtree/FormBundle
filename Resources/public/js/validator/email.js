/*global define*/
define(['jquery', 'underscore', 'orotranslation/js/translator', 'jquery.validate'
    ], function ($, _, __) {
    'use strict';

    var defaultParam = {
        message: 'This value is not a valid email address.'
    };

    /**
     * @export oroform/js/validator/email
     */
    return [
        'Email',
        function () {
            // @TODO add support of MX check action
            return $.validator.methods.email.apply(this, arguments);
        },
        function (param, element) {
            var value = this.elementValue(element),
                placeholders = {};
            param = _.extend({}, defaultParam, param);
            placeholders.value = value;
            return __(param.message, placeholders);
        }
    ];
});
