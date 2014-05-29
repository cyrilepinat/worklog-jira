worklogApp.constant("CONFIG", {
    jiraUrl : "https://issuetracker.sicap.com/jira/rest/api/2/search",
    issueRequestMapping : "/rest/issue",
    issueReportRequestMapping : "/report",
    startDateSuffix : "T00:00:00.000+0200",
    endDateSuffix : "T23:59:59.999+0200",
    jiraDateFormat : "yyyy-MM-dd'T'HH:mm:ss.SSSz",
    renderedDateFormat : "yyyy-MM-dd",
    assigneeAll : "ALL",
    projectBugfixingLabel : "Project bugfixing",
    issueTypes : {
        CORE : "Core",
        PROJECT : "Project"
    }
});