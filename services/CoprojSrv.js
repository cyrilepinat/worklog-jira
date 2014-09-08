worklogApp.service('CoprojSrv', ['$http', '$log', '$filter', '$q', 'CONFIG',

    function ($http, $log, $filter, $q, CONFIG) {
        
        /** private members and methods */
        var $$results, 
            $$startDate,
            $$endDate,
            $$running,
            $$deferred,
            $$usersFocusList;
            
        var parseData = function (data) {
            
            $$results = [];
            var issues = data.issues;
            var resultByDate = {};
                
            angular.forEach(issues, function (issue, i) {
                
                var histories = issue.changelog.histories,
                    norsysIssue = false;
                
                // customfield_10090 = Lifecycle, 10071 =  Maintenance, 10230 = Warranty
                if (issue.fields.customfield_10090 != null && (issue.fields.customfield_10090.id == "10071" || issue.fields.customfield_10090.id == "10230")) { 
                
                    angular.forEach(histories, function (history, i) {

                        var items = history.items,
                            historyDate = new Date(history.created);

                        if (historyDate >= $$startDate && historyDate <= $$endDate) {

                            angular.forEach(items, function (item, i) {

                                if (!norsysIssue && item.field == "assignee" && item.to.indexOf("ext_norsys_") == 0) { // ext_norsys_bal = Norsys Mailing List                    
                                    norsysIssue = true;

                                    var result = resultByDate[history.created];
                                    if (angular.isUndefined(result)) {
                                        result = { 
                                            'maintenance':{},
                                            'warranty':{}
                                        };
                                        result['maintenance']['assigned'] = 0;
                                        result['maintenance']['resolved'] = 0;
                                        result['warranty']['assigned'] = 0;
                                        result['warranty']['resolved'] = 0;
                                    }
                                    if (issue.fields.customfield_10090.id == "10071") {
                                        result['maintenance']['assigned']++;
                                    } else {
                                        result['warranty']['assigned']++;
                                    }
                                    resultByDate[history.created] = result;

                                }

                                console.log(norsysIssue + ":" + issue.fields.status.id + ":" + item.field + ":" + item.to);

                                if (norsysIssue && issue.fields.status.id == "5" && item.field == "status" && item.to == "5") { // status 5 = Resolved

                                    var result = resultByDate[history.created];
                                    if (angular.isUndefined(result)) {
                                        result = { 
                                            'maintenance':{},
                                            'warranty':{}
                                        };
                                        result['maintenance']['assigned'] = 0;
                                        result['maintenance']['resolved'] = 0;
                                        result['warranty']['assigned'] = 0;
                                        result['warranty']['resolved'] = 0;
                                    }
                                    if (issue.fields.customfield_10090.id == "10071") {
                                        result['maintenance']['resolved']++;
                                    } else {
                                        result['warranty']['resolved']++;
                                    }
                                    resultByDate[history.created] = result;

                                }


                            }); // forEach items

                        }

                    }); // forEach histories
                    
                }
                
            }); // forEach issues
            
            var maintenanceAssignedNb = 0,
                maintenanceResolvedNb = 0,
                warrantyAssignedNb = 0,
                warrantyResolvedNb = 0,
                maintenanceAssigned = [],
                maintenanceResolved = [],
                warrantyAssigned = [],
                warrantyResolved = [],
                totalAssigned = [],
                totalResolved = [],
                dates = Object.keys(resultByDate);
            
            dates.sort();
            
            angular.forEach(dates, function (date, i) {
                
                var result = resultByDate[date];
                var finalResult = {};
                
                maintenanceAssignedNb += result.maintenance.assigned;
                maintenanceResolvedNb += result.maintenance.resolved;
                warrantyAssignedNb += result.warranty.assigned;
                warrantyResolvedNb += result.warranty.resolved;
                
                if (result.maintenance.assigned != 0 || i+1 === dates.length) {
                    maintenanceAssigned.push({
                        x: Date.parse(date),
                        y: maintenanceAssignedNb
                    });
                }
                if (result.maintenance.resolved != 0 || i+1 === dates.length) {
                    maintenanceResolved.push({
                        x: Date.parse(date),
                        y: maintenanceResolvedNb
                    });
                }
                if (result.warranty.assigned != 0 || i+1 === dates.length) {
                    warrantyAssigned.push({
                        x: Date.parse(date),
                        y: warrantyAssignedNb
                    });
                }
                if (result.warranty.resolved != 0 || i+1 === dates.length) {
                    warrantyResolved.push({
                        x: Date.parse(date),
                        y: warrantyResolvedNb
                    });
                }
                if (result.maintenance.assigned != 0 || result.warranty.assigned != 0 || i+1 === dates.length) {
                    totalAssigned.push({
                        x: Date.parse(date),
                        y: maintenanceAssignedNb + warrantyAssignedNb
                    });
                }
                if (result.maintenance.resolved != 0 || result.warranty.resolved != 0 || i+1 === dates.length) {
                    totalResolved.push({
                        x: Date.parse(date) ,
                        y: maintenanceResolvedNb + warrantyResolvedNb
                    });
                } 
            });
            
            $$results['maintenanceAssigned'] = maintenanceAssigned;
            $$results['maintenanceResolved'] = maintenanceResolved;
            $$results['warrantyAssigned'] = warrantyAssigned;
            $$results['warrantyResolved'] = warrantyResolved;
            $$results['totalAssigned'] = totalAssigned;
            $$results['totalResolved'] = totalResolved;
            
            //notify the end of process
            $$running = false;
            $$deferred.resolve($$results);
        };
        
        /** public members and methods */
        this.generateGraph = function (coprojMonth) {
                
            if (!$$running) {
                
                $$running = true;
                if (!coprojMonth) {
                    coprojMonth = moment().format("YYYY-MM");
                }

                $$startDate = new Date(coprojMonth + '-01' + CONFIG.startDateSuffix);
                $$endDate = new Date($$startDate.getFullYear(), $$startDate.getMonth() + 1, 0);
                
                //hack: substract a month to retrieve more issues, we will filter in parse process
                var startDateExtend = moment($$startDate).subtract('d', 15).format(CONFIG.renderedMomentFormat);
                var endDateExtend = moment($$endDate).add('d', 15).format(CONFIG.renderedMomentFormat);
                
                var jql = CONFIG.jira.query.replace(/&&startDate\./g, startDateExtend);
                jql = jql.replace(/&&endDate\./g, endDateExtend);

                var params = {
                    jql: jql,
                    fields: "changelog,status,customfield_10090",
                    expand: "changelog"
                };

                $$deferred = $q.defer();

                //TODO filter only useful fields
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
      
        this.getMonthAsString = function (date) {
            return $filter('date')(date, 'yyyy-MM');
        };
        
}]);