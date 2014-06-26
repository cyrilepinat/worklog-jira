worklogApp.constant("CONFIG", {
    proxy: {
        host: "localhost",
        port: "3000",
        path: "/jira/query"
    },
    startDateSuffix: "T00:00:00.000+0200",
    endDateSuffix: "T23:59:59.999+0200",
    jiraDateFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSz",
    renderedDateFormat: "yyyy-MM-dd",
    renderedMomentFormat: "YYYY-MM-DD",
    assigneeAll: "ALL",
    projectBugfixingLabel: "Project bugfixing",
    sl3Label: "SL3",
    issueBaseUrl: "https://issuetracker.sicap.com/jira/browse/",
    issueTypes: {
        CORE: "Core",
        PROJECT: "Project",
        BUGFIXING: "Bugfixing"
    }
});