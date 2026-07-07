<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],

    'todopago' => [
        'base_url' => env('TODOPAGO_BASE_URL', 'https://test-api.todopago.hn'),
        'login_path' => env('TODOPAGO_LOGIN_PATH', '/login'),
        'payment_path' => env('TODOPAGO_PAYMENT_PATH', '/pay/v1/payment'),
        'account_list_path' => env('TODOPAGO_ACCOUNT_LIST_PATH', '/pay/v1/account-list'),
        'customer_register_path' => env('TODOPAGO_CUSTOMER_REGISTER_PATH', '/pay/v1/customer-register'),
        'account_register_path' => env('TODOPAGO_ACCOUNT_REGISTER_PATH', '/pay/v1/account-register'),
        'direct_payment_path' => env('TODOPAGO_DIRECT_PAYMENT_PATH', '/pay/v1/direct-payment-without-register'),
        'payment_reversal_path' => env('TODOPAGO_PAYMENT_REVERSAL_PATH', '/pay/v1/payment-reversal'),
        'user' => env('TODOPAGO_USER'),
        'password' => env('TODOPAGO_PASSWORD'),
        'user_type' => env('TODOPAGO_USER_TYPE', '2'),
        'version' => env('TODOPAGO_VERSION', ''),
        'commerce_id' => env('TODOPAGO_COMMERCE_ID'),
        'tenant' => env('TODOPAGO_TENANT'),
        'terminal' => env('TODOPAGO_TERMINAL'),
    ],

];
