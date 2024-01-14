document.addEventListener('DOMContentLoaded', async function () {
    document.querySelector('#btn-set-api-keys').onclick = function () {
        chrome.storage.sync.set({
            'application-id': document.getElementById('application-id').value,
            'application-secret': document.getElementById('application-secret').value
        });
        alert('Saved Successfully');
        window.close();
    }
});