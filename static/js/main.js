(function() {
    var util = baseUtil;

    /** 模态框 */
    var dialog = util.dialog;
    /** 网络连接 */
    var connect = util.connect;

    /** 筛选链 */
    var filterChain = {
        "sort": "",
        "rank": "",
        "univers": [],
        "dates": []
    };
    var filterCache = {};
    /**
     * 提交筛选规则方法的初始化方法.
     * <p>自举，初次运行后转为提交筛选规则的方法</p>
     * @param {function} initPages 初始化分页配置的方法
     * @returns {function} 提交筛选规则的方法
     */
    function commitFilter(initPages) {
        if (!navigator.cookieEnabled) {
            $alert = $("<div>您的浏览器不支持或未开启Cookie<br />可能会影响您的正常浏览</div>")
            dialog.base.show("警告", $alert);
        }
        commitFilter = function() {
            connect.get("filter", filterChain, function(data) {
                dialog.waiting.hide();
                filterCache["filter"] = data["body"]["filter"];
                initPages(data["body"]["pages"]);
                return true;
            });
        }
        return commitFilter;
    }
    /** 拉取档案 */
    function pullArchives(page, success) {
        connect.post("archive", {
                "page": page,
                "filter": filterCache["filter"]
            },
            function(data) {
                success(data["body"]["archives"]);
            }, true);
    }
    /** 拉取大学列表 */
    function pullUnivers(success) {
        connect.get("univer", undefined, function(data) {
            success(data["body"]["univers"]);
            return true;
        })
    }
    /** 菜单相关动作 */
    var menuAction = {
        "login": dialog.login.show,
        "account": function() {
            connect.open("console", "#account");
            // dialog.toast.show("提示", $("<p>暂未开放</p>"));
        },
        "upload": function() {
            connect.open("console", "#upload");
        },
        "manage": function() {
            connect.open("console", "#manage");
            // dialog.toast.show("提示", $("<p>暂未开放</p>"));
        },
        "logout": function() {
            connect.get("logout", undefined, undefined);
        }
    };
    /** 档案相关动作 */
    var archiveAction = {
        //todo
        // "detail": function () {
        //     console.log("查看id为" + this.id + "的资料");
        // },
        // "share": function () {
        //     console.log("分享id为" + this.id + "的资料");
        // },
        "download": function() {
            connect.open("download", "?id=" + this.id);
        }
    };

    /** 筛选条件模块 */
    (function() {
        //导航
        (function() {
            function update() {
                $last = $("#navButton .select");
                $last.removeClass("select");
                $last.on("click", update);
                $this = $(this);
                $this.addClass("select");
                $this.off("click");
                filterChain["sort"] = this.text;
                commitFilter();
            }
            $navButton = $("#navButton>a:not(.select)");
            $navButton.on("click", update);
            // $navButton.first().click();
        })();
        //排序
        (function() {
            function update() {
                $last = $("#tabButton .select");
                $last.removeClass("select");
                $last.on("click", update);
                $this = $(this);
                $this.addClass("select");
                $this.off("click");
                filterChain["rank"] = this.text;
                commitFilter();
            }
            var $tabButton = $("#tabButton>a:not(.select)");
            $tabButton.on("click", update);
            // $tabButton.first().click();
        })();
        //其它条件
        (function() {
            var filterBackup;
            var $addFilter = $("#addFilter");
            var $filterPicker = $("#filterPicker");
            $addFilter.on("click", function() {
                if ($filterPicker.is(":hidden")) {
                    $addFilter.addClass("adding");
                    filterBackup = JSON.stringify(filterChain);
                } else {
                    $addFilter.removeClass("adding");
                    filterBackup == JSON.stringify(filterChain) || commitFilter(filterChain);
                }
                $filterPicker.slideToggle();
            });

            function removeFilter(sort, view) {
                var dates = filterChain[sort];
                dates.splice(dates.indexOf(view.text), 1);
                $(view).fadeOut(600);
                if ($filterPicker.is(":hidden")) commitFilter(filterChain);
            }
            eui.calendar({
                startYear: 1900,
                input: document.getElementById('datePicker')
            }, function(date) {
                filterChain["dates"].push(date);
                $dateFilter = $('<a href="javascript:;" style="display: none">' + date + '</a>');
                $("#filterBar").append($dateFilter);
                $dateFilter.fadeIn(600);
                $dateFilter.on("click", function() {
                    removeFilter("dates", this);
                });
            }, function() {
                $datePicker.removeClass("adding");
            });
            var $datePicker = $("#datePicker");
            $datePicker.on("click", function() {
                if ($datePicker.hasClass("adding")) {
                    $datePicker.removeClass("adding");
                    $(".calendar").show();
                } else {
                    $datePicker.addClass("adding");
                    $(".calendar").hide();
                }
            });

            /** 拉取大学列表 */
            pullUnivers(function(univers) {
                for (var index in univers) {
                    var univer = univers[index]["name"];
                    $univer = $("<a>" + univer + "</a>");
                    $("#univerBar").append($univer);
                    $univer.on("click", function() {
                        var univer = this.text;
                        filterChain["univers"].push(univer);
                        $univer = $('<a href="javascript:;" style="display: none">' + univer + '</a>');
                        $("#filterBar").append($univer);
                        $univer.fadeIn(600);
                        $univer.on("click", function() {
                            removeFilter("univers", this);
                        });
                    });
                }
            });
        })();
    })();

    /** 右上菜单模块 */
    (function() {
        var onUserLogin = function(userInfo) {
            $("#needLogin").hide();
            $("#loginButton").hide();
            $(".droplist>*:not(#loginButton)").show();
            $("#userHead").attr("src", userInfo["head"]);;
            $("#userName").text(userInfo["name"]);
        };
        var onUserLogout = function() {
            $("#needLogin").show();
            $("#loginButton").show();
            $(".droplist>*:not(#loginButton)").hide();
            $("#userHead").attr("src", "./static/image/user.svg");
            return;
        };
        if (window.userInfo) onUserLogin(userInfo);
        else onUserLogout();

        $("#needLogin>a, #loginButton").on("click", function() {
            menuAction.login(onUserLogin);
        });
        $("#accountButton").on("click", menuAction.account);
        $("#uploadButton").on("click", menuAction.upload);
        $("#manageButton").on("click", menuAction.manage);
        $("#logoutButton").on("click", function() {
            menuAction.logout();
            onUserLogout();
        });
    })();

    /** 分页模块 */
    (function() {
        var loading = false;
        var $loadingPage = $("#loadingPage");
        var $gallery = $("#gallery");

        function imageScroll($column, images) {
            var $img = $column.children("img")
            var $small = $column.children("small")
            var index = 0,
                length = images.length;
            var handle;
            return {
                "start": function() {
                    function nextImage() {
                        if (++index >= length) index = 0;

                        $img.attr("src", images[index]["url"]);
                        $small.text(images[index]["title"]);
                        handle = setTimeout(nextImage, 3000);
                    }
                    handle = setTimeout(nextImage, 3000);
                },
                "stop": function() {
                    clearTimeout(handle);
                    handle = undefined;
                }
            }
        }
        function onload(page) {
            var $page = $("#page" + page);
            if ($page.length) {
                $("body, html").animate({
                    "scrollTop": $page.offset().top
                }, 800);
                return;
            } else $page = undefined;
            for (var index = page - 1; index > 0; index--) {
                $page = $("#page" + index);
                if ($page.length) break;
                else $page = undefined;
            }
            loading = true;
            $loadingPage.show();
            //拉取档案
            pullArchives(page, function(archives) {
                $newPage = $(
                    '<div id="page' + page + '"><p class="page-sign">第'
                    + page + '页 <a href="#page'
                    + page + '" class="fa fa-map-signs"></a></p></div>'
                );
                if (!$page) $gallery.append($newPage);
                else $page.after($newPage);
                $page = $newPage;
                for (var index in archives) {
                    var mod = index % 4;
                    if (mod == 0) {
                        $row = $('<div class="row"></div>');
                        $page.append($row);
                    }
                    var archive = archives[index];
                    // $detailButton = $(
                    //     '<i title="查看" id="' + archive["id"]
                    //     + '" class="fa fa-eye"></i>'
                    // );
                    // $detailButton.on("click", archiveAction.detail);
                    // $shareButton = $('<i id="' + archive["id"] + '" class="fa fa-share-alt"></i>');
                    // $shareButton.on("click", archiveAction.share);
                    $downloadButton = $(
                        '<i title="下载" id="' + archive["id"] + '" class="fa fa-download"></i>'
                    );
                    $downloadButton.on("click", archiveAction.download);
                    $buttonBar = $('<div class="button_bar"></div>');
                    $buttonBar.append($downloadButton);
                    var essay = archive["essay"];
                    if (essay.length > 32) {
                        essay = essay.slice(0, 29) + "...";
                    }
                    var ulStyle = '';
                    if (!archive["images"][0]) {
                        ulStyle = ' style="display: block;"';
                    }
                    $column = $(
                        '<div id="' + archive["id"] + '" class="column">'
                        + '<div class="head">下载量：' + archive['hot'] + '<span>共'
                        + archive["images"].length + '张</span></div>'
                        + (
                            ulStyle ? '' : '<img src="' + archive["images"][0]["url"] + '" ></img>'
                            // + '<div class="dotBar"><i class="fa fa-circle"></i><i class="fa fa-circle-o"></i><i class="fa fa-circle-o"></i></div>'
                            + '<small>' + archive["images"][0]["title"] + '</small>'
                        ) + '<h3>' + archive["desc"] + '</h3>' + '<p>' + essay + '</p>'
                        + '<ul' + ulStyle + '>'
                        + '<li>学校：' + archive["univer"] + '</li>'
                        + '<li>院系：' + archive["college"] + '</li>'
                        + '<li>日期：' + archive["date"] + '</li>' + '<li>作者：' + archive["auth"] + '</li>'
                        + '</ul>'
                        + '<pre class="detail" style="' + (mod < 2 ? "left" : "right") + ': 100%;">'
                        + archive["essay"] + '</pre>' + '</div>'
                    );
                    $column.append($buttonBar);

                    if (!ulStyle) {
                        var scroller = imageScroll($column, archive["images"]);
                        $column.on("mouseenter", scroller.start);
                        $column.on("mouseleave", scroller.stop);
                    }
                    $row.append($column);
                }
                $loadingPage.hide();
                loading = false;
                //第一页新拉取时免滚动
                page != 1 && $("body, html").animate({
                    "scrollTop": $page.offset().top
                }, 800);
            });
        }

        function update() {
            $last = $("#pageButton .select");
            $last.removeClass("select");
            $last.on("click", update);
            $this = $(this);
            $this.addClass("select");
            $this.off("click");
            var page = parseInt(this.text);
            onload(page);
            var $pageButtons = $("#pageButton>a");
            if (page < 5) page = 5;
            $pageButtons.slice(0, page - 5).hide();
            $pageButtons.slice(page + 4).hide();
            $pageButtons.slice(page - 5, page + 4).show();
        }
        $(window).scroll(function() {
            var requestHeight = $(window).height() + $(window).scrollTop();
            if (requestHeight >= $(document).height()) {
                if (loading) return;
                var $nextPageButton = $("#pageButton .select").next();
                while ($nextPageButton.length) {
                    // var href = $nextPageButton[0].href;
                    // var pageId = href.slice(href.lastIndexOf("#page"));
                    if (!$("#gallery").children("#page" + $nextPageButton.text()).length) {
                        $nextPageButton && $nextPageButton.click();
                        break;
                    }
                    $nextPageButton = $nextPageButton.next();
                }
            }
        });
        //初始化分页配置
        function initPages(pageNum) {
            var $pageButton = $("#pageButton");
            $pageButton.empty();
            $gallery.empty();
            for (var index = 1; index <= pageNum; index++) {
                var $button = $('<a href="#page' + index + '">' + index + '</a>');
                $button.on("click", update);
                $pageButton.append($button);
            }
            $("#pageButton>a").first().click();
            $("#firstPage").on("click", function() {
                $("#pageButton>a").first().click();
            });
            $("#lastPage").on("click", function() {
                $("#pageButton>a").last().click();
            });
            $("#leftPage").on("click", function() {
                $("#pageButton .select").prev().click();
            });
            $("#rightPage").on("click", function() {
                $("#pageButton .select").next().click();
            });
        }
        commitFilter(initPages)();
    })();


})();