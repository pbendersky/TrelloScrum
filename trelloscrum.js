/*
** ProjectBoard Estimates for GitLab
** Based on TrelloScrum - https://github.com/Q42/TrelloScrum
**
** Pablo Bendersky <pbendersky@quadiontech.com>
**
*/

///////////////////////

var g_projectId;
var g_milestoneId;
var g_currentPage;

$(document).on("ready page:change", function() {
    g_currentPage = null;
    g_projectId = null;
    g_milestoneId = null;
    
    g_currentPage = $('body').data('page');
    if (g_currentPage == "projects:milestones:show" || g_currentPage == "projects:issues:index" || g_currentPage == "projects:issues:show") {
        var splitPath = window.location.pathname.split("/");
        if (splitPath.length >= 2) {
            g_projectId = splitPath[1] + "%2F" + splitPath[2];
        }
        if (g_currentPage == 'projects:milestones:show') {
            g_milestoneId = splitPath[splitPath.length - 1];
        }
        addEstimates();
    }
    
    $(document).on("click", "div.estimate-button", function(event) {
        var target = $(event.target);
        var issueId = target.attr("data-issue-id");
        var estimate = target.attr("data-estimate");
        
        var settings = {
            method: "POST",
            data: {
                issue_id: issueId,
                estimate: estimate
            },
            success: function(data, textStatus, jqXHR) {
                var trigger = 'div.scrum-trigger[data-issue-id=' + issueId + ']';
                $(trigger).text(estimate);
                $(trigger).popover('hide');
            }
        };
        $.ajax(PROJECT_BOARD_BASE_URL + "issue", settings);
    });
});

var POSSIBLE_ESTIMATES = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
var PROJECT_BOARD_BASE_URL = "https://projectboard.quadiontech.com/api/v1/";

function estimatePicker(issueId) {
    var content = $('<div></div>');
    
    for (var i = 0; i < POSSIBLE_ESTIMATES.length; i++) {
        content.append(
            $('<div class="label color-label scrum-badge float-left estimate-button" data-issue-id="'
                + issueId
                + '" data-estimate="'
                + POSSIBLE_ESTIMATES[i]
                + '">'
                + POSSIBLE_ESTIMATES[i] + '</div>')
        );
    }
    
    return content.html();
}

function addEstimates() {
    fetchEstimates(g_currentPage, g_projectId, g_milestoneId, function(data) {
        if (g_currentPage == "projects:issues:index") {
            $('li.issue').each(function() {
                var issueId = this.id.substring("issue_".length);
                var estimate = data[issueId];
                var $badge = $('<div class="label color-label scrum-badge float-left scrum-trigger">' + estimate + '</div>');
        
                $(this).children('.issue-check').after($badge);

                addIssueIdToBadge(issueId, $badge);
                addPopoverToBadge($badge);
            });
        }
        if (g_currentPage == "projects:milestones:show") {
            $('li.issue-row').each(function() {
                var issueId = this.id.substring("sortable_issue_".length);
                var estimate = data[issueId];
                var $badge = $('<div class="label color-label scrum-badge scrum-trigger">' + estimate + '</div>');
        
                $(this).find('span a:first').after($badge);

                addIssueIdToBadge(issueId, $badge);
                addPopoverToBadge($badge);
            });
        }
        if (g_currentPage == "projects:issues:show") {
            $('h2.issue-title').each(function() {
                var issueId = $('form.issuable-context-form').first().attr('id').substring("edit_issue_".length);
                var estimate = data[issueId];
                var $badge = $('<div class="label color-label scrum-badge float-left scrum-trigger">' + estimate + '</div>');

                $(this).before($badge);

                addIssueIdToBadge(issueId, $badge);
                addPopoverToBadge($badge);
            });
        }
    });
}

function addIssueIdToBadge(issueId, $badge) {
    $badge.attr('data-issue-id', issueId);
}

function addPopoverToBadge(badge) {
    badge.popover({"content": function() {
        return estimatePicker(badge.attr('data-issue-id'));
    }, "html": true, "trigger": "click focus", "title": "Estimate", "container": "body"});
}

function fetchEstimates(page, projectId, milestoneId, completion) {
    $.ajax(PROJECT_BOARD_BASE_URL + "project/" + projectId, {success: function(data, textStatus, jqXHR) {
        completion(data);
    }});
}
