// Contraseña de administrador (cámbiala por la tuya)
const ADMIN_PASSWORD = "admin123";

// Array para almacenar productos
let products = JSON.parse(localStorage.getItem('products') || '[]');

// Función para verificar contraseña admin
function checkAdminPassword() {
    const password = document.getElementById('admin-password').value;
    const errorMessage = document.getElementById('error-message');
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadAdminProducts();
        document.getElementById('admin-password').value = '';
        errorMessage.style.display = 'none';
    } else {
        errorMessage.style.display = 'block';
        document.getElementById('admin-password').value = '';
        // Hacer que el campo se agite para indicar error
        const passwordInput = document.getElementById('admin-password');
        passwordInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            passwordInput.style.animation = '';
        }, 500);
    }
}

// Función para manejar Enter en el campo de contraseña
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        checkAdminPassword();
    }
}

// Función para previsualizar imágenes
function previewImages() {
    const fileInput = document.getElementById('product-images');
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';

    Array.from(fileInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

// Función para añadir producto
document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('product-form');
    
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const wallapopLink = document.getElementById('wallapop-link').value.trim();
        const imageFiles = document.getElementById('product-images').files;
        
        // Validaciones
        if (!name || !price || !wallapopLink) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }
        
        if (price <= 0) {
            alert('El precio debe ser mayor que 0');
            return;
        }
        
        if (imageFiles.length === 0) {
            alert('Por favor, añade al menos una imagen');
            return;
        }
        
        // Validar que el enlace sea de Wallapop
        if (!wallapopLink.includes('wallapop.com')) {
            if (!confirm('El enlace no parece ser de Wallapop. ¿Continuar de todos modos?')) {
                return;
            }
        }
        
        const images = [];
        let processedImages = 0;
        const maxImages = 10; // Límite de imágenes
        
        if (imageFiles.length > maxImages) {
            alert(`Solo puedes subir un máximo de ${maxImages} imágenes`);
            return;
        }
        
        // Mostrar indicador de carga
        const submitBtn = productForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Procesando...';
        submitBtn.disabled = true;
        
        // Convertir imágenes a base64
        Array.from(imageFiles).forEach(file => {
            // Verificar tamaño del archivo (máximo 2MB por imagen)
            if (file.size > 2 * 1024 * 1024) {
                alert(`La imagen ${file.name} es demasiado grande. Máximo 2MB por imagen.`);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                images.push(e.target.result);
                processedImages++;
                
                if (processedImages === imageFiles.length) {
                    const product = {
                        id: Date.now(),
                        name,
                        price,
                        wallapopLink,
                        images,
                        dateAdded: new Date().toLocaleDateString('es-ES')
                    };
                    
                    products.push(product);
                    localStorage.setItem('products', JSON.stringify(products));
                    
                    loadAdminProducts();
                    
                    // Resetear formulario
                    productForm.reset();
                    document.getElementById('image-preview').innerHTML = '';
                    
                    // Restaurar botón
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    alert('Producto añadido correctamente');
                    
                    // Scroll al top para ver el mensaje
                    window.scrollTo(0, 0);
                }
            };
            reader.readAsDataURL(file);
        });
    });
});

// Función para cargar productos en el panel admin
function loadAdminProducts() {
    const container = document.getElementById('admin-products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay productos añadidos aún.</p>';
        return;
    }
    
    // Ordenar productos por fecha (más recientes primero)
    const sortedProducts = [...products].sort((a, b) => b.id - a.id);
    
    container.innerHTML = sortedProducts.map(product => `
        <div class="product-item">
            <h4>${product.name}</h4>
            <p><strong>Precio:</strong> ${product.price.toFixed(2)}€</p>
            <p><strong>Imágenes:</strong> ${product.images.length}</p>
            <p><strong>Fecha añadido:</strong> ${product.dateAdded || 'No disponible'}</p>
            <p><strong>Enlace:</strong> <a href="${product.wallapopLink}" target="_blank" style="color: #667eea;">Ver en Wallapop</a></p>
            <div style="margin-top: 15px;">
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                    Eliminar Producto
                </button>
                <button class="btn" onclick="viewProduct(${product.id})" style="background: #4a5568;">
                    Ver Detalles
                </button>
            </div>
        </div>
    `).join('');
}

// Función para ver detalles del producto
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const images = product.images.map((img, index) => 
        `<img src="${img}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; margin: 5px;">`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999;">&times;</span>
            <h2>${product.name}</h2>
            <p><strong>Precio:</strong> ${product.price.toFixed(2)}€</p>
            <p><strong>Fecha añadido:</strong> ${product.dateAdded || 'No disponible'}</p>
            <p><strong>Enlace Wallapop:</strong> <a href="${product.wallapopLink}" target="_blank">${product.wallapopLink}</a></p>
            <div style="margin: 20px 0;">
                <strong>Imágenes (${product.images.length}):</strong>
                <div style="margin-top: 10px;">
                    ${images}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// Función para eliminar producto
function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`)) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        loadAdminProducts();
        
        // Mostrar confirmación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
            z-index: 10000;
            font-weight: bold;
        `;
        notification.textContent = 'Producto eliminado correctamente';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Añadir animación de shake para el error de contraseña
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Enfocar el campo de contraseña al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('admin-password').focus();
});