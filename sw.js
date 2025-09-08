const CACHE_NAME = 'sheakmeng-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/utils/fileUtils.ts',
  '/services/geminiService.ts',
  '/components/Header.tsx',
  '/components/Tabs.tsx',
  '/components/LoadingSpinner.tsx',
  '/components/ImageUpload.tsx',
  '/components/ImageToPrompt.tsx',
  '/components/PromptToImage.tsx',
  '/components/ImageToVideo.tsx',
  '/components/LanguageSwitcher.tsx',
  '/components/VideoUpload.tsx',
  '/components/VideoToPrompt.tsx',
  '/components/AudioUpload.tsx',
  '/components/VideoEdit.tsx',
  '/components/ImageToVeo3.tsx',
  '/i18n/locales.ts',
  '/i18n/translations.ts',
  '/i18n/TranslationContext.tsx',
  '/icon-192.svg',
  '/icon-512.svg',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/@google/genai@^1.17.0',
  'https://aistudiocdn.com/react@^19.1.1/',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching failed:', error);
            throw error;
        });
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
