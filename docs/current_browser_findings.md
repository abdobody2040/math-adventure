# Current Browser Findings

On 2026-08-26, an early unauthenticated mobile preview at 375×812 rendered the localized startup skeleton. A subsequent browser check confirmed that the public landing page does load normally after the authentication query settles, including Arabic RTL content, the language toggle, and the parent-account call to action. Switching back to English preserved legible left-to-right layout and the same parent-account entry point. The development log reported only a missing session cookie and contained no fresh server exception for that view. Authenticated child, parent, and administrator flows remain unverified because a real parent session was unavailable.

Later that day, a fresh 375×812 preview again captured the startup skeleton on its initial frame; a direct browser navigation then showed the public English landing page normally. This supports treating the skeleton capture as an early-load artifact rather than evidence of a persistent public-route failure. Authenticated acceptance remains unavailable without a real parent-owned child profile.

The current public browser session had no console output after the landing page loaded. Its service worker registration was active with no waiting worker on the preview origin. This verifies registration state only; it does not replace an offline/reconnect test for protected learning progress.
