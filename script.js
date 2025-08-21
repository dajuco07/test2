// Array para almacenar productos (ahora se carga desde Netlify)
let products = [];

// Función para cargar productos desde Netlify Functions
async function loadProducts() {
    try {
        const response = await fetch('/.netlify/functions/get-products');
        const data = await response.json();
        
        if (response.ok) {
            products = data.products || [];
            displayProducts();
            startAutoCarousel();
        } else {
            console.error('Error al cargar productos:', data.error);
            // Mostrar estado de error
            const container = document.getElementById('products-container');
            const emptyState = document.getElementById('empty-state');
            container.innerHTML = '';
            emptyState.innerHTML = `
                <h2>Error al cargar productos</h2>
                <p>Por favor, recarga la página</p>
                <button onclick="location.reload()" style="
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white; border: none; padding: 12px 24px;
                    border-radius: 10px; cursor: pointer; font-weight: bold;
                    margin-top: 15px;
                ">Recargar</button>
            `;
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        // Mostrar estado de error de conexión
        const container = document.getElementById('products-container');
        const emptyState = document.getElementById('empty-state');
        container.innerHTML = '';
        emptyState.innerHTML = `
            <h2>Error de conexión</h2>
            <p>No se pudieron cargar los productos. Verifica tu conexión a internet.</p>
            <button onclick="location.reload()" style="
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white; border: none; padding: 12px 24px;
                border-radius: 10px; cursor: pointer; font-weight: bold;
                margin-top: 15px;
            ">Reintentar</button>
        `;
        emptyState.style.display = 'block';
    }
}

// Función para mostrar productos en la página principal
function displayProducts() {
    const container = document.getElementById('products-container');
    const emptyState = document.getElementById('empty-state');
    
    if (products.length === 0) {
        container.innerHTML = '';
        emptyState.innerHTML = `
            <h2>¡Aún no hay productos!</h2>
            <p>Pronto habrá productos increíbles aquí</p>
        `;
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Ordenar productos por fecha (más recientes primero)
    const sortedProducts = [...products].sort((a, b) => b.id - a.id);
    
    container.innerHTML = sortedProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="image-carousel">
                ${product.images.map((image, index) => `
                    <img src="${image}" alt="${product.name}" 
                         class="carousel-image ${index === 0 ? 'active' : ''}"
                         data-product="${product.id}" data-index="${index}"
                         loading="lazy">
                `).join('')}
                ${product.images.length > 1 ? `
                    <div class="carousel-nav">
                        ${product.images.map((_, index) => `
                            <div class="nav-dot ${index === 0 ? 'active' : ''}"
                                 onclick="changeImage(${product.id}, ${index})"
                                 aria-label="Ver imagen ${index + 1}"></div>
                        `).join('')}
                    </div>
                    <button class="carousel-btn prev" onclick="prevImage(${product.id})" aria-label="Imagen anterior">‹</button>
                    <button class="carousel-btn next" onclick="nextImage(${product.id})" aria-label="Siguiente imagen">›</button>
                ` : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toFixed(2)}€</div>
                <a href="${product.wallapopLink}" target="_blank" rel="noopener noreferrer" class="wallapop-btn">
                    Ver en Wallapop
                </a>
            </div>
        </div>
    `).join('');
    
    // Añadir listener para clic en imágenes (abrir en modal)
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('carousel-image')) {
            const productId = parseInt(e.target.dataset.product);
            const imageIndex = parseInt(e.target.dataset.index);
            openImageModal(productId, imageIndex);
        }
    });
}

// Función para cambiar imagen en el carrusel
function changeImage(productId, imageIndex) {
    const images = document.querySelectorAll(`[data-product="${productId}"]`);
    const dots = document.querySelectorAll(`[onclick*="${productId}"]`);
    
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (images[imageIndex] && dots[imageIndex]) {
        images[imageIndex].classList.add('active');
        dots[imageIndex].classList.add('active');
    }
}

// Funciones para navegación de carrusel con botones
function nextImage(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const currentActive = document.querySelector(`[data-product="${productId}"].carousel-image.active`);
    if (!currentActive) return;
    
    const currentIndex = parseInt(currentActive.dataset.index);
    const nextIndex = (currentIndex + 1) % product.images.length;
    changeImage(productId, nextIndex);
}

function prevImage(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const currentActive = document.querySelector(`[data-product="${productId}"].carousel-image.active`);
    if (!currentActive) return;
    
    const currentIndex = parseInt(currentActive.dataset.index);
    const prevIndex = currentIndex === 0 ? product.images.length - 1 : currentIndex - 1;
    changeImage(productId, prevIndex);
}

// Auto-cambio de imágenes en el carrusel cada 5 segundos
function startAutoCarousel() {
    // Limpiar intervalos anteriores si existen
    if (window.carouselInterval) {
        clearInterval(window.carouselInterval);
    }
    
    window.carouselInterval = setInterval(() => {
        products.forEach(product => {
            if (product.images.length > 1) {
                const currentActive = document.querySelector(`[data-product="${product.id}"].carousel-image.active`);
                if (currentActive) {
                    const currentIndex = parseInt(currentActive.dataset.index);
                    const nextIndex = (currentIndex + 1) % product.images.length;
                    changeImage(product.id, nextIndex);
                }
            }
        });
    }, 5000);
}

// Función para abrir modal de imagen
function openImageModal(productId, startIndex = 0) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    let currentIndex = startIndex;
    
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="image-modal-close">&times;</span>
            <img src="${product.images[currentIndex]}" alt="${product.name}" class="modal-image">
            ${product.images.length > 1 ? `
                <button class="modal-nav-btn prev" onclick="modalPrevImage()">‹</button>
                <button class="modal-nav-btn next" onclick="modalNextImage()">›</button>
                <div class="modal-counter">${currentIndex + 1} / ${product.images.length}</div>
            ` : ''}
            <div class="modal-info">
                <h3>${product.name}</h3>
                <p>${product.price.toFixed(2)}€</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevenir scroll
    
    // Funciones para navegar en el modal
    window.modalNextImage = () => {
        currentIndex = (currentIndex + 1) % product.images.length;
        modal.querySelector('.modal-image').src = product.images[currentIndex];
        if (modal.querySelector('.modal-counter')) {
            modal.querySelector('.modal-counter').textContent = `${currentIndex + 1} / ${product.images.length}`;
        }
    };
    
    window.modalPrevImage = () => {
        currentIndex = currentIndex === 0 ? product.images.length - 1 : currentIndex - 1;
        modal.querySelector('.modal-image').src = product.images[currentIndex];
        if (modal.querySelector('.modal-counter')) {
            modal.querySelector('.modal-counter').textContent = `${currentIndex + 1} / ${product.images.length}`;
        }
    };
    
    // Eventos para cerrar modal
    modal.querySelector('.image-modal-close').onclick = () => {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
        // Limpiar funciones globales
        delete window.modalNextImage;
        delete window.modalPrevImage;
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
            delete window.modalNextImage;
            delete window.modalPrevImage;
        }
    };
    
    // Navegación con teclado
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyPress);
            delete window.modalNextImage;
            delete window.modalPrevImage;
        } else if (e.key === 'ArrowRight' && product.images.length > 1) {
            window.modalNextImage();
        } else if (e.key === 'ArrowLeft' && product.images.length > 1) {
            window.modalPrevImage();
        }
    };
    
    document.addEventListener('keydown', handleKeyPress);
}

// Función para refrescar productos (útil para testing)
function refreshProducts() {
    loadProducts();
}

// Función para mostrar indicador de carga
function showLoadingIndicator() {
    const container = document.getElementById('products-container');
    const emptyState = document.getElementById('empty-state');
    
    container.innerHTML = '';
    emptyState.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <h2>Cargando productos...</h2>
            <p>Por favor espera un momento</p>
        </div>
    `;
    emptyState.style.display = 'block';
}

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    showLoadingIndicator();
    loadProducts();
    
    // Recargar productos cada 5 minutos para mantener sincronización
    setInterval(loadProducts, 5 * 60 * 1000);
});

// Limpiar intervalos al salir de la página
window.addEventListener('beforeunload', function() {
    if (window.carouselInterval) {
        clearInterval(window.carouselInterval);
    }
});

// Función para detectar si hay nuevos productos (polling cada 30 segundos)
let lastProductCount = 0;
function checkForUpdates() {
    fetch('/.netlify/functions/get-products')
        .then(response => response.json())
        .then(data => {
            if (data.products && data.products.length !== lastProductCount) {
                lastProductCount = data.products.length;
                if (products.length > 0) { // Solo mostrar notificación si ya había productos cargados
                    showUpdateNotification();
                }
                loadProducts();
            }
        })
        .catch(error => console.log('Error checking updates:', error));
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: linear-gradient(45deg, #48bb78, #38a169);
        color: white; padding: 15px 20px; border-radius: 10px;
        box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        font-weight: bold; cursor: pointer;
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = '✨ Nuevos productos disponibles!';
    
    document.body.appendChild(notification);
    
    notification.onclick = () => {
        notification.remove();
        loadProducts();
    };
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 5000);
}

// Iniciar polling para actualizaciones cada 30 segundos
setTimeout(() => {
    setInterval(checkForUpdates, 30000);
}, 10000); // Esperar 10 segundos antes de iniciar el polling