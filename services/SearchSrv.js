worklogApp.service('SearchSrv', ['$http', '$log', '$filter', '$base64', '$q', 'CREDENTIALS', 'CONFIG',
    function ($http, $log, $filter, $base64, $q, CREDENTIALS, CONFIG) {

        /** private members and methods */
        var $$basicAuth = "Basic " + $base64.encode(CREDENTIALS.username + ':' + CREDENTIALS.password);
        var $$results, $$startDate, $$endDate, $$filter, $$running, $$deferred, $$usersFocusList;

        var parseData = function (data) {
            $$results = {};

			var totalDays = {'Total': 0,
							'Core': 0,
							'Project': 0,
							'Bugfixing': 0
                            };

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
                    if ($$usersFocusList.indexOf(author) > -1 && ($$filter == CONFIG.assigneeAll || $$filter == author)) {
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
                            totalDays['Total'] += worklogInDay;
							if (issueType === CONFIG.issueTypes.CORE) {
                                result['days'][CONFIG.issueTypes.CORE] += worklogInDay;
								totalDays[CONFIG.issueTypes.CORE] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.PROJECT) {
                                result['days'][CONFIG.issueTypes.PROJECT] += worklogInDay;
								totalDays[CONFIG.issueTypes.PROJECT] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.BUGFIXING) {
                                result['days'][CONFIG.issueTypes.BUGFIXING] += worklogInDay;
								totalDays[CONFIG.issueTypes.BUGFIXING] += worklogInDay;
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

			$$results['Total'] = {
				days : totalDays
			};

			
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
                }
                //hack: substract a month to retrieve more issues, we will filter in parse process
                var startDateExtend = moment(startDate, CONFIG.renderedMomentFormat).subtract('d',15).format(CONFIG.renderedMomentFormat);
                
                $$startDate = new Date(startDate + CONFIG.startDateSuffix);

                if (!endDate) {
                    endDate = moment().format(CONFIG.renderedMomentFormat);
                }
                //hack: add a month to retrieve more issues, we will filter in parse process
                var endDateExtend = moment(endDate, CONFIG.renderedMomentFormat).add('d',15).format(CONFIG.renderedMomentFormat); 
                
                $$endDate = new Date(endDate + CONFIG.endDateSuffix);

                var params = {
                    jql: "((category NOT IN('Hosting','Integration Projects') OR category is EMPTY) AND project not in('CSTDMTOTWODEV','CSTVCDMC4','HSDHUSDRB','CSTUSSDTLVPC','PRDDMC42','CSTVPCDMCMIGR','PRDSMSGIFT') AND summary!~'" + CONFIG.sl3Label + "' AND summary!~'" + CONFIG.projectBugfixingLabel + "') AND ((created >= " + startDateExtend + " AND created <= " + endDateExtend + ") OR (updated >= " + startDateExtend + " AND updated <= " + endDateExtend + "))",
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