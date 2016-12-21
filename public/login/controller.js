/////////////////////////////////////////////////////////////////////////////
/// LOGIN CONTROLLER
/// Talks to Login Page (login/index.html)
/////////////////////////////////////////////////////////////////////////////

var app = angular.module('LoginCtrl', ['ngMaterial', 'Users']);  //define the angular module

app.controller('LoginCtrl', ['$scope', '$http', '$state', 'Assets', 'Users', function($scope, $http, $state, Assets, Users) {
    console.log('log in');

    $scope.login = function(user) {
        //console.log(user);
        //
        $http.post('/login', user).then(function(res) {
            console.log('server response', res);
            $state.go('index');
        }, function(err) {
            console.log('server err', err);
        })

    }
}]);