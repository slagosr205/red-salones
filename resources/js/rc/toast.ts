import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
        container: 'swal-toast-container',
    },
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

export function toastSuccess(message: string): void {
    Toast.fire({ icon: 'success', title: message });
}

export function toastError(message: string): void {
    Toast.fire({ icon: 'error', title: message, timer: 5000 });
}

export function toastInfo(message: string): void {
    Toast.fire({ icon: 'info', title: message });
}

export function toastWarning(message: string): void {
    Toast.fire({ icon: 'warning', title: message, timer: 4000 });
}
