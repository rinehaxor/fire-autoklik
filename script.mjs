import fs from 'fs';
import fetch from 'node-fetch';

const sleep = (ms) => {
   return new Promise((resolve) => setTimeout(resolve, ms));
};

const readAuthTokens = (filePath) => {
   return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
         if (err) {
            reject(err);
         } else {
            const tokens = data
               .split('\n')
               .map((line) => line.trim())
               .filter((line) => line !== '');
            resolve(tokens);
         }
      });
   });
};

const sendClickRequest = async (urlClick, headersClick, clicks) => {
   const updatedClicks = clicks + 300;
   const dataClick = JSON.stringify({ clicks: updatedClicks });

   const response = await fetch(urlClick, {
      method: 'POST',
      headers: headersClick,
      body: dataClick,
   });

   const responseText = await response.text();
   console.log('Response from /api/click:', responseText);

   // Jeda 40 detik sebelum melanjutkan
   await sleep(40 * 1000);
};

const executeRequests = async (auth) => {
   const urlLoadState = 'https://app2.firecoin.app/api/loadState';
   const urlClick = 'https://app2.firecoin.app/api/click';

   const headersLoadState = {
      'Content-Type': 'text/plain;charset=UTF-8',
      'Sec-CH-UA': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'Sec-CH-UA-Mobile': '?0',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Authorization: `tma ${auth}`,
      Baggage: 'sentry-environment=production,sentry-release=c733c831c0224730a949ea1d5b8ad2fa,sentry-public_key=b0fc3814fb3f0f1e101c09858d373091,sentry-trace_id=6ade0e7df7344e1fa714fb68aea6a717',
      'Sentry-Trace': '6ade0e7df7344e1fa714fb68aea6a717-bd1d991b8b219f29',
      'Sec-CH-UA-Platform': '"Windows"',
      Accept: '*/*',
      Origin: 'https://app2.firecoin.app',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      Referer: 'https://app2.firecoin.app/',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      Priority: 'u=1, i',
   };

   const headersClick = {
      'Content-Type': 'text/plain;charset=UTF-8',
      'Sec-CH-UA': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'Sec-CH-UA-Mobile': '?0',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Authorization: `tma ${auth}`,
      Baggage: 'sentry-environment=production,sentry-release=c733c831c0224730a949ea1d5b8ad2fa,sentry-public_key=b0fc3814fb3f0f1e101c09858d373091,sentry-trace_id=6ade0e7df7344e1fa714fb68aea6a717',
      'Sentry-Trace': '6ade0e7df7344e1fa714fb68aea6a717-bd1d991b8b219f29',
      'Sec-CH-UA-Platform': '"Windows"',
      Accept: '*/*',
      Origin: 'https://app2.firecoin.app',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      Referer: 'https://app2.firecoin.app/',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      Priority: 'u=1, i',
   };

   const dataLoadState = {};

   try {
      const responseLoadState = await fetch(urlLoadState, {
         method: 'POST',
         headers: headersLoadState,
         body: JSON.stringify(dataLoadState),
      });

      const responseJson = await responseLoadState.json();

      if ('wood' in responseJson && 'count' in responseJson.wood) {
         const energyCount = responseJson.wood.count;
         console.log('Jumlah Energi:', energyCount);

         if (energyCount < 100) {
            console.log('Energi di bawah 100, beralih ke akun berikutnya...');
            return false; // Return false to indicate switching account
         }
      } else {
         console.log('Response does not contain energy count');
      }

      if ('clicks' in responseJson) {
         console.log('Jumlah Klik:', responseJson.clicks);
         await sendClickRequest(urlClick, headersClick, responseJson.clicks);
         return true; // Return true to indicate continue with current account
      } else {
         throw new Error('Response does not contain clicks');
      }
   } catch (error) {
      console.error('Error:', error);
      return false; // Return false to indicate switching account on error
   }
};

const main = async () => {
   try {
      const authTokens = await readAuthTokens('auth_tokens.txt');
      let currentIndex = 0;

      while (true) {
         let allBelowThreshold = true;

         for (let i = 0; i < authTokens.length; i++) {
            const currentAuth = authTokens[currentIndex];
            console.log(`Checking account ${currentIndex + 1}`);
            const continueWithCurrentAccount = await executeRequests(currentAuth);

            if (continueWithCurrentAccount) {
               allBelowThreshold = false;
               break;
            }

            currentIndex = (currentIndex + 1) % authTokens.length;
            console.log(`Beralih ke akun berikutnya: ${currentIndex + 1}`);
         }

         if (allBelowThreshold) {
            console.log('Semua akun memiliki energi di bawah 100, tidur selama 10 menit...');
            await sleep(10 * 60 * 1000); // Tidur selama 10 menit sebelum memulai siklus lagi
         }
      }
   } catch (error) {
      console.error('Error:', error);
   }
};

main();
