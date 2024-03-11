document.addEventListener('DOMContentLoaded', async function () {
    // let date = getCustomizedDate({ date: new Date() });
    document.getElementById("from-date").value = getCustomizedDate({ date: new Date() });
    document.getElementById("to-date").value = getCustomizedDate({ date: new Date(Date.now() + (3600 * 1000 * 24)) });
    document.getElementById('download-form').onsubmit = function () {
        event.preventDefault();
        process();
    }
    document.getElementById('set-api-keys').onclick = function () {
        window.open('../html/apikeys.html');
    }
});
