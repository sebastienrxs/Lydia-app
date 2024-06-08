var app = angular.module('app');

app.factory('signUpFactory', ['$modal','$http', '$timeout', function($modal, $http, $timeout) {
    var modalController = function($scope, $modalInstance, redirectUrl, submitLabel, isSignup, popupTitle, popupHelp, clickCb) {
        $scope.isLoading = false;
        $scope.firstname = "";
        $scope.lastname = "";
        $scope.mobilenumber = "";
        $scope.errorMessage = "";
        $scope.isSignup = isSignup;
        $scope.submitLabel = submitLabel;
        $scope.codeRequired = false;
        $scope.code = "";
        $scope.clickCb = clickCb;
        $scope.title = popupTitle;
        $scope.description = popupHelp;

        $scope.dismiss = function() {
            $modalInstance.dismiss();
        }

        $scope.submit = function() {
            $scope.clickCb();
            $scope.isLoading = true;
            var url = "";
            if ($scope.isSignup) {
                url = window.signupUrl;
            } else {
                url = window.loginUrl;
            }
            $http.post(
                url,
                "token=" + $('#token').val() + "&firstname=" + $scope.firstname + "&lastname=" + $scope.lastname + "&mobilenumber=" + encodeURIComponent($("#mobilenumber").intlTelInput("getNumber")) + "&code=" + $scope.code,
                {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                success(function(data, status, headers, config) {
                    if ($scope.isSignup)  {
                        try {
                            analytics.alias(data.user_id);
                        } catch(err) {}
                    }
                    window.trackFbEvent("6024010589249", function() {
                        window.trackTwEvent("l6kv8", function() {
                            $scope.$eval(function() {
                                $scope.isLoading = false;
                                window.location.href = redirectUrl;
                            });
                        });
                    });
                }).error(function(data, status) {
                    $scope.isLoading = false;
                    $('#token').val(data.token);
                    if (status == 401) {
                        $scope.codeRequired = true;
                        $scope.errorMessage = data.error;
                        $timeout(function () {
                            $('#code').focus();
                        }, 0);
                    }else if (status == 400) {
                        $scope.errorMessage = data.error;
                    }
                });
        }
    };

    var open = function(redirectUrl, submitLabel, isSignup, popupTitle, popupHelp, clickCb) {
      var modalInstance = $modal.open({
        animation: true,
        size:"sm",
        windowClass: "cagnotte-bs-modal",
        templateUrl: window.templateBase + '/signup',
        controller: modalController,
        resolve: {
            redirectUrl: function() { return redirectUrl },
            submitLabel: function() { return submitLabel },
            isSignup: function() { return isSignup },
            popupTitle: function() { return popupTitle },
            popupHelp: function() { return popupHelp },
            clickCb: function() { return clickCb },
        }
      }).rendered.then(function () {
          $('body').css({
              "position": "fixed",
              "width": "100%"
          });
      });
    };
   return function(redirectUrl, submitLabel, isSignup, popupTitle, popupHelp, clickCb) {
       open(redirectUrl, submitLabel, isSignup, popupTitle, popupHelp, clickCb);
   };
 }]);
