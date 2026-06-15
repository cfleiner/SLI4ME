let pyodide;
let pyodide_version;
let sli_wheel_link;
let emscripten_version;
const emscripten_mapping = {
  "4.0.9": "0.29.1"
};
class IoWriter {
  constructor() {
    this.isatty = false;
  }

  write(buffer) {
    let length = buffer.length;
    raw_display(new TextDecoder().decode(buffer));
    return length;
  }
}
let stdout = new IoWriter();
let stderr = new IoWriter();
let py_exec;

function loading(value) {
  postMessage({ type: "disable", value });
  postMessage({ type: "loading", value });
}

function display(value) {
  postMessage({ type: "display", value });
}

function raw_display(value) {
  postMessage({ type: "raw_display", value });
}

function harderror(value) {
  postMessage({ type: "disable", value: true });
  postMessage({ type: "display", value });
}

async function init(sli_wheel_link) {
  const re = /emscripten_(\d+)_(\d+)_(\d+)/g;
  let match = sli_wheel_link.matchAll(re);
  let next = match.next();
  let value;
  while (!next.done) {
    value = next.value;
    next = match.next();
  }
  if (value === undefined) {
    harderror(
      `error: could not find emscripten version in link to sli_lib wheel, given sli_lib link: ̈"${sli_wheel_link}"`
    )
    return;
  }
  emscripten_version = `${value[1]}.${value[2]}.${value[3]}`;
  const pyodide_version = emscripten_mapping[emscripten_version];
  if (pyodide_version === undefined) {
    harderror(
      `error: no matching pyodide version for given emscripten version, found emscripten version: "${emscripten_version}"`
    )
    return;
  }
  if (py_exec !== undefined) {
    py_exec.destroy()
  }
  let pyodide_module = await import(`https://cdn.jsdelivr.net/pyodide/v${pyodide_version}/full/pyodide.mjs`);
  pyodide = await pyodide_module.loadPyodide();
  await pyodide.loadPackage("micropip");
  pyodide.setStdout(stdout);
  pyodide.setStderr(stderr);
  try {
    const these_locals = await pyodide.runPythonAsync(`
these_locals = dict()
these_locals
`)
    await pyodide.runPythonAsync(`
import micropip
import asyncio
await micropip.install("${sli_wheel_link}")
def exec(kb_str):
  import sys
  from sli_lib.fodot.knowledge_base import Procedure
  from sli_lib.fodot import KnowledgeBase
  kb = KnowledgeBase.from_str(kb_str)
  try:
      block = kb["main"]
  except KeyError:
      print("error: No procedure with name \\"main\\" found.", file=sys.stderr)
      return
  if isinstance(block, Procedure):
      block()
  else:
      print(f"error: Cannot execute a {type(block).__name__.lower()}", file=sys.stderr)
      return
  `,
      { "locals": these_locals }
    )
    py_exec = these_locals["exec"];
  } catch (error) {
    harderror(`error when loading sli_lib wheel: \n ${error}`)
    return;
  }
}

async function exec(kb) {
  try {
    py_exec(kb);
  } catch (error) {
    display(error.toString())
  }
}

async function main() {
  onmessage = async (event) => {
    if (event.data["type"] == "init_pyodide") {
      loading(true);
      await init(event.data["value"]);
      loading(false);
    } else if (event.data["type"] == "exec") {
      exec(event.data["value"])
    }
  };
}

main();
