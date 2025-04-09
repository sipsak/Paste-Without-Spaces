// ==UserScript==
// @name            Paste Without Spaces
// @name:tr         Boşluklar Olmadan Yapıştır
// @namespace       https://github.com/sipsak
// @version         1.0
// @description     Pastes the text in the clipboard by deleting the spaces with the Ctrl+Alt+V key combination.
// @description:tr  Ctrl+Alt+V tuş kombinasyonu ile panodaki metini boşlukları silerek yapıştırır
// @author          Burak Şipşak
// @match           *://*/*
// @grant           GM_setClipboard
// @run-at          document-start
// @icon            https://cdn-icons-png.flaticon.com/256/748/748035.png
// @updateURL       https://raw.githubusercontent.com/sipsak/Paste-Without-Spaces/main/Paste-Without-Spaces.user.js
// @downloadURL     https://raw.githubusercontent.com/sipsak/Paste-Without-Spaces/main/Paste-Without-Spaces.user.js
// ==/UserScript==

(function () {
    'use strict';

    function addKeyListener(win) {
        try {
            win.document.addEventListener('keydown', keydownHandler, true);
        } catch (err) {
            // Cross-origin iframe'ler hata verir, loglamaya gerek yok
        }
    }

    function handleNewFrames(mutations) {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'IFRAME') {
                    node.addEventListener('load', () => {
                        try {
                            addKeyListener(node.contentWindow);
                        } catch (e) {
                            // Cross-origin erişim engellenmişse hiçbir işlem yapma
                        }
                    });
                }
            });
        });
    }

    function keydownHandler(e) {
        if (e.code === 'KeyV' && e.ctrlKey && e.altKey) {  // V tuşunun kodu ile kontrol
            e.preventDefault();
            e.stopPropagation();
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable ||
                activeElement.classList.contains('o_input')
            )) {
                pasteWithoutSpaces(activeElement);
            }
        }
    }

    function pasteWithoutSpaces(element) {
        navigator.clipboard.readText().then(clipText => {
            const cleanText = clipText.replace(/\s+/g, '');
            if (element.isContentEditable) {
                document.execCommand('insertText', false, cleanText);
            } else {
                const { selectionStart: start = 0, selectionEnd: end = 0, value = '' } = element;
                element.value = value.slice(0, start) + cleanText + value.slice(end);
                element.selectionStart = element.selectionEnd = start + cleanText.length;

                const event = new Event('input', { bubbles: true, cancelable: true });
                element.dispatchEvent(event);

                // 'change' olayını da tetiklemek için
                const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                element.dispatchEvent(changeEvent);
            }
        }).catch(() => {
            console.error('Clipboard erişimi başarısız oldu.');
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        addKeyListener(window);
        new MutationObserver(handleNewFrames).observe(document.body, { childList: true, subtree: true });
    });
})();
