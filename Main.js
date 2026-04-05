// --- 1. THE BRAIN (Global State) ---
// This keeps track of our traitors and who we've sent to the graveyard
const state = {
    traitors: [],
    dismissed: new Set()
};

// --- 2. THE CLEANING CREW (Logic Engine) ---
// This object handles all the scrubbing and math so the rest of the code stays clean
const Processor = {
    // takes followersData and scrubs it of any extra information not needed
    cleanFollowers(data) {
        return data.map(item => item.string_list_data[0].value);
    },

    // takes followingData and scrubs it (handles Meta's weird title vs value flip)
    cleanFollowing(data) {
        return data.relationships_following.map(item => {
            // If the title actually has the username, use it. 
            // Otherwise, dig into the array like we did for followers.
            return (item.title && item.title !== "") ? item.title : item.string_list_data[0].value;
        });
    },

    // The O(N) showdown: compares lists to see who isn't following back
    getTraitors(followers, following) {
        const followerSet = new Set(followers);
        return following.filter(user => !followerSet.has(user));
    }
};

// --- 3. THE PAINTER (UI Manager) ---
// This handles all the HTML injection and button clicking
const UIManager = {
    // Wipes the lists clean and redraws everything from the current state
    render() {
        const listContainer = document.getElementById('traitor-list');
        const dismissedContainer = document.getElementById('dismissed-list');

        // Clear out any old data before we redraw
        listContainer.innerHTML = '';
        dismissedContainer.innerHTML = '';

        // Loop through our traitors and decide if they go to the Hit List or the Graveyard
        state.traitors.forEach(username => {
            if (state.dismissed.has(username)) {
                this.createListItem(username, dismissedContainer, true);
            } else {
                this.createListItem(username, listContainer, false);
            }
        });
    },

    // Builds the actual HTML bullet point with the link and the toggle button
    createListItem(username, container, isDismissed) {
        const li = document.createElement('li');
        
        // Add the link to their profile and the specific button text
        li.innerHTML = `
            <a href="https://instagram.com/${username}" target="_blank" rel="noopener noreferrer">${username}</a>
            <button class="btn">${isDismissed ? 'Restore' : 'Dismiss'}</button>
        `;

        // When the button is clicked, we move them and rerender. Batabing bataboom.
        li.querySelector('button').onclick = () => {
            this.toggleUser(username);
        };

        container.appendChild(li);
    },

    // Moves a user between the "active" list and the "dismissed" set
    toggleUser(username) {
        if (state.dismissed.has(username)) {
            state.dismissed.delete(username);
        } else {
            state.dismissed.add(username);
        }
        this.render(); // Redraw the UI so the change shows up instantly
    }
};

// --- 4. THE BOSS (Main Controller) ---
// goes to html and looks for 'zip-upload' so we can process it here
document.getElementById('zip-upload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        console.log("No File Selected!");
        return;
    }

    try {
        // Calls JSZIP load function and starts hunting for data
        const zip = await JSZip.loadAsync(file);
        console.log("Zip Loaded: Hunting for file paths, WE GOT THIS!");
        
        // defines the paths of where the info is inside your zip folders
        const folPath = "connections/followers_and_following/followers_1.json";
        const fngPath = "connections/followers_and_following/following.json";

        // tells jszip to use the paths and read them to gather the data strings
        const [folRes, fngRes] = await Promise.all([
            zip.file(folPath).async("string"),
            zip.file(fngPath).async("string")
        ]);

        // Convert the raw text into actual JavaScript Objects and scrub 'em
        const followers = Processor.cleanFollowers(JSON.parse(folRes));
        const following = Processor.cleanFollowing(JSON.parse(fngRes));
        
        // Run the comparison logic and save the result to our State
        state.traitors = Processor.getTraitors(followers, following);
        
        console.log("WE GOT THE DATA. Handing off to the UI...");
        
        // Kick off the UI to display the Hit List
        UIManager.render();

    } catch (err) {
        // This catches any actual corrupted zip errors or missing files
        console.error("Initialization Failed:", err);
        alert("Something went wrong! Make sure you uploaded the right Instagram Zip.");
    }
});

// Listen for the file change and update the UI text
document.getElementById('zip-upload').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "No file chosen";
    document.getElementById('file-name').textContent = `Selected: ${fileName}`;
});