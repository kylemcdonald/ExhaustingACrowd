class GLOBAL {
    static MODE:string = "PLAYER";

    static playerMode() {
        return GLOBAL.MODE == 'PLAYER';
    }

    static editorMode() {
        return GLOBAL.MODE == 'EDITOR';
    }
}
