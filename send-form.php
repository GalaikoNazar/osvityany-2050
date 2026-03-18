<?php
// Вимкнути виведення помилок (щоб не ламати JSON)
error_reporting(0);
ini_set('display_errors', 0);

// ============================================
// НАЛАШТУВАННЯ
// ============================================
$adminEmail = 'nazarijgalajko@gmail.com';
$siteName = 'Освітяни 2050';

// Gmail SMTP налаштування
// Для роботи потрібно:
// 1. Увімкнути "Ненадійні додатки" в Google акаунті АБО
// 2. Створити "App Password" якщо увімкнена 2FA: https://myaccount.google.com/apppasswords
$smtpEmail = 'nazarijgalajko@gmail.com'; // Ваш Gmail
$smtpPassword = 'oelfapfwwmqjvyev'; // App Password (16 символів без пробілів)

// ============================================
// ОТРИМАННЯ ДАНИХ
// ============================================
header('Content-Type: application/json; charset=utf-8');

$name = isset($_POST['name']) ? htmlspecialchars(trim($_POST['name'])) : '';
$email = isset($_POST['email']) ? htmlspecialchars(trim($_POST['email'])) : '';
$phone = isset($_POST['phone']) ? htmlspecialchars(trim($_POST['phone'])) : '';
$organization = isset($_POST['organization']) ? htmlspecialchars(trim($_POST['organization'])) : '';
$package = isset($_POST['package']) ? htmlspecialchars(trim($_POST['package'])) : '';
$comment = isset($_POST['comment']) ? htmlspecialchars(trim($_POST['comment'])) : '';

// Назви пакетів
$packageNames = [
    'online' => 'ONLINE (3 000 грн)',
    'standard' => 'STANDARD (11 000 грн)',
    'vip' => 'VIP (20 000 грн)'
];
$packageName = isset($packageNames[$package]) ? $packageNames[$package] : $package;

// Перевірка обов'язкових полів
if (empty($name) || empty($email) || empty($phone) || empty($package)) {
    echo json_encode(['success' => false, 'message' => 'Заповніть всі обов\'язкові поля']);
    exit;
}

// Перевірка email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Невірний формат email']);
    exit;
}

// ============================================
// ФУНКЦІЯ ВІДПРАВКИ ЧЕРЕЗ GMAIL SMTP
// ============================================
function sendEmailSMTP($to, $subject, $message, $smtpEmail, $smtpPassword) {
    try {
        // Підключення до Gmail SMTP
        $smtp_server = 'smtp.gmail.com';
        $smtp_port = 587;

        $socket = @fsockopen($smtp_server, $smtp_port, $errno, $errstr, 30);
        if (!$socket) {
            return false;
        }

    // Читаємо відповідь сервера
    $response = fgets($socket, 515);

    // EHLO
    fputs($socket, "EHLO localhost\r\n");
    while ($line = fgets($socket, 515)) {
        if (substr($line, 3, 1) == ' ') break;
    }

    // STARTTLS
    fputs($socket, "STARTTLS\r\n");
    fgets($socket, 515);

    // Увімкнення шифрування
    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

    // EHLO знову після TLS
    fputs($socket, "EHLO localhost\r\n");
    while ($line = fgets($socket, 515)) {
        if (substr($line, 3, 1) == ' ') break;
    }

    // Авторизація
    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 515);

    fputs($socket, base64_encode($smtpEmail) . "\r\n");
    fgets($socket, 515);

    fputs($socket, base64_encode($smtpPassword) . "\r\n");
    $authResponse = fgets($socket, 515);

    if (substr($authResponse, 0, 3) != '235') {
        fclose($socket);
        return false;
    }

    // Відправник
    fputs($socket, "MAIL FROM:<$smtpEmail>\r\n");
    fgets($socket, 515);

    // Отримувач
    fputs($socket, "RCPT TO:<$to>\r\n");
    fgets($socket, 515);

    // Дані
    fputs($socket, "DATA\r\n");
    fgets($socket, 515);

    // Заголовки та тіло листа (Subject в UTF-8)
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = "From: $smtpEmail\r\n";
    $headers .= "To: $to\r\n";
    $headers .= "Subject: $encodedSubject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "\r\n";

    fputs($socket, $headers . $message . "\r\n.\r\n");
    fgets($socket, 515);

        // Завершення
        fputs($socket, "QUIT\r\n");
        fclose($socket);

        return true;
    } catch (Exception $e) {
        return false;
    }
}

