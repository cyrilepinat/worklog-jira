worklogApp.service('SearchSrv', ['$http', '$log', '$filter', '$base64', 'CREDENTIALS', 'CONFIG',
    function ($http, $log, $filter, $base64, CREDENTIALS, CONFIG) {

        /** private members and methods */
        var $$basicAuth = "Basic " + $base64.encode(CREDENTIALS.username + ':' + CREDENTIALS.password);
        $log.debug($$basicAuth);

        var $$results;

        /** public members and methods */
        this.searchAll = function (startDate, endDate) {
            if (!startDate) {
                startDate = $filter('date')(new Date(), CONFIG.renderedDateFormat);
            }
            if (!endDate) {
                endDate = $filter('date')(new Date(), CONFIG.renderedDateFormat);
            }

            var params = {
                jql: "((project=NCT AND summary!~'Project bugfixing') OR (project IN (CSTDMCMTNS,PRDTARGETME,CSTDMCOMEA,CSTDMCMED) AND ((created >= " + startDate + " AND created <= " + endDate + ") OR (updated >= " + startDate + " AND updated <= " + endDate + "))))",
                startAt: "0",
                maxResults: "5000",
                fields: "fixVersions,worklog"
            }

            // do request and return promise
            return $http.get(CONFIG.jiraUrl, {
                params: params,
                headers: {
                    "Authorization": $$basicAuth
                }
            });
        };
        
        this.filterByUser = function () {
            //
        };


}]);