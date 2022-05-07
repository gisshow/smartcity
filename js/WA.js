function closebut( ) {

    const $ = require('jquery');
    const remote = window.require("@electron/remote");
    const { getCurrentWebContents, getCurrentWindow, dialog } = remote;
    const webContents = getCurrentWebContents();
    const currentWindow = getCurrentWindow();

    var win = remote.getCurrentWindow();
    win.close();

}


function maxbut( ) {

    const $ = require('jquery');
    const remote = window.require("@electron/remote");
    const { getCurrentWebContents, getCurrentWindow, dialog } = remote;
    const webContents = getCurrentWebContents();
    const currentWindow = getCurrentWindow();

    var win = remote.getCurrentWindow();

    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }

}



function minbut( ) {

    const $ = require('jquery');
    const remote = window.require("@electron/remote");
    const { getCurrentWebContents, getCurrentWindow, dialog } = remote;
    const webContents = getCurrentWebContents();
    const currentWindow = getCurrentWindow();

    var win = remote.getCurrentWindow();
    win.minimize();

}





module.exports = { maxbut,minbut,closebut }