function loadUploadModel(dialog) {

window.uploadPics = window.uploadPics || [];
window.maxCount = window.maxCount || 800;
window.$previews = window.$previews || {};

var maxWidth = 1920;
var allowTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
var maxSize = 10 * 1024 * 1024;
//添加预览图片
function addPreviewPic(file) {
    // 如果类型不在允许的类型范围内
    if (allowTypes.indexOf(file.type) === -1) {
        dialog.toast.show("警告", "该类型不允许上传");
        return;
    }

    if (file.size > maxSize) {
        dialog.toast.show("警告", "图片太大，不允许上传");
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
            var w = Math.min(maxWidth, img.width);
            // 高度按比例计算
            var h = img.height * (w / img.width);
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            // 设置 canvas 的宽度和高度
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            var base64 = canvas.toDataURL('image/png');

            // 插入到预览区
            var $preview = $(
                '<div class="image"><img src="' + base64 + '"/>'
                + '<input type="text" placeholder="请添加图片描述"/>'
                + '<div class="progress"></div></div>'
            );
            $('.upload .show').append($preview);
            var num = $('.upload .show').length;
            $('.js_counter').text(num + '/' + maxCount);
            $preview.attr('id', file.name);
            $previews[file.name] = $preview;
            // images.push(base64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file.getNative());
}


var accessid = '';
var accesskey = '';
var host = '';
var policyBase64 = '';
var signature = '';
var callbackbody = '';
var filename = '';
var key = '';
var expire = 0;
var g_object_name = '';
var g_object_name_type = '';
var now = timestamp = Date.parse(new Date()) / 1000;

function send_request()
{
    var xmlhttp = null;
    if (window.XMLHttpRequest)
    {
        xmlhttp=new XMLHttpRequest();
    }
    else if (window.ActiveXObject)
    {
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
  
    if (xmlhttp!=null)
    {
        pyUrl = './../school/ali_token';
        xmlhttp.open( "GET", pyUrl, false );
        xmlhttp.send( null );
        return xmlhttp.responseText;
    }
    else
    {
        alert("Your browser does not support XMLHTTP.");
    }
};

function get_signature()
{
    //可以判断当前expire是否超过了当前时间,如果超过了当前时间,就重新取一下.3s 做为缓冲
    now = timestamp = Date.parse(new Date()) / 1000; 
    if (expire < now + 3)
    {
        body = send_request();
        var obj = eval("(" + body + ")");
        host = obj['host'];
        policyBase64 = obj['policy'];
        accessid = obj['accessid'];
        signature = obj['signature'];
        expire = parseInt(obj['expire']);
        callbackbody = obj['callback'];
        key = obj['dir'];
        return true;
    }
    return false;
};

function random_string(len) {
　　len = len || 32;
　　var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';   
　　var maxPos = chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
    　　pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

function get_suffix(filename) {
    pos = filename.lastIndexOf('.')
    suffix = ''
    if (pos != -1) {
        suffix = filename.substring(pos)
    }
    return suffix;
}

function calculate_object_name(filename)
{
    if (g_object_name_type == 'local_name')
    {
        g_object_name += "${filename}"
    }
    else if (g_object_name_type == 'random_name')
    {
        suffix = get_suffix(filename)
        g_object_name = key + random_string(10) + suffix
    }
    return ''
}

function get_uploaded_object_name(filename)
{
    if (g_object_name_type == 'local_name')
    {
        tmp_name = g_object_name
        tmp_name = tmp_name.replace("${filename}", filename);
        return tmp_name
    }
    else if(g_object_name_type == 'random_name')
    {
        return g_object_name
    }
}

function set_upload_param(up, filename, ret)
{
    if (ret == false)
    {
        ret = get_signature()
    }
    g_object_name = key;
    if (filename != '') {
        suffix = get_suffix(filename)
        calculate_object_name(filename)
    }
    new_multipart_params = {
        'key' : g_object_name + filename,
        'policy': policyBase64,
        'OSSAccessKeyId': accessid, 
        'success_action_status' : '200', //让服务端返回200,不然，默认会返回204
        'callback' : callbackbody,
        'signature': signature,
    };

    up.setOption({
        'url': host,
        'multipart_params': new_multipart_params
    });

    up.start();
}

var uploader = new plupload.Uploader({
	runtimes : 'html5,flash,silverlight,html4',
	browse_button : "selectButton", 
    // multi_selection: false,
	// container: document.getElementById('container'),
	flash_swf_url : 'lib/plupload-2.1.2/js/Moxie.swf',
	silverlight_xap_url : 'lib/plupload-2.1.2/js/Moxie.xap',
    url : 'http://oss.aliyuncs.com',

	init: {
		PostInit: function() {
		},

		FilesAdded: function(up, files) {
            var allowFileNum = maxCount - $(".upload .show").length;
            if (files.length > allowFileNum) {
                up.splice(allowFileNum, up.files.length - allowFileNum);
                dialog.toast.show("警告", "最多只能上传" + maxCount + "张图片");
            }
			plupload.each(files, function(file) {
                addPreviewPic(file);
			});
            set_upload_param(up, "", false);
		},

		BeforeUpload: function(up, file) {
            // check_object_radio();
            set_upload_param(up, file.name, true);
        },

		UploadProgress: function(up, file) {
            $previews[file.name] && $previews[file.name].children(".upload .progress").text(file.percent + "%");
		},

		FileUploaded: function(up, file, info) {
            if (info.status == 200)
            {
                $previews[file.name].children(".progress").remove();
                uploadPics.push($previews[file.name][0].id);
                $previews[file.name].children("img").on("click", function () {
                    dialog.base.show("警告", $("<p>移除这张图片？</p>"), function (){
                        var name = $previews[file.name][0].id;
                        uploadPics.splice(uploadPics.indexOf(name), 1);
                        $previews[file.name].remove();
                        delete $previews[name];
                    });
                });
            }
            else
            {
                $previews[file.name].children(".progress").addClass("failed");
                $previews[file.name].children("img").on("click", function () {
                    $previews[file.name].remove();
                });
                console.error("\nError: " + info.response);
            } 
		},

		Error: function(up, err) {
            $previews[err.file.name].children('.progress').addClass("failed");
            $previews[err.file.name].on("click", function () {
                $previews[err.file.name].remove();
            });
            console.error("\nError xml:" + err.response);
		}
	}
});

uploader.init();

}