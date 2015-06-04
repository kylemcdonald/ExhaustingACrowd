var GLOBAL = (function () {
    function GLOBAL() {
    }
    GLOBAL.playerMode = function () {
        return GLOBAL.MODE == 'PLAYER';
    };
    GLOBAL.editorMode = function () {
        return GLOBAL.MODE == 'EDITOR';
    };
    GLOBAL.MODE = "PLAYER";
    return GLOBAL;
})();
