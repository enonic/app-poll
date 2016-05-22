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
                bodyEnd: ['<script src="' + portal.assetUrl({path: 'js/polls.js'}) + '"></script>']
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


    function error(message) {
        return {
            contentType: 'application/json',
            body: {error: message}
        }
    }

    return {
        contentType: 'applicaition/json',
        body: {success: 'Content created!'}
    }


}