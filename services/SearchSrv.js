worklogApp.service('SearchSrv', ['$http', '$log', '$filter', '$q', 'CONFIG',
    function ($http, $log, $filter, $q, CONFIG) {

        /** private members and methods */
        var $$results, $$startDate, $$endDate, $$filter, $$running, $$deferred, $$usersFocusList;

        var parseData = function (data) {
            $$results = {};

            var totalDays = {};
            totalDays['Total'] = 0;
            totalDays[CONFIG.issueTypes.CORE.label] = 0;
            totalDays[CONFIG.issueTypes.PROJECT.label] = 0;
            totalDays[CONFIG.issueTypes.BUGFIXING.label] = 0;
            totalDays[CONFIG.issueTypes.UNDEFINED.label] = 0;
            totalDays['projectsTotal'] = {};

            var issues = data.issues;
            angular.forEach(issues, function (issue, i) {
                var lifeCycleStep = issue.fields[CONFIG.jira.lifeCycleStep];
                var issueRef = issue.key;
                var issueType = CONFIG.issueTypes.CORE.label;
                if (angular.isDefined(lifeCycleStep) && lifeCycleStep !== null) {
                    var lifeCycleStepValue = lifeCycleStep.value;
                    if (lifeCycleStepValue === CONFIG.issueTypes.PROJECT.code) {
                        issueType = CONFIG.issueTypes.PROJECT.label;
                    } else if (lifeCycleStepValue === CONFIG.issueTypes.BUGFIXING.code) {
                        issueType = CONFIG.issueTypes.BUGFIXING.label;
                    } else if (lifeCycleStepValue === CONFIG.issueTypes.UNDEFINED.code && CONFIG.jira.coreProjects.indexOf(issueRef.split('-')[0]) === -1) {
                        issueType = CONFIG.issueTypes.UNDEFINED.label;
                    }
                }
                var worklogs = issue.fields.worklog.worklogs;
                angular.forEach(worklogs, function (worklog, i) {
                    var author = worklog.author.displayName.trim();
                    if ($$usersFocusList.indexOf(author) > -1 && ($$filter == CONFIG.assigneeAll || $$filter == author)) {
                        var worklogInDay = worklog.timeSpentSeconds / 28800;
                        var worklogDate = new Date(worklog.started);

                        if (worklogDate >= $$startDate && worklogDate <= $$endDate) {
                            //build results
                            var result = $$results[author];
                            if (angular.isUndefined(result)) {
                                result = {
                                    days: {}
                                };
                                result['days']['Total'] = 0;
                                result['days'][CONFIG.issueTypes.CORE.label] = 0;
                                result['days'][CONFIG.issueTypes.PROJECT.label] = 0;
                                result['days'][CONFIG.issueTypes.BUGFIXING.label] = 0;
                                result['days'][CONFIG.issueTypes.UNDEFINED.label] = 0;
                                result['days']['projectsTotal'] = {};
                            }

                            //compute time by project ref if type is not CORE
                            if (issueType !== CONFIG.issueTypes.CORE.label) {
                                var project = result['days']['projectsTotal'][issueRef.split('-')[0]];
                                if (angular.isUndefined(project)) {
                                    result['days']['projectsTotal'][issueRef.split('-')[0]] = [0, 0, 0];
                                }
                                var totalProject = totalDays['projectsTotal'][issueRef.split('-')[0]];
                                if (angular.isUndefined(totalProject)) {
                                    totalDays['projectsTotal'][issueRef.split('-')[0]] = [0, 0, 0];
                                }
                                //compute time for type PROJECT
                                if (issueType === CONFIG.issueTypes.PROJECT.label) {
                                    result['days']['projectsTotal'][issueRef.split('-')[0]][0] += worklogInDay;
                                    totalDays['projectsTotal'][issueRef.split('-')[0]][0] += worklogInDay;
                                }
                                //compute time for type BUGFIXING
                                else if (issueType === CONFIG.issueTypes.BUGFIXING.label) {
                                    result['days']['projectsTotal'][issueRef.split('-')[0]][1] += worklogInDay;
                                    totalDays['projectsTotal'][issueRef.split('-')[0]][1] += worklogInDay;
                                }
                                //compute time for type UNDEFINED
                                else if (issueType === CONFIG.issueTypes.UNDEFINED.label) {
                                    result['days']['projectsTotal'][issueRef.split('-')[0]][2] += worklogInDay;
                                    totalDays['projectsTotal'][issueRef.split('-')[0]][2] += worklogInDay;
                                }
                            }

                            //compute total time
                            result['days']['Total'] += worklogInDay;
                            totalDays['Total'] += worklogInDay;

                            //compute time by project type
                            if (issueType === CONFIG.issueTypes.CORE.label) {
                                result['days'][CONFIG.issueTypes.CORE.label] += worklogInDay;
                                totalDays[CONFIG.issueTypes.CORE.label] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.PROJECT.label) {
                                result['days'][CONFIG.issueTypes.PROJECT.label] += worklogInDay;
                                totalDays[CONFIG.issueTypes.PROJECT.label] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.BUGFIXING.label) {
                                result['days'][CONFIG.issueTypes.BUGFIXING.label] += worklogInDay;
                                totalDays[CONFIG.issueTypes.BUGFIXING.label] += worklogInDay;
                            } else if (issueType === CONFIG.issueTypes.UNDEFINED.label) {
                                result['days'][CONFIG.issueTypes.UNDEFINED.label] += worklogInDay;
                                totalDays[CONFIG.issueTypes.UNDEFINED.label] += worklogInDay;
                            }

                            var worklogsInfoArray = result['info'];
                            if (!worklogsInfoArray) {
                                worklogsInfoArray = [];
                            }
                            worklogsInfoArray.push({
                                date: $filter('date')(worklogDate, CONFIG.renderedDateFormat),
                                ref: issueRef,
                                type: issueType,
                                time: worklogInDay,
                                url: CONFIG.jira.issueBaseUrl + issueRef
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
                days: totalDays
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
                var startDateExtend = moment(startDate, CONFIG.renderedMomentFormat).subtract('d', 15).format(CONFIG.renderedMomentFormat);

                $$startDate = new Date(startDate + CONFIG.startDateSuffix);

                if (!endDate) {
                    endDate = moment().format(CONFIG.renderedMomentFormat);
                }
                //hack: add a month to retrieve more issues, we will filter in parse process
                var endDateExtend = moment(endDate, CONFIG.renderedMomentFormat).add('d', 15).format(CONFIG.renderedMomentFormat);

                $$endDate = new Date(endDate + CONFIG.endDateSuffix);

                var jql = CONFIG.jira.query.replace(/&&startDate\./g, startDateExtend);
                jql = jql.replace(/&&endDate\./g, endDateExtend);

                var params = {
                    jql: jql,
                    fields: CONFIG.jira.fields
                };

                $$deferred = $q.defer();

                // do request and return promise
                var url = "http://" + CONFIG.proxy.host + ":" + CONFIG.proxy.port + CONFIG.proxy.path;
                $http.get(url, {
                    params: params
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

        this.usersFocusList = function (list) {
            if (list) {
                $$usersFocusList = list;
            }
            return $$usersFocusList;
        };

        this.getDateAsString = function (date) {
            return $filter('date')(date, CONFIG.renderedDateFormat);
        };

}]);