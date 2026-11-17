"use strict";

const apiRoot = "https://api.github.com/repos/alekseydesgn-crypto/portl";
const pages = {
  "index.html": "Главная",
  "about.html": "Обо мне",
  "force-drop-zone.html": "Force Drop Zone",
  "emarket.html": "eMarket",
};
const page = document.querySelector("#page");
const fields = document.querySelector("#fields");
const status = document.querySelector("#status");
const frame = document.querySelector("#view");
const token = document.querySelector("#token");
const buttons = ["save", "preview", "publish"].map(id => document.getElementById(id));
let source, revision, path, edits, images;
let dirty = false;

async function request(endpoint, options = {}) {
  const { method = "GET", body, key, raw = false } = options;
  const headers = { Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json" };
  if (key) headers.Authorization = "Bearer " + key;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(apiRoot + endpoint, {
    method, headers, cache: "no-store", redirect: "error",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = new Error("GitHub вернул ошибку " + response.status + ".");
    error.status = response.status;
    throw error;
  }
  return raw ? response.text() : response.json();
}

function report(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
}

function localDraft() {
  return "portfolio-editor:" + path;
}

function parse() {
  return new DOMParser().parseFromString(source, "text/html");
}

function textNodes(doc) {
  return [...doc.querySelectorAll("body [data-ru][data-en], main h1, main h2, main h3, main p")]
    .filter(node => node.dataset.html === "true" ||
      (node.children.length === 0 && node.textContent.trim()));
}

function imageNodes(doc) {
  return [...doc.querySelectorAll("main img[src]")];
}

function field(label, value, update) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.textContent = label;
  const input = document.createElement("textarea");
  input.value = value;
  input.addEventListener("input", () => { update(input.value); dirty = true; });
  wrapper.append(input);
  return wrapper;
}

function group(label) {
  const section = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = label;
  section.append(summary);
  fields.append(section);
  return section;
}

function formatText(node, value) {
  // Multiline translated headings keep their existing line-break style.
  if (node.dataset.html !== "true") return value;
  const escaped = document.createElement("span");
  escaped.textContent = value;
  const lineBreak = node.innerHTML.match(/<br\b[^>]*>/i)?.[0] || "<br>";
  return escaped.innerHTML.replaceAll("\n", lineBreak);
}

function displayText(node, attr) {
  const value = attr ? node.getAttribute(attr) : node.textContent;
  if (node.dataset.html !== "true") return value;
  const template = document.createElement("template");
  template.innerHTML = value.replace(/<br\b[^>]*>/gi, "\n");
  return template.content.textContent;
}

function renderFields() {
  fields.replaceChildren();
  const doc = parse();
  const texts = group("Тексты");
  texts.open = true;
  textNodes(doc).forEach((node, index) => {
    const item = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = node.textContent.trim().replace(/\s+/g, " ").slice(0, 90);
    item.append(summary);
    const attrs = node.hasAttribute("data-ru") ? ["data-ru", "data-en"] : [""];
    for (const attr of attrs) {
      const key = index + ":" + attr;
      item.append(field(attr === "data-en" ? "English" : "Русский",
        edits[key] ?? displayText(node, attr), value => { edits[key] = value; }));
    }
    texts.append(item);
  });
  const photos = group("Фотографии");
  imageNodes(doc).forEach((node, index) => {
    const wrapper = document.createElement("label");
    wrapper.className = "field";
    wrapper.textContent = node.alt || node.getAttribute("src");
    const thumb = document.createElement("img");
    thumb.alt = "";
    thumb.src = images[index]?.url || new URL(node.getAttribute("src"), location.origin + "/");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
        if (!ext || file.size > 5 * 1024 * 1024) throw new Error("Выбери JPEG, PNG или WebP до 5 МБ.");
        const url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        images[index] = { url, ext };
        thumb.src = url;
        dirty = true;
      } catch (error) { report(error.message || "Не удалось прочитать фото.", true); }
    });
    wrapper.append(thumb, input);
    photos.append(wrapper);
  });
}

function render(preview = false, filePaths = {}) {
  const doc = parse();
  const nodes = textNodes(doc);
  for (const [key, value] of Object.entries(edits)) {
    const [index, attr] = key.split(":");
    const node = nodes[index];
    const formatted = formatText(node, value);
    if (attr) node.setAttribute(attr, formatted);
    if (attr !== "data-en") {
      if (node.dataset.html === "true") node.innerHTML = formatted;
      else node.textContent = value;
    }
  }
  const imageList = imageNodes(doc);
  for (const [index, image] of Object.entries(images)) {
    imageList[index].src = preview ? image.url : filePaths[index];
  }
  if (preview) {
    doc.querySelectorAll("script, base").forEach(node => node.remove());
    const base = doc.createElement("base");
    base.href = location.origin + "/";
    doc.head.prepend(base);
  }
  return "<!doctype html>\n" + doc.documentElement.outerHTML;
}

