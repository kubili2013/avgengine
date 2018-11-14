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
    position: 'center',
    showConfirmButton: false,
    customClass: "sweetalert-custom-toast",
    timer: 3000
});
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
        DefaultBGM: "bg.mp3"
    },
    TempContent:"",
    Files: [],
    Time: {
        That: null,
        Count: 0,
        CountInit: function () {
            AVGEngine.Time.Count = 1 + AVGEngine.Time.Count
            AVGEngine.Time.That = setTimeout("AVGEngine.Time.CountInit()", 1000)
            if (AVGEngine.Setting.Debug)
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
                if (AVGEngine.Setting.Debug)
                    this.Log('加载 Steam Works 失败！')
            }

        } catch (e) { console.log(e) }
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

    },
    // 解锁 Steam 成就
    ActivateAchievement: function (Achievement) {
        try {
            if (!greenworks.init()) {
                if (AVGEngine.Setting.Debug)
                    this.Log('加载 Steam Works 失败！')
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
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log("游戏设置保存成功！")
                }
            })
        } catch (e) {
            AVGEngine.Log("游戏设置保存失败！")
        }
    },
    /** SceneName 名称 Animation 加载或隐藏的动画 */
    NewGame: function (SceneName, animation) {
        this.Scenes.Change(SceneName, animation, "AVGEngine.Next");
    },
    Continue: function (index) {
        try {
            if(index == undefined){
                index = "temp"
            }
            AVGEngine.TempContent = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/content/content-' +index+ '.txt')
            let file = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/file-' + index + '.json')
            file = JSON.parse(file)
            AVGEngine.Scenes.CurrentScene = file.sence
            AVGEngine.Scenes.Current = file.index - 1
            AVGEngine.Custom = file.custom
            $('#ScenePanel').show()
            $('#ScenePanel').append(file.content + "<script>$('#" + AVGEngine.Scenes.CurrentScene + "').show(100,function(){AVGEngine.Scenes.LoadList(AVGEngine.Scenes.GetSceneByName('" 
            + AVGEngine.Scenes.CurrentScene + "'),"
            + AVGEngine.Scenes.Current + ",AVGEngine.Next)});</script>")
            // AVGEngine.Scenes.Change(file.sence,"","AVGEngine.Next")
        } catch (e) {
            AVGEngine.NewGame('Main', '', AVGEngine.Next)
        }
        
    },
    ShowPanel: function (id, animation) {
        let anima = arguments[1] ? arguments[1] : 'avg-animation-fadeinL'
        $('#' + id + " > article").addClass(anima)
        $('#' + id).addClass('z-show')
    },
    HidePanel: function (id, animation) {
        let anima = arguments[1] ? arguments[1] : 'avg-animation-fadeoutR'
        $('#' + id + " > article").addClass(anima)
        setTimeout("$('#" + id + "').removeClass('z-show'); $('#" + id + " > article').removeClass('" + anima + "');", 300)
    },
    SaveTempContent:function(){
        try {
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/content/content-temp.txt', AVGEngine.TempContent , function (err) {
                if (err) {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
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
            data.sence = AVGEngine.Scenes.CurrentScene
            data.index = AVGEngine.Scenes.Current
            data.content = $("#" + AVGEngine.Scenes.CurrentScene).prop("outerHTML")
            data.custom = AVGEngine.Custom
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/file-temp.json', JSON.stringify(data, null, 4), function (err) {
                if (err) {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log("临时存档保存成功！")
                }
            })

        } catch (e) {
            let file = {
                datetime:(new Date()).valueOf(),
                sence:AVGEngine.Scenes.CurrentScene,
                index:AVGEngine.Scenes.Current
            }
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/file-temp.json', JSON.stringify(file, null, 4), function (err) {
                if (err) {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log("临时存档保存成功！")
                }
            })
            
        }
    },
    // 保存存档
    SaveFile: function (index) {
        try {
            let data = fs.readFileSync(AVGEngine.LocalPath() + '/config/file/file-temp.json')
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/file-' + index + '.json', JSON.stringify(data, null, 4), function (err) {
                if (err) {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log(err)
                } else {
                    if (AVGEngine.Setting.Debug)
                        AVGEngine.Log("游戏存档保存成功！")
                    
                }
            })
            fs.writeFile(AVGEngine.LocalPath() + '/config/file/content/content-' + index + '.txt',AVGEngine.TempContent, function (err) {
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
        }
    },
    AutoSave: function(){
        this.SaveTempFile()
        this.SaveTempContent()
    },
    GetFiles: function () {
        fs.readdir(AVGEngine.LocalPath() + "/config/file", function (err, files) {
            if (err) {
                if (AVGEngine.Setting.Debug)
                    AVGEngine.Log("获取存档失败！")
                return
            }
            files.forEach(function (filename) {
                let filedir = path.join(AVGEngine.LocalPath() + "/config/file", filename)
                let file_stats = fs.statSync(filedir)
                if (!file_stats.isDirectory()) {
                    let data = fs.readFileSync(filedir)
                    AVGEngine.Files.push(JSON.parse(data))
                    AVGEngine.Log(JSON.parse(data))
                }
            })
        });
    },
    Scenes: {
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
            $('#ScenePanel').show()
            $('#ScenePanel').append("<div id='" + SceneName + "' class='scene " 
            + animation + "'></div><script>$('#"+SceneName+"').show(100,function(){AVGEngine.Scenes.LoadList(AVGEngine.Scenes.GetSceneByName('" + SceneName + "'),0,"+
            callback +")});</script>")
            
            let PreScene = this.CurrentScene
            this.CurrentScene = SceneName
            if ($("#" + PreScene).length != 0 && PreScene != SceneName ) {
                $("#" + PreScene).hide(500, function () {
                    $("#" + PreScene).remove()
                })
            }
            
        },
        GetSceneByName: function (SceneName) {
            let path = './scenes/' + SceneName.replace("-", "/") + ".scene.html";
            let scene = fs.readFileSync(path)
            return scene.toString();
        },
        LoadList:function(Scene,current,callback){
            
            $(Scene).children().each(function(){
                let obj = {
                    type:$(this)[0].tagName,
                    name:$(this).attr('name'),
                    style:$(this).attr('style'),
                    before_script:$(this).attr('before-script'),
                    after_script:$(this).attr('after-script'),
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
        }
    },
    // 点击事件
    Next: function () {
        if(!AVGEngine.NextFlag){
            return
        }
        AVGEngine.NextFlag = false;
        // 判断事件 文字下一句
        if (AVGEngine.Setting.Debug)
            AVGEngine.Log('Next!');
        // 文字弹出，弹出完整之后再执行 Next()
        if( AVGEngine.Scenes.Current >= AVGEngine.Scenes.CurrentSceneList.length){
            return
        }
        let curr = AVGEngine.Scenes.CurrentSceneList[AVGEngine.Scenes.Current]
        switch (curr.type){
            case "P":
                $("#SceneDialog").show();
                if(curr.before_script != undefined){
                    eval(curr.before_script);
                }
                $("#ActorDialog > p:eq(0)").html(curr.name)
                // 执行
                AVGEngine.TextAuto(curr.text,function(){
                    if(curr.after_script != undefined){
                        eval(curr.after_script);
                    }
                    AVGEngine.NextFlag = true;
                })
                // 保存
                AVGEngine.TempContent = AVGEngine.TempContent + curr.name + "\r\n" + curr.text + "\r\n"
                break;
            case "IMG":
                if(curr.before_script != undefined){
                    eval(curr.before_script);
                }
                let img = curr.that
                img.attr("id",curr.name)
                $('#'+ AVGEngine.Scenes.CurrentScene).append(img)
                if(curr.after_script != undefined){
                    eval(curr.after_script);
                }
                AVGEngine.NextFlag = true;
                break;
            case "DIV":
                if(curr.before_script != undefined){
                    eval(curr.before_script);
                }
                let div = curr.that
                AVGEngine.ShowPanel('ChooseDialogPanel')
                $('#ChooseDialogPanel').html(div)
                $('#ChooseDialogPanel button').click(function(){AVGEngine.HidePanel('ChooseDialogPanel')})
                if(curr.after_script != undefined){
                    eval(curr.after_script);
                }
                AVGEngine.NextFlag = true;
                break;
        }
        AVGEngine.Scenes.Current++;
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
            $("#ActorDialog > p:eq(1)").html(str.substring(0, index) + (index & 1 ? '_' : ''));
            if (index >= str.length) {
                clearInterval(timer);
                callback();
            }
        },AVGEngine.Setting.AutoSpeed);
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
            if ($(AVGEngine.BGM.That) == null || $(AVGEngine.BGM.That) == undefined) {
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
            $('body').append('<audio id="avgengine_sound"  style="height:0px"></audio>')
        },
        Play: function (soundName) {
            $(AVGEngine.Sound.That)[0].pause()
            if (!AVGEngine.Setting.Sound) { return }
            if ($(AVGEngine.Sound.That) == null || $(AVGEngine.Sound.That) == undefined) {
                AVGEngine.Sound.Init()
            }
            $(AVGEngine.Sound.That).attr('src', "./sound/" + audioName)
            $(AVGEngine.Sound.That)[0].play()
        }
    },
    Log: function (msg) {
        if (this.Setting.Debug) {
            console.log(msg)
        }
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

    }
}
