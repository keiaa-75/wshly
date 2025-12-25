const wshly = {
    config: {
        MAX_CHARS: 150,
        CHAR_WARNING_THRESHOLD: 20
    },
    
    urlParams: {
        parse: function() {
            const params = new URLSearchParams(window.location.search);
            return {
                senderName: params.get('senderName'),
                recipientName: params.get('recipientName'),
                mainMessage: params.get('mainMessage'),
                customMessage: params.get('customMessage'),
                f: params.get('f'),
                m: params.get('m')
            };
        },
        
        populateForm: function() {
            const params = this.parse();
            if (params.senderName) {
                $('input[name="senderName"]').val(params.senderName);
            }
            if (params.recipientName) {
                $('input[name="recipientName"]').val(params.recipientName);
            }
            if (params.mainMessage) {
                // Handle custom dropdown
                const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
                const hiddenInput = dropdown.find('input[type="hidden"]');
                const dropdownText = dropdown.find('.dropdown-text');
                const options = dropdown.find('.pixel-dropdown-option');
                
                hiddenInput.val(params.mainMessage);
                
                // Find and select the matching option
                options.removeClass('selected');
                const matchingOption = options.filter(`[data-value="${params.mainMessage}"]`);
                if (matchingOption.length) {
                    matchingOption.addClass('selected');
                    dropdownText.text(matchingOption.text());
                }
            }
            if (params.customMessage) {
                $('textarea[name="customMessage"]').val(params.customMessage);
            }
        }
    },
    
    preview: {
        update: function() {
            const senderName = $('input[name="senderName"]').val() || 'You';
            const recipientName = $('input[name="recipientName"]').val() || 'Someone Special';
            
            // Get selected message from custom dropdown
            const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
            const selectedOption = dropdown.find('.pixel-dropdown-option.selected');
            const mainMessage = selectedOption.length ? selectedOption.text() : 'Merry Christmas!';
            
            const customMessage = $('textarea[name="customMessage"]').val();
            
            // Update card elements
            $('#card-header').text(mainMessage);
            $('#card-recipient').text(recipientName);
            $('#card-sender').text(senderName);
            
            // Handle custom message visibility
            const $customMsgContainer = $('#card-custom-message');
            if (customMessage.trim()) {
                $customMsgContainer.removeClass('hidden').find('p').text(customMessage);
            } else {
                $customMsgContainer.addClass('hidden');
            }
            
            // Check layout mode
            this.checkDesktopMode();
        },
        
        checkDesktopMode: function() {
            const $container = $('#postcard-container');
            const $messagePane = $('#card-message-pane');
            const $addonPane = $('#card-addon-pane');
            
            // Detect if panes are side-by-side (horizontal layout)
            const messageTop = $messagePane.offset()?.top || 0;
            const addonTop = $addonPane.offset()?.top || 0;
            const isHorizontal = Math.abs(messageTop - addonTop) < 10;
            
            if (isHorizontal) {
                $container.addClass('desktop-mode');
            } else {
                $container.removeClass('desktop-mode');
            }
        },
        
        init: function() {
            this.update();
            
            // Re-check on resize
            $(window).on('resize', () => this.checkDesktopMode());
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
            const remaining = wshly.config.MAX_CHARS - current;
            
            let $counter = $('#char-counter');
            if ($counter.length === 0) {
                $counter = $('<div id="char-counter" class="text-xs text-right mt-1"></div>');
                $textarea.after($counter);
            }
            
            $counter.text(`${remaining} characters remaining`);
            $counter.toggleClass('text-red-500', remaining < wshly.config.CHAR_WARNING_THRESHOLD);
            $counter.toggleClass('text-gray-500', remaining >= wshly.config.CHAR_WARNING_THRESHOLD);
        }
    },
    
    sharing: {
        generateUrl: function() {
            const params = new URLSearchParams();
            params.set('senderName', $('input[name="senderName"]').val());
            params.set('recipientName', $('input[name="recipientName"]').val());
            
            // Get value from custom dropdown
            const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
            const hiddenInput = dropdown.find('input[type="hidden"]');
            params.set('mainMessage', hiddenInput.val());
            
            const customMsg = $('textarea[name="customMessage"]').val();
            if (customMsg.trim()) {
                params.set('customMessage', customMsg);
            }
            params.set('f', '1');
            params.set('m', '1');
            return `${window.location.origin}/card?${params.toString()}`;
        },
        
        copyLink: function() {
            const url = this.generateUrl();
            const $btn = $('#copyLink');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    const originalText = $btn.find('span').text();
                    $btn.addClass('copied');
                    $btn.find('span').text('Copied! <3');
                    
                    setTimeout(() => {
                        $btn.removeClass('copied');
                        $btn.find('span').text(originalText);
                    }, 2000);
                });
            }
        }
    },
    
    music: {
        audio: null,
        isPlaying: false,
        
        init: function(autoplay) {
            this.audio = new Audio('/audio/bgm.mp3');
            this.audio.loop = true;
            if (autoplay === '1') {
                $('#sound-overlay').removeClass('hidden');
            }
        },
        
        toggle: function() {
            if (this.isPlaying) {
                this.audio.pause();
                $('#musicIcon').attr('src', '/svg/icon-play.svg');
            } else {
                this.audio.play();
                $('#musicIcon').attr('src', '/svg/icon-pause.svg');
            }
            this.isPlaying = !this.isPlaying;
        },
        
        enableFromOverlay: function() {
            $('#sound-overlay').addClass('hidden');
            this.toggle();
        }
    },
    
    ui: {
        setFormVisibility: function(params) {
            if (params.f === '1') {
                const $formPane = $('#form-pane');
                const $toggleIcon = $('#toggle-icon');
                const $previewArea = $('#preview-area');
                
                $formPane.addClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                $toggleIcon.addClass('rotate-180').removeClass('md:rotate-90').addClass('md:-rotate-90');
                $previewArea.removeClass('md:left-80').addClass('md:left-0');
                
                if ($(window).width() < 768) {
                    $previewArea.css('bottom', '0');
                }
            }
        },
        
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
        const params = this.urlParams.parse();
        
        this.urlParams.populateForm();
        this.preview.init();
        this.validation.updateCharCounter();
        this.music.init(params.m);
        
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
        
        $('#musicToggle').on('click', function() {
            self.music.toggle();
        });
        
        $('#enable-sound').on('click', function() {
            self.music.enableFromOverlay();
        });
        
        $('#about-btn').on('click', function() {
            $('#about-modal').removeClass('hidden');
        });
        
        $('#close-about').on('click', function() {
            $('#about-modal').addClass('hidden');
        });
        
        $('#about-modal').on('click', function(e) {
            if (e.target === this) {
                $('#about-modal').addClass('hidden');
            }
        });
        
        this.ui.toggleForm();
        this.ui.setFormVisibility(params);
    }
};

$(document).ready(function() {
    wshly.init();
});
