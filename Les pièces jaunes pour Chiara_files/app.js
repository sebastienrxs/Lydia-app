// ng-focus-if
(function() {
    'use strict';
    angular
        .module('focus-if', [])
        .directive('focusIf', focusIf);

    focusIf.$inject = ['$timeout'];

    function focusIf($timeout) {
        function link($scope, $element, $attrs) {
            var dom = $element[0];
            if ($attrs.focusIf) {
                $scope.$watch($attrs.focusIf, focus);
            } else {
                focus(true);
            }
            function focus(condition) {
                if (condition) {
                    $timeout(function() {
                        dom.focus();
                    }, $scope.$eval($attrs.focusDelay) || 0);
                }
            }
        }
        return {
            restrict: 'A',
            link: link
        };
    }
})();

var app = angular.module('app', ["ui.bootstrap", "focus-if", "ngIntlTelInput"], function() {
}).config([
   '$httpProvider',
   function($httpProvider) {
       $httpProvider.defaults.withCredentials = true;
   }
]).config(function (ngIntlTelInputProvider) {
    ngIntlTelInputProvider.set({
        allowExtensions: false,
        autoFormat: false,
        defaultCountry: "fr",
        autoPlaceholder: false,
        onlyCountries: window.phoneCountriesList,
        utilsScript: "/assets/js/libphonenumber.js",
    });
});
