var app = angular.module('Assets', []);

app.factory('Assets', ['$http', function($http) {
    var assets = {};
    assets.summary = {};
    assets.selectedAssets = [];
    assets.assets = [
        {name: 'Test Name', region: 'us-west-1a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'private', details: {}},
        {name: 'Some Asset', region: 'us-east-2a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'private', details: {}},
        {name: 'Gameday Yeh!', region: 'uk-north-1a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'public', details: {}}
    ];

    //data for security groups
    assets.securityGroups = [
        {name: 'Dot 9 Network', details: {description: 'Some Dot 9 Network description', vpcAssoc: 'VPC-1a2b3c4d', groupID: 'sg-900394f9', instances: 7, egress: 'egress info', ingress: 'ingress info', tags: ['list', 'of', 'tags'], flow_summary:''}},
        {name: '.11 Network', details: {description: 'Some .11 Network description', vpcAssoc: 'VPC-1a2b3c4d', groupID: 'sg-900394f9', instances: 7, egress: 'egress info', ingress: 'ingress info', tags: ['list', 'of', 'tags'], flow_summary:''}},
        {name: 'Security', details: {description: 'Some Security description', vpcAssoc: 'VPC-1a2b3c4d', groupID: 'sg-900394f9', instances: 7, egress: 'egress info', ingress: 'ingress info', tags: ['list', 'of', 'tags'], flow_summary:''}}
    ]

    //data for ec2 instances
    assets.instances = [
        {name: 'i-4567890123abcdef', details: {ownerID: 1234567, imageID: 'ami-123456', subnetID: 'subnet-56f5f633', vpcID: 'vpc-1a2d', sgAssoc: 'Security Group', type: 't2.micro', state: 'running', zone: 'eu-west-1c', launchTime: '2015-12- 22T10:44:05.000Z', tags: ['list', 'of', 'tags'], interfacePriv: '192.168.1.88', interfacePub: '54.194.252.215', dnsPriv: 'ip-192- 168-1- 88.eu-west-1.compute.internal', dnsPub: 'ec2-54- 194-252- 215.eu-west- 1.compute.amazonaws.com'}},
        {name: 'i-1234890abcdef', details: {ownerID: 1234567, imageID: 'ami-123456', subnetID: 'subnet-56f5f633', vpcID: 'vpc-1a2d', sgAssoc: 'Security Group', type: 't2.micro', state: 'running', zone: 'eu-west-1c', launchTime: '2015-12- 22T10:44:05.000Z', tags: ['list', 'of', 'tags'], interfacePriv: '192.168.1.88', interfacePub: '54.194.252.215', dnsPriv: 'ip-192- 168-1- 88.eu-west-1.compute.internal', dnsPub: 'ec2-54- 194-252- 215.eu-west- 1.compute.amazonaws.com'}},
        {name: 'i-78904ete4abcdef', details: {ownerID: 1234567, imageID: 'ami-123456', subnetID: 'subnet-56f5f633', vpcID: 'vpc-1a2d', sgAssoc: 'Security Group', type: 't2.micro', state: 'running', zone: 'eu-west-1c', launchTime: '2015-12- 22T10:44:05.000Z', tags: ['list', 'of', 'tags'], interfacePriv: '192.168.1.88', interfacePub: '54.194.252.215', dnsPriv: 'ip-192- 168-1- 88.eu-west-1.compute.internal', dnsPub: 'ec2-54- 194-252- 215.eu-west- 1.compute.amazonaws.com'}}
    ]
    
    assets.getInstances = function() {
        return assets.instances
    }
    assets.getSecurityGroups = function() {
        return asssets.securityGroups
    }

    assets.getAssetsSummary = function() {
        $http.get('/catbird').then(function(res) {
            console.log('catbird response', res);
            assets.summary = res;
            return assets.summary
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