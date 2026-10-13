i'm using BEM for styling

used next.js official site for guidance, then when i moved to vanilla, mdn docs and chatgpt

placed cards in categorised sections of two media each at first but decided to de-section everything so I could apply grid/flex positioning directly to all the cards without added complexity/workarounds to get it looking consistent. placed ids that will be referenced by anchor tags on the first media element of each category

considered using an object to store urls per name but decided the additional javascript needed to implement this would not be worth it. decided against next.js since there is no complex state involved and typing things directly instead of having abstractions simplifies things and the implementation of things

checked vscode devtools to find out why media was overflowing the screen rather than fitting in its wrapper. the issue is that i forgot to add the link to the css file in the HTML file's head tag

it took some time to get the images and videos displaying properly without overflowing in their liquid glass-style containers, but i was able to do it.

I used ChatGPT to generate a liquid glass effect for the card and for the background and then i pasted them into claude to generate artifacts of them so I could look at them and pick the one I would use.

I decided to group media by category (two on a line on wider screens).

! I want click, right click and long press to open images in full screen so users cannot download them. Block default behaviour first.

The second image of my UI/UX design work for Zorevia was previously quite long - 11 screens side by side. I re-edited the image on Canva to contain 5 screens instead and added a matching background colour. The image is more legible and focused this way

clicking an image or video makes it fullscreen

! update fullscreen implementation (it takes the entire device into fullscreen mode)




Each technique below covers what it does, how to implement it, and how easily someone gets around it.

## 1. Right-click disabling

**What it does:** It blocks the browser's context menu (the "Save image as…" menu) on your media.

```js
document.addEventListener('contextmenu', e => {
  if (e.target.closest('img, video, audio')) e.preventDefault();
});
```

**How it's bypassed:** A visitor can open dev tools (F12), use "View page source", press Ctrl+S, drag the image to the desktop, or disable JavaScript. Mobile long-press menus can also bypass it.

**Downside:** It annoys legitimate visitors, for example people who want to copy text or open a link in a new tab. Apply it to the media only, not the whole page.

## 2. Disabling dragging and selection

**What it does:** It stops users from dragging an image onto their desktop and from highlighting it.

```html
<img src="work.jpg" draggable="false" />
```
```css
img { -webkit-user-drag: none; user-select: none; }
```

**How it's bypassed:** Dev tools, the network tab, or a screenshot. This only removes the easiest path.

## 3. Transparent overlay divs

**What it does:** You place an invisible `<div>` over the image. When someone right-clicks or drags, they hit the div and not the `<img>`, so "Save image as…" doesn't appear.

```css
.protected { position: relative; }
.protected::after { content: ""; position: absolute; inset: 0; }
```

**How it's bypassed:** Inspect the page, delete the div, and the image is right there. It also doesn't affect the network tab, where the file URL is visible. It's a weak measure, and the CSS version above is the cleanest way to do it.

A stronger variant is to render the image as a CSS `background-image` or draw it on a `<canvas>` instead of using `<img>`. The file is still downloadable from the network tab, but it stops "Save image as…" and wastes a bit more of the visitor's time.

## 4. Hotlink protection

**What it does:** It stops other websites from embedding your images directly (using your bandwidth and displaying your work without credit). It isn't about stopping visitors to your own site.

**How it works:** When a browser requests an image, it sends a `Referer` header with the page that requested it. The server checks that header and refuses the request if it comes from a domain other than yours.

- **Cloudflare:** Enable "Hotlink Protection" in Scrape Shield (Cloudflare dashboard).
- **Nginx:**
  ```nginx
  location ~* \.(jpg|jpeg|png|gif|webp|mp4)$ {
    valid_referers none blocked yourdomain.com *.yourdomain.com;
    if ($invalid_referer) { return 403; }
  }
  ```
- **Vercel / Next.js:** use middleware to check the `Referer` header on your media route.

**How it's bypassed:** The `Referer` header can be forged or removed by anyone using a script or curl. It stops casual embedding on other sites, not a determined person who downloads the file directly.

