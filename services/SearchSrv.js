worklogApp.service('SearchSrv', ['$http', '$log', '$filter', '$base64', '$q', 'CREDENTIALS', 'CONFIG',
    function ($http, $log, $filter, $base64, $q, CREDENTIALS, CONFIG) {

        /** private members and methods */
        var $$basicAuth = "Basic " + $base64.encode(CREDENTIALS.username + ':' + CREDENTIALS.password);
        var $$results, $$startDate, $$endDate, $$filter, $$running, $$deferred;

        var parseData = function (data) {
            $$results= {};
            var issues = data.issues;
            angular.forEach(issues, function (issue, i) {
                var versions = issue.fields.fixVersions;
                var issueType = CONFIG.issueTypes.CORE;
                if (versions && versions.length > 0) {
                    var version = versions[0].name;
                    if (version &&
                        (version.toLowerCase().indexOf("scrum") > -1 || version.toLowerCase().indexOf("prod") > -1)) {
                        issueType = CONFIG.issueTypes.PROJECT;
                    }
                }
                var worklogs = issue.fields.worklog.worklogs;
                angular.forEach(worklogs, function (worklog, i) {
                    var author = worklog.author.displayName.trim();
                    if ($$filter == CONFIG.assigneeAll || $$filter == author) {
                        var worklogInDay = worklog.timeSpentSeconds / 28800;
                        var worklogDate = new Date(worklog.started);

                        if (worklogDate >= $$startDate && worklogDate <= $$endDate) {
                            var issueRef = issue.key;

                            //build results
                            var result = $$results[author];
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
                            $$results[author] = {
                                days: result['days'],
                                info: worklogsInfoArray
                            }
                        }
                    }
                }); // forEach worklogs
            }); // forEach issues

            $log.debug($$results);
            //notify the end of process
            $$running = false;
            $$deferred.resolve($$results);
        };


        /** public members and methods */
        this.searchAll = function (startDate, endDate) {
            if (!$$running) {
                $$running = true;
                if (!startDate) {
                    startDate = this.getDateAsString(new Date());
                    $$startDate = new Date(startDate + CONFIG.startDateSuffix);
                }
                $$startDate = new Date(startDate + CONFIG.startDateSuffix);

                if (!endDate) {
                    endDate = this.getDateAsString(new Date());
                }
                $$endDate = new Date(endDate + CONFIG.endDateSuffix);

                var params = {
                    jql: "((project=NCT AND summary!~'Project bugfixing') OR (project IN (CSTDMCMTNS,PRDTARGETME,CSTDMCOMEA,CSTDMCMED) AND ((created >= " + startDate + " AND created <= " + endDate + ") OR (updated >= " + startDate + " AND updated <= " + endDate + "))))",
                    startAt: "0",
                    maxResults: "5000",
                    fields: "fixVersions,worklog"
                }

                $$deferred = $q.defer();

                // do request and return promise
                $http.get(CONFIG.jiraUrl, {
                    params: params,
                    headers: {
                        "Authorization": $$basicAuth
                    }
                }).then(function (response) {
                    parseData(response.data);
                }, function(response){
                    $$deferred.reject("error");
                });

                return $$deferred.promise;
            }
        };

        this.filter = function (filter) {
            if (filter) {
                $$filter = filter;
            }
            return $$filter;
        }
        
        this.getDateAsString = function (date) {
            return $filter('date')(date, CONFIG.renderedDateFormat);
        };

}]);