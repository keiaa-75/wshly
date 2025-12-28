$(document).ready(function() {
    const components = {
        '#sound-overlay-placeholder': 'parts/sound-overlay.html',
        '#about-modal-placeholder': 'parts/about-modal.html',
        '#error-modal-placeholder': 'parts/error-modal.html',
        '#card-display-placeholder': 'parts/card-display.html',
        '#form-toggle-placeholder': 'parts/form-toggle.html',
        '#card-form-placeholder': 'parts/card-form.html'
    };

    const promises = Object.keys(components).map(placeholder => {
        return $.get(components[placeholder], function(data) {
            $(placeholder).html(data);
        });
    });

    $.when.apply($, promises).done(function() {
        const subComponents = {
            '#stickers-placeholder': 'parts/stickers.html',
            '#snowflakes-placeholder': 'parts/pixel-snowflakes.html',
            '#mainMessage-dropdown': 'parts/custom-dropdown.html',
            '#copyLink-button-placeholder': 'parts/pixel-button.html'
        };

        const subPromises = Object.keys(subComponents).map(placeholder => {
            return $.get(subComponents[placeholder], function(data) {
                $(placeholder).html(data);
            });
        });
        
        $.when.apply($, subPromises).done(function() {
            const buttonPlaceholder = $('#copyLink-button-placeholder');
            const button = buttonPlaceholder.find('button');
            button.attr('id', 'copyLink');
            button.find('span').text('Share Card <3');

            if (typeof wshly !== 'undefined' && typeof wshly.init === 'function') {
                wshly.init();
            }
        });
    });
});
