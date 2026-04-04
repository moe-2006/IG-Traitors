
// goes to html and looks for 'zip-upload' so we can process it here
const fileInput = document.getElementById('zip-upload');

// Checks if an event happens, when it does, calls JSZIP load function and batabing bataboom
fileInput.addEventListener('change', function(event){
    const myZipFile = event.target.files[0];

    if(!myZipFile){
        console.log("No File Selected!");
        return;
    }



    JSZip.loadAsync(myZipFile).then(function(zip) {
        console.log("Zip Loaded: Hunting for file paths, WE GOT THIS!");

        // defines the path of where the info is inside your zip folders
        const followersPath = "connections/followers_and_following/followers_1.json";
        const followingPath = "connections/followers_and_following/following.json";

        // tells jszip to use the paths and read them to gather the data
        const followersTextPromise = zip.file(followersPath).async("string");
        const followingTextPromise = zip.file(followingPath).async("string");

        

        // 3. Wait for BOTH files to finish reading
        Promise.all([followersTextPromise, followingTextPromise]).then(function(results) {
            
            // results[0] is followers, results[1] is following
            // 4. Convert the raw text into actual JavaScript Objects
            const followersData = JSON.parse(results[0]);
            const followingData = JSON.parse(results[1]);

            // takes followersData and scrubs it of any extra information not needed
            const cleanFollowers = followersData.map(function(item) {
            return item.string_list_data[0].value;
            });

            // takes followingData and scrubs it of any extra information not needed
            const cleanFollowing = followingData.relationships_following.map(function(item) {
            // If the title actually has the username, use it. 
            // Otherwise, dig into the array like we did for followers.
            if (item.title && item.title !== "") {
              return item.title;
             } else {
            return item.string_list_data[0].value;
              }
            });

            console.log("WE GOT THE DATA:");
            
            const traitors = [];

            const truthTable = new Set(cleanFollowers);
            for(const following of cleanFollowing){
                if(!truthTable.has(following)){
                    traitors.push(following)
                }
            }

            console.log(traitors)
            console.log(cleanFollowers)
            console.log(cleanFollowing)
    


        }).catch(function(err) {
            console.error("Could not find or parse the JSON files. Check the file paths!", err);
        });



    }).catch(function(error) {
        // This catches any actual corrupted zip errors
        console.error("Failed to read zip:", error);
    });
});