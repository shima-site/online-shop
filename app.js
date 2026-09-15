"use strict";

const PRODUCT_KEY = "shima_products";
const CART_KEY = "shima_cart";

let products = [];
let cart = [];
let activeCategory = "all";
let searchText = "";

/* =========================
   ELEMENTS
========================= */

const productsGrid = document.getElementById("productsGrid");
const discountProducts = document.getElementById("discountProducts");
const emptyProducts = document.getElementById("emptyProducts");
const resultCount = document.getElementById("resultCount");

const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const openSearch = document.getElementById("openSearch");
const closeSearch = document.getElementById("closeSearch");

const categoryFilters = document.getElementById("categoryFilters");

const productModal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const closeProductModal =
    document.getElementById("closeProductModal");

const openCart = document.getElementById("openCart");
const closeCart = document.getElementById("closeCart");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const checkoutBtn = document.getElementById("checkoutBtn");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

const year = document.getElementById("year");


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

    loadProducts();
    loadCart();

    renderDiscountProducts();
    renderProducts();
    renderCart();

    setupEvents();

    if (year) {
        year.textContent = new Date().getFullYear();
    }

});


/* =========================
   PRODUCTS
========================= */

function loadProducts() {

    try {

        const savedProducts =
            localStorage.getItem(PRODUCT_KEY);

        if (!savedProducts) {
            products = [];
            return;
        }

        const parsed =
            JSON.parse(savedProducts);

        products =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(
            "خطا در خواندن محصولات:",
            error
        );

        products = [];

    }

}


/* =========================
   CART
========================= */

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(CART_KEY);

        if (!savedCart) {
            cart = [];
            return;
        }

        const parsed =
            JSON.parse(savedCart);

        cart =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(
            "خطا در خواندن سبد خرید:",
            error
        );

        cart = [];

    }

}


function saveCart() {

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

}


/* =========================
   HELPERS
========================= */

function formatPrice(price) {

    return new Intl.NumberFormat("fa-IR")
        .format(Number(price) || 0);

}


function getFinalPrice(product) {

    const price =
        Number(product.price) || 0;

    const discount =
        Number(product.discount) || 0;

    if (discount <= 0) {
        return price;
    }

    return Math.round(
        price - (price * discount / 100)
    );

}


function findProduct(id) {

    return products.find(
        product =>
            String(product.id) === String(id)
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/[&<>"']/g, char => {

            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return map[char];

        });

}


function getImage(product) {

    return product.image ||
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80";

}


/* =========================
   PRODUCT CARD
========================= */

function createProductCard(product) {

    const price =
        Number(product.price) || 0;

    const discount =
        Number(product.discount) || 0;

    const finalPrice =
        getFinalPrice(product);

    const stock =
        Number(product.stock) || 0;

    const image =
        getImage(product);

    const unavailable =
        stock <= 0;


    return `

        <article class="product-card
            ${unavailable ? "out-of-stock" : ""}">

            <div
                class="product-image"
                data-product-id="${escapeHTML(product.id)}"
            >

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    onerror="
                        this.src='https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
                    "
                >

                ${
                    discount > 0
                    ?
                    `
                    <span class="discount-badge">
                        ${formatPrice(discount)}٪ تخفیف
                    </span>
                    `
                    :
                    ""
                }

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${escapeHTML(
                        product.category || "محصول"
                    )}
                </span>


                <h3 class="product-name">
                    ${escapeHTML(
                        product.name || "محصول بدون نام"
                    )}
                </h3>


                <p class="product-description">
                    ${escapeHTML(
                        product.description ||
                        "محصولی خاص و کاربردی از شیما استور."
                    )}
                </p>


                <div class="product-bottom">

                    <div class="price-box">

                        ${
                            discount > 0
                            ?
                            `
                            <span class="old-price">
                                ${formatPrice(price)}
                                تومان
                            </span>
                            `
                            :
                            ""
                        }


                        <span class="price">

                            ${formatPrice(finalPrice)}

                            <small>
                                تومان
                            </small>

                        </span>

                    </div>


                    <button
                        class="add-cart"
                        data-add-cart="${escapeHTML(product.id)}"
                        ${unavailable ? "disabled" : ""}
                    >
                        ${unavailable ? "×" : "+"}
                    </button>

                </div>


                <div class="stock">

                    ${
                        unavailable
                        ?
                        "ناموجود"
                        :
                        `موجودی:
                        ${formatPrice(stock)}
                        عدد`
                    }

                </div>

            </div>

        </article>

    `;

}


