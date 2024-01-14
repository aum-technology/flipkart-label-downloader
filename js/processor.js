async function process() {

    try {
        chrome.storage.sync.get(['application-id', 'application-secret'], async function (items) {
            resetLoggers();
            if (!(items['application-id'] && items['application-secret'])) {
                alert("Flipkart Token Not Set!!!");
                chrome.windows.create({
                    url: "html/apikeys.html",
                    type: "panel",
                });
                return;
            }
            document.querySelector('.token-log').innerHTML = "Fetching Flipkart Token.....";
            access_token = await getBearerToken({ appID: items['application-id'], appSecret: items['application-secret'] });
            if (access_token == false) {
                document.querySelector('.token-log').innerHTML = document.querySelector('.token-log').innerHTML + "<br> Error while fetching token. Please check credentials and try again.";
                return;
            }
            document.querySelector('.gathering-shipments-log').innerHTML = "Fetching Shipments List As Per Filters!";
            let shipmentIds = await getShipmentIds();
            let downloadingType = document.querySelector('[name=download-mode]:checked') ? document.querySelector('[name=download-mode]:checked').value : null;
            switch (downloadingType) {
                case 'single-multi-merged':
                    if (!shipmentIds['single_shipments'].length) {
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Single Item Shipments Not Found";
                    }
                    if (!shipmentIds['multiple_shipments'].length) {
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Multi Item Shipments Not Found";
                    }
                    if (!(!shipmentIds['single_shipments'].length && !shipmentIds['multiple_shipments'].length)) {
                        generatePDF({ ids: [...shipmentIds['single_shipments'], ...shipmentIds['multiple_shipments']], name: 'single-multi-merged' });
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Single Shipments : " + shipmentIds['single_shipments'].length + "   Multi Shipments : " + shipmentIds['multiple_shipments'].length;
                    }
                    break;
                case 'single-multi-separated':
                    if (!shipmentIds['single_shipments'].length) {
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Single Item Shipments Not Found";
                    }
                    else {
                        generatePDF({ ids: shipmentIds['single_shipments'], name: 'single' });
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Single Shipments : " + shipmentIds['single_shipments'].length;
                    }
                    if (!shipmentIds['multiple_shipments'].length) {
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Multi Item Shipments Not Found";
                    }
                    else {
                        generatePDF({ ids: shipmentIds['multiple_shipments'], name: 'multi' });
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Single Shipments : " + shipmentIds['multiple_shipments'].length;
                    }
                    break;
                case 'single-only':
                    if (!shipmentIds['single_shipments'].length) {
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Single Item Shipments Not Found";
                    }
                    else {
                        generatePDF({ ids: shipmentIds['single_shipments'], name: 'single' });
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Single Shipments : " + shipmentIds['single_shipments'].length;
                    }
                    break;
                case 'multi-only':
                    if (!shipmentIds['multiple_shipments'].length) {
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Multi Item Shipments Not Found";
                    }
                    else {
                        generatePDF({ ids: shipmentIds['multiple_shipments'], name: 'multi' });
                        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Single Shipments : " + shipmentIds['multiple_shipments'].length;
                    }
                    break;
                default:
                    generatePDF({ ids: [...shipmentIds['single_shipments'], ...shipmentIds['multiple_shipments']], name: 'single-multi-merged' });
                    document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Single Shipments : " + shipmentIds['single_shipments'].length + "   Multi Shipments : " + shipmentIds['multiple_shipments'].length;
                    break;
            }
        });
    } catch (error) {
        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br>Fatal Error Occurred!!!!<br>" + error;
        alert('Error Occurred!!');
        document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br><br> You can email the screenshot of error or text of error to this email id : <b>contact.aumtechnolabs@gmail.com</b>"
        window.scrollTo(0, document.body.scrollHeight);
    }

}
async function generatePDF(params) {
    const arrayBuffer = await Promise.all(params.ids.map((item, index) => { return getPdf({ ids: [item], total: params.ids.length, current: (index + 1) }) }));
    let PDFDocument = PDFLib.PDFDocument;
    const arrayBufferPDFs = await Promise.all(arrayBuffer.map((item) => { return PDFDocument.load(item) }));
    let mergedFile = await PDFDocument.create();
    let tmp;
    let isCroppingEnabled = false;
    if (document.querySelector('[name=enable-cropping]:checked') && document.querySelector('[name=enable-cropping]:checked').value == "yes") {
        isCroppingEnabled = true;
        var topMargin = parseInt(document.querySelector('#top-margin') ? document.querySelector('#top-margin').value : 20);
        var bottomMargin = parseInt(document.querySelector('#bottom-margin') ? document.querySelector('#bottom-margin').value : 450);
        var leftMargin = parseInt(document.querySelector('#left-margin') ? document.querySelector('#left-margin').value : 175);
        var rightMargin = parseInt(document.querySelector('#right-margin') ? document.querySelector('#right-margin').value : 175);
    }
    document.querySelector('.general-log').innerHTML = document.querySelector('.general-log').innerHTML + "<br> Wait... Downloading Now...";
    arrayBufferPDFs.map(async (item, index) => {
        tmp = await mergedFile.copyPages(item, item.getPageIndices());
        document.querySelector('.pdf-merging-log').innerHTML = "Processing " + (index + 1) + " PDF(s) Out Of " + arrayBufferPDFs.length;
        tmp.forEach((page) => {
            if (isCroppingEnabled) {
                page.setCropBox(leftMargin, bottomMargin, page.getWidth() - rightMargin - leftMargin, page.getHeight() - topMargin - bottomMargin);
            }
            mergedFile.addPage(page);
        });
    });

    window.setTimeout(async () => {
        downloadToBrowser(await mergedFile.save({ addDefaultPage: false }), params.name + ".pdf", 'application/pdf');
    }, 2000);

}
function resetLoggers() {
    document.querySelector('.token-log').innerHTML = "";
    document.querySelector('.gathering-shipments-log').innerHTML = "";
    document.querySelector('.pdf-merging-log').innerHTML = "";
    document.querySelector('.pdf-request-log').innerHTML = "";
    document.querySelector('.general-log').innerHTML = "";
}