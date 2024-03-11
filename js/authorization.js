async function refreshAccessTokenFromRefreshToken() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('third_party_token_data', (data) => {
            const thirdPartyTokenData = data.third_party_token_data ?? {};
            if (Object.keys(thirdPartyTokenData).length) {
                fetch(`https://fld.aum.technology/get-access-token-from-refresh-token.php?state=${thirdPartyTokenData.client_code}&code=${thirdPartyTokenData.application_id}`)
                    .then(r => r.json())
                    .then(r => {
                        if (!r.error) {
                            r.client_id = thirdPartyTokenData.client_id;
                            r.application_id = thirdPartyTokenData.application_id;
                            chrome.storage.sync.set({ third_party_token_data: r }, () => { resolve(true) });
                        } else {
                            reject(false);
                        }
                    });
            }
        });
    })
}
async function getAccessToken(params) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('current_api_method', (data) => {
            const currentApiMethod = data.current_api_method;
            if (currentApiMethod == 'third-party') {
                chrome.storage.sync.get('third_party_token_data', (data) => {
                    const thirdPartyTokenData = data.third_party_token_data;
                    if (Object.keys(thirdPartyTokenData).length) {
                        resolve(thirdPartyTokenData.access_token);
                    } else {
                        resolve(false);
                    }
                })
            } else {
                var appID = params.appID;
                var appSecret = params.appSecret;
                var myHeaders = new Headers();
                myHeaders.append("Authorization", "Basic " + btoa(appID + ":" + appSecret));
                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders,
                    credentials: 'omit'
                };
                return fetch("https://seller.api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api", requestOptions)
                    .then(response => response.json())
                    .then(result => {
                        if (typeof result == "object" && result.error == undefined) {
                            resolve(result.access_token);
                        } else {
                            resolve(false);
                        }
                    })
                    .catch(error => { console.log(error); resolve(false); });
            }
        });
    });
}