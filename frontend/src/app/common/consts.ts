import { environment } from 'src/environments/environment';

export class AppConsts {
  // Absolute so links shared outside the app (e.g. catalog URLs) still work
  public static readonly BASE_URL: string =
    environment.apiUrl || window.location.origin;
  public static readonly KEY_USER_TOKEN = 'KEY_USER_TOKEN';
  public static readonly STOMP_ENDPOINT = '/easyfit-websocket-endpoint';
  public static readonly FORM_DATA_FILE_UPLOAD_KEY = 'file';
  public static readonly FORM_DATA_FILE_DELETE_KEY = 'url';
  public static readonly SESSION_EXPIRED_ERROR =
    'Session expired please login again';
    
  public static readonly USER_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/user.jpg';
  public static readonly TRAINER_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/trainer.jpg';
  public static readonly PRODUCT_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/product.jpg';
  public static readonly MALE_MEMBER_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/member-male.png';
  public static readonly FEMALE_MEMBER_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/member-female.jpg';
  public static readonly MACHINE_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/machineeeeeeeeeee.jpg';
    public static readonly TRAINER_FEMALE_DEFULT_IMAGE =
    'https://easyfit-gym.s3.amazonaws.com/4443693.png';

    
}
