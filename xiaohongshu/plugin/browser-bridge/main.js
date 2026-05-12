/**
 * Browser Bridge Plugin
 *
 * Exposes the Obsidian embedded browser (Surfing plugin webview) to external
 * tools via a local HTTP API on port 27182. This gives AI agents like Claudian
 * the ability to control the in-app browser — the same pattern Cursor uses.
 *
 * The user logs in manually in the Surfing browser; this plugin only reads and
 * interacts with pages using the user's real session.
 */

const obsidian = require("obsidian");
const http = require("http");

const PORT = 27182;

class BrowserBridgePlugin extends obsidian.Plugin {
  async onload() {
    this.server = null;
    this.startServer();
    console.log("[browser-bridge] Plugin loaded, starting HTTP server on port " + PORT);
  }

  onunload() {
    this.stopServer();
    console.log("[browser-bridge] Plugin unloaded");
  }

  // =========================================================================
  // HTTP Server
  // =========================================================================

  startServer() {
    this.server = http.createServer(async (req, res) => {
      // CORS headers for local access
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        const body = await this.readBody(req);
        const result = await this.handleRequest(req.method, req.url, body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(err.statusCode || 500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    this.server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error("[browser-bridge] Port " + PORT + " already in use");
        new obsidian.Notice("Browser Bridge: port " + PORT + " in use. Another instance running?");
      } else {
        console.error("[browser-bridge] Server error:", err);
      }
    });

    this.server.listen(PORT, "127.0.0.1", () => {
      console.log("[browser-bridge] HTTP server listening on http://127.0.0.1:" + PORT);
    });
  }

  stopServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  readBody(req) {
    return new Promise((resolve, reject) => {
      if (req.method === "GET") return resolve(null);
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject({ statusCode: 400, message: "Invalid JSON body" });
        }
      });
      req.on("error", reject);
    });
  }

  // =========================================================================
  // Request Router
  // =========================================================================

  async handleRequest(method, url, body) {
    const path = url.split("?")[0];

    switch (path) {
      case "/ping":
        return { ok: true, plugin: "browser-bridge", version: "1.0.0" };

      case "/state":
        return await this.handleGetState();

      case "/navigate":
        if (method !== "POST") throw { statusCode: 405, message: "POST required" };
        return await this.handleNavigate(body);

      case "/eval":
        if (method !== "POST") throw { statusCode: 405, message: "POST required" };
        return await this.handleEval(body);

      case "/content":
        return await this.handleGetContent();

      case "/snapshot":
        return await this.handleGetSnapshot();

      case "/screenshot":
        return await this.handleScreenshot();

      case "/click":
        if (method !== "POST") throw { statusCode: 405, message: "POST required" };
        return await this.handleClick(body);

      case "/type":
        if (method !== "POST") throw { statusCode: 405, message: "POST required" };
        return await this.handleType(body);

      case "/back":
        return await this.handleBack();

      case "/forward":
        return await this.handleForward();

      case "/open":
        if (method !== "POST") throw { statusCode: 405, message: "POST required" };
        return await this.handleOpenInSurfing(body);

      case "/tabs":
        return await this.handleGetTabs();

      default:
        throw { statusCode: 404, message: "Unknown endpoint: " + path };
    }
  }

  // =========================================================================
  // Webview Discovery
  // =========================================================================

  /**
   * Find the active Surfing webview in the workspace.
   * Uses the same detection logic as Claudian's BrowserSelectionController.
   */
  findWebview() {
    // Strategy 1: Check the active leaf
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf) {
      const wv = this.findWebviewInLeaf(activeLeaf);
      if (wv) return wv;
    }

    // Strategy 2: Scan all leaves for a browser-like view
    const leaves = this.app.workspace.getLeavesOfType("*");
    // getLeavesOfType("*") might not work — fallback to iterating
    const allLeaves = [];
    this.app.workspace.iterateAllLeaves((leaf) => allLeaves.push(leaf));

    for (const leaf of allLeaves) {
      const wv = this.findWebviewInLeaf(leaf);
      if (wv) return wv;
    }

    return null;
  }

  findWebviewInLeaf(leaf) {
    if (!leaf || !leaf.view || !leaf.view.containerEl) return null;
    const view = leaf.view;
    const viewType = typeof view.getViewType === "function" ? view.getViewType() : "";
    const normalized = viewType.toLowerCase();

    // Check if it's a browser-like view
    const isBrowser =
      normalized.includes("surfing") ||
      normalized.includes("browser") ||
      normalized.includes("webview") ||
      normalized.includes("web-browser");

    if (!isBrowser && !view.containerEl.querySelector("webview")) return null;

    const webview = view.containerEl.querySelector("webview");
    if (!webview || typeof webview.executeJavaScript !== "function") return null;

    return { webview, view, viewType, leaf };
  }

  /**
   * Get webview or throw a helpful error.
   */
  requireWebview() {
    const result = this.findWebview();
    if (!result) {
      throw {
        statusCode: 404,
        message: "No embedded browser found. Open a URL in Obsidian's Surfing browser first."
      };
    }
    return result;
  }

  // =========================================================================
  // Handlers
  // =========================================================================

  async handleGetState() {
    const { webview } = this.requireWebview();
    const url = webview.getURL ? webview.getURL() : await webview.executeJavaScript("location.href");
    const title = webview.getTitle ? webview.getTitle() : await webview.executeJavaScript("document.title");
    return { url, title };
  }

  async handleNavigate(body) {
    if (!body || !body.url) throw { statusCode: 400, message: "Missing 'url' in body" };
    const { webview } = this.requireWebview();

    if (typeof webview.loadURL === "function") {
      await webview.loadURL(body.url);
    } else {
      await webview.executeJavaScript(`location.href = ${JSON.stringify(body.url)}`);
    }

    // Wait a moment for navigation to start
    await new Promise((r) => setTimeout(r, 1000));
    const url = webview.getURL ? webview.getURL() : await webview.executeJavaScript("location.href");
    const title = webview.getTitle ? webview.getTitle() : await webview.executeJavaScript("document.title");
    return { url, title };
  }

  async handleEval(body) {
    if (!body || !body.code) throw { statusCode: 400, message: "Missing 'code' in body" };
    const { webview } = this.requireWebview();
    const result = await webview.executeJavaScript(body.code, true);
    return { result };
  }

  async handleGetContent() {
    const { webview } = this.requireWebview();
    const result = await webview.executeJavaScript(`
      (function() {
        const url = location.href;
        const title = document.title;
        const text = document.body ? document.body.innerText.slice(0, 50000) : "";
        return { url, title, text };
      })()
    `, true);
    return result;
  }

  async handleGetSnapshot() {
    const { webview } = this.requireWebview();
    const result = await webview.executeJavaScript(`
      (function() {
        const url = location.href;
        const title = document.title;
        // Get interactive elements with their indices
        const selectors = 'a, button, input, textarea, select, [role="button"], [onclick], [tabindex]';
        const elements = Array.from(document.querySelectorAll(selectors));
        const interactive = elements.slice(0, 100).map((el, i) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return null;
          const tag = el.tagName.toLowerCase();
          const text = (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || '').trim().slice(0, 80);
          const type = el.type || '';
          const href = el.href || '';
          return { i, tag, type, text, href: href.slice(0, 200) };
        }).filter(Boolean);
        return { url, title, interactive };
      })()
    `, true);
    return result;
  }

  async handleScreenshot() {
    const { webview } = this.requireWebview();
    if (typeof webview.capturePage === "function") {
      const image = await webview.capturePage();
      const png = image.toPNG();
      const base64 = png.toString("base64");
      return { format: "png", base64, size: png.length };
    }
    throw { statusCode: 501, message: "capturePage not available on this webview" };
  }

  async handleClick(body) {
    if (!body) throw { statusCode: 400, message: "Missing body" };
    const { webview } = this.requireWebview();

    let code;
    if (body.selector) {
      code = `(function() {
        const el = document.querySelector(${JSON.stringify(body.selector)});
        if (!el) return { error: "Element not found: ${body.selector}" };
        el.click();
        return { clicked: true, tag: el.tagName, text: (el.innerText || '').slice(0, 50) };
      })()`;
    } else if (typeof body.index === "number") {
      code = `(function() {
        const selectors = 'a, button, input, textarea, select, [role="button"], [onclick], [tabindex]';
        const elements = Array.from(document.querySelectorAll(selectors)).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const el = elements[${body.index}];
        if (!el) return { error: "Element index ${body.index} out of range (total: " + elements.length + ")" };
        el.click();
        return { clicked: true, tag: el.tagName, text: (el.innerText || '').slice(0, 50) };
      })()`;
    } else if (typeof body.x === "number" && typeof body.y === "number") {
      code = `(function() {
        const el = document.elementFromPoint(${body.x}, ${body.y});
        if (!el) return { error: "No element at coordinates (${body.x}, ${body.y})" };
        el.click();
        return { clicked: true, tag: el.tagName, text: (el.innerText || '').slice(0, 50) };
      })()`;
    } else {
      throw { statusCode: 400, message: "Provide 'selector', 'index', or 'x'+'y'" };
    }

    const result = await webview.executeJavaScript(code, true);
    return result;
  }

  async handleType(body) {
    if (!body || !body.selector || body.text === undefined) {
      throw { statusCode: 400, message: "Missing 'selector' and/or 'text' in body" };
    }
    const { webview } = this.requireWebview();
    const code = `(function() {
      const el = document.querySelector(${JSON.stringify(body.selector)});
      if (!el) return { error: "Element not found" };
      el.focus();
      el.value = ${JSON.stringify(body.text)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { typed: true };
    })()`;
    const result = await webview.executeJavaScript(code, true);
    return result;
  }

  async handleBack() {
    const { webview } = this.requireWebview();
    if (typeof webview.goBack === "function") {
      webview.goBack();
      await new Promise((r) => setTimeout(r, 1000));
      const url = webview.getURL ? webview.getURL() : "";
      return { url };
    }
    throw { statusCode: 501, message: "goBack not available" };
  }

  async handleForward() {
    const { webview } = this.requireWebview();
    if (typeof webview.goForward === "function") {
      webview.goForward();
      await new Promise((r) => setTimeout(r, 1000));
      const url = webview.getURL ? webview.getURL() : "";
      return { url };
    }
    throw { statusCode: 501, message: "goForward not available" };
  }

  async handleOpenInSurfing(body) {
    if (!body || !body.url) throw { statusCode: 400, message: "Missing 'url' in body" };

    // Try to use Surfing's protocol to open a URL in a new tab
    // Surfing registers a "surfing" view type and handles obsidian:// URIs
    try {
      // Method 1: Use Obsidian's workspace.openLinkText with a URL
      await this.app.workspace.openLinkText(body.url, "", true);
      await new Promise((r) => setTimeout(r, 1500));
      return { opened: true, url: body.url };
    } catch (e) {
      // Method 2: Try the surfing command if available
      try {
        this.app.commands.executeCommandById("surfing:open-link");
        return { opened: true, url: body.url, method: "command" };
      } catch {
        throw { statusCode: 500, message: "Could not open URL in Surfing: " + e.message };
      }
    }
  }

  async handleGetTabs() {
    const tabs = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      const wv = this.findWebviewInLeaf(leaf);
      if (wv) {
        const url = wv.webview.getURL ? wv.webview.getURL() : "";
        const title = wv.webview.getTitle ? wv.webview.getTitle() : "";
        tabs.push({
          id: leaf.id,
          viewType: wv.viewType,
          url,
          title,
          active: leaf === this.app.workspace.activeLeaf
        });
      }
    });
    return { tabs };
  }
}

module.exports = BrowserBridgePlugin;
