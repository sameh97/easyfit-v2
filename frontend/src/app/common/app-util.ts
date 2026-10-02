import { Observable, Subscription } from 'rxjs';
import { throwError } from 'rxjs';
import * as _ from 'lodash';
import { HttpErrorResponse } from '@angular/common/http';
import { BadInputError } from '../exceptions';
import { NotFoundError } from '../exceptions/not-found-error';
import { AccessDeniedError } from '../exceptions/access-denied-error';
import { AppConsts } from './consts';
import { User } from '../model/user';
import { BehaviorSubject } from 'rxjs';

export class AppUtil {
  private static getHttpErrorMessage(errorResponse: HttpErrorResponse): string {
    if (!errorResponse) {
      return '';
    }
    if (errorResponse.error.message) {
      return errorResponse.error.message;
    }
    return errorResponse.error;
  }

  public static handleError(
    errorResponse: HttpErrorResponse
  ): Observable<never> {
    const bodyContent: string = AppUtil.getHttpErrorMessage(errorResponse);

    if (errorResponse.status === 400) {
      return throwError(new BadInputError(bodyContent));
    }

    if (errorResponse.status === 404) {
      return throwError(new NotFoundError(bodyContent));
    }

    if (errorResponse.status === 403 || errorResponse.status === 401) {
      return throwError(new AccessDeniedError(bodyContent));
    }

    return throwError(new Error(bodyContent));
  }

  public static showErrorMessage(message: string) {
    alert(message);
  }

  public static calculateAge(birthday) {
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  public static daysBetween(date1, date2) {
    // The number of milliseconds in one day
    const ONE_DAY = 1000 * 60 * 60 * 24;

    // Calculate the difference in milliseconds
    const differenceMs = Math.abs(date1 - date2);

    // Convert back to days and return
    return Math.round(differenceMs / ONE_DAY);
  }

  public static showError(err: Error): void {
    if (err instanceof AccessDeniedError) {
      setTimeout(() => alert('Access denied!'), 1);
      return;
    }

    if (err.message) {
      setTimeout(() => alert(`${err.message}`), 1);
      return;
    }

    setTimeout(() => alert('Something went wrong...'), 1);
  }

  public static showWarningMessage(message: string) {
    alert(message);
  }

  public static appTokenGetter() {
    return localStorage.getItem(AppConsts.KEY_USER_TOKEN);
  }

  public static handleNullError(nullField: string) {
    alert(`${nullField} cannot be null`);
  }

  public static releaseSubscriptions(subscriptions: Subscription[]) {
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    for (const sub of subscriptions) {
      sub.unsubscribe();
    }
  }

  public static getFullException(error: Error): string {
    if (!error) {
      return null;
    }
    return `${error.message}\nStack: ${error.stack}`;
  }

  public static hasValue(obj: any): boolean {
    if (typeof obj !== 'undefined' && obj !== null) {
      return true;
    }
    return false;
  }

  public static removePassword(user: User): void {
    if (!user || user.password === '' || user.password === null) {
      return;
    }
    user.password = '';
  }

  public static addToSubject(
    subjectData: BehaviorSubject<any[]>,
    toAdd: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }
    currData.push(toAdd);
    subjectData.next(currData);
  }

  public static updateInSubject(
    subjectData: BehaviorSubject<any[]>,
    toUpdate: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }
    for (let i = 0; i < currData.length; i++) {
      if (String(currData[i].id) === String(toUpdate.id)) {
        currData[i] = toUpdate;
        subjectData.next(currData);
      }
    }
  }

  public static getJob = (jobID: number): string => {
    if (jobID === 1) {
      return 'Clean';
    } else if (jobID === 2) {
      return 'Service';
    } else {
      return 'Not defined';
    }
  };


  public static removeFromSubject(
    subjectData: BehaviorSubject<any[]>,
    id: any
  ): void {
    var currData: any[] = subjectData.value;
    if (!currData) {
      currData = [];
    }
    let indexToDelete = -1;
    for (let i = 0; i < currData.length; i++) {
      if (String(currData[i].id) === String(id)) {
        indexToDelete = i;
        break;
      }
    }
    if (indexToDelete >= 0) {
      currData.splice(indexToDelete, 1);
    }
    subjectData.next(currData);
  }
}
