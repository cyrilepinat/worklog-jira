worklogApp.constant("CONFIG", {
    proxy: {
        host: "localhost",
        port: "3000",
        path: "/jira/query"
    },
    jira: {
        query: "((category NOT IN('Hosting','Integration Projects') OR category is EMPTY) AND project not in('CSTDMTOTWODEV','CSTVCDMC4','HSDHUSDRB','CSTUSSDTLVPC','PRDDMC42','CSTVPCDMCMIGR','PRDSMSGIFT') AND summary!~'SL3' AND summary!~'Project bugfixing') AND ((created >= &&startDate. AND created <= &&endDate.) OR (updated >= &&startDate. AND updated <= &&endDate.))",
        lifeCycleStep: "customfield_10090",
        fields: "fixVersions,worklog,customfield_10090",
        dateFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSz",
        issueBaseUrl: "https://issuetracker.sicap.com/jira/browse/",
        coreProjects: ["NCT"]
    },
    startDateSuffix: "T00:00:00.000+0200",
    endDateSuffix: "T23:59:59.999+0200",
    renderedDateFormat: "yyyy-MM-dd",
    renderedMomentFormat: "YYYY-MM-DD",
    assigneeAll: "ALL",
    issueTypes: {
        CORE: {
            code: "Maintenance",
            label: "Core"
        },
        PROJECT: {
            code: "Roadmap",
            label: "Project"
        },
        BUGFIXING: {
            code: "Warranty",
            label: "Bugfixing"
        },
        UNDEFINED: {
            code: "Undefined",
            label: "Undefined"
        }
    }
});