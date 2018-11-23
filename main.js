const { app, ipcMain, BrowserWindow, Menu } = require('electron')
var remote = require('electron').remote;
// 文档管理
let fs = require('fs')
// 加载配置
global['config'] = JSON.parse(fs.readFileSync("./config/setting.json" ))
// 主窗口
let mainWindow

const shell = require('electron').shell

// 创建主窗口
function StartWindow() {
  mainWindow = new BrowserWindow({
    width: global['config'].Width, 
    height: global['config'].Height, 
    // frame: false, 
    resizable: false,
    show: false,  
    backgroundColor: '#002b36',
    webPreferences: { webSecurity: false } })
  // mainWindow.setFullScreen(true)
  Menu.setApplicationMenu(null)
  mainWindow.loadFile('./index.html')
  if (global['config'].Develop)
    mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.on('ready-to-show', function() {
    mainWindow.show();
    mainWindow.focus();
  });
}

app.on('ready', StartWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('main-window-close', function () {
  mainWindow.close();
})

ipcMain.on('full-screen', function() {
  mainWindow.setFullScreen(!mainWindow.isFullScreen())
});

ipcMain.on('open-website',(event,arg) =>{
  shell.openExternal(arg)
})
