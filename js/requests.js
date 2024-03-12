// async function getBearerToken(params) {
//     var appID = params.appID;
//     var appSecret = params.appSecret;
//     var myHeaders = new Headers();
//     myHeaders.append("Authorization", "Basic " + btoa(appID + ":" + appSecret));
//     var requestOptions = {
//         method: 'GET',
//         headers: myHeaders,
//         credentials: 'omit'
//     };
//     return fetch("https://seller.api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api", requestOptions)
//         .then(response => response.json())
//         .then(result => {
//             if (typeof result == "object" && result.error == undefined) {
//                 return result.access_token;
//             } else {
//                 return false;
//             }
//         })
//         .catch(error => { console.log(error); return false; });
// }
async function getShipments(params) {
    var requestOptions = {
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + access_token,
            "Accept": 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': "*",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params.params),
        mode: 'cors',
        cache: 'no-cache'
    };
    return fetch("https://api.flipkart.net/sellers/v3/shipments/filter", requestOptions)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                if (response.status == 500) {
                    return { "resend": true };
                } else {
                    return response.json();
                }
            }
        })
        .then(result => {
            if (typeof result == "object" && result.error == undefined && result.shipments && result.shipments.length) {
                return result;
            } else {
                if (result.resend == true) {
                    return getShipments(params);
                } else {
                    return [];
                }
            }
        })
        .catch(error => { console.log(error); return []; });
}
async function getNextShipments(params) {
    var requestOptions = {
        method: 'GET',
        headers: {
            "Authorization": "Bearer " + access_token,
            "Accept": 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': "*",
        },
        mode: 'cors',
        cache: 'no-cache'
    };
    return fetch("https://api.flipkart.net/sellers" + params.nextPageUrl, requestOptions)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                if (response.status == 500) {
                    return { "resend": true };
                } else {
                    return response.json();
                }
            }
        })
        .then(result => {
            if (typeof result == "object" && result.error == undefined && result.shipments && result.shipments.length) {
                return result;
            } else {
                if (result.resend == true) {
                    return getNextShipments(params);
                } else {
                    return [];
                }
            }
        })
        .catch(error => { console.log(error); return []; });
}
async function getShipmentIds() {
    let states = [];
    let statesElem = document.querySelectorAll('[name="shipment-states"]:checked');
    if (statesElem.length) {
        statesElem.forEach(item => states.push(item.value));
    } else {
        alert("No Shipment State is Selected!! Please Select Shipment State.");
        return { "single_shipments": [], 'multiple_shipments': [] };
    }
    let fromDate = document.querySelector('#from-date').value;
    fromDate = new Date(fromDate);
    fromDate.setDate(fromDate.getDate() - 1);
    fromDate = getCustomizedDate({ date: fromDate });
    let toDate = document.querySelector('#to-date').value;
    if (new Date(fromDate) > new Date(toDate)) {
        alert(`From Date Can't be greater than New Date`);
        return { "single_shipments": [], 'multiple_shipments': [] };
    }
    let ignoreDate = (document.querySelector('[name=ignore-date]:checked') && document.querySelector('[name=ignore-date]:checked').value == "yes") ? true : false;
    let params = {};
    params.filter = {};
    params.filter.type = "preDispatch";
    params.filter.states = states;
    if (!ignoreDate) {
        params.filter.dispatchByDate = {
            "from": fromDate + "T18:30:00.000Z",
            "to": toDate + "T18:29:59.000Z"
        };
    }
    let shipments = await getShipments({ params: params });
    let hasMore = false;
    let nextPageUrl = '';
    let shipmentCollection = [];
    let nextShipments;
    if (shipments.shipments && shipments.shipments.length) {
        hasMore = shipments.hasMore;
        nextPageUrl = shipments.nextPageUrl;
        shipmentCollection = shipments.shipments;
        while (hasMore) {
            nextShipments = await getNextShipments({ nextPageUrl: nextPageUrl });
            if (nextShipments.shipments && nextShipments.shipments.length) {
                hasMore = nextShipments.hasMore;
                nextPageUrl = nextShipments.nextPageUrl;
                shipmentCollection = [...shipmentCollection, ...nextShipments.shipments];
            }
        }
        return parseShipments(shipmentCollection);
    }
    else {
        return { "single_shipments": [], 'multiple_shipments': [] };
    }
}
function parseShipments(shipmentsArray) {
    let singleShipments = [];
    let multiShipments = [];
    shipmentsArray.forEach((shipment) => {
        if (shipment.orderItems.length > 1 || (shipment.orderItems.length == 1 && parseInt(shipment.orderItems[0].quantity) > 1)) {
            multiShipments.push(shipment.shipmentId);
        } else {
            singleShipments.push({ id: shipment.shipmentId, sku: shipment.orderItems[0].sku });
        }
    });
    singleShipments.sort((a, b) => ((a.sku.toLowerCase() > b.sku.toLowerCase()) ? 1 : -1));
    let finalSingleShipments = singleShipments.map((item) => { return item.id });
    return { "single_shipments": finalSingleShipments, 'multiple_shipments': multiShipments };
}
async function getPdf(params) {
    document.querySelector('.pdf-request-log').innerHTML = "Sent " + params.current + " PDF(s) For Downloading Out Of " + params.total;
    var requestOptions = {
        method: 'GET',
        headers: {
            "Authorization": "Bearer " + access_token,
            "Accept": '*/*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': "*"
        },
        mode: 'cors',
        cache: "no-cache"
    };
    return fetch("https://api.flipkart.net/sellers/v3/shipments/" + params.ids.toString() + "/labels", requestOptions)
        .then(response => {
            if (response.ok) {
                return response.arrayBuffer();
            } else {
                if (response.status == 500) {
                    return { "resend": true };
                } else {
                    return new ArrayBuffer();
                }
            }
        })
        .then(result => {
            if (result.resend == true) {
                return getPdf(params);
            } else {
                return result;
            }
        })
        .catch(e => { console.log('error', e); return new ArrayBuffer() });
}
function downloadToBrowser(file, filename, type) {
    const link = document.createElement('a');
    link.download = filename;
    let binaryData = [];
    binaryData.push(file);
    link.href = URL.createObjectURL(new Blob(binaryData, { type: type }))
    link.click();
}