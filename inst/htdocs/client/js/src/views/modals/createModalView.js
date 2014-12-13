/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/modals/ModalView", "views/modals/ErrorModalView"], function(ModalView, ErrorModalView) {
    return function(opts) {
        var type = opts.modalType;
        delete opts.modalType;
        switch(type) {
            case "error":
                return new ErrorModalView(opts);
            default:
                return new ModalView(opts);
        }
    }
});