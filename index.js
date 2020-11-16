const express = require('express');
const fs = require('fs');
const util = require('util');
var compressor = require('node-minify');

const readFile = util.promisify(fs.readFile);

const app = express();
app.use(express.static('public'))
const port = 8082;

let mainScript = [
    "microBlock-IDE/blockly/closure/goog/base.js",
    { file: "microBlock-IDE/blockly/blockly_compressed.js", minify: true },
    { file: "microBlock-IDE/blockly/blocks_compressed.js", minify: true },
    { file: "microBlock-IDE/blockly/python_compressed.js", minify: true },
    "microBlock-IDE/blockly/msg/js/en.js",

    "microBlock-IDE/blockly/blocks/procedures.js",

    "microBlock-IDE/blocks/blocks_pin.js", 
    "microBlock-IDE/blocks/blocks_controls.js", 
    "microBlock-IDE/blocks/blocks_operators.js", 
    "microBlock-IDE/blocks/blocks_variables.js", 
    "microBlock-IDE/blocks/blocks_advanced.js", 
    "microBlock-IDE/blocks/blocks_text_code.js", 

    "microBlock-IDE/blocks/generators_pin.js", 
    "microBlock-IDE/blocks/generators_controls.js", 
    "microBlock-IDE/blocks/generators_avanced.js", 
    "microBlock-IDE/blocks/generators_text_code.js", 
    "microBlock-IDE/blocks/generators_procedures.js", 

    // Lib
    { file: "scripts/prism.js", minify: true },
    "scripts/prism.css",

    // Add on script
    "scripts/load.js",
    "scripts/load.css",

    "scripts/css/blockStyle.css"
];

let minifyFiles = async (files) => {
    let content = { js: "", css: "" };
    for (let file of files) {
        console.log("minify:", file);
        let type = file.endsWith("js") ? "js" : "css";
        content[type] += `/* File: ${file} */\n`;
        content[type] += await (async () => {
            try {
                return await compressor.minify({
                    compressor: type === "js" ? 'uglify-es' : 'clean-css',
                    input: file,
                    output: "dumy"
                });
            } catch (error) {
                console.warn(`minify: ${file} error`, error.toString());
                return await readFile(file, 'utf8');
            }
        })();
        content[type] += `\n`;
    }
    return content;
}

let getContentFromList = async (list) => {
    let js = "", css = "";
    for (let f of list.filter(f => typeof f === "object").filter(f => f.file.endsWith("js")).map(f => f.file)) {
        js += await readFile(f, 'utf8');
    }
    for (let f of list.filter(f => typeof f === "object").filter(f => f.file.endsWith("css")).map(f => f.file)) {
        css += await readFile(f, 'utf8');
    }
    let out = await minifyFiles(list.filter(f => typeof f === "string"));
    js += out.js;
    css += out.css;
    return { js, css };
};

let cssToJavaScript = async (css) => {
    return `
(function() {
let styleSheetElement = document.createElement("style");
styleSheetElement.type = "text/css";
styleSheetElement.innerText = \`${css}\`;
document.head.appendChild(styleSheetElement);
})();`;
}

let listToJavaScript = async (list) => {
    let js = "";
    let out = await getContentFromList(list);
    js += out.js;
    js += await cssToJavaScript(out.css);
    return js;
}

let getMainScript = async () => {
    return await listToJavaScript(mainScript);
}

/* For Fixed error */
__Function = () => "";
__Number = 0;
__Text = "";
__Array = [];

boardsObj = [];
addBoard = (board) => {
    boardsObj.push(board);
}

Function(fs.readFileSync("./microBlock-IDE/js/lodash.min.js"))();

Function(fs.readFileSync("./microBlock-IDE/boards/kidbright32/index.js"))();
Function(fs.readFileSync("./microBlock-IDE/boards/kidbright32-v1.3/index.js"))();
Function(fs.readFileSync("./microBlock-IDE/boards/kidbright32-v1.5/index.js"))();
Function(fs.readFileSync("./microBlock-IDE/boards/kidbright32i/index.js"))();
Function(fs.readFileSync("./microBlock-IDE/boards/kidbright32-v1.6/index.js"))();

let getBoardScript = async (boardId) => {
    let board = boardsObj.find(board => board.id === boardId);
    let boardScript = [];
    boardScript = boardScript.concat(board.script);
    boardScript = boardScript.concat(board.css);
    boardScript = boardScript.concat(board.blocks);

    boardScript = boardScript.map(f => `microBlock-IDE/boards/${board.id}/${f}`);

    return await listToJavaScript(boardScript);
}

app.get('/embed.js', async (req, res) => {
    let content = "";
    content += `rootPath = "https://ide.microblock.app/";\n`;
    content += `boardId = "kidbright32i";\n`;
    content += `\n`;
    content += await getMainScript();

    res.type('.js').status(200).send(content);
});

app.get('/embed.:boardId.js', async (req, res) => {
    let content = "";
    content += await getBoardScript(req.params["boardId"]);

    res.type('.js').status(200).send(content);
});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
});
