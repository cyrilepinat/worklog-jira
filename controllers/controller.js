worklogApp.controller('MainCtrl', ['$scope', '$http', '$filter', '$log', 'CONFIG', 'SearchSrv',
    function ($scope, $http, $filter, $log, CONFIG, SearchSrv) {

        //init
        $scope.finished = true;

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
            $log.debug(val);
            SearchSrv.filter(val);
        })

        //submit form
        $scope.search = function () {
            $scope.results = {};
            $scope.finished = false;
            SearchSrv.searchAll(SearchSrv.getDateAsString($scope.startDate), SearchSrv.getDateAsString($scope.endDate)).then(function (data) {
                $scope.results = data;
                $log.debug("results", $scope.results);
                $scope.finished = true;
            }, function (data) {
                $log.debug("error");
            });
        };

}]);