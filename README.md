# Simple poll app

Interact with your visitors by adding polls to your site

## Features

* Add polls with two or more choices.
* Polls can stay open indefinitely or they can be set to expire automatically at a specified date and time.
* A cookie is used to prevent non-logged in users from submitting multiple times.
* Optionally require users to be logged in before answering a poll. 
* Poll results are shown with bar graphs and the percentage for each option.
* Use the default styling, bootstrap styling, or custom styling.

## Compatibility

| Version       | XP version |
| ------------- | ---------- |
| 2.0.0         | 6.5.0      |
| 1.0.0         | 6.5.0      |

## Instructions

* Edit your site content and add this app to the applications list.
* Configure the Poll app and select the styling option. (See the Styling section below)
* Optionally add a CSS class to the part container. 
* Create a Poll content. 
* Enter the poll question in the `<Display Name>` field. Enter two or more options. 
* Optionally add a date and time for closing the poll.
* Checking the "Require login" box will prevent non-logged in users from answering the poll. Only use this if your site has a login page.
* Add the Poll part to the desired location on the page.
* Configure the Poll part with the desired poll content.
* Optionally add a heading to the poll part that will appear above the question.
* Save and publish the page with the new poll.
* Close a poll at any time to prevent further entries by editing the Poll content and checking the "Close poll" box. 

## Styling

The app configuration has three options for styling: "Default", "Bootstrap", and "None". If the default styling does not match the look of your site 
then it can be overridden with custom CSS. The default styling can be completely removed by selecting "None" in the app configuration. This will 
require custom CSS rules to your main app's CSS files. If your site uses Bootstrap then the "Bootstrap markup" setting will render the poll in a 
Bootstrap panel.

A CSS class can be added to the poll part container element in the app configuration. This can help the poll to match existing styling rules on your 
website without changing CSS. This will only be helpful in certain situations and you'll need to know exactly what class to add based on your website's code.

## Note

This app uses jQuery with noConflict so it will not interfere with another version of jQuery that might be installed on a site.

## Troubleshooting

Have questions? Need help? Visit the [Enonic forum](https://discuss.enonic.com/).

## Changelog

### 2.0.0

* Response content will no longer be published when in preview mode.
* Moved the heading configuration from the poll content to the poll part config.
* Fixed a bug that caused NaN to show as the percentage of votes for an option when the poll is closed and the option has no votes.
* Cookies are now required to submit.
* Response content name is now the cookie value.