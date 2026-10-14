/*
 * MarinaOS local mode
 * -------------------
 * When MarinaOS is published as a claude.ai Artifact, the page gets a shared
 * database, sign-in, file storage and downloads from claude.ai (window.claude).
 *
 * When you open index.html anywhere else (your computer, GitHub Pages, any
 * static host), window.claude does not exist. This file provides a stand-in
 * with the same interface so the app still runs:
 *
 *   db         -> browser localStorage (one key per collection)
 *   assets     -> browser IndexedDB (photos, PDFs and other attachments)
 *   user       -> a single local user
 *   downloads  -> a normal browser download
 *
 * Data in local mode lives only in the browser you use. It is not shared with
 * anyone and is lost if you clear site data. Use claude.ai for shared use.
 */
(function () {
  "use strict";
  if (window.claude && window.claude.use) return; // running on claude.ai: use the real platform

  var PREFIX = "marinaos.local.";
  var subs = {}; // collection -> Set of listeners
  var LOCAL_ID = "local-user";

  function load(col) {
    try { return JSON.parse(localStorage.getItem(PREFIX + col) || "{}"); } catch (e) { return {}; }
  }
  function store(col, data) {
    try { localStorage.setItem(PREFIX + col, JSON.stringify(data)); }
    catch (e) { var err = new Error("Browser storage is full"); err.code = "quota_exceeded"; throw err; }
  }
  function snapshotOf(col) {
    var data = load(col);
    var docs = Object.keys(data).sort().map(function (id) {
      var body = data[id];
      return { id: id, exists: true, data: function () { return body; }, metadata: { fromCache: false, hasPendingWrites: false } };
    });
    return { docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function notify(col) {
    (subs[col] || new Set()).forEach(function (fn) { try { fn(snapshotOf(col)); } catch (e) { console.error(e); } });
  }
  window.addEventListener("storage", function (e) {
    if (e.key && e.key.indexOf(PREFIX) === 0) notify(e.key.slice(PREFIX.length));
  });
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(a, b) {
    Object.keys(b).forEach(function (k) {
      var v = b[k];
      if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) merge(a[k], v);
      else a[k] = v;
    });
    return a;
  }

  function docRef(col, id) {
    id = id || newId();
    return {
      id: id,
      path: col + "/" + id,
      get: function () {
        var d = load(col)[id];
        return Promise.resolve({ id: id, exists: !!d, data: function () { return d; }, metadata: { fromCache: false, hasPendingWrites: false } });
      },
      set: function (body) {
        var all = load(col); all[id] = clone(body); store(col, all); notify(col); return Promise.resolve();
      },
      update: function (body) {
        var all = load(col);
        if (!all[id]) { var e = new Error("Document does not exist"); e.code = "invalid_argument"; return Promise.reject(e); }
        all[id] = merge(all[id], clone(body)); store(col, all); notify(col); return Promise.resolve();
      },
      delete: function () { var all = load(col); delete all[id]; store(col, all); notify(col); return Promise.resolve(); },
      onSnapshot: function (next) {
        var fn = function (s) { var d = s.docs.find(function (x) { return x.id === id; }); next(d || { id: id, exists: false, data: function () {}, metadata: {} }); };
        (subs[col] = subs[col] || new Set()).add(fn); setTimeout(function () { fn(snapshotOf(col)); }, 0);
        return function () { subs[col].delete(fn); };
      }
    };
  }
  function collectionRef(col) {
    return {
      path: col,
      doc: function (id) { return docRef(col, id); },
      add: function (body) { var r = docRef(col); return r.set(body).then(function () { return r; }); },
      get: function () { return Promise.resolve(snapshotOf(col)); },
      onSnapshot: function (next) {
        (subs[col] = subs[col] || new Set()).add(next);
        setTimeout(function () { next(snapshotOf(col)); }, 0);
        return function () { subs[col].delete(next); };
      },
      where: function () { return this; }, orderBy: function () { return this; }, limit: function () { return this; }
    };
  }
  var db = {
    collection: collectionRef,
    doc: function (path) { var p = path.split("/"); return docRef(p.slice(0, -1).join("/"), p[p.length - 1]); }
  };

  // ----- Attachments in IndexedDB -----
  var urls = {};
  var idbReady = new Promise(function (resolve) {
    if (!window.indexedDB) return resolve(null);
    var req = indexedDB.open("marinaos-assets", 1);
    req.onupgradeneeded = function () { req.result.createObjectStore("assets", { keyPath: "id" }); };
    req.onsuccess = function () {
      var idb = req.result;
      var tx = idb.transaction("assets", "readonly");
      var all = tx.objectStore("assets").getAll();
      all.onsuccess = function () { (all.result || []).forEach(function (a) { urls[a.id] = URL.createObjectURL(a.blob); }); resolve(idb); };
      all.onerror = function () { resolve(idb); };
    };
    req.onerror = function () { resolve(null); };
  });
  window.__marinaBlobURL = function (id) { return urls[id] || ""; };
  var assets = {
    upload: function (file) {
      return idbReady.then(function (idb) {
        if (!idb) { var e = new Error("File storage unavailable"); e.code = "unavailable"; throw e; }
        var id = newId();
        return new Promise(function (resolve, reject) {
          var tx = idb.transaction("assets", "readwrite");
          tx.objectStore("assets").put({ id: id, blob: file, type: file.type });
          tx.oncomplete = function () { urls[id] = URL.createObjectURL(file); resolve({ id: id, url: urls[id], sizeBytes: file.size, contentType: file.type || "application/octet-stream" }); };
          tx.onerror = function () { var e = new Error("Could not store file"); e.code = "quota_exceeded"; reject(e); };
        });
      });
    },
    list: function () { return Promise.resolve({ assets: Object.keys(urls).map(function (id) { return { id: id, url: urls[id] }; }), usage: {} }); },
    delete: function (id) { return idbReady.then(function (idb) { if (idb) idb.transaction("assets", "readwrite").objectStore("assets").delete(id); delete urls[id]; return {}; }); }
  };

  // ----- Single local user -----
  function localName() { try { return localStorage.getItem(PREFIX + "name") || ""; } catch (e) { return ""; } }
  var user = {
    id: function () { return Promise.resolve(LOCAL_ID); },
    me: function () { return Promise.resolve({ id: LOCAL_ID, name: localName(), avatarUrl: "", color: "#0B7A83", email: null, isOwner: true, canEdit: true }); },
    can: function () { return Promise.resolve(true); },
    canEdit: function () { return true; },
    isOwner: function () { return true; },
    profiles: function (ids) {
      var out = {}; [].concat(ids).forEach(function (id) { out[id] = { id: id, name: id === LOCAL_ID ? (localName() || "You") : "", avatarUrl: "", color: "#0B7A83", email: null, isMe: id === LOCAL_ID, guest: false }; });
      return Promise.resolve(out);
    }
  };

  // ----- Downloads -----
  var downloads = {
    save: function (req) {
      var blob = req.data instanceof Blob ? req.data : new Blob([req.data]);
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = req.filename || "download";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      return Promise.resolve({ saved: true });
    }
  };

  // ----- Example data on first run -----
  function seed() {
    try { if (localStorage.getItem(PREFIX + "seeded")) return; localStorage.setItem(PREFIX + "seeded", "1"); } catch (e) { return; }
    if (Object.keys(load("vessels")).length) return;
    var t = new Date(); var d = function (n) { var x = new Date(t.getTime() + n * 864e5); return x.toISOString().slice(0, 10); };
    store("vessels", {
      v1: { name: "Example Work Boat", type: "Work boat", status: "Operational", order: 1, engineHours: 1200, hoursDate: d(-2), preChecks: "Fuel level checked\nBilge dry and pump working\nNav lights and horn working\nVHF radio check", postChecks: "Engines flushed\nBattery isolators off\nVessel secured", locations: "Home berth\nFuel dock" },
      v2: { name: "Example Shore Base", type: "Shore base", status: "Operational", order: 2 }
    });
    store("items", {
      i1: { kind: "safetyCheck", vesselId: "v1", title: "Lifejackets inspected", category: "Life saving", interval: "Monthly", lastDone: d(-20), steps: "Cylinders seated and in date\nStraps and buckles intact" },
      i2: { kind: "equipExpiry", vesselId: "v1", title: "EPIRB battery", location: "Wheelhouse", etype: "Expiring", expiry: d(14), remind: "1 month before" },
      i3: { kind: "maintenance", vesselId: "v1", title: "Outboard 100-hour service", system: "Outboard engine", interval: "6 monthly", intervalHours: 100, lastDone: d(-150), lastHours: 1130 },
      i4: { kind: "defect", vesselId: "v1", title: "Port nav light flickering", priority: "Medium", state: "Open", dueDate: d(5) },
      i5: { kind: "vesselCert", vesselId: "v1", title: "Certificate of Survey", certType: "Renewable certificate", expiry: d(200) },
      i6: { kind: "incident", vesselId: "v2", title: "Slip on wet pontoon", category: "Near miss", date: d(-6), state: "For review", severity: "Minor" },
      i7: { kind: "crewMember", title: "Example Skipper", role: "Skipper" },
      i8: { kind: "crewMember", title: "Example Deckhand", role: "Deckhand" },
      i9: { kind: "drill", vesselId: "v1", title: "Person overboard", interval: "Quarterly" }
    });
  }
  seed();

  var caps = { db: db, user: user, assets: assets, downloads: downloads };
  window.claude = { use: function (name) { return Promise.resolve(caps[name] || null); }, __localMode: true };
})();
