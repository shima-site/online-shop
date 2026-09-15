const PRODUCT_KEY = "shima_products";

/* =========================
   بررسی ورود ادمین
========================= */

if (sessionStorage.getItem("shima_admin_logged_in") !== "true") {
    window.location.href = "login.html";
}


/* =========================
   عناصر صفحه
========================= */

const adminPanel = document.getElementById("adminPanel");

const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productDiscount = document.getElementById("productDiscount");
const productStock = document.getElementById("productStock");
const productImage = document.getElementById("productImage");
const productDescription = document.getElementById("productDescription");

const adminProductsList = document.getElementById("adminProductsList");
const adminEmptyState = document.getElementById("adminEmptyState");

const totalProducts = document.getElementById("totalProducts");
const discountProductsCount = document.getElementById("discountProductsCount");
const dishesCount = document.getElementById("dishesCount");
const accessoriesCount = document.getElementById("accessoriesCount");

const formTitle = document.getElementById("formTitle");
const saveProductBtn = document.getElementById("saveProductBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const productMessage = document.getElementById("productMessage");

const adminSearch = document.getElementById("adminSearch");
const adminCategoryFilter = document.getElementById("adminCategoryFilter");

const adminToast = document.getElementById("adminToast");

let products = JSON.parse(localStorage.getItem(PRODUCT_KEY)) || [];
let editingId = null;


/* =========================
   نمایش پنل
========================= */

if (adminPanel) {
    adminPanel.style.display = "block";
}


/* =========================
   ذخیره محصولات
========================= */

function saveProducts() {
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
}


/* =========================
   ساخت ID
========================= */

function createId() {
    return Date.now().toString();
}


/* =========================
   فرمت قیمت
========================= */

function formatPrice(price) {
    return Number(price || 0).toLocaleString("fa-IR");
}


/* =========================
   قیمت با تخفیف
========================= */

function getFinalPrice(price, discount) {

    price = Number(price) || 0;
    discount = Number(discount) || 0;

    return Math.round(
        price - (price * discount / 100)
    );
}


/* =========================
   آمار پنل
========================= */

function updateStats() {

    if (totalProducts) {
        totalProducts.textContent = products.length;
    }

    if (discountProductsCount) {
        discountProductsCount.textContent =
            products.filter(product => Number(product.discount) > 0).length;
    }

    if (dishesCount) {
        dishesCount.textContent =
            products.filter(product => product.category === "ظروف").length;
    }

    if (accessoriesCount) {
        accessoriesCount.textContent =
            products.filter(product => product.category === "اکسسوری").length;
    }
}


/* =========================
   نمایش پیام
========================= */

function showMessage(text, success = true) {

    if (!productMessage) return;

    productMessage.textContent = text;
    productMessage.style.color =
        success ? "#55d98b" : "#ff6464";

    setTimeout(() => {
        productMessage.textContent = "";
    }, 3000);
}


/* =========================
   Toast
========================= */

function showToast(text) {

    if (!adminToast) return;

    adminToast.textContent = text;
    adminToast.classList.add("show");

    setTimeout(() => {
        adminToast.classList.remove("show");
    }, 2500);
}


/* =========================
   نمایش محصولات
========================= */

function renderProducts() {

    if (!adminProductsList) return;

    const search =
        adminSearch?.value.trim().toLowerCase() || "";

    const category =
        adminCategoryFilter?.value || "all";

    let filteredProducts = products.filter(product => {

        const matchesSearch =
            product.name.toLowerCase().includes(search);

        const matchesCategory =
            category === "all" ||
            product.category === category;

        return matchesSearch && matchesCategory;
    });


    adminProductsList.innerHTML = "";


    if (filteredProducts.length === 0) {

        if (adminEmptyState) {
            adminEmptyState.style.display = "block";
        }

        return;
    }


    if (adminEmptyState) {
        adminEmptyState.style.display = "none";
    }


    filteredProducts.forEach(product => {

        const finalPrice =
            getFinalPrice(product.price, product.discount);

        const card = document.createElement("div");

        card.className = "admin-product-card";

        card.innerHTML = `

            <div class="admin-product-image">

                <img
                    src="${product.image || ""}"
                    alt="${product.name}"
                >

            </div>

            <div class="admin-product-info">

                <h3>${product.name}</h3>

                <span>
                    ${product.category}
                </span>

                <p>
                    موجودی: ${product.stock}
                </p>

                <p>
                    قیمت:
                    ${formatPrice(finalPrice)}
                    تومان
                </p>

                ${
                    Number(product.discount) > 0
                    ? `<small>تخفیف ${product.discount}%</small>`
                    : ""
                }

            </div>

            <div class="admin-product-actions">

                <button
                    type="button"
                    onclick="editProduct('${product.id}')"
                >
                    ویرایش
                </button>

                <button
                    type="button"
                    onclick="deleteProduct('${product.id}')"
                >
                    حذف
                </button>

            </div>

        `;

        adminProductsList.appendChild(card);
    });
}


/* =========================
   انتخاب عکس از گالری
========================= */

function readImageFile(file) {

    return new Promise((resolve, reject) => {

        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject("فایل انتخاب‌شده عکس نیست.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            resolve(reader.result);
        };

        reader.onerror = function () {
            reject("خواندن عکس با مشکل مواجه شد.");
        };

        reader.readAsDataURL(file);
    });
}


/* =========================
   ثبت محصول
========================= */

productForm?.addEventListener("submit", async function (event) {

    event.preventDefault();


    const name = productName.value.trim();
    const category = productCategory.value;
    const price = Number(productPrice.value);
    const discount = Number(productDiscount.value) || 0;
    const stock = Number(productStock.value) || 0;
    const description = productDescription.value.trim();


    if (!name) {
        showMessage("نام محصول را وارد کنید.", false);
        return;
    }


    if (!price || price <= 0) {
        showMessage("قیمت محصول را وارد کنید.", false);
        return;
    }


    if (discount < 0 || discount > 100) {
        showMessage("تخفیف باید بین ۰ تا ۱۰۰ باشد.", false);
        return;
    }


    let image = "";


    /* اگر در حال ویرایش هستیم و عکس جدید انتخاب نشده */
    if (editingId) {

        const oldProduct =
            products.find(product => product.id === editingId);

        image = oldProduct?.image || "";
    }


    /* اگر عکس جدید انتخاب شده */
    if (productImage.files && productImage.files[0]) {

        try {

            image =
                await readImageFile(productImage.files[0]);

        } catch (error) {

            showMessage(error, false);
            return;
        }
    }


    const product = {

        id: editingId || createId(),

        name: name,

        category: category,

        price: price,

        discount: discount,

        stock: stock,

        image: image,

        description: description
    };


    /* ویرایش */
    if (editingId) {

        products = products.map(item =>
            item.id === editingId
                ? product
                : item
        );

        showMessage("محصول با موفقیت ویرایش شد ✓");

    }

    /* محصول جدید */
    else {

        products.unshift(product);

        showMessage("محصول با موفقیت ثبت شد ✓");
    }


    saveProducts();

    updateStats();

    renderProducts();

    resetForm();

    showToast("محصول ذخیره شد ✓");
});


/* =========================
   ویرایش محصول
========================= */

function editProduct(id) {

    const product =
        products.find(item => item.id === id);

    if (!product) return;


    editingId = id;


    productName.value = product.name;
    productCategory.value = product.category;
    productPrice.value = product.price;
    productDiscount.value = product.discount;
    productStock.value = product.stock;
    productDescription.value = product.description || "";


    if (formTitle) {
        formTitle.textContent = "ویرایش محصول";
    }

    if (saveProductBtn) {
        saveProductBtn.textContent = "ذخیره تغییرات";
    }

    if (cancelEditBtn) {
        cancelEditBtn.style.display = "inline-flex";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================
   حذف محصول
========================= */

function deleteProduct(id) {

    const product =
        products.find(item => item.id === id);

    if (!product) return;


    const confirmDelete =
        confirm(`محصول «${product.name}» حذف شود؟`);

    if (!confirmDelete) return;


    products =
        products.filter(item => item.id !== id);


    saveProducts();

    updateStats();

    renderProducts();

    showToast("محصول حذف شد ✓");
}


/* =========================
   لغو ویرایش
========================= */

cancelEditBtn?.addEventListener("click", function () {

    resetForm();

});


/* =========================
   خالی کردن فرم
========================= */

function resetForm() {

    editingId = null;

    productForm?.reset();


    if (formTitle) {
        formTitle.textContent = "افزودن محصول";
    }

    if (saveProductBtn) {
        saveProductBtn.textContent = "ثبت محصول";
    }

    if (cancelEditBtn) {
        cancelEditBtn.style.display = "none";
    }
}


/* =========================
   جستجو
========================= */

adminSearch?.addEventListener(
    "input",
    renderProducts
);


/* =========================
   فیلتر دسته‌بندی
========================= */

adminCategoryFilter?.addEventListener(
    "change",
    renderProducts
);


/* =========================
   سال فوتر
========================= */

const adminYear =
    document.getElementById("adminYear");

if (adminYear) {
    adminYear.textContent =
        new Date().getFullYear();
}


/* =========================
   شروع پنل
========================= */

updateStats();
renderProducts();