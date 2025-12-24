const CardCreator = {
    config: {
        MAX_CHARS: 150,
        CHAR_WARNING_THRESHOLD: 20
    },
    
    preview: {
        update: function() {
            const senderName = $('input[name="senderName"]').val() || 'You';
            const recipientName = $('input[name="recipientName"]').val() || 'Someone Special';
            const mainMessage = $('select[name="mainMessage"] option:selected').text() || 'Merry Christmas!';
            const customMessage = $('textarea[name="customMessage"]').val();
            
            $('#card-content').html(`
                <h3 class="font-superhelio text-lg text-cherry-600 leading-relaxed pixel-shadow font-bold">${mainMessage}</h3>
                <div class="space-y-1">
                    <p class="font-aux-dotbitc text-gray-600 text-lg">TO:</p>
                    <p class="font-superhelio text-xl text-pink-600 font-bold">${recipientName}</p>
                </div>
                ${customMessage.trim() ? `<div class="bg-pink-50 border-2 border-pink-200 rounded p-3 mx-2"><p class="font-aux-dotbitc text-gray-700 text-base leading-relaxed">${customMessage}</p></div>` : ''}
                <div class="space-y-1 pt-2">
                    <p class="font-aux-dotbitc text-gray-600 text-lg">FROM:</p>
                    <p class="font-superhelio text-xl text-cherry-600 font-bold">${senderName}</p>
                </div>
            `);
        },
        
        init: function() {
            this.update();
        }
    },
    
    validation: {
        validateField: function(field) {
            const $field = $(field);
            const isRequired = $field.prop('required');
            const isEmpty = !$field.val().trim();
            
            if (isRequired && isEmpty) {
                $field.removeClass('border-pink-200').addClass('border-red-400 ring-1 ring-red-400');
            } else {
                $field.removeClass('border-red-400 ring-1 ring-red-400').addClass('border-pink-200');
            }
        },
        
        updateCharCounter: function() {
            const $textarea = $('textarea[name="customMessage"]');
            const current = $textarea.val().length;
            const remaining = CardCreator.config.MAX_CHARS - current;
            
            let $counter = $('#char-counter');
            if ($counter.length === 0) {
                $counter = $('<div id="char-counter" class="text-xs text-right mt-1"></div>');
                $textarea.after($counter);
            }
            
            $counter.text(`${remaining} characters remaining`);
            $counter.toggleClass('text-red-500', remaining < CardCreator.config.CHAR_WARNING_THRESHOLD);
            $counter.toggleClass('text-gray-500', remaining >= CardCreator.config.CHAR_WARNING_THRESHOLD);
        }
    },
    
    sharing: {
        generateUrl: function() {
            const params = new URLSearchParams();
            params.set('senderName', $('input[name="senderName"]').val());
            params.set('recipientName', $('input[name="recipientName"]').val());
            params.set('mainMessage', $('select[name="mainMessage"]').val());
            const customMsg = $('textarea[name="customMessage"]').val();
            if (customMsg.trim()) {
                params.set('customMessage', customMsg);
            }
            return `${window.location.origin}/card?${params.toString()}`;
        },
        
        copyLink: function() {
            const url = this.generateUrl();
            const $btn = $('#copyLink');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    const originalText = $btn.text();
                    $btn.text('Copied!').removeClass('from-pink-500 to-red-500').addClass('from-green-500 to-green-600');
                    setTimeout(() => {
                        $btn.text(originalText).removeClass('from-green-500 to-green-600').addClass('from-pink-500 to-red-500');
                    }, 2000);
                });
            }
        }
    },
    
    ui: {
        toggleForm: function() {
            const $formPane = $('#form-pane');
            const $toggleIcon = $('#toggle-icon');
            const $previewArea = $('#preview-area');
            const formHeight = $formPane.outerHeight();
            const isMobile = () => $(window).width() < 768;
            let isCollapsed = false;
            
            $('#form-toggle').on('click', function() {
                isCollapsed = !isCollapsed;
                
                if (isCollapsed) {
                    $formPane.addClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                    $toggleIcon.addClass('rotate-180').removeClass('md:rotate-90').addClass('md:-rotate-90');
                    $previewArea.removeClass('md:left-80').addClass('md:left-0');
                    if (isMobile()) {
                        $previewArea.css('bottom', '0');
                    }
                } else {
                    $formPane.removeClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                    $toggleIcon.removeClass('rotate-180 md:-rotate-90').addClass('md:rotate-90');
                    $previewArea.removeClass('md:left-0').addClass('md:left-80');
                    if (isMobile()) {
                        $previewArea.css('bottom', formHeight + 'px');
                    }
                }
            });
            
            if (isMobile()) {
                $previewArea.css('bottom', formHeight + 'px');
            }
        }
    },
    
    init: function() {
        const self = this;
        
        this.preview.init();
        this.validation.updateCharCounter();
        
        $('input, select, textarea').on('input change', function() {
            self.preview.update();
            self.validation.validateField(this);
            if ($(this).attr('name') === 'customMessage') {
                self.validation.updateCharCounter();
            }
        });
        
        $('#copyLink').on('click', function() {
            self.sharing.copyLink();
        });
        
        this.ui.toggleForm();
    }
};

$(document).ready(function() {
    CardCreator.init();
});
