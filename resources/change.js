let loadFunction = function() {
    "use strict";
    function randomColors() {
        return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }
    let paragraph = document.querySelector("button");
    let changeParagraph = function() {
        document.body.style.background = randomColors();
    };
    paragraph.addEventListener("click", changeParagraph);
    
    let myImage = document.querySelector("img");
    let changePic = function() {
        fetch("/resources/ghostie.png").then(function(response) {
            return response.blob();
        }).then(function(myBlob) {
            let objectURL = URL.createObjectURL(myBlob);
            myImage.src = objectURL;
        });
    };
    myImage.addEventListener("click", changePic);
    
    let yourName = document.querySelector("h1");
    let changeHeader = function() {
        yourName.innerHTML = "#365";
    };
    yourName.addEventListener("click", changeHeader);
    
    
};           
window.onload = loadFunction;