import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    "host_permissions": [
      "<all_urls>",
      "*://*.google.com/*",
      "http://localhost/*"
    ],
    "permissions": ['storage', 'tabs' , "activeTab" ,"cookies"],
  }
});
