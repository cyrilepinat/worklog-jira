worklogApp.controller('MainCtrl', ['$scope', '$http', '$filter', '$log', 'CONFIG', 'SearchSrv', 'CoprojSrv',
    function ($scope, $http, $filter, $log, CONFIG, SearchSrv, CoprojSrv) {

        //init
        $scope.finished = true;
        $scope.CONFIG = CONFIG; //will allow to use CONFIG var inside html template

        //datepickers
        $scope.open = function (id, $event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (id === 'start') {
                $scope.openedStart = true;
            } else if (id === 'end') {
                $scope.openedEnd = true;
            }

        };
        $scope.dateOptions = {
            formatYear: 'yyyy',
            startingDay: 1
        };
        $scope.maxAvailableDate = $filter('date')(new Date(), 'yyyy-MM-dd');

        //select2
        $http.get("data/users.json").success(function (data) {
            $scope.users = data;
            SearchSrv.usersFocusList(data);
        });
        $scope.selectUserConfig = {
            width: '300px',
            placeholder: "All users",
            allowClear: true
        };
        $scope.valueChanged = function (selectedUser) {
            if (!selectedUser) {
                $scope.selectedUser = CONFIG.assigneeAll;
            } else {
                $scope.selectedUser = selectedUser;
            }
        };
        $scope.$watch('selectedUser', function (val) {
            SearchSrv.filter(val);
        });

        //submit form
        $scope.search = function () {
            $scope.closeAlert();
            $scope.results = {};
            $scope.finished = false;
            SearchSrv.searchAll(SearchSrv.getDateAsString($scope.startDate), SearchSrv.getDateAsString($scope.endDate)).then(function (data) {
                $scope.results = data;
                if (Object.keys($scope.results).length === 0) {
                    $scope.alertType = "success";
                    $scope.errorMsg = "No results.";
                }
                $scope.finished = true;
            }, function (data) {
                $scope.finished = true;
                $scope.alertType = "danger";
                $scope.errorMsg = "Error: " + data.status + " - " + data.statusText;
            });
        };

        //coproj graph
        $scope.coproj = function () {
            $scope.closeAlert();
            $scope.results = {};
            $scope.finished = false;
            CoprojSrv.generateGraph($scope.coprojMonth).then(function (data) {
                
                function graphData() {

                    var dataArray = [
                        {
                            values: data.maintenanceAssigned,
                            key: 'maintenanceAssigned',
                            color: '#0099FF',
                            area: true
                        },
                        {
                            values: data.maintenanceResolved,
                            key: 'maintenanceResolved',
                            color: '#2CA02C',
                            area: true
                        },
                        {
                            values: data.warrantyAssigned,
                            key: 'warrantyAssigned',
                            color: '#0077DD'
                        },
                        {
                            values: data.warrantyResolved,
                            key: 'warrantyResolved',
                            color: '#0A800A'
                        },
                        {
                            values: data.totalAssigned,
                            key: 'totalAssigned',
                            color: '#0055BB'
                        },
                        {
                            values: data.totalResolved,
                            key: 'totalResolved',
                            color: '#086008'
                        }
                    ];
                    return dataArray;
                }
                
                var margin = {top: 20, right: 20, bottom: 30, left: 50},
                    width = 960 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;
                
                var chart = nv.models.lineChart()
                    .margin({left: 100})            // Adjust chart margins to give the x-axis some breathing room.
                    .useInteractiveGuideline(true)  // We want nice looking tooltips and a guideline!
                    .transitionDuration(350)        // how fast do you want the lines to transition?
                    .showLegend(true)               // Show the legend, allowing users to turn on/off line series.
                    .showYAxis(true)                // Show the y-axis
                    .showXAxis(true);               // Show the x-axis

                chart.xAxis.showMaxMin(true)
                    .axisLabel('Date')
                    .tickFormat( //Chart x-axis settings
                        function (d) {
                            return d3.time.format('%x')(
                                new Date(parseInt(d))
                            );
                        })
                    .rotateLabels(-20);
                
                chart.yAxis.axisLabel('Number of issues').tickFormat(d3.format('.0f')); //Chart y-axis settings

                
                d3.select('#followup-issues svg')    //Select the <svg> element you want to render the chart in.   
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    //.append("g")
                    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .datum(graphData())    //Populate the <svg> element with chart data...
                    .transition()
                    .duration(500)
                    .call(chart);          //Finally, render the chart!

                nv.addGraph(chart);
                
                //Update the chart when window resizes.
                nv.utils.windowResize(function () {
                    chart.update();
                });
                
                $scope.finished = true;
            }, function (data) {
                $scope.finished = true;
                $scope.alertType = "danger";
                $scope.errorMsg = "Error: " + data.status + " - " + data.statusText;
            });
        };
        
        //errors
        $scope.closeAlert = function () {
            delete $scope.errorMsg;
        };

        //utils
        $scope.size = function (obj) {
            var count = 0;
            angular.forEach(obj, function () {
                count++;
            });
            return count;
        };
    }]);