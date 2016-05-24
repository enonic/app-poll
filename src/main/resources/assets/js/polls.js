$(document).ready(function() {

    var pollElements = $('[data-poll-id]');

    $('.poll-form').on('submit', function(e) {
        e.preventDefault();

        var form = $(this);
        var option = form.find('input[name=option]:checked');

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
            form.find('.poll-option').hide();

            console.log(data);

            var labels = form.find('.poll-choice');
            labels.each(function(i) {
                var label = $(this);
                var width = Math.round((data.choices[i].count / data.total) * 100);
                label.find('.background').css('width', width + '%')
                label.find('.result-percent').html(width + '%');
            });
            form.find('button[type=submit]').hide();

        }).error(function(xhr, status, error) {
            // Server error
        });

    });

});