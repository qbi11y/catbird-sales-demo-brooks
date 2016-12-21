/////////////////////////////////////////////////////////////////////////////
/// ASSET CONTROLLER
/// Talks to Inventory Page (assets/index.html)
/////////////////////////////////////////////////////////////////////////////

var app = angular.module('AssetsCtrl', ['ngMaterial', 'Assets', 'Datatable']);  //define the angular module

app.controller('AssetsCtrl', ['$scope', '$http', '$state', 'Assets', function($scope, $http, $state, Assets) {
    
    $scope.assetTypes = ['EC2 Instances', 'VPCs', 'Security Groups'];  //array holds the asset types that show up in dropdown
    $scope.assets = Assets.getAssets();      //gets the assets to display on the screen
    $scope.tableData = {
        type: '', 
        headers: [{title: 'name', width: 2}, {title: 'region', width: 2}, {title: 'vpc', width: 1}, {title: 'security group', width: 2}, {title: 'tags', width: 1}, {title: 'subnet', width: 2}], data: $scope.assets};
    $('[data-toggle="popover"]').popover();  //active the bootstrap popover, needed since popovers are created dynamically
    
    //activate angular-material drowdown, needed since dropdowns are created dynamically
    $('.dropdown-button').dropdown({
        inDuration: 300,
        outDuration: 225,
        constrain_width: false, // Does not change width of dropdown to that of the activator
        hover: true,            // Activate on hover
        gutter: 0,              // Spacing from edge
        belowOrigin: false,     // Displays dropdown below the button
        alignment: 'left'       // Displays dropdown with edge aligned to the left of button
        }
    );

    $scope.showData = function(type) {
        console.log(type);
        switch (type) {
            case 'Security Groups':
                console.log('switch to security groups');
                //var data = Assets.getSecurityGroups();
                $scope.tableData = {
                    type: '', 
                    headers: [{title: 'name', width: 2}, {title: 'description', width: 2}, {title: 'vpc association', width: 1}, {title: 'group id', width: 2}, {title: 'ec2 instances', width: 1}], data: $scope.assets};
    
                break;
        }
    }

    //collect the assets the user selected so they can be compared
    $scope.updateSelected = function(asset) {
        console.log('udpate array', asset);
        if (asset.selected == true) {
            Assets.setSelectedAssets(asset);  //send selected asset to Asset factory to be stored
        } else {
            Assets.setSelectedAssets(asset, 'remove');  //send selected asset to Asset factory to be removed
        }
    }

    //expand and collapse the list item to hide and show details
    $scope.toggleDetails = function(asset) {
        if (asset.show == true) {
            asset.show = false;     //hide the details
        } else {
            asset.show = true       //show the details
        }
    }
}]);