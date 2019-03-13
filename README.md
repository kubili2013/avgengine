# AVGEngine 使用手册

> 使用 Eletron 开发的桌面程序，能用 Html + Css + Js 快速开发文字冒险类的游戏。注重灵活性，扩展性，实用性。

## 文件夹结构

```
+--_avgengine               -- 引擎相关主文件夹  
|  +--_js                   -- js 文件夹  
   |  +--avgengine.pc.js    -- 引擎主逻辑控制脚本文件  
   |  +--*                  -- 其他文件均是依赖的文件
|  +--_style                -- 引擎样式文件夹  
   |  +--animation.css      -- 动画样式汇总  
   |  +--avgengine.css      -- 引擎界面样式  
+--_bgm                     -- 存放背景音乐  
+--_node_modules            -- 依赖的模块  
+--_config                  -- 配置文件  
|  +--_file                 -- 存档文件夹  
   |  +--setting.json       -- 主配置文件  
+--_sound                   -- 音效文件夹，放置音效  
+--_scene                   -- 场景文件夹，放置场景  
+-- index.html              -- 入口界面  
+-- .gitignore              -- Git 忽略提交的配置文件  
+-- LICENSE.md              -- 授权  
+-- main.js                 -- 入口脚本，Eletron 调用的主脚本文件   
+-- package.json            -- 前段供 npm 处理包依赖关系的文件  
+-- README.md               -- 使用文档，说明文件  
+-- AvgEngine-win32-x64.zip -- 一个不用编译的包，解压即可运行
```

