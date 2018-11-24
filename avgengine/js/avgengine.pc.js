// 文档管理
var fs = require('fs')
var path = require('path')
// 引入 Jquery
window.jQuery = window.$ = require(path.join(__dirname,'./avgengine/js/jquery.min.js'))
// 引入 electron 主进程通讯模块
const { ipcRenderer } = require('electron')

const swal = require(path.join(__dirname,'./avgengine/js/sweetalert2.min.js'))
const Toast = swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    customClass: "sweetalert-custom-toast",
    timer: 3000
});

// 替换全部
String.prototype.replaceAll=function(f,e){
    var reg=new RegExp(f,"ig")
    return this.replace(reg,e)
}

// 引入 Steam Works
var greenworks = require(path.join(__dirname,'./avgengine/js/greenworks.js'))
var AVGEngine = {
    // 设置
    Setting: {
        Width: 1920,
        Height: 1080,
        BGM: true,
        Sound: true,
        BGMVolume: 100,
        SoundVolume: 100,
        AutoPlay: false,
        AutoSpeed: 500,
        Develop: true,
        Debug: true,
        Language: 'zh_CN',
        DefaultBGM: "CR2_Beautiful_Day_FULL_Loop.wav"
    },
    TempContent:"",
    Files: [],
    Time: {
        That: null,
        Count: 0,
        CountInit: function () {
            AVGEngine.Time.Count = 1 + AVGEngine.Time.Count
            AVGEngine.Time.That = setTimeout("AVGEngine.Time.CountInit()", 1000)
            
            AVGEngine.Log("Timer:" + AVGEngine.Time.Count)
            // 每当20秒自动保存一次
            if(AVGEngine.Time.Count % 10 == 0 && $('.scene').length > 0){
                AVGEngine.AutoSave()
            }
        }
    },
    NextFlag:true,
    // 存放自定义字段
    Custom:{},
    // 初始化
    Init: function () {
        try {
            if (!greenworks.init()) {
                AVGEngine.Log('加载 SteamWorks 失败！')
                AVGEngine.Toast({type:"error",title:" SteamWorks 加载失败！"})
            }

        } catch (e) { 
            console.log(e) 
            AVGEngine.Toast({type:"error",title:" SteamWorks 加载失败！"}) 
        }
        if (AVGEngine.Time.That == null) {
            // 计时器 只能执行一次
            AVGEngine.Time.CountInit()
        }
        // 设置 Body
        this.LoadSetting()
        this.BGM.Init()
        // 获取所有存档
        this.GetFiles();
        // 设置属性
        if (AVGEngine.Setting.BGM)
            $('#MusicSwitch').attr('checked', true)
        if (AVGEngine.Setting.Sound)
            $('#SoundSwitch').attr('checked', true)

        // this.AudioDuoRuMi.BindingClick("button")
        this.AudioDuoRuMi.BindingHover("button")

        if (AVGEngine.Setting.BGM) {
            AVGEngine.BGM.Play()
        }
        
        $('.music-switch').click(function () {
            AVGEngine.Setting.BGM = !AVGEngine.Setting.BGM
            $('.music-switch').addClass(AVGEngine.Setting.BGM ? "open" : "close")
            if (AVGEngine.Setting.BGM) {
                AVGEngine.BGM.Play()
            } else {
                AVGEngine.BGM.Pause()
            }
        });

        $("input[name=SoundVolume]").val(AVGEngine.Setting.SoundVolume);
        $("input[name=BGMVolume]").val(AVGEngine.Setting.BGMVolume);
        $("input[name=AutoSpeed]").val(AVGEngine.Setting.AutoSpeed);

        $("input[name=SoundVolume]").on('change', function () {
            AVGEngine.Setting.SoundVolume = this.value
        })
        $("input[name=BGMVolume]").on('change', function () {
            AVGEngine.BGM.SetVolumn($(this).val())
        })
        $("input[name=AutoSpeed]").on('change', function () {
            AVGEngine.Setting.AutoSpeed = this.value
        })

        
        $('.sound-switch').click(function () {
            AVGEngine.Setting.Sound = !AVGEngine.Setting.Sound
            $('.music-switch').addClass(AVGEngine.Setting.Sound ? "open" : "close")
        });

        $('#ClickPanel, #ActorDialog').click(function(){
            AVGEngine.Next();
        })
        // 
        $(document).keypress(function(e) {
        　　if (e.which == 32 && !$("#ScenePanel").is(":hidden") && $("#ScenePanel").css("display") != 'none'){
    　　        AVGEngine.Next()
                return false
            }
        })
        // 旁白 点击隐藏自己
        $('#AsidePanel').click(function(){
            AVGEngine.HidePanel('AsidePanel')
            AVGEngine.NextFlag = true
        })
        
    },
    Animate: function (id, animation) {
        $("#" + id).removeClass()
        if (typeof animation == 'string') {
            $("#" + id).addClass("avg-animation-" + animation)
            setTimeout('$("#' + id + '").removeClass("avg-animation-' + animation + '")',1000)
        } else if (typeof animation == 'object') {
            $("#" + id).animate(animation);
        }
    },
    // 解锁 Steam 成就
    ActivateAchievement: function (Achievement) {
        try {
            if (!greenworks.init()) {
                if (AVGEngine.Setting.Debug)
                    this.Log('加载 Steam Works 失败！')
                AVGEngine.Toast({type:"error",title:" SteamWorks 加载失败！"})
            }
            greenworks.activateAchievement(Achievement, function () { AVGEngine.Log(Achievement + " is Success") }, function (err) { AVGEngine.Log('NEW_ACHIEVEMENT_0_4 Failed:' + err); })
        } catch (e) { console.log(e) }
    },
    // 获取本地路径
    LocalPath: function () { return  "./" },
    // 加载设置
    LoadSetting: function () {
        try {
            let data = fs.readFileSync(this.LocalPath() + '/config/setting.json')
            this.Setting = JSON.parse(data)
            this.Log(JSON.stringify(this.Setting))
        } catch (e) {
            AVGEngine.SaveSetting()
        }
    },
    // 保存设置
    SaveSetting: function () {
        try {
            fs.writeFile(AVGEngine.LocalPath() + '/config/setting.json', JSON.stringify(this.Setting, null, 4), function (err) {
                if (err) {
                    AVGEngine.Log(err)
                } else {
                    AVGEngine.Log("游戏设置保存成功！")
                    AVGEngine.Toast({type:"success",title:"游戏设置保存成功！"})
                }
            })
        } catch (e) {
            AVGEngine.Log("游戏设置保存失败！")
            AVGEngine.Toast({type:"success",title:"游戏设置保存失败！原因未知"})
        }
    },
    /** SceneName 名称 Animation 加载或隐藏的动画 */
    NewGame: function (SceneName, animation) {
        // 清空
        $('.scene').remove()
        AVGEngine.Scenes.Change(SceneName, animation, "AVGEngine.Next");
    },
    Continue: function (index) {
        $('.scene').remove()
        try {
            let file ;
            if(index == undefined){
                file = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/file-temp.json')
                file = JSON.parse(file)
                AVGEngine.TempContent = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/content/content-temp.txt')
            }else{
                file = AVGEngine.Files[index]
                // file = JSON.parse(file)
                AVGEngine.TempContent = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/content/' + file.filename.substr(0,file.filename.length-5) + '.txt')
            
            }
            AVGEngine.Scenes.CurrentScene = file.scene
            AVGEngine.Scenes.Current = file.index - 1
            AVGEngine.Scenes.Name = file.name
            AVGEngine.Scenes.Background = file.background
            AVGEngine.Custom = file.custom
            AVGEngine.ShowPanel('ScenePanel')
            $('#ScenePanel').append(file.content + "<script>$('#" + AVGEngine.Scenes.CurrentScene + "').show(100,function(){AVGEngine.Scenes.LoadList(AVGEngine.Scenes.GetSceneByName('" 
            + AVGEngine.Scenes.CurrentScene + "'),"
            + AVGEngine.Scenes.Current + ",AVGEngine.Next)});"
            + "AVGEngine.Scenes.ChangeBackground('" + file.background + "');"
            + "</script>")
            // AVGEngine.Scenes.Change(file.scene,"","AVGEngine.Next")
        } catch (e) {
            AVGEngine.Log(e)
            AVGEngine.Toast({type:"info",title:"没有临时游戏内容，游戏将从头开始！"})
            AVGEngine.NewGame('Main', '', AVGEngine.Next)
        }
        
    },
    ShowPanel: function (id, animation) {
        // let anima = arguments[1] ? arguments[1] : 'avg-animation-fadeinL'
        // $('#' + id + " > article").addClass(anima)
        // $('#' + id).addClass('z-show')
        $('#' + id).fadeIn(500, function() {
            
        });
    },
    HidePanel: function (id, animation) {
        // let anima = arguments[1] ? arguments[1] : 'avg-animation-fadeoutR'
        // $('#' + id + " > article").addClass(anima)
        // $('#'+ id ).removeClass('z-show');
        $('#' + id).fadeOut(500, function() {
            $('#' + id).hide()
        });
        // setTimeout("$('#" + id + "').removeClass('z-show'); $('#" + id + " > article').removeClass('" + anima + "');", 300)
    },
    SaveTempContent:function(){
        try {
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/content/content-temp.txt', AVGEngine.TempContent , function (err) {
                if (err) {
                    AVGEngine.Log(err)
                } else {
                    AVGEngine.Log("临时内容保存成功！")
                }
            })
        } catch (e) {
            AVGEngine.Log("临时内容保存失败！" + e)
        }
    },
    SaveTempFile: function () {
        try {
            let data = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/file-temp.json')
            data = JSON.parse(data)
            data.datetime = (new Date()).valueOf()
            data.name = AVGEngine.Scenes.Name
            data.scene = AVGEngine.Scenes.CurrentScene
            file.background = AVGEngine.Scenes.Background
            data.index = AVGEngine.Scenes.Current
            data.content = $("#" + AVGEngine.Scenes.CurrentScene).prop("outerHTML")
            data.content = data.content;
            data.custom = AVGEngine.Custom
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/file-temp.json', JSON.stringify(data, null, 4), function (err) {
                if (err) {
                    AVGEngine.Log(err)
                } else {
                    AVGEngine.Log("临时存档保存成功！")
                    // AVGEngine.Toast({type:"success",title:"临时存档保存成功！"})
                }
            })

        } catch (e) {
            let file = {
                datetime:(new Date()).valueOf(),
                scene:AVGEngine.Scenes.CurrentScene,
                background:AVGEngine.Scenes.Background,
                index:AVGEngine.Scenes.Current,
                name:AVGEngine.Scenes.Name,
                custom: AVGEngine.Custom,
                content: $("#" + AVGEngine.Scenes.CurrentScene).prop("outerHTML").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi , "")
            }
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/file-temp.json', JSON.stringify(file, null, 4), function (err) {
                if (err) {
                    AVGEngine.Log(err)
                } else {
                    AVGEngine.Log("临时存档保存成功！")
                    AVGEngine.Toast({type:"success",title:"临时存档保存成功！"})
                }
            })
            
        }
    },
    // 保存存档
    SaveFile: function () {
        try {
            let data = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/file-temp.json')
            data = JSON.parse(data)
            let random_str = Math.random().toString(36).substr(2)
            data.filename = random_str + '.json'
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/' + data.filename, JSON.stringify(data, null, 4), function (err) {
                if (err) {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log("游戏存档保存成功！")
                        AVGEngine.Toast({type:"success",title:"游戏存档保存成功！"})
                        AVGEngine.GetFiles()
                }
            })
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/content/' + random_str + '.txt',AVGEngine.TempContent, function (err) {
                if (err) {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log("故事保存成功！")
                    
                }
            })
        } catch (e) {
            AVGEngine.Log("保存存档异常！")
            AVGEngine.Toast({type:"error",title:"保存存档异常！原因未知！请重试！"})
        }
    },
    AutoSave: function(){
        if(!$("#ScenePanel").is(":hidden") && $("#ScenePanel").css("display") != 'none'){
            this.SaveTempFile()
            this.SaveTempContent()
        }
    },
    GetFiles: function () {
        AVGEngine.Files = []
        fs.readdir(AVGEngine.LocalPath() + "/config/file", function (err, files) {
            if (err) {
                AVGEngine.Log("获取存档失败！")
                return
            }
            files.forEach(function (filename) {
                let filedir = path.join(AVGEngine.LocalPath() + "/config/file", filename)
                let file_stats = fs.statSync(filedir)
                if (!file_stats.isDirectory() &&  filename != 'file-temp.json') {
                    let data = fs.readFileSync(filedir)
                    AVGEngine.Files.push(JSON.parse(data))
                    AVGEngine.Log(JSON.parse(data))
                }
            })
            AVGEngine.FilesToUI()
        });
    },
    FilesToUI:function(){    
        let html = ""
        AVGEngine.Files.forEach(function(item, index){
           html += '<div class="file-item" data-item-index=' + index + ' ><p>' + item.name + '</p><p>' + AVGEngine.Format(item.datetime,"yyyy-MM-dd HH:mm") + '</p></div>' 
        })
        html += "<script>$('.file-item').click(function(){$(this).siblings().removeAttr('checked');if($(this).attr('checked')){$(this).removeAttr('checked');}else{$(this).attr('checked','');}})</script>"
        $("#FilePanel .file-area").html(html)
    },
    DeleteFile:function(){
        $('.file-item[checked]').each(function(item, index){
            let i = $(this).attr('data-item-index')
            let data = AVGEngine.Files[parseInt(i)]
            fs.unlinkSync(AVGEngine.LocalPath() + "/config/file/" + data.filename);
            fs.unlinkSync(AVGEngine.LocalPath() + "/config/file/content/" + data.filename.replace(".json",".txt"));
            AVGEngine.Files.splice(parseInt(i),1)
            AVGEngine.FilesToUI()
            $(this).remove()
            AVGEngine.Toast({type:"success",title:"游戏存档删除成功！"})
        })
    },
    ContinueFile:function(){
        let index = $('.file-item[checked]').attr('data-item-index')
        AVGEngine.Continue(index)
        AVGEngine.HidePanel('FilePanel')
    },
    Scenes: {
        Name:"",
        Background:"",
        List: [],
        // 当前场景
        CurrentScene: "-",
        // 当前位置
        Current: 0,
        // 当前场景操作流
        CurrentSceneList: [],
        Init: function () {

        },
        Change: function (SceneName, animation,callback) {
            AVGEngine.Scenes.CurrentSceneList = []
            AVGEngine.Scenes.Current = 0
            AVGEngine.ShowPanel('ScenePanel')
            $('#' +SceneName).remove();
            $('#ScenePanel').append("<div id='" + SceneName + "' class='scene " 
            + animation + "' ><script>$('#"+SceneName+"').show(100,function(){AVGEngine.Scenes.LoadList(AVGEngine.Scenes.GetSceneByName('" + SceneName + "'),0,"+
            callback +");$('.scene').not('#" + SceneName + "').remove();});</script></div>")
            // let PreScene = this.CurrentScene
            this.CurrentScene = SceneName
            // if ($("#" + PreScene).length != 0 && PreScene != SceneName ) {
            //     $("#" + PreScene).hide(500, function () {
                    
            //     })
            // }
            
        },
        GetSceneByName: function (SceneName) {
            let path_str = path.join(__dirname,'./scenes/' + SceneName.replace("-", "/") + ".scene.html");
            let scene = fs.readFileSync(path_str)
            return scene.toString();
        },
        LoadList:function(Scene,current,callback){
            AVGEngine.Scenes.Name =  $(Scene).attr('name')
            AVGEngine.Scenes.Background = $(Scene).attr('background')
            $(Scene).children().each(function(){
                let obj = {
                    type:$(this)[0].tagName,
                    name:$(this).attr('name'),
                    style:$(this).attr('style'),
                    before_script:$(this).attr('b-s'),
                    after_script:$(this).attr('a-s'),
                    text:$(this).html(),
                    that:$(this)
                }
                AVGEngine.Scenes.CurrentSceneList.push(obj)
            });
            AVGEngine.Scenes.Current = current;
            if(callback !=undefined){
                callback()
            }else{
                AVGEngine.Next()
            }
        },
        ChangeBackground:function(background){
            if(background.indexOf("scenes/images/background/") < 0 ){
                background = "./scenes/images/background/" + background
            }
            if($("#ScenePanelBG1").css("z-index") > $("#ScenePanelBG2").css("z-index")){
                $("#ScenePanelBG2").attr('src',background)
                $("#ScenePanelBG1").fadeOut(500, function() {
                    $("#ScenePanelBG1").css("z-index",98)
                });
                $("#ScenePanelBG2").fadeIn(1000, function() {
                })
            }else{
                $("#ScenePanelBG1").attr('src',background)
                $("#ScenePanelBG2").fadeOut(500, function() {
                    $("#ScenePanelBG1").css("z-index",99)
                });
                $("#ScenePanelBG1").fadeIn(1000, function() {
                })
            }
            AVGEngine.Scenes.Background = background
        },
        DeleteActor:function(id){
            $("#"+id).fadeOut(500,function(){
                $(this).remove()
            })
        }
    },
    // 点击事件
    Next: function () {
        if(!AVGEngine.NextFlag){
            return
        }
        if(AVGEngine.Scenes.Current == 0){
            AVGEngine.Scenes.ChangeBackground(AVGEngine.Scenes.Background)
            // $('#' + AVGEngine.Scenes.CurrentScene).css('background-image','url(' + AVGEngine.Scenes.Background + ')')
        }
        AVGEngine.NextFlag = false;
        // 判断事件 文字下一句
        AVGEngine.Log('Next!');
        // 文字弹出，弹出完整之后再执行 Next()
        if( AVGEngine.Scenes.Current >= AVGEngine.Scenes.CurrentSceneList.length){
            AVGEngine.NextFlag = true
            return
        }
        let curr = AVGEngine.Scenes.CurrentSceneList[AVGEngine.Scenes.Current]
        if(curr == undefined){
            AVGEngine.NextFlag = true
            AVGEngine.Log('本章已经结束，请检查代码是否无误！');
            return 
        }
        AVGEngine.Scenes.Current++;
        switch (curr.type){
            case "P":
                $("#SceneDialog").show();
                if(curr.before_script != undefined && curr.before_script != ""){
                    try{eval(curr.before_script)}catch(e){AVGEngine.Log(e)}
                }
                $("#NameDialog").html(curr.name)
                // 执行
                AVGEngine.TextAuto(curr.text,function(){
                    if(curr.after_script != undefined && curr.after_script != ""){
                        try{eval(curr.after_script)}catch(e){AVGEngine.Log(e)}
                    }
                    AVGEngine.NextFlag = true;
                })
                // 保存
                AVGEngine.TempContent = AVGEngine.TempContent + curr.name + ":" + curr.text + "\r\n"
                break;
            case "IMG":
                if(curr.before_script != undefined && curr.before_script != ""){
                    try{eval(curr.before_script)}catch(e){AVGEngine.Log(e)}
                }
                let img = curr.that
                img.attr("id",curr.name)
                if($("#" + curr.name).length > 0){
                    $("#" + curr.name).fadeOut(500,function(){
                        $(this).remove()
                        $('#'+ AVGEngine.Scenes.CurrentScene).append(img)
                    })
                }else{
                    $('#'+ AVGEngine.Scenes.CurrentScene).append(img)
                }
                if(curr.after_script != undefined && curr.after_script != ""){
                    try{eval(curr.after_script)}catch(e){AVGEngine.Log(e)}
                }
                AVGEngine.NextFlag = true;
                break;
            case "DIV":
                if(curr.before_script != undefined && curr.before_script != ""){
                    try{eval(curr.before_script)}catch(e){AVGEngine.Log(e)}
                }
                let div = curr.that
                AVGEngine.ShowPanel('ChooseDialogPanel')
                $('#ChooseDialogPanel').html(div)
                $('#ChooseDialogPanel button').click(function(){
                    AVGEngine.HidePanel('ChooseDialogPanel') 
                    AVGEngine.NextFlag = true
                })
                if(curr.after_script != undefined && curr.after_script != ""){
                    try{eval(curr.after_script)}catch(e){AVGEngine.Log(e)}
                }
                break;
            case "ASIDE":
                if(curr.before_script != undefined && curr.before_script != ""){
                    try{eval(curr.before_script)}catch(e){AVGEngine.Log(e)}
                }
                let text = curr.text
                AVGEngine.ShowPanel('AsidePanel')
                $('#AsidePanel').html("<span>" + text + "</span>")
                if(curr.after_script != undefined && curr.after_script != ""){
                    try{eval(curr.after_script)}catch(e){AVGEngine.Log(e)}
                }
                break;
            default:
                AVGEngine.NextFlag = true
                break;
        }
        
    },
    Skip: function (index) {
        AVGEngine.Scenes.Current = index
        AVGEngine.Next()
    },
    // 
    TextAuto: function (text,callback) {
        
        let str = text;
        let index = 0;
        //$text.html()和$(this).html('')有区别
        var timer = setInterval(function () {
            //substr(index, 1) 方法在字符串中抽取从index下标开始的一个的字符
            var current = str.substr(index, 1);
            if (current == '<') {
                //indexOf() 方法返回">"在字符串中首次出现的位置。
                index = str.indexOf('>', index) + 1;
            } else {
                index++;
            }
            //console.log(["0到index下标下的字符",str.substring(0, index)],["符号",index & 1 ? '_': '']);
            //substring() 方法用于提取字符串中介于两个指定下标之间的字符
            $("#ActorDialog > p:eq(1)").html(str.substring(0, index) +  '&nbsp;&nbsp;❤');
            if (index >= str.length) {
                clearInterval(timer);
                callback();
            }
        },100-AVGEngine.Setting.AutoSpeed);
    },
    // 播放背景音乐
    BGM: {
        That: '#avgengine_bgm',
        Music: function () { return "./bgm/" + AVGEngine.Setting.DefaultBGM },
        Init: function () {
            $('body').append('<audio id="avgengine_bgm" src="' + AVGEngine.BGM.Music() + '" style="height:0px" loop="loop"></audio>')
        },
        Play: function () {
            if (!AVGEngine.Setting.BGM) { return }
            if ($(AVGEngine.BGM.That).length <= 0) {
                AVGEngine.BGM.Init()
            }
            AVGEngine.BGM.SetVolumn(AVGEngine.Setting.BGMVolume)
            $(AVGEngine.BGM.That)[0].play()
        },
        Pause: function () {
            $(AVGEngine.BGM.That)[0].pause()
        },
        SetVolumn: function (vol) {
            $(AVGEngine.BGM.That)[0].volume = vol / 100
            AVGEngine.Setting.BGMVolume = vol
            AVGEngine.SaveSetting()
        },
        Change: function (bgmName) {
            AVGEngine.BGM.Pause()
            $(AVGEngine.BGM.That).attr('src', "./bgm/" + bgmName)
            AVGEngine.Setting.DefaultBGM = bgmName
            AVGEngine.BGM.Play()
            AVGEngine.SaveSetting()
        }
    },
    // 播放音效
    Sound: {
        That: '#avgengine_sound',
        Init: function () {
            $('body').append('<audio id="avgengine_sound" src="' + AVGEngine.BGM.Music() + '"  style="height:0px"></audio>')
        },
        Play: function (soundName) {
            if (!AVGEngine.Setting.Sound) { return }
            if ($(AVGEngine.Sound.That).length <=0) {
                AVGEngine.Sound.Init()
            }
            $(AVGEngine.Sound.That)[0].pause()
            $(AVGEngine.Sound.That).attr('src', "./sound/" + soundName)
            $(AVGEngine.Sound.That)[0].play()
        }
    },
    Log: function (msg) {
        if (this.Setting.Debug) {
            console.log(msg)
        }
        
    },
    Toast:function(obj){
        Toast(obj)
    },
    OpenWebsite:function(url){
        ipcRenderer.send("open-website",url)
    },
    // 关闭主窗口
    Quit: function () {
        ipcRenderer.send("main-window-close")
    },
    AudioDuoRuMi: {
        Frequency: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50],
        Audio: new AudioContext(),
        StartFrequency: 0,
        Direction: 1,
        Play: function () {
            if (!AVGEngine.Setting.Sound)
                return
            var frequency = AVGEngine.AudioDuoRuMi.Frequency[AVGEngine.AudioDuoRuMi.StartFrequency]
            // 如果到头，改变音调的变化规则（增减切换）
            if (!frequency) {
                AVGEngine.AudioDuoRuMi.Direction = -1 * AVGEngine.AudioDuoRuMi.Direction
                AVGEngine.AudioDuoRuMi.StartFrequency = AVGEngine.AudioDuoRuMi.StartFrequency + 2 * AVGEngine.AudioDuoRuMi.Direction
                frequency = AVGEngine.AudioDuoRuMi.Frequency[AVGEngine.AudioDuoRuMi.StartFrequency]
            }
            // 改变索引，下一次hover时候使用
            AVGEngine.AudioDuoRuMi.StartFrequency = AVGEngine.AudioDuoRuMi.StartFrequency + AVGEngine.AudioDuoRuMi.Direction

            // 创建一个OscillatorNode, 它表示一个周期性波形（振荡），基本上来说创造了一个音调
            var oscillator = AVGEngine.AudioDuoRuMi.Audio.createOscillator()
            // 创建一个GainNode,它可以控制音频的总音量
            var gainNode = AVGEngine.AudioDuoRuMi.Audio.createGain()
            // 把音量，音调和终节点进行关联
            oscillator.connect(gainNode)
            // audioCtx.destination返回AudioDestinationNode对象，表示当前audio context中所有节点的最终节点，一般表示音频渲染设备
            gainNode.connect(AVGEngine.AudioDuoRuMi.Audio.destination)
            // 指定音调的类型，其他还有square|triangle|sawtooth
            oscillator.type = 'sine'
            // 设置当前播放声音的频率，也就是最终播放声音的调调
            oscillator.frequency.value = frequency
            // 当前时间设置音量为0
            gainNode.gain.setValueAtTime(0, AVGEngine.AudioDuoRuMi.Audio.currentTime)
            // 0.01秒后音量为1
            gainNode.gain.linearRampToValueAtTime(AVGEngine.Setting.SoundVolume / 100, AVGEngine.AudioDuoRuMi.Audio.currentTime + 0.01)
            // 音调从当前时间开始播放
            oscillator.start(AVGEngine.AudioDuoRuMi.Audio.currentTime)
            // 1秒内声音慢慢降低，是个不错的停止声音的方法
            gainNode.gain.exponentialRampToValueAtTime(0.001, AVGEngine.AudioDuoRuMi.Audio.currentTime + 1)
            // 1秒后完全停止声音
            oscillator.stop(AVGEngine.AudioDuoRuMi.Audio.currentTime + 1)
        },
        BindingHover: function (selector) {
            $(selector).on('mouseenter', function () {
                AVGEngine.AudioDuoRuMi.Play()
            })
        },
        BindingClick: function (selector) {
            $(selector).on('click', function () {
                AVGEngine.AudioDuoRuMi.Play()
            })
        }

    },
    FullScreen:function(){
        ipcRenderer.send("full-screen")
    },
    Format:function(now,mask)
    {
        var d = new Date(now);
        var zeroize = function (value, length)
        {
            if (!length) length = 2;
            value = String(value);
            for (var i = 0, zeros = ''; i < (length - value.length); i++)
            {
                zeros += '0';
            }
            return zeros + value;
        };
     
        return mask.replace(/"[^"]*"|'[^']*'|\b(?:d{1,4}|m{1,4}|yy(?:yy)?|([hHMstT])\1?|[lLZ])\b/g, function ($0)
        {
            switch ($0)
            {
                case 'd': return d.getDate();
                case 'dd': return zeroize(d.getDate());
                case 'ddd': return ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'][d.getDay()];
                case 'dddd': return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
                case 'M': return d.getMonth() + 1;
                case 'MM': return zeroize(d.getMonth() + 1);
                case 'MMM': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
                case 'MMMM': return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()];
                case 'yy': return String(d.getFullYear()).substr(2);
                case 'yyyy': return d.getFullYear();
                case 'h': return d.getHours() % 12 || 12;
                case 'hh': return zeroize(d.getHours() % 12 || 12);
                case 'H': return d.getHours();
                case 'HH': return zeroize(d.getHours());
                case 'm': return d.getMinutes();
                case 'mm': return zeroize(d.getMinutes());
                case 's': return d.getSeconds();
                case 'ss': return zeroize(d.getSeconds());
                case 'l': return zeroize(d.getMilliseconds(), 3);
                case 'L': var m = d.getMilliseconds();
                    if (m > 99) m = Math.round(m / 10);
                    return zeroize(m);
                case 'tt': return d.getHours() < 12 ? 'am' : 'pm';
                case 'TT': return d.getHours() < 12 ? 'AM' : 'PM';
                case 'Z': return d.toUTCString().match(/[A-Z]+$/);
                // Return quoted strings with the surrounding quotes removed
                default: return $0.substr(1, $0.length - 2);
            }
        });
    }
}

