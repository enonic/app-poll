// libs
var auth = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');
var util = require('/lib/enonic/util');
var moment = require('/assets/momentjs/2.12.0/min/moment-with-locales.min.js');

exports.get = handleGet;

exports.post = handlePost;

function handleGet(req) {

    var component = portal.getComponent();
    var config = component.config;


    function renderView() {
        var body = thymeleaf.render( resolve('poll.html'), createModel() );

        var pageContributions = {};
        pageContributions.headEnd = ['<link rel="stylesheet" href="' + portal.assetUrl({path: 'css/polls.css'}) + '" type="text/css" media="all">'];
        pageContributions.bodyEnd = ['<script src="' + portal.assetUrl({path: 'js/polls.js'}) + '"></script>'];

        // Include jQuery if it's set in the app config.
        if(portal.getSiteConfig().includeJquery) {
            pageContributions.bodyEnd.push('<script src="' + portal.assetUrl({path: 'jquery/2.2.4/jquery.min.js'}) + '"></script>');
        }

        return {
            body: body,
            pageContributions: pageContributions
        };
    }

    function createModel() {
        var model = {};

        var poll = contentLib.get({key: config.poll || 1});
        if(!poll) {
            return null;
        }
        var results = getResults(poll);
        var closed = isPollClosed(poll);

        model.poll = poll;
        model.id = 'poll-' + component.path.replace(/\/+/g, '-');
        model.action = portal.componentUrl({component: component._path});
        model.expires = getExpires(closed, poll.data.expires);
        model.closed = closed || hasResponded(poll);
        model.total = results ? results.total + ' votes' : '0 votes';
        model.options = getResultCount(results, util.data.forceArray(poll.data.options));

        return model;
    }

    return renderView();
}

function getExpires(closed, expires) {
    if(closed) {
        return 'Final results';
    }
    if(!expires) {
        return '';
    }
    return ' - Closes ' + moment(expires).fromNow();
}

function isPollClosed(poll) {
    var date = poll.data.expires ? moment(poll.data.expires) : null;
    if(poll.data.closed || ( date && moment.now() > date)) {
        return true;
    }

    return false;
}

//Check if logged in user already submitted.
function hasResponded(poll) {

    //TODO: Also check user's IP address vs data.ip or set a cookie
    var user = auth.getUser();
    if(user) {
        var response = contentLib.query({
            count: 1,
            query: '_parentPath = "/content' + poll._path + '" AND data.user = "' + user.key + '"',
            contentTypes: [app.name + ':poll-response']
        });

        if(response.total > 0) {
            return true;
        }
    }
    return false;
}

function handlePost(req) {

    var component = portal.getComponent();
    var config = component.config;
    var params = req.params;
    var pollContent = contentLib.get({key: config.poll || 1});
    var user = auth.getUser();

    if(!pollContent) {
        return error('No poll content.');
    }
    var pollOptions = util.data.forceArray(pollContent.data.options); // Array of the options

    if(!isValidOption(params.option, pollOptions)) {
        return error('Not a valid option ' + params.option);
    }

    if(pollContent.data.closed || moment.now() > moment(pollContent.data.expires)) {
        return error('The poll is closed.');
    }

    try {
        var data = {
            poll: pollContent._id,
            option: params.option //TODO: Add user's IP address as data.ip or set a cookie
        };
        if (user) {
            data.user = user.key;
        }
        var responseContent = contentLib.create({
            displayName: params.option || 'response',
            parentPath: pollContent._path,
            contentType: app.name + ':poll-response',
            data: data
        });
    } catch(e) {
        log.info(e.message);
        return error('Failed to create response content.');
    }

    var results = getResults(pollContent);

    var body = {};
    body.success = true;
    body.total = results.total;
    body.choices = getResultCount(results, pollOptions);;

    function error(message) {
        return {
            contentType: 'application/json',
            body: {error: message}
        }
    }

    return {
        contentType: 'application/json',
        body: body
    }

}

// Make sure some smartass didn't change the input value
function isValidOption(choice, pollOptions) {
    var valid = false;

    pollOptions.map(function(option, i)  {
        if (option == choice) {
            valid = true;
        }
    })

    return valid;
}

// Get an array of options with counts
function getResultCount(results, pollOptions) {
    var options = [];
    pollOptions.map(function(option, i) {
        var choice = {};
        choice.value = option;
        choice.count = 0;

        results.aggregations.options.buckets.map(function(bucket, n) {

            if(option.toLowerCase() == bucket.key) {
                choice.count = bucket.docCount;
            }
        });

        choice.percent = Math.round((choice.count / results.total) * 100).toString();

        options.push(choice);
    });
    return options;
}

// Get poll results
function getResults(pollContent) {
    var query = 'data.poll = "' + pollContent._id + '"';

    var result = contentLib.query({
        start: 0,
        count: 0,
        query: query,
        aggregations: {
            options: {
                terms: {
                    field: 'data.option',
                    size: 100
                }
            }
        },
        contentTypes: [app.name + ':poll-response']
    });

    return result || null;
}