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

    let outputElement = document.getElementById("output");
    let outputContainerElement = document.getElementById("outputContainer");
    let outputHTMLString = "";
    let deck = await readFileAsync(dekFile);

    let oParser = new DOMParser();
    let oDOM = oParser.parseFromString(deck, "application/xml");
    // print the name of the root element or error message
    console.log(oDOM.documentElement.nodeName == "parsererror" ? "error while parsing" : oDOM.documentElement.nodeName);

    let cardXMLArray = oDOM.childNodes[0].children;
    let cards = [];
    let deckIsLegal = true;

    for (let i=0; i<cardXMLArray.length; i++){
        if (cardXMLArray[i].attributes.Name){
            cards.push({cardName: cardXMLArray[i].attributes.Name.textContent});
        }
    }

    for (let i=0; i<cards.length; i++){
        let scryfallData = await fetch('https://api.scryfall.com/cards/named?exact=' + cards[i].cardName, {mode: 'cors'}).then(function(response){return response.json();});
        if (scryfallData.code == "not_found"){
            outputHTMLString += '<span style="color:red">ERROR</span> ' + cards[i].cardName + " not found in Scryfall database<br>";
            deckIsLegal = false;
        } else {
            cards[i].scryfallData = scryfallData;
            if (cards[i].scryfallData.legalities.penny == "legal"){
                outputHTMLString += '<span style="color:green">✔ </span>';
            } else {
                outputHTMLString += '<span style="color:red">✖ </span>';
                deckIsLegal = false;
            }
            outputHTMLString += cards[i].cardName + "<br>";
        }
        outputElement.innerHTML = outputHTMLString;
        outputContainerElement.scrollTop = outputContainerElement.scrollHeight;
        sleep(50);
    }

    // Confirm legality once all cards hve been checked
    outputHTMLString += "<br>Uploaded deck is ";
    if (deckIsLegal){
        outputHTMLString += '<span style="color:green">legal</span>';
    } else {
        outputHTMLString += '<span style="color:red">not legal</span>';
    }
    outputHTMLString += " in Penny Dreadful";
    outputElement.innerHTML = outputHTMLString;
    outputContainerElement.scrollTop = outputContainerElement.scrollHeight;
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