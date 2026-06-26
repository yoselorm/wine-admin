
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

let toastContainer = null;
let toastCounter = 0;

// Initialize toast container
const initToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
    toastContainer.style.maxWidth = '400px';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// Create toast element
const createToastElement = (message, type, duration) => {
  const toastId = `toast-${toastCounter++}`;
  
  const icons = {
    success: { component: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
    error: { component: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    info: { component: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    warning: { component: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' }
  };

  const config = icons[type] || icons.info;
  
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `pointer-events-auto ${config.bg} ${config.border} border rounded-lg shadow-lg p-4 flex items-start gap-3 transform transition-all duration-300 ease-out translate-x-[calc(100%+1rem)] opacity-0`;
  
  // Create icon
  const iconWrapper = document.createElement('div');
  iconWrapper.className = `flex-shrink-0 ${config.color}`;
  iconWrapper.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>' : ''}
    ${type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>' : ''}
    ${type === 'info' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' : ''}
    ${type === 'warning' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>' : ''}
  </svg>`;
  
  // Create message
  const messageElement = document.createElement('div');
  messageElement.className = 'flex-1 text-sm font-medium text-gray-800';
  messageElement.textContent = message;
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'flex-shrink-0 text-gray-400 hover:text-gray-600 transition';
  closeButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>`;
  
  closeButton.onclick = () => removeToast(toastId);
  
  toast.appendChild(iconWrapper);
  toast.appendChild(messageElement);
  toast.appendChild(closeButton);
  
  return toast;
};

// Remove toast with animation
const removeToast = (toastId) => {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.classList.add('translate-x-[calc(100%+1rem)]', 'opacity-0');
    setTimeout(() => {
      toast.remove();
      // Clean up container if empty
      if (toastContainer && toastContainer.children.length === 0) {
        toastContainer.remove();
        toastContainer = null;
      }
    }, 300);
  }
};

// Main toast function
const showToast = (message, type = 'info', duration = 3000) => {
  const container = initToastContainer();
  const toast = createToastElement(message, type, duration);
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-x-[calc(100%+1rem)]', 'opacity-0');
  }, 10);
  
  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast.id);
    }, duration);
  }
  
  return toast.id;
};

// Export individual toast types
export const toast = {
  success: (message, duration = 3000) => showToast(message, 'success', duration),
  error: (message, duration = 4000) => showToast(message, 'error', duration),
  info: (message, duration = 3000) => showToast(message, 'info', duration),
  warning: (message, duration = 3500) => showToast(message, 'warning', duration),
};

export default toast;