var MangakReader = angular.module('MangakReader', ['ngResource', 'ngSanitize', 'ngAnimate', 'ui.bootstrap']);

MangakReader.directive('imageonload', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var fn = $parse(attrs.imageonload);
            element.bind('load', function () {
                scope.$apply(function () {
                    fn(scope, {
                        $event: event
                    });
                });
            });
            element.bind('error', function () {
                alert("There are some images that cant be loaded.")
                scope.$apply(function () {
                    fn(scope, {
                        $event: event
                    });
                });
            });
        },
    };
}]);

MangakReader.directive('scroll', function ($window) {
    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {
            angular.element(element[0]).bind("scroll", function () {
                var curChap = scope.curChap.replace("http://mangak.info", "").replace(/\//g, "");
                if ($(this).scrollTop() + $(this).height() <= $(this)[0].scrollHeight + 1 &&
                    $(this).scrollTop() + $(this).height() >= $(this)[0].scrollHeight - 1 &&
                    scope.listImage.length == scope.numberImage) {

                    for (var index in scope.listChapter) {
                        val = scope.listChapter[index];
                        if (scope.displayChapterListButtonStyle["left"] == "0%" &&  val.link.replace("http://mangak.info", "").replace(/\//g, "") == curChap && index != 0) {
                            if (confirm("Continue " + scope.listChapter[index - 1].title + "?")) {
                                scope.chapterClick(scope.listChapter[index - 1].link, scope.listChapter[index - 1].title)
                                break;
                            } else if (scope.displayChapterListButtonStyle["left"] == "0%") {
                                scope.displayChapterList();
                                console.log($(this).scrollTop());
                                $(this).scrollTop($(this)[0].scrollHeight - $(this).height() - 100);
                                console.log($(this).scrollTop());
                            } else {
                                $(this).scrollTop($(this)[0].scrollHeight - $(this).height() - 10);
                            }
                        } else if (scope.displayChapterListButtonStyle["left"] == "0%" && val.link.replace("http://mangak.info", "").replace(/\//g, "") == curChap && index == 0) {
                            scope.displayChapterList();
                            $(this).scrollTop($(this)[0].scrollHeight - $(this).height() - 1);
                        }
                    }
                }
                scope.$apply();
            });
        }
    }
});

MangakReader.controller('HomeController', ['$scope', '$resource', '$uibModal', function ($scope, $resource, $uibModal) {
    $scope.searchText = "";
    $scope.searchResult = [];
    $scope.resultStyle = {
        'padding': "0px 0px 0px 0px",
        'display': "none"
    }
    var newManga = $resource('/api/getNewManga');
    console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Request getNewManga")
    newManga.query(function (result) {
        console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Receive getNewManga")
        $scope.myHTML = result[0];
        var parser = new DOMParser(),
            doc = parser.parseFromString($scope.myHTML, "text/xml");
        var listNew = doc.getElementsByClassName("update_item");
        var listManga = [];
        for (var index in listNew) {
            if (isNaN(index)) {
                continue;
            }
            var htmlManga = listNew[index];
            if (typeof (htmlManga) == "object") {
                var manga = {
                    link: htmlManga.firstElementChild.firstElementChild.getAttribute("href").replace("http://mangak.info/", "").replace("/", ""),
                    mangaKLink: htmlManga.firstElementChild.firstElementChild.getAttribute("href"),
                    imageLink: htmlManga.firstElementChild.firstElementChild.firstElementChild.getAttribute("src"),
                    title: htmlManga.firstElementChild.nextElementSibling.firstElementChild.getAttribute("title"),
                    lastUpdate: htmlManga.firstElementChild.nextElementSibling.lastElementChild.textContent,
                    listChapter: []
                };
                var curChap = htmlManga.firstElementChild.nextElementSibling.nextElementSibling;
                while (curChap != null) {
                    var chapter = {
                        chapterHref: curChap.getAttribute("href"),
                        //chapterLink: curChap.getAttribute("href").replace("http://mangak.info/", "").replace("/", ""),
                        chapterText: curChap.getAttribute("title")
                    }
                    if (chapter.chapterHref && chapter.chapterText) {
                        var tempChapter = curChap.nextElementSibling;
                        chapter.chapterLink = chapter.chapterHref.replace("http://mangak.info/", "").replace("/", "");
                        if (tempChapter && !tempChapter.getAttribute("href") && !tempChapter.getAttribute("title")) {
                            chapter.chapterNote = tempChapter.textContent;
                        }
                        manga.listChapter.push(chapter);
                    }
                    curChap = curChap.nextElementSibling;
                }
                listManga.push(manga);
            }
        }
        $scope.listManga = listManga;
    });

    $scope.clickManga = function (mangaKLink, title, chapterLink, chapterText) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'views/myModalContent.html',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$scope',
            resolve: {
                link: function () {
                    return mangaKLink;
                },
                title: function () {
                    return title;
                },
                chapter: function () {
                    return chapterLink || '';
                },
                chapterText: function () {
                    return chapterText || '';
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function () {

        });
    };
    var searchData = $resource('/api/getSearchData');
    console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Request getSearchData")
    searchData.query().$promise.then(function (result) {
        console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Receive getSearchData")
        $scope.searchData = JSON.parse(result[0]);
    });
    $scope.search = function () {
            var text = $scope.searchText;
            var map = {
                "ẚ": "a",
                "Á": "a",
                "á": "a",
                "À": "a",
                "à": "a",
                "Ă": "a",
                "ă": "a",
                "Ắ": "a",
                "ắ": "a",
                "Ằ": "a",
                "ằ": "a",
                "Ẵ": "a",
                "ẵ": "a",
                "Ẳ": "a",
                "ẳ": "a",
                "Â": "a",
                "â": "a",
                "Ấ": "a",
                "ấ": "a",
                "Ầ": "a",
                "ầ": "a",
                "Ẫ": "a",
                "ẫ": "a",
                "Ẩ": "a",
                "ẩ": "a",
                "Ǎ": "a",
                "ǎ": "a",
                "Å": "a",
                "å": "a",
                "Ǻ": "a",
                "ǻ": "a",
                "Ä": "a",
                "ä": "a",
                "Ǟ": "a",
                "ǟ": "a",
                "Ã": "a",
                "ã": "a",
                "Ȧ": "a",
                "ȧ": "a",
                "Ǡ": "a",
                "ǡ": "a",
                "Ą": "a",
                "ą": "a",
                "Ā": "a",
                "ā": "a",
                "Ả": "a",
                "ả": "a",
                "Ȁ": "a",
                "ȁ": "a",
                "Ȃ": "a",
                "ȃ": "a",
                "Ạ": "a",
                "ạ": "a",
                "Ặ": "a",
                "ặ": "a",
                "Ậ": "a",
                "ậ": "a",
                "Ḁ": "a",
                "ḁ": "a",
                "Ⱥ": "a",
                "ⱥ": "a",
                "Ǽ": "a",
                "ǽ": "a",
                "Ǣ": "a",
                "ǣ": "a",
                "Ḃ": "b",
                "ḃ": "b",
                "Ḅ": "b",
                "ḅ": "b",
                "Ḇ": "b",
                "ḇ": "b",
                "Ƀ": "b",
                "ƀ": "b",
                "ᵬ": "b",
                "Ɓ": "b",
                "ɓ": "b",
                "Ƃ": "b",
                "ƃ": "b",
                "Ć": "c",
                "ć": "c",
                "Ĉ": "c",
                "ĉ": "c",
                "Č": "c",
                "č": "c",
                "Ċ": "c",
                "ċ": "c",
                "Ç": "c",
                "ç": "c",
                "Ḉ": "c",
                "ḉ": "c",
                "Ȼ": "c",
                "ȼ": "c",
                "Ƈ": "c",
                "ƈ": "c",
                "ɕ": "c",
                "Ď": "d",
                "ď": "d",
                "Ḋ": "d",
                "ḋ": "d",
                "Ḑ": "d",
                "ḑ": "d",
                "Ḍ": "d",
                "ḍ": "d",
                "Ḓ": "d",
                "ḓ": "d",
                "Ḏ": "d",
                "ḏ": "d",
                "Đ": "d",
                "đ": "d",
                "ᵭ": "d",
                "Ɖ": "d",
                "ɖ": "d",
                "Ɗ": "d",
                "ɗ": "d",
                "Ƌ": "d",
                "ƌ": "d",
                "ȡ": "d",
                "ð": "d",
                "É": "e",
                "Ə": "e",
                "Ǝ": "e",
                "ǝ": "e",
                "é": "e",
                "È": "e",
                "è": "e",
                "Ĕ": "e",
                "ĕ": "e",
                "Ê": "e",
                "ê": "e",
                "Ế": "e",
                "ế": "e",
                "Ề": "e",
                "ề": "e",
                "Ễ": "e",
                "ễ": "e",
                "Ể": "e",
                "ể": "e",
                "Ě": "e",
                "ě": "e",
                "Ë": "e",
                "ë": "e",
                "Ẽ": "e",
                "ẽ": "e",
                "Ė": "e",
                "ė": "e",
                "Ȩ": "e",
                "ȩ": "e",
                "Ḝ": "e",
                "ḝ": "e",
                "Ę": "e",
                "ę": "e",
                "Ē": "e",
                "ē": "e",
                "Ḗ": "e",
                "ḗ": "e",
                "Ḕ": "e",
                "ḕ": "e",
                "Ẻ": "e",
                "ẻ": "e",
                "Ȅ": "e",
                "ȅ": "e",
                "Ȇ": "e",
                "ȇ": "e",
                "Ẹ": "e",
                "ẹ": "e",
                "Ệ": "e",
                "ệ": "e",
                "Ḙ": "e",
                "ḙ": "e",
                "Ḛ": "e",
                "ḛ": "e",
                "Ɇ": "e",
                "ɇ": "e",
                "ɚ": "e",
                "ɝ": "e",
                "Ḟ": "f",
                "ḟ": "f",
                "ᵮ": "f",
                "Ƒ": "f",
                "ƒ": "f",
                "Ǵ": "g",
                "ǵ": "g",
                "Ğ": "g",
                "ğ": "g",
                "Ĝ": "g",
                "ĝ": "g",
                "Ǧ": "g",
                "ǧ": "g",
                "Ġ": "g",
                "ġ": "g",
                "Ģ": "g",
                "ģ": "g",
                "Ḡ": "g",
                "ḡ": "g",
                "Ǥ": "g",
                "ǥ": "g",
                "Ɠ": "g",
                "ɠ": "g",
                "Ĥ": "h",
                "ĥ": "h",
                "Ȟ": "h",
                "ȟ": "h",
                "Ḧ": "h",
                "ḧ": "h",
                "Ḣ": "h",
                "ḣ": "h",
                "Ḩ": "h",
                "ḩ": "h",
                "Ḥ": "h",
                "ḥ": "h",
                "Ḫ": "h",
                "ḫ": "h",
                "H": "h",
                "̱": "h",
                "ẖ": "h",
                "Ħ": "h",
                "ħ": "h",
                "Ⱨ": "h",
                "ⱨ": "h",
                "Í": "i",
                "í": "i",
                "Ì": "i",
                "ì": "i",
                "Ĭ": "i",
                "ĭ": "i",
                "Î": "i",
                "î": "i",
                "Ǐ": "i",
                "ǐ": "i",
                "Ï": "i",
                "ï": "i",
                "Ḯ": "i",
                "ḯ": "i",
                "Ĩ": "i",
                "ĩ": "i",
                "İ": "i",
                "i": "i",
                "Į": "i",
                "į": "i",
                "Ī": "i",
                "ī": "i",
                "Ỉ": "i",
                "ỉ": "i",
                "Ȉ": "i",
                "ȉ": "i",
                "Ȋ": "i",
                "ȋ": "i",
                "Ị": "i",
                "ị": "i",
                "Ḭ": "i",
                "ḭ": "i",
                "I": "i",
                "ı": "i",
                "Ɨ": "i",
                "ɨ": "i",
                "Ĵ": "j",
                "ĵ": "j",
                "J": "j",
                "̌": "j",
                "ǰ": "j",
                "ȷ": "j",
                "Ɉ": "j",
                "ɉ": "j",
                "ʝ": "j",
                "ɟ": "j",
                "ʄ": "j",
                "Ḱ": "k",
                "ḱ": "k",
                "Ǩ": "k",
                "ǩ": "k",
                "Ķ": "k",
                "ķ": "k",
                "Ḳ": "k",
                "ḳ": "k",
                "Ḵ": "k",
                "ḵ": "k",
                "Ƙ": "k",
                "ƙ": "k",
                "Ⱪ": "k",
                "ⱪ": "k",
                "Ĺ": "a",
                "ĺ": "l",
                "Ľ": "l",
                "ľ": "l",
                "Ļ": "l",
                "ļ": "l",
                "Ḷ": "l",
                "ḷ": "l",
                "Ḹ": "l",
                "ḹ": "l",
                "Ḽ": "l",
                "ḽ": "l",
                "Ḻ": "l",
                "ḻ": "l",
                "Ł": "l",
                "ł": "l",
                "̣": "l",
                "Ŀ": "l",
                "ŀ": "l",
                "Ƚ": "l",
                "ƚ": "l",
                "Ⱡ": "l",
                "ⱡ": "l",
                "Ɫ": "l",
                "ɫ": "l",
                "ɬ": "l",
                "ɭ": "l",
                "ȴ": "l",
                "Ḿ": "m",
                "ḿ": "m",
                "Ṁ": "m",
                "ṁ": "m",
                "Ṃ": "m",
                "ṃ": "m",
                "ɱ": "m",
                "Ń": "n",
                "ń": "n",
                "Ǹ": "n",
                "ǹ": "n",
                "Ň": "n",
                "ň": "n",
                "Ñ": "n",
                "ñ": "n",
                "Ṅ": "n",
                "ṅ": "n",
                "Ņ": "n",
                "ņ": "n",
                "Ṇ": "n",
                "ṇ": "n",
                "Ṋ": "n",
                "ṋ": "n",
                "Ṉ": "n",
                "ṉ": "n",
                "Ɲ": "n",
                "ɲ": "n",
                "Ƞ": "n",
                "ƞ": "n",
                "ɳ": "n",
                "ȵ": "n",
                "N": "n",
                "̈": "n",
                "n": "n",
                "Ó": "o",
                "ó": "o",
                "Ò": "o",
                "ò": "o",
                "Ŏ": "o",
                "ŏ": "o",
                "Ô": "o",
                "ô": "o",
                "Ố": "o",
                "ố": "o",
                "Ồ": "o",
                "ồ": "o",
                "Ỗ": "o",
                "ỗ": "o",
                "Ổ": "o",
                "ổ": "o",
                "Ǒ": "o",
                "ǒ": "o",
                "Ö": "o",
                "ö": "o",
                "Ȫ": "o",
                "ȫ": "o",
                "Ő": "o",
                "ő": "o",
                "Õ": "o",
                "õ": "o",
                "Ṍ": "o",
                "ṍ": "o",
                "Ṏ": "o",
                "ṏ": "o",
                "Ȭ": "o",
                "ȭ": "o",
                "Ȯ": "o",
                "ȯ": "o",
                "Ȱ": "o",
                "ȱ": "o",
                "Ø": "o",
                "ø": "o",
                "Ǿ": "o",
                "ǿ": "o",
                "Ǫ": "o",
                "ǫ": "o",
                "Ǭ": "o",
                "ǭ": "o",
                "Ō": "o",
                "ō": "o",
                "Ṓ": "o",
                "ṓ": "o",
                "Ṑ": "o",
                "ṑ": "o",
                "Ỏ": "o",
                "ỏ": "o",
                "Ȍ": "o",
                "ȍ": "o",
                "Ȏ": "o",
                "ȏ": "o",
                "Ơ": "o",
                "ơ": "o",
                "Ớ": "o",
                "ớ": "o",
                "Ờ": "o",
                "ờ": "o",
                "Ỡ": "o",
                "ỡ": "o",
                "Ở": "o",
                "ở": "o",
                "Ợ": "o",
                "ợ": "o",
                "Ọ": "o",
                "ọ": "o",
                "Ộ": "o",
                "ộ": "o",
                "Ɵ": "o",
                "ɵ": "o",
                "Ṕ": "p",
                "ṕ": "p",
                "Ṗ": "p",
                "ṗ": "p",
                "Ᵽ": "p",
                "Ƥ": "p",
                "ƥ": "p",
                "P": "p",
                "̃": "p",
                "p": "p",
                "ʠ": "q",
                "Ɋ": "q",
                "ɋ": "q",
                "Ŕ": "r",
                "ŕ": "r",
                "Ř": "r",
                "ř": "r",
                "Ṙ": "r",
                "ṙ": "r",
                "Ŗ": "r",
                "ŗ": "r",
                "Ȑ": "r",
                "ȑ": "r",
                "Ȓ": "r",
                "ȓ": "r",
                "Ṛ": "r",
                "ṛ": "r",
                "Ṝ": "r",
                "ṝ": "r",
                "Ṟ": "r",
                "ṟ": "r",
                "Ɍ": "r",
                "ɍ": "r",
                "ᵲ": "r",
                "ɼ": "r",
                "Ɽ": "r",
                "ɽ": "r",
                "ɾ": "r",
                "ᵳ": "r",
                "ß": "s",
                "Ś": "s",
                "ś": "s",
                "Ṥ": "s",
                "ṥ": "s",
                "Ŝ": "s",
                "ŝ": "s",
                "Š": "s",
                "š": "s",
                "Ṧ": "s",
                "ṧ": "s",
                "Ṡ": "s",
                "ṡ": "s",
                "ẛ": "s",
                "Ş": "s",
                "ş": "s",
                "Ṣ": "s",
                "ṣ": "s",
                "Ṩ": "s",
                "ṩ": "s",
                "Ș": "s",
                "ș": "s",
                "ʂ": "s",
                "S": "s",
                "̩": "s",
                "s": "s",
                "Þ": "t",
                "þ": "t",
                "Ť": "t",
                "ť": "t",
                "T": "t",
                "ẗ": "t",
                "Ṫ": "t",
                "ṫ": "t",
                "Ţ": "t",
                "ţ": "t",
                "Ṭ": "t",
                "ṭ": "t",
                "Ț": "t",
                "ț": "t",
                "Ṱ": "t",
                "ṱ": "t",
                "Ṯ": "t",
                "ṯ": "t",
                "Ŧ": "t",
                "ŧ": "t",
                "Ⱦ": "t",
                "ⱦ": "t",
                "ᵵ": "t",
                "ƫ": "t",
                "Ƭ": "t",
                "ƭ": "t",
                "Ʈ": "t",
                "ʈ": "t",
                "ȶ": "t",
                "Ú": "u",
                "ú": "u",
                "Ù": "u",
                "ù": "u",
                "Ŭ": "u",
                "ŭ": "u",
                "Û": "u",
                "û": "u",
                "Ǔ": "u",
                "ǔ": "u",
                "Ů": "u",
                "ů": "u",
                "Ü": "u",
                "ü": "u",
                "Ǘ": "u",
                "ǘ": "u",
                "Ǜ": "u",
                "ǜ": "u",
                "Ǚ": "u",
                "ǚ": "u",
                "Ǖ": "u",
                "ǖ": "u",
                "Ű": "u",
                "ű": "u",
                "Ũ": "u",
                "ũ": "u",
                "Ṹ": "u",
                "ṹ": "u",
                "Ų": "u",
                "ų": "u",
                "Ū": "u",
                "ū": "u",
                "Ṻ": "u",
                "ṻ": "u",
                "Ủ": "u",
                "ủ": "u",
                "Ȕ": "u",
                "ȕ": "u",
                "Ȗ": "u",
                "ȗ": "u",
                "Ư": "u",
                "ư": "u",
                "Ứ": "u",
                "ứ": "u",
                "Ừ": "u",
                "ừ": "u",
                "Ữ": "u",
                "ữ": "u",
                "Ử": "u",
                "ử": "u",
                "Ự": "u",
                "ự": "u",
                "Ụ": "u",
                "ụ": "u",
                "Ṳ": "u",
                "ṳ": "u",
                "Ṷ": "u",
                "ṷ": "u",
                "Ṵ": "u",
                "ṵ": "u",
                "Ʉ": "u",
                "ʉ": "u",
                "Ṽ": "v",
                "ṽ": "v",
                "Ṿ": "v",
                "ṿ": "v",
                "Ʋ": "v",
                "ʋ": "v",
                "Ẃ": "w",
                "ẃ": "w",
                "Ẁ": "w",
                "ẁ": "w",
                "Ŵ": "w",
                "ŵ": "w",
                "W": "w",
                "ẘ": "w",
                "Ẅ": "w",
                "ẅ": "w",
                "Ẇ": "w",
                "ẇ": "w",
                "Ẉ": "w",
                "ẉ": "w",
                "Ẍ": "x",
                "ẍ": "x",
                "Ẋ": "x",
                "ẋ": "x",
                "Ý": "y",
                "ý": "y",
                "Ỳ": "y",
                "ỳ": "y",
                "Ŷ": "y",
                "ŷ": "y",
                "Y": "y",
                "̊": "y",
                "ẙ": "y",
                "Ÿ": "y",
                "ÿ": "y",
                "Ỹ": "y",
                "ỹ": "y",
                "Ẏ": "y",
                "ẏ": "y",
                "Ȳ": "y",
                "ȳ": "y",
                "Ỷ": "y",
                "ỷ": "y",
                "Ỵ": "y",
                "ỵ": "y",
                "ʏ": "y",
                "Ɏ": "y",
                "ɏ": "y",
                "Ƴ": "y",
                "ƴ": "y",
                "Ź": "z",
                "ź": "z",
                "Ẑ": "z",
                "ẑ": "z",
                "Ž": "z",
                "ž": "z",
                "Ż": "z",
                "ż": "z",
                "Ẓ": "z",
                "ẓ": "z",
                "Ẕ": "z",
                "ẕ": "z",
                "Ƶ": "z",
                "ƶ": "z",
                "Ȥ": "z",
                "ȥ": "z",
                "ʐ": "z",
                "ʑ": "z",
                "Ⱬ": "z",
                "ⱬ": "z",
                "Ǯ": "z",
                "ǯ": "z",
                "ƺ": "z",
                "２": "2",
                "６": "6",
                "Ｂ": "B",
                "Ｆ": "F",
                "Ｊ": "J",
                "Ｎ": "N",
                "Ｒ": "R",
                "Ｖ": "V",
                "Ｚ": "Z",
                "ｂ": "b",
                "ｆ": "f",
                "ｊ": "j",
                "ｎ": "n",
                "ｒ": "r",
                "ｖ": "v",
                "ｚ": "z",
                "１": "1",
                "５": "5",
                "９": "9",
                "Ａ": "A",
                "Ｅ": "E",
                "Ｉ": "I",
                "Ｍ": "M",
                "Ｑ": "Q",
                "Ｕ": "U",
                "Ｙ": "Y",
                "ａ": "a",
                "ｅ": "e",
                "ｉ": "i",
                "ｍ": "m",
                "ｑ": "q",
                "ｕ": "u",
                "ｙ": "y",
                "０": "0",
                "４": "4",
                "８": "8",
                "Ｄ": "D",
                "Ｈ": "H",
                "Ｌ": "L",
                "Ｐ": "P",
                "Ｔ": "T",
                "Ｘ": "X",
                "ｄ": "d",
                "ｈ": "h",
                "ｌ": "l",
                "ｐ": "p",
                "ｔ": "t",
                "ｘ": "x",
                "３": "3",
                "７": "7",
                "Ｃ": "C",
                "Ｇ": "G",
                "Ｋ": "K",
                "Ｏ": "O",
                "Ｓ": "S",
                "Ｗ": "W",
                "ｃ": "c",
                "ｇ": "g",
                "ｋ": "k",
                "ｏ": "o",
                "ｓ": "s",
                "ｗ": "w"
            }

            function normalizeUnicodeString(text) {
                var returnString = "";
                for (var i = 0; i < text.length; i++) {
                    returnString += map[text.charAt(i)] || text.charAt(i);
                }
                return returnString
            }
            $scope.searchResult = [];
            if (text.length >= 3) {
                text = normalizeUnicodeString(text).toUpperCase();
                $scope.searchData.forEach(function (mangaObject) {
                    if (normalizeUnicodeString(mangaObject.title).toUpperCase().indexOf(text) >= 0) {
                        $scope.searchResult.push({
                            title: mangaObject.title,
                            img: mangaObject.img,
                            link: mangaObject.link.replace("http://mangak.info/", "").replace("/", "")
                        });
                    }
                });
                if ($scope.searchResult.length == 0) {
                    $scope.searchResult.push({
                        title: "No result",
                        img: ""
                    });
                    // document.getElementById("imageResult").onerror = function () {
                    //     this.style.display = "none";
                    // }
                }
                $scope.resultStyle = {
                    'padding': "0px 0px 0px 0px"
                }
            } else {
                $scope.resultStyle = {
                    'padding': "0px 0px 0px 0px",
                    'display': 'none'
                }
            }


        }
        //$resource('/api/renewData').query();
}]);

MangakReader.controller('ModalInstanceCtrl', ['$scope', '$resource', '$http', '$window', 'link', 'title', 'chapter', 'chapterText', function ($scope, $resource, $http, $window, link, title, chapter, chapterText) {
    link = link.replace("http://mangak.info", "");
    if (link.charAt(0) != '/') {
        link = '/' + link;
    }
    $scope.curChap = "";
    var mangaChapters = $resource('/api/getChapters' + link);

    $scope.chapterListStyle = {
        "height": (window.screen.availHeight * 80 / 100).toString(),
        "overflow": "scroll",
        "overflow-x": "hidden"
    }
    $scope.imageListStyle = {
        "background": "black",
        "text-align": "center",
        "margin": "0px 0px 0px 0px",
        "height": (window.screen.availHeight * 80 / 100).toString(),
        "overflow-x": "hidden"
    }
    $scope.listChapter = [];
    $scope.listImage = [];
    $scope.title = title;
    $scope.chapterTitle = title;
    $scope.numberImage = 0;
    $scope.imageStyle = {
        "max-width": "100%",
        "max-height": "100%"
    };
    console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Request getChapters")
    mangaChapters.query(function (result) {
        console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Recieve getChapters")
        $scope.chapterHTML = result[0];
        var parser = new DOMParser(),
            doc = parser.parseFromString($scope.chapterHTML, "text/xml");
        var chapters = doc.getElementsByClassName("row");
        var listChapter = [];
        for (var index in chapters) {
            if (isNaN(index)) {
                continue;
            }
            var htmlChapter = chapters[index];
            if (typeof (htmlChapter) == "object") {
                var chapter = {
                    link: htmlChapter.firstElementChild.firstElementChild.getAttribute('href').replace("http://mangak.info/", "").replace("/", ""),
                    mangaKLink: htmlChapter.firstElementChild.firstElementChild.getAttribute('href'),
                    title: htmlChapter.firstElementChild.firstElementChild.getAttribute('title'),
                    lastUpdate: htmlChapter.firstElementChild.nextElementSibling.textContent
                };
                chapter.shortTitle = chapter.title.substring(chapter.title.indexOf('chap'), chapter.title.length).substring(chapter.title.indexOf('Chap'), chapter.title.length)
                listChapter.push(chapter);
            }
        }
        $scope.listChapter = listChapter;
    });

    $scope.chapterClick = function (link, title) {
        $scope.chapterTitle = title;
        $scope.curChap = link;
        $scope.listImage = [];
        link = '/' + link.replace("http://mangak.info/", "").replace(/\//g, "");
        var chapterContent = $resource('/api/getChapterContent' + link);
        console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Request getChapterContent")
        chapterContent.query(function (result) {
            console.log((new Date()).toTimeString().substring(0, (new Date()).toTimeString().indexOf("GMT") - 1) + " - Receive getChapterContent")
            $scope.contentHTML = result[0].replace(/&/g, '&amp;');
            var parser = new DOMParser(),
                doc = parser.parseFromString($scope.contentHTML, "text/xml");
            var content = doc.getElementsByTagName("img");
            var listImage = [];
            for (var index in content) {
                if (isNaN(index)) {
                    continue;
                }
                var htmlImage = content[index];
                if (typeof (htmlImage) == "object") {
                    listImage.push(htmlImage.getAttribute('src'));
                }
            }
            //$scope.listImage = listImage;
            $scope.preloadImage = listImage;
            $scope.numberImage = listImage.length;
            $scope.listImage.push($scope.preloadImage.splice(0, 1)[0]);
        });
    }
    $scope.finishedLoad = function (event) {
        var image = $scope.preloadImage.splice(0, 1)[0];
        if (image)
            $scope.listImage.push(image);
    }
    if (chapter) {
        $scope.chapterClick('/' + chapter, chapterText);
    }
    $scope.resizeImage = function (size) {
        $scope.imageStyle = {
            "max-width": size.toString() + "%",
            "max-height": size.toString() + "%"
        };
    }
    $scope.displayChapterListButtonStyle = {
        "margin": "10px",
        "position": "fixed",
        "left": "12%"
    }
    $scope.bottomBarStyle = {
        "margin": "5px"
    }
    $scope.saysomething = function () {
        console.log('dasd')
    }
    $scope.displayChapterListButton = "Hide list chapter"
    $scope.displayChapterList = function () {
        if ($scope.displayChapterListButtonStyle["left"] == "12%") {
            $scope.displayChapterListButton = "Open list chapter"
            $scope.displayChapterListButtonStyle["left"] = "0%";
            $scope.chapterListStyle["display"] = "none";
            $scope.bottomBarStyle["display"] = "none";
            $scope.imageListStyle["width"] = "100%";
            $scope.imageListStyle["height"] = (window.screen.availHeight * 85 / 100).toString();
            $scope.imageListStyle["margin"] = "0px";
        } else if ($scope.displayChapterListButtonStyle["left"] = "0%") {
            $scope.displayChapterListButtonStyle["left"] = "12%";
            $scope.displayChapterListButton = "Hide list chapter"
            delete $scope.chapterListStyle["display"];
            delete $scope.bottomBarStyle["display"];
            $scope.imageListStyle["margin"] = "0px";
            $scope.imageListStyle["height"] = (window.screen.availHeight * 80 / 100).toString();
            delete $scope.imageListStyle["width"];
        }
    }
}]);