## 5. `controlsList="nodownload"`

**What it does:** It removes the download option from the native video and audio player menu (the three-dots menu in Chrome).

```html
<video src="reel.mp4" controls controlsList="nodownload"></video>
```

**How it's bypassed:** The file URL is still in the page and the network tab, so anyone can open it directly and save it. Firefox and Safari may not honor the attribute at all. It hides a button and does nothing else.

## 6. Streaming with HLS or DASH

**What it does:** Instead of one `reel.mp4` file, the video is split into many short segments (a few seconds each) plus a playlist file. The player downloads and plays the segments in order. There is no single file to right-click and save, so a basic "Save video as" fails.

**Services:**
- **Mux:** developer-focused API, good analytics, pay per minute stored and streamed. A good fit if you're building in code.
- **Cloudflare Stream:** simple pricing, tied into the Cloudflare ecosystem.
- **Vimeo:** easiest. It has a hosted player with domain-level privacy ("only allow embedding on these domains") and hides the download button. Less control over the design.

**You get:** adaptive quality (it adjusts to the viewer's connection), faster start times, and an upload-and-forget workflow.

**How it's bypassed:** Browser extensions and tools like yt-dlp or ffmpeg can download the playlist and stitch the segments together. HLS is a speed bump, not a lock, unless you add DRM.

## 7. Signed, expiring URLs

**What it does:** Your server generates a media URL that includes a cryptographic signature and an expiry time. The storage or CDN checks the signature on each request. After the time runs out, or if the URL is altered, it returns 403.

```
https://cdn.example.com/reel.m3u8?exp=1760000000&sig=abc123...
```

**How it works in practice:**
1. A visitor loads your page.
2. Your server (for example a Next.js server component or API route) generates a URL valid for, say, 10 minutes.
3. That URL goes into the page. The player uses it.
4. If someone copies the URL and shares it, it stops working when the time is up.

**Where it's available:** Mux (signed playback), Cloudflare Stream (signed tokens), AWS S3 and CloudFront (pre-signed URLs), Vimeo (domain restrictions rather than signing).

**How it's bypassed:** Someone can still download the file during the valid window. It prevents link sharing and long-term hotlinking, not downloading during playback.

## Other options for a portfolio

- **Watermarking:** a visible logo or name on the image or video, ideally placed over the important part so it can't be cropped out. For stills, a semi-transparent tiled watermark is the most effective deterrent. For video, burn it into the file.
- **Low-resolution public versions:** a 1200px-wide JPEG at moderate quality is fine for browsing and useless for printing. Keep full-resolution originals off the public site. For video, publish 720p or less.
- **Invisible watermarking / fingerprinting:** services such as Digimarc embed an identifier in the pixels that survives resizing and re-compression, so you can prove ownership later.
- **Metadata:** embed copyright and contact info (IPTC/EXIF) in each file. It's easily stripped, but many platforms preserve it.
- **Copyright notice and terms of use** on the site, plus formal copyright registration if you ever want to claim damages.
- **Reverse image search monitoring** (Google Lens, TinEye, Pixsy) to find and take down copies.
- **Login or contact gate** for the highest-value pieces: show a preview publicly and share the full piece on request.
- **DRM (Widevine, FairPlay):** available through Mux, Cloudflare Stream and similar. It's the only option that resists copying of video. It adds cost and complexity and is usually overkill for a portfolio.

## What I'd do for your portfolio

1. Use watermarked, web-resolution images served through Next.js's image component, with originals kept private.
2. Host video on Mux or Cloudflare Stream with signed URLs, or on Vimeo if you want the simplest setup.
3. Add hotlink protection at your CDN.
4. Add right-click and drag blocking on media only, for casual deterrence.
5. Put a copyright notice in the footer, and embed copyright metadata in the files.

Steps 1 and 2 do most of the work, and steps 3 to 5 are cheap extras. Nothing here makes a copy impossible, but the combination makes theft inconvenient and makes stolen copies traceable to you.

Do you want me to scaffold the Next.js project with these protections built in (a watermarked image component and a signed-URL video player)?
