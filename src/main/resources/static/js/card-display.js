function copyCardLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalText = btn.textContent;
        btn.textContent = 'COPIED!';
        btn.className = btn.className.replace('from-cherry-500 to-cherry-600', 'from-green-500 to-green-600');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.className = btn.className.replace('from-green-500 to-green-600', 'from-cherry-500 to-cherry-600');
        }, 2000);
    });
}
