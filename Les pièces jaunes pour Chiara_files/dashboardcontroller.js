'use strict';
var app = angular.module('app').filter('trustAsHtml', ['$sce', function($sce){


  return function(text) {
    if (text) {
      return $sce.trustAsHtml(text);
    }
  };
}]).filter('stripStyles', function() {
  return function(str) {
    if (str) {
      return str.replace(/style=['"].*["']/g, '');
    }

  }
});

app.controller('EditorController', ["$scope", "$location", "$modal", "$http", "$window", "$timeout", "$q", function($scope, $location, $modal, $http, $window, $timeout, $q) {
    $scope.errors = {};
    $scope.imageMode = window.imageMode;
    $scope.isUpdatingSlug = false;
    $scope.isSaving = false;
    $scope.slug = window.slug;
    $scope.collectUrl = "";
    $scope.urlIsValid = false;
    $scope.urlIsInvalid = false;
    $scope.checkingSlug = false;
    $scope.privacy = window.privacy;
    $scope.showEmailModal = false;
    $scope.userEmailError = false;
    $scope.userExists = false;

    $scope.toggleEmailModal = function () {
      $scope.showEmailModal = !$scope.showEmailModal
    }

    if (getUrlParameter('ask_email')) {
      $scope.showEmailModal = true
    }

    if (getUrlParameter('user_exists')) {
      $scope.userExists = true
    }

    if (getUrlParameter('email_error')) {
      $scope.userEmailError = true
    }

    $scope.selectTabFromUrl = function() {
        var defaultTabIndex = 0;
        if ($location.search().tab == undefined) {
            $scope.selectedTab = defaultTabIndex;
        } else {
            $scope.selectedTab = $location.search().tab;
        }
    };

    $scope.validateSlug = function() {
        $scope.checkingSlug = true;
        $http.post("validateslug",
                  "token=" + $('#token-save').val() + "&slug=" + encodeURIComponent($scope.slug) + "&privacy=" + encodeURIComponent($scope.privacy),
                  {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                  success(function(data, status, headers, config) {
                      $('#token-save').val(data.token);
                      $scope.urlIsValid = true;
                      $scope.urlIsInvalid = false;
                      $scope.slug = data.slug;
                      $scope.checkingSlug = false;
                  }).error(function(data, status) {
                      if (status == 400) {
                          $('#token-save').val(data.token);
                          $scope.urlIsValid = false;
                          $scope.urlIsInvalid = true;
                      }
                      $scope.checkingSlug = false;
                  });
    };

    $scope.withdrawAmount = function(maxAmount, userEmail) {
        var withdrawController = function($scope, $modalInstance) {
            $scope.userEmailIsKnown = userEmail.length > 0;
            $scope.userEmailAddress = userEmail;
            $scope.maxAmount = maxAmount;
            $scope.withdrawAmount = "";
            $scope.finalWithdrawAmount = "";
            $scope.iban = "";
            $scope.bic = "";
            $scope.commission = window.withdrawVariableCommission;
            $scope.loading = false;
            $scope.errorMessage = "";
            $scope.currency = window.collectCurrency;

            $scope.$watch("withdrawAmount", function() {
                $scope.finalWithdrawAmount = $scope.cleanWithdrawAmountVal() - ($scope.cleanWithdrawAmountVal() * $scope.commission/100)
            });

            $scope.cleanWithdrawAmountVal = function() {
                return $scope.withdrawAmount.replace(/,/g, ".");
            };

            $scope.dismiss = function() {
                $modalInstance.dismiss();
            };

            $scope.sendWithdraw = function() {
                $scope.loading = true;
                if ($scope.currency == 'EUR') {
                    $scope.getParameters = '&iban=' + encodeURIComponent($scope.iban)+'&bic=' + encodeURIComponent($scope.bic);
                } else {
                    $scope.getParameters = '&sort_code=' + encodeURIComponent($scope.sort_code) + '&account_number=' + encodeURIComponent($scope.account_number);
                }

                $http.post("withdraw",
                          "token=" + $('#token-withdraw-amount').val() + "&amount=" + encodeURIComponent($scope.cleanWithdrawAmountVal()) + $scope.getParameters + '&email='+encodeURIComponent($scope.userEmailAddress),
                          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                          success(function(data, status, headers, config) {
                              window.trackFbEvent("6024010539849", function() {
                                  window.trackTwEvent("l6kvb", function() {
                                      window.trackGaEvent("cagnotte-withdrawn", function() {
                                          $scope.$eval(function() {
                                              var location = window.collectDashboardUrl + "#/!?tab=0";
                                              window.location.replace(location);
                                              window.location.reload();
                                              $scope.loading = false;
                                          });
                                      });
                                  });
                              });
                          }).error(function(data, status) {
                              if (status == 400) {
                                  $('#token-withdraw-amount').val(data.token);
                                  $scope.errorMessage = data.error;
                              }
                              $scope.loading = false;
                          });
            }
        };

        var modalInstance = $modal.open({
          animation: true,
          size:"sm",
          windowClass: "cagnotte-bs-modal",
          templateUrl: window.templateBase + '/withdraw',
          controller: withdrawController,
          resolve: {
          }
        }).rendered.then(function () {
            $('#withdrawToBankAmount').focus();
        });
    };

    $scope.explainBlockedAmount = function() {
        var blockedAmountController = function($scope, $modalInstance) {
            $scope.closeBlockedAmountPopup = function () {
                $modalInstance.dismiss();
            }

            $scope.dismiss = function() {
                $modalInstance.dismiss();
            }
        }

        var modalInstance = $modal.open({
          animation: true,
          size:"md",
          templateUrl: window.templateBase + '/blockedAmount',
          controller: blockedAmountController,
          resolve: {}
        });
    }

    $scope.withdrawToCoupon = function(maxAmount, go, user_email) {
        var couponController = function($scope, $modalInstance) {
            $scope.maxAmount = maxAmount;
            $scope.requestedAmount = maxAmount;
            $scope.finalAmount = "";
            $scope.serviceAmount = 0;
            $scope.email = "";
            $scope.user_email = user_email;
            $scope.cgv = "";
            $scope.coupons = window.coupons;
            $scope.coupon = 0;
            $scope.errorMessage = "";
            $scope.giftAvailable = false;
            $scope.show_choose_confirmation = false;
            $scope.show_confirmation = false;
            $scope.show_error_coupons = false;
            $scope.show_list_coupons = true;
            $scope.show_list_coupons_result = false;
            $scope.choose_coupon_show = true;
            $scope.valid_coupon_show = false;
            $scope.show_loading_coupons = false;
            $scope.coupon_key = null;
            $scope.show_error_email = false;
            $scope.show_error_amount = false;
            $scope.loader = '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>';
            $scope.end_confirmation_show = false;
            $scope.go = go;
            $scope.page = 1;
            $scope.cancel_request = $q.defer();
            $scope.request_resolve = false;
            $scope.html_page_regex = /<[a-z][\s\S]*>/i;

            $scope.dismiss = function() {
                $modalInstance.dismiss();
            }

            $scope.$watch("requestedAmount", function() {
                $scope.computeAmounts();
            });

            $scope.cleanWithdrawAmountVal = function() {
                return $scope.requestedAmount.replace(/,/g, ".");
            }

            $scope.search_coupon = function() {
                $scope.disable_choose_coupon_buttons = false;
                $scope.choose_coupon_show = true;
                $scope.valid_coupon_show = false;
                $scope.show_list_coupons = true;
                $scope.page = 1;
                $scope.computeAmounts();
            }

            $scope.computeAmounts = function() {
                if ($scope.page != 1) {
                    return;
                }
                $scope.show_error_amount = false;
                if (parseFloat($scope.requestedAmount) > parseFloat($scope.maxAmount)) {
                    $scope.show_error_amount = true;
                    return;
                }
                $scope.show_list_coupons_result = false;
                $scope.show_error_coupons = false;
                $scope.show_loading_coupons = true;
                if($scope.request_resolve) {
                    $scope.cancel_request.resolve('cancel');
                }
                $scope.cancel_request = $q.defer();
                $scope.request_resolve = true;
                $http({
                    method: 'GET',
                    url: 'coupon/get-offers/'+$scope.cleanWithdrawAmountVal(),
                    timeout: $scope.cancel_request.promise
                }).success(function(data) {
                    $scope.show_loading_coupons = false;
                    if ($scope.html_page_regex.test(data) && $scope.requestedAmount !== '') {
                        location.reload();
                    }
                    $scope.coupons = [];
                    if (Array.isArray(data)) {
                        data.forEach(function (item) {
                            item.percent = Math.round((item.amount - $scope.requestedAmount) / $scope.requestedAmount * 100);
                            if (item.percent > 0 && item.discountedAmount > 0) {
                                item.show = 'both';
                            } else if (item.percent <= 0 && ($scope.requestedAmount - item.discountedAmount) > 0  && item.discountedAmount > 0) {
                                item.show = 'second';
                            } else if (item.percent <= 0 && item.discountedAmount <= 0) {
                                item.show = 'nodiscount';
                            } else if (item.percent > 0) {
                                item.show = 'first';
                            }
                            if (item.show) {
                                $scope.coupons.push(item);
                            }
                        })
                        if ($scope.coupons[0]) {
                            $scope.show_error_coupons = false;
                            $scope.show_list_coupons_result = true;
                        } else {
                            $scope.show_list_coupons_result = false;
                            $scope.show_error_coupons = true;
                        }
                    } else {
                        $scope.show_list_coupons_result = false;
                        $scope.show_error_coupons = true;
                    }
                    $scope.request_resolve = false;
                });
            }

            $scope.choose_coupon = function(chosen_coupon, coupon_value, event) {
                if ($scope.disable_choose_coupon_buttons == true) {
                    return;
                }
                var button = $(event.currentTarget);
                $scope.disable_choose_coupon_buttons = true;
                button.html($scope.loader);
                $http({
                    method: 'GET',
                    url: 'coupon/get-offer-details/'+ $scope.requestedAmount +'/'+chosen_coupon.id+'/'+chosen_coupon.api_name+'/'+coupon_value
                }).success(function(data) {
                    if ($scope.html_page_regex.test(data)) {
                        location.reload();
                    }
                    $scope.page = 2;
                    $scope.show_choose_confirmation = false;
                    $scope.show_confirmation = true;
                    $scope.choose_coupon_show = false;
                    $scope.show_back_button = true;
                    $scope.valid_coupon_show = true;
                    $('.valid-coupon input[type="email"]').focus();
                    $scope.coupon = data;
                    $scope.coupon.discountedAmount = chosen_coupon.discountedAmount;
                    var d = new Date(data.validityDate);
                    $scope.coupon.validityDate = ('0'+ (d.getDate())).slice(-2) + '/' + ('0'+ (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
                    $scope.coupon_value = coupon_value;
                    if ($scope.coupon.discountedAmount === -1) {
                        $scope.coupon_amount = $scope.requestedAmount;
                        $scope.offered =  0;
                    } else if (coupon_value == 0) {
                        $scope.coupon_amount = $scope.coupon.amount;
                        $scope.offered =  $scope.coupon.amount - $scope.requestedAmount;
                    } else {
                        $scope.coupon_amount = $scope.requestedAmount;
                        $scope.offered =  $scope.requestedAmount - $scope.coupon.discountedAmount;
                    }
                }).error(function() {
                    button.html($scope.go);
                    alert('Erreur veuillez réessayer');
                });
            }

            $scope.create_coupon = function(event) {
                if ($scope.disable_create_coupon_button == true) {
                    return;
                }
                var button = $(event.currentTarget);
                var text_button = button.html();
                button.html($scope.loader);
                $scope.show_error_email = false;
                if ($scope.email == undefined || $scope.email == "") {
                    $scope.show_error_email = true;
                }

                if (($scope.email != undefined && $scope.email != "") || $scope.user_email) {
                    if ($scope.user_email) {
                        var email = $scope.user_email;
                    } else {
                        var email = $scope.email;
                    }
                    var amount = $scope.coupon_value ? $scope.coupon.discountedAmount : $scope.requestedAmount;
                    $scope.disable_create_coupon_button = true;
                    $http({
                        method: 'GET',
                        url: 'coupon/reserve-offer/' + amount + '/' + $scope.coupon.id + '/' + $scope.coupon.api_name + '/' + email + '/' + $scope.me + '/' +$scope.offered + '/' + $scope.coupon_value
                    }).success(function (data) {
                        if ($scope.html_page_regex.test(data)) {
                            location.reload();
                        }
                        if ('error' in data) {
                            $scope.disable_create_coupon_button = false;
                            alert(data.error);
                        } else {
                            $scope.page = 3;
                            button.html(text_button);
                            $scope.valid_coupon_show = false;
                            $scope.end_confirmation_show = true;
                        }
                        button.html(text_button);
                    }).error(function () {
                        alert('Erreur veuillez réessayer');
                        button.html(text_button);
                    });
                } else {
                    button.html(text_button);
                }
            }

            $scope.$on('modal.closing', function() {
                if ($scope.page == 3) {
                    $window.location.reload();
                }
            });

        }

        var modalInstance = $modal.open({
            animation: true,
            size:"md",
            backdrop: 'static',
            templateUrl: window.templateBase + '/coupon',
            controller: couponController,
            resolve: {

            },
        });
    }

    function getUrlParameter(name) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
      var results = regex.exec(location.hash)
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
    }

    if (getUrlParameter('coupon')) {
      $scope.withdrawToCoupon(getUrlParameter('amount'), 'Voir', '')
    }


    $scope.closeCagnotte = function (userEmail, transactionsCount) {
        var closingController = function ($scope, $modalInstance) {
            $scope.userEmailIsKnown = userEmail.length > 0;
            $scope.transactionsCount = transactionsCount;
            $scope.userEmailAddress = userEmail;

            $scope.dismiss = function() {
                $modalInstance.dismiss();
            };

            $scope.submit = function () {
                $scope.loading = true;
                $http.post('archive',
                    "token=" + $('#token').val() + '&email='+encodeURIComponent($scope.userEmailAddress),
                    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
                    .success(function () {
                        window.location.href = window.collectUrl + '/archived';
                    })
                    .error(function (data, status) {
                        if (status === 400) {
                            $('#token').val(data.token);
                            $scope.errorMessage = data.error;
                        }
                        $scope.loading = false;
                });
            }
        };
        var modalInstance = $modal.open({
            animation: true,
            size:"sm",
            templateUrl: window.templateBase + '/closecagnotte',
            controller: closingController,
            resolve: {

            }
        }).rendered.then(function () {
            $('#emailForClosing').focus();
        });
    };

    $scope.withdrawToLydiaCard = function(maxAmount) {
        var withdrawController = function($scope, $modalInstance) {
            $scope.maxAmount = maxAmount;
            $scope.withdrawAmount = "";
            $scope.commission = window.lydiaWithdrawVariableCommission;
            $scope.finalWithdrawAmount = "";
            $scope.loading = false;
            $scope.errorMessage = "";
            $scope.formatAmount = window.formatAmount;

            $scope.$watch("withdrawAmount", function() {
                $scope.finalWithdrawAmount = $scope.cleanWithdrawAmountVal() - ($scope.cleanWithdrawAmountVal() * $scope.commission/100);
            });

            $scope.cleanWithdrawAmountVal = function() {
                return $scope.withdrawAmount.replace(/,/g, ".");
            };

            $scope.dismiss = function() {
                $modalInstance.dismiss();
            };

            $scope.sendWithdraw = function() {
                $scope.loading = true;
                $http.post("withdrawtolydiacard",
                          "token=" + $('#token-withdraw-lydia').val() + "&amount=" + encodeURIComponent($scope.cleanWithdrawAmountVal()),
                          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                          success(function(data, status, headers, config) {
                              window.trackFbEvent("6024010539849", function() {
                                  window.trackTwEvent("l6kvb", function() {
                                      window.trackGaEvent("cagnotte-withdrawn", function() {
                                          $scope.$eval(function() {
                                              var location = window.collectDashboardUrl + "#/!?tab=0";
                                              window.location.replace(location);
                                              window.location.reload();
                                              $scope.loading = false;
                                          });
                                      });
                                  });
                              });
                          }).error(function(data, status) {
                              if (status == 400) {
                                  $('#token-withdraw-lydia').val(data.token);
                                  $scope.errorMessage = data.error;
                              }
                              $scope.loading = false;
                          });
            }
        };

        var modalInstance = $modal.open({
          animation: true,
          size:"sm",
          templateUrl: window.templateBase + '/withdrawtolydiacard',
          controller: withdrawController,
          resolve: {
          }
        }).rendered.then(function () {
            $('#withdrawToLydiaAmount').focus();
        });
    };

    $scope.save = function() {
        $scope.isSaving = true;
        var form = $("#edit-campaign-form")[0];
        $('#edit-campaign-form input[type="file"]').each(function() {
            if ($(this).val() == '') {
                $(this).remove();
            }
        });
        var formData = new FormData(form);
        $.ajax({
            url: $(form).attr("action"),
            type: 'POST',
            data: formData,
            async: true,
            success: function (data) {
                $scope.$apply(function() {
                    $scope.isSaving = false;
                    window.location = data;
                });

            },
            error: function(jqXHR, textStatus, errorThrown) {
                $scope.$apply(function() {
                    $scope.isSaving = false;
                    if (jqXHR.status == 400) {
                        var response = JSON.parse(jqXHR.responseText);
                        $('#token-save').val(response.token);
                        $scope.errors = JSON.parse(response.error);
                    }
                });
            },
            cache: false,
            contentType: false,
            processData: false
        });
        return false;
    };

    $scope.fileChanged = function(el) {
        readURL(el)
        $scope.$apply(function(){
            $scope.imageMode = "upload";
        });
    }

    function readURL(input) {
      if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
          $('.upload-container .row > div:first-child .image-preview').css('background-image', 'url(' + e.target.result + ')');
        }

        reader.readAsDataURL(input.files[0]);
      }
    }

    $scope.selectTabFromUrl();
}]);

$('#menu').affix();
$(function() {
   $('body').scrollTop(0);
});
