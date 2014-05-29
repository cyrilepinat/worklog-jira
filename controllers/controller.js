worklogApp.controller('MainCtrl', ['$scope', '$http', '$filter', '$log', 'CONFIG', 'SearchSrv',
    function ($scope, $http, $filter, $log, CONFIG, SearchSrv) {

        $scope.startDate = "2014-04-22";
        $scope.endDate = "2014-05-12";

        $http.get("data/users.json").success(function (data) {
            $scope.users = data;
        })

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

        $scope.search = function () {
            $scope.results = {};
            $scope.finished = false;
            SearchSrv.searchAll($scope.startDate, $scope.endDate).success(function (data, status, headers, config) {
                $log.debug(data);
                $scope.issues = data.issues;

                var worklogByPerson = {};
                var worklogByIssueAndByPerson = {};

                angular.forEach($scope.issues, function (issue, i) {
                    var versions = issue.fields.fixVersions;
                    var issueType = "Core";
                    if (versions && versions.length > 0) {
                        var version = versions[0].name;
                        if (version &&
                            (version.toLowerCase().indexOf("scrum") > -1 || version.toLowerCase().indexOf("prod") > -1)) {
                            issueType = "Project";
                        }
                    }
                    var worklogs = issue.fields.worklog.worklogs;
                    angular.forEach(worklogs, function (worklog, i) {
                        var author = worklog.author.displayName.trim();
                        if ($scope.selectedUser == CONFIG.assigneeAll || $scope.selectedUser == author) {
                            var worklogInDay = worklog.timeSpentSeconds / 28800;
                            var worklogDate = new Date(worklog.started);

                            if (worklogDate >= new Date($scope.startDate) && worklogDate <= new Date($scope.endDate)) {
                                var issueRef = issue.key;

                                //build results
                                var result = $scope.results[author];
                                if (!result) {
                                    result = {
                                        days: 0
                                    };
                                }
                                result['days'] += worklogInDay;
                                var worklogsInfoArray = result['info'];
                                if (!worklogsInfoArray) {
                                    worklogsInfoArray = [];
                                }
                                worklogsInfoArray.push({
                                    date: $filter('date')(worklogDate, CONFIG.renderedDateFormat),
                                    ref: issueRef,
                                    type: issueType,
                                    time: worklogInDay
                                });
                                $scope.results[author] = {
                                    days: result['days'],
                                    info: worklogsInfoArray
                                }



                            }
                        }

                    });
                });

                $log.debug("results", $scope.results);

                $scope.finished = true;

            }).error(function (data, status, headers, config) {
                $log.debug("error");
            });
        };

        $scope.search();




}]);