const fallbackProducts = [
  {
    tag: "CV",
    title: "CV Template 01 · Executive Navy",
    description: "A refined two-column CV with a strong professional profile and clear experience timeline.",
    image: "assets/cv1.png",
    price: 10,
    editable: true,
    fileName: "cv-template-01.html"
  },
  {
    tag: "CV",
    title: "CV Template 02 · Graduate Teal",
    description: "A fresh graduate layout designed to bring education, internships, and early-career skills forward.",
    image: "assets/cv2.png",
    price: 10,
    editable: true,
    fileName: "cv-template-02.html"
  },
  {
    tag: "CV",
    title: "CV Template 03 · Modern Monochrome",
    description: "A high-contrast editorial CV with room for a concise profile and detailed work history.",
    image: "assets/cv3.png",
    price: 10,
    editable: true,
    fileName: "cv-template-03.html"
  },
  {
    tag: "CV",
    title: "CV Template 04 · Gold Accent",
    description: "A bold, structured layout for marketing, management, and client-facing careers.",
    image: "assets/cv4.png",
    price: 10,
    editable: true,
    fileName: "cv-template-04.html"
  },
  {
    tag: "CV",
    title: "CV Template 05 · Teal Creative",
    description: "A creative CV design with clear sections for education, projects, and visual skills.",
    image: "assets/cv5.png",
    price: 10,
    editable: true,
    fileName: "cv-template-05.html"
  },
  {
    tag: "CV",
    title: "CV Template 06 · Royal Blue",
    description: "A confident blue layout for technical specialists and experienced professionals.",
    image: "assets/cv6.png",
    price: 10,
    editable: true,
    fileName: "cv-template-06.html"
  },
  {
    tag: "CV",
    title: "CV Template 07 · Forest Editorial",
    description: "A premium editorial look with balanced profile, education, and career sections.",
    image: "assets/cv7.png",
    price: 10,
    editable: true,
    fileName: "cv-template-07.html"
  },
  {
    tag: "CV",
    title: "CV Template 08 · Minimal Teal",
    description: "A clean contemporary CV focused on readable content and a strong visual hierarchy.",
    image: "assets/cv8.png",
    price: 10,
    editable: true,
    fileName: "cv-template-08.html"
  },
  {
    tag: "CV",
    title: "CV Template 09 · Warm Minimal",
    description: "An understated warm-toned design for creative and professional roles.",
    image: "assets/cv9.png",
    price: 10,
    editable: true,
    fileName: "cv-template-09.html"
  },
  {
    tag: "CV",
    title: "CV Template 10 · Classic Blue",
    description: "A polished classic layout with strong contrast and practical section spacing.",
    image: "assets/cv10.png",
    price: 10,
    editable: true,
    fileName: "cv-template-10.html"
  },
  {
    tag: "Portfolio",
    title: "Minimal Portfolio Pack",
    description: "Elegant portfolio templates for designers, creatives, and developers.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    price: 11,
    editable: true,
    fileName: "minimal-portfolio-pack.pdf"
  },
  {
    tag: "Poster",
    title: "Campaign Poster Set",
    description: "High-impact promotional posters for launches, events, and campaigns.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    price: 9,
    editable: true,
    fileName: "campaign-poster-set.pdf"
  },
  {
    tag: "Cards",
    title: "Brand Card Bundle",
    description: "Business cards, contact cards, and social-ready brand assets.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    price: 11,
    editable: true,
    fileName: "brand-card-bundle.pdf"
  }
];

const fallbackCourses = [
  {
    title: "Graphic Design Fundamentals",
    level: "Beginner",
    lessons: "18 lessons",
    price: 49,
  },
  {
    title: "HTML & CSS for Creatives",
    level: "Intermediate",
    lessons: "22 lessons",
    price: 59,
  },
  {
    title: "Portfolio Building That Sells",
    level: "Advanced",
    lessons: "14 lessons",
    price: 69,
  }
];

const CART_KEY = "craftkitCart";
let products = [...fallbackProducts];
let courses = [...fallbackCourses];

async function isUserLoggedIn() {
  if (!supabaseClient) return false;
  const { data, error } = await supabaseClient.auth.getSession();
  return !error && Boolean(data.session);
}

