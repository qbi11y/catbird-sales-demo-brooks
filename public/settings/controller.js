var app = angular.module('SettingsCtrl', ['ngMaterial']);

app.controller('SettingsCtrl', ['$scope', '$http', '$state', function($scope, $http, $state) {
    console.log('Settings Controller Working');
    $scope.updateChart = function(item) {
        console.log('show item', item);
    }
}])