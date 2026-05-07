/**
 * ============================================================================
 * FILE: /Modules/Core/E-Engine.js
 * PURPOSE: Core Engine for Editor (State, Formatting, Sync, Rendering, Storage)
 * ============================================================================
 */

window.EEngine = (function () {
    'use strict';

    // ==========================================
    // 1. STATE MANAGEMENT & HISTORY
    // ==========================================
    const State = {
        history:[],
        historyIndex: -1,
        activeElement: null,
        activeConfig: null,
        renderedCount: 0,
        uiHooks: {
            onHistoryChange: (canUndo, canRedo) => {},
            onToast: (msg, type) => {}
        },

        init() {
            this.loadCanvasFromStorage();
        },

        save() {
            const canvasContainer = document.getElementById('design-canvas');
            const qZoneEl = document.getElementById('qa-content-zone');
            
            let qZoneDisplay = '';
            if (qZoneEl) {
                qZoneDisplay = qZoneEl.style.display;
                qZoneEl.style.display = 'none';
            }

            let currentState = canvasContainer ? canvasContainer.innerHTML : '';

            if (qZoneEl) {
                qZoneEl.style.display = qZoneDisplay;
            }

            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            this.history.push(currentState);
            this.historyIndex++;
            this.notifyHistory();

            try {
                const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                const canvasKey = sessionId ? 'editor_canvas_html_' + sessionId : 'editor_canvas_html';
                localStorage.setItem(canvasKey, currentState);
            } catch (e) {}

            const qInnerEl = document.getElementById('qa-content-inner');
            if (qInnerEl && qInnerEl.innerHTML.trim() !== "") {
                try {
                    const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                    const key = sessionId ? 'editor_qa_formatted_html_' + sessionId : 'editor_qa_formatted_html';
                    localStorage.setItem(key, qInnerEl.innerHTML);
                } catch (e) {}
            }
        },

        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.restore(this.history[this.historyIndex]);
            }
        },

        redo() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.restore(this.history[this.historyIndex]);
            }
        },

        restore(content) {
            CanvasInteractions.setActive(null);
            const canvasContainer = document.getElementById('design-canvas');
            if (canvasContainer) {
                canvasContainer.innerHTML = content;
                const elements = canvasContainer.querySelectorAll('.inserted-element');
                elements.forEach(el => CanvasInteractions.makeInteractive(el));
            }
            
            this.notifyHistory();

            try {
                const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                const canvasKey = sessionId ? 'editor_canvas_html_' + sessionId : 'editor_canvas_html';
                localStorage.setItem(canvasKey, content);
            } catch (e) {}

            const qInnerEl = document.getElementById('qa-content-inner');
            if (qInnerEl && qInnerEl.innerHTML.trim()) {
                try {
                    const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                    const key = sessionId ? 'editor_qa_formatted_html_' + sessionId : 'editor_qa_formatted_html';
                    localStorage.setItem(key, qInnerEl.innerHTML);
                } catch (e) {}
            }
        },

        notifyHistory() {
            const canUndo = this.historyIndex > 0;
            const canRedo = this.historyIndex < this.history.length - 1;
            this.uiHooks.onHistoryChange(canUndo, canRedo);
        },

        loadCanvasFromStorage() {
            const canvasContainer = document.getElementById('design-canvas');
            const sessionId = localStorage.getItem('aiNoteMaker_currentId');
            const canvasKey = sessionId ? 'editor_canvas_html_' + sessionId : 'editor_canvas_html';
            const savedHtml = localStorage.getItem(canvasKey);

            if (savedHtml && canvasContainer) {
                canvasContainer.innerHTML = savedHtml;
                const restoredQaZone = document.getElementById('qa-content-zone');
                const restoredQaHint = document.getElementById('qa-empty-hint');

                if (restoredQaZone) {
                    const inner = restoredQaZone.querySelector('#qa-content-inner');
                    if (inner) inner.innerHTML = '';
                    restoredQaZone.style.display = 'none';
                }
                if (restoredQaHint) restoredQaHint.style.display = 'block';

                const elements = canvasContainer.querySelectorAll('.inserted-element');
                elements.forEach(el => CanvasInteractions.makeInteractive(el));
            }

            try {
                const bgKey = sessionId ? 'editor_bg_image_' + sessionId : 'editor_bg_image';
                const savedBg = localStorage.getItem(bgKey);
                if (savedBg) {
                    const bgImage = document.getElementById('main-bg-image');
                    if (bgImage) bgImage.src = savedBg;
                }
            } catch (e) {}
            
            this.save();
        }
    };

    // ==========================================
    // 2. SELECTION & DOM UTILS
    // ==========================================
    const Utils = {
        isQaZoneActive() {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return false;
            const qInner = document.getElementById('qa-content-inner');
            return qInner && qInner.contains(sel.anchorNode);
        },

        hasQaSelection() {
            const sel = window.getSelection();
            return sel && sel.rangeCount > 0 && !sel.isCollapsed && this.isQaZoneActive();
        },

        toast(msg, type) {
            State.uiHooks.onToast(msg, type);
        }
    };

    // ==========================================
    // 3. STORAGE & TEMPLATE ENGINE
    // ==========================================
    const Storage = {
        setOnlineTemplate() {
            const bgImage = document.getElementById('main-bg-image');
            bgImage.style.opacity = '0.4';

            const randomId = Math.floor(Math.random() * 1000);
            const newSrc = `https://picsum.photos/840/1160?random=${randomId}`;
            const tempImg = new Image();

            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = tempImg.naturalWidth || 840;
                canvas.height = tempImg.naturalHeight || 1160;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0);
                let base64Data;
                try {
                    base64Data = canvas.toDataURL('image/jpeg', 0.85);
                } catch (e) {
                    base64Data = newSrc;
                }

                bgImage.src = base64Data;
                bgImage.style.opacity = '1';
                bgImage.style.display = '';

                try {
                    const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                    const bgKey = sessionId ? 'editor_bg_image_' + sessionId : 'editor_bg_image';
                    localStorage.setItem(bgKey, base64Data);
                } catch (e) {
                    try {
                        const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                        const bgKey = sessionId ? 'editor_bg_image_' + sessionId : 'editor_bg_image';
                        localStorage.setItem(bgKey, newSrc);
                        bgImage.src = newSrc;
                    } catch (e2) {}
                }
                State.save();
            };
            tempImg.onerror = () => {
                bgImage.style.opacity = '1';
                Utils.toast("Image load করা যায়নি। Internet connection check করুন।", 'error');
            };
            tempImg.crossOrigin = 'anonymous';
            tempImg.src = newSrc;
        },

        removeTemplate() {
            const bgImage = document.getElementById('main-bg-image');
            bgImage.src = 'https://placehold.co/840x1160/ffffff/ffffff?text=+';
            bgImage.style.opacity = '1';
            bgImage.style.display = '';

            try {
                const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                const bgKey = sessionId ? 'editor_bg_image_' + sessionId : 'editor_bg_image';
                localStorage.removeItem(bgKey);
            } catch (e) {}

            State.save();
        }
    };

    // ==========================================
    // 4. FORMATTING ENGINE (Optimized)
    // ==========================================
    const Formatting = {
        _resetFormattingSnapshot: null,
        _isFormattingRemoved: false,

        toggleResetFormatting() {
            const qInner = document.getElementById('qa-content-inner');
            const resetBtn = document.getElementById('btn-reset');
            const resetLabel = resetBtn ? resetBtn.querySelector('.toolbar-text') : null;

            if (!this._isFormattingRemoved) {
                if (qInner) {
                    this._resetFormattingSnapshot = {
                        qaHtml: qInner.innerHTML,
                        qaTextAlign: qInner.style.textAlign || ''
                    };

                    const spans = qInner.querySelectorAll('span[data-qa-fmt], span[style]');
                    spans.forEach(span => {
                        const parent = span.parentNode;
                        while (span.firstChild) parent.insertBefore(span.firstChild, span);
                        parent.removeChild(span);
                    });

                    const allEls = qInner.querySelectorAll('*');
                    allEls.forEach(node => {
                        node.style.fontWeight = '';
                        node.style.fontStyle = '';
                        node.style.textDecoration = '';
                        node.style.textDecorationLine = '';
                        node.style.color = '';
                        node.style.backgroundColor = '';
                        node.style.fontSize = '';
                    });
                    qInner.style.textAlign = '';
                }
                this._isFormattingRemoved = true;
                if (resetLabel) resetLabel.textContent = 'Restore';
                if(resetBtn) {
                    resetBtn.classList.remove('text-red-500', 'hover:text-red-700');
                    resetBtn.classList.add('text-green-600', 'hover:text-green-800');
                }
            } else {
                if (qInner && this._resetFormattingSnapshot) {
                    qInner.innerHTML = this._resetFormattingSnapshot.qaHtml;
                    qInner.style.textAlign = this._resetFormattingSnapshot.qaTextAlign;
                    this._resetFormattingSnapshot = null;
                }
                this._isFormattingRemoved = false;
                if (resetLabel) resetLabel.textContent = 'Reset';
                if(resetBtn) {
                    resetBtn.classList.add('text-red-500', 'hover:text-red-700');
                    resetBtn.classList.remove('text-green-600', 'hover:text-green-800');
                }
            }
            State.save();
        },

        applyContainerAlignment(alignValue, activeAlignColumn) {
            const qInner = document.getElementById('qa-content-inner');
            if (!qInner) return;

            const isDouble = qInner.classList.contains('layout-double') ||
                             window.getComputedStyle(qInner).columnCount === '2' ||
                             qInner.style.columnCount === '2';

            if (!isDouble) {
                qInner.style.textAlign = alignValue;
                qInner.querySelectorAll('.qa-entry-block, .qa-entry-block p').forEach(el => {
                    el.style.textAlign = alignValue;
                });
                Utils.toast(`Text aligned: ${alignValue}`, 'success');
            } else {
                const side = activeAlignColumn || 'left';
                const allBlocks = Array.from(qInner.querySelectorAll('.qa-entry-block'));
                const totalBlocks = allBlocks.length;

                if (totalBlocks === 0) {
                    qInner.style.textAlign = alignValue;
                    Utils.toast(`Text aligned: ${alignValue}`, 'success');
                    return;
                }

                const qRect = qInner.getBoundingClientRect();
                const midX  = qRect.left + qRect.width / 2;

                let appliedCount = 0;
                allBlocks.forEach(block => {
                    const bRect = block.getBoundingClientRect();
                    const blockCenterX = bRect.left + bRect.width / 2;
                    const blockSide = blockCenterX < midX ? 'left' : 'right';

                    if (blockSide === side) {
                        block.style.textAlign = alignValue;
                        block.querySelectorAll('p').forEach(p => p.style.textAlign = alignValue);
                        appliedCount++;
                    }
                });

                if (appliedCount === 0) {
                    const half = Math.ceil(totalBlocks / 2);
                    const targetBlocks = side === 'left' ? allBlocks.slice(0, half) : allBlocks.slice(half);
                    targetBlocks.forEach(block => {
                        block.style.textAlign = alignValue;
                        block.querySelectorAll('p').forEach(p => p.style.textAlign = alignValue);
                    });
                }
                Utils.toast(`${side === 'left' ? 'Left Column' : 'Right Column'} aligned: ${alignValue}`, 'success');
            }
            State.save();
        },

        getPointerElement(type) {
            const span = document.createElement('span');
            span.className = 'qa-pointer select-none pr-1 inline-block align-middle pointer-events-none';
            span.contentEditable = 'false';
            span.style.cssText = 'display:inline-block; vertical-align:middle; line-height:1; margin-right:3px;';

            const unicodeMap = {
                'svg-shamrock': '☘', 'svg-flower': '✿', 'svg-scissors': '✄', 'svg-biohazard': '☣', 'svg-star5': '⚝',
                'bullet-diamond': '❖', 'bullet-sparkle': '✦', 'bullet-square-open': '□', 'bullet-asterisk': '✱',
                'bullet-cjk1': '⿻', 'bullet-cjk2': '⿴', 'bullet-doc1': '❐', 'bullet-doc2': '❏',
                'bullet-circle': '●', 'bullet-ring': '○', 'bullet-square': '■', 'bullet-arrow': '➤', 'bullet-dash': '—'
            };

            if (unicodeMap[type]) {
                span.textContent = unicodeMap[type];
                span.style.fontSize = '1.1em';
            } else {
                const svgBase = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;">`;
                if (type === 'svg-arrow') span.innerHTML = `${svgBase}<polyline points="9 18 15 12 9 6"></polyline></svg>`;
                else if (type === 'svg-check') span.innerHTML = `${svgBase}<polyline points="20 6 9 17 4 12"></polyline></svg>`;
                else if (type === 'svg-star') span.innerHTML = `${svgBase}<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
                else if (type === 'svg-diamond') span.innerHTML = `${svgBase}<polygon points="12 2 22 12 12 22 2 12"></polygon></svg>`;
                else {
                    span.textContent = '•';
                    span.style.fontSize = '1.1em';
                }
            }
            return span;
        },

        applyPointer(pointerType, activeRange, activeElement) {
            const qInner = document.getElementById('qa-content-inner');

            if (activeRange && qInner && qInner.contains(activeRange.startContainer)) {
                if (pointerType === 'none') {
                    let container = activeRange.startContainer;
                    while (container && container !== qInner) {
                        if (container.nodeType === 1 && (container.tagName === 'P' || container.classList?.contains('qa-entry-block'))) {
                            container.querySelectorAll('.qa-pointer, br.qa-pointer-br').forEach(el => el.remove());
                            break;
                        }
                        container = container.parentNode;
                    }
                    if (!container || container === qInner) {
                        qInner.querySelectorAll('.qa-pointer, br.qa-pointer-br').forEach(el => el.remove());
                    }
                    window.getSelection()?.removeAllRanges();
                    State.save();
                    Utils.toast("Pointer Removed ✓", 'success');
                    return;
                }

                const insertionRange = document.createRange();
                insertionRange.setStart(activeRange.startContainer, activeRange.startOffset);
                insertionRange.collapse(true);

                let hostBlock = activeRange.startContainer;
                while (hostBlock && hostBlock !== qInner) {
                    if (hostBlock.nodeType === 1 && (hostBlock.tagName === 'P' || hostBlock.classList?.contains('qa-entry-block'))) break;
                    hostBlock = hostBlock.parentNode;
                }

                const pointerEl = this.getPointerElement(pointerType);
                let isAtBlockStart = false;
                if (hostBlock && hostBlock !== qInner) {
                    const beforeRange = document.createRange();
                    beforeRange.setStart(hostBlock, 0);
                    beforeRange.setEnd(activeRange.startContainer, activeRange.startOffset);
                    const textBefore = beforeRange.toString().replace(/\s/g, '');
                    const hasPointerBefore = (() => {
                        const tempFrag = beforeRange.cloneContents();
                        return tempFrag.querySelector('.qa-pointer') !== null;
                    })();
                    isAtBlockStart = textBefore === '' && !hasPointerBefore;
                }

                if (isAtBlockStart) {
                    insertionRange.insertNode(pointerEl);
                } else {
                    const br = document.createElement('br');
                    br.className = 'qa-pointer-br';
                    insertionRange.insertNode(pointerEl);
                    pointerEl.parentNode.insertBefore(br, pointerEl);
                }

                window.getSelection()?.removeAllRanges();
                State.save();
                Utils.toast("Pointer Applied ✓", 'success');
                return;
            }

            if (activeElement && activeElement.tagName === 'DIV' && activeElement.id !== 'canvas-watermark') {
                activeElement.querySelectorAll('.qa-pointer').forEach(el => el.remove());
                if (pointerType !== 'none') {
                    const pointerEl = this.getPointerElement(pointerType);
                    if (activeElement.firstChild) activeElement.insertBefore(pointerEl, activeElement.firstChild);
                    else activeElement.appendChild(pointerEl);
                }
                State.save();
                Utils.toast("Pointer Applied ✓", 'success');
                return;
            }

            Utils.toast("প্রথমে text select করুন, তারপর pointer apply করুন।", 'warning');
        },

        applyCommandToQaZone(command, value, customRange = null) {
            let range;
            let sel = null;
            
            if (customRange) {
                range = customRange;
            } else {
                sel = window.getSelection();
                if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
                range = sel.getRangeAt(0);
            }

            if (range.toString().trim() === '') return;

            let isRemove = false;
            let node = range.startContainer;
            const qInner = document.getElementById('qa-content-inner');
            
            while (node && node !== qInner) {
                if (node.nodeType === 1 && node.getAttribute('data-qa-fmt') === command) {
                    if (command === 'backColor' || command === 'foreColor') {
                        const temp = document.createElement('div');
                        if (command === 'backColor') temp.style.backgroundColor = value;
                        else temp.style.color = value;
                        document.body.appendChild(temp);
                        const normalizedValue = command === 'backColor' ? getComputedStyle(temp).backgroundColor : getComputedStyle(temp).color;
                        temp.remove();

                        const currentNodeColor = command === 'backColor' ? node.style.backgroundColor : node.style.color;
                        if (currentNodeColor === normalizedValue) isRemove = true;
                    } else if (command === 'fontSize') {
                        if (node.style.fontSize === value) isRemove = true;
                    } else {
                        isRemove = true;
                    }
                    break;
                }
                node = node.parentNode;
            }

            const fragment = range.extractContents();

            if (isRemove) {
                const matchingSpans = fragment.querySelectorAll(`span[data-qa-fmt="${command}"]`);
                matchingSpans.forEach(span => {
                    const parent = span.parentNode;
                    while (span.firstChild) parent.insertBefore(span.firstChild, span);
                    parent.removeChild(span);
                });
                range.insertNode(fragment);
            } else {
                const matchingSpans = fragment.querySelectorAll(`span[data-qa-fmt="${command}"]`);
                matchingSpans.forEach(span => {
                    const parent = span.parentNode;
                    while (span.firstChild) parent.insertBefore(span.firstChild, span);
                    parent.removeChild(span);
                });

                const wrapper = document.createElement('span');
                wrapper.setAttribute('data-qa-fmt', command);

                if (command === 'bold') wrapper.style.fontWeight = 'bold';
                else if (command === 'italic') wrapper.style.fontStyle = 'italic';
                else if (command === 'underline') wrapper.style.textDecoration = 'underline';
                else if (command === 'strikeThrough') wrapper.style.textDecoration = 'line-through';
                else if (command === 'backColor') wrapper.style.backgroundColor = value || 'rgba(253, 224, 71, 0.7)';
                else if (command === 'foreColor') wrapper.style.color = value;
                else if (command === 'fontSize') wrapper.style.fontSize = value;

                wrapper.appendChild(fragment);
                range.insertNode(wrapper);
            }

            if (qInner) {
                const allSpans = qInner.querySelectorAll('span[data-qa-fmt]');
                allSpans.forEach(s => { if (s.innerHTML === '') s.remove(); });
            }

            if (sel) sel.removeAllRanges();
            State.save();
        },

        applyUnderlineStyle(ulCommand) {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            if (range.toString().trim() === '') return;

            const qInner = document.getElementById('qa-content-inner');
            const isRemove = (ulCommand === 'ul-none');
            let ulWrapper = null;

            let node = range.startContainer;
            if (node.nodeType === 3) node = node.parentNode;
            while (node && node !== qInner) {
                if (node.nodeType === 1 && node.getAttribute && node.getAttribute('data-qa-fmt') && node.getAttribute('data-qa-fmt').startsWith('ul-')) {
                    ulWrapper = node;
                    break;
                }
                node = node.parentNode;
            }

            let shouldRemove = isRemove;
            if (!isRemove && ulWrapper && ulWrapper.getAttribute('data-qa-fmt') === ulCommand) {
                shouldRemove = true;
            }

            const fragment = range.extractContents();
            fragment.querySelectorAll('span[data-qa-fmt^="ul-"]').forEach(s => {
                const p = s.parentNode;
                while (s.firstChild) p.insertBefore(s.firstChild, s);
                p.removeChild(s);
            });

            const newWrapper = document.createElement('span');
            if (!shouldRemove) {
                newWrapper.setAttribute('data-qa-fmt', ulCommand);
            } else {
                newWrapper.setAttribute('data-qa-fmt', 'ul-none');
                newWrapper.style.textDecoration = 'none';
            }
            newWrapper.appendChild(fragment);

            if (ulWrapper) {
                const originalFmt = ulWrapper.getAttribute('data-qa-fmt');
                const afterRange = document.createRange();
                afterRange.setStart(range.startContainer, range.startOffset);
                afterRange.setEnd(ulWrapper, ulWrapper.childNodes.length);
                const afterFragment = afterRange.extractContents();

                const parent = ulWrapper.parentNode;
                const nextSib = ulWrapper.nextSibling;

                parent.insertBefore(newWrapper, nextSib);
                if (afterFragment.textContent) {
                    const postSpan = document.createElement('span');
                    postSpan.setAttribute('data-qa-fmt', originalFmt);
                    postSpan.appendChild(afterFragment);
                    parent.insertBefore(postSpan, nextSib);
                }
            } else {
                const hasBlockElements = Array.from(newWrapper.childNodes).some(
                    n => n.nodeType === 1 && (n.tagName === 'P' || n.tagName === 'DIV' || n.classList.contains('qa-entry-block'))
                );

                if (hasBlockElements) {
                    const docFrag = document.createDocumentFragment();
                    while (newWrapper.firstChild) {
                        const child = newWrapper.firstChild;
                        if (child.nodeType === 1 && (child.tagName === 'P' || child.tagName === 'DIV' || child.classList.contains('qa-entry-block'))) {
                            const innerSpan = document.createElement('span');
                            innerSpan.setAttribute('data-qa-fmt', shouldRemove ? 'ul-none' : ulCommand);
                            if (shouldRemove) innerSpan.style.textDecoration = 'none';
                            
                            while (child.firstChild) innerSpan.appendChild(child.firstChild);
                            child.appendChild(innerSpan);
                            docFrag.appendChild(child);
                        } else {
                            docFrag.appendChild(child);
                        }
                    }
                    range.insertNode(docFrag);
                } else {
                    range.insertNode(newWrapper);
                }
            }

            qInner.querySelectorAll('span[data-qa-fmt^="ul-"]').forEach(s => {
                if (!s.textContent) s.remove();
            });

            sel.removeAllRanges();
            State.save();
        },

        adjustGlobalFontSize(isIncrease) {
            if (State.activeElement && State.activeElement.tagName === 'DIV' && State.activeElement.id !== 'canvas-watermark') {
                let currentSize = window.getComputedStyle(State.activeElement).fontSize;
                let sizeNum = parseFloat(currentSize) || 16;
                let newSize = Math.max(8, Math.min(isIncrease ? sizeNum + 2 : sizeNum - 2, 120));
                State.activeElement.style.fontSize = newSize + 'px';
                State.save();
                return;
            }

            const qInner = document.getElementById('qa-content-inner');
            if (qInner) {
                let currentSize = window.getComputedStyle(qInner).fontSize;
                let sizeNum = parseFloat(currentSize) || 16;
                let newSize = Math.max(6, Math.min(isIncrease ? sizeNum + 1 : sizeNum - 1, 72));

                qInner.style.fontSize = newSize + 'px';

                try {
                    const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                    const fontKey = sessionId ? 'editor_custom_font_size_' + sessionId : 'editor_custom_font_size';
                    localStorage.setItem(fontKey, newSize + 'px');
                } catch (e) {}

                qInner.querySelectorAll('span[style*="font-size"]').forEach(s => s.style.fontSize = '');
                qInner.querySelectorAll('span[data-qa-fmt="fontSize"]').forEach(span => {
                    const parent = span.parentNode;
                    while (span.firstChild) parent.insertBefore(span.firstChild, span);
                    parent.removeChild(span);
                });

                State.save();
                Utils.toast(`Global Text Size: ${newSize}px`, 'success');
            }
        }
    };

    // ==========================================
    // 5. SYNC ENGINE (Notebook -> Editor Q&A)
    // ==========================================
    const Sync = {
        _lastSeenQaPending: null,
        _lastSeenSessionId: null,

        DEFAULT_CONFIG: {
            slideId: 1, bgColor: '#ffffff', fontFamily: "'Tiro Bangla', serif", fontSize: '7.5px',
            layout: 'single', paddingTop: '2.5rem', paddingRight: '0.8rem', paddingBottom: '0.8rem', 
            paddingLeft: '0.8rem', gap: '4px', textAlign: 'justify', lineHeight: '1.25', useSeparator: false
        },

        init() {
            this._lastSeenQaPending = localStorage.getItem('nb_qa_pending');
            this._lastSeenSessionId = localStorage.getItem('aiNoteMaker_currentId');

            const entries = this.getStoredEntries();
            const config = this.getStoredConfig();
            
            const qInner = document.getElementById('qa-content-inner');

            if (!entries || entries.length === 0) {
                if (qInner) qInner.innerHTML = '';
                State.renderedCount = 0;
                localStorage.removeItem(this.getFormattedHtmlKey());
                this.updateEmptyHint();
            }

            if (entries.length > 0) {
                const cfg = config || this.DEFAULT_CONFIG;
                this.applyTemplateStyles(cfg);
                this.renderAllEntries(entries, cfg, false);
            } else if (config && localStorage.getItem('editor_template_active') === 'true') {
                this.applyTemplateStyles(config);
            }

            try {
                const savedFont = localStorage.getItem('page_font_config');
                if (savedFont) this.applyPageFontSync(JSON.parse(savedFont));
            } catch (e) {}

            // Same-tab Polling
            setInterval(() => {
                const currentPending = localStorage.getItem('nb_qa_pending');
                const currentSession = localStorage.getItem('aiNoteMaker_currentId');

                if (currentSession !== this._lastSeenSessionId) {
                    this._lastSeenSessionId = currentSession;
                    this._lastSeenQaPending = currentPending;
                    window.location.reload();
                    return;
                }

                if (currentPending !== this._lastSeenQaPending) {
                    this._lastSeenQaPending = currentPending;
                    this.handleQaPendingChange();
                }
            }, 800);

            // Cross-tab Event Listener
            window.addEventListener('storage', (e) => {
                const qZone = document.getElementById('qa-content-zone');
                const emptyHint = document.getElementById('qa-empty-hint');
                const designCanvas = document.getElementById('design-canvas');
                const qInnerLocal = document.getElementById('qa-content-inner');

                if (e.key === 'nb_session_switched') {
                    window.location.reload();
                    return;
                }
                if (e.key === 'nb_qa_pending') {
                    this._lastSeenQaPending = e.newValue;
                    this.handleQaPendingChange();
                }
                if (e.key === 'editor_template_config' && e.newValue) {
                    let cfg = null;
                    try { cfg = JSON.parse(e.newValue); } catch (_) {}
                    if (!cfg) return;
                    const ents = this.getStoredEntries();
                    this.applyTemplateStyles(cfg);
                    localStorage.removeItem(this.getFormattedHtmlKey());
                    this.renderAllEntries(ents, cfg, true);
                    try {
                        const savedFont = localStorage.getItem('page_font_config');
                        if (savedFont) this.applyPageFontSync(JSON.parse(savedFont));
                    } catch (_) {}
                }
                if (e.key === 'editor_template_active' && e.newValue === 'false') {
                    if (qZone) qZone.style.display = 'none';
                    if (emptyHint) emptyHint.style.display = 'block';
                    if (designCanvas) designCanvas.style.backgroundColor = '';
                    State.activeConfig = null;
                    State.renderedCount = 0;
                    localStorage.removeItem(this.getFormattedHtmlKey());
                }
                if (e.key === 'page_font_config') {
                    if (e.newValue) {
                        try { this.applyPageFontSync(JSON.parse(e.newValue)); } catch (_) {}
                    } else {
                        const conf = this.getStoredConfig();
                        if (qInnerLocal && conf) qInnerLocal.style.fontFamily = conf.fontFamily || "'Tiro Bangla', serif";
                    }
                }
            });
        },

        getFormattedHtmlKey() {
            const sessionId = localStorage.getItem('aiNoteMaker_currentId');
            return sessionId ? 'editor_qa_formatted_html_' + sessionId : 'editor_qa_formatted_html';
        },

        getStoredEntries() {
            try {
                const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                return sessionId ? JSON.parse(localStorage.getItem('nb_qa_entries_' + sessionId) || '[]') : [];
            } catch (_) { return[]; }
        },

        getStoredConfig() {
            try {
                const raw = localStorage.getItem('editor_template_config');
                return raw ? JSON.parse(raw) : null;
            } catch (_) { return null; }
        },

        updateEmptyHint() {
            const emptyHint = document.getElementById('qa-empty-hint');
            if (emptyHint) emptyHint.style.display = (State.renderedCount === 0) ? 'block' : 'none';
        },

        syncRenderedCount() {
            const qInner = document.getElementById('qa-content-inner');
            State.renderedCount = qInner ? qInner.querySelectorAll('.qa-entry-block').length : 0;
        },

        createQaBlock(item, cfg) {
            const c = cfg || State.activeConfig || this.DEFAULT_CONFIG;
            const block = document.createElement('div');
            block.className = 'qa-entry-block';
            block.style.breakInside = 'avoid';
            block.style.marginBottom = c.gap || '4px';

            const qEl = document.createElement('p');
            qEl.style.fontWeight = 'bold';
            qEl.style.margin = '0';
            qEl.textContent = item.q;

            const aEl = document.createElement('p');
            aEl.style.marginTop = '1px';
            aEl.style.margin = '1px 0 0 0';
            aEl.appendChild(document.createTextNode(item.a));

            block.appendChild(qEl);
            block.appendChild(aEl);
            return block;
        },

        applyPageFontSync(fontConfig) {
            if (!fontConfig) return;
            const qInner = document.getElementById('qa-content-inner');
            if (!qInner) return;
            qInner.style.fontFamily = fontConfig.subFont;
            qInner.querySelectorAll('.qa-entry-block p').forEach(function (p) {
                if (p.style.fontWeight === 'bold') {
                    p.style.fontFamily = fontConfig.mainFont;
                    p.style.fontWeight = fontConfig.mainWeight;
                    p.style.fontStyle = 'normal';
                    p.style.letterSpacing = '';
                } else {
                    p.style.fontFamily = fontConfig.subFont;
                    p.style.fontWeight = fontConfig.subWeight;
                    p.style.fontStyle = fontConfig.subStyle;
                    p.style.letterSpacing = fontConfig.subLetterSpacing;
                }
            });
        },

        applyTemplateStyles(config) {
            const qZone = document.getElementById('qa-content-zone');
            const qInner = document.getElementById('qa-content-inner');
            const designCanvas = document.getElementById('design-canvas');

            if (!config || !qZone || !qInner) return;
            State.activeConfig = config;

            if (designCanvas) {
                designCanvas.style.backgroundColor = config.bgColor || '#ffffff';
                if (config.aspectRatio) {
                    designCanvas.classList.remove('aspect-square', 'aspect-video', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[9/16]', 'aspect-[21/29]');
                    designCanvas.classList.add(config.aspectRatio);
                }
            }

            qZone.style.display = 'block';
            const s = qInner.style;
            s.fontFamily = config.fontFamily || "'Tiro Bangla', serif";

            let savedFontSize = null;
            try {
                const sessionId = localStorage.getItem('aiNoteMaker_currentId');
                const fontKey = sessionId ? 'editor_custom_font_size_' + sessionId : 'editor_custom_font_size';
                savedFontSize = localStorage.getItem(fontKey);
            } catch (e) {}

            if (savedFontSize) s.fontSize = savedFontSize;
            else s.fontSize = config.layout === 'double' ? '7px' : (config.fontSize || '7.5px');

            s.textAlign = config.textAlign || 'justify';
            s.lineHeight = config.lineHeight || '1.25';
            s.paddingTop = config.paddingTop || '2.5rem';
            s.paddingRight = config.paddingRight || '0.8rem';
            s.paddingBottom = config.paddingBottom || '0.8rem';
            s.paddingLeft = config.paddingLeft || '0.8rem';
            
            // Critical CSS rules restored
            s.color = '#1f2937';
            s.boxSizing = 'border-box';
            s.width = '100%';
            s.height = '100%';
            s.overflow = 'hidden';

            if (config.layout === 'double') {
                s.display = 'block'; s.columnCount = '2'; s.columnGap = '0.8rem'; s.columnFill = 'auto'; s.flexDirection = ''; s.gap = '';
                qInner.classList.add('layout-double');
            } else {
                s.display = 'flex'; s.flexDirection = 'column'; s.gap = config.gap || '4px'; s.columnCount = ''; s.columnGap = '';
                qInner.classList.remove('layout-double');
            }

            const existingDivider = qZone.querySelector('.qa-column-divider');
            if (existingDivider) existingDivider.remove();

            if (config.useSeparator && config.layout === 'double') {
                const divEl = document.createElement('div');
                divEl.className = 'qa-column-divider';
                divEl.style.top = config.paddingTop || '2.5rem';
                divEl.style.bottom = config.paddingBottom || '0.8rem';
                qZone.appendChild(divEl);
            }

            this.updateEmptyHint();
        },

        renderAllEntries(entries, config, forceRaw) {
            const qInner = document.getElementById('qa-content-inner');
            if (!qInner) return;

            if (!entries || entries.length === 0) {
                qInner.innerHTML = '';
                State.renderedCount = 0;
                localStorage.removeItem(this.getFormattedHtmlKey());
                this.updateEmptyHint();
                return;
            }

            if (!forceRaw) {
                const savedFormatted = localStorage.getItem(this.getFormattedHtmlKey());
                if (savedFormatted && savedFormatted.trim()) {
                    qInner.innerHTML = '';
                    qInner.insertAdjacentHTML('beforeend', savedFormatted);
                    this.syncRenderedCount();
                    
                    if (State.renderedCount < entries.length) {
                        const newEntries = entries.slice(State.renderedCount);
                        const fragment = document.createDocumentFragment();
                        newEntries.forEach(item => fragment.appendChild(this.createQaBlock(item, config)));
                        qInner.appendChild(fragment);
                        this.syncRenderedCount();
                        try { localStorage.setItem(this.getFormattedHtmlKey(), qInner.innerHTML); } catch (e) {}
                    } else if (State.renderedCount > entries.length) {
                        qInner.innerHTML = '';
                        State.renderedCount = 0;
                    }
                    
                    if (State.renderedCount === entries.length && State.renderedCount > 0) {
                        this.updateEmptyHint();
                        return;
                    }
                }
            }

            qInner.innerHTML = '';
            State.renderedCount = 0;
            const fragment = document.createDocumentFragment();
            entries.forEach(item => {
                fragment.appendChild(this.createQaBlock(item, config));
                State.renderedCount++;
            });
            qInner.appendChild(fragment);
            this.updateEmptyHint();
            try { localStorage.setItem(this.getFormattedHtmlKey(), qInner.innerHTML); } catch (e) {}
        },

        appendNewEntry(item) {
            const qInner = document.getElementById('qa-content-inner');
            if (!qInner) return;
            const newBlock = this.createQaBlock(item);
            qInner.appendChild(newBlock);
            this.syncRenderedCount();
            this.updateEmptyHint();
            try { localStorage.setItem(this.getFormattedHtmlKey(), qInner.innerHTML); } catch (e) {}
        },

        handleQaPendingChange() {
            const qInner = document.getElementById('qa-content-inner');
            const entries = this.getStoredEntries();

            if (entries.length === 0) {
                if (qInner) qInner.innerHTML = '';
                State.renderedCount = 0;
                localStorage.removeItem(this.getFormattedHtmlKey());
                this.updateEmptyHint();
                return;
            }

            this.syncRenderedCount();

            if (State.renderedCount < entries.length) {
                if (entries.length - State.renderedCount === 1) {
                    this.appendNewEntry(entries[entries.length - 1]);
                } else {
                    const savedFormatted = localStorage.getItem(this.getFormattedHtmlKey());
                    if (savedFormatted && savedFormatted.trim()) {
                        const fragment = document.createDocumentFragment();
                        entries.slice(State.renderedCount).forEach(item => fragment.appendChild(this.createQaBlock(item)));
                        if (qInner) qInner.appendChild(fragment);
                        this.syncRenderedCount();
                        this.updateEmptyHint();
                        try { localStorage.setItem(this.getFormattedHtmlKey(), qInner ? qInner.innerHTML : ''); } catch (_) {}
                    } else {
                        this.renderAllEntries(entries, State.activeConfig, true);
                    }
                }
            } else if (State.renderedCount > entries.length) {
                localStorage.removeItem(this.getFormattedHtmlKey());
                this.renderAllEntries(entries, State.activeConfig, true);
            }
        }
    };

    // ==========================================
    // 6. CANVAS INTERACTIONS
    // ==========================================
    const CanvasInteractions = {
        setActive(el) {
            if (State.activeElement) {
                State.activeElement.style.outline = 'none';
                State.activeElement.style.boxShadow = 'none';
            }
            
            const handle = document.getElementById('resize-handle');
            if (handle) handle.remove();
            const deleteHandle = document.getElementById('delete-handle');
            if (deleteHandle) deleteHandle.remove();
            
            State.activeElement = el;
            
            if (State.activeElement) {
                State.activeElement.style.outline = '2px dashed #3b82f6';
                State.activeElement.style.outlineOffset = '4px';
            }
        },

        makeInteractive(el) {
            el.classList.add('inserted-element');
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setActive(el);
            });

            if(el.contentEditable === 'true') {
                el.addEventListener('blur', () => State.save());
            }

            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            const dragMouseDown = (e) => {
                if (e.target.id === 'resize-handle' || e.target.closest('#resize-handle')) return;
                if (e.target !== el && !el.contains(e.target)) return;
                e.stopPropagation();
                this.setActive(el);
                
                let evt = e.type.includes('touch') ? e.touches[0] : e;
                pos3 = evt.clientX; pos4 = evt.clientY;
                document.onmouseup = closeDragElement;
                document.ontouchend = closeDragElement;
                document.onmousemove = elementDrag;
                document.ontouchmove = elementDrag;
            };

            const elementDrag = (e) => {
                if (e.cancelable) e.preventDefault(); 
                let scale = typeof window.currentScale !== 'undefined' ? window.currentScale : 1;
                let evt = e.type.includes('touch') ? e.touches[0] : e;
                
                pos1 = (pos3 - evt.clientX) / scale;
                pos2 = (pos4 - evt.clientY) / scale;
                pos3 = evt.clientX; pos4 = evt.clientY;
                
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            };

            const closeDragElement = () => {
                document.onmouseup = null; document.onmousemove = null;
                document.ontouchend = null; document.ontouchmove = null;
                State.save();
            };

            el.onmousedown = dragMouseDown;
            el.ontouchstart = dragMouseDown;
        }
    };

    return { 
        State, 
        Utils, 
        Storage, 
        Format: Formatting, 
        Sync, 
        Canvas: CanvasInteractions, 
        init() { 
            State.init(); 
            Sync.init(); // 👈 This was missing and is now restored!
        } 
    };
})();
