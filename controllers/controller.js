worklogApp.controller('MainCtrl', ['$scope', '$http', '$filter', '$log', 'CONFIG', 'SearchSrv',
    function ($scope, $http, $filter, $log, CONFIG, SearchSrv) {

        //init
        $scope.finished = true;
        $scope.CONFIG = CONFIG; //will allow to use CONFIG var inside html template

        //datepickers
        $scope.open = function (id, $event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (id == 'start') {
                $scope.openedStart = true;
            } else if (id == 'end') {
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
        $scope.$watch('selectedUser', function (val) {
            SearchSrv.filter(val);
        })

        //submit form
        $scope.search = function () {
            $scope.closeAlert();
            $scope.results = {};
            $scope.finished = false;
            SearchSrv.searchAll(SearchSrv.getDateAsString($scope.startDate), SearchSrv.getDateAsString($scope.endDate)).then(function (data) {
                $scope.results = data;
                if (Object.keys($scope.results).length == 0) {
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

        //errors
        $scope.closeAlert = function () {
            delete $scope.errorMsg;
        };

}]);