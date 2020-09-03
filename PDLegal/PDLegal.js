function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
        resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(file);
    })
}

async function checkLegality(dekFile){

    // First, let's give the user some feedback that we are working on their request.
    document.getElementById("output").innerHTML = "Please wait while card legality data is fetched from the Scryfall API";
    
    let outputHTMLString = "";
    let deck = await readFileAsync(dekFile);

    // let reader = new FileReader();
    // reader.onload = function(e) {
    //     deck = e.target.result;
    //     console.log(deck);
    // };
    // reader.readAsText(dekFile);

    let oParser = new DOMParser();
    let oDOM = oParser.parseFromString(deck, "application/xml");
    // print the name of the root element or error message
    console.log(oDOM.documentElement.nodeName == "parsererror" ? "error while parsing" : oDOM.documentElement.nodeName);

    let cardXMLArray = oDOM.childNodes[0].children;
    let cards = [];

    for (let i=2; i<cardXMLArray.length; i++){
        cards.push({cardName: cardXMLArray[i].attributes.Name.textContent});
    }

    for (let i=0; i<cards.length; i++){
        let scryfallData = await fetch('https://api.scryfall.com/cards/named?exact=' + cards[i].cardName, {mode: 'cors'}).then(function(response){return response.json();});
        if (scryfallData.code == "not_found"){
            outputHTMLString += "ERROR: " + cards[i].cardName + " not found<br>";
        } else {
            cards[i].scryfallData = scryfallData;
            if (cards[i].scryfallData.legalities.penny == "legal"){
                outputHTMLString += '<span style="color:green">';
            } else {
                outputHTMLString += '<span style="color:red">';
            }
            outputHTMLString += cards[i].cardName + "</span><br>";
        } 
        document.getElementById("output").innerHTML = outputHTMLString;
        sleep(50);
    }
}

document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
    const dropZoneElement = inputElement.closest(".drop-zone");
    
    dropZoneElement.addEventListener("click", (e) => {
        inputElement.click();
    });
    
    inputElement.addEventListener("change", (e) => {
        if (inputElement.files.length) {
            console.log("File dropped");
            checkLegality(inputElement.files[0]);
        }
    });
    
    dropZoneElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZoneElement.classList.add("drop-zone--over");
    });
    
    ["dragleave", "dragend"].forEach((type) => {
        dropZoneElement.addEventListener(type, (e) => {
            dropZoneElement.classList.remove("drop-zone--over");
        });
    });
    
    dropZoneElement.addEventListener("drop", (e) => {
        e.preventDefault();
    
        if (e.dataTransfer.files.length) {
            inputElement.files = e.dataTransfer.files;
            checkLegality(inputElement.files[0]);
        }
    
        dropZoneElement.classList.remove("drop-zone--over");
    });
});