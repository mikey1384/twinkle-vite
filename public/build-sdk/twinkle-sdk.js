/**
 * Twinkle Build SDK
 * Provides database operations for builds running in sandboxed iframes.
 * Uses sql.js (SQLite compiled to WebAssembly) for client-side database operations.
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.Twinkle) return;

  let SQL = null;
  let db = null;
  let isInitialized = false;
  let pendingRequests = new Map();
  let requestId = 0;

  // Generate unique request ID
  function getRequestId() {
    return `twinkle_${++requestId}_${Date.now()}`;
  }

  // Send message to parent and wait for response
  function sendRequest(type, payload) {
    return new Promise((resolve, reject) => {
      const id = getRequestId();
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }, 30000);

      pendingRequests.set(id, { resolve, reject, timeout });

      window.parent.postMessage({
        source: 'twinkle-build',
        id,
        type,
        payload
      }, '*');
    });
  }

  // Handle messages from parent
  window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || data.source !== 'twinkle-parent') return;

    const pending = pendingRequests.get(data.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingRequests.delete(data.id);

    if (data.error) {
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.payload);
    }
  });

  // Load sql.js library
  async function loadSqlJs() {
    if (SQL) return SQL;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
      script.onload = async () => {
        try {
          SQL = await window.initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
          });
          resolve(SQL);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(script);
    });
  }

  // The Twinkle SDK object
  window.Twinkle = {
    db: {
      /**
       * Open the database. Loads existing data from server if available.
       * @returns {Promise<Object>} The sql.js database instance
       */
      async open() {
        if (db) return db;

        await loadSqlJs();

        try {
          const response = await sendRequest('db:load', {});

          if (response && response.data) {
            // Convert base64 to Uint8Array
            const binary = atob(response.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            db = new SQL.Database(bytes);
          } else {
            // Create new empty database
            db = new SQL.Database();
          }

          isInitialized = true;
          return db;
        } catch (err) {
          // If load fails, create empty database
          console.warn('Failed to load database, creating new one:', err);
          db = new SQL.Database();
          isInitialized = true;
          return db;
        }
      },

      /**
       * Save the database to the server.
       * @returns {Promise<Object>} Save result with sizeBytes and syncedAt
       */
      async save() {
        if (!db) {
          throw new Error('Database not opened. Call Twinkle.db.open() first.');
        }

        const data = db.export();
        // Convert Uint8Array to base64
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        const base64 = btoa(binary);

        const response = await sendRequest('db:save', { data: base64 });
        return response;
      },

      /**
       * Execute SQL and return results.
       * @param {string} sql - SQL query to execute
       * @param {Array} params - Optional parameters for prepared statement
       * @returns {Array} Array of result objects
       */
      exec(sql, params) {
        if (!db) {
          throw new Error('Database not opened. Call Twinkle.db.open() first.');
        }
        return db.exec(sql, params);
      },

      /**
       * Run SQL statement (for INSERT, UPDATE, DELETE).
       * @param {string} sql - SQL statement to run
       * @param {Array} params - Optional parameters for prepared statement
       */
      run(sql, params) {
        if (!db) {
          throw new Error('Database not opened. Call Twinkle.db.open() first.');
        }
        db.run(sql, params);
      },

      /**
       * Get all rows from a query as an array of objects.
       * @param {string} sql - SQL query
       * @param {Array} params - Optional parameters
       * @returns {Array<Object>} Array of row objects
       */
      query(sql, params) {
        if (!db) {
          throw new Error('Database not opened. Call Twinkle.db.open() first.');
        }
        const stmt = db.prepare(sql);
        if (params) stmt.bind(params);

        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },

      /**
       * Get the raw sql.js database instance.
       * @returns {Object|null} The sql.js Database instance
       */
      getDb() {
        return db;
      },

      /**
       * Check if database is initialized.
       * @returns {boolean}
       */
      isOpen() {
        return isInitialized && db !== null;
      },

      /**
       * Close the database (clears local instance, does not delete from server).
       */
      close() {
        if (db) {
          db.close();
          db = null;
          isInitialized = false;
        }
      }
    },

    /**
     * Build info provided by parent
     */
    build: {
      id: null,
      title: null,
      username: null
    },

    /**
     * Initialize SDK with build info from parent
     */
    _init(buildInfo) {
      this.build.id = buildInfo.id;
      this.build.title = buildInfo.title;
      this.build.username = buildInfo.username;
    }
  };

  // Request build info from parent on load
  sendRequest('init', {}).then(info => {
    if (info) {
      window.Twinkle._init(info);
    }
  }).catch(() => {
    // Ignore init errors
  });

  console.log('Twinkle SDK loaded');
})();
