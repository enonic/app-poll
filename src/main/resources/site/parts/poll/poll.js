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

        //TODO: Show the results if the user already submitted.

        var poll = contentLib.get({key: config.poll || 1});
        var results = getResults(poll);

        model.poll = poll;
        model.id = 'poll-' + component.path.replace(/\/+/g, '-');
        model.action = portal.componentUrl({component: component._path});
        model.expires = isPollClosed(poll.data.expires, poll.data.closed) ? 'Final results' : 'Closes ' + moment(poll.data.expires).fromNow();
        model.closed = isPollClosed(poll.data.expires, poll.data.closed);
        model.total = results ? results.total + ' votes - ' : '0 votes - ';
        model.options = getResultCount(results, poll.data.options);

        return model;
    }

    return renderView();
}

function isPollClosed(expires, closed) {
    var date = moment(expires);
    if(closed || moment.now() > date) {
        return true;
    }
    return false;
}

function handlePost(req) {
    //TODO: Check that the submitted choice is one of the valid options.
    //TODO: Don't let the same user submit twice.
    var component = portal.getComponent();
    var config = component.config;
    var params = req.params;
    var pollContent = contentLib.get({key: config.poll || 1});
    var user = auth.getUser();

    if(!pollContent) {
        return error('No poll content.');
    }
    var pollOptions = pollContent.data.options; // Array of the options

    //util.log(pollContent);

    try {
        var data = {
            poll: pollContent._id,
            option: params.option
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

        choice.percent = Math.round((choice.count / results.total) * 100);

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