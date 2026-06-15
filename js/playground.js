import {disable, loading, addCard, readIdpFile} from './etc.js'
import { updateHighlighting } from './editor.js';
import {getVersionMap} from './webSLI.js'

let runButton;
let versionSelect;
let custom_version;
let version;
let knownVersions;
let latest_version;
let url;
let worker;



async function init() {
  const inputArea = document.getElementById("input-area");
  const themeSelect = document.querySelector('#theme-select');
  
  const example = await readIdpFile("https://raw.githubusercontent.com/cfleiner/SLI4ME/refs/heads/main/examples/", "base.idp");
  inputArea.value = example.code;
  updateHighlighting(inputArea, themeSelect);


    knownVersions = await getVersionMap() 
    // 1. Get all the keys (version numbers) as an array
    const keys = Object.keys(knownVersions);

    if (keys.length > 0) {
        // 2. Get the last key in that array
        const lastKey = keys[keys.length - 1];
        
        // 3. Set the "latest" key to the value of the last key
        knownVersions["latest"] = knownVersions[lastKey];
    }
    versionSelect = document.getElementById("version");
    runButton = document.getElementById("run-button");

    // ✅ Populate dropdown
    let i = 0;
    for (let version in knownVersions) {
      const opt = document.createElement("option");
      opt.textContent = version;
      opt.value = version;
      versionSelect.add(opt, i++);
    }

  const params = new URLSearchParams(window.location.search);
  const curVersion = params.get("version");

  if (curVersion !== null) {
    setVersion(curVersion);
  } else {
    setVersion("latest");
  }

  versionSelect.onchange = async () => {
    await changeVersionRestart();
  };

  const customFetch = document.getElementById("custom-fetch");

  if (customFetch) {
    customFetch.onclick = async () => {
      const url = customText.value;

      const params = new URLSearchParams(window.location.search);
      params.set("version", url);

      window.history.replaceState(null, null, "?" + params.toString());
      await restartWorker();
    };
  }

  await changeVersionRestart();
}

init();


function setVersion(version) {
  const known_version = knownVersions[version] !== undefined;
  if (known_version) {
    versionSelect.value = version;
  } else {
    versionSelect.value = "custom";
    custom_version.value = version;
  }
}

function setURL(version) {
  url = knownVersions[version];
}


async function changeVersionRestart() {
  // version_display()
  if (versionSelect.value != "custom") {
    version = versionSelect.value;
    let params = new URLSearchParams(window.location.search);
    params.set("version", version);
    window.history.replaceState(null, null, "?" + params.toString());
    setURL(version);
    await restart();
  }
}

export function executeCode(code) {
  worker.postMessage({
      type: "exec",
      value: code,
  });
}

let model_output = {};

async function loadWorker() {
      const url = versionSelect.value === 'custom' ? customText.value : (knownVersions[versionSelect.value] || 'backend.js');
      if (worker) worker.terminate();
          disable(runButton, true)
          loading(runButton, true)
      worker = new Worker("backend.js", { type: "module" });
      worker.postMessage({ type: "init_pyodide", value: url });
      worker.onmessage = (event) => {
          const { type, value } = event.data;
          if (type === "loading") {
              disable(runButton, value)
              loading(runButton, value)
          } else if (type === "display" || type === "raw_display") {
              const value = event.data["value"];

              if (value.startsWith('===')) {
                model_output.title = value;

              } else if("title" in model_output){
                model_output.content = value;
                addCard(model_output);
                model_output = {};

              } else {
                if(value.startsWith("PythonError")) {
                    addCard({"title": value}, "error");
                  } else if(!value.startsWith("\n")) {
                    addCard({"title": value}, "info");
                }
              }
          }
      };
}


export async function killWorker() {
  if (worker !== undefined) {
      worker.terminate();
      await loadWorker();
  }
}

async function restart() {
  if (worker !== undefined) {
    worker.terminate();
  }
  await loadWorker();
}
