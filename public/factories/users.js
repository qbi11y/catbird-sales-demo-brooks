var app = angular.module('Users', []);

app.factory('Users', ['$http', function($http) {
    var user = {};

    user.login = function(usr) {
        return true
    }

    return user
}])