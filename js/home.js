var MangakReader = angular.module('MangakReader', ['ngResource', 'ngSanitize', 'ngAnimate', 'ui.bootstrap']);

MangakReader.directive('imageonload', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var fn = $parse(attrs.imageonload);
            element.bind('load', function () {
                scope.$apply(function () {
                    fn(scope, { $event: event });
                });
            });
            element.bind('error', function () {
                alert("There are some images that cant be loaded.")
            });
        }
    };
}]);

MangakReader.controller('HomeController', ['$scope', '$resource', '$uibModal', function ($scope, $resource, $uibModal) {
    var newManga = $resource('/api/getNewManga');
    newManga.query(function (result) {
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
}]);

MangakReader.controller('ModalInstanceCtrl', ['$scope', '$resource', '$http', 'link', 'title', 'chapter', 'chapterText', function ($scope, $resource, $http, link, title, chapter, chapterText) {
    link = link.replace("http://mangak.info", "");
    var mangaChapters = $resource('/api/getChapters' + link);

    $scope.chapterListStyle = { "height": (window.screen.availHeight * 80 / 100).toString(), "overflow": "scroll", "overflow-x": "hidden" }
    $scope.imageListStyle = { "text-align": "center", "margin": "0px 0px 0px 0px", "height": (window.screen.availHeight * 80 / 100).toString(), "overflow": "scroll", "overflow-x": "hidden" }
    $scope.listChapter = [];
    $scope.listImage = [];
    $scope.title = title;
    $scope.chapterTitle = title;
    $scope.numberImage = 0;
    $scope.imageStyle = { "max-width": "100%", "max-height": "100%" };
    mangaChapters.query(function (result) {
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
        $scope.listImage = [];
        link = link.replace("http://mangak.info", "");
        var chapterContent = $resource('/api/getChapterContent' + link);
        chapterContent.query(function (result) {
            $scope.contentHTML = result[0];
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
        $scope.imageStyle = { "max-width": size.toString() + "%", "max-height": size.toString() + "%" };
    }
}]);

