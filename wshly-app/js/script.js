const wshly = {
    config: {
        MAX_CHARS: 150,
        CHAR_WARNING_THRESHOLD: 20,
        mainMessages: {
            MERRY_CHRISTMAS: "Merry Christmas!",
            HAPPY_HOLIDAYS: "Happy Holidays!",
            SEASONS_GREETINGS: "Season's Greetings!",
            HAPPY_NEW_YEAR: "Happy New Year!",
            WARM_WISHES: "Warm Holiday Wishes!",
            JOY_AND_PEACE: "Wishing You Joy & Peace"
        },
        defaultMessage: 'MERRY_CHRISTMAS'
    },
    
    theme: {
        current: localStorage.getItem('wshly-theme') || 'cherry',
        
        init: function() {
            $('#theme-label').text(this.current);
        },
        
        toggle: function() {
            this.current = this.current === 'cherry' ? 'snow' : 'cherry';
            $('html').toggleClass('snow', this.current === 'snow');
            $('#theme-label').text(this.current);
            localStorage.setItem('wshly-theme', this.current);
        }
    },
    
    utils: {
        copyToClipboard: function(text) {
            // Modern API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            }
            // Fallback for older browsers / non-HTTPS
            return $.Deferred(function(deferred) {
                const $temp = $('<textarea>').val(text).css({
                    position: 'fixed',
                    left: '-9999px'
                }).appendTo('body').trigger('select');
                
                try {
                    document.execCommand('copy');
                    deferred.resolve();
                } catch (e) {
                    deferred.reject(e);
                } finally {
                    $temp.remove();
                }
            }).promise();
        }
    },
    
    urlParams: {
        parse: function() {
            const params = new URLSearchParams(window.location.search);
            return {
                senderName: DOMPurify.sanitize(params.get('senderName') || '', {ALLOWED_TAGS: []}),
                recipientName: DOMPurify.sanitize(params.get('recipientName') || '', {ALLOWED_TAGS: []}),
                mainMessage: DOMPurify.sanitize(params.get('mainMessage') || '', {ALLOWED_TAGS: []}),
                customMessage: DOMPurify.sanitize(params.get('customMessage') || '', {ALLOWED_TAGS: []}),
                f: params.get('f'),
                m: params.get('m'),
                error: params.get('error')
            };
        },
        
        populateForm: function() {
            const params = this.parse();
            
            if (params.senderName) {
                $('input[name="senderName"]').val(params.senderName.substring(0, 10));
            }
            if (params.recipientName) {
                $('input[name="recipientName"]').val(params.recipientName.substring(0, 10));
            }
            if (params.mainMessage) {
                const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
                const hiddenInput = dropdown.find('input[type="hidden"]');
                const dropdownText = dropdown.find('.dropdown-text');
                const options = dropdown.find('.pixel-dropdown-option');
                
                hiddenInput.val(params.mainMessage);
                
                options.removeClass('selected');
                const matchingOption = options.filter(`[data-value="${params.mainMessage}"]`);
                if (matchingOption.length) {
                    matchingOption.addClass('selected');
                    dropdownText.text(matchingOption.text());
                }
            }
            if (params.customMessage) {
                $('textarea[name="customMessage"]').val(params.customMessage.substring(0, 150));
            }
        }
    },
    
    preview: {
        update: function() {
            const senderName = DOMPurify.sanitize($('input[name="senderName"]').val() || 'You', {ALLOWED_TAGS: []});
            const recipientName = DOMPurify.sanitize($('input[name="recipientName"]').val() || 'Someone Special', {ALLOWED_TAGS: []});
            
            const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
            const selectedOption = dropdown.find('.pixel-dropdown-option.selected');
            const mainMessage = DOMPurify.sanitize(selectedOption.length ? selectedOption.text() : 'Merry Christmas!', {ALLOWED_TAGS: []});
            
            const customMessage = DOMPurify.sanitize($('textarea[name="customMessage"]').val(), {ALLOWED_TAGS: []});
            
            $('#card-header').text(mainMessage);
            $('#card-recipient').text(recipientName);
            $('#card-sender').text(senderName);
            
            const $customMsgContainer = $('#card-custom-message');
            if (customMessage.trim()) {
                $customMsgContainer.removeClass('hidden').find('p').text(customMessage);
            } else {
                $customMsgContainer.addClass('hidden');
            }
        },
        
        init: function() {
            this.update();
        }
    },
    
    validation: {
        limits: { senderName: 10, recipientName: 10, customMessage: 150 },
        
        validateField: function(field) {
            const $field = $(field);
            const name = $field.attr('name');
            const value = $field.val();
            const maxLen = this.limits[name];
            const isRequired = $field.prop('required');
            const isEmpty = !value.trim();
            
            if (maxLen && value.length > maxLen) {
                $field.val(value.substring(0, maxLen));
            }
            
            const sanitized = DOMPurify.sanitize(value, {ALLOWED_TAGS: []});
            if (sanitized !== value) {
                $field.val(sanitized);
            }
            
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
        cooldown: false,
        cachedLongUrl: null,
        cachedShortUrl: null,
        
        generateUrl: function() {
            const params = new URLSearchParams();
            params.set('senderName', DOMPurify.sanitize($('input[name="senderName"]').val(), {ALLOWED_TAGS: []}));
            params.set('recipientName', DOMPurify.sanitize($('input[name="recipientName"]').val(), {ALLOWED_TAGS: []}));
            
            const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
            const hiddenInput = dropdown.find('input[type="hidden"]');
            params.set('mainMessage', DOMPurify.sanitize(hiddenInput.val(), {ALLOWED_TAGS: []}));
            
            const customMsg = DOMPurify.sanitize($('textarea[name="customMessage"]').val(), {ALLOWED_TAGS: []});
            if (customMsg.trim()) {
                params.set('customMessage', customMsg);
            }
            params.set('f', '1');
            params.set('m', '1');
            return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        },
        
        shortenUrl: function(url) {
            return $.ajax({
                url: 'https://tinyurl.com/api-create.php',
                method: 'GET',
                data: { url: url },
                dataType: 'text'
            });
        },
        
        copyLink: function() {
            if (this.cooldown) return;
            
            const self = this;
            const url = this.generateUrl();
            const $btn = $('#copyLink');
            const originalText = $btn.find('span').text();
            const shouldShorten = $('#shorten-toggle').attr('aria-checked') === 'true';
            
            const onCopied = function() {
                self.cooldown = true;
                $btn.addClass('copied').find('span').text('Copied! <3');
                setTimeout(function() {
                    self.cooldown = false;
                    $btn.removeClass('copied').find('span').text(originalText);
                }, 5000);
            };
            
            if (shouldShorten) {
                $btn.find('span').text('Shortening...');
                
                if (url === self.cachedLongUrl && self.cachedShortUrl) {
                    wshly.utils.copyToClipboard(self.cachedShortUrl).then(onCopied);
                } else {
                    this.shortenUrl(url)
                        .then(function(shortUrl) {
                            self.cachedLongUrl = url;
                            self.cachedShortUrl = shortUrl;
                            return wshly.utils.copyToClipboard(shortUrl);
                        })
                        .then(onCopied)
                        .catch(function() {
                            wshly.utils.copyToClipboard(url).then(onCopied);
                        });
                }
            } else {
                wshly.utils.copyToClipboard(url).then(onCopied);
            }
        },
        
        toggleShorten: function() {
            const $toggle = $('#shorten-toggle');
            const isChecked = $toggle.attr('aria-checked') === 'true';
            const newState = !isChecked;
            
            $toggle.attr('aria-checked', newState);
            $('#checkbox-unchecked').toggleClass('hidden', newState);
            $('#checkbox-checked').toggleClass('hidden', !newState);
        }
    },
    
    music: {
        audio: null,
        isPlaying: false,
        
        init: function(autoplay) {
            this.audio = new Audio('audio/bgm.mp3');
            this.audio.loop = true;
            this.audio.preload = 'metadata';
            if (autoplay === '1') {
                $('#sound-overlay').removeClass('hidden');
                $('#enable-sound').trigger('focus');
            }
        },
        
        toggle: function() {
            if (this.isPlaying) {
                this.audio.pause();
                $('#musicIcon').attr('src', 'svg/icon-play.svg');
            } else {
                this.audio.play();
                $('#musicIcon').attr('src', 'svg/icon-pause.svg');
            }
            this.isPlaying = !this.isPlaying;
        },
        
        enableFromOverlay: function() {
            $('#sound-overlay').addClass('hidden');
            this.toggle();
        }
    },
    
    ui: {
        isCollapsed: false,
        activeModal: null,
        
        openModal: function(modalId) {
            const $modal = $(modalId);
            $modal.removeClass('hidden');
            this.activeModal = modalId;
            $modal.find('button, a, [tabindex]:not([tabindex="-1"])').first().trigger('focus');
        },
        
        closeModal: function(modalId) {
            $(modalId).addClass('hidden');
            this.activeModal = null;
        },
        
        trapFocus: function(e) {
            if (!wshly.ui.activeModal) return;
            
            const $modal = $(wshly.ui.activeModal);
            const $focusable = $modal.find('button, a, [tabindex]:not([tabindex="-1"])');
            const $first = $focusable.first();
            const $last = $focusable.last();
            
            if (e.shiftKey && $(document.activeElement).is($first)) {
                e.preventDefault();
                $last.trigger('focus');
            } else if (!e.shiftKey && $(document.activeElement).is($last)) {
                e.preventDefault();
                $first.trigger('focus');
            }
        },
        
        applyCollapseState: function() {
            const $formPane = $('#form-pane');
            const $toggleBtn = $('#form-toggle');
            const $toggleIcon = $('#toggle-icon');
            const $previewArea = $('#preview-area');
            
            if (this.isCollapsed) {
                $formPane.addClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                $toggleBtn
                    .attr('aria-expanded', 'false')
                    .removeClass('absolute md:left-full')
                    .addClass('fixed bottom-[calc(100%+0.5rem)] md:bottom-auto md:left-0 md:top-1/2');
                $toggleIcon.addClass('rotate-180').removeClass('md:rotate-90').addClass('md:-rotate-90');
                $previewArea
                    .removeClass('md:left-80 bottom-[40vh]')
                    .addClass('md:left-0 bottom-0');
            } else {
                $formPane.removeClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                $toggleBtn
                    .attr('aria-expanded', 'true')
                    .removeClass('fixed bottom-[calc(100%+0.5rem)] md:bottom-auto md:left-0 md:top-1/2')
                    .addClass('absolute md:left-full');
                $toggleIcon.removeClass('rotate-180 md:-rotate-90').addClass('md:rotate-90');
                $previewArea
                    .removeClass('md:left-0 bottom-0')
                    .addClass('md:left-80 bottom-[40vh]');
            }
        },
        
        toggleForm: function() {
            const self = this;
            
            $('#form-toggle').on('click', function() {
                self.isCollapsed = !self.isCollapsed;
                self.applyCollapseState();
            });
        },

        populateMessages: function() {
            const dropdown = $('.pixel-dropdown[data-name="mainMessage"]');
            const dropdownList = dropdown.find('.pixel-dropdown-options');
            const hiddenInput = dropdown.find('input[type="hidden"]');
            const dropdownText = dropdown.find('.dropdown-text');
        
            dropdownList.empty(); // Clear existing options
        
            const messages = wshly.config.mainMessages;
            for (const key in messages) {
                const option = $(`
                    <div class="pixel-dropdown-option" data-value="${key}" tabindex="0">
                        <p>${messages[key]}</p>
                    </div>
                `);
                dropdownList.append(option);
            }
        
            // Set default value
            const defaultMessageKey = wshly.config.defaultMessage;
            const defaultMessageText = messages[defaultMessageKey];
            
            // Check if there's a value from URL params, otherwise use default
            const params = wshly.urlParams.parse();
            const initialMessageKey = params.mainMessage && wshly.config.mainMessages[params.mainMessage]
                ? params.mainMessage
                : defaultMessageKey;
            
            const initialMessageText = wshly.config.mainMessages[initialMessageKey];

            hiddenInput.val(initialMessageKey);
            dropdownText.text(initialMessageText);
            
        }
    },
    
    routing: {
        init: function() {
            const params = wshly.urlParams.parse();
            const hasCardParams = params.senderName || params.recipientName || params.mainMessage || params.customMessage;

            // View mode: hide form when card params exist OR f=1 is set
            if (hasCardParams || params.f === '1') {
                wshly.ui.isCollapsed = true;
                wshly.ui.applyCollapseState();
            }
        }
    },

    init: function() {
        const self = this;
        const params = this.urlParams.parse();

        this.theme.init();
        this.ui.populateMessages();
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

        $('#shorten-toggle, #shorten-label').on('click', function() {
            self.sharing.toggleShorten();
        });

        $('#shorten-toggle').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                self.sharing.toggleShorten();
            }
        });

        $('#musicToggle').on('click', function() {
            self.music.toggle();
        });

        $('#enable-sound').on('click', function() {
            self.music.enableFromOverlay();
        });

        $('#about-btn').on('click', function() {
            self.ui.openModal('#about-modal');
        });

        $('#close-about').on('click', function() {
            self.ui.closeModal('#about-modal');
        });

        $('#about-modal').on('click', function(e) {
            if (e.target === this) {
                self.ui.closeModal('#about-modal');
            }
        });

        $('#theme-toggle').on('click', function() {
            self.theme.toggle();
        });

        this.ui.toggleForm();

        // Initialize routing - this will handle form visibility based on route
        this.routing.init();

        // Show error modal if error param exists (this can be additional to route-based errors)
        if (params.error) {
            this.ui.openModal('#error-modal');
        }

        $('#close-error').on('click', function() {
            self.ui.closeModal('#error-modal');
        });

        $('#error-modal').on('click', function(e) {
            if (e.target === this) {
                self.ui.closeModal('#error-modal');
            }
        });

        // Keyboard: Escape closes modals, Tab traps focus
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && self.ui.activeModal) {
                self.ui.closeModal(self.ui.activeModal);
            }
            if (e.key === 'Tab' && self.ui.activeModal) {
                self.ui.trapFocus(e);
            }
        });

        $('#enable-sound').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                self.music.enableFromOverlay();
            }
        });
    }
};

