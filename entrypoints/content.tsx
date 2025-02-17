import ReactDOM from "react-dom/client";
import "../assets/main.css";
import App from "@/src/app";

export default defineContentScript({
  matches: ["https://www.aliexpress.com/**" , "https://www.123ink.ca/**" ,"https://4cornerscannabis.com/**"],
  // matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  runAt: "document_end",
  async main(ctx) {
    // Function to find existing shadow roots and fixed elements
    function findExistingStrips() {
      return Array.from(document.body.children).filter((el) => {
        return el.shadowRoot || window.getComputedStyle(el).position === "fixed";
      });
    }

    // Function to adjust the position of the shadow UI
    function adjustPosition(container: HTMLElement) {
      const existingStrips = findExistingStrips();
      let newTop = 10; // Default top position

      if (existingStrips.length > 0) {
        const lastStrip = existingStrips[existingStrips.length - 1];
        const lastStripBottom = lastStrip.getBoundingClientRect().bottom;
        newTop = lastStripBottom + 10; // Place it below the last strip
      }

      container.style.top = `${newTop}px`;
    }

    // Ensure execution after the document is fully loaded
    window.addEventListener("load", async () => {
      const rootName = "coupons-ui"
      const ui = await createShadowRootUi(ctx, {
        name: rootName,
        position: "inline",
        anchor: "body",
        onMount: (container) => {
          const app = document.createElement("div");
          container.append(app);
          const data = document.getElementsByTagName('*')
          const elementsWithShadowRoot = Array.from(data).filter(element => element.shadowRoot)

          // elementsWithShadowRoot.forEach((el) => {
          //   if (el.tagName.toLocaleLowerCase() !== rootName.toLocaleLowerCase())
          //     el.remove(); // Remove the entire host element
          // });

          // Mount React component


          // Access the shadow host by its tag name
          const shadowHost = document.querySelector(rootName); // Select <coupons-ui>

          // Check if the shadow root exists on the shadow host
          if (shadowHost && shadowHost.shadowRoot) {
            const shadowRoot = shadowHost.shadowRoot;

            // Optionally, you can apply styles directly to the shadow DOM
            const style = document.createElement("style");
            style.textContent = `
          html {
            z-index : 999999
          }
        `;
            shadowRoot.appendChild(style);
          }
          const root = ReactDOM.createRoot(app);
          root.render(<App/>);

          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });

      // Mount the UI
      ui.mount();
    });

  },
});
