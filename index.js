const SKILLS_HASH = "#skills";
const EMAIL = "oge.o.onuora@gmail.com";

const skillsModal = document.getElementById("skills-modal");
const skillsModalClose = document.getElementById("skills-modal-close");
const skillsOpenLinks = document.querySelectorAll("[data-skills-open]");
const copyEmailButtons = document.querySelectorAll("[data-copy-email]");
const cardToggles = document.querySelectorAll("[data-card-toggle]");




// skills modal and the #skills link

function openSkillsModal() {
  if (!skillsModal.open) skillsModal.showModal();
}

// click a Skills link: open the modal and add #skills to the URL
skillsOpenLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (location.hash !== SKILLS_HASH) {
      history.pushState({ modal: "skills" }, "", SKILLS_HASH);
    }
    openSkillsModal();
  });
});

// X button and backdrop click (Escape is handled natively)
skillsModalClose.addEventListener("click", () => skillsModal.close());
skillsModal.addEventListener("click", (event) => {
  if (event.target === skillsModal) skillsModal.close();
});

// every way of closing ends up here, so the URL stays in sync
skillsModal.addEventListener("close", () => {
  if (location.hash !== SKILLS_HASH) return;

  if (history.state?.modal === "skills") {
    history.back(); // we pushed #skills ourselves, so step back
  } else {
    // the visitor landed directly on /#skills, so just clean the URL
    history.replaceState(null, "", location.pathname + location.search);
  }
});

// browser back/forward buttons, or the hash being edited by hand
window.addEventListener("popstate", () => {
  if (location.hash === SKILLS_HASH) {
    openSkillsModal();
  } else if (skillsModal.open) {
    skillsModal.close();
  }
});

// visiting yoursite.com/#skills directly opens the modal
if (location.hash === SKILLS_HASH) openSkillsModal();




// copy email

copyEmailButtons.forEach((button) => {
  const label = button.querySelector("span");
  const originalText = label.textContent;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      label.textContent = "Copied";
    } catch {
      label.textContent = EMAIL; // clipboard blocked, so show the address instead
    }
    button.classList.add("is-copied");

    setTimeout(() => {
      label.textContent = originalText;
      button.classList.remove("is-copied");
    }, 2000);
  });
});




// collapsible work cards: "Show more" / "Show less"

cardToggles.forEach((button) => {
  const card = button.closest(".work__card");
  const label = button.querySelector(".work__toggle-label");
  const moreText = label.textContent;

  button.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Show less" : moreText;
  });
});




// image carousels: previous/next buttons and dots

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const slides = track.children;
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsWrapper = carousel.parentElement.querySelector("[data-carousel-dots]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const currentIndex = () => Math.round(track.scrollLeft / track.clientWidth);

  function goTo(index) {
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  // one dot per image
  const dots = Array.from(slides, (slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", `Image ${index + 1} of ${slides.length}`);
    dot.addEventListener("click", () => goTo(index));
    dotsWrapper.append(dot);
    return dot;
  });

  function update() {
    const index = currentIndex();
    previousButton.disabled = index === 0;
    nextButton.disabled = index === slides.length - 1;
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute("aria-current", String(dotIndex === index));
    });
  }

  previousButton.addEventListener("click", () => goTo(currentIndex() - 1));
  nextButton.addEventListener("click", () => goTo(currentIndex() + 1));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});




// media: no right-click menu ("Save image as…" / "Save video as…")

document.addEventListener("contextmenu", (event) => {
  if (event.target.closest("img, video")) event.preventDefault();
});
