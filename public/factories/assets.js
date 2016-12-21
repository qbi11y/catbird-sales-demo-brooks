var app = angular.module('Assets', []);

app.factory('Assets', ['$http', function($http) {
    var assets = {};
    assets.assets = [
        {name: 'Test Name', region: 'us-west-1a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'private', details: {}},
        {name: 'Some Asset', region: 'us-east-2a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'private', details: {}},
        {name: 'Gameday Yeh!', region: 'uk-north-1a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'public', details: {}}
    ];

    assets.securityGroups = [
        {name: 'SPFrontEnd', description: 'Sharepoint Front End', vpcAssoc: 'VPC-1a2b3c4d', groupID: 'sg-900394f9', }
    ]
    assets.selectedAssets = [];
    assets.getSecurityGroups = function() {
        return securityGroups
    }
    assets.getAssetsSummary = function() {
        $http.get('/catbird').then(function(res) {
            console.log('catbird response', res);
            assets.assets = res;
            return assets.assets
        }, function(err) {
            console.log('catbird error', err);
        })
    }

    assets.getAssets = function() {
        return assets.assets
    }

    assets.setSelectedAssets = function(item, action) {
        if (!action) {
            console.log('adding to array');
            assets.selectedAssets.push(item);
        } else {
            for (var n=0; n < assets.selectedAssets.length; n++) {
                if (assets.selectedAssets[n] == item) {
                    console.log('found a match');
                    delete assets.selectedAssets[n];
                    break
                }
            }
            console.log('removing from array', assets.selectedAssets);
        }

    }
    return assets
}])