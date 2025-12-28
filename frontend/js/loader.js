$(document).ready(function() {
    const components = {
        '#sound-overlay-placeholder': 'components/sound-overlay.html',
        '#about-modal-placeholder': 'components/about-modal.html',
        '#error-modal-placeholder': 'components/error-modal.html',
        '#card-display-placeholder': 'components/card-display.html',
        '#form-toggle-placeholder': 'components/form-toggle.html',
        '#card-form-placeholder': 'components/card-form.html'
    };

    const promises = Object.keys(components).map(placeholder => {
        return $.get(components[placeholder], function(data) {
            $(placeholder).html(data);
        });
    });

    $.when.apply($, promises).done(function() {
        // All components are loaded, now load the sub-components
        const subComponents = {
            '#stickers-placeholder': 'components/stickers.html',
            '#snowflakes-placeholder': 'components/pixel-snowflakes.html',
            '#mainMessage-dropdown': 'components/custom-dropdown.html',
            '#copyLink-button-placeholder': 'components/pixel-button.html'
        };

        const subPromises = Object.keys(subComponents).map(placeholder => {
            return $.get(subComponents[placeholder], function(data) {
                $(placeholder).html(data);
            });
        });
        
        $.when.apply($, subPromises).done(function() {
            // All sub-components are loaded, now customize the pixel button
            const buttonPlaceholder = $('#copyLink-button-placeholder');
            const button = buttonPlaceholder.find('button');
            button.attr('id', 'copyLink');
            button.find('span').text('Share Card <3');

            // Now that all HTML is loaded, initialize the main script
            if (typeof wshly !== 'undefined' && typeof wshly.init === 'function') {
                wshly.init();
            }
        });
    });
});
