// libs
var auth = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');
var util = require('/lib/enonic/util');
var moment = require('/assets/momentjs/2.12.0/min/moment-with-locales.min.js');

exports.get = handleGet;
exports.post = handlePost;

function handleGet(req) {

    var component = portal.getComponent();
    var config = component.config;
    var siteConfig = portal.getSiteConfig();
    var pollCSS = siteConfig.pollCSS;
    var user = auth.getUser();
    var poll = contentLib.get({key: config.poll || 1});

    function renderView() {
        var body = thymeleaf.render( resolve('poll.html'), createModel() );

        var pageContributions = {
            headEnd: [
                '<script src="' + portal.assetUrl({path: 'jquery/2.2.4/jquery.min.js'}) + '"></script>',
                '<script>var $j = jQuery.noConflict(true);</script>'],
            bodyEnd: ['<script src="' + portal.assetUrl({path: 'js/polls.js'}) + '"></script>']
        };

        if(pollCSS == 'default') {
            pageContributions.headEnd.push('<link rel="stylesheet" href="' + portal.assetUrl({path: 'css/polls.css'}) + '" type="text/css" media="all">');
        }
        if(pollCSS == 'bootstrap') {
            pageContributions.headEnd.push('<link rel="stylesheet" href="' + portal.assetUrl({path: 'css/poll-bootstrap.css'}) + '" type="text/css" media="all">');
        }

        return {
            body: body,
            pageContributions: pageContributions,
            cookies: createCookie(poll, req.cookies || {})
        };
    }

    function createModel() {

        var model = {};

        model.poll = poll ? true : false;
        model.containerClass = siteConfig.containerClass;
        model.bootstrap = (pollCSS == 'bootstrap') ? true : false;

        if(!poll) {
            model.heading = 'Configure poll';
            return model;
        }

        var results = getResults(poll);
        var closed = isPollClosed(poll);

        model.id = 'poll-' + component.path.replace(/\/+/g, '-');
        model.heading = model.bootstrap && !config.heading ? poll.displayName : config.heading;
        model.question = model.bootstrap && !config.heading ? null : poll.displayName;
        model.action = portal.componentUrl({component: component._path});
        model.expires = getExpires(closed, poll.data.expires);
        model.closed = closed || hasResponded(poll, req.cookies);
        model.total = results ? results.total + ' votes' : '0 votes';
        model.options = getResultCount(results, util.data.forceArray(poll.data.options), model.closed);
        model.requireLogin = poll.data.requireLogin && !user;

        return model;
    }

    return renderView();
}

function handlePost(req) {
    var component = portal.getComponent();
    var config = component.config;
    var params = req.params;
    var pollContent = contentLib.get({key: config.poll || 1});
    var user = auth.getUser();
    var cookie = req.cookies ? req.cookies[app.name] : null;

    if(!cookie) {
        return error('Cookies are required to participate in this poll.');
    }

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
        var context = contextLib.get();
        var responseContent = contextLib.run({
            user: {
                login: 'su',
                userStore: 'system'
            }
        }, function() {return createResponse(params, pollContent, user, context, cookie)});
        if(!responseContent) {
            return error('Failed to create poll response content.');
        }

    } catch(e) {
        log.error(e.message);
        return error('Failed to create poll response content.');
    }

    var results = getResults(pollContent);

    var body = {};
    body.success = true;
    body.total = results.total;
    body.choices = getResultCount(results, pollOptions, true);

    return {
        contentType: 'application/json',
        body: body
    }

}

function error(message) {
    return {
        contentType: 'application/json',
        body: {error: message}
    };
}

// Create and publish the response content
function createResponse(params, pollContent, user, context, cookie) {
    var userName = user? user.displayName : 'Anonymous';
    var responseContent = contentLib.create({
        displayName: params.option  + ' - ' + userName,
        name: cookie,
        branch: 'draft',
        parentPath: pollContent._path,
        contentType: app.name + ':poll-response',
        data: {
            poll: pollContent._id,
            option: params.option,
            user: user ? user.key : null
        }
    });

    // Only publish responses if on the master branch
    if(context.branch == 'master') {
        var published = contentLib.publish({
            keys: [responseContent._id],
            sourceBranch: 'draft',
            targetBranch: 'master'
        });
        if(!published || !published.pushedContents || published.pushedContents.length < 1) {
            log.error('Failed to publish poll response content.');
            return null;
        }
    }

    return responseContent || null;
}

// Make sure some smartass didn't change the input value
function isValidOption(choice, pollOptions) {
    var valid = false;

    pollOptions.map(function(option, i)  {
        if (option == choice) {
            valid = true;
        }
    });

    return valid;
}

// Get an array of options with counts
function getResultCount(results, pollOptions, showWinner) {
    var options = [];
    var highest = 0;

    pollOptions.map(function(option, i) {
        var choice = {};
        choice.value = option;
        choice.count = 0;

        results.aggregations.options.buckets.map(function(bucket, n) {
            if(option.toLowerCase() == bucket.key) {
                choice.count = bucket.docCount;
            }
        });

        var percent = Math.round((choice.count / results.total) * 100).toString();
        if(percent == 'NaN') {
            percent = '0';
        }

        choice.percent = percent;
        if(choice.count >= highest) {
            highest = choice.count;
        }
        options.push(choice);
    });
    if(showWinner) {
        options.map(function(option, i) {
            if(option.count == highest) {
                option.winner = 'poll-winner';
            }
        });
    }

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

// Create a random identifier cookie for each visitor to prevent duplicate entries.
function createCookie(poll, cookies) {
    if(!poll) {
        return null;
    }
    var cookie = {};
    cookie[app.name] = {
        value: cookies[app.name] ? cookies[app.name] : generateUUID(),
        maxAge: 60 * 60 * 24 * 365, // 365 days
        path: '/'
    }

    return cookie;
}

// Get a random value for the cookie
function generateUUID(){
    var d = Date.now();

    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

// If the poll is closed or expired show final results, else show time to expire, else if open and no expiration date show nothing.
function getExpires(closed, expires) {
    if(closed) {
        return 'Final results';
    }
    if(!expires) {
        return '';
    }
    return 'Closes ' + moment(expires).fromNow();
}

function isPollClosed(poll) {
    var date = poll.data.expires ? moment(poll.data.expires) : null;
    if(poll.data.closed || ( date && moment.now() > date)) {
        return true;
    }

    return false;
}

//Check if logged in user already submitted.
function hasResponded(poll, cookies) {

    var user = auth.getUser();
    if(user || cookies[app.name]) {
        if(!user) {
            user = {};
        }
        var response = contentLib.query({
            count: 1,
            query: '_parentPath = "/content' + poll._path + '" AND (data.user = "' + user.key + '" OR _name = "' + cookies[app.name] + '")',
            contentTypes: [app.name + ':poll-response']
        });

        if(response.total > 0) {
            return true;
        }
    }
    return false;
}
