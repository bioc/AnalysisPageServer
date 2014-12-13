/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["jquery", "hogan", "requirejs-text!views/templates.html"], function($, hogan, templatesHtml) {
    
    var $tmplRoot = $(templatesHtml);
    
    var compiled = {};
    
    return {
        render: function(id, data) {
            if (typeof compiled[id] === "undefined") {
                var $tmplEl = $tmplRoot.find("#"+id);
                if (! $tmplEl.length) throw new Error("Cannot find template with id '"+id+"'");
                var txt = $tmplEl.html();
                compiled[id] = hogan.compile(txt);
            }
            return compiled[id].render(data);
        }
    };
});