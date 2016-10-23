$j(document).ready(function() {

    var pollElements = $j('[data-poll-id]');

    $j('.poll-form').on('submit', function(e) {
        e.preventDefault();

        var form = $j(this),
            option = form.find('input[name=option]:checked');

        $j.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: {
                option: option.val()
            },
            dataType: 'json'

        }).done(function(data) {
            if(!data.success) {
                //Didn't store response
                var errorBlock = form.find('.error-message');
                errorBlock.html(data.error);
            } else {
                form.find('.poll-option').hide();

                var labels = form.find('.poll-choice'),
                    label;

                labels.each(function(i) {
                    label = $j(this);
                    label.find('.poll-background').css('width', data.choices[i].percent + '%')
                    label.find('.poll-result-percent').html(data.choices[i].percent + '%').css('display','inline');
                    if(data.choices[i].winner) {
                        label.find('.poll-background').addClass('poll-winner');
                    }

                });
                form.find('button[type=submit]').hide('slow');
                form.find('.poll-total').html(data.total + ' votes');
            }

        }).error(function(xhr, status, error) {
            // Server error
            form.find('.error-message').html(error);
        });

    });

});