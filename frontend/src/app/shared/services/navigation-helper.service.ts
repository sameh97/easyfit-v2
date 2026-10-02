import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './../components/confirmation-dialog/confirmation-dialog.component';
import { ComponentType } from '@angular/cdk/portal';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NavigationHelperService {
  constructor(public dialog: MatDialog, private _snackBar: MatSnackBar) {}

  public openYesNoDialogNoCallback(
    message: string,
    customWidthPX?: number
  ): Observable<any> {
    let width = '350px';

    if (customWidthPX) {
      width = `${customWidthPX}px`;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: width,
      data: message,
    });

    return dialogRef.afterClosed();
  }

  public openSnackBar(
    horizontalPosition: MatSnackBarHorizontalPosition,
    verticalPosition: MatSnackBarVerticalPosition,
    message: string
  ) {
    this._snackBar.open(message, null, {
      horizontalPosition: horizontalPosition,
      verticalPosition: verticalPosition,
      duration: 3000,
      panelClass: ['mat-toolbar', 'mat-primary'],
    });
  }

  openDialog(
    dialog: ComponentType<{}>,
    width?: string,
    dialogData?: any,
    isFullScreen?: boolean
  ) {
    let dialogWidth = '500px';
    if (width) {
      dialogWidth = width;
    }

    let dialogRef;
    if (!!isFullScreen) {
      dialogRef = this.dialog.open(dialog, {
        maxWidth: '98vh',
        maxHeight: '98vh',
        height: '98%',
        width: '98%',
        data: dialogData,
        panelClass: 'full-screen-modal',
      });
    } else {
      dialogRef = this.dialog.open(dialog, {
        width: dialogWidth,
        data: dialogData,
      });
    }

    return dialogRef.afterClosed();
  }

  openGroupTrainingDialog(dialog: ComponentType<{}>, dialogData?: any) {
    let dialogRef;

    dialogRef = this.dialog.open(dialog, {
      maxWidth: '150vh',
      maxHeight: '98vh',
      height: '98%',
      width: '98%',
      data: dialogData,
      panelClass: 'full-screen-modal',
    });

    return dialogRef.afterClosed();
  }

  public isMobileMode(): boolean {
    const mq: MediaQueryList = window.matchMedia('(max-width: 500px)');
    if (mq.matches) {
      return true;
    }
    return false;
  }
}