/* =========================
   RENDER ALL PRODUCTS
========================= */

function renderProducts() {

    if (!productsGrid) {
        return;
    }


    const search =
        searchText
            .trim()
            .toLowerCase();


    const filtered =
        products.filter(product => {

            const categoryOK =
                activeCategory === "all" ||
                product.category === activeCategory;


            const name =
                String(
                    product.name || ""
                ).toLowerCase();


            const description =
                String(
                    product.description || ""
                ).toLowerCase();


            const searchOK =
                !search ||
                name.includes(search) ||
                description.includes(search);


            return categoryOK && searchOK;

        });


    productsGrid.innerHTML =
        filtered
            .map(createProductCard)
            .join("");


    if (resultCount) {

        resultCount.textContent =
            formatPrice(filtered.length);

    }


    if (emptyProducts) {

        emptyProducts.style.display =
            filtered.length === 0
                ? "block"
                : "none";

    }

}


/* =========================
   DISCOUNT PRODUCTS
========================= */

function renderDiscountProducts() {

    if (!discountProducts) {
        return;
    }


    const discounted =
        products
            .filter(
                product =>
                    Number(product.discount) > 0
            )
            .sort(
                (a, b) =>
                    Number(b.discount) -
                    Number(a.discount)
            );


    if (discounted.length === 0) {

        discountProducts.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    background:#fff;
                    border:1px solid #e7e5de;
                    border-radius:22px;
                    padding:50px 20px;
                    text-align:center;
                    color:#777;
                "
            >

                فعلاً محصول تخفیف‌داری وجود ندارد.

            </div>

        `;

        return;

    }


    discountProducts.innerHTML =
        discounted
            .map(createProductCard)
            .join("");

}


/* =========================
   CATEGORY
========================= */

function setCategory(category) {

    activeCategory = category;


    if (categoryFilters) {

        categoryFilters
            .querySelectorAll(".filter-btn")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.filter === category
                );

            });

    }


    renderProducts();

}


function setupCategories() {

    if (categoryFilters) {

        categoryFilters.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".filter-btn"
                    );

                if (!button) {
                    return;
                }

                setCategory(
                    button.dataset.filter
                );

            }
        );

    }


    document
        .querySelectorAll(".category-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setCategory(
                        button.dataset.category
                    );

                    document
                        .getElementById("products")
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });

                }
            );

        });


    document
        .querySelectorAll(
            "[data-footer-category]"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    setCategory(
                        link.dataset.footerCategory
                    );

                }
            );

        });

}


/* =========================
   ADD TO CART
========================= */

function addToCart(id) {

    const product =
        findProduct(id);

    if (!product) {
        return;
    }


    conststock =
        Number(product.stock) || 0;


    if (stock <= 0) {

        showToast(
            "این محصول موجود نیست."
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (existing) {

        if (existing.quantity >= stock) {

            showToast(
                "تعداد انتخابی به سقف موجودی رسیده."
            );

            return;

        }

        existing.quantity++;

    } else {

        cart.push({
            id: product.id,
            quantity: 1
        });

    }


    saveCart();
    renderCart();

    showToast(
        "محصول به سبد خرید اضافه شد."
    );

}


/* =========================
   REMOVE CART
========================= */

function removeFromCart(id) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveCart();
    renderCart();

}


/* =========================
   QUANTITY
========================= */

function changeQuantity(id, amount) {

    const item =
        cart.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const product =
        findProduct(id);


    if (!item || !product) {
        return;
    }


    item.quantity += amount;


    if (item.quantity <= 0) {

        removeFromCart(id);
        return;

    }


    const stock =
        Number(product.stock) || 0;


    if (item.quantity > stock) {

        item.quantity = stock;

        showToast(
            "بیشتر از موجودی نمی‌توانی اضافه کنی."
        );

    }


    saveCart();
    renderCart();

}


/* =========================
   RENDER CART
========================= */

function renderCart() {

    if (!cartItems) {
        return;
    }


    let total = 0;
    let count = 0;


    cart =
        cart.filter(item => {

            const product =
                findProduct(item.id);

            if (!product) {
                return false;
            }


            const stock =
                Number(product.stock) || 0;


            if (stock <= 0) {
                return false;
            }


            if (item.quantity > stock) {
                item.quantity = stock;
            }


            return item.quantity > 0;

        });


    cart.forEach(item => {

        const product =
            findProduct(item.id);

        if (!product) {
            return;
        }


        total +=
            getFinalPrice(product) *
            item.quantity;

        count += item.quantity;

    });


    saveCart();


    cartItems.innerHTML =
        cart
            .map(item => {

                const product =
                    findProduct(item.id);

                if (!product) {
                    return "";
                }


                return `

                    <div class="cart-item">

                        <div class="cart-item-image">

                            <img
                                src="${escapeHTML(
                                    getImage(product)
                                )}"
                                alt="${escapeHTML(
                                    product.name
                                )}"
                            >

                        </div>


                        <div class="cart-item-info">

                            <h4>
                                ${escapeHTML(
                                    product.name
                                )}
                            </h4>


                            <span>
                                ${formatPrice(
                                    getFinalPrice(product)
                                )}
                                تومان
                            </span>


                            <div class="quantity">

                                <button
                                    data-plus="${escapeHTML(
                                        product.id)}"
                                >
                                    +
                                </button>


                                <span>
                                    ${formatPrice(
                                        item.quantity
                                    )}
                                </span>


                                <button
                                    data-minus="${escapeHTML(
                                        product.id
                                    )}"
                                >
                                    −
                                </button>

                            </div>

                        </div>


                        <button
                            class="cart-item-remove"
                            data-remove="${escapeHTML(
                                product.id
                            )}"
                        >
                            ×
                        </button>

                    </div>

                `;

            })
            .join("");


    if (cartEmpty) {

        cartEmpty.style.display =
            cart.length === 0
                ? "flex"
                : "none";

    }


    if (cartTotal) {

        cartTotal.textContent =
            `${formatPrice(total)} تومان`;

    }


    if (cartCount) {

        cartCount.textContent =
            formatPrice(count);

    }

}


/* =========================
   PRODUCT MODAL
========================= */

function openProductModal(id) {

    const product =
        findProduct(id);

    if (!product || !productModal) {
        return;
    }


    const price =
        Number(product.price) || 0;

    const discount =
        Number(product.discount) || 0;

    const finalPrice =
        getFinalPrice(product);

    const stock =
        Number(product.stock) || 0;


    modalContent.innerHTML = `

        <div class="modal-product">

            <div class="modal-product-image">

                <img
                    src="${escapeHTML(
                        getImage(product)
                    )}"
                    alt="${escapeHTML(
                        product.name
                    )}"
                >

            </div>


            <div class="modal-product-info">

                <span class="product-category">

                    ${escapeHTML(
                        product.category || "محصول"
                    )}

                </span>


                <h2>

                    ${escapeHTML(
                        product.name
                    )}

                </h2>


                <p>

                    ${escapeHTML(
                        product.description ||
                        "توضیحی برای این محصول ثبت نشده است."
                    )}

                </p>


                <div class="modal-price">

                    ${
                        discount > 0
                        ?
                        `
                        <span class="old-price">

                            ${formatPrice(price)}
                            تومان

                        </span>
                        `
                        :
                        ""
                    }


                    <div class="price">

                        ${formatPrice(finalPrice)}

                        <small>
                            تومان
                        </small>

                    </div>

                </div>


                <p>

                    ${
                        stock > 0
                        ?
                        `موجودی:
                        ${formatPrice(stock)}
                        عدد`
                        :
                        "این محصول ناموجود است."
                    }

                </p>


                <button
                    class="modal-add"
                    data-modal-add="${escapeHTML(
                        product.id
                    )}"${stock <= 0 ? "disabled" : ""}
                >

                    ${
                        stock > 0
                        ?
                        " "
                        :
                        "ناموجود"
                    }

                </button>

            </div>

        </div>

    `;


    productModal.classList.add("active");

    productModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "no-scroll"
    );

}


function closeModal() {

    if (!productModal) {
        return;
    }


    productModal.classList.remove(
        "active"
    );

    productModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================
   CART DRAWER
========================= */

function openCartDrawer() {

    cartDrawer?.classList.add(
        "active"
    );

    cartOverlay?.classList.add(
        "active"
    );

    document.body.classList.add(
        "no-scroll"
    );

}


function closeCartDrawer() {

    cartDrawer?.classList.remove(
        "active"
    );

    cartOverlay?.classList.remove(
        "active"
    );

    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================
   SEARCH
========================= */

function openSearchPanel() {

    searchPanel?.classList.add(
        "active"
    );


    setTimeout(() => {

        searchInput?.focus();

    }, 150);

}


function closeSearchPanel() {

    searchPanel?.classList.remove(
        "active"
    );

}


/* =========================
   TOAST
========================= */

let toastTimer;


function showToast(message) {

    if (!toast || !toastText) {
        return;
    }


    toastText.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}


/* =========================
   EVENTS
========================= */

function setupEvents() {

    setupCategories();


    /* SEARCH */

    openSearch?.addEventListener(
        "click",
        openSearchPanel
    );


    closeSearch?.addEventListener(
        "click",
        closeSearchPanel
    );


    searchInput?.addEventListener(
        "input",
        event => {

            searchText =
                event.target.value;

            renderProducts();

        }
    );


    /* ALL CLICKS */

    document.addEventListener(
        "click",
        event => {


            /* PRODUCT IMAGE */

            const productImage =
                event.target.closest(
                    "[data-product-id]"
                );


            if (productImage) {

                openProductModal(
                    productImage.dataset.productId
                );

                return;

            }


            /* ADD CART */

            const addButton =
                event.target.closest(
                    "[data-add-cart]"
                );


            if (addButton) {

                addToCart(
                    addButton.dataset.addCart
                );

                return;

            }


            /* MODAL ADD */

            const modalAdd =
                event.target.closest(
                    "[data-modal-add]"
                );


            if (modalAdd) {

                addToCart(
                    modalAdd.dataset.modalAdd
                );

                closeModal();

                return;

            }


            /* REMOVE */

            const removeButton =
                event.target.closest(
                    "[data-remove]"
                );


            if (removeButton) {

                removeFromCart(
                    removeButton.dataset.remove
                );

                return;

            }


            /* PLUS */

            const plusButton =
                event.target.closest(
                    "[data-plus]"
                );


            if (plusButton) {

                changeQuantity(
                    plusButton.dataset.plus,
                    1
                );

                return;

            }


            /* MINUS */

            const minusButton =
                event.target.closest(
                    "[data-minus]"
                );


            if (minusButton) {

                changeQuantity(
                    minusButton.dataset.minus,
                    -1
                );

            }

        }
    );


    /* MODAL */

    closeProductModal?.addEventListener(
        "click",
        closeModal
    );


    productModal
        ?.querySelector(".modal-overlay")
        ?.addEventListener(
            "click",
            closeModal
        );


    /* CART */

    openCart?.addEventListener(
        "click",
        openCartDrawer
    );


    closeCart?.addEventListener(
        "click",
        closeCartDrawer
    );


    cartOverlay?.addEventListener(
        "click",
        closeCartDrawer
    );


    /* CHECKOUT */

    checkoutBtn?.addEventListener(
        "click",
        () => {

            if (cart.length === 0) {

                showToast(
                    "سبد خریدت خالیه."
                );

                return;

            }


            showToast(
                "بخش پرداخت فعلاً نمایشی است."
            );

        }
    );


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeModal();
                closeCartDrawer();
                closeSearchPanel();

            }

        }
    );

}


/* =========================
   ADMIN SYNC
========================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key === PRODUCT_KEY
        ) {

            loadProducts();

            renderDiscountProducts();
            renderProducts();
            renderCart();

            showToast(
                "محصولات به‌روزرسانی شدند."
            );

        }

    }
);