// ============================================
// ШАБЛОН ЛИСТА ДЛЯ АДМІНІСТРАТОРА
// ============================================
$adminSubject = "Нова заявка на форум «$siteName»";
$adminMessage = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11DBAC, #0cb890); color: #000; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 15px; padding: 15px; background: #fff; border-radius: 8px; border-left: 4px solid #11DBAC; }
        .field-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .field-value { font-size: 16px; color: #333; }
        .package-badge { display: inline-block; background: #11DBAC; color: #000; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0;'>Нова заявка!</h1>
            <p style='margin:10px 0 0;'>Форум «$siteName»</p>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='field-label'>Ім'я та прізвище</div>
                <div class='field-value'>$name</div>
            </div>
            <div class='field'>
                <div class='field-label'>Email</div>
                <div class='field-value'><a href='mailto:$email'>$email</a></div>
            </div>
            <div class='field'>
                <div class='field-label'>Телефон</div>
                <div class='field-value'><a href='tel:$phone'>$phone</a></div>
            </div>
            <div class='field'>
                <div class='field-label'>Організація / Школа</div>
                <div class='field-value'>" . ($organization ? $organization : '—') . "</div>
            </div>
            <div class='field'>
                <div class='field-label'>Обраний пакет</div>
                <div class='field-value'><span class='package-badge'>$packageName</span></div>
            </div>
            " . ($comment ? "
            <div class='field'>
                <div class='field-label'>Коментар</div>
                <div class='field-value'>$comment</div>
            </div>
            " : "") . "
            <p style='margin-top: 20px; color: #666; font-size: 14px;'>
                Дата заявки: " . date('d.m.Y H:i') . "
            </p>
        </div>
    </div>
</body>
</html>
";

// ============================================
// ШАБЛОН ЛИСТА ДЛЯ КЛІЄНТА
// ============================================
$clientSubject = "Дякуємо за реєстрацію на форум «$siteName»!";
$clientMessage = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-body { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #11DBAC, #0cb890); color: #000; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0; opacity: 0.8; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .info-box { background: #f0fdf9; border: 1px solid #11DBAC; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .info-row { padding: 10px 0; border-bottom: 1px solid #e0f2ef; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #666; }
        .info-value { font-weight: bold; color: #333; float: right; }
        .package-highlight { background: #11DBAC; color: #000; padding: 15px 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
        .package-highlight .name { font-size: 24px; font-weight: bold; }
        .next-steps { background: #f9f9f9; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .next-steps h3 { margin: 0 0 15px; color: #333; }
        .next-steps ul { margin: 0; padding-left: 20px; }
        .next-steps li { margin-bottom: 10px; color: #555; }
        .footer { text-align: center; padding: 30px; background: #f9f9f9; }
        .footer p { margin: 5px 0; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-body'>
            <div class='header'>
                <h1>$siteName</h1>
                <p>Освітній форум для педагогів</p>
            </div>
            <div class='content'>
                <p class='greeting'>Вітаємо, <strong>$name</strong>!</p>

                <p>Дякуємо за реєстрацію на освітній форум <strong>«$siteName»</strong>! Ми раді, що ви приєднуєтесь до спільноти інноваційних педагогів.</p>

                <div class='package-highlight'>
                    <div class='name'>$packageName</div>
                </div>

                <div class='info-box'>
                    <h3 style='margin: 0 0 15px; color: #0cb890;'>Деталі події:</h3>
                    <div class='info-row'>
                        <span class='info-label'>Дата:</span>
                        <span class='info-value'>5-6 травня 2026</span>
                        <div style='clear:both;'></div>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Місце:</span>
                        <span class='info-value'>Буковель, Radisson Blu Resort</span>
                        <div style='clear:both;'></div>
                    </div>
                    <div class='info-row'>
                        <span class='info-label'>Формат:</span>
                        <span class='info-value'>2 дні офлайн</span>
                        <div style='clear:both;'></div>
                    </div>
                </div>

                <div class='next-steps'>
                    <h3>Що далі?</h3>
                    <ul>
                        <li>Наш менеджер зв'яжеться з вами найближчим часом для підтвердження участі</li>
                        <li>Ви отримаєте інструкції щодо оплати обраного пакету</li>
                        <li>Після оплати ви отримаєте офіційне підтвердження та додаткові матеріали</li>
                    </ul>
                </div>

                <p>Якщо у вас виникли питання, не соромтеся звертатися до нас!</p>

                <p style='margin-top: 30px;'>
                    З найкращими побажаннями,<br>
                    <strong>Команда «$siteName»</strong>
                </p>
            </div>
            <div class='footer'>
                <p><strong>$siteName</strong></p>
                <p>5-6 травня 2026 | Буковель, Radisson Blu Resort</p>
            </div>
        </div>
    </div>
</body>
</html>
";

// ============================================
// ВІДПРАВКА ЛИСТІВ
// ============================================
$adminSent = sendEmailSMTP($adminEmail, $adminSubject, $adminMessage, $smtpEmail, $smtpPassword);
$clientSent = sendEmailSMTP($email, $clientSubject, $clientMessage, $smtpEmail, $smtpPassword);

// Відповідь
if ($adminSent && $clientSent) {
    echo json_encode(['success' => true, 'message' => 'Заявку успішно надіслано!']);
} elseif ($adminSent || $clientSent) {
    echo json_encode(['success' => true, 'message' => 'Заявку надіслано (частково)']);
} else {
    // Якщо SMTP не працює, зберігаємо в файл
    $logFile = __DIR__ . '/registrations.log';
    $logData = date('Y-m-d H:i:s') . " | $name | $email | $phone | $organization | $packageName | $comment\n";
    file_put_contents($logFile, $logData, FILE_APPEND);

    echo json_encode(['success' => true, 'message' => 'Заявку отримано! (збережено локально)']);
}
?>
