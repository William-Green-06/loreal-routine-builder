/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Store selected product names in an array */
let selectedProducts = [];

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
            (name) => `
            <li>
              <span 
                class="remove-x" 
                data-remove-name="${name}"
                title="Remove"
              >&times;</span>
              ${name}
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
        selectedProducts = selectedProducts.filter((n) => n !== name);
        // Update product cards UI
        document
          .querySelectorAll(`.product-card[data-product-name="${name}"]`)
          .forEach((card) => card.classList.remove("selected"));
        // Update the list
        updateSelectedProductsArea();
      });
    });
  }
}

/* Create HTML for displaying product cards, marking selected ones */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div 
      class="product-card${
        selectedProducts.includes(product.name) ? " selected" : ""
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
      if (selectedProducts.includes(name)) {
        selectedProducts = selectedProducts.filter((n) => n !== name);
        card.classList.remove("selected");
      } else {
        selectedProducts.push(name);
        card.classList.add("selected");
      }
      updateSelectedProductsArea();
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
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