function ExitGame(){
    swal({
        title: '确定退出游戏！',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        backdrop: "rgba(0,0,0,0.9)",
        allowOutsideClick: true
    }).then(
        (result) => {
            if (result.value) {
                AVGEngine.Quit()
            } else if (result.dismiss === swal.DismissReason.cancel) {

            }
        }
    )
}

function DeleteFile(){
    swal({
        title: '确定要删除选中的存档吗！删除之后不可恢复！',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        backdrop: "rgba(0,0,0,0.9)",
        allowOutsideClick: true
    }).then(
        (result) => {
            if (result.value) {
                AVGEngine.DeleteFile()
            } else if (result.dismiss === swal.DismissReason.cancel) {

            }
        }
    )
}
function NewGame(){
    swal({
        title: '确定要开始新游戏吗？临时游戏状态将会被覆盖！',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        backdrop: "rgba(0,0,0,0.9)",
        allowOutsideClick: true
    }).then(
        (result) => {
            if (result.value) {
                AVGEngine.NewGame('Main', '', AVGEngine.Next)
            } else if (result.dismiss === swal.DismissReason.cancel) {

            }
        }
    )
}

function SaveTempFile(){
    AVGEngine.SaveTempFile()
    AVGEngine.Toast({type:"success",title:"临时存档保存成功！"})
}



// 添加动画
function A(id,obj){
    if(id=="bg"){
        if($("#ScenePanelBG1").css("z-index") > $("#ScenePanelBG2").css("z-index")){
            id = "ScenePanelBG1"
        }else{
            id = "ScenePanelBG2"
        }
    }
    try{AVGEngine.Animate(id,obj)}catch(e){AVGEngine.Log(e)}
    
}
// 切换背景
function B(filename){
    AVGEngine.Scenes.ChangeBackground(filename)
}
// 切换图片
function C(id,path){
    $("#"+id).attr("src",path)
}
// 删除标签
function D(id){
   AVGEngine.Scenes.DeleteActor(id)
}
// 播放音效
function P(audio){
    AVGEngine.Sound.Play(audio)
}
function M(music){
    AVGEngine.BGM.Change(music)
}
function T(scene){
    AVGEngine.Scenes.Change(scene)
}

