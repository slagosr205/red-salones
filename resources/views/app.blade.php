<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name') }}</title>
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Red Pro Beauty — La red comercial de salones de belleza más grande de Honduras. Red de afiliación para profesionales de la belleza.">
        <meta name="keywords" content="salones de belleza, red comercial, afiliación, Honduras, Centroamérica, productos profesionales, estilistas, barberos, Red Pro Beauty">

        <meta property="og:site_name" content="Red Pro Beauty">
        <meta property="og:locale" content="es_HN">

        <link rel="canonical" href="{{ url()->current() }}">

        <link rel="icon" type="image/x-icon" href="/public/favicon.ico" />
        <link rel="shortcut icon" href="/public/favicon.ico" type="image/x-icon" />
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
