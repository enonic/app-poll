// libs
var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');
var util = require('/lib/enonic/util');

exports.get = handleGet;

exports.post = handlePost;

function handleGet(req) {

    var component = portal.getComponent();
    var config = component.config;


    function renderView() {
        var body = thymeleaf.render( resolve('poll.html'), createModel() );

        return {
            body: body,
            pageContributions: {
                bodyEnd: ['<script src="' + portal.assetUrl({path: 'js/polls.js'}) + '"></script>'],
                headEnd: ['<link rel="stylesheet" href="' + portal.assetUrl({path: 'css/polls.css'}) + '" type="text/css" media="all">']
            }
        };
    }

    function createModel() {
        var model = {};

        var poll = contentLib.get({key: config.poll || 1});
        /*log.info('the poll is: ');
        util.log(poll);*/

        model.poll = poll;
        model.id = 'poll-' + component.path.replace(/\/+/g, '-');
        model.action = portal.componentUrl({component: component._path});

        return model;
    }

    return renderView();
}

function handlePost(req) {
    var component = portal.getComponent();
    var config = component.config;
    var params = req.params;
    var pollContent = contentLib.get({key: config.poll || 1});

    if(!pollContent) {
        return error('No poll content.');
    }
    var pollOptions = pollContent.data.options; // Array of the options

    //util.log(pollContent);

    try {
        var responseContent = contentLib.create({
            displayName: params.option || 'response',
            parentPath: pollContent._path,
            contentType: app.name + ':poll-response',
            data: {
                poll: pollContent._id,
                option: params.option
            }
        });
    } catch(e) {
        log.info(e.message);
        return error('Failed to create response content.');
    }

    var results = getResults(pollContent);
    var choices = getResultCount(results, pollOptions);

    log.info('The choices are: ');
    util.log(choices);


    var body = {};
    body.success = true;
    body.results = results;
    body.total = results.total;
    body.choices = choices;

    util.log(body.results);

    function getResultCount(results, pollOptions) {
        var options = [];
        pollOptions.map(function(option, i) {
            var choice = {};
            choice.value = option;
            choice.count = 0;

            results.aggregations.options.buckets.map(function(bucket, n) {

                if(option.toLowerCase() == bucket.key) {
                    log.info('docCount match ' + bucket.key);
                    choice.count = bucket.docCount;
                }
            });

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

        if(!result) {
            return null;
        }


        return result? result : null;
    }


    function error(message) {
        return {
            contentType: 'application/json',
            body: {error: message}
        }
    }

    return {
        contentType: 'applicaition/json',
        body: body
    }


}