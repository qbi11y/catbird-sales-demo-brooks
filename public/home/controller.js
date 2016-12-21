var app = angular.module('IndexCtrl', ['ngMaterial', 'Assets']);

app.controller('IndexCtrl', ['$scope', '$http', '$state', 'Assets', function($scope, $http, $state, Assets) {
    console.log('Index Controller Working');
    Assets.getAssetsSummary();
    $scope.summary = {};
    $scope.Assets = Assets;
    $scope.updateChart = function(item) {
        console.log('show item', item);
    }

    setTimeout(function() {
        Highcharts.chart('container', {
        chart: {
            type: 'area'
        },
        title: {
            text: 'Customer Network Flow Traffic'
        },
        subtitle: {
            text: 'as of today 12:35p'
        },
        xAxis: {
            allowDecimals: false,
            labels: {
                formatter: function () {
                    return this.value; // clean, unformatted number for year
                }
            }
        },
        yAxis: {
            title: {
                text: 'Some data'
            },
            labels: {
                formatter: function () {
                    return this.value / 1000 + 'k';
                }
            }
        },
        tooltip: {
            pointFormat: '{series.name} produced <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
        },
        plotOptions: {
            area: {
                pointStart: 1,
                marker: {
                    enabled: false,
                    symbol: 'circle',
                    radius: 2,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                }
            }
        },
        series: [{
            name: 'Network Flow Traffic Volume',
            data: [10, 5, 22, 56, 8, 6, 11]
        }]
    });
    }, 1000)

    $scope.$watch(function(scope) {
        return scope.Assets.assets
    }, function(newValue, oldValue) {
        console.log('the new value', newValue, 'the old value', oldValue)
        $scope.summary = newValue.data
    })
}])