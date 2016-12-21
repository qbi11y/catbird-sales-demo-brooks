var app = angular.module('EventsCtrl', ['ngMaterial']);

app.controller('EventsCtrl', ['$scope', '$http', '$state', function($scope, $http, $state) {
    console.log('Alerts Controller Working');
    
    $scope.events = [
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'},
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'},
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'},
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'},
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'},
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'},
        {title: 'Flow log synced', timestamp: 'Today 12:35a', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum tenetur mollitia veniam, sequi consequuntur voluptatibus! Blanditiis quo facere voluptate. Fuga ad vel dicta, rem ipsum molestiae quis temporibus earum repellendus.'}
    ];
}])