async function load(selected) {
  page.disabled = true;
  try {
    await loadPage(selected);
  } finally {
    page.disabled = false;
  }
}

async function loadPage(selected) {
  buttons.forEach(button => { button.disabled = true; });
  fields.replaceChildren();
  frame.hidden = true;
  document.querySelector("#publishing").hidden = true;
  report("Загружаю страницу…");
  const head = (await request("/git/ref/heads/main")).object.sha;
  const html = await request("/contents/" + selected + "?ref=" + head, { raw: true });
  path = selected;
  revision = head;
  source = html;
  edits = {};
  images = {};
  dirty = false;
  const saved = JSON.parse(localStorage.getItem(localDraft()) || "null");
  if (saved?.source === source) {
    edits = saved.edits;
    images = saved.images;
  }
  renderFields();
  buttons.forEach(button => { button.disabled = false; });
  document.querySelector("#publishing").hidden = false;
  report(saved && saved.source !== source
    ? "Страница изменилась на GitHub. Старый черновик сохранён в этом браузере."
    : saved ? "Открыт сохранённый черновик." : "");
}

async function publish() {
  const key = token.value.trim();
  token.value = "";
  if (!key) throw new Error("Введи ключ GitHub для публикации.");
  if (!Object.keys(edits).length && !Object.keys(images).length) throw new Error("На странице пока нет правок.");
  const head = (await request("/git/ref/heads/main", { key })).object.sha;
  if (head !== revision) {
    const latest = await request("/contents/" + path + "?ref=" + head, { key, raw: true });
    if (latest !== source) throw new Error("Эту страницу уже изменили на GitHub. Сохрани черновик перед обновлением.");
  }
  const parent = await request("/git/commits/" + head, { key });
  const post = body => ({ method: "POST", key, body });
  const filePaths = {};
  const tree = [];
  for (const [index, image] of Object.entries(images)) {
    const name = path.replace(".html", "");
    const filename = "assets/img/editor/" + name + "-" + crypto.randomUUID() + "." + image.ext;
    const blob = await request("/git/blobs", post({ content: image.url.split(",")[1], encoding: "base64" }));
    tree.push({ path: filename, mode: "100644", type: "blob", sha: blob.sha });
    filePaths[index] = filename;
  }
  tree.push({ path, mode: "100644", type: "blob", content: render(false, filePaths) });
  const nextTree = await request("/git/trees", post({ base_tree: parent.tree.sha, tree }));
  const commit = await request("/git/commits", post({
    message: "Update portfolio page " + path, tree: nextTree.sha, parents: [head],
  }));
  await request("/git/refs/heads/main", { method: "PATCH", key, body: { sha: commit.sha, force: false } });
  localStorage.removeItem(localDraft());
  await load(path);
  report("Отправлено на GitHub. Обновление сайта появится после сборки.");
}

for (const [value, label] of Object.entries(pages)) page.add(new Option(label, value));
page.addEventListener("change", () => {
  if (dirty && !confirm("Переключить страницу без сохранения последних правок?")) {
    page.value = path;
    return;
  }
  load(page.value).catch(error => report(error.status === 404 ? "Эта страница ещё не опубликована." : error.message, true));
});
buttons[0].addEventListener("click", () => {
  try {
    localStorage.setItem(localDraft(), JSON.stringify({ source, edits, images }));
    dirty = false;
    report("Черновик сохранён в этом браузере.");
  } catch { report("В браузере не хватает места для черновика. Попробуй фотографии меньшего размера.", true); }
});
buttons[1].addEventListener("click", () => {
  frame.hidden = false;
  frame.srcdoc = render(true);
  frame.scrollIntoView({ block: "start" });
});
buttons[2].addEventListener("click", async () => {
  buttons.forEach(button => { button.disabled = true; });
  page.disabled = true;
  report("Публикую…");
  try { await publish(); }
  catch (error) { report(error.message, true); }
  finally {
    buttons.forEach(button => { button.disabled = false; });
    page.disabled = false;
  }
});
load(page.value).then(async () => {
  try {
    await request("/contents/roku.html?ref=" + revision, { raw: true });
    page.add(new Option("ROKU", "roku.html"));
  } catch (error) {
    if (error.status !== 404) console.warn("Не удалось проверить наличие страницы ROKU.");
  }
}).catch(error => report(error.message, true));
