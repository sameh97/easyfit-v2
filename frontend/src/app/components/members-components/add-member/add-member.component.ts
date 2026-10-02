import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Member } from 'src/app/model/member';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.css'],
})
export class AddMemberComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addMemberForm: FormGroup;
  member: Member;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private membersService: MembersService,
    private fileUploadService: FileUploadService,
    public dialogRef: MatDialogRef<AddMemberComponent>,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.member = new Member();
    this.addMemberForm = this.formBuilder.group({
      firstName: [
        '',
        [Validators.required, Validators.minLength(3), this.validateName],
      ],
      lastName: [
        '',
        [Validators.required, Validators.minLength(2), this.validateName],
      ],
      email: ['', [Validators.required, Validators.email]],
      joinDate: ['', [Validators.required]],
      endOfMembershipDate: ['', [Validators.required, this.checkEndDate]],
      gender: ['', Validators.required],
      phone: ['', [Validators.required, this.validatePhoneNumber]],
      address: ['', [Validators.required]],
      birthDay: ['', [Validators.required, this.validateBirthDay]],
      image: [''],
    });
  }

  public checkEndDate = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }
    let dateNow: Date = new Date();

    let dateFromForm = new Date(inputControl.value);

    if (dateFromForm.getTime() <= dateNow.getTime()) {
      return { dateShouldBeInPresent: true };
    }

    let joinDate = new Date(this.member.joinDate);

    if (joinDate.getTime() > dateFromForm.getTime()) {
      return { dateNotValid: true };
    }

    return null;
  };

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.member)) {
      AppUtil.showWarningMessage(
        `cannot create member because there is a missing fields`
      );
      return;
    }

    // // TODO: remove this link and isactive ... :
    if (AppUtil.hasValue(this.imageToUpload)) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, null)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              this.member.imageURL = imgUrl;
              return this.membersService.create(this.member);
            })
          )
          .subscribe(
            (member) => {
              this.dialogRef.close();
              this.navigationHelperService.openSnackBar(
                'start',
                'bottom',
                `${member.firstName} ${member.lastName} was added successfully`
              );
            },
            (err: Error) => {
              AppUtil.showError(err);
            }
          )
      );
    } else {
      this.member.imageURL =
        Number(this.member.gender) === 1
          ? AppConsts.MALE_MEMBER_DEFULT_IMAGE
          : AppConsts.FEMALE_MEMBER_DEFULT_IMAGE;

      this.subscriptions.push(
        this.membersService.create(this.member).subscribe(
          (member) => {
            this.dialogRef.close();
            this.navigationHelperService.openSnackBar(
              'start',
              'bottom',
              `${member.firstName} ${member.lastName} was added successfully`
            );
          },
          (err: Error) => {
            AppUtil.showError(err);
          }
        )
      );
    }
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }

  //TODO: change with icon
  private addMemberAvatar() {
    this.member.imageURL =
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQ0Ovwvg3qzdD37Gir30mn8nG5yra8TYzan0RL_rnONAvsAjUtamuE74TrjBZHpl9FH7g&usqp=CAU';
  }
}
