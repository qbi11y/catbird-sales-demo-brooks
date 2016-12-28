var app = angular.module('TopologyCtrl', ['ngMaterial', 'Assets', 'D3chart']);

app.controller('TopologyCtrl', ['$scope', '$http', '$state', 'Assets', function($scope, $http, $state, Assets) {
    $('.collapsible').collapsible();
    /*$('[data-toggle="toggle"]').change(function(){
        $(this).parents().next('.hide').toggle();
    });*/

    $('.catbird-list-expandable > li').on('click', function() {
        console.log('clicked', $(this));

    });

    $scope.assets = Assets.getAssets();
    $scope.viewTypes = ['graph', 'table'];
    $scope.selectedDetail = '';
    $scope.selectedNode = null;
    $scope.dataFlow = [
        { name: 'Data Flow', region: 'us-west-1a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'private', details: {} },
        { name: 'Data Flow', region: 'us-east-2a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'private', details: {} },
        { name: 'Data Flow', region: 'uk-north-1a', vpc: '3', securityGroup: '4', tags: [], subnet: '172.1.0.1/24', facing: 'public', details: {} }
    ];

    $scope.chartData = null;

    $scope.updateView = function(view) {
        switch (view) {
            case 'graph':
                $('#table').addClass('hide');
                $('#graph').removeClass('hide');
                break;

            case 'table':
                $('#graph').addClass('hide');
                $('#table').removeClass('hide');
                break;
        }
    }

    $scope.showDetails = function(item) {
        //$('#visualization-panel').removeClass('hide');
        switch (item) {
            case 'vpc':
                //do vpc stuff
                $scope.selectedDetail = 'VPC';
                $scope.selectedDetails = { name: 'VPC Name', tag: 'Tag Name', account_id: '12344', total_eni: 52, total_instances: 54, region: 'us-west-1', sgroup: 'some, security, groups', subnets: 'maybe' };
                break;

            case 'ec2':
                //do ec2 stuff
                $scope.selectedDetail = 'EC2 Instance';
                $scope.selectedDetails = { name: 'EC2 Name', private_interface: 'some info', public_interface: 'some info', public_dns: 'some info', private_dns: 'some info', launch_time: 'some time', tags: 'some, list, of, tags', subnet_id: '8', vpc_id: '9', sgroups: 'security, groups, or, count', type: 't2.micro', state: 'some state' };
                break;

            case 'tags':
                //do tag stuff
                break;

            case 'sg':
                //do security group stuff
                $scope.selectedDetail = 'Security Group';
                $scope.selectedDetails = { name: 'Some Name', description: 'Some description', vpc_assoc: 'some association', group_id: 5, instances: 7, egress: 'some egress', ingress: 'some ingress', tags: 'list, of, tags', flow_summary: 'wtf is this' }
                break;
        }
    }

    $scope.menuClicked = function(item) {
        console.log(item);
        if (item.text == 'Expand') $scope.refreshChart(true);
        else if (item.text == 'Collapse') $scope.refreshChart(false);
        else $scope.updateView('table');
    };

    $scope.nodeClicked = function(node) {
        if (node && node.type == 'trustZone') $scope.showDetails('sg');
        else if (node && node.type == 'networkObject') $scope.showDetails('ec2');

        $scope.selectedNode = node;
    };

    $scope.refreshChart = function(expanded) {

        var url = '/topology/getTopologyData.json';
        if (expanded) url = '/topology/getTopologyDataWithExpandedIds.json';

        $http.get(url).then(function(res) {

            /*angular.forEach(res.data, function(c) {
                var num = Math.floor(Math.random() * 20000);
                c.size = num;
            });*/
            console.log("topology\controller.js refreshChart");
            $scope.chartData = res.data.result;
        }, function(err) {
            console.log('json error', err);
        });
    }

    $scope.build = function() {
        console.log('build it');
        $('#visualization-flow, #visualization #chart, #visualization-panel').removeClass('hide');
        $('#visualization').removeClass('m12').addClass('m8');
        $('#visualization #no-chart').addClass('hide');

        $scope.refreshChart();
    }

    $scope.triggerModal = function(action) {
        if (action == 'open') {
            $('#demoModal').openModal('open');
        } else {
            $('#modal1').closeModal('close');
        }
    }

    $scope.toggleDetails = function(asset) {
        console.log('toggle details');
        if (asset.show == true) {
            asset.show = false;
        } else {
            asset.show = true
        }
    }
    console.log('Assets Controller Working');
    $scope.updateChart = function(item) {
        console.log('show item', item);
    }
}])