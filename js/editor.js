// textArea --> inputArea

import { createHighlighter } from 'https://esm.sh/shiki@4.2.0'

 const grammars = await Promise.all([
        fetch('https://raw.githubusercontent.com/cfleiner/fodot-syntax-highlighter/refs/heads/main/syntaxes/fodot.tmLanguage.json').then(r => r.json()),
        fetch('https://raw.githubusercontent.com/cfleiner/fodot-syntax-highlighter/refs/heads/main/syntaxes/fodot.display.tmLanguage.json').then(r => r.json()),
        fetch('https://raw.githubusercontent.com/cfleiner/fodot-syntax-highlighter/refs/heads/main/syntaxes/fodot.procedure.tmLanguage.json').then(r => r.json()),
        fetch('https://raw.githubusercontent.com/cfleiner/fodot-syntax-highlighter/refs/heads/main/syntaxes/fodot.structure.tmLanguage.json').then(r => r.json()),
        fetch('https://raw.githubusercontent.com/cfleiner/fodot-syntax-highlighter/refs/heads/main/syntaxes/fodot.theory.tmLanguage.json').then(r => r.json()),
        fetch('https://raw.githubusercontent.com/cfleiner/fodot-syntax-highlighter/refs/heads/main/syntaxes/fodot.vocabulary.tmLanguage.json').then(r => r.json()),
        ])

    const themeSelect = document.getElementById("theme-select");

    const themes = Array.from(themeSelect.options).map(opt => opt.value);

    const highlighter = await createHighlighter({
        langs: grammars,
        themes: themes
    })

export async function updateHighlighting(inputArea, themeSelect) {
            const highlightLayer = document.getElementById("highlight-layer");
            const lineHeight = parseFloat(getComputedStyle(inputArea).lineHeight);
            const scrollTop = inputArea.scrollTop;
            const scrollLeft = inputArea.scrollLeft;

            const code = inputArea.value;

            const html = await highlighter.codeToHtml(code, {
                lang: "FODOT",
                theme: themeSelect.value
            });

            highlightLayer.innerHTML = html;

            const pre = highlightLayer.querySelector("pre");
            
            if (pre) {
                pre.style.transform =
                    `translate(${-scrollLeft}px, ${-scrollTop}px)`;

                const theme = highlighter.getTheme(themeSelect.value);
                const con = document.querySelector(".code-container");
            
                inputArea.style.caretColor = theme.fg;
                con.style.backgroundColor = theme.bg;              
            }

            const lineNumbers = document.querySelector('#line-numbers');
            lineNumbers.textContent = getLineNumberArray(inputArea);        
        };


export function getCursorPosition(textArea) {
            const pos = textArea.selectionStart;
            const text = textArea.value;

            let line = 1;
            let lastBreak = -1;

            for (let i = 0; i < pos; i++) {
                if (text[i] === "\n") {
                    line++;
                    lastBreak = i;
                }
            }

            const col = pos - lastBreak;
            return {"line": line, "col": col }

        }


 export function getLineNumberArray(textArea) {
            const lines = textArea.value.split("\n").length;
            return Array.from({ length: lines }, (_, i) => i + 1).join("\n");
        }



  export function syncScroll(textArea, lineNumbers) {
        const pre = document.querySelector("#highlight-layer pre");

        if (!pre || !lineNumbers) return;

        const x = -textArea.scrollLeft;
        const y = -textArea.scrollTop;

        pre.style.transform = `translate(${x}px, ${y}px)`;

        const lineHeight = parseFloat(getComputedStyle(textArea).lineHeight);


        lineNumbers.style.transform = `translateY(${y}px)`;
        }



const asciiToUnicodeMap = [
  ["<=>", "⇔"],
  ["=>", "⇒"],
  ["<=", "⇐"],
  [">=", "≥"],
  ["~=", "≠"],
  [":=", "≜"],
  ["<-", "←"],
  ["->", "→"],
  ["<:", "⊆"],
  [":>", "⊇"],

  ["!", "∀"],
  ["?", "∃"],
  ["~", "¬"],
  ["|", "∨"],
  ["&", "∧"],

  ["Bool", "𝔹"],
  ["Int", "ℤ"],
  ["Real", "ℝ"],
  ["TIMES", "×"]
];


const unicodeToAsciiMap = asciiToUnicodeMap
  .slice()
  .reverse()
  .map(([a, b]) => [b, a]);


export function replaceASCII(text, yes) {
    const map = yes ? asciiToUnicodeMap : unicodeToAsciiMap;
    for (const [from, to] of map) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
        text = text.replace(new RegExp(escaped, "g"), to);
    }
    return text;
    }




// Inspect +++++++++++++++++++++++++++


export function inspectPosition(offset, code) {
        const tokens = highlighter.codeToTokens(code, {
                lang: "FODOT",
                theme: themeSelect.value,
                includeExplanation: true
            })

        const { line, column } = getLineCol(code, offset)
        const token = getTokenAt(tokens, line, column)

        if (!token) return

        showDialog({
            code: token.content,
            pos: `(Ln: ${line+1}, Col: ${column+1})`,
            color: token.color,
            explanation: token.explanation
        })
    }

   function getLineCol(text, offset) {
            const lines = text.slice(0, offset).split('\n')
            const line = lines.length - 1
            const column = lines[lines.length - 1].length
            return { line, column }
        }

        function getTokenAt(tokens, line, column) {
            const lineTokens = tokens.tokens[line]
            if (!lineTokens) return null

            let currentOffset = 0

            for (const token of lineTokens) {
                const start = currentOffset
                const end = currentOffset + token.content.length

                if (column >= start && column < end) {
                return token
                }

                currentOffset = end
            }

            return null
        }

function createScopeList(data) {
    const ol = document.createElement("ol");

    data.forEach(item => {
        const li = document.createElement("li");

        // extract scope names
        const scopes = item.scopes.map(s => s.scopeName).join(", ");
        li.innerHTML = `<span style="font-family: monospace;font-style:bold;">${item.content}</span>   : <span style="font-style:italic;">${scopes}</span`;
        ol.appendChild(li);
    });

    return ol;
}


        function showDialog(info) {
            const title = document.querySelector('#inspector-title');
            const pos   = document.querySelector('#inspector-pos');

            const content = document.querySelector('#inspector-content');
            title.parentElement.parentElement.setAttribute("open", "")
            title.textContent = info.code
            title.style.color = info.color
            pos.textContent = info.pos
            content.innerHTML = ""
            content.appendChild(createScopeList(info.explanation));

        }

