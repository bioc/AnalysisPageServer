/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "./ParameterModel"], 
function(Bacon, ParameterModel) {
    return ParameterModel.extend({
        initialize: function() {
            /**
             * @see EXPRESSIONPLOT-415
             * it's impossible to send file content nested in json
             * so provide reference to file content here and append
             * file content under this id to the request body
             */
            this.set(this.getFileKeyName(), _.uniqueId("file-"));
            ParameterModel.prototype.initialize.apply(this, arguments);
        },
        getFileKeyName: function() {
            return "___APS_fileContentId___";
        },
        getFileKey: function() {
            return this.get(this.getFileKeyName());
        },
        hasValue: function() {
            return !!this.file;
        },
        setValue: function(value, opts) {
            opts = opts || {};
            var oldFile = this.file;
            this.file = value;
            if (oldFile !== this.file) {
                this.trigger("change:value", this, value, opts);
            }
            // sometimes a value may not be different than previous one
            // so fire additional event
            this.trigger("set:value", this, value, opts);
        },
        unsetValue: function(opts) {
            opts = opts || {};
            delete this.file;
            this.trigger("set:value", this, void 0, _.extend({unset: true}, opts));
        },
        getValue: function() {
            return this.file;
        },
        _toJSONMapper: function(mode, attributes, isActive) {
            var isSimple = ! attributes || (attributes && attributes.length === 1),
                json;
            if (! isActive) return "__inactive__";
            if (isSimple) {
                json = {};
                json[this.getFileKeyName()] = this.getFileKey();
            }
            else {
                json = {};
                _.each(attributes, function(attr) {
                    json[attr] = this.get(attr);
                }, this);
            }
            return json;
        }
    });
});