define(["marionette", "requirejs-text!templates.html"], function(Marionette, templatesHtml) {
    var $templatesRoot = $(templatesHtml);
    Marionette.TemplateCache.prototype.loadTemplate = function(templateId) {
        var template = $templatesRoot.find(templateId).html();
        if (!template || template.length === 0) {
            throw new Marionette.Error({
                name: 'NoTemplateError',
                message: 'Could not find template: "' + templateId + '"'
            });
        }
        return template;
    };
});