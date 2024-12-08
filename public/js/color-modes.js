/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */
// Modified to allow color changer to be lazily loaded in an HTML fragment
'use strict'

const showActiveTheme = (theme, focus = false) => {
  const themeSwitcher = document.querySelector('#bd-theme')

  if (!themeSwitcher) {
    return
  }

  const themeSwitcherText = document.querySelector('#bd-theme-text')
  const activeThemeIcon = document.querySelector('.theme-icon-active use')
  const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
  const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')

  document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
    element.classList.remove('active')
    element.setAttribute('aria-pressed', 'false')
  })

  btnToActive.classList.add('active')
  btnToActive.setAttribute('aria-pressed', 'true')
  activeThemeIcon.setAttribute('href', svgOfActiveBtn)
  const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
  themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)

  if (focus) {
    themeSwitcher.focus()
  }
}

const getPreferredTheme = () => {
  const storedTheme = getStoredTheme()
  if (storedTheme) {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getStoredTheme = () => localStorage.getItem('theme')
const setStoredTheme = theme => localStorage.setItem('theme', theme)

const setTheme = theme => {
  var attr = '';
  if (theme === 'auto') {
    attr = (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } else {
    attr = theme;
  }
  document.documentElement.setAttribute('data-bs-theme', attr)
  var iframes = document.getElementsByTagName("iframe");
  for (let i = 0; i < iframes.length; i++) {
    const frame = iframes[i];
    if (frame.contentDocument && frame.contentDocument.documentElement) {
      frame.contentDocument.documentElement.setAttribute('data-bs-theme', attr)
    }
  }
}

function initializeColorMode() {

  setTheme(getPreferredTheme())

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  onLoadEvent();
  // hack for backward compatibility
  initHeader();
}

function onLoadEvent() {
  showActiveTheme(getPreferredTheme())

  document.querySelectorAll('[data-bs-theme-value]')
    .forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-bs-theme-value')
        setStoredTheme(theme)
        setTheme(theme)
        showActiveTheme(theme, true)
      })
  })
}

(() => {
  window.addEventListener('DOMContentLoaded', () => {
    onLoadEvent();
  })
})()
