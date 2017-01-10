/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 */
export default {
    requestFullscreen:  function(el) {
        var f = el.requestFullscreen || el.mozRequestFullScreen ||
                el.webkitRequestFullscreen || el.webkitRequestFullScreen ||
                el.msRequestFullscreen;
        f && f.call(el);
    },
    cancelFullscreen:   function() {
        var f = document.cancelFullscreen || document.mozCancelFullScreen ||
                document.webkitCancelFullScreen ||
                document.msCancelFullscreen;
        f && f.call(document);
    },

    fullscreenElement:  function() {
        return document.fullscreenElement || document.mozFullScreenElement
                    || document.webkitFullscreenElement || /*Safari 5.1*/document.webkitCurrentFullScreenElement;
    }
};