function redirectToAuth(productTitle, purchaseType = "product") {
  localStorage.setItem("craftkitPendingCheckout", purchaseType === "cart" ? "__cart__" : productTitle || "");
  window.location.href = "register.html?next=checkout";
}

async function loadCatalog() {
  try {
    if (supabaseClient) {
      const [productResult, courseResult] = await Promise.all([
        supabaseClient.from("products").select("*").eq("is_active", true).order("created_at"),
        supabaseClient.from("courses").select("*").eq("is_active", true).order("created_at")
      ]);
      if (productResult.error) throw productResult.error;
      if (courseResult.error) throw courseResult.error;
      if (productResult.data?.length) {
        const remoteProducts = productResult.data
          .filter((product) => !(product.tag === "CV" && product.title === "Executive Resume Kit"))
          .map((product) => ({
          ...product,
          fileName: product.file_name,
          fileData: product.file_data
          }));
        const remoteTitles = new Set(remoteProducts.map((product) => product.title));
        const localCvProducts = fallbackProducts.filter((product) => product.tag === "CV" && !remoteTitles.has(product.title));
        products = [...remoteProducts, ...localCvProducts];
      }
      if (courseResult.data?.length) courses = courseResult.data;
    }
  } catch (error) {
    console.warn("Using the built-in catalog because Supabase catalog data could not be loaded.", error);
  }

  renderProducts();
  renderCourses();
  attachHomeControls();
  renderCart();

  const pendingCheckout = localStorage.getItem("craftkitPendingCheckout");
  if (pendingCheckout) {
    localStorage.removeItem("craftkitPendingCheckout");
    const hasSession = await isUserLoggedIn();
    if (pendingCheckout === "__cart__") {
      const items = getCart();
      if (items.length && hasSession) openCartCheckoutFromItems(items);
    } else if (hasSession && products.some((item) => item.title === pendingCheckout)) {
      openCheckout(pendingCheckout);
    }
  }
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const cartPanel = document.getElementById("cartPanel");
  const items = getCart();
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  if (cartCount) cartCount.textContent = items.length;
  if (cartTotal) cartTotal.textContent = `$${total}`;
  if (!cartItems) return;

  if (!items.length) {
    cartItems.innerHTML = '<li><span>Your cart is empty.</span></li>';
    return;
  }

  cartItems.innerHTML = items
    .map(
      (item) => `
        <li>
          <span>${item.title}</span>
          <div>
            <strong>$${item.price}</strong>
            <button type="button" data-remove="${item.title}">Remove</button>
          </div>
        </li>
      `
    )
    .join("");

  cartItems.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const newItems = getCart().filter((item) => item.title !== button.dataset.remove);
      saveCart(newItems);
      renderCart();
    });
  });
}

function addToCart(productTitle) {
  const product = products.find((item) => item.title === productTitle);
  if (!product) return;

  const cart = getCart();
  cart.push({ title: product.title, price: product.price, tag: product.tag });
  saveCart(cart);
  renderCart();
}

const productGrid = document.getElementById("productGrid");
const courseGrid = document.getElementById("courseGrid");
const yearNode = document.getElementById("year");
const navbar = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const checkoutModal = document.getElementById("checkoutModal");
const studentModal = document.getElementById("studentModal");
const checkoutTitle = document.getElementById("checkoutTitle");
const checkoutSuccess = document.getElementById("checkoutSuccess");
const checkoutForm = document.getElementById("checkoutForm");
const studentForm = document.getElementById("studentForm");
const studentSuccess = document.getElementById("studentSuccess");
const studentTitle = document.getElementById("studentTitle");
const cartButton = document.getElementById("cartButton");
const cartPanel = document.getElementById("cartPanel");
const closeCartButton = document.getElementById("closeCart");
const checkoutCartButton = document.getElementById("checkoutCartBtn");
let activeProduct = null;

if (yearNode) yearNode.textContent = new Date().getFullYear();

