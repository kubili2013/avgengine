const { app, ipcMain, BrowserWindow } = require('electron')
// 文档管理
let fs = require('fs')
// 加载配置
global['config'] = JSON.parse(fs.readFileSync("./config/setting.json" ))
// 主窗口
let mainWindow
// 创建主窗口
function StartWindow() {
  mainWindow = new BrowserWindow({ width: global['config'].Width, height: global['config'].Height, frame: false, resizable: false, webPreferences: { webSecurity: false } })
  mainWindow.setFullScreen(true)
  mainWindow.loadFile('./index.html')
  if (global['config'].Develop)
    mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
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
