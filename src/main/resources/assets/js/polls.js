$(document).ready(function() {

    var pollElements = $('[data-poll-id]');

    $('.poll-option').on('click', function(e) {

        var option = $(this);
        var form = option.parent();

        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: {
                option: option.val()
            },
            dataType: 'json'

        }).done(function(data) {
            if(!data.success) {
                //Didn't store response
            }

        }).error(function(xhr, status, error) {
            // Server error
        });

    });

});