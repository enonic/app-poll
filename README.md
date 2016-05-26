# Simple poll app

Add polls to your site to see what your visitors think.

## Features

* Add a poll with two or more choices.
* Polls can stay open indefinitely or they can be set to expire automatically at a specified date and time.
* A cookie is used to prevent non-logged in users from submitting multiple times.
* Optionally require users to be logged in before answering a poll. 
* Poll results are shown with bar graphs and the percentage for each option.

## Compatibility

| Version       | XP version |
| ------------- | ---------- |
| 1.0.0         | 6.5.0      |

## Instructions

* Edit your site content and add this app to the applications list.
* Create a Poll content. 
* Enter the poll question in the `<Display Name>` field. Enter two or more options. 
* Optionally add a date and time for closing the poll.
* Checking the "Require login" box will prevent non-logged in users from answering the poll. Only use this if your site has a login page.
* Add the Poll part to the desired location on the page.
* Configure the Poll part with the desired poll content.
* Save and publish the page with the new poll.
* Close a poll at any time to prevent further entries by editing the Poll content and checking the "Close poll" box. 

## Styling

This app has some very basic CSS styling. Custom styling can be achieved by adding CSS rules to your main app's CSS files. 

## Troubleshooting
This app won't work without jQuery, which most websites already have. If the poll doesn't work, for example, if you see a white page with some code after clicking the 
"Vote" button, then you can add jQuery by checking a box in the app configuration. Edit the site content. Find the Poll app and click the pencil icon to edit the 
app configuration. Check the box to include jQuery. Do not check the "Include jQuery" box if the poll is working ok without it.

Have questions? Need help? Visit the [Enonic forum](https://discuss.enonic.com/).