## 快速开始
重新编译和加载依赖在中国将非常耗时耗心力（没有一定的前端基础尽量不要尝试），编译一次的话，有些得不偿失，会面临各式各样的问题，这里提供一个点击即可运行的包 [AvgEngine-V0.9.9-WIN32-X64.zip](https://github.com/kubili2013/avgengine/releases/download/Avgengine/AvgEngine-win32-x64.zip)。将压缩包解压之后，可以进入 `./AvgEngine-win32-x64/resources/app` 进行开发。

## index.html
`index.html` 中已经将大概的结构搭建完整，可以随意引入 `.css` 文件，改变其样式，也可以添加按钮扩展其功能。`index.html` 作为入口界面，已经调用 `AVGEngine.Init();` 初始化引擎，将播放音乐，读取配置文件等，全部准备好。

##  `*.scene.html`文件简介
> 用来书写故事情节，每个场景都有一场戏，场景互相关联构成了一个文字冒险游戏，其本质就是 `html` 文件

##  `*.scene.html` 中的 `<scene></scene>`
> `scene` 标签中写当前场景的游戏的故事线

## 支持标签
1. `p` 标签，文字对话
2. `img` 标签，图片（背景，人物等）
3. `aside` 标签，旁白
4. `div` 标签，选择框
5. `video` （计划支持）
6. `live2d` （计划支持）

> 注意！这些标签必须写在 `scene` 中，所有写在 `scene` 下的标签一律小写。

## 标签的简单用法

```html
<!--
* name:当前人物的名字
* b-s: 显示文字对话之前执行的脚本，JavaScript 脚本
* a-s: 文字对话结束后执行的脚本
* style="" 书写样式 
* class="" 引入样式类
*/
-->
<scene>
    <p name="ME" b-s="" a-s="" style="" class="">这是一段文字对话...</p>
    <img name="juese1" src="./scenes/images/yjsly.png" style="bottom:0px;left:200px;width:200px;" class="">
    <aside><h1>这是一段文字旁白...</h1></aside>
    <div>
        <button onclick="AVGEngine.Scenes.Change('Test','',AVGEngine.Next);" class="btn green">切换</button>
        <button onclick="AVGEngine.ShowPanel('SettingPanel');" class="btn green">设置</button>
    </div>
</scene>
```
## 设置

```json
{
    // 预设屏幕宽度
    "Width": 1920,
    // 预设屏幕高度
    "Height": 1080,
    // 默认是否播放背景音乐
    "BGM": false,
    // 默认是否开启音效
    "Sound": true,
    // 背景音 音量
    "BGMVolume": "10",
    // 音效音量
    "SoundVolume": "40",
    // 自动播放 暂时未实现
    "AutoPlay": false,
    // 文字自动弹出速度
    "AutoSpeed": "20",
    // 开发者状态 设置为 true 自动开启 eletron 开发者模式
    "Develop": false,
    // 调试状态 为 true 会在控制台输出日志
    "Debug": true,
    // 语言 暂时未实现切换语言
    "Language": "zh_CN",
    // 默认背景音乐
    "DefaultBGM": "bg.mp3"
}
```

## 音乐播放
1. 设置背景音乐音量 `AVGEngine.Setting.BGMVolume = 50`，取值范围 0-100 
1. 设置音效音乐音量 `AVGEngine.Setting.SoundVolume = 50`，取值范围 0-100 
1. 播放背景音乐 `AVGEngine.BGM.Play('音效音乐名称.mp3')`
1. 播放音效 `AVGEngine.Sound.Play('音效音乐名称.mp3')`，在 `sound` 文件夹下的文件，支持 `mp3`,`wav`,`ogg`
1. 切换背景音乐`AVGEngine.BGM.Change('背景音乐名称.mp3')`，在 `bgm` 文件夹下的文件，支持 `mp3`,`wav`,`ogg`
1. 暂停背景音乐`AVGEngine.BGM.Pause()`，在 `bgm` 文件夹下的文件，支持 `mp3`,`wav`,`ogg`

> 注意，音效和背景音乐不要混用，音效适合简短的音频。
## 动画相关
1. `AVGEngine` 预设了很多动画,存放在`./avgengine/style/animation.css`中，使用时用在标签上加入`class="动画名称"`即可，例如加入从左侧淡入的动画：
```
<img name="juese1" src="./scenes/images/yjsly.png" style="bottom:0px;left:200px;width:200px;" class="avg-animation-fadeinL">
```
2. 代码控制动画,适合在 `b-s` 或者 `a-s` 中使用。

例1，让 `name = "person_1"` 的图片晃动：
```
AVGEngine.Animate('person_1','swing')
```
例2，让 `name = "person_1"` 的图片平滑的移动到距离顶端 `10px` 距离左边 `100px`的地方
([具体实现是用JQuery的动画实现](https://www.runoob.com/jquery/jquery-animate.html))
```
AVGEngine.Animate('元素ID',{top:'10px',left:'100px'})
```

## 存档相关

* 相关功能已经事先预设好了，只需要修改界面样式至自己满意即可。
* 存档目前存在 `./config/file` 文件夹下。

## 场景相关

1. 转换场景
```
/**
* 可以嵌套文件夹
* 例如场景文件的路径是 ./scenes/part1/domo.scene.html 其中'/'用'-'代替
*/
AVGEngine.Scenes.Change('part1-domo')
```
2. 下一跳的方法，在场景中不用写下一跳代码，点击一下鼠标自动调用
```
AVGEngine.Next()
```
2. 跳到当前场景某个位置，例如跳到`scene`的第11个子标签：
```
/*
* 不要怀疑跳到第11个标签，就是要传10，因为程序都是从0开始数的，不是从1
*/
AVGEngine.Skip(10)
```
## 快捷预设方法（为了使书写的东西尽可能少一点，简化方法名）

1. A 方法，加动画
```
// 让某个 id 为 some_img 的元素宽度震颤，具体支持的动画详情，请见 “./avgengine/style/animation.css”
A("some_img","swing")
// 让某个 id 为 some_ele 的元素宽度平滑变为200像素，此处采用 jquery 的动画功能
A("some_ele",{witdh:200px})
// 让背景震颤
A("bg","shake")
```
2. B 方法，切换背景
```
// 只需要将背景图片放在“./scenes/background/”文件夹下，然后用下面的方式调用即可。
B("filename.jpg")
```
3. C 方法，换图片
```
// 给 name 为 some_one 的换图片
C("some_one", "./scenes/image/actors/some_one.jpg")
```
4. D 方法，退场
```
// 给 name 为 some_one 的图片平滑退场 其实就是移除这个元素，不过用了动画效果
D("some_one")
```
5. P 方法，播放音效
```
// 播放音效，自动去 sound 文件夹下寻找 audio.mp3 进行播放。
P("audio.mp3") 
```
5. M 方法，切换背景音乐
```
// 切换背景音乐，自动去 bgm 下找到 music.mp3
M("music.mp3") 
```
6. T 方法，切换场景
```
// 切换到“./scenes”文件夹下的 1_1.scene.html
T("1_1")
```

## 打包

1. 运行命令
```
npm run asar
```
2. 运行完成后，会在工程根目录下产生一个 `app.asar` 文件，将这个文件塞入`eletron` 编译好的工程根目录 `./resource` 文件夹下，就可以运行。

## 依赖项目

* [jquery@3.3.1](https://github.com/jquery/jquery)
* [eletron@^2.0.0](https://electronjs.org/)
* [greenwork](https://github.com/greenheartgames/greenworks)
* [sweetalert2]()

## 开源协议
遵从 [`MIT`](https://mit-license.org/) 开源协议
