let extraDetailsProviders: (() => string)[] = []
let ready = false
let errorsReported = 0
let errors: any[] = []
let entityMap: {[_: string]: string | undefined} = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start)
} else {
	start()
}

function start() {
	if (document.body) { // IE9 is weird
		ready = true
		let style = document.createElement('style')
		style.innerHTML = `
.error-popup {
	box-sizing: border-box;
	position: absolute;
	z-index: 2147483647;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20px;
	overflow: auto;
	white-space: pre-wrap;
	background: #d43;
	color: white;
	font-family: monospace;
}
`
		document.head.appendChild(style)
		setTimeout(renderErrors, 1) // In case this script is first in body
	} else {
		setTimeout(start, 1)
	}
}

window.onerror = function(messageOrEvent, source, lineno, colno, error) {
	if (errorsReported >= 10) return
	errorsReported++
	let e = {
		messageOrEvent: messageOrEvent,
		source: source,
		lineno: lineno,
		colno: colno,
		stack: error && error.stack,
	}
	errors.push(e)
	renderErrors()
}

function renderErrors() {
	if (!ready) return
	while (errors.length) {
		let error = errors.shift()
		let markup = document.createElement('div')
		markup.className = 'error-popup'
		markup.innerHTML =
			'<h2>Error</h2>' +
			'<p><em>Please report this message:</em></p>' +
			'<p>' +
			'<textarea cols=40 rows=5>' +
			'Message: ' + escapeHtml(error.messageOrEvent) + '\n' +
			'Source: ' + escapeHtml(error.source) + '\n' +
			'Line:column: ' + escapeHtml(error.lineno) + ':' + escapeHtml(error.colno) + '\n' +
			'Stack trace:\n\n' +
			escapeHtml(error.stack) + '\n\n' +
			'Timestamp: ' + escapeHtml(new Date().toISOString()) + '\n' +
			'URL: ' + escapeHtml(location.href) + '\n' +
			'User agent: ' + escapeHtml(navigator.userAgent) + '\n' +
			'Window size: ' + window.innerWidth + ' x ' + window.innerHeight +
			getExtraDetails() +
			'</textarea>' +
			'</p>' +
			'<p><button>Copy to clipboard</button></p>' +
			'<p>' +
			'<dl class="error-popup-message">' +
			'<dt>Message</dt>' +
			'<dd>' + escapeHtml(error.messageOrEvent) + '</dd>' +
			'<dt>Source</dt>' +
			'<dd>' + escapeHtml(error.source) + '</dd>' +
			'<dt>Line:column</dt>' +
			'<dd>' + escapeHtml(error.lineno) + ':' + escapeHtml(error.colno) + '</dd>' +
			'<dt>Stack trace</dt>' +
			'<dd>' + escapeHtml(error.stack) + '</dd>' +
			'</p>' +
			'<p><button class="error-popup-close-button">Close</button></p>'
		let clickHandler = function(e: MouseEvent) {
			if (e.target instanceof HTMLButtonElement) {
				if (/\berror-popup-close-button\b/.test(e.target.className)) {
					markup.removeEventListener('click', clickHandler)
					document.body.removeChild(markup)
					errorsReported--
				} else {
					let textarea = markup.querySelector('textarea')
					textarea!.select()
					try {
						if (!document.execCommand('copy')) throw new Error()
					} catch (e) {
						alert('Copy to clipboard failed. Please copy manually.')
					}
				}
			}
		}
		markup.addEventListener('click', clickHandler)
		document.body.insertBefore(markup, document.body.firstChild)
	}
}

function escapeHtml(s: string) {
	return String(s).replace(/[&<>"']/g, function(s) {
		return entityMap[s]!
	})
}

function getExtraDetails() {
	let result = ``
	for (let provider of extraDetailsProviders) {
		if (provider) {
			try {
				result += `\n\n${provider()}`
			} catch (e) {
				result += `\n\n[p61rmi] PROVIDER ERROR: ${e}`
			}
		}
	}
	return result
}

export function provideExtraDetails(v: () => string) {
	if (v) {
		extraDetailsProviders.push(v)
	}
}

export function removeExtraDetailsProvider(v: () => string) {
	extraDetailsProviders = extraDetailsProviders.filter(_ => _ !== v)
}