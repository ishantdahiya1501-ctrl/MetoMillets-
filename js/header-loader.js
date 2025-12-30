(() => {
	"use strict";

	const getContainer = () => document.getElementById("header-container");

	// Lightweight, filename-based active state that works for file:// and http(s)
	const setActiveNavLinks = (scope = document) => {
		const links = scope.querySelectorAll(
			".main-nav a, .mobile-nav-list a, .m-bottom-nav a"
		);
		if (!links.length) return;

		const currentFile = (() => {
			const raw = window.location.pathname.split("/").pop() || "index.html";
			return raw.toLowerCase();
		})();

		const getLinkFile = (link) => {
			const href = link.getAttribute("href") || "";
			const clean = href.split(/[?#]/)[0];
			const file = clean.split("/").pop() || "index.html";
			return file.toLowerCase();
		};

		// Clear all first, then apply to every matching link (desktop + mobile).
		links.forEach((lnk) => {
			lnk.classList.remove("active");
			lnk.removeAttribute("aria-current");
		});

		let matched = false;

		links.forEach((link) => {
			const linkFile = getLinkFile(link);
			if (linkFile === currentFile) {
				matched = true;
				link.classList.add("active");
				link.setAttribute("aria-current", "page");
			}

			// Keep highlight visible immediately on click.
			link.addEventListener("click", () => {
				links.forEach((lnk) => {
					lnk.classList.remove("active");
					lnk.removeAttribute("aria-current");
				});
				const targetFile = getLinkFile(link);
				links.forEach((lnk) => {
					if (getLinkFile(lnk) === targetFile) {
						lnk.classList.add("active");
						lnk.setAttribute("aria-current", "page");
					}
				});
			});
		});

		if (!matched) {
			links.forEach((lnk) => {
				if (getLinkFile(lnk) === "index.html") {
					lnk.classList.add("active");
					lnk.setAttribute("aria-current", "page");
					matched = true;
				}
			});

			if (!matched && links.length) {
				links[0].classList.add("active");
				links[0].setAttribute("aria-current", "page");
			}
		}
	};

	const init = () => {
		const container = getContainer();
		if (!container) {
			console.error("header-container element not found");
			// Even if container is missing, try to set active on any existing nav.
			setActiveNavLinks(document);
			return;
		}

		const src = container.getAttribute("data-header-src");
		if (src) window.loadHeaderWithEvent(src);
		else setActiveNavLinks(document);
	};

	window.loadHeaderWithEvent = function (src) {
		const container = getContainer();
		if (!container) {
			console.error("header-container element not found");
			setActiveNavLinks(document);
			return;
		}

		fetch(src)
			.then((res) => {
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
				return res.text();
			})
			.then((html) => {
				container.innerHTML = html;

				if (window.cartManager) {
					window.cartManager.updateCartCount();
					window.cartManager.updateWishlistCount();
				}

				setActiveNavLinks(container);
				window.dispatchEvent(new Event("headerLoaded"));
				console.log("Header loaded and event dispatched");
			})
			.catch((err) => {
				console.error("Error loading header:", err);
				container.innerHTML =
					'<p style="color: red;">Error loading navigation. Please refresh the page.</p>';
				setActiveNavLinks(document);
			});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			init();
			setActiveNavLinks(document);
		}, { once: true });
	} else {
		init();
		setActiveNavLinks(document);
	}
})();