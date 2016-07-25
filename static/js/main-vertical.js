(function () {

    var util = baseUtil;

    /** 模态框 */
    var dialog = util.dialog;
    /** 网络连接 */
    var connect = util.connect;

    /** 上传图片模块 */
    (function () {
        loadUploadModel(dialog);
        var $upload = $("#upload");
        var $essay = $upload.children("textarea");
        var $desc = $essay.next("input");
        $essay.on("blur", function() {
            if (!$desc.val()) $desc.val($essay.val().slice(0, 32));
        });
        $("#uploadButton").on("click", function () {
            var images = [];
            for (var index in uploadPics) {
                var id = uploadPics[index];
                var title = $previews[id].children("input").val();
                images.push({"id": id, "title": title});
            }
            var essay = $essay.val();
            var desc = $desc.val();
            if (desc.length < 6) dialog.base.show("警告", $("<p>摘要要求6-32个字符</p>"));
            else connect.post("upload", {
                "images": images,
                "essay": essay,
                "desc": desc
            }, function () {
                location.reload();
            });
        });
    })();

    /** 管理素材模块 */
    (function () {
        $("#manage").children(".infolist").children().each(function () {
            var archive = this;
            var $buttonBar = $(archive).children(".buttonBar");
            $buttonBar.children("#deleteButton").on("click", function () {
                dialog.base.show("警告", $("<p>确定要删除此素材？（此操作不可逆）</p>"), function () {
                    connect.post("delete", {"id": archive.id}, function () {
                        location.reload();
                    });
                });
            });
        })
    })();

})();