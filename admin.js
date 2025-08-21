// Contraseña de administrador
const ADMIN_PASSWORD = "admin123"; // CAMBIA ESTA CONTRASEÑA

// Array para almacenar productos (ahora se carga desde Netlify)
let products = [];
let currentAdminPassword = "";

// Función para verificar contraseña admin
function checkAdminPassword() {
    const password = document.getElementById('admin-password').value;
    const errorMessage = document.getElementById('error-message');
    
    if (password === ADMIN_PASSWORD) {
        currentAdminPassword = password; // Guardar contraseña para las API calls
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadAdminProducts();
        document.getElementById('admin-password').value = '';
        errorMessage.style.display = 'none';
    } else {
        errorMessage.style.display = 'block';
        document.getElementById('admin-password').value = '';
        const passwordInput = document.getElementById('admin-password');
        passwordInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => passwordInput.style.animation = '', 500);
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter') checkAdminPassword();
}

// Función para previsualizar imágenes
function previewImages() {
    const fileInput = document.getElementById('product-images');
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';

    if (fileInput.files.length === 0) return;
    if (fileInput.files.length > 10) {
        alert('Solo puedes seleccionar un máximo de 10 imágenes');
        fileInput.value = '';
        return;
    }

    Array.from(fileInput.files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            alert(`El archivo ${file.name} no es una imagen válida`);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert(`La imagen ${file.name} es demasiado grande (máximo 2MB)`);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'position: relative; display: inline-block;';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            img.title = file.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.cssText = `
                position: absolute; top: -5px; right: -5px; background: #ff4444;
                color: white; border: none; border-radius: 50%; width: 20px; height: 20px;
                cursor: pointer; font-size: 14px; line-height: 1;
            `;
            removeBtn.onclick = () => removeImageFromPreview(index);
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            preview.appendChild(imgContainer);
        };
        reader.onerror = () => alert(`Error al cargar la imagen ${file.name}`);
        reader.readAsDataURL(file);
    });
}

function removeImageFromPreview(indexToRemove) {
    const fileInput = document.getElementById('product-images');
    const dt = new DataTransfer();
    
    Array.from(fileInput.files).forEach((file, index) => {
        if (index !== indexToRemove) dt.items.add(file);
    });
    
    fileInput.files = dt.files;
    previewImages();
}

// Función para añadir producto usando Netlify Functions
document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('product-form');
    
    productForm.addEventListener('submit', async function(e) {
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
        if (!wallapopLink.includes('wallapop.com')) {
            if (!confirm('El enlace no parece ser de Wallapop. ¿Continuar de todos modos?')) {
                return;
            }
        }
        
        const submitBtn = productForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Procesando...';
        submitBtn.disabled = true;
        
        try {
            // Convertir imágenes a base64
            const images = await Promise.all(
                Array.from(imageFiles).map(file => {
                    if (file.size > 2 * 1024 * 1024) {
                        throw new Error(`La imagen ${file.name} es demasiado grande. Máximo 2MB.`);
                    }
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = () => reject(new Error(`Error al procesar ${file.name}`));
                        reader.readAsDataURL(file);
                    });
                })
            );
            
            // Enviar a Netlify Function
            const response = await fetch('/.netlify/functions/add-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    price,
                    wallapopLink,
                    images,
                    adminPassword: currentAdminPassword
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Resetear formulario
                productForm.reset();
                document.getElementById('image-preview').innerHTML = '';
                
                showNotification('Producto añadido correctamente', 'success');
                loadAdminProducts(); // Recargar lista
                window.scrollTo(0, 0);
            } else {
                throw new Error(result.error || 'Error al añadir producto');
            }
            
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// Función para cargar productos desde Netlify
async function loadAdminProducts() {
    const container = document.getElementById('admin-products-list');
    container.innerHTML = '<p style="text-align: center;">Cargando productos...</p>';
    
    try {
        const response = await fetch('/.netlify/functions/get-products');
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Error al cargar productos');
        
        products = data.products || [];
        
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay productos añadidos aún.</p>';
            return;
        }
        
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
        
    } catch (error) {
        container.innerHTML = `<p style="color: #e53e3e; text-align: center;">Error al cargar productos: ${error.message}</p>`;
        showNotification(`Error al cargar productos: ${error.message}`, 'error');
    }
}

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
                <div style="margin-top: 10px;">${images}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = event => { if (event.target === modal) modal.remove(); };
}

// Función para eliminar producto usando Netlify Functions
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`)) {
        try {
            const response = await fetch('/.netlify/functions/delete-product', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    adminPassword: currentAdminPassword
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification('Producto eliminado correctamente', 'success');
                loadAdminProducts(); // Recargar lista
            } else {
                throw new Error(result.error || 'Error al eliminar producto');
            }
            
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#e53e3e'};
        color: white; padding: 15px 20px; border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); z-index: 10000;
        font-weight: bold; max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 4000);
}

// Añadir animación de shake
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Enfocar contraseña al cargar
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('admin-password').focus();
});