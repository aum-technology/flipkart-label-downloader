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

document.querySelector("#grant_access").onclick = () => {
    const clientCode = document.querySelector("#third-party-client-code").value.trim();
    const applicationId = document.querySelector("#third-party-application-id").value.trim();
    if (clientCode == "" || applicationId == "") {
        alert("Client Code or Apllication Id can't be empty!");
        return;
    }
    chrome.tabs.create({ url: `https://api.flipkart.net/oauth-service/oauth/authorize?client_id=${applicationId}&redirect_uri=https://fld.aum.technology/flipkart-label-downloader.php&response_type=code&scope=Seller_Api&state=${clientCode}` });
};

document.querySelector("#get_token").onclick = () => {
    const clientCode = document.querySelector("#third-party-client-code").value.trim();
    const applicationId = document.querySelector("#third-party-application-id").value.trim();
    if (clientCode == "" || applicationId == "") {
        alert("Client Code or Apllication Id can't be empty!");
        return;
    }
    fetch(`https://fld.aum.technology/get-token-data-for-flipkart-label-downloader.php?state=${clientCode}&client_id=${applicationId}`).then(r => r.json())
        .then((r) => {
            if (r && Object.keys(r).length && !r.hasOwnProperty('error')) {
                r.client_code = clientCode;
                r.application_id = applicationId;
                chrome.storage.sync.set({ third_party_token_data: r });
                alert("Successfully Saved Token Data!!");
                chrome.storage.sync.set({ current_api_method: 'third-party' });
                window.close();
            } else {
                alert("Error While Saving Token Data!! Make Sure You Have Granted Access. Server Message : " + (r.error_description ?? "Authorization Pending!"));
            }
        }).catch(e => {
            alert(e);
        })
};
document.querySelector("#disable_third_party").onclick = () => {
    let result = confirm("Are you sure to disable Third Party API Method?");
    if (!result) {
        return;
    }
    chrome.storage.sync.set({ current_api_method: 'self-access' });
    alert('Third Party API Settings Disabled!');
    window.close();
}