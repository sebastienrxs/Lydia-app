'use strict';
var app = angular.module('app');
app.filter('encodeURIComponent', function() {
    return window.encodeURIComponent;
});
app.controller('RequestComposerController', ["$scope", "signUpFactory", '$modal', function($scope, signUpFactory, $modal) {

    $scope.signUpAndEdit = function() {
        try {
            analytics.track('user-clicked-on-modify-cagnotte-from-preview');
        } catch(err) {}

        signUpFactory(window.initCollectUrl,
            window.editText,
            true,
            window.signupPopupTitle,
            window.signupPopupContent, function() {
                ga('send', 'event', 'button', 'click', 'cagnotte-edited-and-published');
            });
    };


    $scope.share = function(url, title) {
        var modalController = function($scope, $modalInstance, link, title) {
            $scope.link = link;
            $scope.title = title;
            $scope.dismiss = function() {
                $modalInstance.dismiss();
            }
            $scope.initClicktoCopy = function() {
                var client = new ZeroClipboard($("#share-link"));
                client.on("copy", function (event) {
                    var clipboard = event.clipboardData;
                    clipboard.setData( "text/plain", window.collectUrl);
                });

                client.on( "ready", function( readyEvent ) {
                  client.on("aftercopy", function( event ) {
                      $("#share-link").html(window.copiedText);
                  } );
                });
            }
            setTimeout(function(){
                $scope.$apply(function() {
                    $scope.initClicktoCopy();
                });
            }, 200);
        };
        var modalInstance = $modal.open({
          animation: true,
          size:"md",
          backdrop:"static",
          templateUrl: window.templateBase + '/share',
          controller: modalController,
          resolve: {
              link: function() {return url},
              title: function() {return title}
          }
        });
    };

    $scope.signUpAndPublish = function() {
        try {
            analytics.track('user-clicked-on-publish-from-preview');
        } catch(err) {}

        signUpFactory(window.initCollectAndPublishUrl,
            window.publishText,
            true,
            window.signupPopupTitle,
            window.signupPopupContent, function() {
                ga('send', 'event', 'button', 'click', 'cagnotte-published');
            });
    };

    $scope.login = function() {
        signUpFactory(window.collectDashboardUrl,
            window.connectionText,
            false,
            window.loginPopupTitle,
            window.loginPopupContent, function() {});
    };
}]);
