'use strict';

const showActiveVersion = (version, focus = false) => {
    const versionSwitcher = document.querySelector('#bd-js-dos-version');

    if (!versionSwitcher) {
        return;
    }

    const versionSwitcherText = document.querySelector('#bd-js-dos-version-text');
    const activeVersionIcon = document.querySelector('.js-dos-version-icon-active use');
    const btnToActive = document.querySelector(`[data-bs-js-dos-version-value="${version}"]`);
    const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href');
    const tickOfActiveBtn = btnToActive.querySelector('svg:has(use[href="#check2"])');
    const mainDiv = document.getElementById('div-version-toggle');

    document.querySelectorAll('[data-bs-js-dos-version-value]').forEach(element => {
        element.classList.remove('active');
        element.setAttribute('aria-pressed', 'false');
    });
    mainDiv.querySelectorAll('svg:has(use[href="#check2"])').forEach(element => {
        element.classList.add('d-none');
    });

    btnToActive.classList.add('active');
    btnToActive.setAttribute('aria-pressed', 'true');
    tickOfActiveBtn.classList.remove('d-none');
    activeVersionIcon.setAttribute('href', svgOfActiveBtn);
    const versionSwitcherLabel = `${versionSwitcherText.textContent} (${btnToActive.dataset.bsJsDosVersionValue})`;
    versionSwitcher.setAttribute('aria-label', versionSwitcherLabel);

    if (focus) {
        versionSwitcher.focus();
    }
};

const getStoredVersion = () => {
    const storedVersion = localStorage.getItem('js-dos-version');
    if (storedVersion) {
        return storedVersion;
    }
    else {
        return '7';
    }
};
const setStoredVersion = version => localStorage.setItem('js-dos-version', version);

const setVersion = version => {
    document.documentElement.setAttribute('data-bs-js-dos-version', version);
    var iframes = document.getElementsByTagName("iframe");
    for (let i = 0; i < iframes.length; i++) {
        const frame = iframes[i];
        if (frame.contentDocument && frame.contentDocument.documentElement) {
            frame.contentDocument.documentElement.setAttribute('data-bs-js-dos-version', version);
        }
    }
};

// eslint-disable-next-line no-unused-vars
function initializeVersion() {
    setVersion(getStoredVersion());
    onLoadSetVersion();
}

function onLoadSetVersion() {
    showActiveVersion(getStoredVersion());

    document.querySelectorAll('[data-bs-js-dos-version-value]')
        .forEach(toggle => {
            toggle.addEventListener('click', () => {
                const version = toggle.getAttribute('data-bs-js-dos-version-value');
                setStoredVersion(version);
                setVersion(version);
                showActiveVersion(version, true);
            });
        });
}

(() => {
    window.addEventListener('DOMContentLoaded', () => {
        onLoadSetVersion();
    });
})();
