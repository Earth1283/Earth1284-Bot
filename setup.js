const https = require('https');
const fs = require('fs');

const files = [
  {
    url: 'https://raw.githubusercontent.com/Earth1283/Earth1284-Bot/main/config.json',
    filename: 'config.json'
  },
  {
    url: 'https://raw.githubusercontent.com/Earth1283/Earth1284-Bot/main/index.js',
    filename: 'index.js'
  },
  {
    url: 'https://raw.githubusercontent.com/Earth1283/Earth1284-Bot/main/post-download.txt',
    filename: 'post-download.txt'
  }
];

const asciiArt1 = `
 __  __           _        ____          
|  \\/  | __ _  __| | ___  | __ ) _   _ _ 
| |\\/| |/ _\` |/ _\` |/ _ \\ |  _ \\| | | (_)
| |  | | (_| | (_| |  __/ | |_) | |_| |_ 
|_|  |_|\\__,_|\\__,_|\\___| |____/ \\__, (_)
                                 |___/   
 _____           _   _     _ ____  ___ _____ 
| ____|__ _ _ __| |_| |__ / |___ \\( _ )___ / 
|  _| / _\` | '__| __| '_ \\| | __) / _ \\ |_ \\ 
| |__| (_| | |  | |_| | | | |/ __/ (_) |__) |
|_____\\__,_|_|   \\__|_| |_|_|_____\\___/____/ 
`;

const asciiArt2 = `
 ___ __  __ ____   ___  ____ _____  _    _   _ _____ _ 
|_ _|  \\/  |  _ \\ / _ \\|  _ \\_   _|/ \\  | \\ | |_   _| |
 | || |\\/| | |_) | | | | |_) || | / _ \\ |  \\| | | | | |
 | || |  | |  __/| |_| |  _ < | |/ ___ \\| |\\  | | | |_|
|___|_|  |_|_|    \\___/|_| \\_\\|_/_/   \\_\\_| \\_| |_| (_)
Please read post-download.txt!!!
`;

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(`Failed to download ${filename}: Status ${response.statusCode}`);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => reject(`Error downloading ${filename}: ${err.message}`));
    });
  });
}

(async () => {
  try {
    for (const file of files) {
      await downloadFile(file.url, file.filename);
    }
    console.log(asciiArt1);
    console.log(asciiArt2);
  } catch (err) {
    console.error(err);
  }
})();