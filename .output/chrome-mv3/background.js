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
        `https://staging.coupons.fit/api/public/offers?store_website=${domain}`,
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
        makeCookieRequest("http://localhost:2000/api/test", {
          headers: {
            "Accept": "application/json"
          }
        }).then((response) => {
          if (response.status !== 200) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWJhY2tncm91bmQubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiLCIuLi8uLi9oZWxwZXJVdGlscy9kb21haW5VdGlscy50cyIsIi4uLy4uL2hlbHBlclV0aWxzL2V4dGVybmFsLWFwaS1oYW5kbGVyL2ZldGNoT2ZmZXJzLnRzIiwiLi4vLi4vZW50cnlwb2ludHMvYmFja2dyb3VuZC50cyIsIi4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyL2Nocm9tZS5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiIsImV4cG9ydCBjb25zdCBjbGVhbkRvbWFpbiA9IChkb21haW46IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcbiAgICByZXR1cm4gZG9tYWluXHJcbiAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgIC5yZXBsYWNlKC9ed3d3XFwuLywgJycpXHJcbiAgICAgIC5yZXBsYWNlKC9ebVxcLi8sICcnKVxyXG4gICAgICAudHJpbSgpO1xyXG4gIH07XHJcbiAgXHJcbiAgZXhwb3J0IGNvbnN0IGlzVmFsaWRVcmwgPSAodXJsOiBzdHJpbmcpOiBib29sZWFuID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHVybE9iaiA9IG5ldyBVUkwodXJsKTtcclxuICAgICAgcmV0dXJuIHVybE9iai5wcm90b2NvbCA9PT0gJ2h0dHBzOicgfHwgdXJsT2JqLnByb3RvY29sID09PSAnaHR0cDonO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9OyIsImltcG9ydCB7IENvdXBvbiwgQ291cG9uUmVzcG9uc2UgfSBmcm9tIFwiQC90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGNvbnN0IGZldGNoQ291cG9ucyA9IGFzeW5jIChkb21haW46IHN0cmluZyk6IFByb21pc2U8Q291cG9uW10gfCBudWxsPiA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiZG9tYWluIFwiLGRvbWFpbilcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcclxuICAgICAgICBgaHR0cHM6Ly9zdGFnaW5nLmNvdXBvbnMuZml0L2FwaS9wdWJsaWMvb2ZmZXJzP3N0b3JlX3dlYnNpdGU9JHtkb21haW59YCxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICBcclxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBlcnJvciEgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgfVxyXG4gIFxyXG4gICAgICBjb25zdCByZXN1bHQ6IENvdXBvblJlc3BvbnNlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcInJlc3VsdCBcIixyZXN1bHQpXHJcbiAgICAgIHJldHVybiByZXN1bHQuZGF0YT8ub2ZmZXJzIHx8IG51bGw7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBjb3Vwb25zOicsIGVycm9yKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfTsiLCJpbXBvcnQgeyBjbGVhbkRvbWFpbiwgaXNWYWxpZFVybCB9IGZyb20gJ0AvaGVscGVyVXRpbHMvZG9tYWluVXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBBdXRoUmVzcG9uc2VEYXRhLCBDb3Vwb24gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBmZXRjaENvdXBvbnMgfSBmcm9tICdAL2hlbHBlclV0aWxzL2V4dGVybmFsLWFwaS1oYW5kbGVyL2ZldGNoT2ZmZXJzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZChhc3luYyAoKSA9PiB7XG4gIGxldCBwcm9jZXNzaW5nRG9tYWluID0gZmFsc2U7XG5cbiAgLy8gRmV0Y2ggYWN0aXZlIHRhYiBkb21haW5cbiAgY29uc3QgZ2V0QWN0aXZlVGFiRG9tYWluID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBbdGFiXSA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0pO1xuICAgICAgaWYgKCF0YWI/LnVybCB8fCAhaXNWYWxpZFVybCh0YWIudXJsKSkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gY2xlYW5Eb21haW4obmV3IFVSTCh0YWIudXJsKS5ob3N0bmFtZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgLy8gRmV0Y2ggY291cG9ucyBmcm9tIGV4dGVybmFsIEFQSSBiYXNlZCBvbiBkb21haW5cbiAgY29uc3QgZmV0Y2hDb3Vwb25zRm9yRG9tYWluID0gYXN5bmMgKGRvbWFpbjogc3RyaW5nKTogUHJvbWlzZTxDb3Vwb25bXT4gPT4ge1xuICAgIGlmIChwcm9jZXNzaW5nRG9tYWluKSByZXR1cm4gW107IC8vIFByZXZlbnQgbXVsdGlwbGUgZmV0Y2ggcmVxdWVzdHMgYXQgb25jZVxuXG4gICAgdHJ5IHtcbiAgICAgIHByb2Nlc3NpbmdEb21haW4gPSB0cnVlO1xuXG4gICAgICAvLyBGZXRjaCBjb3Vwb25zIGZyb20gZXh0ZXJuYWwgQVBJXG4gICAgICBjb25zdCBuZXdDb3Vwb25zID0gYXdhaXQgZmV0Y2hDb3Vwb25zKGRvbWFpbik7XG4gICAgICBpZiAobmV3Q291cG9ucykge1xuICAgICAgICByZXR1cm4gbmV3Q291cG9ucztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBwcm9jZXNzaW5nRG9tYWluID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIC8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSB0aGUgcG9wdXBcbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBfLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICBpZiAobWVzc2FnZS50eXBlID09PSBcIkdFVF9DT1VQT05TXCIpIHtcbiAgICAgIGdldEFjdGl2ZVRhYkRvbWFpbigpLnRoZW4oYXN5bmMgKGRvbWFpbikgPT4ge1xuICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IGRvbWFpbjogXCJcIiwgY291cG9uczogW10gfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY291cG9ucyA9IGF3YWl0IGZldGNoQ291cG9uc0ZvckRvbWFpbihkb21haW4pO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBkb21haW4sIGNvdXBvbnMgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cnVlOyAvLyBLZWVwIG1lc3NhZ2UgY2hhbm5lbCBvcGVuIGZvciBhc3luYyByZXNwb25zZVxuICAgIH1cbiAgfSk7XG5cblxuICAvL2Nvb2tpZSBtYW5hZ21lbnQgZnVuY3Rpb24gXG5cbiAgaW50ZXJmYWNlIENvb2tpZSB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgZG9tYWluOiBzdHJpbmc7XG4gIH1cblxuICBpbnRlcmZhY2UgUmVxdWVzdE9wdGlvbnMgZXh0ZW5kcyBSZXF1ZXN0SW5pdCB7XG4gICAgaGVhZGVycz86IEhlYWRlcnNJbml0O1xuICAgIHJlc3BvbnNlVHlwZT86ICdqc29uJyB8ICd0ZXh0JyB8ICdodG1sJztcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG1ha2VDb29raWVSZXF1ZXN0PFQ+KHVybDogc3RyaW5nLCBvcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyA9IHt9KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgZ2V0Q29va2llcyA9ICgpOiBQcm9taXNlPENvb2tpZVtdPiA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgY2hyb21lLmNvb2tpZXMuZ2V0QWxsKHsgZG9tYWluOiBcImxvY2FsaG9zdFwiIH0sIChjb29raWVzKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShjb29raWVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvb2tpZXMgPSBhd2FpdCBnZXRDb29raWVzKCk7XG4gICAgICBpZiAoIWNvb2tpZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTm8gY29va2llcyBmb3VuZC5cIik7XG4gICAgICAgIHJldHVybiBudWxsIGFzIFQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvb2tpZUhlYWRlciA9IGNvb2tpZXNcbiAgICAgICAgLm1hcChjb29raWUgPT4gYCR7Y29va2llLm5hbWV9PSR7Y29va2llLnZhbHVlfWApXG4gICAgICAgIC5qb2luKFwiOyBcIik7XG5cblxuICAgICAgY29uc3QgZGVmYXVsdEhlYWRlcnMgPSB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICBcIkNvb2tpZVwiOiBjb29raWVIZWFkZXJcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1lcmdlZEhlYWRlcnMgPSB7XG4gICAgICAgIC4uLmRlZmF1bHRIZWFkZXJzLFxuICAgICAgICAuLi4ob3B0aW9ucy5oZWFkZXJzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfHwge30pLFxuICAgICAgICBcIkNvb2tpZVwiOiBjb29raWVIZWFkZXJcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGZldGNoT3B0aW9uczogUmVxdWVzdEluaXQgPSB7XG4gICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgY3JlZGVudGlhbHM6IFwiaW5jbHVkZVwiLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBoZWFkZXJzOiBtZXJnZWRIZWFkZXJzXG4gICAgICB9O1xuXG4gICAgICAvLyBNYWtlIHRoZSByZXF1ZXN0XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgZmV0Y2hPcHRpb25zKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgcmVzcG9uc2UgaXMgb2tcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBjb250ZW50IHR5cGUgZnJvbSByZXNwb25zZSBoZWFkZXJzXG4gICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpO1xuICAgICAgbGV0IGRhdGE6IGFueTtcblxuICAgICAgLy8gSGFuZGxlIGRpZmZlcmVudCByZXNwb25zZSB0eXBlc1xuICAgICAgaWYgKGNvbnRlbnRUeXBlPy5pbmNsdWRlcyhcImFwcGxpY2F0aW9uL2pzb25cIikpIHtcbiAgICAgICAgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIH0gZWxzZSBpZiAoY29udGVudFR5cGU/LmluY2x1ZGVzKFwidGV4dC9odG1sXCIpKSB7XG4gICAgICAgIGRhdGEgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlJlY2VpdmVkIEhUTUwgcmVzcG9uc2UgaW5zdGVhZCBvZiBKU09OXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRGVmYXVsdCB0byB0ZXh0XG4gICAgICAgIGRhdGEgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGNvbnNvbGUud2FybihgVW5leHBlY3RlZCBjb250ZW50IHR5cGU6ICR7Y29udGVudFR5cGV9YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRhIGFzIFQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlJlcXVlc3QgZmFpbGVkOlwiLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBbiB1bmtub3duIGVycm9yIG9jY3VycmVkOlwiLCBlcnJvcik7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvLyBFeGFtcGxlIHVzYWdlIHdpdGggZXJyb3IgaGFuZGxpbmdcbiBcblxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJHRVRfQVVUSFwiKSB7XG4gICAgICBtYWtlQ29va2llUmVxdWVzdDxBdXRoUmVzcG9uc2VEYXRhPihcImh0dHA6Ly9sb2NhbGhvc3Q6MjAwMC9hcGkvdGVzdFwiLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UobnVsbClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkJhY2tncm91bmQgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgICAgICBzZW5kUmVzcG9uc2UobnVsbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAvLyBSZXR1cm4gdHJ1ZSB0byBpbmRpY2F0ZSB3ZSB3YW50IHRvIHNlbmQgYSByZXNwb25zZSBhc3luY2hyb25vdXNseVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9KTtcblxuICAvLyBCYXNpYyB1c2FnZSB3aXRoIGVycm9yIGhhbmRsaW5nXG5cblxuXG4gIC8vIC8vIEV4YW1wbGUgd2l0aCBIVE1MIGhhbmRsaW5nXG4gIC8vIHRyeSB7XG4gIC8vICAgY29uc3QgaHRtbFJlc3BvbnNlID0gYXdhaXQgbWFrZUNvb2tpZVJlcXVlc3Q8c3RyaW5nPihcImh0dHA6Ly9sb2NhbGhvc3Q6MjAwMC9hcGkvdGVzdFwiLCB7XG4gIC8vICAgICByZXNwb25zZVR5cGU6ICdodG1sJyxcbiAgLy8gICAgIGhlYWRlcnM6IHtcbiAgLy8gICAgICAgXCJBY2NlcHRcIjogXCJ0ZXh0L2h0bWxcIlxuICAvLyAgICAgfVxuICAvLyAgIH0pO1xuICAvLyAgIGNvbnNvbGUubG9nKFwiSFRNTCByZXNwb25zZTpcIiwgaHRtbFJlc3BvbnNlKTtcbiAgLy8gfSBjYXRjaCAoZXJyb3IpIHtcbiAgLy8gICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAvLyAgICAgY29uc29sZS5lcnJvcihcIlJlcXVlc3QgZmFpbGVkOlwiLCBlcnJvci5tZXNzYWdlKTtcbiAgLy8gICB9XG4gIC8vIH1cbn0pO1xuXG5cblxuIiwiZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSAoXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZCA9PSBudWxsID8gZ2xvYmFsVGhpcy5jaHJvbWUgOiAoXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgIGdsb2JhbFRoaXMuYnJvd3NlclxuICApXG4pO1xuIl0sIm5hbWVzIjpbInJlc3VsdCIsIl9hIl0sIm1hcHBpbmdzIjoiOzs7QUFBTyxXQUFTLGlCQUFpQixLQUFLO0FBQ3BDLFFBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxXQUFZLFFBQU8sRUFBRSxNQUFNLElBQUs7QUFDbEUsV0FBTztBQUFBLEVBQ1Q7QUNGQSxNQUFJLGdCQUFnQixNQUFNO0FBQUEsSUFDeEIsWUFBWSxjQUFjO0FBQ3hCLFVBQUksaUJBQWlCLGNBQWM7QUFDakMsYUFBSyxZQUFZO0FBQ2pCLGFBQUssa0JBQWtCLENBQUMsR0FBRyxjQUFjLFNBQVM7QUFDbEQsYUFBSyxnQkFBZ0I7QUFDckIsYUFBSyxnQkFBZ0I7QUFBQSxNQUMzQixPQUFXO0FBQ0wsY0FBTSxTQUFTLHVCQUF1QixLQUFLLFlBQVk7QUFDdkQsWUFBSSxVQUFVO0FBQ1osZ0JBQU0sSUFBSSxvQkFBb0IsY0FBYyxrQkFBa0I7QUFDaEUsY0FBTSxDQUFDLEdBQUcsVUFBVSxVQUFVLFFBQVEsSUFBSTtBQUMxQyx5QkFBaUIsY0FBYyxRQUFRO0FBQ3ZDLHlCQUFpQixjQUFjLFFBQVE7QUFFdkMsYUFBSyxrQkFBa0IsYUFBYSxNQUFNLENBQUMsUUFB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
