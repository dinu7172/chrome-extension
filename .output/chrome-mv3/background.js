var background = function() {
  "use strict";
  var _a, _b;
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  const cleanDomain = (domain) => {
    return domain.toLowerCase().replace(/^www\./, "").replace(/^m\./, "").trim();
  };
  const isValidUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:" || urlObj.protocol === "http:";
    } catch {
      return false;
    }
  };
  background;
  const fetchCoupons = async (domain) => {
    var _a2;
    try {
      console.log("domain ", domain);
      const response = await fetch(
        `https://staging.coupons.fit//api/public/offers?store_website=${domain}`,
        {
          headers: {
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result2 = await response.json();
      console.log("result ", result2);
      return ((_a2 = result2.data) == null ? void 0 : _a2.offers) || null;
    } catch (error) {
      console.error("Error fetching coupons:", error);
      return null;
    }
  };
  background;
  const definition = defineBackground(async () => {
    let processingDomain = false;
    const getActiveTabDomain = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!(tab == null ? void 0 : tab.url) || !isValidUrl(tab.url)) return null;
        return cleanDomain(new URL(tab.url).hostname);
      } catch {
        return null;
      }
    };
    const fetchCouponsForDomain = async (domain) => {
      if (processingDomain) return [];
      try {
        processingDomain = true;
        const newCoupons = await fetchCoupons(domain);
        if (newCoupons) {
          return newCoupons;
        }
        return [];
      } finally {
        processingDomain = false;
      }
    };
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === "GET_COUPONS") {
        getActiveTabDomain().then(async (domain) => {
          if (!domain) {
            sendResponse({ domain: "", coupons: [] });
            return;
          }
          const coupons = await fetchCouponsForDomain(domain);
          sendResponse({ domain, coupons });
        });
        return true;
      }
    });
    async function makeCookieRequest(url, options = {}) {
      const getCookies = () => {
        return new Promise((resolve) => {
          chrome.cookies.getAll({ domain: "localhost" }, (cookies) => {
            resolve(cookies);
          });
        });
      };
      try {
        const cookies = await getCookies();
        if (!cookies.length) {
          console.log("No cookies found.");
          return null;
        }
        const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
        const defaultHeaders = {
          "Content-Type": "application/json",
          "Cookie": cookieHeader
        };
        const mergedHeaders = {
          ...defaultHeaders,
          ...options.headers || {},
          "Cookie": cookieHeader
        };
        const fetchOptions = {
          method: "GET",
          credentials: "include",
          ...options,
          headers: mergedHeaders
        };
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType == null ? void 0 : contentType.includes("application/json")) {
          data = await response.json();
        } else if (contentType == null ? void 0 : contentType.includes("text/html")) {
          data = await response.text();
          console.warn("Received HTML response instead of JSON");
        } else {
          data = await response.text();
          console.warn(`Unexpected content type: ${contentType}`);
        }
        return data;
      } catch (error) {
        if (error instanceof Error) {
          console.error("Request failed:", error.message);
        } else {
          console.error("An unknown error occurred:", error);
        }
        throw error;
      }
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "GET_AUTH") {
        makeCookieRequest("https://staging.coupons.fit//api/test", {
          headers: {
            "Accept": "application/json"
          }
        }).then((response) => {
          if ((response == null ? void 0 : response.status) !== 200) {
            sendResponse(null);
          } else {
            sendResponse(response);
          }
        }).catch((error) => {
          console.error("Background error:", error);
          sendResponse(null);
        });
        return true;
      }
    });
  });
  background;
  function initPlugins() {
  }
  const browser = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = `${"ws:"}//${"localhost"}:${3e3}`;
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws == null ? void 0 : ws.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws == null ? void 0 : ws.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      var _a2, _b2;
      const hasJs = (_a2 = contentScript.js) == null ? void 0 : _a2.find((js) => {
        var _a3;
        return (_a3 = cs.js) == null ? void 0 : _a3.includes(js);
      });
      const hasCss = (_b2 = contentScript.css) == null ? void 0 : _b2.find((css) => {
        var _a3;
        return (_a3 = cs.css) == null ? void 0 : _a3.includes(css);
      });
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url)
        return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
}();
background;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWJhY2tncm91bmQubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiLCIuLi8uLi9oZWxwZXJVdGlscy9kb21haW5VdGlscy50cyIsIi4uLy4uL2hlbHBlclV0aWxzL2V4dGVybmFsLWFwaS1oYW5kbGVyL2ZldGNoT2ZmZXJzLnRzIiwiLi4vLi4vZW50cnlwb2ludHMvYmFja2dyb3VuZC50cyIsIi4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyL2Nocm9tZS5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiIsImV4cG9ydCBjb25zdCBjbGVhbkRvbWFpbiA9IChkb21haW46IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcbiAgICByZXR1cm4gZG9tYWluXHJcbiAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgIC5yZXBsYWNlKC9ed3d3XFwuLywgJycpXHJcbiAgICAgIC5yZXBsYWNlKC9ebVxcLi8sICcnKVxyXG4gICAgICAudHJpbSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgZXhwb3J0IGNvbnN0IGlzVmFsaWRVcmwgPSAodXJsOiBzdHJpbmcpOiBib29sZWFuID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHVybE9iaiA9IG5ldyBVUkwodXJsKTtcclxuICAgICAgcmV0dXJuIHVybE9iai5wcm90b2NvbCA9PT0gJ2h0dHBzOicgfHwgdXJsT2JqLnByb3RvY29sID09PSAnaHR0cDonO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9OyIsImltcG9ydCB7IENvdXBvbiwgQ291cG9uUmVzcG9uc2UgfSBmcm9tIFwiQC90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGNvbnN0IGZldGNoQ291cG9ucyA9IGFzeW5jIChkb21haW46IHN0cmluZyk6IFByb21pc2U8Q291cG9uW10gfCBudWxsPiA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiZG9tYWluIFwiLGRvbWFpbilcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcclxuICAgICAgICBgaHR0cHM6Ly9zdGFnaW5nLmNvdXBvbnMuZml0Ly9hcGkvcHVibGljL29mZmVycz9zdG9yZV93ZWJzaXRlPSR7ZG9tYWlufWAsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgXHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcbiAgICAgIH1cclxuICBcclxuICAgICAgY29uc3QgcmVzdWx0OiBDb3Vwb25SZXNwb25zZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgY29uc29sZS5sb2coXCJyZXN1bHQgXCIscmVzdWx0KVxyXG4gICAgICByZXR1cm4gcmVzdWx0LmRhdGE/Lm9mZmVycyB8fCBudWxsO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgY291cG9uczonLCBlcnJvcik7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH07IiwiaW1wb3J0IHsgY2xlYW5Eb21haW4sIGlzVmFsaWRVcmwgfSBmcm9tICdAL2hlbHBlclV0aWxzL2RvbWFpblV0aWxzJztcbmltcG9ydCB0eXBlIHsgQXV0aFJlc3BvbnNlRGF0YSwgQ291cG9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgZmV0Y2hDb3Vwb25zIH0gZnJvbSAnQC9oZWxwZXJVdGlscy9leHRlcm5hbC1hcGktaGFuZGxlci9mZXRjaE9mZmVycyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoYXN5bmMgKCkgPT4ge1xuICBsZXQgcHJvY2Vzc2luZ0RvbWFpbiA9IGZhbHNlO1xuXG4gIC8vIEZldGNoIGFjdGl2ZSB0YWIgZG9tYWluXG4gIGNvbnN0IGdldEFjdGl2ZVRhYkRvbWFpbiA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgW3RhYl0gPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KTtcbiAgICAgIGlmICghdGFiPy51cmwgfHwgIWlzVmFsaWRVcmwodGFiLnVybCkpIHJldHVybiBudWxsO1xuICAgICAgcmV0dXJuIGNsZWFuRG9tYWluKG5ldyBVUkwodGFiLnVybCkuaG9zdG5hbWUpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIC8vIEZldGNoIGNvdXBvbnMgZnJvbSBleHRlcm5hbCBBUEkgYmFzZWQgb24gZG9tYWluXG4gIGNvbnN0IGZldGNoQ291cG9uc0ZvckRvbWFpbiA9IGFzeW5jIChkb21haW46IHN0cmluZyk6IFByb21pc2U8Q291cG9uW10+ID0+IHtcbiAgICBpZiAocHJvY2Vzc2luZ0RvbWFpbikgcmV0dXJuIFtdOyAvLyBQcmV2ZW50IG11bHRpcGxlIGZldGNoIHJlcXVlc3RzIGF0IG9uY2VcblxuICAgIHRyeSB7XG4gICAgICBwcm9jZXNzaW5nRG9tYWluID0gdHJ1ZTtcblxuICAgICAgLy8gRmV0Y2ggY291cG9ucyBmcm9tIGV4dGVybmFsIEFQSVxuICAgICAgY29uc3QgbmV3Q291cG9ucyA9IGF3YWl0IGZldGNoQ291cG9ucyhkb21haW4pO1xuICAgICAgaWYgKG5ld0NvdXBvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ld0NvdXBvbnM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcHJvY2Vzc2luZ0RvbWFpbiA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICAvLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gdGhlIHBvcHVwXG4gIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgXywgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJHRVRfQ09VUE9OU1wiKSB7XG4gICAgICBnZXRBY3RpdmVUYWJEb21haW4oKS50aGVuKGFzeW5jIChkb21haW4pID0+IHtcbiAgICAgICAgaWYgKCFkb21haW4pIHtcbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBkb21haW46IFwiXCIsIGNvdXBvbnM6IFtdIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvdXBvbnMgPSBhd2FpdCBmZXRjaENvdXBvbnNGb3JEb21haW4oZG9tYWluKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgZG9tYWluLCBjb3Vwb25zIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdHJ1ZTsgLy8gS2VlcCBtZXNzYWdlIGNoYW5uZWwgb3BlbiBmb3IgYXN5bmMgcmVzcG9uc2VcbiAgICB9XG4gIH0pO1xuXG5cbiAgLy9jb29raWUgbWFuYWdtZW50IGZ1bmN0aW9uIFxuXG4gIGludGVyZmFjZSBDb29raWUge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGRvbWFpbjogc3RyaW5nO1xuICB9XG5cbiAgaW50ZXJmYWNlIFJlcXVlc3RPcHRpb25zIGV4dGVuZHMgUmVxdWVzdEluaXQge1xuICAgIGhlYWRlcnM/OiBIZWFkZXJzSW5pdDtcbiAgICByZXNwb25zZVR5cGU/OiAnanNvbicgfCAndGV4dCcgfCAnaHRtbCc7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBtYWtlQ29va2llUmVxdWVzdDxUPih1cmw6IHN0cmluZywgb3B0aW9uczogUmVxdWVzdE9wdGlvbnMgPSB7fSk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGdldENvb2tpZXMgPSAoKTogUHJvbWlzZTxDb29raWVbXT4gPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGNocm9tZS5jb29raWVzLmdldEFsbCh7IGRvbWFpbjogXCJsb2NhbGhvc3RcIiB9LCAoY29va2llcykgPT4ge1xuICAgICAgICAgIHJlc29sdmUoY29va2llcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb29raWVzID0gYXdhaXQgZ2V0Q29va2llcygpO1xuICAgICAgaWYgKCFjb29raWVzLmxlbmd0aCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGNvb2tpZXMgZm91bmQuXCIpO1xuICAgICAgICByZXR1cm4gbnVsbCBhcyBUO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb29raWVIZWFkZXIgPSBjb29raWVzXG4gICAgICAgIC5tYXAoY29va2llID0+IGAke2Nvb2tpZS5uYW1lfT0ke2Nvb2tpZS52YWx1ZX1gKVxuICAgICAgICAuam9pbihcIjsgXCIpO1xuXG5cbiAgICAgIGNvbnN0IGRlZmF1bHRIZWFkZXJzID0ge1xuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgXCJDb29raWVcIjogY29va2llSGVhZGVyXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBtZXJnZWRIZWFkZXJzID0ge1xuICAgICAgICAuLi5kZWZhdWx0SGVhZGVycyxcbiAgICAgICAgLi4uKG9wdGlvbnMuaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHx8IHt9KSxcbiAgICAgICAgXCJDb29raWVcIjogY29va2llSGVhZGVyXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBmZXRjaE9wdGlvbnM6IFJlcXVlc3RJbml0ID0ge1xuICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgaGVhZGVyczogbWVyZ2VkSGVhZGVyc1xuICAgICAgfTtcblxuICAgICAgLy8gTWFrZSB0aGUgcmVxdWVzdFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIGZldGNoT3B0aW9ucyk7XG5cbiAgICAgIC8vIENoZWNrIGlmIHJlc3BvbnNlIGlzIG9rXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBlcnJvciEgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgY29udGVudCB0eXBlIGZyb20gcmVzcG9uc2UgaGVhZGVyc1xuICAgICAgY29uc3QgY29udGVudFR5cGUgPSByZXNwb25zZS5oZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKTtcbiAgICAgIGxldCBkYXRhOiBhbnk7XG5cbiAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgcmVzcG9uc2UgdHlwZXNcbiAgICAgIGlmIChjb250ZW50VHlwZT8uaW5jbHVkZXMoXCJhcHBsaWNhdGlvbi9qc29uXCIpKSB7XG4gICAgICAgIGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbnRlbnRUeXBlPy5pbmNsdWRlcyhcInRleHQvaHRtbFwiKSkge1xuICAgICAgICBkYXRhID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJSZWNlaXZlZCBIVE1MIHJlc3BvbnNlIGluc3RlYWQgb2YgSlNPTlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlZmF1bHQgdG8gdGV4dFxuICAgICAgICBkYXRhID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICBjb25zb2xlLndhcm4oYFVuZXhwZWN0ZWQgY29udGVudCB0eXBlOiAke2NvbnRlbnRUeXBlfWApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZGF0YSBhcyBUO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXF1ZXN0IGZhaWxlZDpcIiwgZXJyb3IubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiQW4gdW5rbm93biBlcnJvciBvY2N1cnJlZDpcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLy8gRXhhbXBsZSB1c2FnZSB3aXRoIGVycm9yIGhhbmRsaW5nXG4gXG5cbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiR0VUX0FVVEhcIikge1xuICAgICAgbWFrZUNvb2tpZVJlcXVlc3Q8QXV0aFJlc3BvbnNlRGF0YT4oXCJodHRwczovL3N0YWdpbmcuY291cG9ucy5maXQvL2FwaS90ZXN0XCIsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICBpZiAocmVzcG9uc2U/LnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UobnVsbClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkJhY2tncm91bmQgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgICAgICBzZW5kUmVzcG9uc2UobnVsbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAvLyBSZXR1cm4gdHJ1ZSB0byBpbmRpY2F0ZSB3ZSB3YW50IHRvIHNlbmQgYSByZXNwb25zZSBhc3luY2hyb25vdXNseVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9KTtcblxuICAvLyBCYXNpYyB1c2FnZSB3aXRoIGVycm9yIGhhbmRsaW5nXG5cblxuXG4gIC8vIC8vIEV4YW1wbGUgd2l0aCBIVE1MIGhhbmRsaW5nXG4gIC8vIHRyeSB7XG4gIC8vICAgY29uc3QgaHRtbFJlc3BvbnNlID0gYXdhaXQgbWFrZUNvb2tpZVJlcXVlc3Q8c3RyaW5nPihcImh0dHBzOi8vc3RhZ2luZy5jb3Vwb25zLmZpdC8vYXBpL3Rlc3RcIiwge1xuICAvLyAgICAgcmVzcG9uc2VUeXBlOiAnaHRtbCcsXG4gIC8vICAgICBoZWFkZXJzOiB7XG4gIC8vICAgICAgIFwiQWNjZXB0XCI6IFwidGV4dC9odG1sXCJcbiAgLy8gICAgIH1cbiAgLy8gICB9KTtcbiAgLy8gICBjb25zb2xlLmxvZyhcIkhUTUwgcmVzcG9uc2U6XCIsIGh0bWxSZXNwb25zZSk7XG4gIC8vIH0gY2F0Y2ggKGVycm9yKSB7XG4gIC8vICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgLy8gICAgIGNvbnNvbGUuZXJyb3IoXCJSZXF1ZXN0IGZhaWxlZDpcIiwgZXJyb3IubWVzc2FnZSk7XG4gIC8vICAgfVxuICAvLyB9XG59KTtcblxuXG5cbiIsImV4cG9ydCBjb25zdCBicm93c2VyID0gKFxuICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gIGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWQgPT0gbnVsbCA/IGdsb2JhbFRoaXMuY2hyb21lIDogKFxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgKVxuKTtcbiJdLCJuYW1lcyI6WyJyZXN1bHQiLCJfYSJdLCJtYXBwaW5ncyI6Ijs7O0FBQU8sV0FBUyxpQkFBaUIsS0FBSztBQUNwQyxRQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsV0FBWSxRQUFPLEVBQUUsTUFBTSxJQUFLO0FBQ2xFLFdBQU87QUFBQSxFQUNUO0FDRkEsTUFBSSxnQkFBZ0IsTUFBTTtBQUFBLElBQ3hCLFlBQVksY0FBYztBQUN4QixVQUFJLGlCQUFpQixjQUFjO0FBQ2pDLGFBQUssWUFBWTtBQUNqQixhQUFLLGtCQUFrQixDQUFDLEdBQUcsY0FBYyxTQUFTO0FBQ2xELGFBQUssZ0JBQWdCO0FBQ3JCLGFBQUssZ0JBQWdCO0FBQUEsTUFDM0IsT0FBVztBQUNMLGNBQU0sU0FBUyx1QkFBdUIsS0FBSyxZQUFZO0FBQ3ZELFlBQUksVUFBVTtBQUNaLGdCQUFNLElBQUksb0JBQW9CLGNBQWMsa0JBQWtCO0FBQ2hFLGNBQU0sQ0FBQyxHQUFHLFVBQVUsVUFBVSxRQUFRLElBQUk7QUFDMUMseUJBQWlCLGNBQWMsUUFBUTtBQUN2Qyx5QkFBaUIsY0FBYyxRQUFRO0FBRXZDLGFBQUssa0JBQWtCLGFB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
