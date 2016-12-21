var app = angular.module('Datatable', []);

app.directive('datatable', function() {
    return {
        restrict: 'E',
        scope: {},
        link: function(scope, elem, attrs) {
            var data = JSON.parse(attrs.data);
            scope.headers = data.headers;
            scope.data = data.data;
            scope.type = data.type;
            console.log('data attr', data);
            scope.filter = attrs.filter;
        },
        controller: '@',
        name: 'controller',
        templateUrl: 'directives/templates/datatable.html'
    }
})