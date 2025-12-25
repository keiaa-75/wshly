const wshly = {
    config: {
        MAX_CHARS: 150,
        CHAR_WARNING_THRESHOLD: 20
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
                senderName: params.get('senderName'),
                recipientName: params.get('recipientName'),
                mainMessage: params.get('mainMessage'),
                customMessage: params.get('customMessage'),
                f: params.get('f'),
                m: params.get('m'),
                error: params.get('error')
            };
        },
        
        populateForm: function() {
            const params = this.parse();
            
            // Sanitize and validate - redirect on XSS detection
            if (!wshly.validation.sanitizeParams(params)) {
                window.location.href = '/?error=400';
                return;
            }
            
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
        },
        
        init: function() {
            this.update();
        }
    },
    
    validation: {
        limits: { senderName: 10, recipientName: 10, customMessage: 150 },
        xssPattern: /<|>|javascript:|on\w+\s*=/i,
        
        isSafe: function(value) {
            return !this.xssPattern.test(value);
        },
        
        sanitize: function(value, maxLen) {
            if (!value) return '';
            const trimmed = value.substring(0, maxLen);
            return this.isSafe(trimmed) ? trimmed : null;
        },
        
        sanitizeParams: function(params) {
            const fields = ['senderName', 'recipientName', 'customMessage'];
            for (const field of fields) {
                if (params[field]) {
                    const clean = this.sanitize(params[field], this.limits[field]);
                    if (clean === null) return false;
                    params[field] = clean;
                }
            }
            return true;
        },
        
        validateField: function(field) {
            const $field = $(field);
            const name = $field.attr('name');
            const value = $field.val();
            const maxLen = this.limits[name];
            const isRequired = $field.prop('required');
            const isEmpty = !value.trim();
            
            // Enforce max length
            if (maxLen && value.length > maxLen) {
                $field.val(value.substring(0, maxLen));
            }
            
            // Check XSS
            const hasXss = !this.isSafe(value);
            
            if ((isRequired && isEmpty) || hasXss) {
                $field.removeClass('border-pink-200').addClass('border-red-400 ring-1 ring-red-400');
                if (hasXss) $field.val('');
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
            $('#shorten-icon').attr('src', '/svg/icon-checkbox-' + (newState ? 'checked' : 'unchecked') + '.svg');
        }
    },
    
    music: {
        audio: null,
        isPlaying: false,
        
        init: function(autoplay) {
            this.audio = new Audio('/audio/bgm.mp3');
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
        isCollapsed: false,
        
        setFormVisibility: function(params) {
            if (params.f === '1') {
                this.isCollapsed = true;
                this.applyCollapseState();
            }
        },
        
        applyCollapseState: function() {
            const $formPane = $('#form-pane');
            const $toggleBtn = $('#form-toggle');
            const $toggleIcon = $('#toggle-icon');
            const $previewArea = $('#preview-area');
            
            if (this.isCollapsed) {
                $formPane.addClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                $toggleBtn.attr('aria-expanded', 'false');
                $toggleIcon.addClass('rotate-180').removeClass('md:rotate-90').addClass('md:-rotate-90');
                $previewArea
                    .removeClass('md:left-80 bottom-[420px]')
                    .addClass('md:left-0 bottom-0');
            } else {
                $formPane.removeClass('translate-y-full md:translate-y-0 md:-translate-x-full');
                $toggleBtn.attr('aria-expanded', 'true');
                $toggleIcon.removeClass('rotate-180 md:-rotate-90').addClass('md:rotate-90');
                $previewArea
                    .removeClass('md:left-0 bottom-0')
                    .addClass('md:left-80 bottom-[420px]');
            }
        },
        
        toggleForm: function() {
            const self = this;
            
            $('#form-toggle').on('click', function() {
                self.isCollapsed = !self.isCollapsed;
                self.applyCollapseState();
            });
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
        
        // Show error modal if error param exists
        if (params.error) {
            $('#error-modal').removeClass('hidden');
        }
        
        $('#close-error').on('click', function() {
            $('#error-modal').addClass('hidden');
        });
        
        $('#error-modal').on('click', function(e) {
            if (e.target === this) {
                $('#error-modal').addClass('hidden');
            }
        });
        
        // Keyboard: Escape closes modals, Enter/Space on sound overlay
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                $('#about-modal, #error-modal').addClass('hidden');
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

$(document).ready(function() {
    wshly.init();
});
