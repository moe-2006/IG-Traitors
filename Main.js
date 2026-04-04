const fileInput = document.getElementsById('zip-upload');

fileInput.addEventListener('change', function(event) {
    const myZipFile = event.target.files[0];

    JSZip.loadAsync(myZipFile).then(function(zip) {
        console.log(zip);
    })
});