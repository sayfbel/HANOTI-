export type SupportedLanguage = 'en' | 'fr' | 'ar';

type Translations = {
  [key in SupportedLanguage]: {
    [key: string]: string;
  };
};

export const translations: Translations = {
  en: {
    // Settings Screen
    'settings.title': 'Settings',
    'settings.loading': 'Loading...',
    'settings.unknownUser': 'Unknown User',
    'settings.pauseNotifications': 'Pause notifications',
    'settings.generalSettings': 'General settings',
    'settings.darkMode': 'Dark Mode',
    'settings.language': 'Language',
    'settings.mySubscription': 'My Subscription',
    'settings.faq': 'FAQ',
    'settings.termsOfService': 'Terms of service',
    'settings.userPolicy': 'User policy',
    'settings.logOut': 'Log Out',
    'settings.selectLanguage': 'Select Language',
    'settings.cancel': 'Cancel',
    
    // Login Screen
    'login.welcomeBack': 'Welcome Back',
    'login.signInSubtitle': 'Sign in to your account',
    'login.emailPlaceholder': 'Email address',
    'login.passwordPlaceholder': 'Password',
    'login.rememberMe': 'Remember me',
    'login.forgotPassword': 'Forgot password?',
    'login.connexion': 'Login',
    'login.or': 'or',
    'login.continueWithGoogle': 'Continue with Google',
    'login.err.emptyFields': 'Please enter both email and password.',
    'login.err.network': 'Could not connect to the server. Make sure your backend is running.',
    
    // Profile Screen
    'profile.title': 'My profile',
    'profile.followers': 'followers',
    'profile.following': 'following',
    'profile.feed': 'Feed',
    'profile.challenge': 'Challenge',
    'profile.badge': 'Badge',
    'profile.timeAgo': '3h ago',
    'profile.caption': 'Beautiful landscape 😍🌱',

    // Edit Profile Screen
    'editProfile.title': 'Edit Profile',
    'editProfile.changePhoto': 'Change Profile Photo',
    'editProfile.firstName': 'First Name',
    'editProfile.lastName': 'Last Name',
    'editProfile.birthday': 'Birthday',
    'editProfile.phoneNumber': 'Phone Number',
    'editProfile.saveChanges': 'Save Changes',
    
    // Confirm Dialog
    'confirm.discardTitle': 'Discard changes?',
    'confirm.discardMessage': 'You have unsaved changes. Are you sure you want to discard them and leave?',
    'confirm.discard': 'Discard',
    'confirm.dontLeave': "Don't leave",
    
    // Forgot Password Screen
    'forgot.title1': 'Forgot Password',
    'forgot.title2': 'Enter Code',
    'forgot.title3': 'New Password',
    'forgot.subtitle1': 'Enter your email to receive a reset code',
    'forgot.subtitle2': 'Enter the 6-digit code sent to your email',
    'forgot.subtitle3': 'Create a strong, new password',
    'forgot.sendCode': 'Send Code',
    'forgot.verifyCode': 'Verify Code',
    'forgot.resetPassword': 'Reset Password',
    'forgot.codePlaceholder': '6-digit code',
    'forgot.newPasswordPlaceholder': 'New Password',
    'forgot.confirmPasswordPlaceholder': 'Confirm Password',
    'forgot.successMessage': 'Your password has been updated successfully.',
    
    // Thanks Screen
    'thanks.title': 'Thank You!',
    'thanks.defaultMessage': 'Action completed successfully!',
    'thanks.redirecting': 'Redirecting automatically in 5 seconds...',
    'thanks.continue': 'Continue Now',
    
    // Index Screen
    'index.slogan': 'Digital Solution\nfor Merchants',
    'index.getStarted': 'Get Started',
    
    // Global/Common
    'common.yes': 'Yes',
    'common.no': 'No',

    // Subscription Screen
    'subscription.title': 'Choose Your Plan',
    'subscription.basic': 'Basic Pack',
    'subscription.basicDesc': 'Essential features to get started.',
    'subscription.premium': 'Premium Pack',
    'subscription.premiumDesc': 'Advanced features for growing businesses.',
    'subscription.diamond': 'Diamond Pack',
    'subscription.diamondDesc': 'All features, unlimited access and priority support.',
    'subscription.select': 'Select Plan',
  },
  fr: {
    // Settings Screen
    'settings.title': 'Paramètres',
    'settings.loading': 'Chargement...',
    'settings.unknownUser': 'Utilisateur Inconnu',
    'settings.pauseNotifications': 'Mettre en pause les notifications',
    'settings.generalSettings': 'Paramètres généraux',
    'settings.darkMode': 'Mode sombre',
    'settings.language': 'Langue',
    'settings.mySubscription': 'Mon Abonnement',
    'settings.faq': 'FAQ',
    'settings.termsOfService': 'Conditions d\'utilisation',
    'settings.userPolicy': 'Politique utilisateur',
    'settings.logOut': 'Déconnexion',
    'settings.selectLanguage': 'Choisir la langue',
    'settings.cancel': 'Annuler',
    
    // Login Screen
    'login.welcomeBack': 'Bon retour',
    'login.signInSubtitle': 'Connectez-vous à votre compte',
    'login.emailPlaceholder': 'Adresse e-mail',
    'login.passwordPlaceholder': 'Mot de passe',
    'login.rememberMe': 'Se souvenir de moi',
    'login.forgotPassword': 'Mot de passe oublié ?',
    'login.connexion': 'Connexion',
    'login.or': 'ou',
    'login.continueWithGoogle': 'Continuer avec Google',
    'login.err.emptyFields': 'Veuillez entrer une adresse e-mail et un mot de passe.',
    'login.err.network': 'Impossible de se connecter au serveur. Assurez-vous que votre backend est en cours d\'exécution.',
    
    // Profile Screen
    'profile.title': 'Mon profil',
    'profile.followers': 'abonnés',
    'profile.following': 'abonnements',
    'profile.feed': 'Flux',
    'profile.challenge': 'Défi',
    'profile.badge': 'Badge',
    'profile.timeAgo': 'il y a 3h',
    'profile.caption': 'Paysage magnifique 😍🌱',

    // Edit Profile Screen
    'editProfile.title': 'Modifier le profil',
    'editProfile.changePhoto': 'Changer la photo de profil',
    'editProfile.firstName': 'Prénom',
    'editProfile.lastName': 'Nom',
    'editProfile.birthday': 'Date de naissance',
    'editProfile.phoneNumber': 'Numéro de téléphone',
    'editProfile.saveChanges': 'Enregistrer les modifications',
    
    // Confirm Dialog
    'confirm.discardTitle': 'Ignorer les modifications ?',
    'confirm.discardMessage': 'Vous avez des modifications non enregistrées. Voulez-vous vraiment les ignorer et quitter ?',
    'confirm.discard': 'Ignorer',
    'confirm.dontLeave': 'Ne pas quitter',
    
    // Forgot Password Screen
    'forgot.title1': 'Mot de passe oublié',
    'forgot.title2': 'Entrer le code',
    'forgot.title3': 'Nouveau mot de passe',
    'forgot.subtitle1': 'Entrez votre adresse e-mail pour recevoir un code de réinitialisation',
    'forgot.subtitle2': 'Entrez le code à 6 chiffres envoyé à votre adresse e-mail',
    'forgot.subtitle3': 'Créez un nouveau mot de passe fort',
    'forgot.sendCode': 'Envoyer le code',
    'forgot.verifyCode': 'Vérifier le code',
    'forgot.resetPassword': 'Réinitialiser le mot de passe',
    'forgot.codePlaceholder': 'Code à 6 chiffres',
    'forgot.newPasswordPlaceholder': 'Nouveau mot de passe',
    'forgot.confirmPasswordPlaceholder': 'Confirmer le mot de passe',
    'forgot.successMessage': 'Votre mot de passe a été mis à jour avec succès.',
    
    // Thanks Screen
    'thanks.title': 'Merci !',
    'thanks.defaultMessage': 'Action terminée avec succès !',
    'thanks.redirecting': 'Redirection automatique dans 5 secondes...',
    'thanks.continue': 'Continuer',
    
    // Index Screen
    'index.slogan': 'Solution Numérique\npour Commerçants',
    'index.getStarted': 'Commencer',
    
    // Global/Common
    'common.yes': 'Oui',
    'common.no': 'Non',
    
    // Subscription Screen
    'subscription.title': 'Choisissez votre forfait',
    'subscription.basic': 'Pack Basique',
    'subscription.basicDesc': 'Fonctionnalités essentielles pour commencer.',
    'subscription.premium': 'Pack Premium',
    'subscription.premiumDesc': 'Fonctionnalités avancées pour les entreprises en croissance.',
    'subscription.diamond': 'Pack Diamant',
    'subscription.diamondDesc': 'Toutes les fonctionnalités, accès illimité et support prioritaire.',
    'subscription.select': 'Sélectionner',
  },
  ar: {
    // Settings Screen
    'settings.title': 'الإعدادات',
    'settings.loading': 'جاري التحميل...',
    'settings.unknownUser': 'مستخدم غير معروف',
    'settings.pauseNotifications': 'إيقاف الإشعارات مؤقتاً',
    'settings.generalSettings': 'إعدادات عامة',
    'settings.darkMode': 'الوضع الداكن',
    'settings.language': 'اللغة',
    'settings.mySubscription': 'اشتراكي',
    'settings.faq': 'الأسئلة الشائعة',
    'settings.termsOfService': 'شروط الخدمة',
    'settings.userPolicy': 'سياسة المستخدم',
    'settings.logOut': 'تسجيل الخروج',
    'settings.selectLanguage': 'اختر اللغة',
    'settings.cancel': 'إلغاء',
    
    // Login Screen
    'login.welcomeBack': 'مرحباً بعودتك',
    'login.signInSubtitle': 'تسجيل الدخول إلى حسابك',
    'login.emailPlaceholder': 'البريد الإلكتروني',
    'login.passwordPlaceholder': 'كلمة المرور',
    'login.rememberMe': 'تذكرني',
    'login.forgotPassword': 'هل نسيت كلمة المرور؟',
    'login.connexion': 'تسجيل الدخول',
    'login.or': 'أو',
    'login.continueWithGoogle': 'المتابعة باستخدام Google',
    'login.err.emptyFields': 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
    'login.err.network': 'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم الخاص بك.',
    
    // Profile Screen
    'profile.title': 'ملفي الشخصي',
    'profile.followers': 'متابع',
    'profile.following': 'يتابع',
    'profile.feed': 'المنشورات',
    'profile.challenge': 'التحدي',
    'profile.badge': 'الشارة',
    'profile.timeAgo': 'منذ 3 ساعات',
    'profile.caption': 'منظر طبيعي جميل 😍🌱',

    // Edit Profile Screen
    'editProfile.title': 'تعديل الملف الشخصي',
    'editProfile.changePhoto': 'تغيير صورة الملف الشخصي',
    'editProfile.firstName': 'الاسم الأول',
    'editProfile.lastName': 'اسم العائلة',
    'editProfile.birthday': 'تاريخ الميلاد',
    'editProfile.phoneNumber': 'رقم الهاتف',
    'editProfile.saveChanges': 'حفظ التغييرات',
    
    // Confirm Dialog
    'confirm.discardTitle': 'تجاهل التغييرات؟',
    'confirm.discardMessage': 'لديك تغييرات غير محفوظة. هل أنت متأكد أنك تريد تجاهلها والمغادرة؟',
    'confirm.discard': 'تجاهل',
    'confirm.dontLeave': 'عدم المغادرة',
    
    // Forgot Password Screen
    'forgot.title1': 'هل نسيت كلمة المرور',
    'forgot.title2': 'أدخل الرمز',
    'forgot.title3': 'كلمة مرور جديدة',
    'forgot.subtitle1': 'أدخل بريدك الإلكتروني لتلقي رمز إعادة التعيين',
    'forgot.subtitle2': 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني',
    'forgot.subtitle3': 'قم بإنشاء كلمة مرور قوية جديدة',
    'forgot.sendCode': 'إرسال الرمز',
    'forgot.verifyCode': 'التحقق من الرمز',
    'forgot.resetPassword': 'إعادة تعيين كلمة المرور',
    'forgot.codePlaceholder': 'رمز من 6 أرقام',
    'forgot.newPasswordPlaceholder': 'كلمة مرور جديدة',
    'forgot.confirmPasswordPlaceholder': 'تأكيد كلمة المرور',
    'forgot.successMessage': 'تم تحديث كلمة المرور الخاصة بك بنجاح.',
    
    // Thanks Screen
    'thanks.title': 'شكراً لك!',
    'thanks.defaultMessage': 'اكتمل الإجراء بنجاح!',
    'thanks.redirecting': 'إعادة التوجيه تلقائياً خلال 5 ثوانٍ...',
    'thanks.continue': 'المتابعة الآن',
    
    // Index Screen
    'index.slogan': 'حل رقمي\nللتجار',
    'index.getStarted': 'ابدأ الآن',
    
    // Global/Common
    'common.yes': 'نعم',
    'common.no': 'لا',

    // Subscription Screen
    'subscription.title': 'اختر باقتك',
    'subscription.basic': 'الباقة الأساسية',
    'subscription.basicDesc': 'الميزات الأساسية للبدء.',
    'subscription.premium': 'الباقة المميزة',
    'subscription.premiumDesc': 'ميزات متقدمة للشركات المتنامية.',
    'subscription.diamond': 'الباقة الماسية',
    'subscription.diamondDesc': 'جميع الميزات، وصول غير محدود ودعم ذو أولوية.',
    'subscription.select': 'اختيار الباقة',
  }
};
