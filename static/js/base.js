;(function () {


var preDefine = {};

/** 模态对话框 */
var $dialog = $('\
    <div id="dialog" class="modal" style="display: none">\
        <div class="content">\
            <div id="dialogTitle" class="title"></div>\
            <div id="dialogMessageDiv" class="message"></div>\
            <div id="dialogButtonBar" class="button_bar">\
                <a id="dialogCancel" href="javascript:;">取消</a>\
                <a id="dialogConfirm" href="javascript:;">确认</a>\
            </div>\
        </div>\
    </div>\
');
$("body").append($dialog);

/** 弹窗表单 */
function Form() {
    Form = function() {
        this.$form = $('<form class="form" autocomplete="on"></form>');
        this.$inputs = [];
        var $warnTip = $('<div class="warning" style="visibility: hidden">隐藏</div>');
        this.$form.prepend($warnTip);
        this.setWarnTip = function(warning) {
            if (warning) {
                $warnTip.text(warning);
                $warnTip.css("visibility", "visible");
            } else $warnTip.css("visibility", "hidden");
        };
    };
    Form.prototype.addItem = function(
        name, head, type, maxLength, placeholder, pattern,
        invalidTip, emptyTip, endButton, belowLink
    ) {
        var $item = $('<div class="percent"></div>');
        var $head = $('<p class="percent-20 align-right">' + head + '</p>');
        $item.append($head);
        var $input = $(
            '<input class="align-left"' + (emptyTip ? 'required' : '')
            + ' type="' + type + '" maxlength="' + maxLength + '" name="' + name + '"'
            + 'oninput="if (value.length > maxLength) value = value.slice(0, maxLength);"'
            + 'placeholder="' + placeholder + '" pattern="' + pattern + '"></input>'
        );
        var setWarnTip = this.setWarnTip;
        $input.checkValidity = function(shake) {
            if ($input[0].checkValidity()) {
                $item.removeClass("warning warning-shake");
                setWarnTip();
                return true;
            } else {
                setWarnTip($input.val().length ? invalidTip : emptyTip);
                $item.addClass("warning");
                if (shake) {
                    $item.addClass("warning-shake");
                    setTimeout(function() {
                        $item.removeClass("warning-shake");
                    }, 500);
                }
                return false;
            }
        };
        $input.on("blur", function() {
            $input.checkValidity();
        });
        this.$inputs.push($input);
        if (endButton) {
            $input.addClass("percent-60");
            var $endButton = $('<a class="end-button percent-40 align-center">' + endButton.text + '</a>');
            $endButton.on("click", endButton.onClick);
            var $div = $('<div class="percent-80 align-left"></div>');
            $div.append($input, $endButton);
            $item.append($div);
        } else {
            $input.addClass("percent-80");
            $item.append($input);
        }
        if (belowLink) {
            var $belowButton = $('<a href="javascript:;">' + belowLink.text + '</a>');
            $belowButton.on("click", belowLink.onClick);
            var $belowLink = $('<div class="below-link"></div>');
            $belowLink.append($belowButton);
            $item.append($belowLink);
        }

        this.$form.append($item);
        return this;
    };
    Form.prototype.addAccount = function() {
        return this.addItem(
            "account", "账号", "tel", 11, "请输入手机号", "^1\\d{2}\\d{8}$",
            "手机号格式不正确", "手机号不能为空"
        );
    };
    Form.prototype.addPassword = function(title, belowLink) {
        var form = this;
        return this.addItem(
            "password", title, "password", 16, "请输入密码", ".{8,16}$",
            "密码长度要求为8~16位", "密码不能为空", undefined, belowLink
        );
    };
    Form.prototype.addSmsCode = function() {
        // var $account = $('input[name="account"]');
        var $account = this.$inputs[0];
        var setWarnTip = this.setWarnTip;
        // var $modal = this.$form.parent().parent();
        var getSmsCode = function() {
            var $view = $(this);
            if ($account.checkValidity(true)) {
                $dialog.hide();
                preDefine.connect.get(
                    "smsCode", {
                        "phone": $account.val()
                    },
                    function(data) {
                        $dialog.show();
                        setWarnTip(data["body"]["message"]);
                        setTimeout(function() {
                            setWarnTip();
                        }, 3000);
                        var duration = data["body"]["cooldown"];
                        $view.off("click");
                        (function cooldown() {
                            $view.text("剩余" + duration-- + "s");
                            if (duration <= 0) {
                                $view.on("click", getSmsCode);
                                $view.text("获取验证码");
                            } else setTimeout(cooldown, 1000);
                        })();
                        return true;
                    }
                );
            }
        };
        return this.addItem(
            "smsCode", "短信验证", "tel", 6, "请输入验证码", "\\d{6}",
            "验证码要求6位数字", "验证码不能为空", {
                "text": "获取验证码",
                "onClick": getSmsCode
            }, undefined
        );
    };
    Form.prototype.getData = function() {
        for (var index in this.$inputs) {
            var $input = this.$inputs[index];
            if (!$input.checkValidity(true)) return false;
        }
        this.setWarnTip();
        return new FormData(this.$form[0]);
    };
    Form.prototype.onConfirm = function(onSubmit, success) {
        var form = this;
        return function() {
            var formData = form.getData();
            if (formData) return onSubmit(formData, success);
            else return true;
        }
    };
    return Form;
}
Form();

var dialog = {
    /** 等待模态框 */
    "waiting": (function() {
        var $modal = $(
            '<div class="modal" style="display: none;"><div class="content">' + '<i class="waiting"></i></div></div>'
        );
        return {
            "show": function() {
                $("body").append($modal);
                $modal.show();
                return $modal;
            },
            "hide": function() {
                $modal.hide();
                $modal.remove();
            }
        }
    })(),
    /** 提示弹框 */
    "toast": (function() {
        var $toast = $('<div class="toast"></div>');
        var $reason = $('<div class="reason"></div>');
        var $modal = $('<div class="modal" style="display: none;"></div>');
        $modal.append($toast);
        $modal.append($reason);
        return {
            "show": function(toast, reason, duration) {
                $toast.empty();
                if (toast) $toast.append(toast);
                else $toast.append('<i class="fa fa-check"></i>');
                $reason.empty();
                if (reason) $reason.append(reason)
                $("body").append($modal);
                $modal.show();
                duration == -1 || setTimeout(function() {
                    $toast.empty();
                    $modal.hide();
                    $modal.remove();
                }, duration || 3000);
                return $modal;
            },
            "hide": function() {
                $toast.empty();
                $reason.empty();
                $modal.hide();
                $modal.remove();
            }
        }
    })(),
    /** 基础对话框 */
    "base": (function() {
        var $title = $("#dialogTitle");
        var $messageDiv = $("#dialogMessageDiv");
        var _onConfirm;
        $("#dialogCancel").on("click", function() {
            $dialog.hide();
        });
        $("#dialogConfirm").on("click", function() {
            (_onConfirm && _onConfirm()) || $dialog.hide();
        });

        return {
            /**
             * 显示对话框.
             * @param onConfirm 当用户点击确认按钮，返回值表示是否继续，返回代表false的值则关闭对话框.
             */
            "show": function(title, $message, onConfirm) {
                $title.empty();
                $messageDiv.children().detach();
                _onConfirm = undefined;
                $title.text(title);
                $messageDiv.append($message);
                _onConfirm = onConfirm;
                $dialog.show();
                return $dialog;
            },
            "hide": function() {
                $title.empty();
                $messageDiv.children().detach();
                var onConfirm = _onConfirm;
                _onConfirm = undefined;
                $dialog.hide();
                return {
                    // "$message": $messageDiv.children(),
                    "onConfirm": onConfirm
                }
            }
        }
    })(),
    /** 登录对话框 */
    "login": (function() {
        var title = "登录";
        var form = new Form();
        var onSubmit = function(formData, success) {
            preDefine.connect.ajax("login", "POST", undefined, formData, function(data) {
                var userInfo = data["body"];
                return success(userInfo);
            }, false, {
                "processData": false,
                "contentType": false
            });
        };
        form.addAccount().addPassword("密码", {
            "text": "忘记密码？",
            "onClick": function() {
                var onConfirm = dialog.base.hide().onConfirm;
                preDefine.dialog.findPwd.show(function(message) {
                    form.setWarnTip(message);
                    dialog.base.show(title, form.$form, onConfirm);
                    setTimeout(function() {
                        form.setWarnTip();
                    }, 3000);
                    return true;
                });
            }
        }); //.form.addSmsCode();
        return {
            "show": function(success) {
                // $form.show();
                dialog.base.show(title, form.$form, form.onConfirm(onSubmit, success));
            },
            "hide": function() {
                return dialog.base.hide();
                // $form.hide();
            }
        };
    })(),
    /** 找回密码对话框 */
    "findPwd": (function() {
        var title = "找回密码";
        var form = new Form();
        form.addAccount().addPassword("新密码").addSmsCode();
        var onSubmit = function(formData, success) {
            preDefine.connect.ajax("findPwd", "POST", undefined, formData, function(data) {
                var message = data["body"]["message"];
                dialog.base.hide();
                return success(message);
            }, false, {
                "processData": false,
                "contentType": false
            });
        };
        return {
            "show": function(success) {
                dialog.base.show(title, form.$form, form.onConfirm(onSubmit, success));
            },
            "hide": function() {
                dialog.base.hide();
            }
        };
    })()
};

var urlMap = {
    "univer": "./../social/univer",
    "filter": "./../social/archive/filter",
    "archive": "./../social/archive/pull",
    "download": "./../res/archive/download",
    "login": "./../guide/login",
    "smsCode": "./../guide/sms/code",
    "findPwd": "./../guide/password/find",
    "console": "./../view/console.html",
    "logout": "./../school/logout",
    "upload": "./../school/upload",
    "delete": "./../school/delete"
};
/** Ajax方法 */
var ajax = function(url, type, contentType, data, success, silence, extend) {
    silence || dialog.waiting.show();
    var config = {
        "url": urlMap[url],
        "type": type,
        "contentType": contentType,
        "dataType": "json",
        "data": data,
        "success": function(data) {
            success && success(data) || silence || dialog.toast.show(undefined, undefined, 1000);
        },
        "error": function(resp) {
            var reas;
            // var then;
            try {
                respJson = JSON.parse(resp.responseText);
                reas = respJson["reas"];
                // then = respJson["then"];
            } catch (e) {
                reas = resp.statusText;
            }
            dialog.toast.show("出错了", reas);
        },
        "complete": dialog.waiting.hide
    };
    $.extend(config, extend)
    $.ajax(config);
};
// 模拟Ajax调试
if (window.location.host == "" || location.host == "zhengxiaoyao0716.github.io") {
    urlMap["console"] = "./../html/console.html";
    var expectDictMap = {
        "univer": function(univer) {
            return {
                "univers": [{
                    "name": "北京科技大学"
                }, {
                    "name": "北京理工大学"
                }]
            };
        },
        "filter": function() {
            return {
                "pages": 255 / 16 + 1
            }
        },
        "archive": function(data) {
            var page = data["page"];

            function archive() {
                var index = 0;
                archive = function() {
                    return {
                        "id": ++index + 16 * (page - 1),
                        'hot': 0,
                        "images": [{
                            "url": "./static/image/temp-pic1.jpg",
                            "title": "图片一"
                        }, {
                            "url": "./static/image/temp-pic2.jpg",
                            "title": "图片二"
                        }, {
                            "url": "./static/image/temp-pic3.jpg",
                            "title": "图片三"
                        }],
                        "desc": "标题_" + page + "_" + index,
                        "essay": "一个空格 测试文字\n" + "两个空格  测试文字\n" + "三个空格   测试文字\n" + "四个空格    \n" + "连续换行\n\n测试文字\n" + "制表0\t测试文字\n" + "制表00\t测试文字\n" + "长文本：正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文\n" + "长文本带空格：正文 正文 正文 正文 正文 正文 正文 正文 正文 正文 正文\n" + "English:qwertyuiopasdfghlzxcvbnmqwertyuiopasdfghlz\n" + "with space: qwertyuio pasdfghl zxc vbnm qwerty uiopa\n",
                        "univer": "北京科技大学",
                        "college": "计算机与通信工程学院",
                        "auth": "正逍遥0716",
                        "date": "2016-7-14"
                    };
                };
                return archive();
            };
            return {
                "archives": [
                    archive(), archive(), archive(), archive(),
                    archive(), archive(), archive(), archive(),
                    archive(), archive(), archive(), archive(),
                    archive(), archive(), archive(), archive()
                ]
            };
        },
        "login": function() {
            return {
                "name": "正逍遥0716",
                "head": "./static/image/temp-head.png"
            };
        },
        "smsCode": function() {
            return {
                "message": "短信已发送，请注意查收",
                "cooldown": 60
            };
        },
        "findPwd": function() {
            return {
                "message": "请使用新密码登录"
            };
        },
        "logout": function() {}
    };
    ajax = function(url, type, contentType, data, success, silence, extend) {
        data = contentType == "application/json" ? JSON.parse(data) : data;
        console.group("模拟Ajax请求:")
        console.group("=request=")
        console.debug("url: " + urlMap[url]);
        console.debug("type: " + type);
        console.debug("contentType: " + contentType);
        console.debug("data: " + data);
        console.debug("success: " + success);
        console.debug("silence: " + silence);
        console.debug("extend: " + extend);
        console.groupEnd();

        silence || dialog.waiting.show();
        var data = {
            "flag": true,
            "body": expectDictMap[url](data),
            "reas": undefined,
            "then": undefined
        };
        var time = Math.random() * 3000;
        setTimeout(function() {
            success && success(data) || silence || dialog.toast.show(undefined, undefined, 1000);
            dialog.waiting.hide();
        }, time);

        console.group("=response=");
        console.debug("data: " + JSON.stringify(data));
        console.groupEnd();
        console.log("随机耗时: " + time);
        console.groupEnd();
    };
}
var connect = {
    "ajax": ajax,
    "get": function(url, data, func, silence) {
        ajax(url, "GET", "application/x-www-form-urlencoded", data, func, silence);
    },
    "post": function(url, data, func, silence) {
        ajax(url, "POST", "application/json", JSON.stringify(data), func, silence);
    },
    "open": function(url, param) {
        open(urlMap[url] + param);
    }
};

preDefine.connect = connect;
preDefine.dialog = dialog;


var baseUtil = {
    "dialog": dialog,
    "connect": connect
}


if(typeof define ==="function" && define.amd){
    define(function($) {
        return baseUtil;
    });
}
else if(typeof module !== "undefined" && module.exports){
    module.exports = baseUtil;
}
else{
    window.baseUtil = baseUtil;
}
})();
