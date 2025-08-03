/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateBtn = document.getElementById("generateRoutine");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
let allProducts = []; // Store all products for filtering
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  filterAndDisplayProducts();
}

/* Load selected products from localStorage (if any) when the page loads */
let selectedProducts = [];
const savedProducts = localStorage.getItem("selectedProducts");
if (savedProducts) {
  try {
    selectedProducts = JSON.parse(savedProducts);
  } catch (e) {
    selectedProducts = [];
  }
}

/* Reference to the selected products area */
const selectedProductsArea = document.getElementById("selectedProducts");

/* Helper to update the selected products list in the DOM */
function updateSelectedProductsArea() {
  if (selectedProducts.length === 0) {
    selectedProductsArea.innerHTML = "<em>No products selected</em>";
  } else {
    // Show each selected product with a red X icon to remove
    selectedProductsArea.innerHTML = `
      <ul style="list-style: none; padding-left: 0;">
        ${selectedProducts
          .map(
            (p) => `
            <li>
              <span 
                class="remove-x" 
                data-remove-name="${p.name}"
                title="Remove"
              >&times;</span>
              ${p.name}
            </li>
          `
          )
          .join("")}
      </ul>
    `;

    // Add click event listeners for each X icon
    document.querySelectorAll(".remove-x").forEach((icon) => {
      icon.addEventListener("click", (e) => {
        const name = icon.getAttribute("data-remove-name");
        // Remove from selectedProducts
        selectedProducts = selectedProducts.filter((p) => p.name !== name);
        // Update product cards UI
        document
          .querySelectorAll(`.product-card[data-product-name="${name}"]`)
          .forEach((card) => card.classList.remove("selected"));
        // Update the list
        updateSelectedProductsArea();
        saveSelectedProducts(); // Save after removal
      });
    });
  }
  saveSelectedProducts(); // Save after any update
}

/* Helper to save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Create HTML for displaying product cards, marking selected ones */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div 
      class="product-card${
        selectedProducts.some((p) => p.name === product.name) ? " selected" : ""
      }"
      data-product-name="${product.name}"
    >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <!-- Description bubble, hidden by default -->
      <div class="desc-bubble">${product.description}</div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to each product card
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      // Only select if not clicking the bubble
      if (event.target.classList.contains("desc-bubble")) return;
      const name = card.getAttribute("data-product-name");
      const productObj = products.find((p) => p.name === name);

      if (selectedProducts.some((p) => p.name === name)) {
        selectedProducts = selectedProducts.filter((p) => p.name !== name);
        card.classList.remove("selected");
      } else {
        selectedProducts.push(productObj);
        card.classList.add("selected");
      }
      updateSelectedProductsArea();
      saveSelectedProducts(); // Save after selection change
    });

    // Show bubble after short hover, hide on mouse leave
    let bubbleTimeout;
    const bubble = card.querySelector(".desc-bubble");

    card.addEventListener("mouseenter", () => {
      bubbleTimeout = setTimeout(() => {
        bubble.classList.add("visible");
      }, 400); // 400ms delay before showing
    });

    card.addEventListener("mouseleave", () => {
      clearTimeout(bubbleTimeout);
      // Only hide if not hovering bubble
      setTimeout(() => {
        if (!bubble.matches(":hover")) {
          bubble.classList.remove("visible");
        }
      }, 100); // small delay for moving to bubble
    });

    bubble.addEventListener("mouseleave", () => {
      bubble.classList.remove("visible");
    });

    bubble.addEventListener("mouseenter", () => {
      bubble.classList.add("visible");
    });
  });
  updateSelectedProductsArea();
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", filterAndDisplayProducts);
productSearch.addEventListener("input", filterAndDisplayProducts);

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

// Store conversation history for follow-up questions
let chatMessages = [];

// Helper to render the chat history in bubbles
function renderChat() {
  chatWindow.innerHTML = chatMessages
    .map((msg) => {
      // Use a different bubble for user and assistant
      const sender = msg.role === "user" ? "You" : "Assistant";
      const bubbleClass =
        msg.role === "user" ? "chat-bubble user" : "chat-bubble assistant";
      // Use marked.parse for assistant (Markdown), plain for user
      const content =
        msg.role === "assistant"
          ? marked.parse(msg.content)
          : `<span>${msg.content}</span>`;
      return `
        <div class="${bubbleClass}">
          <strong>${sender}:</strong> ${content}
        </div>
      `;
    })
    .join("");
}

// When "Generate Routine" is clicked, start a new conversation
generateBtn.addEventListener("click", async () => {
  // Build the actual prompt for the API
  const prompt = `Make me a detailed beauty routine using these products: ${selectedProducts
    .map(
      (p) =>
        `${p.name}, ${p.description}. Please try to stay as brief and concise as possible, act like a simple instruction guide you'd find on the back of a boxed dinner or something, with only a very short explanation.`
    )
    .join("; ")}.`;

  // Add a simple visible message for the user
  chatMessages.push({
    role: "user",
    content: "Make me a beauty routine with the selected products.",
  });

  renderChat();
  chatWindow.innerHTML +=
    "<div class='chat-bubble assistant'><em>Generating your routine...</em></div>";

  // Send the full chat history plus the actual prompt to the API
  const apiMessages = [...chatMessages, { role: "user", content: prompt }];

  try {
    const response = await fetch(
      "https://nameless-morning-3fc6.griffing.workers.dev/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      }
    );
    const data = await response.json();

    chatMessages.push({
      role: "assistant",
      content: data.choices[0].message.content,
    });

    renderChat();
  } catch (err) {
    chatMessages.push({
      role: "assistant",
      content: "<em>Error generating routine. Please try again.</em>",
    });
    renderChat();
    console.error("Error:", err);
  }
});

// Handle follow-up questions from the chat form
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's follow-up question
  const userInput = chatForm.querySelector("input").value;
  if (!userInput) return;

  // Add user's question to chatMessages
  chatMessages.push({ role: "user", content: userInput });

  renderChat();
  chatWindow.innerHTML +=
    "<div class='chat-bubble assistant'><em>Thinking...</em></div>";

  try {
    const response = await fetch(
      "https://nameless-morning-3fc6.griffing.workers.dev/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      }
    );
    const data = await response.json();

    // Add assistant's reply to chatMessages
    chatMessages.push({
      role: "assistant",
      content: data.choices[0].message.content,
    });

    renderChat();
  } catch (err) {
    chatMessages.push({
      role: "assistant",
      content: "<em>Error. Please try again.</em>",
    });
    renderChat();
    console.error("Error:", err);
  }

  // Clear the input field
  chatForm.querySelector("input").value = "";
});

// When the page loads, call updateSelectedProductsArea to show saved selections
updateSelectedProductsArea();

// On page load, fetch products and show them
loadProducts();

function filterAndDisplayProducts() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value.trim().toLowerCase();

  let filtered = allProducts;

  // If category is selected, filter by category
  if (selectedCategory) {
    filtered = filtered.filter(
      (product) => product.category === selectedCategory
    );
  }

  // If search term is present, filter by name or description
  if (searchTerm) {
    filtered = filtered.filter(
      (product) =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm))
    );
  }

  // If no category and no search, show all products
  // (filtered is already allProducts in this case)

  displayProducts(filtered);
}
