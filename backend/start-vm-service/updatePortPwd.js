const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');
const firebaseConfig = require('./firebaseConfig'); // Import the config

firebaseConfig.serviceAccountKeyPath = "/home/christian/bradensbay-1720893101514-firebase-adminsdk-5czfh-6849539d64.json";
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

function updateUserData(uid, password, port) {
    const userRef = ref(database, 'users/' + uid);
    return update(userRef, {
        password: password,
        port: port
    });
}

function main() {
    const args = process.argv.slice(2);
    if (args.length !== 3) {
        console.log("Usage: node updateUser.js <uid> <password> <port>");
        process.exit(1);
    }

    const [uid, password, port] = args;

    updateUserData(uid, password, port)
        .then(() => {
            console.log(`Successfully updated user ${uid}`);
            return 0;
        })
        .catch((error) => {
            console.error(`Error updating user: ${error}`);
        });
}

main();