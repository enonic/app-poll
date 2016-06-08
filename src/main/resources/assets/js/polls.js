$j(document).ready(function() {

    var pollElements = $j('[data-poll-id]');

    $j('.poll-form').on('submit', function(e) {
        e.preventDefault();

        var form = $j(this);
        var option = form.find('input[name=option]:checked');

        console.log(option.val());

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

                var labels = form.find('.poll-choice');
                labels.each(function(i) {
                    var label = $j(this);
                    label.find('.background').css('width', data.choices[i].percent + '%')
                    label.find('.result-percent').html(data.choices[i].percent + '%').css('display','inline');
                });
                form.find('button[type=submit]').hide('slow');
                form.find('.total').html(data.total + ' votes');
            }

        }).error(function(xhr, status, error) {
            // Server error
            form.find('.error-message').html(error);
        });

    });

});