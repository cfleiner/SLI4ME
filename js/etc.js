export function disable(element, value) {
  if (value) {
    element.setAttribute("disabled", "")
  } else {
    element.removeAttribute("disabled")
  }
}

export function loading(element, value) {
  if (value) {
    element.setAttribute('aria-busy', 'true')
  } else {
    element.removeAttribute('aria-busy')
  }
}


// export async function populateFileList(ulElement, basePath, extension, onFileClick) {
//     const res = await fetch(basePath);
//     const html = await res.text();

//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, "text/html");

//     const links = doc.querySelectorAll("a");
//     const hasHandler = typeof onFileClick === "function";


//     ulElement.innerHTML = "";

//     links.forEach(link => {
//         const href = link.getAttribute("href");
//         if (!href || !href.endsWith(extension)) return;

//         const file = href.split("/").pop();
//         if (!file) return;

//         const name = file
//             .replace(/\.[^/.]+$/, "")
//             .replace(/_/g, " ");

//         const li = document.createElement("li");
//         const a = document.createElement("a");

//         a.href = "#";
//         a.textContent = name;

//         if (hasHandler) {
//             a.addEventListener("click", (e) => {
//                 e.preventDefault();
//                 onFileClick(basePath, file);
//             });
//         }

//         li.appendChild(a);
//         ulElement.appendChild(li);
//     });
// }

export async function populateFileList(
  ulElement,
  apiUrl,
  extension,
  onFileClick
) {
  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.error("Failed to fetch file list:", res.status);
    return;
  }

  const files = await res.json();
  const hasHandler = typeof onFileClick === "function";

  ulElement.innerHTML = "";

  files.forEach(file => {
    // Only include files (not directories) with the right extension
    if (file.type !== "file" || !file.name.endsWith(extension)) return;

    const name = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/_/g, " ");

    const li = document.createElement("li");
    const a = document.createElement("a");

    a.href = "#";
    a.textContent = name;

    if (hasHandler) {
      a.addEventListener("click", (e) => {
        e.preventDefault();

        // Use raw download URL from GitHub API
        onFileClick(file.download_url, "");
      });
    }

    li.appendChild(a);
    ulElement.appendChild(li);
  });
}



export async function readIdpFile(basePath, file) {
  const res = await fetch(basePath + file);
  const text = await res.text();

  const parts = text.split(/\*\/\s*-+/);
  const desc = parts[0].replace(/\/\*\s*-+/, "");
  const desc_parts = desc.split(/\n\s*\n/);
  const code = parts[1] || "";

  return {
    "title": desc_parts[0].trim(),
    "desc": desc_parts[1].trim(),
    "code": code.trim()
  }
}

export async function handleIdpFile(basePath, file) {
    const fileContent = await readIdpFile(basePath, file)

    document.querySelector("#example-title").innerHTML =
        `<strong>${fileContent.title || ""}</strong>`;

    document.querySelector("#example-desc").textContent =
        fileContent.desc || "";

    const inputArea = document.querySelector("#input-area");
    inputArea.value = fileContent.code

    inputArea.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("#example-dropdown").removeAttribute("open");

}


 export function filterEditorThemes(themeSelect) {
    
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const options = themeSelect.querySelectorAll("option");

        let firstVisible = null;

        options.forEach(option => {
            const type = option.getAttribute("data-theme-type");

            const show = (isDark && type === "dark") || (!isDark && type === "light");

            option.hidden = !show;

            if (show && !firstVisible) {
            firstVisible = option;
            }
        });
    }


export function addCard(model_output, card_type) {
  const outputCards = document.getElementById("output-cards");
  const card = document.createElement("article");
  const header = document.createElement("header");
  const body = document.createElement("pre");

  body.className = "card-body";

  switch(card_type) {
    case "error":
      card.className = "error-card";
      if(model_output.title.includes("ValueError")) {
        header.textContent = "Invalid FO(·)";
        body.textContent = model_output.title.split("ValueError")[1];
      } else {
        header.textContent = "Error";
        body.textContent = model_output.title;
      }
      break;
    case "info":
      card.className = "info-card";
      header.textContent = "Info";
      body.textContent = model_output.title;
      break;
    default:
        header.textContent = model_output.title.replace(/=/g, "");
        body.textContent =  model_output.content
          .replace(/,(?![^()]*\))/g, ",\n\t")
          .replace(/\./g, ".\n");
  }
  header.addEventListener("click", () => {
          header.parentElement.classList.toggle("collapsed");
        });
  card.appendChild(header)
  card.appendChild(body);
  outputCards.appendChild(card);
}

export function getCurrentTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}
