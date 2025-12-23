$(document).ready(function() {
    // Real-time preview update
    function updatePreview() {
        const senderName = $('input[name="senderName"]').val() || 'You';
        const recipientName = $('input[name="recipientName"]').val() || 'Someone Special';
        const mainMessage = $('select[name="mainMessage"] option:selected').text() || 'Merry Christmas!';
        const customMessage = $('textarea[name="customMessage"]').val();
        
        let previewHtml = `
            <h3 class="font-bungee text-xl text-pink-600">${mainMessage}</h3>
            <p class="text-gray-600">To: <span class="font-semibold">${recipientName}</span></p>
        `;
        
        if (customMessage.trim()) {
            previewHtml += `<p class="text-gray-500 italic">${customMessage}</p>`;
        }
        
        previewHtml += `<p class="text-gray-600">From: <span class="font-semibold">${senderName}</span></p>`;
        
        $('#card-preview').html(previewHtml);
    }
    
    // Visual validation
    function validateField(field) {
        const $field = $(field);
        const isRequired = $field.prop('required');
        const isEmpty = !$field.val().trim();
        
        if (isRequired && isEmpty) {
            $field.removeClass('border-pink-200').addClass('border-red-400 ring-1 ring-red-400');
        } else {
            $field.removeClass('border-red-400 ring-1 ring-red-400').addClass('border-pink-200');
        }
    }
    
    // Character counter for custom message
    function updateCharCounter() {
        const $textarea = $('textarea[name="customMessage"]');
        const current = $textarea.val().length;
        const max = 150;
        const remaining = max - current;
        
        let $counter = $('#char-counter');
        if ($counter.length === 0) {
            $counter = $('<div id="char-counter" class="text-xs text-right mt-1"></div>');
            $textarea.after($counter);
        }
        
        $counter.text(`${remaining} characters remaining`);
        $counter.toggleClass('text-red-500', remaining < 20);
        $counter.toggleClass('text-gray-500', remaining >= 20);
    }
    
    // Event listeners
    $('input, select, textarea').on('input change', function() {
        updatePreview();
        validateField(this);
        if ($(this).attr('name') === 'customMessage') {
            updateCharCounter();
        }
    });
    
    // Copy shareable link
    $('#copyLink').click(function() {
        const params = new URLSearchParams();
        params.set('senderName', $('input[name="senderName"]').val());
        params.set('recipientName', $('input[name="recipientName"]').val());
        params.set('mainMessage', $('select[name="mainMessage"]').val());
        const customMsg = $('textarea[name="customMessage"]').val();
        if (customMsg.trim()) {
            params.set('customMessage', customMsg);
        }
        
        const shareableUrl = `${window.location.origin}/card?${params.toString()}`;
        
        navigator.clipboard.writeText(shareableUrl).then(() => {
            const $btn = $(this);
            const originalText = $btn.text();
            $btn.text('Copied!').removeClass('from-cherry-500 to-cherry-600').addClass('from-green-500 to-green-600');
            setTimeout(() => {
                $btn.text(originalText).removeClass('from-green-500 to-green-600').addClass('from-cherry-500 to-cherry-600');
            }, 2000);
        });
    });
    
    // Initialize
    updatePreview();
    updateCharCounter();
});