function renderProducts() {
  if (!productGrid) return;

  const pageTag = document.body.dataset.productTag;
  const pageLimit = Number(productGrid.dataset.limit || 0);
  const featuredCv = productGrid.dataset.featuredCv === "true";
  const visibleProducts = products
    .filter((product) => featuredCv ? product.tag.toLowerCase() === "cv" : !pageTag || product.tag.toLowerCase() === pageTag.toLowerCase())
    .slice(0, pageLimit || undefined);

  productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image ${product.tag === "CV" ? "cv-product-image" : ""}" style="background-image: url('${product.image}')"></div>
          <div class="product-body">
            <span class="product-tag">${product.tag}</span>
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            ${product.tag === "CV" ? `<a class="cv-customize-link" href="cv-editor.html?templateNumber=${Number((product.image.match(/cv(\d+)/i) || [])[1]) || 1}&title=${encodeURIComponent(product.title)}">Customize this CV</a>` : ""}
            <div class="product-meta">
              <span class="price">$${product.price}</span>
              <div class="product-actions">
                <button type="button" class="btn btn-secondary cart-add-btn" data-product="${product.title}">Add to cart</button>
                <button type="button" class="btn btn-primary buy-btn" data-product="${product.title}">Get it</button>
              </div>
            </div>
            <div class="editable-badge">${product.editable ? "Editable template" : "Digital download"}</div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCourses() {
  if (!courseGrid) return;

  courseGrid.innerHTML = courses
    .map(
      (course) => `
        <article class="course-card">
          <span class="level">${course.level}</span>
          <h3>${course.title}</h3>
          <p>${course.lessons} • Practical training • Downloadable resources</p>
          <div class="meta-row">
            <span>${course.lessons}</span>
            <span class="price">$${course.price}</span>
          </div>
          <div style="margin-top: 1rem;">
            <button type="button" class="btn btn-primary enroll-btn" data-course="${course.title}">Enroll now</button>
          </div>
        </article>
      `
    )
    .join("");
}

function openCheckout(productTitle) {
  const product = products.find((item) => item.title === productTitle);
  if (!product || !checkoutModal || !checkoutTitle || !checkoutForm || !checkoutSuccess) return;

  activeProduct = product;
  checkoutTitle.textContent = `${product.title} — $${product.price}`;
  checkoutSuccess.classList.add("hidden");
  checkoutSuccess.innerHTML = "";
  checkoutForm.reset();
  delete checkoutForm.dataset.cartItems;
  checkoutForm.classList.remove("hidden");
  checkoutModal.classList.remove("hidden");
  checkoutModal.setAttribute("aria-hidden", "false");
}

function openCartCheckoutFromItems(items) {
  if (!checkoutModal || !checkoutTitle || !checkoutForm || !checkoutSuccess) return;
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  activeProduct = { title: `Cart (${items.length} items)`, price: total };
  checkoutTitle.textContent = `Cart — $${total}`;
  checkoutSuccess.classList.add("hidden");
  checkoutSuccess.innerHTML = "";
  checkoutForm.reset();
  checkoutForm.classList.remove("hidden");
  checkoutModal.classList.remove("hidden");
  checkoutModal.setAttribute("aria-hidden", "false");
  checkoutForm.dataset.cartItems = JSON.stringify(items);
}

function openStudentAccess(courseTitle) {
  const course = courses.find((item) => item.title === courseTitle);
  if (!course || !studentModal || !studentForm || !studentSuccess || !studentTitle) return;

  studentTitle.textContent = `${course.title} — access granted`;
  studentSuccess.classList.add("hidden");
  studentSuccess.innerHTML = "";
  studentForm.reset();
  studentForm.classList.remove("hidden");
  studentModal.classList.remove("hidden");
  studentModal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function triggerDownload(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadProductFile(product) {
  if (!product) return;

  if (product.fileData) {
    const link = document.createElement("a");
    link.href = product.fileData;
    link.download = product.fileName || `${product.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const fallbackText = `CRAFTKIT Studio editable digital asset\n\nProduct: ${product.title}\nType: ${product.tag}\nPrice: $${product.price}\nEditable: Yes`;
  triggerDownload(product.fileName || `${product.title.toLowerCase().replace(/\s+/g, "-")}.txt`, fallbackText);
}

function getAIRecommendation(prompt = "") {
  const query = String(prompt || "").toLowerCase();

  if (/cv|resume|job|career|linkedin/.test(query)) {
    if (/edit|editing|improve|rewrite|write|bullet|summary|experience|ats|wording/.test(query)) {
      let advice = "Keep the layout, but replace every placeholder with your own details. Start bullets with action verbs, focus on outcomes, and keep dates, job titles, and punctuation consistent.";
      if (/summary|profile|about/.test(query)) advice = "Write a 2–3 sentence profile: your role or target role, strongest relevant skills, and one proof point. Avoid generic claims like 'hard-working'; show evidence instead.";
      else if (/bullet|experience|achievement/.test(query)) advice = "Use action + task + measurable result: 'Automated weekly reporting, cutting preparation time by 4 hours.' Start with a strong verb, quantify honestly, and keep each bullet to one or two lines.";
      else if (/ats|keyword/.test(query)) advice = "For ATS readability, use standard section headings, a selectable-text export, and keywords that honestly match the job description. Avoid putting essential contact details inside graphics.";
      else if (/skill/.test(query)) advice = "Prioritize 6–10 role-relevant skills. Mirror terminology from the target job description where truthful, and remove broad traits that are not backed by examples.";
      return {
        title: "CV Editing Coach",
        kind: "cv-editor",
        cta: "Open CV editor",
        message: advice
      };
    }
    return {
      title: "CV Template 01 · Executive Navy",
      kind: "cv-collection",
      cta: "Browse CV templates",
      message: "Choose from ten CV layouts at $10 each. Open the collection to compare designs, then personalize your details in the CV editor."
    };
  }

  if (/portfolio|website|brand|designer|developer|creative/.test(query)) {
    return {
      title: "Minimal Portfolio Pack",
      kind: "template",
      cta: "Explore portfolio templates",
      message: "A portfolio-first brand needs a presentation that feels premium. The Minimal Portfolio Pack is the best fit for visual storytelling and client trust."
    };
  }

  if (/poster|launch|event|campaign|social media/.test(query)) {
    return {
      title: "Campaign Poster Set",
      kind: "template",
      cta: "View poster templates",
      message: "For campaigns or event promotions, the Campaign Poster Set gives you scroll-stopping layouts and fast-ready creative assets."
    };
  }

  if (/card|business card|contact|network/.test(query)) {
    return {
      title: "Brand Card Bundle",
      kind: "template",
      cta: "Open the card bundle",
      message: "If you want a clean, professional personal brand, the Brand Card Bundle helps you look premium in every networking moment."
    };
  }

  if (/design|graphics|canva|branding/.test(query)) {
    return {
      title: "Graphic Design Fundamentals",
      kind: "course",
      cta: "Enroll in design course",
      message: "You should start with Graphic Design Fundamentals to build a strong visual foundation before selling premium templates."
    };
  }

  if (/code|css|html|web|developer/.test(query)) {
    return {
      title: "HTML & CSS for Creatives",
      kind: "course",
      cta: "Start coding lessons",
      message: "If you want to build and sell web-ready creative assets, HTML & CSS for Creatives is the smartest next step."
    };
  }

  if (/sell|business|client|growth|income/.test(query)) {
    return {
      title: "Portfolio Building That Sells",
      kind: "course",
      cta: "See growth course",
      message: "The best path to turning creative work into income is Portfolio Building That Sells. It connects your creative skills to client acquisition."
    };
  }

  return {
    title: "Creative Starter Kit",
    kind: "bundle",
    cta: "See the best bundle",
    message: "The fastest route is the Creative Starter Kit: a premium mix of templates, portfolio assets, and personal-brand resources for creators who want a clean launch."
  };
}

function injectAIAssistant() {
  if (document.getElementById("craftkitAiWidget")) return;

  const widget = document.createElement("div");
  widget.id = "craftkitAiWidget";
  widget.className = "ai-assistant-widget hidden";
  widget.innerHTML = `
    <div class="ai-assistant-header">
      <div>
        <span class="ai-pill">AI</span>
        <strong>CRAFTKIT AI</strong>
      </div>
      <button type="button" class="ai-close" aria-label="Close AI assistant">×</button>
    </div>
    <div class="ai-chat-body">
      <div class="ai-message ai-message-bot">
        Hi! I can suggest templates and courses, and coach you through improving your CV wording and layout.
      </div>
    </div>
    <div class="ai-quick-actions">
      <button type="button" class="ai-chip" data-prompt="Help me edit my CV summary">Edit CV</button>
      <button type="button" class="ai-chip" data-prompt="I want a portfolio">Portfolio</button>
      <button type="button" class="ai-chip" data-prompt="I need design lessons">Design</button>
      <button type="button" class="ai-chip" data-prompt="I want to learn coding">Coding</button>
    </div>
    <form id="aiAssistantForm" class="ai-form">
      <input type="text" id="aiAssistantInput" placeholder="Ask about CV wording, skills, or templates" aria-label="AI assistant input" />
      <button type="submit" class="btn btn-primary">Ask AI</button>
    </form>
  `;

  document.body.appendChild(widget);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "craftkitAiToggle";
  toggle.className = "ai-toggle";
  toggle.innerHTML = "AI ✦";
  document.body.appendChild(toggle);

  const openAssistant = () => widget.classList.remove("hidden");
  const closeAssistant = () => widget.classList.add("hidden");

  toggle.addEventListener("click", () => {
    widget.classList.toggle("hidden");
  });

  widget.querySelector(".ai-close").addEventListener("click", closeAssistant);

  widget.querySelectorAll(".ai-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.dataset.prompt || "";
      const input = document.getElementById("aiAssistantInput");
      if (input) input.value = prompt;
      openAssistant();
      handleAIAssistant(prompt);
    });
  });

  const form = document.getElementById("aiAssistantForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("aiAssistantInput");
      const prompt = input ? input.value.trim() : "";
      if (!prompt) return;
      handleAIAssistant(prompt);
      input.value = "";
    });
  }
}

function handleAIAssistant(prompt) {
  const widget = document.getElementById("craftkitAiWidget");
  if (!widget) return;

  const chatBody = widget.querySelector(".ai-chat-body");
  if (!chatBody) return;

  const recommendation = getAIRecommendation(prompt);
  const safePrompt = String(prompt).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  const message = `
    <div class="ai-message ai-message-user">${safePrompt}</div>
    <div class="ai-message ai-message-bot">
      ${recommendation.message}
      <div class="ai-recommendation">
        <strong>${recommendation.title}</strong>
        <span>${recommendation.kind}</span>
      </div>
      <button type="button" class="btn btn-primary ai-cta" data-kind="${recommendation.kind}" data-title="${recommendation.title}">${recommendation.cta}</button>
    </div>
  `;

  chatBody.insertAdjacentHTML("beforeend", message);
  chatBody.scrollTop = chatBody.scrollHeight;

  const cta = chatBody.querySelectorAll(".ai-cta").at(-1);
  if (cta) {
    cta.addEventListener("click", async () => {
      const title = cta.dataset.title || "";
      if (cta.dataset.kind === "cv-editor") {
        window.location.href = "cv-editor.html";
        return;
      }
      if (cta.dataset.kind === "cv-collection") {
        window.location.href = "cv-templates.html";
        return;
      }
      if (cta.dataset.kind === "template") {
        if (!await isUserLoggedIn()) {
          redirectToAuth(title);
          return;
        }
        openCheckout(title);
      } else if (cta.dataset.kind === "course") {
        openStudentAccess(title);
      } else if (title) {
        if (!await isUserLoggedIn()) {
          redirectToAuth(title);
          return;
        }
        openCheckout(title);
      }
    });
  }
}

function attachHomeControls() {
  const buyButtons = document.querySelectorAll(".buy-btn");
  buyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!await isUserLoggedIn()) {
        redirectToAuth(button.dataset.product);
        return;
      }
      openCheckout(button.dataset.product);
    });
  });

  const cartAddButtons = document.querySelectorAll(".cart-add-btn");
  cartAddButtons.forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.product));
  });

  const enrollButtons = document.querySelectorAll(".enroll-btn");
  enrollButtons.forEach((button) => {
    button.addEventListener("click", () => openStudentAccess(button.dataset.course));
  });

  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const navLinks = document.querySelectorAll(".main-nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (navbar) navbar.classList.remove("open");
      if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  const newsletterForm = document.querySelector(".newsletter");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = newsletterForm.querySelector("button");
      const input = newsletterForm.querySelector("input");
      button.textContent = "Joined";
      input.value = "";
      input.placeholder = "Thanks for joining!";
    });
  }

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.close);
      closeModal(target);
    });
  });
}

if (cartButton) {
  cartButton.addEventListener("click", () => {
    if (!cartPanel) return;
    const isOpening = cartPanel.classList.contains("hidden");
    cartPanel.classList.toggle("hidden", !isOpening);
    cartPanel.setAttribute("aria-hidden", String(!isOpening));
  });
}

if (closeCartButton) {
  closeCartButton.addEventListener("click", () => {
    if (cartPanel) {
      cartPanel.classList.add("hidden");
      cartPanel.setAttribute("aria-hidden", "true");
    }
  });
}

if (checkoutCartButton) {
  checkoutCartButton.addEventListener("click", async () => {
    const items = getCart();
    if (!items.length) return;
    if (!await isUserLoggedIn()) {
      redirectToAuth("cart", "cart");
      return;
    }
    openCartCheckoutFromItems(items);
    if (cartPanel) {
      cartPanel.classList.add("hidden");
      cartPanel.setAttribute("aria-hidden", "true");
    }
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(checkoutForm);
    const name = formData.get("name");
    const email = formData.get("email");
    const items = JSON.parse(checkoutForm.dataset.cartItems || "[]");
    const purchaseItems = items.length ? items : [{ title: activeProduct.title, price: activeProduct.price }];
    const total = purchaseItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

    checkoutSuccess.classList.add("hidden");
    try {
      const client = requireSupabase();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please log in before placing an order.");

      const { error } = await client.from("orders").insert({
        user_id: user.id,
        name: String(name),
        email: String(email),
        items: purchaseItems,
        total,
        payment_method: "demo",
        status: "demo"
      });
      if (error) throw error;

      saveCart([]);
      renderCart();
      checkoutForm.classList.add("hidden");
      checkoutSuccess.textContent = `Thanks, ${name}. Your demo order was saved to your Supabase account. No payment was taken.`;
      checkoutSuccess.classList.remove("hidden");
    } catch (error) {
      checkoutSuccess.textContent = error.message || "Could not save this order. Check Supabase configuration and policies.";
      checkoutSuccess.classList.remove("hidden");
    }
  });
}

if (studentForm) {
  studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(studentForm);
    const email = formData.get("studentEmail");
    const password = formData.get("studentPassword");
    const courseTitle = studentTitle?.textContent.replace(" — access granted", "") || "course";

    if (!email || !password) return;

    const payload = { email, password, course: courseTitle };

    try {
      await loginCraftkitAccount(email, password);
    } catch (error) {
      studentSuccess.textContent = error.message;
      studentSuccess.classList.remove("hidden");
      return;
    }

    studentForm.classList.add("hidden");
    studentSuccess.innerHTML = `
      <strong>Welcome back!</strong><br />
      Your access to <strong>${courseTitle}</strong> is active.<br />
      A lesson dashboard has been sent to <strong>${email}</strong>.<br />
      <a href="dashboard.html" style="color: #fff; font-weight: 700; text-decoration: underline;">Open dashboard</a>
    `;
    studentSuccess.classList.remove("hidden");
  });
}

if (productGrid || courseGrid) {
  loadCatalog();
  injectAIAssistant();
} else {
  injectAIAssistant();
}

function initHeroSlider() {
  const slider = document.querySelector("[data-hero-slider]");
  if (!slider) return;

  const slides = [...slider.querySelectorAll(".slide")];
  const dots = [...slider.querySelectorAll("[data-slide-dot]")];
  if (!slides.length) return;

  let currentIndex = 0;

  const showSlide = (index) => {
    slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === index));
    dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      currentIndex = Number(dot.dataset.slideDot || 0);
      showSlide(currentIndex);
    });
  });

  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }, 4200);
}

function initAnimatedWords() {
  const wordGroup = document.querySelector("[data-word-group]");
  if (!wordGroup) return;

  const words = JSON.parse(wordGroup.dataset.words || "[]");
  if (!words.length) return;

  let wordIndex = 0;
  const updateWord = () => {
    wordGroup.textContent = words[wordIndex];
    wordIndex = (wordIndex + 1) % words.length;
  };

  updateWord();
  setInterval(updateWord, 1800);
}

initHeroSlider();
initAnimatedWords();
