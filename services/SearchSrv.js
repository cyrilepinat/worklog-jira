worklogApp.service('SearchSrv', ['$http', '$log', '$filter', '$base64', '$q', 'CREDENTIALS', 'CONFIG',
    function ($http, $log, $filter, $base64, $q, CREDENTIALS, CONFIG) {

        /** private members and methods */
        var $$basicAuth = "Basic " + $base64.encode(CREDENTIALS.username + ':' + CREDENTIALS.password);
        var $$results, $$startDate, $$endDate, $$filter, $$running, $$deferred, $$usersFocusList;

        var parseData = function (data) {
            $$results = {};
            var issues = data.issues;
            angular.forEach(issues, function (issue, i) {
                var versions = issue.fields.fixVersions;
                var issueType = CONFIG.issueTypes.CORE;
                if (versions && versions.length > 0) {
                    var version = versions[0].name;
                    if (version &&
                        (version.toLowerCase().indexOf("scrum") > -1 || version.toLowerCase().indexOf("prod") > -1)) {
                        issueType = CONFIG.issueTypes.PROJECT;
                    } else if (version && version.toLowerCase().indexOf("bugfixing") > -1) {
                        issueType = CONFIG.issueTypes.BUGFIXING;
                    }
                }
                var worklogs = issue.fields.worklog.worklogs;
                angular.forEach(worklogs, function (worklog, i) {
                    var author = worklog.author.displayName.trim();
                    if (author in $$usersFocusList && ($$filter == CONFIG.assigneeAll || $$filter == author)) {
                        var worklogInDay = worklog.timeSpentSeconds / 28800;
                        var worklogDate = new Date(worklog.started);

                        if (worklogDate >= $$startDate && worklogDate <= $$endDate) {
                            var issueRef = issue.key;

                            //build results
                            var result = $$results[author];
                            if (!result) {
                                result = {
                                    days: {}
                                };
                                result['days']['Total'] = 0;
                                result['days'][CONFIG.issueTypes.CORE] = 0;
                                result['days'][CONFIG.issueTypes.PROJECT] = 0;
                                result['days'][CONFIG.issueTypes.BUGFIXING] = 0;
                            }
                            result['days']['Total'] += worklogInDay;
                            if (issueType === CONFIG.issueTypes.CORE) {
                                result['days'][CONFIG.issueTypes.CORE] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.PROJECT) {
                                result['days'][CONFIG.issueTypes.PROJECT] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.BUGFIXING) {
                                result['days'][CONFIG.issueTypes.BUGFIXING] += worklogInDay;
                            }

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

            //notify the end of process
            $$running = false;
            $$deferred.resolve($$results);
        };


        /** public members and methods */
        this.searchAll = function (startDate, endDate) {
            if (!$$running) {
                $$running = true;
                if (!startDate) {
                    startDate = moment().format(CONFIG.renderedMomentFormat);
                } else {
                    //hack: substract a month to retrieve more issues, we will filter in parse process
                    $log.debug("else start ", startDate);
                    startDate = moment(startDate, CONFIG.renderedMomentFormat).subtract('M',1).format(CONFIG.renderedMomentFormat);
                }
                $log.debug(startDate);
                $$startDate = new Date(startDate + CONFIG.startDateSuffix);

                if (!endDate) {
                    endDate = moment().format(CONFIG.renderedMomentFormat);
                } else {
                    //hack: add a month to retrieve more issues, we will filter in parse process
                    $log.debug("else end ", endDate);
                    endDate = moment(endDate, CONFIG.renderedMomentFormat).add('M', 1).format(CONFIG.renderedMomentFormat); 
                }
                $log.debug(endDate);
                $$endDate = new Date(endDate + CONFIG.endDateSuffix);

                var params = {
                    jql: "(summary!~'" + CONFIG.sl3Label + "' AND summary!~'" + CONFIG.projectBugfixingLabel + "') AND ((created >= " + startDate + " AND created <= " + endDate + ") OR (updated >= " + startDate + " AND updated <= " + endDate + "))",
                    startAt: 0,
                    maxResults: 5000,
                    fields: "fixVersions,worklog"
                };

                $$deferred = $q.defer();

                // do request and return promise
                $http.get(CONFIG.jiraUrl, {
                    params: params,
                    headers: {
                        "Authorization": $$basicAuth
                    }
                }).then(function (response) {
                    parseData(response.data);
                }, function (response) {
                    $$running = false;
                    $$deferred.reject(response);
                });

                return $$deferred.promise;
            }
        };

        this.filter = function (filter) {
            if (filter) {
                $$filter = filter;
            }
            return $$filter;
        };
        
        this.usersFocusList = function(list){
            if (list) {
                $$usersFocusList = list;
            }
            return $$usersFocusList;
        };

        this.getDateAsString = function (date) {
            return $filter('date')(date, CONFIG.renderedDateFormat);
        };

}]);