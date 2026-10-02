import { ErrorHandler } from '@angular/core';

export class AppErrorHandler implements ErrorHandler {
    private msg = 'An unexpected error has ocurred.';
    handleError(error: any): void {
        alert(this.msg)
    }
}
