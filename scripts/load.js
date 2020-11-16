window.microBlock = {
    workspaces: [ ],
    reload: function() {
        console.log("microBlock reload");
        for (let workspace of window.microBlock.workspaces) {
            workspace.workspace.dispose()
        }
        let elems = document.querySelectorAll(".microBlock-embed");
        for (let blocklyDiv of elems) {
            blocklyDiv.style.height = "20px";
            blocklyDiv.innerHTML = "";

            let option = {
                media: 'https://ide.microblock.app/blockly/media/',
                grid : {
                    spacing : 25, 
                    length : 1, 
                    colour : '#888', 
                    snap : true
                },
                trashcan : false,
                zoom: {
                    controls: false,
                    wheel: false,
                    startScale: 1,
                    maxScale: 2,
                    minScale: 0.3,
                    scaleSpeed: 1.2
                },
                scrollbars : false,
                comments : false, 
                disable : false, 
                maxBlocks : Infinity, 
                rtl : false, 
                oneBasedIndex : false, 
                sounds : false, 
                readOnly: true
            };

            let blocklyWorkspace = Blockly.inject(blocklyDiv, option);

            let code = blocklyDiv.getAttribute("data-xml");
            if (code) {
                code = atob(code);
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(code), blocklyWorkspace);
            }

            // Resize
            let height = 0;
            if (blocklyDiv.getAttribute("data-height")) {
                height = +blocklyDiv.getAttribute("data-height");
            } else {
                height = blocklyDiv.querySelector(".blocklyBlockCanvas").getBBox().height;
            }
            blocklyDiv.style.height = `${height + 20}px`;
            Blockly.svgResize(blocklyWorkspace);

            let menuShow = blocklyDiv.getAttribute("data-menu");
            if ( menuShow === null || +menuShow === 1) {
                let divMenu = document.createElement("div");
                divMenu.innerHTML = `
                <ul>
                    <li class="active"><a href="#">Block</a>
                    <li><a href="#">Code</a>
                </ul>
                `;
                divMenu.classList.add("tool-menu");
                blocklyDiv.appendChild(divMenu);

                for (let aElet of blocklyDiv.querySelectorAll("li > a")) {
                    aElet.addEventListener("click", function(e) {
                        e.preventDefault();

                        let mode = this.innerText;
                        if (mode === "Block") {
                            blocklyDiv.querySelector(".code-box").style.display = "none";
                            blocklyDiv.querySelector(".injectionDiv").style.display = "block";

                            let { width , height } = blocklyDiv.querySelector(".blocklyBlockCanvas").getBBox();
                            blocklyDiv.style.height = `${height + 20}px`;
                            Blockly.svgResize(blocklyWorkspace);
                        } else if (mode === "Code") {
                            let code = Blockly.Python.workspaceToCode(blocklyWorkspace);
                            blocklyDiv.querySelector(".code-box code").innerHTML = code;
                            blocklyDiv.querySelector(".code-box").style.display = "block";
                            blocklyDiv.querySelector(".injectionDiv").style.display = "none";

                            blocklyDiv.style.height = `auto`;
                            Prism.highlightAll();
                        }

                        for (let liElet of blocklyDiv.querySelectorAll("li")) {
                            liElet.classList.remove("active");
                        }
                        this.parentNode.classList.add("active");
                    });
                }
                
                let divCodeBox = document.createElement("div");
                divCodeBox.innerHTML = `<pre><code class="language-python"></code></pre>`;
                divCodeBox.classList.add("code-box");
                blocklyDiv.appendChild(divCodeBox);
            }

            window.microBlock.workspaces.push({
                dom: blocklyDiv,
                workspace: blocklyWorkspace
            });
        }
    }
}

window.microBlock.reload();
