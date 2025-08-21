// Cargar productos desde localStorage
let products = JSON.parse(localStorage.getItem('products') || '[]');

// Función para mostrar productos en la página principal
function displayProducts() {
    const container = document.getElementById('products-container');
    const emptyState = document.getElementById('empty-state');
    
    if (products.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="image-carousel">
                ${product.images.map((image, index) => `
                    <img src="${image}" alt="${product.name}" 
                         class="carousel-image ${index === 0 ? 'active' : ''}"
                         data-product="${product.id}" data-index="${index}">
                `).join('')}
                ${product.images.length > 1 ? `
                    <div class="carousel-nav">
                        ${product.images.map((_, index) => `
                            <div class="nav-dot ${index === 0 ? 'active' : ''}"
                                 onclick="changeImage(${product.id}, ${index})"></div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)}€</div>
                <a href="${product.wallapopLink}" target="_blank" class="wallapop-btn">
                    Ver en Wallapop
                </a>
            </div>
        </div>
    `).join('');
}

// Función para cambiar imagen en el carrusel
function changeImage(productId, imageIndex) {
    const images = document.querySelectorAll(`[data-product="${productId}"]`);
    const dots = document.querySelectorAll(`[onclick*="${productId}"]`);
    
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    images[imageIndex].classList.add('active');
    dots[imageIndex].classList.add('active');
}

// Auto-cambio de imágenes en el carrusel cada 5 segundos
function startAutoCarousel() {
    setInterval(() => {
        products.forEach(product => {
            if (product.images.length > 1) {
                const currentActive = document.querySelector(`[data-product="${product.id}"].active`);
                if (currentActive) {
                    const currentIndex = parseInt(currentActive.dataset.index);
                    const nextIndex = (currentIndex + 1) % product.images.length;
                    changeImage(product.id, nextIndex);
                }
            }
        });
    }, 5000);
}

// Función para actualizar productos (llamada desde admin)
function updateProducts() {
    products = JSON.parse(localStorage.getItem('products') || '[]');
    displayProducts();
}

// Listener para cambios en localStorage (para detectar cambios desde admin)
window.addEventListener('storage', function(e) {
    if (e.key === 'products') {
        updateProducts();
    }
});

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    displayProducts();
    startAutoCarousel();
});